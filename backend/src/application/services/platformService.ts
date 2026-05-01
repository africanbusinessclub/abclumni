import { PrismaClient } from "@prisma/client";
import { presentProfile } from "../../domain/services/profile";
import { sanitize, slugify } from "../../domain/services/text";
import type { ArticleInput, LoginInput, ProfileUpdateInput, RegisterInput, ResourceInput } from "../validation/schemas";
import type {
    IdGenerator,
    Notification,
    PasswordService,
    PresentedProfile,
    TokenService,
    User,
    UserRole,
    UserStatus
} from "../../domain/types";

type QueryInput = Record<string, unknown>;
type LoginContext = {
    ip: string;
    userAgent?: string;
};

function getQueryText(query: QueryInput, key: string, fallback = ""): string {
    const value = query[key];
    if (typeof value === "string") return sanitize(value);
    if (Array.isArray(value) && typeof value[0] === "string") return sanitize(value[0]);
    return fallback;
}

function getQueryNumber(query: QueryInput, key: string, fallback: number): number {
    const value = query[key];
    if (typeof value === "number") return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
}

function createPlatformService({
    db,
    tokenService,
    passwordService,
    idGenerator
}: {
    db: PrismaClient;
    tokenService: TokenService;
    passwordService: PasswordService;
    idGenerator: IdGenerator;
}) {
    async function createNotification(userId: string, type: string, message: string) {
        return db.notification.create({
            data: {
                id: idGenerator.newId(),
                userId,
                type,
                message
            }
        });
    }

    async function findActiveUserById(userId: string): Promise<User | null> {
        const user = await db.user.findFirst({
            where: { id: userId, status: "active" },
            include: { profile: true, loginHistory: { orderBy: { date: 'desc' }, take: 10 } }
        });
        if (!user) return null;
        return {
            ...user,
            acceptedTermsAt: user.acceptedTermsAt?.toISOString() || null,
            createdAt: user.createdAt.toISOString(),
            lastLoginAt: user.lastLoginAt?.toISOString() || null,
            profile: user.profile ? {
                ...user.profile,
                visibility: user.profile.visibility as any
            } : null as any,
            loginHistory: user.loginHistory.map((h: any) => ({
                ...h,
                date: h.date.toISOString()
            }))
        } as unknown as User;
    }

    async function register(payload: RegisterInput) {
        const email = payload.email.toLowerCase();
        const existing = await db.user.findUnique({ where: { email } });
        if (existing) throw new Error("EMAIL_EXISTS");

        const id = idGenerator.newId();
        const now = new Date();

        await db.user.create({
            data: {
                id,
                email,
                passwordHash: passwordService.hash(payload.password),
                role: "member",
                status: "active",
                acceptedTermsAt: now,
                profile: {
                    create: {
                        id: idGenerator.newId(),
                        firstName: sanitize(payload.firstName),
                        lastName: sanitize(payload.lastName),
                        promotion: sanitize(payload.promotion),
                        photo: "",
                        bio: "",
                        city: sanitize(payload.city),
                        position: sanitize(payload.position),
                        company: sanitize(payload.company),
                        sector: sanitize(payload.sector),
                        linkedin: sanitize(payload.linkedin),
                        phone: sanitize(payload.phone),
                        skills: payload.skills.map((item) => sanitize(item)).filter(Boolean),
                        interests: payload.interests.map((item) => sanitize(item)).filter(Boolean),
                        availability: payload.availability,
                        isMasked: false,
                        visibility: {
                            email: true,
                            linkedin: true,
                            phone: false,
                            city: true,
                            company: true,
                            position: true,
                            skills: true,
                            interests: true
                        }
                    }
                }
            }
        });

        await createNotification(id, "system", "Bienvenue sur la plateforme African Business Club.");
        await createNotification(id, "profile", "Complétez votre profil pour apparaître en tête des résultats.");

        const user = await findActiveUserById(id);
        if (!user) throw new Error("REGISTRATION_FAILED");

        return {
            token: tokenService.sign(user),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status,
                profile: presentProfile(user, user)
            }
        };
    }

    async function login(payload: LoginInput, context: LoginContext) {
        const userRec = await db.user.findUnique({ where: { email: payload.email.toLowerCase() } });
        if (!userRec || !passwordService.verify(payload.password, userRec.passwordHash)) {
            throw new Error("INVALID_CREDENTIALS");
        }

        const now = new Date();
        await db.user.update({
            where: { id: userRec.id },
            data: { lastLoginAt: now }
        });

        await db.loginHistory.create({
            data: {
                id: idGenerator.newId(),
                userId: userRec.id,
                date: now,
                ip: context.ip,
                userAgent: context.userAgent || "unknown"
            }
        });

        const user = await findActiveUserById(userRec.id);
        if (!user) throw new Error("INVALID_CREDENTIALS");

        return {
            token: tokenService.sign(user),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                status: user.status,
                profile: presentProfile(user, user)
            }
        };
    }

    async function getMe(userId: string) {
        const user = await findActiveUserById(userId);
        if (!user) throw new Error("INVALID_USER_SESSION");
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            profile: presentProfile(user, user),
            loginHistory: user.loginHistory
        };
    }

    async function updateMyProfile(userId: string, payload: ProfileUpdateInput) {
        const userRec = await db.user.findUnique({ where: { id: userId }, include: { profile: true } });
        if (!userRec || !userRec.profile) throw new Error("USER_NOT_FOUND");

        const updateData: any = {};
        let visibilityUpdate = userRec.profile.visibility as any;

        (Object.keys(payload) as Array<keyof ProfileUpdateInput>).forEach((key) => {
            const value = payload[key];
            if (typeof value === "undefined") return;

            if (key === "visibility" && value && typeof value === "object" && !Array.isArray(value)) {
                visibilityUpdate = { ...(visibilityUpdate || {}), ...value };
                updateData.visibility = visibilityUpdate;
            } else if (typeof value === "string") {
                updateData[key] = sanitize(value);
            } else {
                updateData[key] = value;
            }
        });

        await db.profile.update({
            where: { userId: userRec.id },
            data: updateData
        });

        await createNotification(userId, "profile", "Votre profil a été mis à jour.");

        const updatedUser = await findActiveUserById(userId);
        return { profile: presentProfile(updatedUser!, updatedUser!) };
    }

    async function deleteMyAccount(userId: string) {
        await db.user.delete({ where: { id: userId } });
        return { ok: true, message: "Compte et données associées supprimés." };
    }

    async function listAlumni(viewerId: string, query: QueryInput) {
        const viewer = await findActiveUserById(viewerId);
        if (!viewer) throw new Error("INVALID_USER_SESSION");

        const q = getQueryText(query, "q").toLowerCase();
        const promotion = getQueryText(query, "promotion");
        const sector = getQueryText(query, "sector").toLowerCase();
        const city = getQueryText(query, "city").toLowerCase();
        const availability = getQueryText(query, "availability");
        const sort = getQueryText(query, "sort", "relevance");
        const page = Math.max(getQueryNumber(query, "page", 1), 1);
        const pageSize = Math.min(Math.max(getQueryNumber(query, "pageSize", 12), 1), 50);

        const usersFromDb = await db.user.findMany({
            where: { status: "active" },
            include: { profile: true }
        });

        let alumni: Array<{ user: User; profile: PresentedProfile; score: number }> = usersFromDb
            .map((u: any) => {
                const userObj = {
                    ...u,
                    acceptedTermsAt: u.acceptedTermsAt?.toISOString() || null,
                    createdAt: u.createdAt.toISOString(),
                    lastLoginAt: u.lastLoginAt?.toISOString() || null,
                    profile: u.profile ? { ...u.profile, visibility: u.profile.visibility as any } : null as any,
                } as unknown as User;
                return { user: userObj, profile: presentProfile(userObj, viewer), score: 0 };
            })
            .filter((entry): entry is { user: User; profile: PresentedProfile; score: number } => entry.profile !== null);

        if (promotion) alumni = alumni.filter((entry) => entry.profile.promotion === promotion);
        if (sector) alumni = alumni.filter((entry) => (entry.profile.sector || "").toLowerCase().includes(sector));
        if (city) alumni = alumni.filter((entry) => (entry.profile.city || "").toLowerCase().includes(city));
        if (availability) alumni = alumni.filter((entry) => entry.profile.availability === availability);

        alumni = alumni.map((entry) => {
            const haystack = [
                entry.profile.fullName,
                entry.profile.company || "",
                entry.profile.position || "",
                entry.profile.sector || "",
                ...(entry.profile.skills || [])
            ]
                .join(" ")
                .toLowerCase();

            const score = q ? (haystack.includes(q) ? 1 + (entry.profile.fullName.toLowerCase().includes(q) ? 2 : 0) : 0) : 1;
            return { ...entry, score };
        });

        if (q) alumni = alumni.filter((entry) => entry.score > 0);

        alumni.sort((a, b) => {
            if (sort === "name") return a.profile.fullName.localeCompare(b.profile.fullName);
            if (sort === "promotion") return String(a.profile.promotion).localeCompare(String(b.profile.promotion));
            return b.score - a.score;
        });

        const total = alumni.length;
        const start = (page - 1) * pageSize;

        return {
            items: alumni.slice(start, start + pageSize).map((entry) => entry.profile),
            meta: { total, page, pageSize, pages: Math.ceil(total / pageSize) }
        };
    }

    async function getAlumni(viewerId: string, targetId: string) {
        const viewer = await findActiveUserById(viewerId);
        if (!viewer) throw new Error("INVALID_USER_SESSION");

        const target = await findActiveUserById(targetId);
        if (!target) throw new Error("PROFILE_NOT_FOUND");

        const profile = presentProfile(target, viewer);
        if (!profile) throw new Error("PROFILE_HIDDEN");

        if (viewer.id !== target.id) {
            await createNotification(target.id, "profile-view", `${viewer.profile.firstName} ${viewer.profile.lastName} a consulté votre profil.`);
        }

        return profile;
    }

    async function getArticle(id: string) {
        const article = await db.article.findUnique({ where: { id } });
        if (!article) throw new Error("ARTICLE_NOT_FOUND");
        return {
            ...article,
            publishedAt: article.publishedAt.toISOString(),
            createdAt: article.createdAt.toISOString()
        };
    }

    async function listArticles(query: QueryInput) {
        const q = getQueryText(query, "q").toLowerCase();
        const category = getQueryText(query, "category").toLowerCase();
        const tag = getQueryText(query, "tag").toLowerCase();

        const articlesFromDb = await db.article.findMany({
            orderBy: { publishedAt: "desc" }
        });

        let articles = articlesFromDb.map((a: any) => ({
            ...a,
            publishedAt: a.publishedAt.toISOString(),
            createdAt: a.createdAt.toISOString()
        }));

        if (q) {
            articles = articles.filter(
                (item) =>
                    item.title.toLowerCase().includes(q) ||
                    item.content.toLowerCase().includes(q) ||
                    item.tags.some((it: string) => it.toLowerCase().includes(q))
            );
        }
        if (category) articles = articles.filter((item) => item.category.toLowerCase().includes(category));
        if (tag) articles = articles.filter((item) => item.tags.some((it: string) => it.toLowerCase().includes(tag)));

        return {
            items: articles.map((item) => ({
                ...item,
                excerpt: item.content.slice(0, 190) + (item.content.length > 190 ? "..." : "")
            }))
        };
    }

    async function dashboard(userId: string) {
        const user = await findActiveUserById(userId);
        if (!user) throw new Error("INVALID_USER_SESSION");

        const latestArticlesFromDb = await db.article.findMany({
            orderBy: { publishedAt: "desc" },
            take: 3
        });
        const latestArticles = latestArticlesFromDb.map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            publishedAt: item.publishedAt.toISOString()
        }));

        const unreadCount = await db.notification.count({
            where: { userId: user.id, readAt: null, archivedAt: null }
        });

        const othersFromDb = await db.user.findMany({
            where: { status: "active", id: { not: user.id } },
            include: { profile: true }
        });

        const suggestions = othersFromDb
            .map((u: any) => ({
                ...u,
                acceptedTermsAt: u.acceptedTermsAt?.toISOString() || null,
                createdAt: u.createdAt.toISOString(),
                lastLoginAt: u.lastLoginAt?.toISOString() || null,
                profile: u.profile ? { ...u.profile, visibility: u.profile.visibility as any } : null as any,
            } as unknown as User))
            .filter((item) => item.profile.sector === user.profile.sector || item.profile.promotion === user.profile.promotion)
            .slice(0, 4)
            .map((item) => presentProfile(item, user))
            .filter((item): item is PresentedProfile => item !== null);

        return {
            latestArticles,
            unreadNotifications: unreadCount,
            suggestions
        };
    }

    async function listResources(userId: string) {
        const user = await findActiveUserById(userId);
        if (!user) throw new Error("INVALID_USER_SESSION");

        const resFromDb = await db.resource.findMany({
            orderBy: { createdAt: "desc" }
        });
        const resources = resFromDb.map((r: any) => ({
            ...r,
            createdAt: r.createdAt.toISOString()
        }));

        return { items: resources.filter((item) => !item.memberOnly || user.status === "active") };
    }

    async function listNotifications(userId: string) {
        const notesFromDb = await db.notification.findMany({
            where: { userId, archivedAt: null },
            orderBy: { createdAt: "desc" }
        });
        return {
            items: notesFromDb.map((n: any) => ({
                ...n,
                readAt: n.readAt?.toISOString() || null,
                archivedAt: n.archivedAt?.toISOString() || null,
                createdAt: n.createdAt.toISOString()
            }))
        };
    }

    async function markNotificationRead(userId: string, notificationId: string) {
        const item = await db.notification.findFirst({ where: { id: notificationId, userId } });
        if (!item) throw new Error("NOTIFICATION_NOT_FOUND");
        await db.notification.update({
            where: { id: item.id },
            data: { readAt: new Date() }
        });
        return { ok: true };
    }

    async function archiveNotification(userId: string, notificationId: string) {
        const item = await db.notification.findFirst({ where: { id: notificationId, userId } });
        if (!item) throw new Error("NOTIFICATION_NOT_FOUND");
        await db.notification.update({
            where: { id: item.id },
            data: { archivedAt: new Date() }
        });
        return { ok: true };
    }

    async function adminCreateArticle(adminUserId: string, payload: ArticleInput) {
        const admin = await findActiveUserById(adminUserId);
        if (!admin) throw new Error("INVALID_USER_SESSION");

        const articleData = {
            id: idGenerator.newId(),
            title: sanitize(payload.title),
            slug: slugify(payload.title),
            content: sanitize(payload.content),
            category: sanitize(payload.category),
            tags: payload.tags.map((item) => sanitize(item).toLowerCase()).filter(Boolean),
            coverImage: sanitize(payload.coverImage || ""),
            authorId: admin.id,
            publishedAt: new Date(),
            createdAt: new Date(),
            isUrgent: payload.urgent,
            views: 0
        };

        const article = await db.article.create({ data: articleData });

        const activeUsers = await db.user.findMany({ where: { status: "active" } });
        for (const u of activeUsers) {
            await createNotification(u.id, "news", `Nouvel article: ${article.title}`);
        }

        return { ok: true, article: { ...article, publishedAt: article.publishedAt.toISOString(), createdAt: article.createdAt.toISOString() } };
    }

    async function adminCreateResource(adminUserId: string, payload: ResourceInput) {
        const admin = await findActiveUserById(adminUserId);
        if (!admin) throw new Error("INVALID_USER_SESSION");

        const resourceData = {
            id: idGenerator.newId(),
            title: sanitize(payload.title),
            type: sanitize(payload.type),
            url: payload.url,
            description: sanitize(payload.description),
            memberOnly: payload.memberOnly,
            createdAt: new Date()
        };

        const resource = await db.resource.create({ data: resourceData });

        const activeUsers = await db.user.findMany({ where: { status: "active" } });
        for (const u of activeUsers) {
            await createNotification(u.id, "resource", `Nouvelle ressource: ${resource.title}`);
        }

        return { ok: true, resource: { ...resource, createdAt: resource.createdAt.toISOString() } };
    }

    async function adminUsers() {
        const usersFromDb = await db.user.findMany({ include: { profile: true } });
        return {
            items: usersFromDb.map((u: any) => {
                const userObj = {
                    ...u,
                    acceptedTermsAt: u.acceptedTermsAt?.toISOString() || null,
                    createdAt: u.createdAt.toISOString(),
                    lastLoginAt: u.lastLoginAt?.toISOString() || null,
                    profile: u.profile ? { ...u.profile, visibility: u.profile.visibility as any } : null as any,
                } as unknown as User;

                return {
                    id: userObj.id,
                    email: userObj.email,
                    role: userObj.role,
                    status: userObj.status,
                    createdAt: userObj.createdAt,
                    lastLoginAt: userObj.lastLoginAt,
                    profile: presentProfile(userObj, { id: "admin", role: "admin" } as User)
                };
            })
        };
    }

    async function adminUpdateStatus(userId: string, status: UserStatus) {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("USER_NOT_FOUND");
        await db.user.update({
            where: { id: userId },
            data: { status }
        });
        await createNotification(userId, "account", `Votre statut de compte est desormais: ${status}.`);
        return { ok: true, userId, status };
    }

    async function adminUpdateRole(userId: string, role: UserRole) {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("USER_NOT_FOUND");
        await db.user.update({
            where: { id: userId },
            data: { role }
        });
        await createNotification(userId, "account", `Votre role a ete modifie en: ${role}.`);
        return { ok: true, userId, role };
    }

    async function adminStats() {
        const activeMembers = await db.user.count({ where: { status: "active" } });
        const inactiveMembers = await db.user.count({ where: { status: "inactive" } });
        const pendingMembers = await db.user.count({ where: { status: "pending" } });

        const thirtyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
        const recentSignups = await db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } });

        const unreadNotifications = await db.notification.count({ where: { readAt: null, archivedAt: null } });

        const topArticlesDb = await db.article.findMany({
            orderBy: { views: "desc" },
            take: 5
        });
        const topArticles = topArticlesDb.map((item: any) => ({ id: item.id, title: item.title, views: item.views }));

        return { activeMembers, inactiveMembers, pendingMembers, recentSignups, unreadNotifications, topArticles };
    }

    async function exportUsersCsvRecords() {
        const usersFromDb = await db.user.findMany({ include: { profile: true } });
        return usersFromDb.map((u: any) => {
            const userObj = {
                ...u,
                acceptedTermsAt: u.acceptedTermsAt?.toISOString() || null,
                createdAt: u.createdAt.toISOString(),
                lastLoginAt: u.lastLoginAt?.toISOString() || null,
                profile: u.profile ? { ...u.profile, visibility: u.profile.visibility as any } : null as any,
            } as unknown as User;
            return {
                id: userObj.id,
                email: userObj.email,
                role: userObj.role,
                status: userObj.status,
                firstName: userObj.profile?.firstName || "",
                lastName: userObj.profile?.lastName || "",
                promotion: userObj.profile?.promotion || "",
                company: userObj.profile?.company || "",
                sector: userObj.profile?.sector || "",
                city: userObj.profile?.city || "",
                createdAt: userObj.createdAt,
                lastLoginAt: userObj.lastLoginAt || ""
            };
        });
    }

    async function getUserForAuth(userId: string): Promise<User | null> {
        return findActiveUserById(userId);
    }

    return {
        register,
        login,
        getMe,
        updateMyProfile,
        deleteMyAccount,
        listAlumni,
        getAlumni,
        listArticles,
        getArticle,
        dashboard,
        listResources,
        listNotifications,
        markNotificationRead,
        archiveNotification,
        adminCreateArticle,
        adminUsers,
        adminUpdateStatus,
        adminUpdateRole,
        adminStats,
        exportUsersCsvRecords,
        adminCreateResource,
        getUserForAuth
    };
}

export { createPlatformService };
export type PlatformService = ReturnType<typeof createPlatformService>;

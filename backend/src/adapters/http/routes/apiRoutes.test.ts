import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { createApiRouter } from "./apiRoutes";
import type { PlatformService } from "../../../application/services/platformService";
import type { AuthMiddleware } from "../middlewares/auth";
import type { User } from "../../../domain/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
    return {
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash",
        role: "member",
        status: "active",
        acceptedTermsAt: "2024-01-01T00:00:00.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
        lastLoginAt: null,
        loginHistory: [],
        profile: {
            firstName: "Alice",
            lastName: "Doe",
            promotion: "2020",
            photo: "",
            bio: "",
            city: "Paris",
            position: "Engineer",
            company: "Acme",
            sector: "Tech",
            linkedin: "",
            phone: "",
            skills: [],
            interests: [],
            availability: "networking",
            experience: "",
            profileType: "membre",
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
            },
            cv: ""
        },
        ...overrides
    };
}

const mockUser = makeUser();
const mockAdminUser = makeUser({ id: "admin-1", email: "admin@abc.local", role: "admin" });

// ─── Mock services ──────────────────────────────────────────────────────────

function makeMockPlatformService(): PlatformService {
    return {
        register: vi.fn(),
        login: vi.fn(),
        getMe: vi.fn(),
        getUserForAuth: vi.fn(),
        updateMyProfile: vi.fn(),
        deleteMyAccount: vi.fn(),
        listAlumni: vi.fn(),
        getAlumni: vi.fn(),
        listArticles: vi.fn(),
        getArticle: vi.fn(),
        dashboard: vi.fn(),
        listResources: vi.fn(),
        listEvents: vi.fn(),
        listNotifications: vi.fn(),
        markNotificationRead: vi.fn(),
        archiveNotification: vi.fn(),
        adminCreateArticle: vi.fn(),
        adminUpdateArticle: vi.fn(),
        adminDeleteArticle: vi.fn(),
        adminCreateResource: vi.fn(),
        adminDeleteResource: vi.fn(),
        adminListUsers: vi.fn(),
        adminUpdateUserStatus: vi.fn(),
        adminExportUsers: vi.fn(),
        adminCreateEvent: vi.fn(),
        adminDeleteEvent: vi.fn(),
    } as unknown as PlatformService;
}

function makeAuthMiddleware(user: User | null = mockUser): AuthMiddleware {
    const authRequired = (req: any, _res: any, next: any) => {
        if (!user) return _res.status(401).json({ error: "Authentification requise" });
        req.user = user;
        next();
    };
    const adminRequired = (req: any, res: any, next: any) => {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ error: "Accès administrateur requis" });
        }
        next();
    };
    return { authRequired, adminRequired } as AuthMiddleware;
}

function buildApp(service: PlatformService, authUser: User | null = mockUser) {
    const app = express();
    app.use(express.json());
    app.use(createApiRouter({ platformService: service, authMiddleware: makeAuthMiddleware(authUser) }));
    app.use(((err: any, _req: any, res: any, _next: any) => {
        res.status(500).json({ error: "Internal server error" });
    }) as express.ErrorRequestHandler);
    return app;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("GET /api/v1/health", () => {
    it("returns ok", async () => {
        const svc = makeMockPlatformService();
        const app = buildApp(svc);
        const res = await request(app).get("/api/v1/health");
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ ok: true, service: "abc-alumni-api" });
    });
});

describe("POST /api/v1/auth/register", () => {
    const validBody = {
        email: "new@example.com",
        password: "Password1",
        firstName: "New",
        lastName: "User",
        promotion: "2023",
        acceptedTerms: true,
        skills: [],
        interests: []
    };

    it("returns 201 with token on success", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.register).mockResolvedValue({ token: "tok", user: mockUser } as any);
        const app = buildApp(svc);
        const res = await request(app).post("/api/v1/auth/register").send(validBody);
        expect(res.status).toBe(201);
        expect(res.body.token).toBe("tok");
    });

    it("returns 400 for invalid payload", async () => {
        const svc = makeMockPlatformService();
        const app = buildApp(svc);
        const res = await request(app).post("/api/v1/auth/register").send({ email: "bad" });
        expect(res.status).toBe(400);
    });

    it("returns 409 when email is already taken", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.register).mockRejectedValue(new Error("EMAIL_EXISTS"));
        const app = buildApp(svc);
        const res = await request(app).post("/api/v1/auth/register").send(validBody);
        expect(res.status).toBe(409);
    });
});

describe("POST /api/v1/auth/login", () => {
    it("returns 200 with token on success", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.login).mockResolvedValue({ token: "tok", user: mockUser } as any);
        const app = buildApp(svc);
        const res = await request(app).post("/api/v1/auth/login").send({ email: "a@b.com", password: "pass" });
        expect(res.status).toBe(200);
        expect(res.body.token).toBe("tok");
    });

    it("returns 400 for missing fields", async () => {
        const svc = makeMockPlatformService();
        const app = buildApp(svc);
        const res = await request(app).post("/api/v1/auth/login").send({});
        expect(res.status).toBe(400);
    });

    it("returns 401 for wrong credentials", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.login).mockRejectedValue(new Error("INVALID_CREDENTIALS"));
        const app = buildApp(svc);
        const res = await request(app).post("/api/v1/auth/login").send({ email: "a@b.com", password: "wrong" });
        expect(res.status).toBe(401);
    });
});

describe("GET /api/v1/me", () => {
    it("returns current user profile", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.getMe).mockResolvedValue({ id: "user-1", email: "alice@example.com" } as any);
        const app = buildApp(svc);
        const res = await request(app).get("/api/v1/me").set("Authorization", "Bearer tok");
        expect(res.status).toBe(200);
        expect(res.body.id).toBe("user-1");
    });

    it("returns 401 without auth", async () => {
        const svc = makeMockPlatformService();
        const app = buildApp(svc, null);
        const res = await request(app).get("/api/v1/me");
        expect(res.status).toBe(401);
    });
});

describe("PUT /api/v1/me/profile", () => {
    it("returns updated profile", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.updateMyProfile).mockResolvedValue({ profile: {} } as any);
        const app = buildApp(svc);
        const res = await request(app).put("/api/v1/me/profile").send({ bio: "Updated bio" });
        expect(res.status).toBe(200);
    });

    it("returns 400 for invalid payload", async () => {
        const svc = makeMockPlatformService();
        const app = buildApp(svc);
        const res = await request(app).put("/api/v1/me/profile").send({ bio: "x".repeat(1001) });
        expect(res.status).toBe(400);
    });

    it("returns 404 when user not found", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.updateMyProfile).mockRejectedValue(new Error("USER_NOT_FOUND"));
        const app = buildApp(svc);
        const res = await request(app).put("/api/v1/me/profile").send({ bio: "hi" });
        expect(res.status).toBe(404);
    });
});

describe("GET /api/v1/alumni", () => {
    it("returns alumni list", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.listAlumni).mockResolvedValue({ items: [], meta: { total: 0, page: 1, pageSize: 12, pages: 0 } } as any);
        const app = buildApp(svc);
        const res = await request(app).get("/api/v1/alumni");
        expect(res.status).toBe(200);
        expect(res.body.items).toBeInstanceOf(Array);
    });
});

describe("GET /api/v1/alumni/:id", () => {
    it("returns profile for valid id", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.getAlumni).mockResolvedValue({ id: "user-2" } as any);
        const app = buildApp(svc);
        const res = await request(app).get("/api/v1/alumni/user-2");
        expect(res.status).toBe(200);
    });

    it("returns 404 for unknown profile", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.getAlumni).mockRejectedValue(new Error("PROFILE_NOT_FOUND"));
        const app = buildApp(svc);
        const res = await request(app).get("/api/v1/alumni/unknown");
        expect(res.status).toBe(404);
    });

    it("returns 404 for masked profile", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.getAlumni).mockRejectedValue(new Error("PROFILE_HIDDEN"));
        const app = buildApp(svc);
        const res = await request(app).get("/api/v1/alumni/masked");
        expect(res.status).toBe(404);
    });
});

describe("GET /api/v1/articles", () => {
    it("is publicly accessible", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.listArticles).mockResolvedValue({ items: [] } as any);
        const app = buildApp(svc, null);
        const res = await request(app).get("/api/v1/articles");
        expect(res.status).toBe(200);
    });
});

describe("GET /api/v1/articles/:id", () => {
    it("returns article", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.getArticle).mockResolvedValue({ id: "art-1", title: "Test" } as any);
        const app = buildApp(svc);
        const res = await request(app).get("/api/v1/articles/art-1");
        expect(res.status).toBe(200);
    });

    it("returns 404 for missing article", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.getArticle).mockRejectedValue(new Error("ARTICLE_NOT_FOUND"));
        const app = buildApp(svc);
        const res = await request(app).get("/api/v1/articles/missing");
        expect(res.status).toBe(404);
    });
});

describe("POST /api/v1/admin/articles", () => {
    const validArticle = {
        title: "Admin Article Title",
        content: "Content that is long enough here",
        category: "News",
        tags: []
    };

    it("returns 403 for non-admin user", async () => {
        const svc = makeMockPlatformService();
        const app = buildApp(svc, mockUser);
        const res = await request(app).post("/api/v1/admin/articles").send(validArticle);
        expect(res.status).toBe(403);
    });

    it("returns 201 for admin user", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.adminCreateArticle).mockResolvedValue({ id: "art-new" } as any);
        const app = buildApp(svc, mockAdminUser);
        const res = await request(app).post("/api/v1/admin/articles").send(validArticle);
        expect(res.status).toBe(201);
    });

    it("returns 400 for invalid article payload", async () => {
        const svc = makeMockPlatformService();
        const app = buildApp(svc, mockAdminUser);
        const res = await request(app).post("/api/v1/admin/articles").send({ title: "Hi" });
        expect(res.status).toBe(400);
    });
});

describe("GET /api/v1/notifications", () => {
    it("returns notification list", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.listNotifications).mockResolvedValue({ items: [] } as any);
        const app = buildApp(svc);
        const res = await request(app).get("/api/v1/notifications");
        expect(res.status).toBe(200);
        expect(res.body.items).toBeInstanceOf(Array);
    });
});

describe("PATCH /api/v1/notifications/:id/read", () => {
    it("marks notification as read", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.markNotificationRead).mockResolvedValue({ ok: true });
        const app = buildApp(svc);
        const res = await request(app).patch("/api/v1/notifications/n-1/read");
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
    });

    it("returns 404 for missing notification", async () => {
        const svc = makeMockPlatformService();
        vi.mocked(svc.markNotificationRead).mockRejectedValue(new Error("NOTIFICATION_NOT_FOUND"));
        const app = buildApp(svc);
        const res = await request(app).patch("/api/v1/notifications/missing/read");
        expect(res.status).toBe(404);
    });
});

import type { IdGenerator, PasswordService } from "../../domain/types";
import { PrismaClient } from "@prisma/client";

async function seedInitialData({
    db,
    idGenerator,
    passwordService
}: {
    db: PrismaClient;
    idGenerator: IdGenerator;
    passwordService: PasswordService;
}) {
    const userCount = await db.user.count();
    if (userCount > 0) {
        return;
    }

    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const memberPassword = process.env.SEED_MEMBER_PASSWORD;
    if (!adminPassword || !memberPassword) {
        throw new Error("SEED_ADMIN_PASSWORD and SEED_MEMBER_PASSWORD environment variables are required for initial seeding");
    }

    const adminId = idGenerator.newId();
    const memberId = idGenerator.newId();
    const now = new Date();

    await db.user.create({
        data: {
            id: adminId,
            email: "admin@abc.local",
            passwordHash: passwordService.hash(adminPassword),
            role: "admin",
            status: "active",
            acceptedTermsAt: now,
            createdAt: now,
            lastLoginAt: null,
            profile: {
                create: {
                    id: idGenerator.newId(),
                    firstName: "Aminata",
                    lastName: "Diallo",
                    promotion: "2018",
                    photo: "",
                    bio: "Administrative lead for ABC alumni platform.",
                    city: "Paris",
                    position: "Community Director",
                    company: "African Business Club",
                    sector: "Associatif",
                    linkedin: "",
                    phone: "",
                    skills: ["community", "governance"],
                    interests: ["mentoring"],
                    availability: "networking",
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

    await db.user.create({
        data: {
            id: memberId,
            email: "member@abc.local",
            passwordHash: passwordService.hash(memberPassword),
            role: "member",
            status: "active",
            acceptedTermsAt: now,
            createdAt: now,
            lastLoginAt: null,
            profile: {
                create: {
                    id: idGenerator.newId(),
                    firstName: "Kossi",
                    lastName: "Mensah",
                    promotion: "2021",
                    photo: "",
                    bio: "Consultant in strategy and innovation.",
                    city: "Lyon",
                    position: "Senior Consultant",
                    company: "Impact Partners",
                    sector: "Conseil",
                    linkedin: "https://linkedin.com/in/kossi",
                    phone: "+33-600-000-000",
                    skills: ["strategy", "finance"],
                    interests: ["impact", "entrepreneurship"],
                    availability: "mentoring",
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

    await db.article.createMany({
        data: [
            {
                id: idGenerator.newId(),
                title: "Bienvenue sur la plateforme Alumni ABC",
                slug: "bienvenue-plateforme-alumni-abc",
                content:
                    "La plateforme permet de trouver des alumni, partager des ressources et suivre la vie associative en un seul endroit.",
                category: "vie associative",
                tags: ["plateforme", "lancement"],
                coverImage: "",
                authorId: adminId,
                publishedAt: now,
                createdAt: now,
                isUrgent: false,
                views: 32
            },
            {
                id: idGenerator.newId(),
                title: "Ouverture du programme de mentorat",
                slug: "ouverture-programme-mentorat",
                content: "Le programme de mentorat met en relation les promotions recentes et les alumni seniors.",
                category: "carriere",
                tags: ["mentorat", "carriere"],
                coverImage: "",
                authorId: adminId,
                publishedAt: now,
                createdAt: now,
                isUrgent: true,
                views: 54
            }
        ]
    });

    await db.notification.createMany({
        data: [
            {
                id: idGenerator.newId(),
                userId: memberId,
                type: "news",
                message: "Nouvel article: Ouverture du programme de mentorat.",
                createdAt: now
            },
            {
                id: idGenerator.newId(),
                userId: memberId,
                type: "profile",
                message: "Pensez a mettre a jour vos competences pour augmenter votre visibilite.",
                createdAt: now
            },
            {
                id: idGenerator.newId(),
                userId: adminId,
                type: "system",
                message: "Le tableau de bord administrateur est pret.",
                createdAt: now
            }
        ]
    });
}

export { seedInitialData };

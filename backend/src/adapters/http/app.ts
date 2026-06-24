import "dotenv/config";
import cors, { type CorsOptions } from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import webpush from "web-push";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { seedInitialData } from "../../application/bootstrap/seedInitialData";
import { createPlatformService } from "../../application/services/platformService";
import { createIdGenerator } from "../../infrastructure/id/idGenerator";
import { createPasswordService } from "../../infrastructure/security/passwordService";
import { createTokenService } from "../../infrastructure/security/tokenService";
import { createAuthMiddleware } from "./middlewares/auth";
import { createApiRouter } from "./routes/apiRoutes";

function createApp() {
    const app = express();

    // Dynamic API responses should never be served from browser/proxy cache.
    app.set("etag", false);

    const port = Number(process.env.PORT || 4000);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET environment variable is required");
    }
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || `${jwtSecret}-refresh`;
    const defaultOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ];
    const corsOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((item) => item.trim()).filter(Boolean)
        : defaultOrigins;

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const db = new PrismaClient({ adapter });
    const tokenService = createTokenService({ secret: jwtSecret, refreshSecret: jwtRefreshSecret });
    const passwordService = createPasswordService({ rounds: 12 });
    const idGenerator = createIdGenerator();

    // Web Push / VAPID setup
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@abc.local";

    if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
        console.log("Web Push initialized with VAPID keys");
    } else {
        console.warn("VAPID keys not configured — push notifications disabled");
    }

    seedInitialData({ db, idGenerator, passwordService }).catch((err) => {
        console.error("Failed to seed initial data:", err);
    });

    const platformService = createPlatformService({ db, tokenService, passwordService, idGenerator });
    const authMiddleware = createAuthMiddleware({ tokenService, platformService });

    app.use(
        helmet({
            crossOriginResourcePolicy: false
        })
    );

    app.use(
        cors({
            origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
                if (!origin || corsOrigins.includes(origin)) {
                    return callback(null, true);
                }
                return callback(new Error("Not allowed by CORS"));
            },
            credentials: false
        } satisfies CorsOptions)
    );

    app.use(express.json({ limit: "1mb" }));
    app.use(morgan("dev"));

    // Serve uploaded files (event cover images, etc.)
    app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

    app.use("/api/v1", (_req, res, next) => {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        next();
    });

    app.use(createApiRouter({ platformService, authMiddleware }));

    // Ensure thrown domain errors are converted to a predictable API shape.
    const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
        if (err && err.message === "Not allowed by CORS") {
            return res.status(403).json({ error: "Not allowed by CORS" });
        }
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    };

    app.use(errorHandler);

    return { app, port };
}

export { createApp };

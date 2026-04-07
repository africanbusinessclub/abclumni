import "dotenv/config";
import cors, { type CorsOptions } from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
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

    const port = Number(process.env.PORT || 4000);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET environment variable is required");
    }
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
    const tokenService = createTokenService({ secret: jwtSecret });
    const passwordService = createPasswordService({ rounds: 12 });
    const idGenerator = createIdGenerator();

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

import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { PlatformService } from "../../../application/services/platformService";
import type { TokenService } from "../../../domain/types";

function createAuthMiddleware({ tokenService, platformService }: { tokenService: TokenService; platformService: PlatformService }) {
    async function authRequired(req: Request, res: Response, next: NextFunction) {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }

        try {
            const payload = tokenService.verify(token);
            const user = await platformService.getUserForAuth(payload.sub);
            if (!user) {
                return res.status(401).json({ error: "Invalid user session" });
            }
            req.user = user;
            return next();
        } catch (_err) {
            return res.status(401).json({ error: "Invalid token" });
        }
    }

    function adminRequired(req: Request, res: Response, next: NextFunction) {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }
        return next();
    }

    return {
        authRequired: authRequired as RequestHandler,
        adminRequired: adminRequired as RequestHandler
    };
}

export { createAuthMiddleware };
export type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

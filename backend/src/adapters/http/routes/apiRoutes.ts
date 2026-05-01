import express, { type Request, type Response } from "express";
import { stringify } from "csv-stringify/sync";
import rateLimit from "express-rate-limit";
import {
  articleSchema,
  loginSchema,
  profileUpdateSchema,
  registerSchema,
  resourceSchema,
} from "../../../application/validation/schemas";
import type { PlatformService } from "../../../application/services/platformService";
import type { AuthMiddleware } from "../middlewares/auth";

function hasErrorCode(error: unknown, code: string): boolean {
  return error instanceof Error && error.message === code;
}

function createApiRouter({
  platformService,
  authMiddleware,
}: {
  platformService: PlatformService;
  authMiddleware: AuthMiddleware;
}) {
  const router = express.Router();

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de tentatives. Réessayez plus tard." },
  });

  router.get("/api/v1/health", async (_req: Request, res: Response) => {
    res.json({ ok: true, service: "abc-alumni-api" });
  });

  router.post(
    "/api/v1/auth/register",
    authLimiter,
    async (req: Request, res: Response) => {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error: "Données d'inscription invalides",
            issues: parsed.error.issues,
          });
      }

      try {
        return res
          .status(201)
          .json(await platformService.register(parsed.data));
      } catch (error) {
        if (hasErrorCode(error, "EMAIL_EXISTS")) {
          return res.status(409).json({ error: "Cette adresse e-mail est déjà utilisée" });
        }
        throw error;
      }
    },
  );

  router.post(
    "/api/v1/auth/login",
    authLimiter,
    async (req: Request, res: Response) => {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Données de connexion invalides" });
      }

      try {
        const userAgentHeader = req.headers["user-agent"];
        return res.json(
          await platformService.login(parsed.data, {
            ip: req.ip || "unknown",
            userAgent:
              typeof userAgentHeader === "string" ? userAgentHeader : "unknown",
          }),
        );
      } catch (error) {
        if (hasErrorCode(error, "INVALID_CREDENTIALS")) {
          return res.status(401).json({ error: "Identifiants incorrects" });
        }
        throw error;
      }
    },
  );

  router.get(
    "/api/v1/me",
    authMiddleware.authRequired,
    async (req: Request, res: Response) => {
      return res.json(await platformService.getMe(req.user!.id));
    },
  );

  router.put(
    "/api/v1/me/profile",
    authMiddleware.authRequired,
    async (req: Request, res: Response) => {
      const parsed = profileUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error: "Données de profil invalides",
            issues: parsed.error.issues,
          });
      }

      try {
        return res.json(
          await platformService.updateMyProfile(req.user!.id, parsed.data),
        );
      } catch (error) {
        if (hasErrorCode(error, "USER_NOT_FOUND")) {
          return res.status(404).json({ error: "Utilisateur introuvable" });
        }
        throw error;
      }
    },
  );

  router.delete(
    "/api/v1/me",
    authMiddleware.authRequired,
    async (req: Request, res: Response) => {
      return res.json(await platformService.deleteMyAccount(req.user!.id));
    },
  );

  router.get(
    "/api/v1/alumni",
    authMiddleware.authRequired,
    async (req: Request, res: Response) => {
      return res.json(
        await platformService.listAlumni(
          req.user!.id,
          req.query as Record<string, unknown>,
        ),
      );
    },
  );

  router.get(
    "/api/v1/alumni/:id",
    authMiddleware.authRequired,
    async (req: Request, res: Response) => {
      try {
        return res.json(
          await platformService.getAlumni(req.user!.id, String(req.params.id)),
        );
      } catch (error) {
        if (hasErrorCode(error, "PROFILE_NOT_FOUND"))
          return res.status(404).json({ error: "Profil introuvable" });
        if (hasErrorCode(error, "PROFILE_HIDDEN"))
          return res.status(404).json({ error: "Profil masqué par l'utilisateur" });
        throw error;
      }
    },
  );

  router.get("/api/v1/articles", async (req: Request, res: Response) => {
    return res.json(
      await platformService.listArticles(req.query as Record<string, unknown>),
    );
  });

  router.get(
    "/api/v1/articles/:id",
    authMiddleware.authRequired,
    async (req: Request, res: Response) => {
      try {
        return res.json(await platformService.getArticle(req.params['id'] as string));
      } catch (error) {
        if (hasErrorCode(error, "ARTICLE_NOT_FOUND")) {
          return res.status(404).json({ error: "Article introuvable" });
        }
        throw error;
      }
    },
  );

  router.get(
    "/api/v1/dashboard",
    authMiddleware.authRequired,
    async (req: Request, res: Response) => {
      return res.json(await platformService.dashboard(req.user!.id));
    },
  );

  router.get(
    "/api/v1/resources",
    authMiddleware.authRequired,
    async (req: Request, res: Response) => {
      return res.json(await platformService.listResources(req.user!.id));
    },
  );

  router.get(
    "/api/v1/notifications",
    authMiddleware.authRequired,
    async (req: Request, res: Response) => {
      return res.json(await platformService.listNotifications(req.user!.id));
    },
  );

  router.patch(
    "/api/v1/notifications/:id/read",
    authMiddleware.authRequired,
    async (req: Request, res: Response) => {
      try {
        return res.json(
          await platformService.markNotificationRead(
            req.user!.id,
            String(req.params.id),
          ),
        );
      } catch (error) {
        if (hasErrorCode(error, "NOTIFICATION_NOT_FOUND"))
          return res.status(404).json({ error: "Notification introuvable" });
        throw error;
      }
    },
  );

  router.patch(
    "/api/v1/notifications/:id/archive",
    authMiddleware.authRequired,
    async (req: Request, res: Response) => {
      try {
        return res.json(
          await platformService.archiveNotification(
            req.user!.id,
            String(req.params.id),
          ),
        );
      } catch (error) {
        if (hasErrorCode(error, "NOTIFICATION_NOT_FOUND"))
          return res.status(404).json({ error: "Notification introuvable" });
        throw error;
      }
    },
  );

  router.post(
    "/api/v1/admin/articles",
    authMiddleware.authRequired,
    authMiddleware.adminRequired,
    async (req: Request, res: Response) => {
      const parsed = articleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error: "Données d'article invalides",
            issues: parsed.error.issues,
          });
      }

      return res
        .status(201)
        .json(
          await platformService.adminCreateArticle(req.user!.id, parsed.data),
        );
    },
  );

  router.post(
    "/api/v1/admin/resources",
    authMiddleware.authRequired,
    authMiddleware.adminRequired,
    async (req: Request, res: Response) => {
      const parsed = resourceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error: "Données de ressource invalides",
            issues: parsed.error.issues,
          });
      }

      return res
        .status(201)
        .json(
          await platformService.adminCreateResource(req.user!.id, parsed.data),
        );
    },
  );

  router.get(
    "/api/v1/admin/users",
    authMiddleware.authRequired,
    authMiddleware.adminRequired,
    async (_req: Request, res: Response) => {
      return res.json(await platformService.adminUsers());
    },
  );

  router.patch(
    "/api/v1/admin/users/:id/status",
    authMiddleware.authRequired,
    authMiddleware.adminRequired,
    async (req: Request, res: Response) => {
      const status = String(req.body.status || "").toLowerCase();
      if (!["active", "inactive", "pending"].includes(status)) {
        return res.status(400).json({ error: "Statut invalide" });
      }

      try {
        return res.json(
          await platformService.adminUpdateStatus(
            String(req.params.id),
            status as "active" | "inactive" | "pending",
          ),
        );
      } catch (error) {
        if (hasErrorCode(error, "USER_NOT_FOUND"))
          return res.status(404).json({ error: "Utilisateur introuvable" });
        throw error;
      }
    },
  );

  router.patch(
    "/api/v1/admin/users/:id/role",
    authMiddleware.authRequired,
    authMiddleware.adminRequired,
    async (req: Request, res: Response) => {
      const role = String(req.body.role || "").toLowerCase();
      if (!["member", "moderator", "admin"].includes(role)) {
        return res.status(400).json({ error: "Rôle invalide" });
      }

      try {
        return res.json(
          await platformService.adminUpdateRole(
            String(req.params.id),
            role as "member" | "moderator" | "admin",
          ),
        );
      } catch (error) {
        if (hasErrorCode(error, "USER_NOT_FOUND"))
          return res.status(404).json({ error: "Utilisateur introuvable" });
        throw error;
      }
    },
  );

  router.get(
    "/api/v1/admin/users/export.csv",
    authMiddleware.authRequired,
    authMiddleware.adminRequired,
    async (_req: Request, res: Response) => {
      const csv = stringify(await platformService.exportUsersCsvRecords(), {
        header: true,
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="members.csv"',
      );
      return res.send(csv);
    },
  );

  router.get(
    "/api/v1/admin/stats",
    authMiddleware.authRequired,
    authMiddleware.adminRequired,
    async (_req: Request, res: Response) => {
      return res.json(await platformService.adminStats());
    },
  );

  return router;
}

export { createApiRouter };

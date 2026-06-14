import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { RefreshTokenPayload, TokenPayload, TokenService, User } from "../../domain/types";

function createTokenService({
    secret,
    refreshSecret,
    expiresIn = "8h",
    refreshExpiresIn = "30d"
}: {
    secret: string;
    refreshSecret: string;
    expiresIn?: SignOptions["expiresIn"];
    refreshExpiresIn?: SignOptions["expiresIn"];
}): TokenService {
    return {
        sign(user: Pick<User, "id" | "role" | "email">): string {
            return jwt.sign(
                { sub: user.id, role: user.role, email: user.email, type: "access" },
                secret,
                { expiresIn }
            );
        },
        verify(token: string): TokenPayload {
            const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
            if (typeof payload === "string") {
                throw new Error("INVALID_TOKEN_PAYLOAD");
            }

            const typed = payload as JwtPayload & Partial<TokenPayload>;
            if (typeof typed.sub !== "string" || typeof typed.role !== "string" || typeof typed.email !== "string") {
                throw new Error("INVALID_TOKEN_PAYLOAD");
            }

            return {
                sub: typed.sub,
                role: typed.role as TokenPayload["role"],
                email: typed.email
            };
        },
        signRefresh(user: Pick<User, "id">): string {
            return jwt.sign(
                { sub: user.id, type: "refresh" },
                refreshSecret,
                { expiresIn: refreshExpiresIn }
            );
        },
        verifyRefresh(token: string): RefreshTokenPayload {
            const payload = jwt.verify(token, refreshSecret, { algorithms: ["HS256"] });
            if (typeof payload === "string") {
                throw new Error("INVALID_REFRESH_TOKEN");
            }

            const typed = payload as JwtPayload;
            if (typeof typed.sub !== "string") {
                throw new Error("INVALID_REFRESH_TOKEN");
            }

            return { sub: typed.sub };
        }
    };
}

export { createTokenService };

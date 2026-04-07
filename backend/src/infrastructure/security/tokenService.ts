import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { TokenPayload, TokenService, User } from "../../domain/types";

function createTokenService({ secret, expiresIn = "8h" }: { secret: string; expiresIn?: SignOptions["expiresIn"] }): TokenService {
    return {
        sign(user: Pick<User, "id" | "role" | "email">): string {
            return jwt.sign({ sub: user.id, role: user.role, email: user.email }, secret, { expiresIn });
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
        }
    };
}

export { createTokenService };

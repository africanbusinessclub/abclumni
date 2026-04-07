import type { User } from "../../domain/types";

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export { };
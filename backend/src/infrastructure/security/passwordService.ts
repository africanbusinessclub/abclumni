import bcrypt from "bcryptjs";
import type { PasswordService } from "../../domain/types";

function createPasswordService({ rounds = 12 }: { rounds?: number } = {}): PasswordService {
    return {
        hash(password: string): string {
            return bcrypt.hashSync(password, rounds);
        },
        verify(password: string, hash: string): boolean {
            return bcrypt.compareSync(password, hash);
        }
    };
}

export { createPasswordService };

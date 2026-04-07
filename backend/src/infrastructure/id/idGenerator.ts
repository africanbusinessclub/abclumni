import { v4 as uuidv4 } from "uuid";
import type { IdGenerator } from "../../domain/types";

function createIdGenerator(): IdGenerator {
    return {
        newId(): string {
            return uuidv4();
        }
    };
}

export { createIdGenerator };

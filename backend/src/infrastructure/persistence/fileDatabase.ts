import fs from "fs";
import type { DatabaseState, FileDatabase } from "../../domain/types";

function createFileDatabase({ filePath }: { filePath: string }): FileDatabase {
    function read(): DatabaseState {
        const raw = fs.readFileSync(filePath, "utf8");
        return JSON.parse(raw) as DatabaseState;
    }

    function write(db: DatabaseState): void {
        fs.writeFileSync(filePath, JSON.stringify(db, null, 2), "utf8");
    }

    function withWrite<T>(mutator: (db: DatabaseState) => T): T {
        const db = read();
        const result = mutator(db);
        write(db);
        return result;
    }

    return {
        read,
        write,
        withWrite
    };
}

export { createFileDatabase };

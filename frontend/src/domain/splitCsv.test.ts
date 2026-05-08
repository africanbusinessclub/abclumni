import { describe, it, expect } from "vitest";
import { splitCsv } from "./splitCsv";

describe("splitCsv", () => {
    it("splits comma-separated values", () => {
        expect(splitCsv("a,b,c")).toEqual(["a", "b", "c"]);
    });

    it("trims whitespace from each item", () => {
        expect(splitCsv(" a , b , c ")).toEqual(["a", "b", "c"]);
    });

    it("filters empty segments", () => {
        expect(splitCsv("a,,b")).toEqual(["a", "b"]);
    });

    it("returns empty array for empty string", () => {
        expect(splitCsv("")).toEqual([]);
    });

    it("returns single item array with no comma", () => {
        expect(splitCsv("TypeScript")).toEqual(["TypeScript"]);
    });
});

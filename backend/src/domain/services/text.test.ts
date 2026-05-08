import { describe, it, expect } from "vitest";
import { sanitize, slugify } from "../../domain/services/text";

describe("sanitize", () => {
    it("trims whitespace", () => {
        expect(sanitize("  hello  ")).toBe("hello");
    });

    it("returns empty string for non-string input", () => {
        expect(sanitize(null)).toBe("");
        expect(sanitize(undefined)).toBe("");
        expect(sanitize(42)).toBe("");
    });

    it("returns original string unchanged when no trim needed", () => {
        expect(sanitize("hello world")).toBe("hello world");
    });
});

describe("slugify", () => {
    it("lowercases and replaces spaces with hyphens", () => {
        expect(slugify("Hello World")).toBe("hello-world");
    });

    it("removes leading and trailing hyphens", () => {
        expect(slugify("  hello  ")).toBe("hello");
    });

    it("replaces non-alphanumeric characters", () => {
        expect(slugify("African Business Club: Alumni 2024!")).toBe(
            "african-business-club-alumni-2024"
        );
    });

    it("collapses multiple special chars into one hyphen", () => {
        expect(slugify("foo & bar -- baz")).toBe("foo-bar-baz");
    });

    it("returns empty string for empty input", () => {
        expect(slugify("")).toBe("");
    });
});

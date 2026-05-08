import { describe, it, expect, vi } from "vitest";
import { getApiErrorMessage } from "./httpError";

// Minimal AxiosError factory (avoids importing axios in tests)
function makeAxiosError(responseData?: unknown, status = 400) {
    const error = new Error("Request failed") as any;
    error.isAxiosError = true;
    if (responseData !== undefined) {
        error.response = { status, data: responseData };
    }
    return error;
}

vi.mock("axios", () => ({
    default: {
        isAxiosError: (e: unknown) => e != null && !!(e as any).isAxiosError
    },
    isAxiosError: (e: unknown) => e != null && !!(e as any).isAxiosError
}));

describe("getApiErrorMessage", () => {
    it("returns fallback for non-axios errors", () => {
        expect(getApiErrorMessage(new Error("boom"), "fallback")).toBe("fallback");
    });

    it("returns fallback for non-Error values", () => {
        expect(getApiErrorMessage(null, "fallback")).toBe("fallback");
    });

    it("returns data.error for simple axios error", () => {
        const err = makeAxiosError({ error: "Email déjà utilisé" });
        expect(getApiErrorMessage(err, "fallback")).toBe("Email déjà utilisé");
    });

    it("returns fallback when response has no data.error", () => {
        const err = makeAxiosError({});
        expect(getApiErrorMessage(err, "fallback")).toBe("fallback");
    });

    it("returns formatted issue message when issues are present", () => {
        const err = makeAxiosError({
            error: "Données invalides",
            issues: [{ path: ["email"], message: "Invalid email" }]
        });
        const result = getApiErrorMessage(err, "fallback");
        expect(result).toContain("Invalid email");
    });

    it("returns fallback when no response (network error)", () => {
        const err = makeAxiosError(undefined);
        expect(getApiErrorMessage(err, "network error")).toBe("network error");
    });
});

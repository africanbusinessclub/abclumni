import { describe, it, expect } from "vitest";
import {
    registerSchema,
    loginSchema,
    profileUpdateSchema,
    articleSchema,
    resourceSchema,
    eventSchema
} from "../../application/validation/schemas";

const validRegister = {
    email: "alice@example.com",
    password: "Password1",
    firstName: "Alice",
    lastName: "Doe",
    promotion: "2020",
    acceptedTerms: true,
    skills: [],
    interests: []
};

describe("registerSchema", () => {
    it("accepts valid registration data", () => {
        expect(registerSchema.safeParse(validRegister).success).toBe(true);
    });

    it("rejects invalid email", () => {
        const result = registerSchema.safeParse({ ...validRegister, email: "not-an-email" });
        expect(result.success).toBe(false);
    });

    it("rejects weak password (no uppercase)", () => {
        const result = registerSchema.safeParse({ ...validRegister, password: "password1" });
        expect(result.success).toBe(false);
    });

    it("rejects weak password (no digit)", () => {
        const result = registerSchema.safeParse({ ...validRegister, password: "Password" });
        expect(result.success).toBe(false);
    });

    it("rejects weak password (too short)", () => {
        const result = registerSchema.safeParse({ ...validRegister, password: "P1" });
        expect(result.success).toBe(false);
    });

    it("rejects when acceptedTerms is false", () => {
        const result = registerSchema.safeParse({ ...validRegister, acceptedTerms: false });
        expect(result.success).toBe(false);
    });

    it("rejects missing firstName", () => {
        const { firstName: _, ...rest } = validRegister;
        expect(registerSchema.safeParse(rest).success).toBe(false);
    });

    it("applies defaults for optional fields", () => {
        const result = registerSchema.safeParse(validRegister);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.company).toBe("");
            expect(result.data.skills).toEqual([]);
            expect(result.data.availability).toBe("none");
        }
    });
});

describe("loginSchema", () => {
    it("accepts valid credentials", () => {
        expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
    });

    it("rejects empty password", () => {
        expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
    });

    it("rejects invalid email", () => {
        expect(loginSchema.safeParse({ email: "bad", password: "pw" }).success).toBe(false);
    });
});

describe("profileUpdateSchema", () => {
    it("accepts partial updates", () => {
        expect(profileUpdateSchema.safeParse({ bio: "Updated bio" }).success).toBe(true);
    });

    it("rejects bio exceeding 1000 chars", () => {
        const result = profileUpdateSchema.safeParse({ bio: "x".repeat(1001) });
        expect(result.success).toBe(false);
    });

    it("accepts valid availability enum", () => {
        expect(profileUpdateSchema.safeParse({ availability: "mentoring" }).success).toBe(true);
    });

    it("rejects invalid availability value", () => {
        expect(profileUpdateSchema.safeParse({ availability: "invalid" }).success).toBe(false);
    });

    it("accepts visibility object", () => {
        const result = profileUpdateSchema.safeParse({ visibility: { email: false } });
        expect(result.success).toBe(true);
    });
});

describe("articleSchema", () => {
    const validArticle = { title: "Hello World", content: "Content here ok", category: "News", tags: [] };

    it("accepts valid article", () => {
        expect(articleSchema.safeParse(validArticle).success).toBe(true);
    });

    it("rejects short title", () => {
        expect(articleSchema.safeParse({ ...validArticle, title: "Hi" }).success).toBe(false);
    });

    it("rejects short content", () => {
        expect(articleSchema.safeParse({ ...validArticle, content: "Short" }).success).toBe(false);
    });
});

describe("resourceSchema", () => {
    const validResource = {
        title: "Great Resource",
        type: "doc",
        url: "https://example.com/resource",
        description: ""
    };

    it("accepts valid resource", () => {
        expect(resourceSchema.safeParse(validResource).success).toBe(true);
    });

    it("rejects invalid URL", () => {
        expect(resourceSchema.safeParse({ ...validResource, url: "not-a-url" }).success).toBe(false);
    });
});

describe("eventSchema", () => {
    const validEvent = { title: "Annual Meeting", url: "https://example.com/event" };

    it("accepts valid event", () => {
        expect(eventSchema.safeParse(validEvent).success).toBe(true);
    });

    it("rejects short title", () => {
        expect(eventSchema.safeParse({ ...validEvent, title: "Hi" }).success).toBe(false);
    });

    it("rejects invalid URL", () => {
        expect(eventSchema.safeParse({ ...validEvent, url: "bad-url" }).success).toBe(false);
    });
});

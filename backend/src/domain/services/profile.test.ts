import { describe, it, expect } from "vitest";
import { presentProfile } from "../../domain/services/profile";
import type { User } from "../../domain/types";

function makeUser(overrides: Partial<User> = {}): User {
    return {
        id: "user-1",
        email: "alice@example.com",
        passwordHash: "hash",
        role: "member",
        status: "active",
        acceptedTermsAt: "2024-01-01T00:00:00.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
        lastLoginAt: null,
        loginHistory: [],
        profile: {
            firstName: "Alice",
            lastName: "Doe",
            promotion: "2020",
            photo: "",
            bio: "Bio text",
            city: "Paris",
            position: "Engineer",
            company: "Acme",
            sector: "Tech",
            linkedin: "https://linkedin.com/in/alice",
            phone: "+33600000000",
            skills: ["TypeScript", "React"],
            interests: ["Entrepreneurship"],
            availability: "networking",
            experience: "",
            isMasked: false,
            visibility: {
                email: true,
                linkedin: true,
                phone: false,
                city: true,
                company: true,
                position: true,
                skills: true,
                interests: true
            }
        },
        ...overrides
    };
}

const member = makeUser();
const otherMember = makeUser({ id: "user-2", email: "bob@example.com" });
const admin = makeUser({ id: "admin-1", role: "admin" });

describe("presentProfile – visibility rules", () => {
    it("returns full profile for owner", () => {
        const result = presentProfile(member, member);
        expect(result).not.toBeNull();
        expect(result!.email).toBe("alice@example.com");
        expect(result!.phone).toBe("+33600000000");
        expect(result!.visibility).toBeDefined();
    });

    it("hides phone for other members when visibility.phone is false", () => {
        const result = presentProfile(member, otherMember);
        expect(result).not.toBeNull();
        expect(result!.phone).toBeNull();
    });

    it("shows phone for admin even when visibility.phone is false", () => {
        const result = presentProfile(member, admin);
        expect(result).not.toBeNull();
        expect(result!.phone).toBe("+33600000000");
    });

    it("returns null for masked profiles (non-owner, non-admin)", () => {
        const masked = makeUser({ profile: { ...member.profile, isMasked: true } });
        expect(presentProfile(masked, otherMember)).toBeNull();
    });

    it("returns masked profile for owner", () => {
        const masked = makeUser({ profile: { ...member.profile, isMasked: true } });
        expect(presentProfile(masked, masked)).not.toBeNull();
    });

    it("returns masked profile for admin", () => {
        const masked = makeUser({ profile: { ...member.profile, isMasked: true } });
        expect(presentProfile(masked, admin)).not.toBeNull();
    });

    it("builds fullName correctly", () => {
        const result = presentProfile(member, member);
        expect(result!.fullName).toBe("Alice Doe");
    });

    it("does not expose visibility object to other members", () => {
        const result = presentProfile(member, otherMember);
        expect(result!.visibility).toBeUndefined();
    });
});

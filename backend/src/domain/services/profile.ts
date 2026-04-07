import type { PresentedProfile, User } from "../types";

function presentProfile(user: User, viewer: Pick<User, "id" | "role"> | null | undefined): PresentedProfile | null {
    const profile = user.profile;
    const isOwner = viewer && viewer.id === user.id;
    const isAdmin = viewer && viewer.role === "admin";

    if (profile.isMasked && !isOwner && !isAdmin) {
        return null;
    }

    const field = <T>(name: keyof typeof profile.visibility, value: T): T | null => {
        if (isOwner || isAdmin) {
            return value;
        }
        if (profile.visibility && profile.visibility[name] === false) {
            return null;
        }
        return value;
    };

    return {
        id: user.id,
        role: user.role,
        status: user.status,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: `${profile.firstName} ${profile.lastName}`.trim(),
        promotion: profile.promotion,
        photo: profile.photo,
        bio: profile.bio,
        city: field("city", profile.city),
        position: field("position", profile.position),
        company: field("company", profile.company),
        sector: profile.sector,
        linkedin: field("linkedin", profile.linkedin),
        phone: field("phone", profile.phone),
        email: field("email", user.email),
        skills: field("skills", profile.skills),
        interests: field("interests", profile.interests),
        availability: profile.availability,
        isMasked: profile.isMasked,
        visibility: isOwner || isAdmin ? profile.visibility : undefined
    };
}

export { presentProfile };

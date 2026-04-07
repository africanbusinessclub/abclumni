export type UserRole = "member" | "moderator" | "admin";
export type UserStatus = "active" | "inactive" | "pending";
export type Availability = "networking" | "mentoring" | "recruiting" | "none";

export interface ProfileVisibility {
    email: boolean;
    linkedin: boolean;
    phone: boolean;
    city: boolean;
    company: boolean;
    position: boolean;
    skills: boolean;
    interests: boolean;
}

export interface UserProfile {
    firstName: string;
    lastName: string;
    promotion: string;
    photo: string;
    bio: string;
    city: string;
    position: string;
    company: string;
    sector: string;
    linkedin: string;
    phone: string;
    skills: string[];
    interests: string[];
    availability: Availability;
    isMasked: boolean;
    visibility: ProfileVisibility;
}

export interface LoginHistoryEntry {
    date: string;
    ip: string;
    userAgent: string;
}

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    acceptedTermsAt: string;
    createdAt: string;
    lastLoginAt: string | null;
    profile: UserProfile;
    loginHistory: LoginHistoryEntry[];
}

export interface Article {
    id: string;
    title: string;
    slug: string;
    content: string;
    category: string;
    tags: string[];
    coverImage: string;
    authorId: string;
    publishedAt: string;
    createdAt: string;
    isUrgent: boolean;
    views: number;
}

export interface Resource {
    id: string;
    title: string;
    type: string;
    url: string;
    description: string;
    memberOnly: boolean;
    createdAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    type: string;
    message: string;
    readAt: string | null;
    archivedAt: string | null;
    createdAt: string;
}

export interface DatabaseState {
    users: User[];
    articles: Article[];
    resources: Resource[];
    notifications: Notification[];
}

export interface PresentedProfile {
    id: string;
    role: UserRole;
    status: UserStatus;
    firstName: string;
    lastName: string;
    fullName: string;
    promotion: string;
    photo: string;
    bio: string;
    city: string | null;
    position: string | null;
    company: string | null;
    sector: string;
    linkedin: string | null;
    phone: string | null;
    email: string | null;
    skills: string[] | null;
    interests: string[] | null;
    availability: Availability;
    isMasked: boolean;
    visibility?: ProfileVisibility;
}

export interface FileDatabase {
    read: () => DatabaseState;
    write: (db: DatabaseState) => void;
    withWrite: <T>(mutator: (db: DatabaseState) => T) => T;
}

export interface IdGenerator {
    newId: () => string;
}

export interface PasswordService {
    hash: (password: string) => string;
    verify: (password: string, hash: string) => boolean;
}

export interface TokenPayload {
    sub: string;
    role: UserRole;
    email: string;
}

export interface TokenService {
    sign: (user: Pick<User, "id" | "role" | "email">) => string;
    verify: (token: string) => TokenPayload;
}

export type Availability = "networking" | "mentoring" | "recruiting" | "none";
export type UserRole = "member" | "moderator" | "admin";
export type UserStatus = "active" | "inactive" | "pending";

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

export interface PublicProfile {
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

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    profile: PublicProfile;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    firstName: string;
    lastName: string;
    promotion: string;
    email: string;
    password: string;
    company: string;
    sector: string;
    position: string;
    city: string;
    linkedin: string;
    phone: string;
    skills: string[];
    interests: string[];
    availability: Availability;
    acceptedTerms: boolean;
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

export interface DashboardArticle {
    id: string;
    title: string;
    category: string;
    publishedAt: string;
}

export interface DashboardData {
    latestArticles: DashboardArticle[];
    unreadNotifications: number;
    suggestions: PublicProfile[];
}

export interface DirectoryQuery {
    q: string;
    promotion: string;
    sector: string;
    city: string;
    availability: string;
    sort: "relevance" | "name" | "promotion";
}

export interface DirectoryResponse {
    items: PublicProfile[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        pages: number;
    };
}

export interface NewsArticle {
    id: string;
    title: string;
    category: string;
    publishedAt: string;
    excerpt: string;
    tags: string[];
}

export interface NewsResponse {
    items: NewsArticle[];
}

export interface NotificationItem {
    id: string;
    type: string;
    message: string;
    readAt: string | null;
    archivedAt: string | null;
    createdAt: string;
}

export interface NotificationsResponse {
    items: NotificationItem[];
}

export interface ResourceItem {
    id: string;
    title: string;
    type: string;
    url: string;
    description: string;
    memberOnly: boolean;
    createdAt: string;
}

export interface ResourcesResponse {
    items: ResourceItem[];
}

export interface ProfileUpdatePayload {
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

export interface AdminUser {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    lastLoginAt: string | null;
    profile: PublicProfile;
}

export interface AdminUsersResponse {
    items: AdminUser[];
}

export interface AdminStats {
    activeMembers: number;
    pendingMembers: number;
    recentSignups: number;
    unreadNotifications: number;
    topArticles: Array<{ id: string; title: string; views: number }>;
}

export interface PublishArticlePayload {
    title: string;
    content: string;
    category: string;
    tags: string[];
    urgent: boolean;
}

import { apiClient } from '../http/apiClient'
import type {
    AdminStats,
    AdminUsersResponse,
    AuthResponse,
    DashboardData,
    DirectoryQuery,
    DirectoryResponse,
    LoginPayload,
    NewsArticleDetail,
    NewsResponse,
    NotificationsResponse,
    PublicProfile,
    ProfileUpdatePayload,
    PublishArticlePayload,
    RegisterPayload,
    ResourcesResponse,
    UserRole,
    UserStatus
} from '../../domain/types'

export const platformGateway = {
    login(payload: LoginPayload) {
        return apiClient.post<AuthResponse>('/auth/login', payload)
    },
    register(payload: RegisterPayload) {
        return apiClient.post<AuthResponse>('/auth/register', payload)
    },
    getDashboard() {
        return apiClient.get<DashboardData>('/dashboard')
    },
    getAlumni(params: Partial<DirectoryQuery> = {}) {
        return apiClient.get<DirectoryResponse>('/alumni', { params })
    },
    getAlumniById(id: string) {
        return apiClient.get<PublicProfile>(`/alumni/${id}`)
    },
    getArticles(params: Partial<Record<'q' | 'category' | 'tag', string>> = {}) {
        return apiClient.get<NewsResponse>('/articles', { params })
    },
    getArticle(id: string) {
        return apiClient.get<NewsArticleDetail>(`/articles/${id}`)
    },
    getNotifications() {
        return apiClient.get<NotificationsResponse>('/notifications')
    },
    markNotification(id: string, action: 'read' | 'archive') {
        return apiClient.patch<{ ok: true }>(`/notifications/${id}/${action}`)
    },
    getResources() {
        return apiClient.get<ResourcesResponse>('/resources')
    },
    updateProfile(payload: ProfileUpdatePayload) {
        return apiClient.put<{ profile: PublicProfile }>('/me/profile', payload)
    },
    deleteAccount() {
        return apiClient.delete<{ ok: true; message: string }>('/me')
    },
    getAdminUsers() {
        return apiClient.get<AdminUsersResponse>('/admin/users')
    },
    getAdminStats() {
        return apiClient.get<AdminStats>('/admin/stats')
    },
    publishArticle(payload: PublishArticlePayload) {
        return apiClient.post<{ article: unknown }>('/admin/articles', payload)
    },
    publishResource(payload: any) {
        return apiClient.post<{ resource: unknown }>('/admin/resources', payload)
    },
    updateAdminUser(id: string, key: 'role' | 'status', value: UserRole | UserStatus) {
        return apiClient.patch(`/admin/users/${id}/${key}`, { [key]: value })
    },
    exportUsersCsv() {
        return apiClient.get('/admin/users/export.csv', { responseType: 'blob' })
    }
}

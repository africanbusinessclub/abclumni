import { apiClient } from '../http/apiClient'
import type {
    AdminStats,
    AdminUsersResponse,
    AuthResponse,
    DashboardData,
    DirectoryQuery,
    DirectoryResponse,
    EventsResponse,
    JobOffersResponse,
    LoginPayload,
    NewsArticleDetail,
    NewsResponse,
    NotificationsResponse,
    PublicProfile,
    ProfileUpdatePayload,
    PublishArticlePayload,
    PublishEventPayload,
    PublishJobPayload,
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
    forgotPassword(email: string) {
        return apiClient.post<{ ok: true; message: string }>('/auth/forgot-password', { email })
    },
    resetPassword(token: string, password: string) {
        return apiClient.post<{ ok: true }>('/auth/reset-password', { token, password })
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
    getEvents() {
        return apiClient.get<EventsResponse>('/events')
    },
    updateProfile(payload: ProfileUpdatePayload) {
        return apiClient.put<{ profile: PublicProfile }>('/me/profile', payload)
    },
    async uploadProfilePhoto(file: File) {
        const form = new FormData()
        form.append('photo', file)
        return apiClient.post<{ profile: PublicProfile }>('/me/photo', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },
    async uploadCv(file: File) {
        const form = new FormData()
        form.append('cv', file)
        return apiClient.post<{ profile: PublicProfile }>('/me/cv', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
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
    publishEvent(payload: PublishEventPayload) {
        return apiClient.post<{ event: unknown }>('/admin/events', payload)
    },
    deleteEvent(id: string) {
        return apiClient.delete<{ ok: true }>(`/admin/events/${id}`)
    },
    async uploadFile(file: File) {
        const form = new FormData()
        form.append('file', file)
        const resp = await apiClient.post<{ path: string }>('/admin/upload', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        // Store as root-relative path (/uploads/...) so it resolves
        // through the frontend origin (proxied to the backend).
        return { ...resp, data: { url: resp.data.path } }
    },
    updateAdminUser(id: string, key: 'role' | 'status', value: UserRole | UserStatus) {
        return apiClient.patch(`/admin/users/${id}/${key}`, { [key]: value })
    },
    updateAdminProfileType(id: string, profileType: string) {
        return apiClient.patch(`/admin/users/${id}/profileType`, { profileType })
    },
    exportUsersCsv() {
        return apiClient.get('/admin/users/export.csv', { responseType: 'blob' })
    },
    getJobs() {
        return apiClient.get<JobOffersResponse>('/jobs')
    },
    publishJob(payload: PublishJobPayload) {
        return apiClient.post<{ ok: true; job: unknown }>('/jobs', payload)
    },
    deleteJob(id: string) {
        return apiClient.delete<{ ok: true }>(`/jobs/${id}`)
    },
    // ── Push notifications ──────────────────────────────────────────────────
    getVapidPublicKey() {
        return apiClient.get<{ publicKey: string }>('/push/public-key')
    },
    subscribePush(body: { endpoint: string; keys: Record<string, string>; device?: string }) {
        return apiClient.post<{ ok: true }>('/push/subscribe', body)
    },
    unsubscribePush(body: { endpoint: string }) {
        return apiClient.delete<{ ok: true }>('/push/subscribe', { data: body })
    },
}

import axios from 'axios'

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'
})

// Initialize auth header immediately (prevents first-render races before hooks run).
try {
    const token = localStorage.getItem('abc_token')
    if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
    }
} catch {
    // Ignore environments where localStorage is unavailable.
}

// ── Token refresh interceptor ────────────────────────────────────────────────

let isRefreshing = false
let failedQueue: Array<{
    resolve: (_token: string) => void
    reject: (_error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error || !token) {
            reject(error)
        } else {
            resolve(token)
        }
    })
    failedQueue = []
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Only attempt refresh on 401, not on the refresh endpoint itself, and not already retried.
        if (
            error.response?.status !== 401 ||
            originalRequest._retry ||
            originalRequest.url === '/auth/refresh'
        ) {
            return Promise.reject(error)
        }

        if (isRefreshing) {
            // Another refresh is in flight — queue this request.
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({ resolve, reject })
            })
                .then((newToken) => {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return apiClient(originalRequest)
                })
                .catch((err) => Promise.reject(err))
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
            const refreshToken = localStorage.getItem('abc_refresh_token')
            if (!refreshToken) {
                throw new Error('No refresh token')
            }

            const { data } = await axios.post(
                `${apiClient.defaults.baseURL}/auth/refresh`,
                { refreshToken }
            )

            const newToken: string = data.token
            const newRefreshToken: string = data.refreshToken

            // Persist new tokens
            localStorage.setItem('abc_token', newToken)
            localStorage.setItem('abc_refresh_token', newRefreshToken)
            apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`

            processQueue(null, newToken)

            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return apiClient(originalRequest)
        } catch (refreshError) {
            processQueue(refreshError, null)

            // Clear auth state
            localStorage.removeItem('abc_token')
            localStorage.removeItem('abc_refresh_token')
            localStorage.removeItem('abc_user')
            delete apiClient.defaults.headers.common.Authorization

            // Redirect to auth page
            window.location.href = '/auth'

            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    }
)

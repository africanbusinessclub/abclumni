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

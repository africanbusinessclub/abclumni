import { useEffect, useState } from 'react'
import { apiClient } from '../../infrastructure/http/apiClient'
import type { AuthUser } from '../../domain/types'

export function useAuthState() {
    const [token, setToken] = useState(localStorage.getItem('abc_token') || '')
    const [user, setUser] = useState<AuthUser | null>(() => {
        const raw = localStorage.getItem('abc_user')
        return raw ? (JSON.parse(raw) as AuthUser) : null
    })

    useEffect(() => {
        if (token) {
            apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
            localStorage.setItem('abc_token', token)
        } else {
            delete apiClient.defaults.headers.common.Authorization
            localStorage.removeItem('abc_token')
        }
    }, [token])

    useEffect(() => {
        if (user) {
            localStorage.setItem('abc_user', JSON.stringify(user))
        } else {
            localStorage.removeItem('abc_user')
        }
    }, [user])

    const logout = () => {
        setToken('')
        setUser(null)
    }

    return { token, setToken, user, setUser, logout }
}

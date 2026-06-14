import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../../infrastructure/http/apiClient'
import type { AuthUser } from '../../domain/types'

export function useAuthState() {
    const [token, setToken] = useState(localStorage.getItem('abc_token') || '')
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('abc_refresh_token') || '')
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
        if (refreshToken) {
            localStorage.setItem('abc_refresh_token', refreshToken)
        } else {
            localStorage.removeItem('abc_refresh_token')
        }
    }, [refreshToken])

    useEffect(() => {
        if (user) {
            localStorage.setItem('abc_user', JSON.stringify(user))
        } else {
            localStorage.removeItem('abc_user')
        }
    }, [user])

    const setAuth = useCallback((t: string, rt: string, u: AuthUser) => {
        setToken(t)
        setRefreshToken(rt)
        setUser(u)
    }, [])

    const logout = useCallback(() => {
        setToken('')
        setRefreshToken('')
        setUser(null)
    }, [])

    return { token, setToken, refreshToken, setRefreshToken, setAuth, user, setUser, logout }
}

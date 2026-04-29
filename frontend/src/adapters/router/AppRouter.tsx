import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuthState } from '../../application/hooks/useAuthState'
import { platformGateway } from '../../infrastructure/repositories/platformGateway'
import { AdminRoute, ProtectedRoute, Shell } from '../ui/components/Shell'
import type { LoginPayload, RegisterPayload } from '../../domain/types'
import { AuthPage } from '../ui/pages/AuthPage'
import { DashboardPage } from '../ui/pages/DashboardPage'
import { DirectoryPage } from '../ui/pages/DirectoryPage'
import { NewsPage } from '../ui/pages/NewsPage'
import { NewsDetailPage } from '../ui/pages/NewsDetailPage'
import { ResourcesPage } from '../ui/pages/ResourcesPage'
import { NotificationsPage } from '../ui/pages/NotificationsPage'
import { ProfilePage } from '../ui/pages/ProfilePage'
import { AdminPage } from '../ui/pages/AdminPage'

export function AppRouter() {
    const auth = useAuthState()
    const navigate = useNavigate()

    const login = async (payload: LoginPayload) => {
        const response = await platformGateway.login(payload)
        auth.setToken(response.data.token)
        auth.setUser(response.data.user)
        navigate('/dashboard')
    }

    const register = async (payload: RegisterPayload) => {
        const response = await platformGateway.register(payload)
        auth.setToken(response.data.token)
        auth.setUser(response.data.user)
        navigate('/dashboard')
    }

    const logout = () => {
        auth.logout()
        navigate('/auth')
    }

    return (
        <Routes>
            <Route path="/auth" element={auth.user ? <Navigate to="/dashboard" replace /> : <AuthPage onLogin={login} onRegister={register} />} />
            <Route
                path="/dashboard"
                element={<ProtectedRoute user={auth.user}><Shell user={auth.user!} onLogout={logout}><DashboardPage /></Shell></ProtectedRoute>}
            />
            <Route
                path="/directory"
                element={<ProtectedRoute user={auth.user}><Shell user={auth.user!} onLogout={logout}><DirectoryPage /></Shell></ProtectedRoute>}
            />
            <Route
                path="/news"
                element={<ProtectedRoute user={auth.user}><Shell user={auth.user!} onLogout={logout}><NewsPage /></Shell></ProtectedRoute>}
            />
            <Route
                path="/news/:id"
                element={<ProtectedRoute user={auth.user}><Shell user={auth.user!} onLogout={logout}><NewsDetailPage /></Shell></ProtectedRoute>}
            />
            <Route
                path="/resources"
                element={<ProtectedRoute user={auth.user}><Shell user={auth.user!} onLogout={logout}><ResourcesPage /></Shell></ProtectedRoute>}
            />
            <Route
                path="/notifications"
                element={<ProtectedRoute user={auth.user}><Shell user={auth.user!} onLogout={logout}><NotificationsPage /></Shell></ProtectedRoute>}
            />
            <Route
                path="/profile"
                element={<ProtectedRoute user={auth.user}><Shell user={auth.user!} onLogout={logout}><ProfilePage user={auth.user!} onUserUpdate={auth.setUser} onLogout={logout} /></Shell></ProtectedRoute>}
            />
            <Route
                path="/admin"
                element={<AdminRoute user={auth.user}><Shell user={auth.user!} onLogout={logout}><AdminPage /></Shell></AdminRoute>}
            />
            <Route path="*" element={<Navigate to={auth.user ? '/dashboard' : '/auth'} replace />} />
        </Routes>
    )
}

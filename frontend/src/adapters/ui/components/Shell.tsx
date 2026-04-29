import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { AuthUser } from '../../../domain/types'
import { Button } from './Button'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { AbcLogo } from '../../../assets/AbcLogo'
import './TopNav.css'

type ShellProps = {
    user: AuthUser
    onLogout: () => void
    children: ReactNode
}

type GuardProps = {
    user: AuthUser | null
    children: ReactNode
}

function getAvatarColor(name: string) {
    const chars = name?.charCodeAt(0) || 0
    if (chars % 4 === 0) return 'avatar-blue'
    if (chars % 4 === 1) return 'avatar-orange'
    if (chars % 4 === 2) return 'avatar-green'
    return 'avatar-purple'
}

function getInitials(name: string) {
    return (name || '??').substring(0, 2).toUpperCase()
}

export function TopNav({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
    const location = useLocation()
    const navigate = useNavigate()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        platformGateway.getDashboard()
            .then(res => setUnreadCount(res.data.unreadNotifications))
            .catch(() => setUnreadCount(0))
    }, [location.pathname])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className="top-nav">
            <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                <AbcLogo size={34} />
            </div>

            <div className="user-chip" ref={dropdownRef} style={{ position: 'relative' }}>
                <button className="bell-btn" onClick={() => navigate('/notifications')}>
                    🔔
                    {unreadCount > 0 && <span className="bell-dot"></span>}
                </button>
                <div
                    className={'avatar ' + getAvatarColor(user?.profile?.fullName || '')}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{ cursor: 'pointer' }}
                >
                    {getInitials(user?.profile?.fullName || '')}
                </div>

                {dropdownOpen && (
                    <div className="user-dropdown">
                        <div className="dropdown-header">
                            <strong>{user?.profile?.fullName}</strong>
                            <span>{user?.email}</span>
                        </div>

                        <div className="mobile-only" style={{ flexDirection: 'column', padding: 0 }}>
                            <Link to="/dashboard" onClick={() => setDropdownOpen(false)}>🎛️ Dashboard</Link>
                            <Link to="/directory" onClick={() => setDropdownOpen(false)}>👥 Annuaire</Link>
                            <Link to="/news" onClick={() => setDropdownOpen(false)}>📰 Actualités</Link>
                            <Link to="/resources" onClick={() => setDropdownOpen(false)}>📁 Ressources</Link>
                            <hr />
                        </div>

                        <Link to="/profile" onClick={() => setDropdownOpen(false)}>👤 Mon profil</Link>
                        {user?.role === 'admin' && (
                            <Link to="/admin" onClick={() => setDropdownOpen(false)}>🛡️ Administration</Link>
                        )}
                        <hr />
                        <button className="logout-btn" onClick={() => { setDropdownOpen(false); onLogout(); }}>
                            🚪 Déconnexion
                        </button>
                    </div>
                )}
            </div>
        </header>
    )
}

export function Shell({ user, onLogout, children }: ShellProps) {
    const location = useLocation()

    const profile = user?.profile

    return (
        <div className="app-layout">
            <TopNav user={user} onLogout={onLogout} />
            <div className="dashboard-grid">
                <aside className="dashboard-sidebar">
                    <div className="sidebar-profile">
                        <div className={'avatar avatar-lg ' + getAvatarColor(profile?.fullName || '')}>
                            {getInitials(profile?.fullName || '')}
                        </div>
                        <h4>{profile?.fullName || 'No Name'}</h4>
                        <span className="promo">Promo {profile?.promotion || 'NC'}</span>
                    </div>
                    <nav className="sidebar-nav">
                        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}><span className="icon">🎛️</span> Dashboard</Link>
                        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}><span className="icon">👤</span> Mon profil</Link>
                        <Link to="/directory" className={location.pathname.startsWith('/directory') ? 'active' : ''}><span className="icon">👥</span> Annuaire</Link>
                        <Link to="/news" className={location.pathname.startsWith('/news') ? 'active' : ''}><span className="icon">📰</span> Actualités</Link>
                        <Link to="/resources" className={location.pathname.startsWith('/resources') ? 'active' : ''}><span className="icon">📁</span> Ressources</Link>                    {user?.role === 'admin' && (
                            <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'active' : ''}><span className="icon">🛡️</span> Administration</Link>
                        )}                        <button className="logout-btn" onClick={onLogout} style={{ marginTop: 'auto', background: 'none', border: 'none', color: 'inherit', fontWeight: '500', cursor: 'pointer', textAlign: 'left', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="icon">🚪</span> Déconnexion
                        </button>
                    </nav>
                </aside>
                <main className="app-content">{children}</main>
            </div>
            <footer className="app-footer">
                <AbcLogo size={28} />
                <span>© {new Date().getFullYear()} Alumni ABC · African Business Club</span>
            </footer>
        </div>
    )
}

export function ProtectedRoute({ user, children }: GuardProps) {
    if (!user) return <Navigate to="/auth" replace />
    return children
}

export function AdminRoute({ user, children }: GuardProps) {
    if (!user) return <Navigate to="/auth" replace />
    if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
    return children
}

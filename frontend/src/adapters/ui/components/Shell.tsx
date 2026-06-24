import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { AuthUser } from '../../../domain/types'
import { Button } from './Button'
import { Avatar } from './Avatar'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { usePushNotifications } from '../../../application/hooks/usePushNotifications'
import { AbcLogo } from '../../../assets/AbcLogo'
import { Bell, BellOff, Briefcase, CalendarDays, LayoutDashboard, Users, Newspaper, FolderOpen, UserCircle, ShieldCheck, LogOut } from 'lucide-react'
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

export function TopNav({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
    const location = useLocation()
    const navigate = useNavigate()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { pushState, subscribe, unsubscribe } = usePushNotifications()

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
                <button className="bell-btn" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`} onClick={() => navigate('/notifications')}>
                    <Bell size={32} />
                    {unreadCount > 0 && <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>
                <div
                    className="avatar-btn"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{ cursor: 'pointer' }}
                >
                    <Avatar name={user?.profile?.fullName || ''} photo={user?.profile?.photo} />
                </div>

                {dropdownOpen && (
                    <div className="user-dropdown">
                        <div className="dropdown-header">
                            <strong>{user?.profile?.fullName}</strong>
                            <span>{user?.email}</span>
                        </div>

                        <div className="mobile-only" style={{ flexDirection: 'column', padding: 0 }}>
                            <Link to="/dashboard" onClick={() => setDropdownOpen(false)}><LayoutDashboard size={16} /> Tableau de bord</Link>
                            <Link to="/directory" onClick={() => setDropdownOpen(false)}><Users size={16} /> Annuaire</Link>
                            <Link to="/news" onClick={() => setDropdownOpen(false)}><Newspaper size={16} /> Actualités</Link>
                            <Link to="/events" onClick={() => setDropdownOpen(false)}><CalendarDays size={16} /> Événements</Link>
                            <Link to="/jobs" onClick={() => setDropdownOpen(false)}><Briefcase size={16} /> Emplois</Link>
                            <Link to="/resources" onClick={() => setDropdownOpen(false)}><FolderOpen size={16} /> Ressources</Link>
                            <hr />
                        </div>

                        <Link to="/profile" onClick={() => setDropdownOpen(false)}><UserCircle size={16} /> Mon profil</Link>
                        {user?.role === 'admin' && (
                            <Link to="/admin" onClick={() => setDropdownOpen(false)}><ShieldCheck size={16} /> Administration</Link>
                        )}
                        {pushState !== 'unsupported' && (
                            pushState === 'subscribed' ? (
                                <button className="push-toggle-btn" onClick={async () => { await unsubscribe(); setDropdownOpen(false); }}>
                                    <BellOff size={16} /> Désactiver les notifications
                                </button>
                            ) : (
                                <button className="push-toggle-btn" onClick={async () => { await subscribe(); setDropdownOpen(false); }}>
                                    <Bell size={16} /> Activer les notifications
                                </button>
                            )
                        )}
                        <hr />
                        <button className="logout-btn" onClick={() => { setDropdownOpen(false); onLogout(); }}>
                            <LogOut size={16} /> Déconnexion
                        </button>
                    </div>
                )}
            </div>
        </header>
    )
}

function BottomNav() {
    const location = useLocation()
    const isActive = (path: string) => location.pathname.startsWith(path)

    return (
        <nav className="bottom-nav">
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
                <span className="bottom-nav-icon"><LayoutDashboard size={22} /></span>
                <span>Accueil</span>
            </Link>
            <Link to="/directory" className={isActive('/directory') ? 'active' : ''}>
                <span className="bottom-nav-icon"><Users size={22} /></span>
                <span>Annuaire</span>
            </Link>
            <Link to="/news" className={isActive('/news') ? 'active' : ''}>
                <span className="bottom-nav-icon"><Newspaper size={22} /></span>
                <span>Actus</span>
            </Link>
            <Link to="/events" className={isActive('/events') ? 'active' : ''}>
                <span className="bottom-nav-icon"><CalendarDays size={22} /></span>
                <span>Événements</span>
            </Link>
            <Link to="/jobs" className={isActive('/jobs') ? 'active' : ''}>
                <span className="bottom-nav-icon"><Briefcase size={22} /></span>
                <span>Emplois</span>
            </Link>
        </nav>
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
                        <Avatar name={profile?.fullName || ''} photo={profile?.photo} size="avatar-lg" />
                        <h4>{profile?.fullName || 'Sans nom'}</h4>
                        <span className="promo">Promo {profile?.promotion || 'NC'}</span>
                    </div>
                    <nav className="sidebar-nav">
                        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}><span className="icon"><LayoutDashboard size={18} /></span> Tableau de bord</Link>
                        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}><span className="icon"><UserCircle size={18} /></span> Mon profil</Link>
                        <Link to="/directory" className={location.pathname.startsWith('/directory') ? 'active' : ''}><span className="icon"><Users size={18} /></span> Annuaire</Link>
                        <Link to="/news" className={location.pathname.startsWith('/news') ? 'active' : ''}><span className="icon"><Newspaper size={18} /></span> Actualités</Link>
                        <Link to="/events" className={location.pathname.startsWith('/events') ? 'active' : ''}><span className="icon"><CalendarDays size={18} /></span> Événements</Link>
                        <Link to="/jobs" className={location.pathname.startsWith('/jobs') ? 'active' : ''}><span className="icon"><Briefcase size={18} /></span> Emplois</Link>
                        <Link to="/resources" className={location.pathname.startsWith('/resources') ? 'active' : ''}><span className="icon"><FolderOpen size={18} /></span> Ressources</Link>
                        {user?.role === 'admin' && (
                            <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'active' : ''}><span className="icon"><ShieldCheck size={18} /></span> Administration</Link>
                        )}
                        <button className="logout-btn" onClick={onLogout} style={{ marginTop: 'auto', background: 'none', border: 'none', color: 'inherit', fontWeight: '500', cursor: 'pointer', textAlign: 'left', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="icon"><LogOut size={18} /></span> Déconnexion
                        </button>
                    </nav>
                </aside>
                <main className="app-content">{children}</main>
            </div>
            <BottomNav />
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

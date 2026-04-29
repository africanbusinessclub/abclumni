import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../domain/httpError'
import type { DashboardData, NotificationItem } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { SkeletonGrid } from '../components/SkeletonGrid'
import { useAuthState } from '../../../application/hooks/useAuthState'
import { UserCircle, Newspaper, Diamond } from 'lucide-react'
import './DashboardPage.css'

type DashboardState = {
    loading: boolean
    data: DashboardData | null
    notifications: NotificationItem[]
    error: string
}

function getAvatarColor(name: string) {
    const chars = name.charCodeAt(0) || 0
    if (chars % 4 === 0) return 'avatar-blue'
    if (chars % 4 === 1) return 'avatar-orange'
    if (chars % 4 === 2) return 'avatar-green'
    return 'avatar-purple'
}

function getInitials(name: string) {
    return (name || '??').substring(0, 2).toUpperCase()
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `Il y a ${days} jour(s)`
    if (hours > 0) return `Il y a ${hours} heure(s)`
    return 'À l\'instant'
}

export function DashboardPage() {
    const { user } = useAuthState()
    const navigate = useNavigate()
    const [state, setState] = useState<DashboardState>({ loading: true, data: null, notifications: [], error: '' })

    useEffect(() => {
        async function run() {
            setState(prev => ({ ...prev, loading: true, error: '' }))
            try {
                const [dashRes, notifRes] = await Promise.all([
                    platformGateway.getDashboard(),
                    platformGateway.getNotifications()
                ])
                setState({ loading: false, data: dashRes.data, notifications: notifRes.data.items, error: '' })
            } catch (error) {
                setState({ loading: false, data: null, notifications: [], error: getApiErrorMessage(error, 'Unable to load dashboard') })
            }
        }
        void run()
    }, [])

    if (state.loading) return <SkeletonGrid />
    if (state.error) return <p className="error-text">{state.error}</p>
    if (!state.data) return null

    const profile = user?.profile
    const firstName = profile?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Membre'
    const recentNotifs = state.notifications.slice(0, 3)

    return (
        <section>
            <header className="dashboard-header">
                <h1>Bonjour, {firstName} <span role="img" aria-label="wave">👋</span></h1>
                <p>Voici vos dernières activités sur le réseau ABC.</p>
            </header>

            <div className="kpi-grid">
                <div className="panel kpi-card">
                    <h2>{state.data.suggestions.length > 0 ? state.data.suggestions.length : 0}</h2>
                    <p>Membres suggérés</p>
                </div>
                <div className="panel kpi-card">
                    <h2>{state.data.unreadNotifications}</h2>
                    <p>Notifications non lues</p>
                </div>
                <div className="panel kpi-card">
                    <h2>{state.data.latestArticles.length}</h2>
                    <p>Dernières actualités</p>
                </div>
            </div>

            <div className="dashboard-section section-split">
                <h2>Alumni suggérés</h2>
                <div className="suggestions-grid">
                    {state.data.suggestions.length === 0 && <p style={{ color: '#666' }}>Aucune suggestion pour le moment.</p>}
                    {state.data.suggestions.map((item) => (
                        <div key={item.id} className="panel suggestion-card" onClick={() => navigate(`/members/${item.id}`)} style={{ cursor: 'pointer' }}>
                            <div className={'avatar avatar-lg ' + getAvatarColor(item.fullName)}>
                                {getInitials(item.fullName)}
                            </div>
                            <h4>{item.fullName}</h4>
                            <p>{item.position || 'Role non défini'}, {item.company || 'Entreprise inconnue'}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="dashboard-section section-split">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Notifications récentes</h2>
                    {recentNotifs.length > 0 && <Link to="/notifications" style={{ textDecoration: 'none', fontSize: '0.9rem', color: 'var(--brand)' }}>Voir tout</Link>}
                </div>
                <div className="notifications-list">
                    {recentNotifs.length === 0 && <p style={{ color: '#666', marginTop: '1rem' }}>Aucune notification récente.</p>}
                    {recentNotifs.map((item) => (
                        <div key={item.id} className={`notification-item ${!item.readAt ? 'unread' : ''}`}>
                            <span className={`notif-icon ${item.type === 'profile' ? 'blue' : item.type === 'article' ? 'amber' : 'gray'}`}>
                                {item.type === 'profile' ? <UserCircle size={18} /> : item.type === 'article' ? <Newspaper size={18} /> : <Diamond size={18} />}
                            </span>
                            <div className="notif-content">
                                <p><strong>{item.type}</strong> {item.message}</p>
                                <span>{timeAgo(item.createdAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

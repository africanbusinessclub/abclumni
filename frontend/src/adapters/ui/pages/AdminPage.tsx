import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../domain/httpError'
import type { AdminStats, AdminUser } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { Button } from '../components/Button'
import { LayoutDashboard, Newspaper, FolderOpen } from 'lucide-react'
import './AdminPage.css'

export function AdminPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'members' | 'news' | 'resources'>(
        ['#news', '#resources'].includes(location.hash) ? (location.hash.substring(1) as any) : 'members'
    )
    const [users, setUsers] = useState<AdminUser[]>([])
    const [stats, setStats] = useState<AdminStats | null>(null)

    // Forms
    const [articleForm, setArticleForm] = useState({ title: '', content: '', category: '', tags: [] as string[], urgent: false })
    const [resourceForm, setResourceForm] = useState({ title: '', type: 'pdf', url: '', description: '', memberOnly: true })
    const [statusMessage, setStatusMessage] = useState('')

    useEffect(() => {
        let isMounted = true
        async function bootstrap() {
            try {
                const [usersResp, statsResp] = await Promise.all([platformGateway.getAdminUsers(), platformGateway.getAdminStats()])
                if (!isMounted) return
                setUsers(usersResp.data.items)
                setStats(statsResp.data)
            } catch (e) {
                console.error(e)
            }
        }
        void bootstrap()
        return () => {
            isMounted = false
        }
    }, [])

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

    // Effect to handle URL hash changes directly
    useEffect(() => {
        if (location.hash === '#news') setActiveTab('news')
        else if (location.hash === '#resources') setActiveTab('resources')
        else setActiveTab('members')
    }, [location.hash])

    const handleTabClick = (tab: 'members' | 'news' | 'resources') => {
        setActiveTab(tab)
        navigate(`/admin#${tab}`, { replace: true })
    }

    async function handlePublishNews(e: React.FormEvent) {
        e.preventDefault()
        try {
            await platformGateway.publishArticle({ ...articleForm, tags: articleForm.tags.length ? articleForm.tags : [] })
            setStatusMessage('Actualité publiée avec succès!')
            setArticleForm({ title: '', content: '', category: '', tags: [], urgent: false })
            setTimeout(() => setStatusMessage(''), 3000)
        } catch (error) {
            setStatusMessage('Erreur lors de la publication.')
        }
    }

    async function handlePublishResource(e: React.FormEvent) {
        e.preventDefault()
        try {
            await platformGateway.publishResource(resourceForm)
            setStatusMessage('Ressource publiée avec succès!')
            setResourceForm({ title: '', type: 'pdf', url: '', description: '', memberOnly: true })
            setTimeout(() => setStatusMessage(''), 3000)
        } catch (error) {
            setStatusMessage('Erreur lors de la publication.')
        }
    }

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    ABC <span className="text-orange">Admin</span>
                </div>
                <nav className="admin-nav">
                    <a href="#members" className={activeTab === 'members' ? "active" : ""} onClick={(e) => { e.preventDefault(); handleTabClick('members'); }}><LayoutDashboard size={16} /> Dashboard & Membres</a>
                    <a href="#news" className={activeTab === 'news' ? "active" : ""} onClick={(e) => { e.preventDefault(); handleTabClick('news'); }}><Newspaper size={16} /> Publier Actualité</a>
                    <a href="#resources" className={activeTab === 'resources' ? "active" : ""} onClick={(e) => { e.preventDefault(); handleTabClick('resources'); }}><FolderOpen size={16} /> Publier Ressource</a>
                </nav>
            </aside>
            <main className="admin-content">
                {statusMessage && <div style={{ padding: '1rem', background: '#d4edda', color: '#155724', marginBottom: '1.5rem', borderRadius: '8px', fontWeight: 500 }}>{statusMessage}</div>}

                {activeTab === 'members' && (
                    <>
                        <header className="admin-header">
                            <h1>Gestion des membres</h1>
                            <button className="btn-primary">+ Inviter un membre</button>
                        </header>

                        <div className="admin-kpis">
                            <div className="admin-kpi-card">
                                <h2>{stats?.activeMembers || 480}</h2>
                                <span>Membres actifs</span>
                            </div>
                            <div className="admin-kpi-card">
                                <h2>{stats?.pendingMembers || 12}</h2>
                                <span>En attente</span>
                            </div>
                            <div className="admin-kpi-card">
                                <h2>{stats?.inactiveMembers || 8}</h2>
                                <span>Inactifs</span>
                            </div>
                            <div className="admin-kpi-card">
                                <h2>94%</h2>
                                <span>Profils complets</span>
                            </div>
                        </div>

                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Membre</th>
                                        <th>Promotion</th>
                                        <th>Secteur</th>
                                        <th>Statut</th>
                                        <th>Inscription</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length > 0 ? users.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="table-user">
                                                    <div className={'avatar ' + getAvatarColor(user.profile.fullName)}>
                                                        {getInitials(user.profile.fullName)}
                                                    </div>
                                                    <div className="table-user-info">
                                                        <strong>{user.profile.fullName}</strong>
                                                        <span>[email protected]</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{user.profile.promotion || '2022'}</td>
                                            <td>{user.profile.skills?.[0] || 'Conseil'}</td>
                                            <td>
                                                <span className={`status-pill ${user.status === 'active' ? 'status-active' : 'status-pending'}`}>
                                                    {user.status === 'active' ? 'Actif' : 'En attente'}
                                                </span>
                                            </td>
                                            <td>Mars 2026</td>
                                        </tr>
                                    )) : (
                                        <>
                                            <tr>
                                                <td>
                                                    <div className="table-user">
                                                        <div className="avatar avatar-blue">AK</div>
                                                        <div className="table-user-info">
                                                            <strong>Aminata Koné</strong>
                                                            <span className="text-blue-light">[email protected]</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>2022</td>
                                                <td>Conseil</td>
                                                <td><span className="status-pill status-active">Actif</span></td>
                                                <td>Jany, 2023</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div className="table-user">
                                                        <div className="avatar avatar-orange">SD</div>
                                                        <div className="table-user-info">
                                                            <strong>Sébastien Diallo</strong>
                                                            <span className="text-blue-light">[email protected]</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>2021</td>
                                                <td>Tech</td>
                                                <td><span className="status-pill status-active">Actif</span></td>
                                                <td>Mars 2022</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div className="table-user">
                                                        <div className="avatar avatar-green">MN</div>
                                                        <div className="table-user-info">
                                                            <strong>Mariama Ndiaye</strong>
                                                            <span className="text-blue-light">[email protected]</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>2023</td>
                                                <td>Data</td>
                                                <td><span className="status-pill status-pending">En attente</span></td>
                                                <td>Mars 2026</td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'news' && (
                    <>
                        <header className="admin-header">
                            <h1>Publier une actualité</h1>
                        </header>
                        <div className="admin-table-wrapper" style={{ padding: '2rem' }}>
                            <form onSubmit={handlePublishNews} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--ink)' }}>Titre</label>
                                    <input style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--line)', borderRadius: '8px' }} value={articleForm.title} onChange={e => setArticleForm({ ...articleForm, title: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--ink)' }}>Catégorie</label>
                                    <input style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--line)', borderRadius: '8px' }} placeholder="Ex: vie associative, carrière..." value={articleForm.category} onChange={e => setArticleForm({ ...articleForm, category: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--ink)' }}>Contenu</label>
                                    <textarea style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--line)', borderRadius: '8px', minHeight: '150px', fontFamily: 'inherit' }} value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content: e.target.value })} required />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--ink)' }}>
                                    <input type="checkbox" checked={articleForm.urgent} onChange={e => setArticleForm({ ...articleForm, urgent: e.target.checked })} />
                                    <span>Communication urgente (Email à tous)</span>
                                </label>
                                <Button type="submit" style={{ alignSelf: 'flex-start' }}>Publier l'actualité</Button>
                            </form>
                        </div>
                    </>
                )}

                {activeTab === 'resources' && (
                    <>
                        <header className="admin-header">
                            <h1>Publier une ressource</h1>
                        </header>
                        <div className="admin-table-wrapper" style={{ padding: '2rem' }}>
                            <form onSubmit={handlePublishResource} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--ink)' }}>Titre de la ressource</label>
                                    <input style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--line)', borderRadius: '8px' }} value={resourceForm.title} onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--ink)' }}>Type</label>
                                    <select style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--line)', borderRadius: '8px', background: 'white' }} value={resourceForm.type} onChange={e => setResourceForm({ ...resourceForm, type: e.target.value })}>
                                        <option value="pdf">Document / PDF</option>
                                        <option value="job">Offre d'emploi / Stage</option>
                                        <option value="link">Lien externe</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--ink)' }}>URL</label>
                                    <input style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--line)', borderRadius: '8px' }} type="url" placeholder="https://..." value={resourceForm.url} onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--ink)' }}>Description</label>
                                    <textarea style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--line)', borderRadius: '8px', fontFamily: 'inherit' }} rows={3} value={resourceForm.description} onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })} />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--ink)' }}>
                                    <input type="checkbox" checked={resourceForm.memberOnly} onChange={e => setResourceForm({ ...resourceForm, memberOnly: e.target.checked })} />
                                    <span>Réservé aux membres validés</span>
                                </label>
                                <Button type="submit" style={{ alignSelf: 'flex-start' }}>Publier la ressource</Button>
                            </form>
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}

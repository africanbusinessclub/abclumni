import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../domain/httpError'
import type { AdminStats, AdminUser, EventItem } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { Button } from '../components/Button'
import { RichTextEditor } from '../components/RichTextEditor'
import { LayoutDashboard, Newspaper, FolderOpen } from 'lucide-react'
import './AdminPage.css'

export function AdminPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const activeTab = useMemo(() => {
        if (location.hash === '#news') return 'news' as const
        if (location.hash === '#resources') return 'resources' as const
        if (location.hash === '#events') return 'events' as const
        return 'members' as const
    }, [location.hash])
    const [users, setUsers] = useState<AdminUser[]>([])
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [events, setEvents] = useState<EventItem[]>([])

    // Forms
    const [articleForm, setArticleForm] = useState({ title: '', content: '', category: '', tags: [] as string[], urgent: false })
    const [resourceForm, setResourceForm] = useState({ title: '', type: 'pdf', url: '', description: '', memberOnly: true })
    const [eventForm, setEventForm] = useState({ title: '', description: '', url: '', coverImage: '' })
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
    const [coverImagePreview, setCoverImagePreview] = useState<string>('')
    const [statusMessage, setStatusMessage] = useState('')

    useEffect(() => {
        let isMounted = true
        async function bootstrap() {
            try {
                const [usersResp, statsResp, eventsResp] = await Promise.all([
                    platformGateway.getAdminUsers(),
                    platformGateway.getAdminStats(),
                    platformGateway.getEvents()
                ])
                if (!isMounted) return
                setUsers(usersResp.data.items)
                setStats(statsResp.data)
                setEvents(eventsResp.data.items)
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

    const handleTabClick = (tab: 'members' | 'news' | 'resources' | 'events') => {
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
            setStatusMessage(getApiErrorMessage(error, 'Erreur lors de la publication.'))
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
            setStatusMessage(getApiErrorMessage(error, 'Erreur lors de la publication.'))
        }
    }

    async function handlePublishEvent(e: React.FormEvent) {
        e.preventDefault()
        try {
            let coverImage = eventForm.coverImage
            if (coverImageFile) {
                const uploadResp = await platformGateway.uploadFile(coverImageFile)
                coverImage = uploadResp.data.url
            }
            await platformGateway.publishEvent({ ...eventForm, coverImage })
            setStatusMessage('Événement publié avec succès!')
            setEventForm({ title: '', description: '', url: '', coverImage: '' })
            setCoverImageFile(null)
            setCoverImagePreview('')
            const eventsResp = await platformGateway.getEvents()
            setEvents(eventsResp.data.items)
            setTimeout(() => setStatusMessage(''), 3000)
        } catch (error) {
            setStatusMessage(getApiErrorMessage(error, 'Erreur lors de la publication.'))
        }
    }

    async function handleDeleteEvent(id: string) {
        if (!confirm('Supprimer cet événement ?')) return
        try {
            await platformGateway.deleteEvent(id)
            setEvents(prev => prev.filter(ev => ev.id !== id))
            setStatusMessage('Événement supprimé.')
            setTimeout(() => setStatusMessage(''), 3000)
        } catch (error) {
            setStatusMessage(getApiErrorMessage(error, 'Erreur lors de la suppression.'))
        }
    }

    async function handleProfileTypeChange(userId: string, profileType: string) {
        try {
            await platformGateway.updateAdminProfileType(userId, profileType)
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, profile: { ...u.profile, profileType: profileType as 'alumni' | 'adherent' | 'membre' } } : u))
            setStatusMessage('Type de profil mis à jour.')
            setTimeout(() => setStatusMessage(''), 3000)
        } catch (error) {
            setStatusMessage(getApiErrorMessage(error, 'Erreur lors de la mise à jour du type.'))
        }
    }

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <span className="admin-brand-abc">ABC</span>
                    <span className="admin-brand-admin"> <span className="text-orange">Admin</span></span>
                </div>
                <nav className="admin-nav">
                    <div className="admin-nav-section">
                        <div className="admin-nav-section-title">Gestion</div>
                        <div className="admin-nav-section-links">
                            <a href="#members" className={activeTab === 'members' ? "active" : ""} onClick={(e) => { e.preventDefault(); handleTabClick('members'); }}><LayoutDashboard size={16} /> Dashboard & Membres</a>
                        </div>
                    </div>

                    <div className="admin-nav-section">
                        <div className="admin-nav-section-title">Publications</div>
                        <div className="admin-nav-section-links">
                            <a href="#news" className={activeTab === 'news' ? "active" : ""} onClick={(e) => { e.preventDefault(); handleTabClick('news'); }}><Newspaper size={16} /> Publier Actualité</a>
                            <a href="#events" className={activeTab === 'events' ? "active" : ""} onClick={(e) => { e.preventDefault(); handleTabClick('events'); }}><FolderOpen size={16} /> Publier Événement</a>
                            <a href="#resources" className={activeTab === 'resources' ? "active" : ""} onClick={(e) => { e.preventDefault(); handleTabClick('resources'); }}><FolderOpen size={16} /> Publier Ressource</a>
                        </div>
                    </div>
                </nav>
            </aside>
            <main className="admin-content">
                <nav className="admin-mobile-tabs" aria-label="Sections admin">
                    <button
                        type="button"
                        className={activeTab === 'members' ? 'active' : ''}
                        onClick={() => handleTabClick('members')}
                    >
                        Membres
                    </button>
                    <button
                        type="button"
                        className={activeTab === 'news' ? 'active' : ''}
                        onClick={() => handleTabClick('news')}
                    >
                        Actualité
                    </button>
                    <button
                        type="button"
                        className={activeTab === 'events' ? 'active' : ''}
                        onClick={() => handleTabClick('events')}
                    >
                        Événements
                    </button>
                    <button
                        type="button"
                        className={activeTab === 'resources' ? 'active' : ''}
                        onClick={() => handleTabClick('resources')}
                    >
                        Ressources
                    </button>
                </nav>

                {statusMessage && (
                    <div className="admin-status-message">{statusMessage}</div>
                )}

                {activeTab === 'members' && (
                    <>
                        <header className="admin-header">
                            <h1>Gestion des membres</h1>
                            <Button>+ Inviter un membre</Button>
                        </header>

                        <div className="admin-kpis">
                            <div className="admin-kpi-card">
                                <h2>{stats?.activeMembers ?? '—'}</h2>
                                <span>Membres actifs</span>
                            </div>
                            <div className="admin-kpi-card">
                                <h2>{stats?.pendingMembers ?? '—'}</h2>
                                <span>En attente</span>
                            </div>
                            <div className="admin-kpi-card">
                                <h2>{stats?.inactiveMembers ?? '—'}</h2>
                                <span>Inactifs</span>
                            </div>
                        </div>

                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Membre</th>
                                        <th>Promotion</th>
                                        <th>Type</th>
                                        <th>Secteur</th>
                                        <th>Statut</th>
                                        <th>Inscription</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length > 0 ? users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="admin-member-cell" data-label="Membre">
                                                <div className="table-user">
                                                    <div className={'avatar ' + getAvatarColor(user.profile.fullName)}>
                                                        {getInitials(user.profile.fullName)}
                                                    </div>
                                                    <div className="table-user-info">
                                                        <strong>{user.profile.fullName}</strong>
                                                        <span className="text-blue-light">{user.email || user.profile.email || '[email protected]'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Promotion">{user.profile.promotion || '2022'}</td>
                                            <td data-label="Type">
                                                <select
                                                    className="admin-inline-select"
                                                    value={user.profile.profileType || 'membre'}
                                                    onChange={(e) => handleProfileTypeChange(user.id, e.target.value)}
                                                >
                                                    <option value="alumni">Alumni</option>
                                                    <option value="adherent">Adhérent</option>
                                                    <option value="membre">Membre</option>
                                                </select>
                                            </td>
                                            <td data-label="Secteur">{user.profile.skills?.[0] || 'Conseil'}</td>
                                            <td data-label="Statut">
                                                <span className={`status-pill ${user.status === 'active' ? 'status-active' : 'status-pending'}`}>
                                                    {user.status === 'active' ? 'Actif' : 'En attente'}
                                                </span>
                                            </td>
                                            <td data-label="Inscription">Mars 2026</td>
                                        </tr>
                                    )) : (
                                        <>
                                            <tr>
                                                <td className="admin-member-cell" data-label="Membre">
                                                    <div className="table-user">
                                                        <div className="avatar avatar-blue">AK</div>
                                                        <div className="table-user-info">
                                                            <strong>Aminata Koné</strong>
                                                            <span className="text-blue-light">[email protected]</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="Promotion">2022</td>
                                                <td data-label="Type">Membre</td>
                                                <td data-label="Secteur">Conseil</td>
                                                <td data-label="Statut"><span className="status-pill status-active">Actif</span></td>
                                                <td data-label="Inscription">Janv. 2023</td>
                                            </tr>
                                            <tr>
                                                <td className="admin-member-cell" data-label="Membre">
                                                    <div className="table-user">
                                                        <div className="avatar avatar-orange">SD</div>
                                                        <div className="table-user-info">
                                                            <strong>Sébastien Diallo</strong>
                                                            <span className="text-blue-light">[email protected]</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="Promotion">2021</td>
                                                <td data-label="Type">Alumni</td>
                                                <td data-label="Secteur">Tech</td>
                                                <td data-label="Statut"><span className="status-pill status-active">Actif</span></td>
                                                <td data-label="Inscription">Mars 2022</td>
                                            </tr>
                                            <tr>
                                                <td className="admin-member-cell" data-label="Membre">
                                                    <div className="table-user">
                                                        <div className="avatar avatar-green">MN</div>
                                                        <div className="table-user-info">
                                                            <strong>Mariama Ndiaye</strong>
                                                            <span className="text-blue-light">[email protected]</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="Promotion">2023</td>
                                                <td data-label="Type">Adhérent</td>
                                                <td data-label="Secteur">Data</td>
                                                <td data-label="Statut"><span className="status-pill status-pending">En attente</span></td>
                                                <td data-label="Inscription">Mars 2026</td>
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
                        <div className="admin-table-wrapper admin-form-panel">
                            <form className="admin-form" onSubmit={handlePublishNews}>
                                <div className="admin-form-field">
                                    <label htmlFor="news-title">Titre</label>
                                    <input id="news-title" minLength={5} value={articleForm.title} onChange={e => setArticleForm({ ...articleForm, title: e.target.value })} required />
                                </div>
                                <div className="admin-form-field">
                                    <label htmlFor="news-category">Catégorie</label>
                                    <input id="news-category" minLength={2} placeholder="Ex: vie associative, carrière..." value={articleForm.category} onChange={e => setArticleForm({ ...articleForm, category: e.target.value })} required />
                                </div>
                                <div className="admin-form-field">
                                    <label htmlFor="news-content">Contenu</label>
                                    <textarea id="news-content" minLength={10} value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content: e.target.value })} required />
                                </div>
                                <label className="admin-form-checkbox">
                                    <input type="checkbox" checked={articleForm.urgent} onChange={e => setArticleForm({ ...articleForm, urgent: e.target.checked })} />
                                    <span>Communication urgente (Email à tous)</span>
                                </label>
                                <Button type="submit">Publier l'actualité</Button>
                            </form>
                        </div>
                    </>
                )}

                {activeTab === 'resources' && (
                    <>
                        <header className="admin-header">
                            <h1>Publier une ressource</h1>
                        </header>
                        <div className="admin-table-wrapper admin-form-panel">
                            <form className="admin-form" onSubmit={handlePublishResource}>
                                <div className="admin-form-field">
                                    <label htmlFor="res-title">Titre de la ressource</label>
                                    <input id="res-title" minLength={5} value={resourceForm.title} onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })} required />
                                </div>
                                <div className="admin-form-field">
                                    <label htmlFor="res-type">Type</label>
                                    <select id="res-type" value={resourceForm.type} onChange={e => setResourceForm({ ...resourceForm, type: e.target.value })}>
                                        <option value="pdf">Document / PDF</option>
                                        <option value="job">Offre d'emploi / Stage</option>
                                        <option value="link">Lien externe</option>
                                    </select>
                                </div>
                                <div className="admin-form-field">
                                    <label htmlFor="res-url">URL</label>
                                    <input id="res-url" type="url" placeholder="https://..." value={resourceForm.url} onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })} required />
                                </div>
                                <div className="admin-form-field">
                                    <label htmlFor="res-description">Description</label>
                                    <textarea id="res-description" rows={3} value={resourceForm.description} onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })} />
                                </div>
                                <label className="admin-form-checkbox">
                                    <input type="checkbox" checked={resourceForm.memberOnly} onChange={e => setResourceForm({ ...resourceForm, memberOnly: e.target.checked })} />
                                    <span>Réservé aux membres validés</span>
                                </label>
                                <Button type="submit">Publier la ressource</Button>
                            </form>
                        </div>
                    </>
                )}

                {activeTab === 'events' && (
                    <>
                        <header className="admin-header">
                            <h1>Publier un événement</h1>
                        </header>
                        <div className="admin-table-wrapper admin-form-panel">
                            <form className="admin-form" onSubmit={handlePublishEvent}>
                                <div className="admin-form-field">
                                    <label htmlFor="event-title">Titre</label>
                                    <input id="event-title" minLength={5} value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} required />
                                </div>
                                <div className="admin-form-field">
                                    <label htmlFor="event-cover">Image de couverture</label>
                                    <input
                                        id="event-cover"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={e => {
                                            const file = e.target.files?.[0] ?? null
                                            setCoverImageFile(file)
                                            setCoverImagePreview(file ? URL.createObjectURL(file) : '')
                                        }}
                                    />
                                    {coverImagePreview && (
                                        <img src={coverImagePreview} alt="Aperçu" className="event-cover-preview" />
                                    )}
                                </div>
                                <div className="admin-form-field">
                                    <label htmlFor="event-url">Lien de l'événement</label>
                                    <input id="event-url" type="url" placeholder="https://..." value={eventForm.url} onChange={e => setEventForm({ ...eventForm, url: e.target.value })} required />
                                </div>
                                <div className="admin-form-field">
                                    <label>Description</label>
                                    <RichTextEditor
                                        value={eventForm.description}
                                        onChange={(html) => setEventForm({ ...eventForm, description: html })}
                                        placeholder="Décrivez l'événement..."
                                    />
                                </div>
                                <Button type="submit">Publier l'événement</Button>
                            </form>
                        </div>

                        {events.length > 0 && (
                            <div className="admin-table-wrapper admin-events-list">
                                <h2 className="admin-events-list-title">Événements publiés</h2>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Titre</th>
                                            <th>Date</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map(ev => (
                                            <tr key={ev.id}>
                                                <td>{ev.title}</td>
                                                <td>{new Date(ev.createdAt).toLocaleDateString('fr-FR')}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="admin-delete-btn"
                                                        onClick={() => handleDeleteEvent(ev.id)}
                                                    >
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

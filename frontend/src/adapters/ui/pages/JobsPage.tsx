import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../../domain/httpError'
import type { JobOfferItem, PublishJobPayload } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { useAuthState } from '../../../application/hooks/useAuthState'
import { Button } from '../components/Button'
import { Briefcase, MapPin, Clock, Trash2 } from 'lucide-react'
import './JobsPage.css'

const CONTRACT_LABELS: Record<string, string> = {
    cdi: 'CDI',
    cdd: 'CDD',
    stage: 'Stage',
    freelance: 'Freelance',
    alternance: 'Alternance'
}

export function JobsPage() {
    const auth = useAuthState()
    const [items, setItems] = useState<JobOfferItem[]>([])
    const [showForm, setShowForm] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const [form, setForm] = useState<PublishJobPayload>({
        title: '',
        company: '',
        description: '',
        contractType: 'cdi',
        location: '',
        contactEmail: '',
        salary: '',
        externalUrl: ''
    })

    const loadJobs = async () => {
        const response = await platformGateway.getJobs()
        setItems(response.data.items)
    }

    useEffect(() => {
        platformGateway.getJobs().then((response) => setItems(response.data.items)).catch(() => { })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await platformGateway.publishJob(form)
            setStatusMessage('Offre publiée avec succès !')
            setForm({ title: '', company: '', description: '', contractType: 'cdi', location: '', contactEmail: '', salary: '', externalUrl: '' })
            setShowForm(false)
            await loadJobs()
            setTimeout(() => setStatusMessage(''), 3000)
        } catch (error) {
            setStatusMessage(getApiErrorMessage(error, 'Erreur lors de la publication'))
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cette offre ?')) return
        try {
            await platformGateway.deleteJob(id)
            await loadJobs()
            setStatusMessage('Offre supprimée.')
            setTimeout(() => setStatusMessage(''), 3000)
        } catch (error) {
            setStatusMessage(getApiErrorMessage(error, 'Erreur lors de la suppression'))
        }
    }

    const formatDate = (iso: string) => {
        const d = new Date(iso)
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    return (
        <section className="page-stack">
            <div className="jobs-header">
                <h1>Offres d'emploi</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Fermer' : '+ Publier une offre'}
                </Button>
            </div>

            {statusMessage && (
                <div className="auth-error" style={{ background: statusMessage.includes('succès') ? '#d4edda' : undefined, color: statusMessage.includes('succès') ? '#155724' : undefined }}>
                    {statusMessage}
                </div>
            )}

            {showForm && (
                <form className="panel jobs-form" onSubmit={handleSubmit}>
                    <div className="grid-two">
                        <label>
                            Titre du poste *
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required minLength={5} />
                        </label>
                        <label>
                            Entreprise *
                            <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} required />
                        </label>
                    </div>
                    <div className="grid-two">
                        <label>
                            Type de contrat *
                            <select value={form.contractType} onChange={e => setForm({ ...form, contractType: e.target.value })}>
                                <option value="cdi">CDI</option>
                                <option value="cdd">CDD</option>
                                <option value="stage">Stage</option>
                                <option value="freelance">Freelance</option>
                                <option value="alternance">Alternance</option>
                            </select>
                        </label>
                        <label>
                            Lieu *
                            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
                        </label>
                    </div>
                    <label>
                        Description *
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required minLength={20} rows={5} />
                    </label>
                    <div className="grid-two">
                        <label>
                            Email de contact *
                            <input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} required />
                        </label>
                        <label>
                            Salaire (optionnel)
                            <input value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="ex: 45-55k€" />
                        </label>
                    </div>
                    <label>
                        Lien externe (optionnel)
                        <input type="url" value={form.externalUrl} onChange={e => setForm({ ...form, externalUrl: e.target.value })} placeholder="https://..." />
                    </label>
                    <div className="form-actions">
                        <Button type="submit">Publier l'offre</Button>
                    </div>
                </form>
            )}

            {items.length === 0 && !showForm ? (
                <div className="empty-state panel">
                    <Briefcase size={40} className="empty-state-icon" />
                    <p>Aucune offre d'emploi pour le moment.</p>
                    <p>Soyez le premier à publier une opportunité !</p>
                </div>
            ) : (
                <div className="jobs-list">
                    {items.map((item) => (
                        <article key={item.id} className="panel job-card">
                            <div className="job-card-header">
                                <h3>{item.title}</h3>
                                <span className="job-company">{item.company}</span>
                            </div>
                            <div className="job-meta">
                                <span className="job-meta-item">
                                    <Briefcase size={14} />
                                    {CONTRACT_LABELS[item.contractType] || item.contractType}
                                </span>
                                <span className="job-meta-item">
                                    <MapPin size={14} />
                                    {item.location}
                                </span>
                                <span className="job-meta-item">
                                    <Clock size={14} />
                                    {formatDate(item.createdAt)}
                                </span>
                            </div>
                            <p className="job-description">{item.description}</p>
                            {item.salary && <p className="job-salary">💰 {item.salary}</p>}
                            <div className="job-actions">
                                <a href={`mailto:${item.contactEmail}`} className="job-contact-link">
                                    📧 Contacter — {item.contactEmail}
                                </a>
                                {item.externalUrl && (
                                    <a href={item.externalUrl} target="_blank" rel="noreferrer" className="job-external-link">
                                        🔗 Voir l'offre
                                    </a>
                                )}
                                {(auth.user?.id === item.authorId || auth.user?.role === 'admin') && (
                                    <button
                                        type="button"
                                        className="job-delete-btn"
                                        onClick={() => handleDelete(item.id)}
                                        title="Supprimer l'offre"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}

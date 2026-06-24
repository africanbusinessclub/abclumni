import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../domain/httpError'
import type { PublicProfile } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { ExternalLink, Phone, Mail, MapPin, Briefcase, ArrowLeft, FileText, Download } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import './MemberProfilePage.css'

function getAvailabilityLabel(value: string) {
    if (value === 'networking') return 'Networking'
    if (value === 'mentoring') return 'Mentorat'
    if (value === 'recruiting') return 'Recrutement'
    return null
}

function getAvailabilityColor(label: string) {
    if (label === 'Networking') return 'pill-blue'
    if (label === 'Mentorat') return 'pill-green'
    if (label === 'Recrutement') return 'pill-amber'
    return 'pill-gray'
}

function getExperienceLabel(value: string) {
    if (value === 'junior') return 'Junior (0–3 ans)'
    if (value === 'junior_plus') return 'Junior+ (3–5 ans)'
    if (value === 'senior') return 'Sénior (5–10 ans)'
    if (value === 'senior_plus') return 'Sénior+ (10–15 ans)'
    if (value === 'expert') return 'Expert (+15 ans)'
    return null
}

type State = { loading: boolean; profile: PublicProfile | null; error: string }

export function MemberProfilePage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [state, setState] = useState<State>({ loading: true, profile: null, error: '' })

    useEffect(() => {
        if (!id) return
        let isMounted = true
        async function load() {
            try {
                const res = await platformGateway.getAlumniById(id!)
                if (!isMounted) return
                setState({ loading: false, profile: res.data, error: '' })
            } catch (err) {
                if (!isMounted) return
                setState({ loading: false, profile: null, error: getApiErrorMessage(err, 'Impossible de charger ce profil') })
            }
        }
        void load()
        return () => { isMounted = false }
    }, [id])

    return (
        <section className="member-profile-page">
            <button className="back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} />
                Retour
            </button>

            {state.loading && (
                <div className="panel member-profile-skeleton">
                    <div className="skeleton-avatar" />
                    <div className="skeleton-lines">
                        <div className="skeleton-line w-40" />
                        <div className="skeleton-line w-60" />
                        <div className="skeleton-line w-80" />
                    </div>
                </div>
            )}

            {state.error && <p className="error-text">{state.error}</p>}

            {!state.loading && state.profile && (
                <div className="member-profile-layout">
                    {/* Left card */}
                    <aside className="panel member-profile-aside">
                        <Avatar name={state.profile.fullName} photo={state.profile.photo} size="avatar-xl" />
                        <h1 className="member-name">{state.profile.fullName}</h1>
                        {state.profile.promotion && (
                            <p className="member-promotion">Promotion {state.profile.promotion}</p>
                        )}
                        {state.profile.availability && state.profile.availability !== 'none' && (() => {
                            const label = getAvailabilityLabel(state.profile.availability)
                            return label ? (
                                <span className={'availability-pill ' + getAvailabilityColor(label)}>
                                    {label}
                                </span>
                            ) : null
                        })()}
                        {state.profile.experience && (() => {
                            const label = getExperienceLabel(state.profile.experience)
                            return label ? (
                                <span className='availability-pill pill-gray'>
                                    {label}
                                </span>
                            ) : null
                        })()}

                        <div className="member-contact-list">
                            {state.profile.position || state.profile.company ? (
                                <div className="member-contact-item">
                                    <Briefcase size={15} />
                                    <span>{[state.profile.position, state.profile.company].filter(Boolean).join(' · ')}</span>
                                </div>
                            ) : null}
                            {state.profile.city && (
                                <div className="member-contact-item">
                                    <MapPin size={15} />
                                    <span>{state.profile.city}</span>
                                </div>
                            )}
                            {state.profile.email && (
                                <div className="member-contact-item">
                                    <Mail size={15} />
                                    <a href={`mailto:${state.profile.email}`}>{state.profile.email}</a>
                                </div>
                            )}
                            {state.profile.phone && (
                                <div className="member-contact-item">
                                    <Phone size={15} />
                                    <a href={`tel:${state.profile.phone}`}>{state.profile.phone}</a>
                                </div>
                            )}
                            {state.profile.linkedin && (
                                <div className="member-contact-item">
                                    <ExternalLink size={15} />
                                    <a href={state.profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Right content */}
                    <div className="member-profile-content">
                        {state.profile.bio && (
                            <div className="panel member-section">
                                <h2>À propos</h2>
                                <p className="member-bio">{state.profile.bio}</p>
                            </div>
                        )}

                        {state.profile.sector && (
                            <div className="panel member-section">
                                <h2>Secteur</h2>
                                <p>{state.profile.sector}</p>
                            </div>
                        )}

                        {state.profile.cv && (
                            <div className="panel member-section">
                                <h2>CV</h2>
                                <div className="cv-download-row">
                                    <FileText size={18} className="cv-download-icon" />
                                    <span>Curriculum Vitae</span>
                                    <a
                                        href={state.profile.cv}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="cv-download-link"
                                        download
                                    >
                                        <Download size={16} />
                                        Télécharger
                                    </a>
                                </div>
                            </div>
                        )}

                        {state.profile.skills && state.profile.skills.length > 0 && (
                            <div className="panel member-section">
                                <h2>Compétences</h2>
                                <div className="tag-list">
                                    {state.profile.skills.map((s) => (
                                        <span key={s} className="tag">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {state.profile.interests && state.profile.interests.length > 0 && (
                            <div className="panel member-section">
                                <h2>Centres d'intérêt</h2>
                                <div className="tag-list">
                                    {state.profile.interests.map((i) => (
                                        <span key={i} className="tag tag-alt">{i}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    )
}

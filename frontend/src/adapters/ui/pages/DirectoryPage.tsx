import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../domain/httpError'
import { initialDirectoryQuery } from '../../../domain/directoryQuery'
import { DirectoryQuery, PublicProfile } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { SkeletonGrid } from '../components/SkeletonGrid'
import { Search } from 'lucide-react'
import './DirectoryPage.css'

type DirectoryState = {
    loading: boolean
    items: PublicProfile[]
    error: string
    total: number
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

export function DirectoryPage() {
    const [query, setQuery] = useState(initialDirectoryQuery)
    const [result, setResult] = useState<DirectoryState>({ loading: true, items: [], error: '', total: 0 })
    const navigate = useNavigate()

    const load = async (nextQuery: DirectoryQuery, options = { showLoading: true }) => {
        if (options.showLoading) {
            setResult((prev) => ({ ...prev, loading: true, error: '' }))
        }
        try {
            const params = Object.fromEntries(Object.entries(nextQuery).filter(([, value]) => value)) as Record<string, string>
            const response = await platformGateway.getAlumni(params)
            setResult({ loading: false, items: response.data.items, total: response.data.meta.total, error: '' })
        } catch (error) {
            setResult({ loading: false, items: [], total: 0, error: getApiErrorMessage(error, 'Impossible de charger l\'annuaire') })
        }
    }

    useEffect(() => {
        let isMounted = true
        async function bootstrap() {
            try {
                const response = await platformGateway.getAlumni()
                if (!isMounted) return
                setResult({ loading: false, items: response.data.items, total: response.data.meta.total, error: '' })
            } catch (error) {
                if (!isMounted) return
                setResult({ loading: false, items: [], total: 0, error: getApiErrorMessage(error, 'Impossible de charger l\'annuaire') })
            }
        }
        void bootstrap()
        return () => {
            isMounted = false
        }
    }, [])

    return (
        <section className="directory-page">
            <div className="search-bar-container panel">
                <div className="search-input-wrapper">
                    <span className="search-icon"><Search size={18} /></span>
                    <input
                        type="text"
                        placeholder="Rechercher un alumni par nom, entreprise, compétence..."
                        value={query.q}
                        onChange={(e) => {
                            const newQuery = { ...query, q: e.target.value }
                            setQuery(newQuery)
                            void load(newQuery, { showLoading: false })
                        }}
                    />
                </div>
            </div>

            <div className="filter-bar panel">
                <select
                    aria-label="Filtrer par disponibilité"
                    title="Filtrer par disponibilité"
                    value={query.availability}
                    onChange={(e) => {
                        const newQuery = { ...query, availability: e.target.value }
                        setQuery(newQuery)
                        void load(newQuery)
                    }}
                >
                    <option value="">Disponibilité : Toutes</option>
                    <option value="networking">Networking</option>
                    <option value="mentoring">Mentorat</option>
                    <option value="recruiting">Recrutement</option>
                </select>

                <select
                    aria-label="Filtrer par secteur"
                    title="Filtrer par secteur"
                    value={query.sector}
                    onChange={(e) => {
                        const newQuery = { ...query, sector: e.target.value }
                        setQuery(newQuery)
                        void load(newQuery)
                    }}
                >
                    <option value="">Secteur : Tous</option>
                    <option value="finance">Finance</option>
                    <option value="tech">Tech</option>
                    <option value="consulting">Consulting</option>
                    <option value="health">Santé</option>
                </select>

                <select
                    aria-label="Trier les résultats"
                    title="Trier les résultats"
                    className="filter-select--right"
                    value={query.sort}
                    onChange={(e) => {
                        const newQuery = { ...query, sort: e.target.value as DirectoryQuery['sort'] }
                        setQuery(newQuery)
                        void load(newQuery)
                    }}
                >
                    <option value="relevance">Trier par pertinence</option>
                    <option value="name">Trier par nom</option>
                    <option value="promotion">Trier par promotion</option>
                </select>
            </div>

            {result.loading && <SkeletonGrid />}
            {result.error && <p className="error-text">{result.error}</p>}
            {!result.loading && !result.error && result.items.length === 0 && (
                <div className="empty-state panel">
                    <p>Aucun alumni trouvé pour cette recherche.</p>
                </div>
            )}
            {!result.loading && !result.error && result.items.length > 0 && (
                <div className="alumni-grid">
                    {result.items.map((item) => (
                        <article key={item.id} className="alumni-card alumni-card--clickable panel" onClick={() => navigate(`/members/${item.id}`)}>
                            <div className={'avatar avatar-lg ' + getAvatarColor(item.fullName)}>
                                {getInitials(item.fullName)}
                            </div>
                            <h3>{item.fullName}</h3>
                            <p>{item.position || 'Poste non renseigné'}, {item.company || 'Entreprise inconnue'}</p>
                            {item.availability && item.availability !== 'none' && (() => {
                                const label = getAvailabilityLabel(item.availability)
                                return label ? (
                                    <span className={'availability-pill ' + getAvailabilityColor(label)}>
                                        {label}
                                    </span>
                                ) : null
                            })()}
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}

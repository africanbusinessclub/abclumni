import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../../domain/httpError'
import { initialDirectoryQuery } from '../../../domain/directoryQuery'
import { DirectoryQuery, PublicProfile } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { SkeletonGrid } from '../components/SkeletonGrid'
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

function getAvailabilityColor(label: string) {
    if (label === 'Networking') return 'pill-blue'
    if (label === 'Mentoring' || label === 'Mentorat') return 'pill-green'
    if (label === 'Recruiting' || label === 'Recrutement') return 'pill-amber'
    return 'pill-gray'
}

export function DirectoryPage() {
    const [query, setQuery] = useState(initialDirectoryQuery)
    const [result, setResult] = useState<DirectoryState>({ loading: true, items: [], error: '', total: 0 })

    const load = async (nextQuery: DirectoryQuery, options = { showLoading: true }) => {
        if (options.showLoading) {
            setResult((prev) => ({ ...prev, loading: true, error: '' }))
        }
        try {
            const params = Object.fromEntries(Object.entries(nextQuery).filter(([, value]) => value)) as Record<string, string>
            const response = await platformGateway.getAlumni(params)
            setResult({ loading: false, items: response.data.items, total: response.data.meta.total, error: '' })
        } catch (error) {
            setResult({ loading: false, items: [], total: 0, error: getApiErrorMessage(error, 'Unable to load alumni') })
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
                setResult({ loading: false, items: [], total: 0, error: getApiErrorMessage(error, 'Unable to load alumni') })
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
                    <span className="search-icon">🔍</span>
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

            <div className="filter-bar panel" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', padding: '1rem', background: '#fff', borderRadius: '8px' }}>
                <select
                    value={query.availability}
                    onChange={(e) => {
                        const newQuery = { ...query, availability: e.target.value }
                        setQuery(newQuery)
                        void load(newQuery)
                    }}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">Disponibilité : Toutes</option>
                    <option value="networking">Networking</option>
                    <option value="mentoring">Mentoring</option>
                    <option value="recruiting">Recruiting</option>
                </select>

                <select
                    value={query.sector}
                    onChange={(e) => {
                        const newQuery = { ...query, sector: e.target.value }
                        setQuery(newQuery)
                        void load(newQuery)
                    }}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">Secteur : Tous</option>
                    <option value="finance">Finance</option>
                    <option value="tech">Tech</option>
                    <option value="consulting">Consulting</option>
                    <option value="health">Santé</option>
                </select>

                <select
                    value={query.sort}
                    onChange={(e) => {
                        const newQuery = { ...query, sort: e.target.value as DirectoryQuery['sort'] }
                        setQuery(newQuery)
                        void load(newQuery)
                    }}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', marginLeft: 'auto' }}
                >
                    <option value="relevance">Trier par pertinence</option>
                    <option value="name">Trier par nom</option>
                    <option value="promotion">Trier par promotion</option>
                </select>
            </div>

            {result.loading && <SkeletonGrid />}
            {result.error && <p className="error-text">{result.error}</p>}
            {!result.loading && !result.error && (
                <div className="alumni-grid">
                    {result.items.map((item) => (
                        <article key={item.id} className="alumni-card panel">
                            <div className={'avatar avatar-lg ' + getAvatarColor(item.fullName)}>
                                {getInitials(item.fullName)}
                            </div>
                            <h3>{item.fullName}</h3>
                            <p>{item.position || 'Role not set'}, {item.company || 'Unknown company'}</p>
                            {item.availability && item.availability !== 'none' && (
                                <span className={'availability-pill ' + getAvailabilityColor(item.availability)}>
                                    {item.availability}
                                </span>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}

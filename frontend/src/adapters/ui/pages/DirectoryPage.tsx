import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../domain/httpError'
import { initialDirectoryQuery } from '../../../domain/directoryQuery'
import { DirectoryQuery, PublicProfile } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { Avatar } from '../components/Avatar'
import { Search, Users, MapPin, Building2, GraduationCap, SlidersHorizontal, X } from 'lucide-react'
import './DirectoryPage.css'

type DirectoryState = {
    loading: boolean
    items: PublicProfile[]
    error: string
    total: number
}

const AVAILABILITY_OPTIONS = [
    { value: '', label: 'Disponibilité : Toutes' },
    { value: 'networking', label: 'Networking' },
    { value: 'mentoring', label: 'Mentorat' },
    { value: 'recruiting', label: 'Recrutement' },
] as const

const PROFILE_TYPE_OPTIONS = [
    { value: '', label: 'Type : Tous' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'adherent', label: 'Adhérent' },
    { value: 'membre', label: 'Membre' },
] as const

const SECTOR_OPTIONS = [
    { value: '', label: 'Secteur : Tous' },
    { value: 'finance', label: 'Finance' },
    { value: 'tech', label: 'Tech' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'health', label: 'Santé' },
] as const

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Pertinence' },
    { value: 'name', label: 'Nom' },
    { value: 'promotion', label: 'Promotion' },
] as const

const DEBOUNCE_MS = 300

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

function getProfileTypeLabel(value: string) {
    if (value === 'alumni') return 'Alumni'
    if (value === 'adherent') return 'Adhérent'
    if (value === 'membre') return 'Membre'
    return null
}

function getProfileTypeClass(value: string) {
    if (value === 'alumni') return 'type-alumni'
    if (value === 'adherent') return 'type-adherent'
    if (value === 'membre') return 'type-membre'
    return ''
}

type FilterChip = { key: string; label: string; value: string }

function buildFilterChips(query: DirectoryQuery): FilterChip[] {
    const chips: FilterChip[] = []
    if (query.availability) chips.push({ key: 'availability', label: 'Dispo', value: getAvailabilityLabel(query.availability) || query.availability })
    if (query.profileType) chips.push({ key: 'profileType', label: 'Type', value: getProfileTypeLabel(query.profileType) || query.profileType })
    if (query.sector) chips.push({ key: 'sector', label: 'Secteur', value: query.sector.charAt(0).toUpperCase() + query.sector.slice(1) })
    return chips
}

export function DirectoryPage() {
    const [query, setQuery] = useState(initialDirectoryQuery)
    const [result, setResult] = useState<DirectoryState>({ loading: true, items: [], error: '', total: 0 })
    const [filtersOpen, setFiltersOpen] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const navigate = useNavigate()

    const load = useCallback(async (nextQuery: DirectoryQuery, options = { showLoading: true }) => {
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
    }, [])

    const handleSearchChange = useCallback((value: string) => {
        const newQuery = { ...query, q: value }
        setQuery(newQuery)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            void load(newQuery, { showLoading: false })
        }, DEBOUNCE_MS)
    }, [query, load])

    const handleFilterChange = useCallback((key: string, value: string) => {
        const newQuery = { ...query, [key]: value }
        setQuery(newQuery)
        void load(newQuery)
    }, [query, load])

    const handleSortChange = useCallback((value: string) => {
        const newQuery = { ...query, sort: value as DirectoryQuery['sort'] }
        setQuery(newQuery)
        void load(newQuery)
    }, [query, load])

    const clearFilter = useCallback((key: string) => {
        const newQuery = { ...query, [key]: '' }
        setQuery(newQuery)
        void load(newQuery)
    }, [query, load])

    const clearAllFilters = useCallback(() => {
        const newQuery = { ...query, availability: '', profileType: '', sector: '' }
        setQuery(newQuery)
        void load(newQuery)
    }, [query, load])

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

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [])

    const filterChips = buildFilterChips(query)
    const hasActiveFilters = filterChips.length > 0

    return (
        <section className="directory-page">
            {/* Page Header */}
            <header className="directory-header">
                <div className="directory-header-text">
                    <h1>Annuaire</h1>
                    {!result.loading && !result.error && (
                        <span className="directory-count">
                            {result.total} membre{result.total !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </header>

            {/* Search Bar */}
            <div className="search-bar-container panel">
                <div className="search-input-wrapper">
                    <span className="search-icon"><Search size={18} /></span>
                    <input
                        type="text"
                        placeholder="Rechercher par nom, entreprise, compétence..."
                        value={query.q}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        aria-label="Rechercher dans l'annuaire"
                    />
                    {query.q && (
                        <button
                            className="search-clear"
                            onClick={() => handleSearchChange('')}
                            aria-label="Effacer la recherche"
                            type="button"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-bar-top">
                    <button
                        className={`filter-toggle ${filtersOpen ? 'filter-toggle--active' : ''}`}
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        aria-expanded={filtersOpen}
                        type="button"
                    >
                        <SlidersHorizontal size={16} />
                        <span>Filtres</span>
                        {hasActiveFilters && <span className="filter-badge">{filterChips.length}</span>}
                    </button>

                    <div className="filter-sort-wrapper">
                        <span className="sort-label">Trier par</span>
                        <div className="sort-options">
                            {SORT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    className={`sort-chip ${query.sort === opt.value ? 'sort-chip--active' : ''}`}
                                    onClick={() => handleSortChange(opt.value)}
                                    type="button"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {filtersOpen && (
                    <div className="filter-controls">
                        <select
                            aria-label="Filtrer par disponibilité"
                            value={query.availability}
                            onChange={(e) => handleFilterChange('availability', e.target.value)}
                        >
                            {AVAILABILITY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        <select
                            aria-label="Filtrer par type de profil"
                            value={query.profileType}
                            onChange={(e) => handleFilterChange('profileType', e.target.value)}
                        >
                            {PROFILE_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        <select
                            aria-label="Filtrer par secteur"
                            value={query.sector}
                            onChange={(e) => handleFilterChange('sector', e.target.value)}
                        >
                            {SECTOR_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
                <div className="active-filters">
                    {filterChips.map((chip) => (
                        <span key={chip.key} className="filter-chip">
                            <span className="filter-chip-label">{chip.label}</span>
                            <span className="filter-chip-value">{chip.value}</span>
                            <button
                                className="filter-chip-remove"
                                onClick={() => clearFilter(chip.key)}
                                aria-label={`Retirer le filtre ${chip.label}`}
                                type="button"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                    {filterChips.length > 1 && (
                        <button
                            className="filter-clear-all"
                            onClick={clearAllFilters}
                            type="button"
                        >
                            Tout effacer
                        </button>
                    )}
                </div>
            )}

            {/* Results */}
            {result.loading && (
                <div className="alumni-grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="alumni-card alumni-card--skeleton panel" aria-hidden="true">
                            <div className="skeleton-avatar" />
                            <div className="skeleton-line skeleton-line--name" />
                            <div className="skeleton-line skeleton-line--role" />
                            <div className="skeleton-line skeleton-line--meta" />
                        </div>
                    ))}
                </div>
            )}

            {result.error && (
                <div className="empty-state panel" role="alert">
                    <Users size={40} className="empty-state-icon" />
                    <p className="empty-state-title">Erreur de chargement</p>
                    <p>{result.error}</p>
                </div>
            )}

            {!result.loading && !result.error && result.items.length === 0 && (
                <div className="empty-state panel">
                    <Users size={40} className="empty-state-icon" />
                    <p className="empty-state-title">Aucun membre trouvé</p>
                    <p>Essayez de modifier vos critères de recherche ou vos filtres.</p>
                    {hasActiveFilters && (
                        <button className="empty-state-action" onClick={clearAllFilters} type="button">
                            Réinitialiser les filtres
                        </button>
                    )}
                </div>
            )}

            {!result.loading && !result.error && result.items.length > 0 && (
                <div className="alumni-grid" role="list" aria-label="Liste des membres">
                    {result.items.map((item) => {
                        const availabilityLabel = item.availability && item.availability !== 'none'
                            ? getAvailabilityLabel(item.availability)
                            : null
                        const profileTypeClass = getProfileTypeClass(item.profileType)
                        const profileTypeLabel = getProfileTypeLabel(item.profileType)

                        return (
                            <article
                                key={item.id}
                                className={`alumni-card panel ${profileTypeClass}`}
                                role="listitem"
                                tabIndex={0}
                                onClick={() => navigate(`/members/${item.id}`)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        navigate(`/members/${item.id}`)
                                    }
                                }}
                                aria-label={`${item.fullName}, ${item.position || 'Poste non renseigné'} chez ${item.company || 'Entreprise inconnue'}`}
                            >
                                <div className="alumni-card-avatar">
                                    <Avatar name={item.fullName} photo={item.photo} size="avatar-lg" />
                                    {profileTypeLabel && (
                                        <span className={`profile-type-badge ${profileTypeClass}`}>
                                            {profileTypeLabel}
                                        </span>
                                    )}
                                </div>

                                <h3 className="alumni-card-name">{item.fullName}</h3>

                                <p className="alumni-card-role">
                                    {item.position || 'Poste non renseigné'}
                                    {item.company && (
                                        <span className="alumni-card-company">
                                            <Building2 size={13} />
                                            {item.company}
                                        </span>
                                    )}
                                </p>

                                <div className="alumni-card-meta">
                                    {item.promotion && (
                                        <span className="alumni-card-meta-item">
                                            <GraduationCap size={13} />
                                            {item.promotion}
                                        </span>
                                    )}
                                    {item.city && (
                                        <span className="alumni-card-meta-item">
                                            <MapPin size={13} />
                                            {item.city}
                                        </span>
                                    )}
                                </div>

                                {availabilityLabel && (
                                    <span className={'availability-pill ' + getAvailabilityColor(availabilityLabel)}>
                                        {availabilityLabel}
                                    </span>
                                )}
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

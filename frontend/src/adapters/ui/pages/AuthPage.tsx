import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../domain/httpError'
import type { LoginPayload, RegisterPayload } from '../../../domain/types'
import { Button } from '../components/Button'
import { AbcLogo } from '../../../assets/AbcLogo'
import './AuthPage.css'

export function AuthPage({
    onLogin,
    onRegister
}: {
    onLogin: (payload: LoginPayload) => Promise<void>
    onRegister: (payload: RegisterPayload) => Promise<void>
}) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [mode, setMode] = useState<'login' | 'register'>(
        searchParams.get('m') === 'register' ? 'register' : 'login'
    )

    useEffect(() => {
        const m = searchParams.get('m')
        if (m === 'login' || m === 'register') {
            setMode(m)
        }
    }, [searchParams])

    const [credentials, setCredentials] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        promotion: '',
        acceptedTerms: false
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        setError('')
        try {
            if (mode === 'login') {
                await onLogin({ email: credentials.email, password: credentials.password })
            } else {
                await onRegister({
                    email: credentials.email,
                    password: credentials.password,
                    firstName: credentials.firstName,
                    lastName: credentials.lastName,
                    promotion: credentials.promotion,
                    acceptedTerms: credentials.acceptedTerms,
                    company: '',
                    sector: '',
                    position: '',
                    city: '',
                    linkedin: '',
                    phone: '',
                    skills: [],
                    interests: [],
                    availability: 'none'
                })
            }
        } catch (error) {
            setLoading(false)
            setError(getApiErrorMessage(error, 'Échec de l\'authentification'))
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <AbcLogo size={44} />
                    <p className="auth-tagline">Réseau des alumnis de l'African Business Club</p>
                </div>

                <h2 className="auth-title">
                    {mode === 'login' ? 'Connexion' : 'Inscription'}
                </h2>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={submit}>
                    {mode === 'register' && (
                        <>
                            <div className="auth-form-field">
                                <label htmlFor="firstName">Prénom</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    autoComplete="given-name"
                                    value={credentials.firstName}
                                    onChange={(e) => setCredentials({ ...credentials, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="auth-form-field">
                                <label htmlFor="lastName">Nom de famille</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    autoComplete="family-name"
                                    value={credentials.lastName}
                                    onChange={(e) => setCredentials({ ...credentials, lastName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="auth-form-field">
                                <label htmlFor="promotion">Promotion (ex: 2024)</label>
                                <input
                                    type="text"
                                    id="promotion"
                                    value={credentials.promotion}
                                    onChange={(e) => setCredentials({ ...credentials, promotion: e.target.value })}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="auth-form-field">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            autoComplete="email"
                            value={credentials.email}
                            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="auth-form-field">
                        <label htmlFor="password">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            required
                        />
                        {mode === 'register' && (
                            <small className="auth-form-hint">
                                Min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre.
                            </small>
                        )}
                    </div>

                    {mode === 'register' && (
                        <div className="auth-form-checkbox">
                            <input
                                type="checkbox"
                                id="acceptedTerms"
                                checked={credentials.acceptedTerms}
                                onChange={(e) => setCredentials({ ...credentials, acceptedTerms: e.target.checked })}
                                required
                            />
                            <label htmlFor="acceptedTerms">
                                J'accepte les conditions d'utilisation
                            </label>
                        </div>
                    )}

                    <Button type="submit" disabled={loading}>
                        {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
                    </Button>
                </form>

                <div className="auth-form-footer">
                    {mode === 'login' ? (
                        <p>Pas encore de compte ? <Link to="?m=register">S'inscrire</Link></p>
                    ) : (
                        <p>Déjà un compte ? <Link to="?m=login">Se connecter</Link></p>
                    )}
                </div>
            </div>
        </div>
    )
}

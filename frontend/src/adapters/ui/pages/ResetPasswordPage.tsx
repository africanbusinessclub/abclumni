import { useState, type FormEvent } from 'react'
import { Link, useSearchParams, Navigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../domain/httpError'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { Button } from '../components/Button'
import { AbcLogo } from '../../../assets/AbcLogo'
import './AuthPage.css'

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [error, setError] = useState('')

    if (!token) {
        return <Navigate to="/auth?m=login" replace />
    }

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)
        setError('')
        try {
            await platformGateway.resetPassword(token, password)
            setStatus('success')
        } catch (err) {
            setError(getApiErrorMessage(err, "Une erreur est survenue"))
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    if (status === 'success') {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-hero">
                        <AbcLogo />
                    </div>
                    <div className="auth-success">
                        <h2>Mot de passe modifié !</h2>
                        <p>Votre mot de passe a été réinitialisé avec succès.</p>
                        <Link to="/auth?m=login" className="auth-link">Se connecter</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-hero">
                    <AbcLogo />
                </div>
                <h2>Nouveau mot de passe</h2>
                <p className="auth-subtitle">Choisissez un nouveau mot de passe pour votre compte.</p>
                <form className="auth-form" onSubmit={submit}>
                    <div className="auth-form-field">
                        <label htmlFor="password">Nouveau mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <small className="auth-form-hint">
                            Min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre.
                        </small>
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Modification...' : 'Réinitialiser le mot de passe'}
                    </Button>
                </form>
                {error && <p className="auth-error">{error}</p>}
                <div className="auth-form-footer">
                    <Link to="/auth?m=login">Retour à la connexion</Link>
                </div>
            </div>
        </div>
    )
}

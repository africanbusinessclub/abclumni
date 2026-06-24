import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../domain/httpError'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { Button } from '../components/Button'
import { AbcLogo } from '../../../assets/AbcLogo'
import './AuthPage.css'

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
    const [error, setError] = useState('')

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)
        setError('')
        try {
            await platformGateway.forgotPassword(email)
            setStatus('sent')
        } catch (err) {
            setError(getApiErrorMessage(err, "Une erreur est survenue"))
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    if (status === 'sent') {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-hero">
                        <AbcLogo />
                    </div>
                    <div className="auth-success">
                        <h2>E-mail envoyé !</h2>
                        <p>Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation dans quelques minutes.</p>
                        <p>Pensez à vérifier vos spams.</p>
                        <Link to="/auth?m=login" className="auth-link">Retour à la connexion</Link>
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
                <h2>Mot de passe oublié</h2>
                <p className="auth-subtitle">Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</p>
                <form className="auth-form" onSubmit={submit}>
                    <div className="auth-form-field">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
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

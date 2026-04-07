import { type Dispatch, type FormEvent, type SetStateAction, useState } from 'react'
import { getApiErrorMessage } from '../../../domain/httpError'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { splitCsv } from '../../../domain/splitCsv'
import type { AuthUser, Availability, ProfileUpdatePayload } from '../../../domain/types'
import { Button } from '../components/Button'
import './ProfilePage.css'

type ProfilePageProps = {
    user: AuthUser
    onUserUpdate: Dispatch<SetStateAction<AuthUser | null>>
    onLogout: () => void
}

type ProfileForm = Omit<ProfileUpdatePayload, 'skills' | 'interests'> & {
    skills: string
    interests: string
}

export function ProfilePage({ user, onUserUpdate, onLogout }: ProfilePageProps) {
    const [form, setForm] = useState<ProfileForm>(() => ({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        promotion: user.profile.promotion || '',
        photo: user.profile.photo || '',
        bio: user.profile.bio || '',
        city: user.profile.city || '',
        position: user.profile.position || '',
        company: user.profile.company || '',
        sector: user.profile.sector || '',
        linkedin: user.profile.linkedin || '',
        phone: user.profile.phone || '',
        availability: user.profile.availability,
        isMasked: user.profile.isMasked,
        visibility: user.profile.visibility || {
            email: true,
            linkedin: true,
            phone: false,
            city: true,
            company: true,
            position: true,
            skills: true,
            interests: true
        },
        skills: (user.profile.skills || []).join(', '),
        interests: (user.profile.interests || []).join(', ')
    }))
    const [status, setStatus] = useState('')
    const [busy, setBusy] = useState(false)

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setBusy(true)
        setStatus('')
        try {
            const payload = { ...form, skills: splitCsv(form.skills), interests: splitCsv(form.interests) }
            const response = await platformGateway.updateProfile(payload)
            onUserUpdate((prev) => (prev ? { ...prev, profile: response.data.profile } : prev))
            setStatus('Profile updated.')
        } catch (error) {
            setStatus(getApiErrorMessage(error, 'Unable to update profile'))
        } finally {
            setBusy(false)
        }
    }

    const deleteAccount = async () => {
        const confirmed = window.confirm('Delete your account and all related data?')
        if (!confirmed) return
        await platformGateway.deleteAccount()
        onLogout()
    }

    return (
        <section className="page-stack">
            <h1>Profile & Privacy</h1>
            <form className="panel stack-form" onSubmit={save}>
                <div className="grid-two">
                    <label>First name<input value={form.firstName || ''} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} /></label>
                    <label>Last name<input value={form.lastName || ''} onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))} /></label>
                </div>
                <div className="grid-two">
                    <label>Promotion<input value={form.promotion || ''} onChange={(event) => setForm((prev) => ({ ...prev, promotion: event.target.value }))} /></label>
                    <label>Availability<select value={form.availability || 'none'} onChange={(event) => setForm((prev) => ({ ...prev, availability: event.target.value as Availability }))}><option value="none">Not specified</option><option value="networking">Networking</option><option value="mentoring">Mentoring</option><option value="recruiting">Recruiting</option></select></label>
                </div>
                <div className="grid-two">
                    <label>Position<input value={form.position || ''} onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))} /></label>
                    <label>Company<input value={form.company || ''} onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))} /></label>
                </div>
                <div className="grid-two">
                    <label>City<input value={form.city || ''} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} /></label>
                    <label>Sector<input value={form.sector || ''} onChange={(event) => setForm((prev) => ({ ...prev, sector: event.target.value }))} /></label>
                </div>
                <label>Bio<textarea value={form.bio || ''} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} rows={4} /></label>
                <div className="grid-two">
                    <label>Skills<input value={form.skills || ''} onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))} /></label>
                    <label>Interests<input value={form.interests || ''} onChange={(event) => setForm((prev) => ({ ...prev, interests: event.target.value }))} /></label>
                </div>

                <h3>Visibility controls</h3>
                <div className="visibility-grid">
                    {Object.entries(form.visibility || {}).map(([key, value]) => (
                        <label key={key}>
                            <input
                                type="checkbox"
                                checked={value}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        visibility: { ...prev.visibility, [key]: event.target.checked }
                                    }))
                                }
                            />
                            {key}
                        </label>
                    ))}
                </div>

                <div className="form-actions">
                    <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</Button>
                    <Button type="button" variant="danger" onClick={deleteAccount}>Delete account</Button>
                </div>
                {status && <p>{status}</p>}
            </form>
        </section>
    )
}

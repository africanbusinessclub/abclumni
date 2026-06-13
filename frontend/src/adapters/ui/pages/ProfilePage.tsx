import { type Dispatch, type FormEvent, type SetStateAction, useRef, useState } from 'react'
import { getApiErrorMessage } from '../../../domain/httpError'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { splitCsv } from '../../../domain/splitCsv'
import type { AuthUser, Availability, Experience, ProfileType, ProfileUpdatePayload } from '../../../domain/types'
import { Button } from '../components/Button'
import { Avatar } from '../components/Avatar'
import { Camera, Loader2 } from 'lucide-react'
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
        experience: user.profile.experience || '',
        profileType: user.profile.profileType || 'membre',
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
    const [photoUploading, setPhotoUploading] = useState(false)
    const photoInputRef = useRef<HTMLInputElement>(null)

    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        setPhotoUploading(true)
        setStatus('')
        try {
            const response = await platformGateway.uploadProfilePhoto(file)
            const newPhoto = response.data.profile.photo
            setForm((prev) => ({ ...prev, photo: newPhoto }))
            onUserUpdate((prev) => (prev ? { ...prev, profile: response.data.profile } : prev))
            setStatus('Photo mise à jour.')
        } catch (error) {
            setStatus(getApiErrorMessage(error, 'Impossible de mettre à jour la photo'))
        } finally {
            setPhotoUploading(false)
            if (photoInputRef.current) photoInputRef.current.value = ''
        }
    }

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setBusy(true)
        setStatus('')
        try {
            const payload = { ...form, skills: splitCsv(form.skills), interests: splitCsv(form.interests) }
            const response = await platformGateway.updateProfile(payload)
            onUserUpdate((prev) => (prev ? { ...prev, profile: response.data.profile } : prev))
            setStatus('Profil mis à jour.')
        } catch (error) {
            setStatus(getApiErrorMessage(error, 'Impossible de mettre à jour le profil'))
        } finally {
            setBusy(false)
        }
    }

    const deleteAccount = async () => {
        const confirmed = window.confirm('Supprimer votre compte et toutes les données associées ?')
        if (!confirmed) return
        await platformGateway.deleteAccount()
        onLogout()
    }

    const visibilityLabels: Record<string, string> = {
        email: 'E-mail',
        linkedin: 'LinkedIn',
        phone: 'Téléphone',
        city: 'Ville',
        company: 'Entreprise',
        position: 'Poste',
        skills: 'Compétences',
        interests: "Centres d'intérêt"
    }

    return (
        <section className="page-stack">
            <h1>Profil & Confidentialité</h1>
            <form className="panel stack-form" onSubmit={save}>
                <div className="photo-upload-section">
                    <label className="photo-avatar-trigger" aria-label="Modifier la photo de profil">
                        <Avatar
                            name={`${form.firstName} ${form.lastName}`}
                            photo={form.photo || null}
                            size="avatar-xl"
                            className="photo-avatar"
                        />
                        <span className="photo-avatar-overlay" aria-hidden="true">
                            {photoUploading
                                ? <Loader2 size={22} className="photo-spinner" />
                                : <Camera size={22} />}
                        </span>
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="photo-file-input"
                            onChange={handlePhotoChange}
                            disabled={photoUploading}
                        />
                    </label>
                    <p className="photo-hint">
                        {photoUploading ? 'Envoi en cours…' : 'Cliquer pour modifier · JPG, PNG, WEBP · max 5 Mo'}
                    </p>
                </div>
                <div className="grid-two">
                    <label>Prénom<input value={form.firstName || ''} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} /></label>
                    <label>Nom de famille<input value={form.lastName || ''} onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))} /></label>
                </div>
                <div className="grid-two">
                    <label>Promotion<input value={form.promotion || ''} onChange={(event) => setForm((prev) => ({ ...prev, promotion: event.target.value }))} /></label>
                    <label>Disponibilité<select value={form.availability || 'none'} onChange={(event) => setForm((prev) => ({ ...prev, availability: event.target.value as Availability }))}><option value="none">Non renseigné</option><option value="networking">Networking</option><option value="mentoring">Mentorat</option><option value="recruiting">Recrutement</option></select></label>
                </div>
                <div className="grid-two">
                    <label>Expérience<select value={form.experience || ''} onChange={(event) => setForm((prev) => ({ ...prev, experience: event.target.value as Experience }))}><option value="">Non renseigné</option><option value="junior">Junior (0–3 ans)</option><option value="junior_plus">Junior+ (3–5 ans)</option><option value="senior">Sénior (5–10 ans)</option><option value="senior_plus">Sénior+ (10–15 ans)</option><option value="expert">Expert (+15 ans)</option></select></label>
                    <label>Type de profil<select value={form.profileType} onChange={(event) => setForm((prev) => ({ ...prev, profileType: event.target.value as ProfileType }))}><option value="alumni">Alumni</option><option value="adherent">Adhérent</option><option value="membre">Membre</option></select></label>
                </div>
                <div className="grid-two">
                    <label>Poste<input value={form.position || ''} onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))} /></label>
                    <label>Entreprise<input value={form.company || ''} onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))} /></label>
                </div>
                <div className="grid-two">
                    <label>Ville<input value={form.city || ''} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} /></label>
                    <label>Secteur<input value={form.sector || ''} onChange={(event) => setForm((prev) => ({ ...prev, sector: event.target.value }))} /></label>
                </div>
                <label>Téléphone<input value={form.phone || ''} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} /></label>
                <label>Bio<textarea value={form.bio || ''} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} rows={4} /></label>
                <div className="grid-two">
                    <label>Compétences<input value={form.skills || ''} onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))} /></label>
                    <label>Centres d'intérêt<input value={form.interests || ''} onChange={(event) => setForm((prev) => ({ ...prev, interests: event.target.value }))} /></label>
                </div>

                <h3>Paramètres de visibilité</h3>
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
                            {visibilityLabels[key] || key}
                        </label>
                    ))}
                </div>

                <div className="form-actions">
                    <Button type="submit" disabled={busy}>{busy ? 'Sauvegarde...' : 'Enregistrer'}</Button>
                    <Button type="button" variant="danger" onClick={deleteAccount}>Supprimer le compte</Button>
                </div>
                {status && <p>{status}</p>}
            </form>
        </section>
    )
}

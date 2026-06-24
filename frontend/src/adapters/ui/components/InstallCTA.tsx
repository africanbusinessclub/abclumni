import { useState, useEffect, useCallback } from 'react'
import { Download, X } from 'lucide-react'
import './InstallCTA.css'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function InstallCTA() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [exiting, setExiting] = useState(false)

    useEffect(() => {
        // Check if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) return

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            // Delay appearance for a smooth entrance
            setTimeout(() => setVisible(true), 1000)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Also check on appinstalled
        const installedHandler = () => {
            setVisible(false)
            setDeferredPrompt(null)
        }
        window.addEventListener('appinstalled', installedHandler)

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
            window.removeEventListener('appinstalled', installedHandler)
        }
    }, [])

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return
        setExiting(true)
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setVisible(false)
            setDeferredPrompt(null)
        } else {
            setExiting(false)
        }
    }, [deferredPrompt])

    const handleDismiss = useCallback(() => {
        setExiting(true)
        setTimeout(() => {
            setDismissed(true)
            setVisible(false)
        }, 300)
    }, [])

    if (!visible || dismissed || !deferredPrompt) return null

    return (
        <div className={`install-cta ${exiting ? 'install-cta--exit' : ''}`} role="dialog" aria-label="Installer l'application">
            <div className="install-cta__inner">
                <div className="install-cta__icon">
                    <Download size={20} />
                </div>
                <div className="install-cta__body">
                    <p className="install-cta__title">Installer l'application</p>
                    <p className="install-cta__subtitle">Accédez au réseau ABC plus rapidement</p>
                </div>
                <button className="install-cta__action" onClick={handleInstall} type="button">
                    Installer
                </button>
                <button className="install-cta__dismiss" onClick={handleDismiss} type="button" aria-label="Fermer">
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}

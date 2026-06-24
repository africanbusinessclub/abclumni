import { useEffect, useState } from 'react'
import { BellOff } from 'lucide-react'
import type { NotificationItem } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { SkeletonGrid } from '../components/SkeletonGrid'
import { Button } from '../components/Button'
import './NotificationsPage.css'

function notificationTitle(type: string): string {
    switch (type) {
        case 'profile': return 'Profil'
        case 'profile-view': return 'Visite de profil'
        case 'news': return 'Actualité'
        case 'resource': return 'Ressource'
        case 'event': return 'Événement'
        case 'system': return 'Système'
        case 'account': return 'Compte'
        default: return type
    }
}

export function NotificationsPage() {
    const [items, setItems] = useState<NotificationItem[]>([])
    const [loading, setLoading] = useState(true)

    const load = async (showLoading = true) => {
        if (showLoading) setLoading(true)
        try {
            const response = await platformGateway.getNotifications()
            setItems(response.data.items)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        platformGateway.getNotifications()
            .then(response => setItems(response.data.items))
            .finally(() => setLoading(false))
    }, [])

    const update = async (id: string, type: 'read' | 'archive') => {
        await platformGateway.markNotification(id, type)
        await load()
    }

    return (
        <section className="page-stack">
            <h1>Notifications</h1>
            {loading ? <SkeletonGrid /> : items.length === 0 ? (
                <div className="empty-state panel">
                    <BellOff size={40} className="empty-state-icon" />
                    <p>Vous n'avez aucune notification pour le moment.</p>
                </div>
            ) : (
                <div className="panel list-panel">
                    {items.map((item) => (
                        <div key={item.id} className={`notice-item ${item.readAt ? 'read' : ''}`}>
                            <div className="notice-main">
                                <div className="notice-content">
                                    <strong>{notificationTitle(item.type)}</strong>
                                    <p>{item.message}</p>
                                    <small>{new Date(item.createdAt).toLocaleString()}</small>
                                </div>
                            </div>
                            <div className="notice-actions">
                                {!item.readAt && <Button size="sm" variant="secondary" type="button" onClick={() => update(item.id, 'read')}>Marquer comme lu</Button>}
                                <Button size="sm" variant="secondary" type="button" onClick={() => update(item.id, 'archive')}>Archiver</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}

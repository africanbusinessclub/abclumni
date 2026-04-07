import { useEffect, useState } from 'react'
import type { NotificationItem } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { SkeletonGrid } from '../components/SkeletonGrid'
import { Button } from '../components/Button'
import './NotificationsPage.css'

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
        void load(false)
    }, [])

    const update = async (id: string, type: 'read' | 'archive') => {
        await platformGateway.markNotification(id, type)
        await load()
    }

    return (
        <section className="page-stack">
            <h1>Notifications</h1>
            {loading ? <SkeletonGrid /> : (
                <div className="panel list-panel">
                    {items.map((item) => (
                        <div key={item.id} className={`notice-item ${item.readAt ? 'read' : ''}`}>
                            <div>
                                <strong>{item.type}</strong>
                                <p>{item.message}</p>
                                <small>{new Date(item.createdAt).toLocaleString()}</small>
                            </div>
                            <div className="notice-actions">
                                {!item.readAt && <Button size="sm" variant="secondary" type="button" onClick={() => update(item.id, 'read')}>Mark read</Button>}
                                <Button size="sm" variant="secondary" type="button" onClick={() => update(item.id, 'archive')}>Archive</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthState } from '../../../application/hooks/useAuthState'
import type { EventItem } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { Button } from '../components/Button'
import './EventsPage.css'

export function EventsPage() {
    const auth = useAuthState()
    const navigate = useNavigate()
    const [items, setItems] = useState<EventItem[]>([])

    useEffect(() => {
        platformGateway.getEvents().then((response) => setItems(response.data.items))
    }, [])

    return (
        <section className="page-stack">
            <div className="events-header">
                <h1>Événements</h1>
                {auth.user?.role === 'admin' && (
                    <Button onClick={() => navigate('/admin#events')}>+ Publier un événement</Button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="empty-state panel">
                    <p>Aucun événement pour le moment.</p>
                </div>
            ) : (
                <div className="card-grid">
                    {items.map((item) => (
                        <article key={item.id} className="panel event-card">
                            {item.coverImage && (
                                <div className="event-cover">
                                    <img src={item.coverImage} alt={item.title} className="event-cover-img" />
                                </div>
                            )}
                            <div className="event-card-body">
                                <h3>{item.title}</h3>
                                {item.description && (
                                    <div
                                        className="event-description"
                                        // description is HTML from rich text editor authored by trusted admins only
                                        dangerouslySetInnerHTML={{ __html: item.description }}
                                    />
                                )}
                                <a href={item.url} target="_blank" rel="noreferrer">Voir le lien</a>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}

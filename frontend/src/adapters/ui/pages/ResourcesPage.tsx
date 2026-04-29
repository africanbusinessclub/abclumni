import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthState } from '../../../application/hooks/useAuthState'
import type { ResourceItem } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { Button } from '../components/Button'
import './ResourcesPage.css'

export function ResourcesPage() {
    const auth = useAuthState()
    const navigate = useNavigate()
    const [items, setItems] = useState<ResourceItem[]>([])

    useEffect(() => {
        platformGateway.getResources().then((response) => setItems(response.data.items))
    }, [])

    return (
        <section className="page-stack">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Ressources membres</h1>
                {auth.user?.role === 'admin' && (
                    <Button onClick={() => navigate('/admin#resources')}>+ Publier une ressource</Button>
                )}
            </div>
            <div className="card-grid">
                {items.map((item) => (
                    <article key={item.id} className="panel resource-card">
                        <h3>{item.title}</h3>
                        <p>Type : {item.type}</p>
                        <a href={item.url} target="_blank" rel="noreferrer">Ouvrir la ressource</a>
                    </article>
                ))}
            </div>
        </section>
    )
}

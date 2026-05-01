import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthState } from '../../../application/hooks/useAuthState'
import type { NewsArticle } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { SkeletonGrid } from '../components/SkeletonGrid'
import { Button } from '../components/Button'
import './NewsPage.css'

export function NewsPage() {
    const auth = useAuthState()
    const navigate = useNavigate()
    const [items, setItems] = useState<NewsArticle[]>([])
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(true)

    const load = async (q = '', showLoading = true) => {
        if (showLoading) setLoading(true)
        try {
            const response = await platformGateway.getArticles(q ? { q } : {})
            setItems(response.data.items)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void load('', false)
    }, [])

    return (
        <section className="page-stack">
            <div className="news-header">
                <h1>Actualités de l'association</h1>
                {auth.user?.role === 'admin' && (
                    <Button onClick={() => navigate('/admin#news')}>+ Publier une actualité</Button>
                )}
            </div>
            <form className="panel inline-form" onSubmit={(event) => { event.preventDefault(); void load(query) }}>
                <input value={query} placeholder="Rechercher par titre, contenu ou tag" onChange={(event) => setQuery(event.target.value)} />
                <Button type="submit">Filtrer</Button>
            </form>

            {loading ? <SkeletonGrid /> : items.length === 0 ? (
                <div className="empty-state panel">
                    <p>Aucune actualité disponible pour le moment.</p>
                </div>
            ) : (
                <div className="card-grid">
                    {items.map((article) => (
                        <article key={article.id} className="panel article-card" onClick={() => navigate(`/news/${article.id}`)} style={{ cursor: 'pointer' }}>
                            <div className="article-meta"><span>{article.category}</span><small>{new Date(article.publishedAt).toLocaleDateString()}</small></div>
                            <h3>{article.title}</h3>
                            <p>{article.excerpt}</p>
                            <div className="tag-row">{article.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}

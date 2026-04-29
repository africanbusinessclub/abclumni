import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { NewsArticleDetail } from '../../../domain/types'
import { platformGateway } from '../../../infrastructure/repositories/platformGateway'
import { Button } from '../components/Button'
import './NewsDetailPage.css'

export function NewsDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [article, setArticle] = useState<NewsArticleDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!id) return
        setLoading(true)
        platformGateway.getArticle(id)
            .then((res) => setArticle(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return (
        <section className="page-stack">
            <div className="news-detail-skeleton" />
        </section>
    )

    if (error || !article) return (
        <section className="page-stack">
            <p>Article introuvable.</p>
            <Button onClick={() => navigate('/news')}>← Retour aux actualités</Button>
        </section>
    )

    return (
        <section className="page-stack">
            <Button variant="secondary" onClick={() => navigate('/news')}>← Retour aux actualités</Button>

            {article.coverImage && (
                <img className="news-detail-cover" src={article.coverImage} alt={article.title} />
            )}

            <div className="panel news-detail-body">
                <div className="article-meta">
                    <span>{article.category}</span>
                    <small>{new Date(article.publishedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</small>
                </div>

                {article.isUrgent && (
                    <div className="news-detail-urgent">⚠ Actualité urgente</div>
                )}

                <h1 className="news-detail-title">{article.title}</h1>

                <div className="news-detail-content">
                    {article.content.split('\n').map((paragraph, i) =>
                        paragraph.trim() ? <p key={i}>{paragraph}</p> : null
                    )}
                </div>

                {article.tags.length > 0 && (
                    <div className="tag-row">
                        {article.tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                )}
            </div>
        </section>
    )
}

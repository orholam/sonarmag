import { Link, useParams } from 'react-router-dom'
import { ArticlePage } from '../components/ArticlePage'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import { getArticle } from '../data/articles'

export default function ArticleRoute() {
  const { slug } = useParams()
  const article = slug ? getArticle(slug) : undefined

  if (!article) {
    return (
      <div className="page">
        <SiteHeader />
        <main className="article-missing">
          <h1>Article not found</h1>
          <p>That story may have moved or never existed.</p>
          <Link to="/">Back to Sonar Mag</Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="page">
      <SiteHeader />
      <main>
        <ArticlePage article={article} />
      </main>
      <SiteFooter />
    </div>
  )
}

import { Link, useParams } from 'react-router-dom'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import { getStaticPage } from '../data/pages'

export default function StaticPageRoute() {
  const { slug } = useParams()
  const page = slug ? getStaticPage(slug) : undefined

  if (!page) {
    return (
      <div className="page">
        <SiteHeader />
        <main className="static-page">
          <h1>Page not found</h1>
          <p>That page may have moved.</p>
          <Link to="/">Back to Sonar Mag</Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="page">
      <SiteHeader />
      <main className="static-page">
        {page.eyebrow ? <p className="static-eyebrow">{page.eyebrow}</p> : null}
        <h1>{page.title}</h1>
        <div className="static-body">
          {page.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="static-back">
          <Link to="/">← Back to homepage</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}

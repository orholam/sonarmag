import type { ReactNode } from 'react'
import { categoryPath } from '../lib/seo'
import type { Article } from '../lib/types'

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5L8 5.5Z" fill="currentColor" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 7h5v5M19 7l-8.5 8.5M11 7H7.5A2.5 2.5 0 0 0 5 9.5v7A2.5 2.5 0 0 0 7.5 19h7a2.5 2.5 0 0 0 2.5-2.5V13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v14L12 16.5 5.5 20V6A1.5 1.5 0 0 1 7 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 8v4.5l3 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function renderTitle(article: Article): ReactNode {
  if (!article.highlight) {
    return article.title
  }

  const { word, tone } = article.highlight
  const index = article.title.indexOf(word)
  if (index === -1) {
    return article.title
  }

  return (
    <>
      {article.title.slice(0, index)}
      <mark className={tone === 'red' ? 'hl-red' : 'hl-tan'}>{word}</mark>
      {article.title.slice(index + word.length)}
    </>
  )
}

type ArticleViewProps = {
  article: Article
}

export function ArticleView({ article }: ArticleViewProps) {
  const intro = article.paragraphs.slice(0, 2)
  const rest = article.paragraphs.slice(2)
  const sectionHref = categoryPath(article.category)

  return (
    <article className="article-page">
      <div className="ticker" role="note">
        <p className="ticker-label">Start the day here</p>
        <p className="ticker-copy">{article.ticker}</p>
        <span className="ticker-arrow" aria-hidden="true">
          →
        </span>
      </div>

      <div className="article-shell">
        <div className="article-top">
          <div className="article-main">
            <header className="article-hero">
              <h1>{renderTitle(article)}</h1>
              <button className="listen-article" type="button">
                <IconPlay />
                Listen ({article.listenMinutes} min)
              </button>
            </header>

            <div className="article-body">
              {intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              <div className="article-actions">
                <button type="button">
                  <IconShare /> Share
                </button>
                <button type="button">
                  <IconBookmark /> Bookmark
                </button>
                <span>
                  <IconClock /> {article.readMinutes} min read
                </span>
              </div>
            </div>
          </div>

          <aside className="article-meta">
            <div>
              <p className="article-author">{article.author}</p>
              {article.publishedAt ? (
                <time className="article-date" dateTime={article.publishedAt}>
                  {article.publishedLabel}
                </time>
              ) : (
                <p className="article-date">{article.publishedLabel}</p>
              )}
            </div>
            <div>
              <p className="article-comments">{article.comments} comments</p>
              <a className="article-discuss" href="#comments">
                Join the discussion
              </a>
            </div>
            <div>
              {sectionHref ? (
                <p className="article-category">
                  <a href={sectionHref}>{article.category}</a>
                </p>
              ) : (
                <p className="article-category">{article.category}</p>
              )}
              <p className="article-category-label">Category</p>
            </div>
          </aside>
        </div>

        <figure className="article-figure">
          <img
            src={article.heroImage}
            alt={article.heroAlt}
            width={1600}
            height={900}
            decoding="async"
            fetchPriority="high"
          />
        </figure>

        <div className="article-main article-main-continue">
          <div className="article-body">
            {rest.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

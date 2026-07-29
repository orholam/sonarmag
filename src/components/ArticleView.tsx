import type { ReactNode } from 'react'
import { ArticleMarkdown } from './ArticleMarkdown'
import { TweetEmbed } from './TweetEmbed'
import { articleHeroSrcSet, unsplashUrl } from '../lib/images'
import { categoryPath } from '../lib/seo'
import {
  isTweetBlock,
  type Article,
  type ArticleBlock,
  type RelatedStory,
} from '../lib/types'
import '../styles/article-related.css'

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

function formatPublishedDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

const LIVE_SPARK_PATH =
  'M3 22 L15 19 L24 21 L33 14 L43 16 L52 10 L61 12 L70 7 L79 9 L93 4'

function LiveSparkline() {
  return (
    <svg className="article-live-spark" viewBox="0 0 96 28" aria-hidden="true">
      <path
        className="article-live-spark-base"
        d={LIVE_SPARK_PATH}
        pathLength={100}
        fill="none"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="article-live-spark-trace"
        d={LIVE_SPARK_PATH}
        pathLength={100}
        fill="none"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="article-live-spark-head" cx="93" cy="4" r="2.4" />
    </svg>
  )
}

function renderBlock(block: ArticleBlock, key: string) {
  if (isTweetBlock(block)) {
    return <TweetEmbed key={key} tweet={block} />
  }
  return <ArticleMarkdown key={key} source={block} />
}

/** First two prose paragraphs before the figure; remaining blocks (incl. tweets) after. */
function splitBody(blocks: ArticleBlock[]): {
  intro: ArticleBlock[]
  rest: ArticleBlock[]
} {
  const intro: ArticleBlock[] = []
  const rest: ArticleBlock[] = []
  let proseSeen = 0

  for (const block of blocks) {
    if (typeof block === 'string' && proseSeen < 2) {
      intro.push(block)
      proseSeen += 1
    } else {
      rest.push(block)
    }
  }

  return { intro, rest }
}

type ArticleViewProps = {
  article: Article
  relatedStories?: RelatedStory[]
  showAiWars?: boolean
}

export function ArticleView({
  article,
  relatedStories = [],
  showAiWars = false,
}: ArticleViewProps) {
  const { intro, rest } = splitBody(article.paragraphs)
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
              {intro.map((block, index) => renderBlock(block, `intro-${index}`))}

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
                  Published {formatPublishedDate(article.publishedAt)}
                </time>
              ) : (
                <p className="article-date">{article.publishedLabel}</p>
              )}
            </div>
            <div>
              <p className="article-comments">{article.comments} letters</p>
              <a className="article-discuss" href="#comments">
                Read the letters
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
            src={unsplashUrl(article.heroImage, { width: 1200, height: 600, quality: 72 })}
            srcSet={articleHeroSrcSet(article.heroImage)}
            sizes="(max-width: 720px) 100vw, 38rem"
            alt={article.heroAlt}
            width={1600}
            height={800}
            decoding="async"
            fetchPriority="high"
          />
        </figure>

        <div className="article-main article-main-continue">
          <div className="article-body">
            {rest.map((block, index) => renderBlock(block, `rest-${index}`))}
          </div>
        </div>

        {(showAiWars || relatedStories.length > 0) && (
          <section className="article-related" aria-label="More from Sonar Mag">
            {showAiWars && (
              <a className="article-ai-wars-link" href="/ai-wars">
                <span className="article-ai-wars-top">
                  <span className="article-ai-wars-eyebrow">
                    <i className="article-live-dot" aria-hidden="true" />
                    Live scoreboard
                  </span>
                  <LiveSparkline />
                </span>
                <strong>Follow the AI race on AI Wars</strong>
                <p>
                  Lab rankings, model preference, API volume, coding-agent heat,
                  open-source stars, and prediction markets.
                </p>
              </a>
            )}

            {relatedStories.length > 0 && (
              <>
                <h2>Related stories</h2>
                <div className="article-related-grid">
                  {relatedStories.map((story) => {
                    const image = story.thumbImage || story.heroImage
                    return (
                      <a
                        className="article-related-card"
                        href={`/article/${story.slug}`}
                        key={story.slug}
                      >
                        {image && (
                          <img
                            src={unsplashUrl(image, { width: 480, height: 300, quality: 70 })}
                            alt={story.heroAlt || story.title}
                            width={480}
                            height={300}
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <span>{story.category}</span>
                        <h3>{story.title}</h3>
                        {story.publishedLabel && <p>{story.publishedLabel}</p>}
                      </a>
                    )
                  })}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </article>
  )
}

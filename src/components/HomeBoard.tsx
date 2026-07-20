import type { ReactNode } from 'react'
import type { Article, HomepageData } from '../lib/types'

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5L8 5.5Z" fill="currentColor" />
    </svg>
  )
}

function IconArrowUpRight() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconComment() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 3.5V15H7.5A2.5 2.5 0 0 1 5 12.5v-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
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

function IconFlame() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3c1.5 3 1 5-1 6 2.5-.2 5 1.2 5 4.5A5.5 5.5 0 0 1 12 21a5.5 5.5 0 0 1-5.5-5.5C6.5 11 9 8.5 12 3Z"
        fill="currentColor"
      />
    </svg>
  )
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  )
}

function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 4h7l4 4v12H7V4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M14 4v4h4M9 12h6M9 16h6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.5" cy="10" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 18.5c.8-2.6 2.8-4 5.5-4s4.7 1.4 5.5 4M14 14.8c1.7-.3 3.2.4 4 2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconArrowUp() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M6 9V3M3.5 5.5 6 3l2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconArrowDown() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M6 3v6M3.5 6.5 6 9l2.5-2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Sparkline({ up }: { up: boolean }) {
  return (
    <svg className="sparkline" viewBox="0 0 80 28" aria-hidden="true">
      <path
        d={
          up
            ? 'M2 22 C14 20, 18 16, 28 14 S42 16, 50 10 S66 6, 78 4'
            : 'M2 6 C14 8, 20 14, 30 16 S46 12, 54 18 S68 22, 78 24'
        }
        fill="none"
        stroke={up ? '#34c759' : '#ff5a5f'}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function shortDate(label: string): string {
  return label.split(' · ')[0] ?? label
}

function renderTitle(article: Article): ReactNode {
  if (!article.highlight) return article.title
  const { word, tone } = article.highlight
  const index = article.title.indexOf(word)
  if (index === -1) return article.title
  return (
    <>
      {article.title.slice(0, index)}
      <mark className={tone === 'red' ? 'hl-red' : 'hl-tan'}>{word}</mark>
      {article.title.slice(index + word.length)}
    </>
  )
}

export function HomeBoard({ data }: { data: HomepageData }) {
  const { hero, secondary, opinion, privacyCard, latest, popular, markets, podcast } =
    data

  return (
    <>
      <div className="board" id="top">
        {hero ? (
          <article className="card feature-card">
            <a className="feature-link" href={`/article/${hero.slug}`}>
              <img
                className="feature-image"
                src={hero.heroImage}
                alt={hero.heroAlt}
              />
              <div className="meta-row">
                <span>{hero.author}</span>
                <span>{shortDate(hero.publishedLabel)}</span>
              </div>
              <div className="feature-content">
                <h1>{renderTitle(hero)}</h1>
                <div className="feature-copy">
                  {hero.paragraphs.slice(0, 2).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <div className="stat-row">
                  <span>
                    <IconComment /> {hero.comments}
                  </span>
                  <span>
                    <IconClock /> {hero.readMinutes} min read
                  </span>
                </div>
              </div>
            </a>
          </article>
        ) : null}

        <div className="mid-col">
          {secondary ? (
            <article className="card story-card">
              <a className="story-link-cover" href={`/article/${secondary.slug}`}>
                <img
                  className="story-image"
                  src={secondary.heroImage}
                  alt={secondary.heroAlt}
                />
                <div className="meta-row">
                  <span>{secondary.author}</span>
                  <span>{shortDate(secondary.publishedLabel)}</span>
                </div>
                <div className="story-content">
                  <h2>{secondary.title}</h2>
                  <div className="stat-row">
                    <span>
                      <IconComment /> {secondary.comments}
                    </span>
                    <span>
                      <IconClock /> {secondary.readMinutes} min read
                    </span>
                  </div>
                </div>
              </a>
            </article>
          ) : null}

          <aside className="card promo-card">
            <h3>Tide of Thoughts</h3>
            <p>
              Our journal&apos;s opinion columnists and editorial board offer a
              range of viewpoints for €2.50.
            </p>
            <div className="promo-stats">
              <span>
                <IconDoc /> {data.promoStats.articles.toLocaleString()} articles
              </span>
              <span>
                <IconUsers /> {data.promoStats.authors.toLocaleString()} authors
              </span>
            </div>
          </aside>

          <div className="social-row">
            <a className="social social-tg" href="#telegram" aria-label="Telegram">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M9.8 14.8 9.5 19c.4 0 .6-.2.8-.4l1.9-1.8 3.9 2.9c.7.4 1.2.2 1.4-.7L20.9 5.4c.3-1.1-.4-1.6-1.1-1.3L4.2 10.3c-1.1.4-1.1 1-.2 1.3l4 1.2 9.2-5.8c.4-.3.8-.1.5.2"
                />
              </svg>
            </a>
            <a className="social social-yt" href="#youtube" aria-label="YouTube">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.6 8.2a2.7 2.7 0 0 0-1.9-1.9C17.9 6 12 6 12 6s-5.9 0-7.7.3A2.7 2.7 0 0 0 2.4 8.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 3.8 2.7 2.7 0 0 0 1.9 1.9C6.1 18 12 18 12 18s5.9 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-3.8ZM10 15.1V8.9L15.2 12 10 15.1Z"
                />
              </svg>
            </a>
            <a className="social social-fb" href="#facebook" aria-label="Facebook">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M14 9h2.5V6.1C16 6 15 6 14.1 6H14c-2.2 0-3.6 1.4-3.6 3.8V12H8v3h2.4v7h3.2v-7H16l.5-3h-2.9V9.7c0-.5.2-.7.4-.7Z"
                />
              </svg>
            </a>
            <a className="social social-x" href="#x" aria-label="X">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M5 4h3.4l3.2 4.4L15.8 4H19l-5.3 6.2L19.5 20H16l-3.7-5.1L8.2 20H5l5.7-6.6L5 4Z"
                />
              </svg>
            </a>
          </div>

          <div className="player-card">
            <button className="player-play" type="button" aria-label="Play">
              <IconPlay />
            </button>
            <span className="player-time">{data.player.time}</span>
            <span className="player-views">
              <IconEye /> {data.player.views.toLocaleString()}
            </span>
          </div>

          {privacyCard ? (
            <article className="card dark-card">
              <a className="dark-card-link" href={`/article/${privacyCard.slug}`}>
                <img
                  className="dark-image"
                  src={privacyCard.heroImage}
                  alt={privacyCard.heroAlt}
                />
                <h3>{privacyCard.title}</h3>
                <span className="dark-stat">
                  <IconComment /> {privacyCard.comments}
                </span>
              </a>
            </article>
          ) : null}
        </div>

        <div className="right-col">
          {opinion ? (
            <article className="card opinion-card">
              <div className="author-row">
                <div className="author">
                  <img
                    src={
                      opinion.authorAvatar ??
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'
                    }
                    alt=""
                  />
                  <span>{opinion.author}</span>
                  <span className="flame">
                    <IconFlame />
                  </span>
                </div>
                <a
                  className="icon-chip"
                  href={`/article/${opinion.slug}`}
                  aria-label="Open article"
                >
                  <IconArrowUpRight />
                </a>
              </div>
              <h2>
                <a href={`/article/${opinion.slug}`}>{renderTitle(opinion)}</a>
              </h2>
              <div className="feature-copy">
                {opinion.paragraphs.slice(0, 2).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="stat-row with-share">
                <span>
                  <IconComment /> {opinion.comments}
                </span>
                <span>
                  <IconClock /> {opinion.readMinutes} min read
                </span>
                <span className="share-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </article>
          ) : null}

          <div className="market-grid">
            {markets.map((item) => (
              <div className="card market-card" key={item.pair}>
                <div className="market-top">
                  <span>{item.pair}</span>
                  <Sparkline up={item.up} />
                </div>
                <div className={`market-change ${item.up ? 'up' : 'down'}`}>
                  {item.up ? <IconArrowUp /> : <IconArrowDown />}
                  {item.change}
                </div>
                <div className="market-value">{item.value}</div>
              </div>
            ))}
          </div>

          <aside className="card print-card" id="subscribe">
            <div>
              <h3>Get Print Edition</h3>
              <p>For an authentic tactile experience</p>
            </div>
            <a
              className="print-btn"
              href="/subscribe"
              aria-label="Get print edition"
            >
              <IconArrowUpRight />
            </a>
          </aside>
        </div>
      </div>

      <section className="rail" id="latest">
        <aside className="rail-side">
          <div className="magazine-box">
            <img
              src={data.magazineCover.image}
              alt={data.magazineCover.alt}
            />
            <div>
              <p>
                Support independent reporting with digital access and the print
                edition.
              </p>
              <a className="magazine-cta" href="/subscribe">
                Subscribe
              </a>
            </div>
          </div>

          <div className="rail-block">
            <div className="rail-heading">
              <h2>Podcasts</h2>
              <a href="/podcasts">See All</a>
            </div>
            {podcast ? (
              <article className="podcast-feature" id="podcasts">
                <img
                  src={podcast.imageUrl}
                  alt={`Microphone for ${podcast.showName} podcast`}
                />
                <p className="podcast-meta">
                  <span>{podcast.showName}</span> · Episode {podcast.episodeNumber}
                </p>
                <h3>{podcast.title}</h3>
                <p className="podcast-dek">{podcast.dek}</p>
                <p className="byline">Hosted by {podcast.host}</p>
              </article>
            ) : null}
          </div>
        </aside>

        <div className="rail-main">
          <div className="rail-heading">
            <h2 id="latest-heading">Latest</h2>
            <a href="/latest">See All</a>
          </div>
          <ul className="story-feed" aria-labelledby="latest-heading">
            {latest.map((article) => (
              <li key={article.slug}>
                <a className="feed-item" href={`/article/${article.slug}`}>
                  <div className="feed-thumb">
                    <img src={article.thumbImage ?? article.heroImage} alt="" />
                    {article.badge ? (
                      <span className="feed-badge">{article.badge}</span>
                    ) : null}
                  </div>
                  <div className="feed-copy">
                    <h3>{article.title}</h3>
                    <p className="byline">{article.author}</p>
                    <p className="timestamp">{article.publishedLabel}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <aside className="rail-popular">
          <div className="rail-heading">
            <h2>Popular</h2>
            <a href="/popular">See All</a>
          </div>
          <ol className="popular-list" id="popular">
            {popular.map((article, index) => (
              <li key={article.slug}>
                <a className="popular-item" href={`/article/${article.slug}`}>
                  <span className="popular-rank">{index + 1}</span>
                  <span className="popular-copy">
                    <span className="popular-title">{article.title}</span>
                    <span className="byline">{article.author}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </>
  )
}

import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'

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

const markets = [
  { pair: 'GHST/USD', change: '5.2%', value: '1.486', up: true },
  { pair: 'UMA/USD', change: '2.06%', value: '2.71', up: false },
  { pair: 'BRICK/USD', change: '3.12%', value: '0.048', up: true },
  { pair: 'LCX/USD', change: '1.84%', value: '0.312', up: false },
]

const latestArticles = [
  {
    author: 'Mira Chen',
    time: '11:00 AM ET',
    title: 'Cities That Listen Before They Build',
    image:
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=400&q=80',
    badge: null as string | null,
    slug: 'congress-averts-shutdown',
  },
  {
    author: 'Jonah Ellis',
    time: '10:15 AM ET',
    title: 'The Quiet Return of Longform Commerce',
    image:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
    badge: 'Sonar Audio',
    slug: 'devices-from-distracted',
  },
  {
    author: 'Priya Nair',
    time: '9:40 AM ET',
    title: 'Rituals for a Screen-Tired Generation',
    image:
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=400&q=80',
    badge: null,
    slug: 'inspiration-from-vibrancy',
  },
  {
    author: 'Owen Blake',
    time: '8:05 AM ET',
    title: 'When Search Stops Being a Destination',
    image:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80',
    badge: null,
    slug: 'devices-from-distracted',
  },
  {
    author: 'Helena Voss',
    time: 'Yesterday',
    title: 'Maps of Memory in Coastal Towns',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    badge: null,
    slug: 'inspiration-from-vibrancy',
  },
  {
    author: 'Sam Ortega',
    time: 'Yesterday',
    title: 'Designing Evenings Without Urgency',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80',
    badge: null,
    slug: 'congress-averts-shutdown',
  },
]

const popularArticles = [
  {
    author: 'Alexa Ruyk',
    title: 'Congress Averts Shutdown as Conservatives Steam',
    slug: 'congress-averts-shutdown',
  },
  {
    author: 'Lind Tailor',
    title: 'Draw Inspiration From Vibrancy',
    slug: 'inspiration-from-vibrancy',
  },
  {
    author: 'Yagami Souichirou',
    title: 'Turn Your Devices From Distracted Into Time Savers',
    slug: 'devices-from-distracted',
  },
  {
    author: 'Mira Chen',
    title: 'Cities That Listen Before They Build',
    slug: 'devices-from-distracted',
  },
  {
    author: 'Owen Blake',
    title: 'When Search Stops Being a Destination',
    slug: 'inspiration-from-vibrancy',
  },
]

function HomePage() {
  return (
    <div className="page">
      <SiteHeader />

      <main>
      <div className="board" id="top">
        <article className="card feature-card">
          <Link className="feature-link" to="/article/devices-from-distracted">
          <img
            className="feature-image"
            src="https://images.unsplash.com/photo-1520986606214-8b456906c813?auto=format&fit=crop&w=1600&q=80"
            alt="Ferris wheel against a pale sky"
          />
          <div className="meta-row">
            <span>Yagami Souichirou</span>
            <span>January 30, 2024</span>
          </div>
          <div className="feature-content">
            <h1>
              Turn Your Devices From <mark className="hl-red">Distracted</mark>{' '}
              Into Time Savers Either
            </h1>
            <div className="feature-copy">
              <p>
                At the beginning of the pandemic, as lockdowns forced millions
                of professionals worldwide to work from home, I and many others
                idealized the computer as the “work from home.”
              </p>
              <p>
                I imagined the computer as a magic box that would make my job
                easier. Then I discovered how much of that magic was distraction
                dressed as productivity.
              </p>
            </div>
            <div className="stat-row">
              <span>
                <IconComment /> 38
              </span>
              <span>
                <IconClock /> 7 min read
              </span>
            </div>
          </div>
          </Link>
        </article>

        <div className="mid-col">
          <article className="card story-card">
            <Link className="story-link-cover" to="/article/inspiration-from-vibrancy">
            <img
              className="story-image"
              src="https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=800&q=80"
              alt="Bare tree in a snowy field"
            />
            <div className="meta-row">
              <span>Lind Tailor</span>
              <span>January 28, 2024</span>
            </div>
            <div className="story-content">
              <h2>Draw Inspiration From Vibrancy</h2>
              <div className="stat-row">
                <span>
                  <IconComment /> 17
                </span>
                <span>
                  <IconClock /> 3 min read
                </span>
              </div>
            </div>
            </Link>
          </article>

          <aside className="card promo-card">
            <h3>Tide of Thoughts</h3>
            <p>
              Our journal&apos;s opinion columnists and editorial board offer a
              range of viewpoints for €2.50.
            </p>
            <div className="promo-stats">
              <span>
                <IconDoc /> 2,830 articles
              </span>
              <span>
                <IconUsers /> 175 authors
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
            <span className="player-time">32:13</span>
            <span className="player-views">
              <IconEye /> 98,076
            </span>
          </div>

          <article className="card dark-card">
            <img
              className="dark-image"
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80"
              alt=""
            />
            <h3>What Happens to Privacy in the New Age of AI</h3>
            <span className="dark-stat">
              <IconComment /> 38
            </span>
          </article>
        </div>

        <div className="right-col">
          <article className="card opinion-card">
            <div className="author-row">
              <div className="author">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                  alt=""
                />
                <span>Alexa Ruyk</span>
                <span className="flame">
                  <IconFlame />
                </span>
              </div>
              <Link
                className="icon-chip"
                to="/article/congress-averts-shutdown"
                aria-label="Open article"
              >
                <IconArrowUpRight />
              </Link>
            </div>
            <h2>
              <Link to="/article/congress-averts-shutdown">
                Congress Averts <mark className="hl-tan">Shutdown</mark> as
                Conservatives Steam
              </Link>
            </h2>
            <div className="feature-copy">
              <p>
                Lawmakers raced through the night to assemble a stopgap package
                that would keep agencies open through spring.
              </p>
              <p>
                Conservatives argued the deal traded too much for too little,
                while moderates called it the only path that avoided a crisis.
              </p>
            </div>
            <div className="stat-row with-share">
              <span>
                <IconComment /> 32
              </span>
              <span>
                <IconClock /> 5 min read
              </span>
              <span className="share-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
          </article>

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
            <Link
              className="print-btn"
              to="/subscribe"
              aria-label="Get print edition"
            >
              <IconArrowUpRight />
            </Link>
          </aside>
        </div>
      </div>

      <section className="rail" id="latest">
        <aside className="rail-side">
          <div className="magazine-box">
            <img
              src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=240&q=80"
              alt="Sonar Mag print cover"
            />
            <div>
              <p>
                Support independent reporting with digital access and the print
                edition.
              </p>
              <Link className="magazine-cta" to="/subscribe">
                Subscribe
              </Link>
            </div>
          </div>

          <div className="rail-block">
            <div className="rail-heading">
              <h2>Podcasts</h2>
              <Link to="/podcasts">See All</Link>
            </div>
            <article className="podcast-feature" id="podcasts">
              <img
                src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80"
                alt="Microphone for Sonar Signal podcast"
              />
              <p className="podcast-meta">
                <span>Sonar Signal</span> · Episode 42
              </p>
              <h3>What Happens to Privacy in the New Age of AI</h3>
              <p className="podcast-dek">
                A conversation about attention, archives, and the public record.
              </p>
              <p className="byline">Hosted by Alexa Ruyk</p>
            </article>
          </div>
        </aside>

        <div className="rail-main">
          <div className="rail-heading">
            <h2 id="latest-heading">Latest</h2>
            <Link to="/latest">See All</Link>
          </div>
          <ul className="story-feed" aria-labelledby="latest-heading">
            {latestArticles.map((article) => (
              <li key={article.title}>
                <Link className="feed-item" to={`/article/${article.slug}`}>
                  <div className="feed-thumb">
                    <img src={article.image} alt="" />
                    {article.badge ? (
                      <span className="feed-badge">{article.badge}</span>
                    ) : null}
                  </div>
                  <div className="feed-copy">
                    <h3>{article.title}</h3>
                    <p className="byline">{article.author}</p>
                    <p className="timestamp">{article.time}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <aside className="rail-popular">
          <div className="rail-heading">
            <h2>Popular</h2>
            <Link to="/popular">See All</Link>
          </div>
          <ol className="popular-list" id="popular">
            {popularArticles.map((article, index) => (
              <li key={article.title}>
                <Link className="popular-item" to={`/article/${article.slug}`}>
                  <span className="popular-rank">{index + 1}</span>
                  <span className="popular-copy">
                    <span className="popular-title">{article.title}</span>
                    <span className="byline">{article.author}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default HomePage

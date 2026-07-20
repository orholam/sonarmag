const stories = [
  {
    title: 'The Quiet Algorithms of Attention',
    dek: 'How small publishing experiments reshape what surfaces online.',
    tag: 'Essay',
  },
  {
    title: 'Listening to the Long Tail',
    dek: 'Why niche audiences still build the most durable cultural signal.',
    tag: 'Culture',
  },
  {
    title: 'Self-Directed SEO',
    dek: 'A practical field note on writing for discovery without chasing it.',
    tag: 'Field notes',
  },
]

function App() {
  return (
    <div className="page">
      <header className="nav">
        <a className="nav-brand" href="#top">
          Sonar
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#stories">Stories</a>
          <a href="#about">About</a>
          <a className="nav-cta" href="#subscribe">
            Subscribe
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-label="Introduction">
          <div className="hero-media" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=2400&q=80"
              alt=""
              className="hero-image"
            />
            <div className="hero-veil" />
            <div className="sonar-rings">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="hero-content">
            <p className="brand reveal">Sonar Mag</p>
            <h1 className="headline reveal delay-1">
              Signals from the deep web of culture.
            </h1>
            <p className="lede reveal delay-2">
              An independent publication for essays, field notes, and stories
              that travel by resonance—not noise.
            </p>
            <div className="cta-row reveal delay-3">
              <a className="btn btn-primary" href="#subscribe">
                Read the latest
              </a>
              <a className="btn btn-ghost" href="#stories">
                Browse stories
              </a>
            </div>
          </div>
        </section>

        <section className="stories" id="stories">
          <div className="section-intro">
            <h2>Latest signals</h2>
            <p>Recent writing from the Sonar desk.</p>
          </div>
          <ul className="story-list">
            {stories.map((story) => (
              <li key={story.title}>
                <a className="story-link" href="#subscribe">
                  <span className="story-tag">{story.tag}</span>
                  <span className="story-title">{story.title}</span>
                  <span className="story-dek">{story.dek}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="about" id="about">
          <div className="about-copy">
            <h2>Built to be found on purpose.</h2>
            <p>
              Sonar Mag is an experiment in self-directed discovery: careful
              writing, clear titles, and a publication that earns attention by
              being useful—and memorable—to the people who need it.
            </p>
          </div>
        </section>

        <section className="subscribe" id="subscribe">
          <h2>Stay in range.</h2>
          <p>New essays and notes, delivered when they matter.</p>
          <form
            className="subscribe-form"
            onSubmit={(event) => {
              event.preventDefault()
            }}
          >
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <button type="submit">Subscribe</button>
          </form>
        </section>
      </main>

      <footer className="footer">
        <p className="footer-brand">Sonar Mag</p>
        <p className="footer-meta">© {new Date().getFullYear()} Sonar Mag</p>
      </footer>
    </div>
  )
}

export default App

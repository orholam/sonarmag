import type { PolymarketAiWars, PolymarketEventCard } from '../lib/polymarket'

function formatSnapshotDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatEndDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function PolymarketCard({ card }: { card: PolymarketEventCard }) {
  const end = formatEndDate(card.endDate)
  return (
    <article className="ai-wars-poly-card">
      <header className="ai-wars-poly-head">
        <div className="ai-wars-poly-meta">
          <span className="ai-wars-poly-kicker">Polymarket</span>
          {end ? <span className="ai-wars-poly-end">Resolves {end}</span> : null}
        </div>
        <a
          href={card.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ai-wars-poly-link"
        >
          {card.title}
        </a>
      </header>
      <ol className="ai-wars-poly-list">
        {card.outcomes.map((o) => (
          <li key={o.name}>
            <span className="ai-wars-poly-name">{o.name}</span>
            <span className="ai-wars-poly-pct">{o.yesPct.toFixed(1)}%</span>
            <span
              className="ai-wars-poly-bar"
              aria-hidden="true"
              style={{
                ['--poly' as string]: `${Math.min(100, Math.max(o.yesPct, 1))}%`,
              }}
            />
          </li>
        ))}
      </ol>
    </article>
  )
}

export function AiWarsPolymarket({
  polymarket,
}: {
  polymarket: PolymarketAiWars
}) {
  const cards = polymarket.events.filter(
    (c): c is PolymarketEventCard => c != null,
  )
  if (!cards.length) return null

  return (
    <section className="ai-wars-section" aria-labelledby="ai-wars-poly-heading">
      <div className="ai-wars-section-label">
        <h2 id="ai-wars-poly-heading">Prediction markets</h2>
        <p>
          Longer-horizon AI markets from Polymarket’s public API — skips
          markets resolving within ~10 days
          {polymarket.asOf
            ? ` · as of ${formatSnapshotDate(polymarket.asOf)}`
            : ''}
          .
        </p>
      </div>
      <div className="ai-wars-poly-grid">
        {cards.map((card) => (
          <PolymarketCard key={card.slug} card={card} />
        ))}
      </div>
    </section>
  )
}

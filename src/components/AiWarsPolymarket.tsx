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

/** Polymarket brand mark — solid tile + P cutout. */
function PolymarketMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="24" height="24" rx="5" fill="currentColor" />
      <path
        fill="#fff"
        d="M8.2 6.4h5.05c2.55 0 4.15 1.45 4.15 3.7 0 2.2-1.55 3.65-4.05 3.65h-2.7v3.85H8.2V6.4zm2.45 2v3.3h2.45c1.25 0 1.95-.65 1.95-1.65S14.3 8.4 13.1 8.4H10.65z"
      />
    </svg>
  )
}

function PolymarketCard({ card }: { card: PolymarketEventCard }) {
  const end = formatEndDate(card.endDate)
  const outcomes = card.outcomes.slice(0, 5)

  return (
    <article className="ai-wars-poly-card">
      <header className="ai-wars-poly-card-head">
        <div className="ai-wars-poly-meta">
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
        {outcomes.map((o) => (
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
    <section className="ai-wars-poly" aria-labelledby="ai-wars-poly-heading">
      <header className="ai-wars-poly-head">
        <div>
          <h2 id="ai-wars-poly-heading">
            <PolymarketMark className="ai-wars-poly-mark" />
            Prediction markets
          </h2>
          <p>
            Longer-horizon AI odds from Polymarket. Skips markets resolving
            within ~10 days
            {polymarket.asOf
              ? ` · as of ${formatSnapshotDate(polymarket.asOf)}`
              : ''}
            .
          </p>
        </div>
        <a
          className="ai-wars-poly-home"
          href="https://polymarket.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          polymarket.com
        </a>
      </header>

      <div className="ai-wars-poly-grid">
        {cards.map((card) => (
          <PolymarketCard key={card.slug} card={card} />
        ))}
      </div>
    </section>
  )
}

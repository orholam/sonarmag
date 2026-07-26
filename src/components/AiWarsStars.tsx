import type { CodingToolStarsBoard } from '../lib/coding-tool-stars'
import { formatCompactCount } from '../lib/rank-bars'

function formatFetchedAt(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Open-source coding tools by live GitHub stars — intentionally not the
 * Arena/OpenRouter rank-list chrome.
 */
export function AiWarsStars({ board }: { board: CodingToolStarsBoard }) {
  if (!board.entries.length) return null

  const [leader, ...rest] = board.entries
  const fetched = formatFetchedAt(board.asOf)
  const max = leader?.stars ?? 1

  return (
    <section
      className="ai-wars-starboard"
      aria-labelledby="ai-wars-starboard-heading"
    >
      <header className="ai-wars-starboard-head">
        <div>
          <p className="ai-wars-starboard-kicker">Open source · live stars</p>
          <h2 id="ai-wars-starboard-heading">GitHub gravity</h2>
          <p>
            Stargazer counts for open coding agents and harnesses — a different
            race from Reddit heat. Grok Build, OpenCode, and the rest of the
            open field.
          </p>
        </div>
        <div className="ai-wars-starboard-meta">
          <span>{board.entries.length} tools</span>
          {fetched ? <span>Fetched {fetched}</span> : null}
          <a
            href="https://github.com/topics/ai-coding-agent"
            target="_blank"
            rel="noopener noreferrer"
          >
            Topic →
          </a>
        </div>
      </header>

      {leader ? (
        <a
          className="ai-wars-starboard-leader"
          href={leader.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="ai-wars-starboard-leader-copy">
            <span className="ai-wars-starboard-surface">{leader.surface}</span>
            <span className="ai-wars-starboard-leader-name">{leader.name}</span>
            <span className="ai-wars-starboard-repo">{leader.repo}</span>
          </div>
          <div className="ai-wars-starboard-leader-score" aria-label={`${leader.detail} stars`}>
            <span className="ai-wars-starboard-glyph" aria-hidden="true">
              ★
            </span>
            <span className="ai-wars-starboard-count">{leader.detail}</span>
          </div>
        </a>
      ) : null}

      <ol className="ai-wars-starboard-grid">
        {rest.map((entry) => {
          const weight = Math.max(0.12, entry.stars / max)
          return (
            <li key={entry.repo}>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ['--star-weight' as string]: String(weight),
                }}
              >
                <span className="ai-wars-starboard-surface">{entry.surface}</span>
                <span className="ai-wars-starboard-name">{entry.name}</span>
                <span className="ai-wars-starboard-score">
                  <span aria-hidden="true">★</span>
                  {formatCompactCount(entry.stars)}
                </span>
                <span className="ai-wars-starboard-repo">{entry.repo}</span>
                <span className="ai-wars-starboard-track" aria-hidden="true" />
              </a>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

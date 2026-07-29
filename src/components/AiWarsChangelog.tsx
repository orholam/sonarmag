import type { ChangelogBoard } from '../lib/ai-wars-changelog'
import type { AiWarsChart } from '../lib/ai-wars-history'
import { SeriesLineChart } from './SeriesLineChart'

function formatSnapshotDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatPostDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/** Public changelog / news velocity across labs. */
export function AiWarsChangelog({ board }: { board: ChangelogBoard }) {
  if (!board.entries.length) {
    return (
      <p className="ai-wars-empty">Changelog velocity not loaded yet.</p>
    )
  }

  const chart: AiWarsChart | null =
    board.weeks.length && board.series.length
      ? {
          id: 'changelog-weekly',
          title: 'Posts per week',
          subtitle: `4-week rolling average · last ${board.weeks.length} complete weeks`,
          sourceUrl: '',
          asOf: board.asOf,
          dates: board.weeks,
          unit: 'count',
          series: board.series.map((s) => ({
            id: s.companyId,
            name: s.company,
            color: s.color,
            points: s.points
              .filter(
                (p): p is typeof p & { average: number } => p.average != null,
              )
              .map((p) => ({
                date: p.weekStart,
                value: Math.round(p.average * 10) / 10,
              })),
          })),
        }
      : null

  return (
    <div className="ai-wars-changelog">
      <div className="ai-wars-changelog-grid">
        {chart ? (
          <section className="ai-wars-panel">
            <header className="ai-wars-panel-head">
              <div>
                <h2>{chart.title}</h2>
                <p>{chart.subtitle}</p>
              </div>
            </header>
            <SeriesLineChart chart={chart} height={240} smooth />
          </section>
        ) : null}

        <section className="ai-wars-changelog-recent">
          <header className="ai-wars-rank-head">
            <h3>Latest headlines</h3>
            <p>
              Most recent item per lab
              {board.asOf ? ` · through ${formatSnapshotDate(board.asOf)}` : ''}
            </p>
          </header>
          <ul className="ai-wars-changelog-headlines">
            {board.companies.map((c) => {
              const post = c.recent[0]
              if (!post) return null
              return (
                <li key={c.companyId}>
                  <span
                    className="ai-wars-swatch"
                    style={{ background: c.color }}
                    aria-hidden="true"
                  />
                  <div>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {post.title}
                    </a>
                    <span>
                      {c.company}
                      <span aria-hidden="true"> · </span>
                      {formatPostDate(post.publishedAt)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <p className="ai-wars-note">
        Comms / shipping proxy — OpenAI &amp; Anthropic newsrooms are louder than
        Cursor&apos;s product changelog. Not weighted by importance. Lines are
        curved because the value is a 4-week mean, not a weekly reading, and each
        starts once its source covers a full window rather than reading as zero.
      </p>
    </div>
  )
}

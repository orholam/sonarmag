import type { AppStoreRankBoard } from '../lib/ai-wars-app-store'
import { rankToScore } from '../lib/ai-wars-app-store'
import type { AiWarsChart } from '../lib/ai-wars-history'
import { barWidths } from '../lib/rank-bars'
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

/** US App Store Productivity rank tape for AI consumer apps. */
export function AiWarsAppStore({ board }: { board: AppStoreRankBoard }) {
  if (!board.entries.length) {
    return (
      <p className="ai-wars-empty">App Store ranks not loaded yet.</p>
    )
  }

  const rows = board.entries.map((entry) => {
    const metric =
      entry.productivityRank != null
        ? `#${entry.productivityRank}`
        : '—'
    return {
      entry,
      metric,
      meta: entry.overallRank != null ? `Overall #${entry.overallRank}` : null,
      value:
        entry.productivityRank != null
          ? rankToScore(entry.productivityRank) ?? 0
          : 0,
    }
  })
  const widths = barWidths(rows.map((r) => r.value))

  const chart: AiWarsChart | null =
    board.dates.length >= 2
      ? {
          id: 'app-store-productivity',
          title: 'Productivity rank tape',
          subtitle: 'Inverse rank score · US free Productivity chart',
          sourceUrl: 'https://apps.apple.com/us/charts/iphone/productivity-apps/6007',
          asOf: board.asOf,
          dates: board.dates,
          unit: 'score',
          series: board.series.map((s) => ({
            id: s.appKey,
            name: s.name,
            color: s.color,
            points: s.points
              .map((p) => {
                const score = rankToScore(p.productivityRank)
                return score == null
                  ? null
                  : { date: p.measuredOn, value: score }
              })
              .filter((p): p is { date: string; value: number } => p != null),
          })),
        }
      : null

  return (
    <div className="ai-wars-appstore">
      <section className="ai-wars-rank">
        <header className="ai-wars-rank-head">
          <h3>
            <a
              href="https://apps.apple.com/us/charts/iphone/productivity-apps/6007"
              target="_blank"
              rel="noopener noreferrer"
            >
              US App Store · Productivity
            </a>
          </h3>
          <p>
            Free iPhone Productivity chart
            {board.asOf ? ` · ${formatSnapshotDate(board.asOf)}` : ''}
          </p>
        </header>
        <ol className="ai-wars-rank-list">
          {rows.map((row, i) => (
            <li key={row.entry.appKey}>
              <span className="ai-wars-rank-num" aria-hidden="true">
                {String(row.entry.rank).padStart(2, '0')}
              </span>
              <div className="ai-wars-rank-body">
                <div className="ai-wars-rank-top">
                  <a
                    className="ai-wars-rank-name"
                    href={row.entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {row.entry.name}
                  </a>
                  <span className="ai-wars-rank-metric">{row.metric}</span>
                </div>
                <div className="ai-wars-rank-bar" aria-hidden="true">
                  <span
                    className="ai-wars-rank-fill"
                    style={{ width: `${widths[i]}%` }}
                  />
                </div>
                <span className="ai-wars-rank-meta">
                  {[row.entry.vendor, row.meta].filter(Boolean).join(' · ')}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {chart ? (
        <section className="ai-wars-panel">
          <header className="ai-wars-panel-head">
            <div>
              <h2>{chart.title}</h2>
              <p>{chart.subtitle}</p>
            </div>
            {chart.asOf ? (
              <span className="ai-wars-asof">
                {formatSnapshotDate(chart.asOf)}
              </span>
            ) : null}
          </header>
          <SeriesLineChart chart={chart} height={220} />
          <p className="ai-wars-note">
            Daily snapshots. Score = 101 − chart rank (higher is better). Outside
            the top 100 drops off.
          </p>
        </section>
      ) : (
        <p className="ai-wars-note ai-wars-appstore-note">
          Rank tape starts today — the history chart appears after a second daily
          snapshot. Metric: US free Productivity (#1–100).
        </p>
      )}
    </div>
  )
}

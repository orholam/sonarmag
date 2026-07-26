import type { AiRaceData } from '../lib/ai-race'
import type { AiWarsChart, AiWarsHistory } from '../lib/ai-wars-history'
import type { AiWarsFieldBoard } from '../lib/ai-wars-field'
import type { CodingToolRedditBoard } from '../lib/coding-tool-reddit'
import type { CodingToolStarsBoard } from '../lib/coding-tool-stars'
import type { PolymarketAiWars } from '../lib/polymarket'
import { barWidths, parseMetricValue } from '../lib/rank-bars'
import { AiWarsField } from './AiWarsField'
import { AiWarsPerplexity } from './AiWarsPerplexity'
import { AiWarsPolymarket } from './AiWarsPolymarket'
import { AiWarsStars } from './AiWarsStars'
import { SeriesLineChart } from './SeriesLineChart'

type Props = {
  aiRace: AiRaceData
  history: AiWarsHistory
  codingTools: CodingToolRedditBoard
  codingStars: CodingToolStarsBoard
  field: AiWarsFieldBoard
  polymarket: PolymarketAiWars
}

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

function RankList({
  title,
  subtitle,
  sourceUrl,
  entries,
  accentFor,
  limit = 8,
}: {
  title: string
  subtitle: string
  sourceUrl?: string
  entries: Array<{
    rank: number
    name: string
    detail: string
    vendor?: string | null
    url?: string | null
  }>
  accentFor?: (name: string) => string | undefined
  limit?: number
}) {
  const rows = entries.slice(0, limit).map((entry) => {
    const [metric, ...rest] = entry.detail.split(' · ')
    return {
      entry,
      metric,
      meta: rest.join(' · ') || null,
      value: parseMetricValue(metric),
    }
  })
  const widths = barWidths(rows.map((r) => r.value))

  return (
    <section className="ai-wars-rank">
      <header className="ai-wars-rank-head">
        <h3>
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              {title}
            </a>
          ) : (
            title
          )}
        </h3>
        <p>{subtitle}</p>
      </header>
      <ol className="ai-wars-rank-list">
        {rows.map((row, i) => {
          const accent = accentFor?.(row.entry.name)
          const href = row.entry.url?.trim() || null
          return (
            <li key={`${title}-${row.entry.rank}-${row.entry.name}`}>
              <span className="ai-wars-rank-num" aria-hidden="true">
                {String(row.entry.rank).padStart(2, '0')}
              </span>
              <div className="ai-wars-rank-body">
                <div className="ai-wars-rank-top">
                  {href ? (
                    <a
                      className="ai-wars-rank-name"
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {row.entry.name}
                    </a>
                  ) : (
                    <span className="ai-wars-rank-name">{row.entry.name}</span>
                  )}
                  <span className="ai-wars-rank-metric">{row.metric}</span>
                </div>
                <div className="ai-wars-rank-bar" aria-hidden="true">
                  <span
                    className="ai-wars-rank-fill"
                    style={{
                      width: `${widths[i]}%`,
                      ...(accent ? { background: accent } : null),
                    }}
                  />
                </div>
                {(row.entry.vendor || row.meta) && (
                  <span className="ai-wars-rank-meta">
                    {[row.entry.vendor, row.meta].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function ChartBlock({
  chart,
  footnote,
  height,
}: {
  chart: AiWarsChart
  footnote?: string
  height?: number
}) {
  return (
    <section className="ai-wars-panel">
      <header className="ai-wars-panel-head">
        <div>
          <h2>
            {chart.sourceUrl ? (
              <a href={chart.sourceUrl} target="_blank" rel="noopener noreferrer">
                {chart.title}
              </a>
            ) : (
              chart.title
            )}
          </h2>
          <p>{chart.subtitle}</p>
        </div>
        {chart.asOf ? (
          <span className="ai-wars-asof">{formatSnapshotDate(chart.asOf)}</span>
        ) : null}
      </header>
      <SeriesLineChart chart={chart} height={height} />
      {footnote ? <p className="ai-wars-note">{footnote}</p> : null}
    </section>
  )
}

function CodingShareBar({
  entries,
  colorByName,
  asOf,
}: {
  entries: CodingToolRedditBoard['entries']
  colorByName: Map<string, string>
  asOf: string | null
}) {
  const total = entries.reduce((sum, e) => sum + e.weeklyVisitors, 0)
  if (!total) return null

  return (
    <section className="ai-wars-panel ai-wars-share">
      <header className="ai-wars-panel-head">
        <div>
          <h2>Share of weekly visitors</h2>
          <p>
            {asOf
              ? `Proportional to latest snapshot · ${formatSnapshotDate(asOf)}`
              : 'Proportional to latest snapshot'}
          </p>
        </div>
        <span className="ai-wars-asof">{formatCompactTotal(total)} total</span>
      </header>

      <div
        className="ai-wars-share-bar"
        role="img"
        aria-label={entries
          .map(
            (e) =>
              `${e.name} ${((e.weeklyVisitors / total) * 100).toFixed(0)}%`,
          )
          .join(', ')}
      >
        {entries.map((e) => {
          const pct = (e.weeklyVisitors / total) * 100
          const color = colorByName.get(e.name) ?? '#171717'
          return (
            <div
              key={e.toolId}
              className="ai-wars-share-seg"
              style={{
                flexGrow: e.weeklyVisitors,
                flexBasis: 0,
                background: color,
              }}
              title={`${e.name}: ${e.detail} (${pct.toFixed(1)}%)`}
            >
              {pct >= 9 ? (
                <span className="ai-wars-share-seg-label">
                  {e.name}
                  <em>{pct.toFixed(0)}%</em>
                </span>
              ) : null}
            </div>
          )
        })}
      </div>

      <ul className="ai-wars-share-legend">
        {entries.map((e) => {
          const pct = (e.weeklyVisitors / total) * 100
          const color = colorByName.get(e.name) ?? '#171717'
          return (
            <li key={e.toolId}>
              <span className="ai-wars-swatch" style={{ background: color }} />
              <span className="ai-wars-share-name">{e.name}</span>
              <span className="ai-wars-share-meta">
                {e.detail}
                <span aria-hidden="true"> · </span>
                {pct.toFixed(1)}%
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function formatCompactTotal(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 10e6 ? 0 : 1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 100e3 ? 0 : 1)}K`
  return String(n)
}

export function AiWarsBoard({
  aiRace,
  history,
  codingTools,
  codingStars,
  field,
  polymarket,
}: Props) {
  const arena = aiRace.boards.find((b) => b.id === 'arena') ?? null
  const openrouter = aiRace.boards.find((b) => b.id === 'openrouter') ?? null
  const colorByName = new Map(
    codingTools.series.map((s) => [s.name, s.color] as const),
  )

  const codingChart: AiWarsChart | null =
    codingTools.series.length && codingTools.dates.length
      ? {
          id: 'coding-weekly-visitors',
          title: 'Coding-agent weekly visitors',
          subtitle: 'Subreddit weekly visitors',
          sourceUrl: '',
          asOf: codingTools.asOf,
          dates: codingTools.dates,
          unit: 'count',
          series: codingTools.series.map((s) => ({
            id: s.toolId,
            name: s.name,
            color: s.color,
            points: s.points.map((p) => ({
              date: p.measuredOn,
              value: p.weeklyVisitors,
            })),
          })),
        }
      : null

  return (
    <div className="ai-wars">
      <AiWarsField field={field} />

      <section className="ai-wars-section" aria-labelledby="ai-wars-agents-heading">
        <div className="ai-wars-section-label">
          <h2 id="ai-wars-agents-heading">Coding agents</h2>
          <p>
            Subreddit weekly visitors as a community-heat proxy, tracked from
            July 2026.
          </p>
        </div>

        {codingTools.entries.length ? (
          <CodingShareBar
            entries={codingTools.entries}
            colorByName={colorByName}
            asOf={codingTools.asOf}
          />
        ) : (
          <p className="ai-wars-empty">
            Coding-tool weekly visitors not loaded yet.
          </p>
        )}

        {codingChart ? (
          <div className="ai-wars-agents-chart">
            <ChartBlock
              chart={codingChart}
              height={220}
              footnote="Desk-tracked estimates — heat signal, not seats or revenue."
            />
          </div>
        ) : null}

        <AiWarsStars board={codingStars} />
      </section>

      <AiWarsPerplexity />

      <AiWarsPolymarket polymarket={polymarket} />

      {history.openrouterVolume ? (
        <ChartBlock
          chart={history.openrouterVolume}
          height={292}
          footnote="OpenRouter rankings-daily · prompt + completion tokens for the public top 50 each day."
        />
      ) : null}

      <div className="ai-wars-split">
        {history.openrouterVendors ? (
          <ChartBlock
            chart={history.openrouterVendors}
            height={236}
            footnote="Share of daily OpenRouter token volume by provider."
          />
        ) : null}
        {history.arenaElo ? (
          <ChartBlock
            chart={history.arenaElo}
            height={236}
            footnote="Weekly Arena text-leaderboard snapshots."
          />
        ) : null}
      </div>

      <section className="ai-wars-section" aria-labelledby="ai-wars-now-heading">
        <div className="ai-wars-section-label">
          <h2 id="ai-wars-now-heading">Live boards</h2>
          <p>Preference vs API volume — not the same race.</p>
        </div>
        <div className="ai-wars-now-grid">
          {arena ? (
            <RankList
              title={arena.title}
              subtitle={arena.subtitle}
              sourceUrl={arena.sourceUrl}
              entries={arena.entries}
            />
          ) : null}
          {openrouter ? (
            <RankList
              title={openrouter.title}
              subtitle={openrouter.subtitle}
              sourceUrl={openrouter.sourceUrl}
              entries={openrouter.entries}
            />
          ) : null}
        </div>
      </section>
    </div>
  )
}

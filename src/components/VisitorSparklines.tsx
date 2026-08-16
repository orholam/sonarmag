import { useState, type PointerEvent } from 'react'
import type { CodingToolRedditBoard } from '../lib/coding-tool-reddit'
import { formatCompactCount } from '../lib/rank-bars'

const SPARK_W = 120
const SPARK_H = 28
const SPARK_PAD_Y = 3

type SparkPoint = { measuredOn: string; weeklyVisitors: number }

function formatWeekDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function sparkCoords(values: number[]) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(max - min, 1)
  return values.map((v, i) => {
    const x =
      values.length === 1 ? SPARK_W / 2 : (i / (values.length - 1)) * SPARK_W
    const y = SPARK_PAD_Y + (SPARK_H - SPARK_PAD_Y * 2) * (1 - (v - min) / span)
    return { x, y }
  })
}

function nearestIndex(svgX: number, count: number): number {
  if (count <= 1) return 0
  const t = svgX / SPARK_W
  return Math.max(0, Math.min(count - 1, Math.round(t * (count - 1))))
}

function VisitorSparkline({
  points,
  color,
  hoverIdx,
  onHoverIdx,
}: {
  points: SparkPoint[]
  color: string
  hoverIdx: number | null
  onHoverIdx: (idx: number) => void
}) {
  const values = points.map((p) => p.weeklyVisitors)
  if (!values.length) return null

  const coords = sparkCoords(values)
  const path = coords
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
  const activeIdx = hoverIdx ?? coords.length - 1
  const active = coords[activeIdx]

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * SPARK_W
    onHoverIdx(nearestIndex(svgX, coords.length))
  }

  return (
    <svg
      className="ai-wars-visitor-spark"
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      width={SPARK_W}
      height={SPARK_H}
      role="img"
      aria-label="Weekly visitors sparkline. Hover to read a week."
      onPointerMove={onMove}
      onPointerEnter={onMove}
    >
      <rect
        x={0}
        y={0}
        width={SPARK_W}
        height={SPARK_H}
        fill="transparent"
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {active ? (
        <circle cx={active.x} cy={active.y} r={2.6} fill={color} />
      ) : null}
    </svg>
  )
}

function formatVisitorDelta(delta: number): string {
  if (delta === 0) return '0'
  const sign = delta > 0 ? '+' : '−'
  return `${sign}${formatCompactCount(Math.abs(delta))}`
}

/** Per-tool weekly-visitor rows with own-scale sparklines. */
export function VisitorSparklines({
  board,
}: {
  board: CodingToolRedditBoard
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (!board.series.length) return null

  const rows = board.series
    .map((s) => {
      const points = s.points
        .slice()
        .sort((a, b) => a.measuredOn.localeCompare(b.measuredOn))
      const values = points.map((p) => p.weeklyVisitors)
      const latest = values[values.length - 1] ?? 0
      const prior = values.length >= 2 ? values[values.length - 2] : null
      const delta = prior == null ? null : Math.round(latest - prior)
      return {
        toolId: s.toolId,
        name: s.name,
        subreddit: s.subreddit,
        color: s.color,
        points,
        latest,
        delta,
      }
    })
    .sort((a, b) => b.latest - a.latest)

  const dates = rows[0]?.points.map((p) => p.measuredOn) ?? board.dates
  const hoveredDate =
    hoverIdx != null && dates[hoverIdx] ? dates[hoverIdx] : null

  return (
    <section className="ai-wars-visitor-rows" aria-label="Weekly visitors by tool">
      <header className="ai-wars-visitor-rows-head">
        <h3>Weekly visitors over time</h3>
        <p>
          Each sparkline uses its own scale so mid-pack moves stay readable.
          Hover to read any week. Pills are latest week-over-week change.
        </p>
      </header>
      <ol
        className="ai-wars-visitor-list"
        onPointerLeave={() => setHoverIdx(null)}
      >
        {rows.map((row) => {
          const tone =
            row.delta == null
              ? null
              : row.delta > 0
                ? 'is-up'
                : row.delta < 0
                  ? 'is-down'
                  : 'is-flat'
          const shownIdx =
            hoverIdx != null && row.points[hoverIdx]
              ? hoverIdx
              : row.points.length - 1
          const shown = row.points[shownIdx]
          const shownValue = shown?.weeklyVisitors ?? row.latest
          const shownDate = shown?.measuredOn
          return (
            <li key={row.toolId}>
              <div className="ai-wars-visitor-row">
                <span
                  className="ai-wars-swatch"
                  style={{ background: row.color }}
                  aria-hidden="true"
                />
                <div className="ai-wars-visitor-meta">
                  <span className="ai-wars-visitor-name">{row.name}</span>
                  <span className="ai-wars-visitor-sub">r/{row.subreddit}</span>
                </div>
                <VisitorSparkline
                  points={row.points}
                  color={row.color}
                  hoverIdx={
                    hoverIdx != null && row.points[hoverIdx] ? hoverIdx : null
                  }
                  onHoverIdx={setHoverIdx}
                />
                <div className="ai-wars-visitor-stats">
                  <span className="ai-wars-visitor-latest">
                    {formatCompactCount(shownValue)}
                    {hoverIdx != null && shownDate ? (
                      <em className="ai-wars-visitor-hover-date">
                        {formatWeekDate(shownDate)}
                      </em>
                    ) : null}
                  </span>
                  {hoverIdx == null && row.delta != null && tone ? (
                    <span
                      className={`ai-wars-score-delta ${tone}`}
                      title="Week-over-week visitor change"
                      aria-label={`Changed ${formatVisitorDelta(row.delta)} week over week`}
                    >
                      {formatVisitorDelta(row.delta)}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      <p className="ai-wars-note">
        Desk-tracked estimates. Heat signal only, not seats or revenue.
        {hoveredDate ? ` Showing ${formatWeekDate(hoveredDate)}.` : ''}
      </p>
    </section>
  )
}

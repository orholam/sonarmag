import { useState, type PointerEvent } from 'react'
import type { AiWarsChart } from '../lib/ai-wars-history'

/**
 * Weekly visitor share as one lane per product.
 * Bar length is that product's share of the set, so the lengths compare.
 * The line in each lane uses that product's own scale, so a rise or drop
 * in a smaller share stays visible.
 */

const SPARK_W = 100
const SPARK_H = 40
const SPARK_PAD = 4
/** Peaks under this percent stay in the footer instead of a lane. */
const LANE_MIN = 1

type Lane = {
  id: string
  name: string
  color: string
  values: Array<number | null>
  latest: number
  delta: number
  peak: number
}

function formatWeek(iso: string, withYear: boolean): string {
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: withYear ? 'numeric' : undefined,
    timeZone: 'UTC',
  })
}

function formatShare(value: number): string {
  if (value < 0.1) return '<0.1%'
  return `${value.toFixed(1)}%`
}

function formatPp(delta: number): string {
  const abs = Math.abs(delta)
  if (abs < 0.05) return '0'
  const sign = delta > 0 ? '+' : '−'
  return `${sign}${abs.toFixed(1)}`
}

function buildLanes(chart: AiWarsChart): { lanes: Lane[]; rest: Lane[] } {
  const rows = chart.series.map((series) => {
    const byDate = new Map(series.points.map((point) => [point.date, point.value]))
    const values = chart.dates.map((date) => {
      const value = byDate.get(date)
      return value != null && Number.isFinite(value) ? value : null
    })
    const present = values.filter((value): value is number => value != null)
    const latest = present[present.length - 1] ?? 0
    const first = present[0] ?? latest
    const peak = present.length ? Math.max(...present) : 0
    return {
      id: series.id,
      name: series.name,
      color: series.color,
      values,
      latest,
      delta: latest - first,
      peak,
    }
  })
  rows.sort((a, b) => b.latest - a.latest)
  return {
    lanes: rows.filter((row) => row.peak >= LANE_MIN),
    rest: rows.filter((row) => row.peak < LANE_MIN),
  }
}

/** Pad the row around the series so a real move fills it, without magnifying a flat line. */
function laneScale(values: Array<number | null>): { yMin: number; yMax: number } {
  const present = values.filter((value): value is number => value != null)
  if (!present.length) return { yMin: 0, yMax: 1 }
  const floor = Math.min(...present)
  const peak = Math.max(...present)
  const pad = Math.max((peak - floor) * 0.22, 0.35)
  let yMin = floor - pad
  let yMax = peak + pad
  if (yMax - yMin < 3) {
    const mid = (floor + peak) / 2
    yMin = mid - 1.5
    yMax = mid + 1.5
  }
  if (yMin < 0) {
    yMax -= yMin
    yMin = 0
  }
  return { yMin, yMax }
}

function yFor(value: number, yMin: number, yMax: number): number {
  const span = Math.max(yMax - yMin, 0.001)
  return SPARK_PAD + (SPARK_H - SPARK_PAD * 2) * (1 - (value - yMin) / span)
}

function sparkLine(values: Array<number | null>, yMin: number, yMax: number): string {
  const n = values.length
  const runs: Array<Array<{ x: number; y: number }>> = []
  let run: Array<{ x: number; y: number }> = []
  values.forEach((value, i) => {
    if (value == null) {
      if (run.length) runs.push(run)
      run = []
      return
    }
    const x = n <= 1 ? SPARK_W / 2 : (i / (n - 1)) * SPARK_W
    run.push({ x, y: yFor(value, yMin, yMax) })
  })
  if (run.length) runs.push(run)

  return runs
    .map((pts) => {
      const drawn =
        pts.length === 1
          ? [
              { x: Math.max(0, pts[0].x - 1.1), y: pts[0].y },
              { x: Math.min(SPARK_W, pts[0].x + 1.1), y: pts[0].y },
            ]
          : pts
      return drawn
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
        .join(' ')
    })
    .join(' ')
}

function pointAt(
  values: Array<number | null>,
  index: number,
  yMin: number,
  yMax: number,
) {
  const value = values[index]
  if (value == null) return null
  const n = values.length
  const x = n <= 1 ? 50 : (index / (n - 1)) * 100
  const y = (yFor(value, yMin, yMax) / SPARK_H) * 100
  return { x, y, value }
}

function monthMarks(dates: string[]): Array<{ index: number; label: string }> {
  const marks: Array<{ index: number; label: string }> = []
  let last = ''
  dates.forEach((date, index) => {
    const label = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      timeZone: 'UTC',
    })
    if (label === last) return
    marks.push({ index, label })
    last = label
  })
  return marks
}

export function VisitorShare({ chart }: { chart: AiWarsChart }) {
  const { lanes, rest } = buildLanes(chart)
  const [hover, setHover] = useState<number | null>(null)
  const dates = chart.dates
  const lastIndex = Math.max(dates.length - 1, 0)
  const index = hover ?? lastIndex

  if (!lanes.length) return null

  function onMove(event: PointerEvent<HTMLDivElement>) {
    if (dates.length <= 1) return
    const rect = event.currentTarget.getBoundingClientRect()
    const t = (event.clientX - rect.left) / Math.max(rect.width, 1)
    const next = Math.max(0, Math.min(dates.length - 1, Math.round(t * (dates.length - 1))))
    setHover(next)
  }

  const activeDate = dates[index] ?? null
  const marks = monthMarks(dates)
  const barScale = 100

  return (
    <section className="ai-wars-panel ai-wars-visitor-share" aria-label="Weekly visitor share">
      <header className="ai-wars-panel-head">
        <div>
          <h2>{chart.title}</h2>
          <p>{chart.subtitle}</p>
        </div>
        <span className="ai-wars-asof">
          {activeDate
            ? formatWeek(activeDate, true)
            : null}
        </span>
      </header>

      <ol className="ai-wars-share-lanes" onPointerLeave={() => setHover(null)}>
        {lanes.map((lane) => {
          const shown = lane.values[index]
          const scale = laneScale(lane.values)
          const line = sparkLine(lane.values, scale.yMin, scale.yMax)
          const dot = pointAt(lane.values, index, scale.yMin, scale.yMax)
          const width = shown == null || barScale <= 0 ? 0 : (shown / barScale) * 100
          const tone =
            Math.abs(lane.delta) < 0.05 ? 'is-flat' : lane.delta > 0 ? 'is-up' : 'is-down'
          const cursor =
            dates.length <= 1 ? 50 : (index / (dates.length - 1)) * 100
          return (
            <li key={lane.id}>
              <div
                className="ai-wars-share-lane"
                onPointerMove={onMove}
                onPointerEnter={onMove}
              >
                <span
                  className="ai-wars-swatch ai-wars-share-lane-swatch"
                  style={{ background: lane.color }}
                  aria-hidden="true"
                />
                <span className="ai-wars-share-lane-name">{lane.name}</span>
                <div
                  className="ai-wars-share-lane-bar"
                  title={
                    shown == null
                      ? `${lane.name} was not tracked this week`
                      : `${lane.name} ${formatShare(shown)}`
                  }
                >
                  <span
                    className="ai-wars-share-lane-bar-fill"
                    style={{ width: `${width}%`, background: lane.color }}
                  />
                </div>
                <span className="ai-wars-share-lane-pct">
                  {shown == null ? '—' : formatShare(shown)}
                </span>
                {hover == null ? (
                  <span
                    className={`ai-wars-share-lane-delta ai-wars-score-delta ${tone}`}
                    title="Percentage points since this product’s first tracked week"
                  >
                    {formatPp(lane.delta)}
                  </span>
                ) : (
                  <span className="ai-wars-share-lane-delta" aria-hidden="true" />
                )}
                <div className="ai-wars-share-lane-spark">
                  <svg
                    viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={`${lane.name} share over time, latest ${formatShare(lane.latest)}`}
                  >
                    {line ? (
                      <path
                        d={line}
                        fill="none"
                        stroke={lane.color}
                        strokeWidth={2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : null}
                  </svg>
                  {hover != null ? (
                    <span
                      className="ai-wars-share-lane-cursor"
                      style={{ left: `${cursor}%` }}
                    />
                  ) : null}
                  {dot ? (
                    <span
                      className="ai-wars-share-lane-dot"
                      style={{ left: `${dot.x}%`, top: `${dot.y}%`, background: lane.color }}
                    />
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="ai-wars-share-axis" aria-hidden="true">
        {marks.map((mark) => {
          const left = dates.length <= 1 ? 50 : (mark.index / (dates.length - 1)) * 100
          const align = left < 8 ? 'start' : left > 92 ? 'end' : 'mid'
          return (
            <span
              key={mark.label}
              className={`is-${align}`}
              style={{ left: `${left}%` }}
            >
              {mark.label}
            </span>
          )
        })}
      </div>

      <p className="ai-wars-note">
        Hover a line to read another week. The pill is percentage points since
        that row’s first week. Codex, OpenCode, Antigravity, and Windsurf add a
        second subreddit the week it is first tracked, which can step the line.
        {rest.length
          ? ` Under ${LANE_MIN}% throughout: ${rest
              .map((row) => `${row.name} ${formatShare(row.latest)}`)
              .join(', ')}.`
          : ''}
      </p>
    </section>
  )
}

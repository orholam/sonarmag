import { useMemo, useRef, useState, type PointerEvent } from 'react'
import type { AiWarsChart, ChartSeries } from '../lib/ai-wars-history'
import { formatChartValue } from '../lib/ai-wars-history'

function formatAxisDate(iso: string, dense: boolean): string {
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: dense ? undefined : 'numeric',
    timeZone: 'UTC',
  })
}

function formatTipDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

type Props = {
  chart: AiWarsChart
  height?: number
  ariaLabel?: string
  /** Curve the line — for smoothed/averaged series that aren't point-precise. */
  smooth?: boolean
}

type TipState = {
  date: string
  x: number
  rows: Array<{ id: string; name: string; color: string; value: number }>
}

export function SeriesLineChart({
  chart,
  height = 280,
  ariaLabel,
  smooth = false,
}: Props) {
  const { dates, series, unit } = chart
  const wrapRef = useRef<HTMLDivElement>(null)
  const stickyDateRef = useRef<string | null>(null)
  const tipSideRef = useRef<'after' | 'before'>('after')
  const tipRef = useRef<TipState | null>(null)
  const [tip, setTip] = useState<TipState | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())

  const width = 860
  const pad = { top: 14, right: 14, bottom: 32, left: 50 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const visible = useMemo(
    () => series.filter((s) => !hidden.has(s.id)),
    [series, hidden],
  )

  const geometry = useMemo(() => {
    const allValues = visible.flatMap((s) => s.points.map((p) => p.value))
    if (!allValues.length) {
      return { yMin: 0, yMax: 1, xFor: () => pad.left, yFor: () => pad.top }
    }
    const rawMin = Math.min(...allValues)
    const rawMax = Math.max(...allValues)
    const padY =
      unit === 'elo' || unit === 'score'
        ? Math.max((rawMax - rawMin) * 0.2, unit === 'score' ? 4 : 6)
        : rawMax * 0.06
    const yMin =
      unit === 'score'
        ? Math.max(0, rawMin - padY)
        : unit === 'elo'
          ? Math.max(0, rawMin - padY)
          : unit === 'share'
            ? 0
            : 0
    const yMax =
      unit === 'score'
        ? Math.min(100, rawMax + padY) || 1
        : (unit === 'elo' ? rawMax + padY : rawMax + padY) || 1

    const xFor = (date: string) => {
      if (dates.length === 1) return pad.left + innerW / 2
      const i = dates.indexOf(date)
      const idx = i >= 0 ? i : 0
      return pad.left + (idx / Math.max(dates.length - 1, 1)) * innerW
    }
    const yFor = (value: number) =>
      pad.top + innerH - ((value - yMin) / (yMax - yMin)) * innerH

    return { yMin, yMax, xFor, yFor }
  }, [visible, dates, unit, innerW, innerH, pad.left, pad.top])

  const { yMin, yMax, xFor, yFor } = geometry
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + (yMax - yMin) * t)
  const labelEvery = Math.max(1, Math.ceil(dates.length / 7))
  const dense = dates.length > 40

  if (!dates.length || !series.length) {
    return <p className="ai-wars-empty">No history for this chart yet.</p>
  }

  function rowsForDate(date: string) {
    return visible
      .map((s) => {
        const point = s.points.find((p) => p.date === date)
        if (!point || !Number.isFinite(point.value)) return null
        return {
          id: s.id,
          name: s.name,
          color: s.color,
          value: point.value,
        }
      })
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .sort((a, b) => b.value - a.value)
  }

  /** Sticky nearest-date so midpoints don't flicker on narrow charts. */
  function pickDate(svgX: number): string | null {
    if (!dates.length) return null
    if (svgX < pad.left - 16 || svgX > width - pad.right + 16) return null

    let best = dates[0]
    let bestDist = Infinity
    for (const date of dates) {
      const dist = Math.abs(xFor(date) - svgX)
      if (dist < bestDist) {
        bestDist = dist
        best = date
      }
    }

    const sticky = stickyDateRef.current
    if (sticky && dates.includes(sticky)) {
      const spacing = dates.length > 1 ? innerW / (dates.length - 1) : innerW
      // Require crossing ~60% toward a neighbor before switching.
      const hold = Math.max(spacing * 0.6, 10)
      if (Math.abs(svgX - xFor(sticky)) < hold) {
        return sticky
      }
    }

    stickyDateRef.current = best
    return best
  }

  function commitTip(next: TipState | null) {
    const prev = tipRef.current
    if (!next) {
      if (prev) {
        tipRef.current = null
        setTip(null)
      }
      return
    }
    // Avoid re-renders that only nudge x by a pixel, and never flap the date.
    if (
      prev &&
      prev.date === next.date &&
      Math.abs(prev.x - next.x) < 1.5 &&
      prev.rows.length === next.rows.length &&
      prev.rows.every((r, i) => r.id === next.rows[i]?.id && r.value === next.rows[i]?.value)
    ) {
      return
    }
    tipRef.current = next
    setTip(next)
  }

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * width
    const localX = e.clientX - rect.left

    let date = pickDate(svgX)
    if (!date) {
      // Keep showing last tip while still over the stage; only leave clears.
      return
    }

    let rows = rowsForDate(date)
    // Sparse series (Arena): if this tick has no points, walk to nearest populated tick.
    if (!rows.length) {
      const idx = dates.indexOf(date)
      let found: string | null = null
      for (let radius = 1; radius < dates.length; radius++) {
        const left = dates[idx - radius]
        const right = dates[idx + radius]
        if (left && rowsForDate(left).length) {
          found = left
          break
        }
        if (right && rowsForDate(right).length) {
          found = right
          break
        }
      }
      if (!found) return
      date = found
      stickyDateRef.current = found
      rows = rowsForDate(found)
    }

    commitTip({ date, x: localX, rows })
  }

  function onLeave() {
    stickyDateRef.current = null
    tipSideRef.current = 'after'
    commitTip(null)
  }

  function toggleSeries(id: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        // Keep at least one series visible.
        if (next.size >= series.length - 1) return prev
        next.add(id)
      }
      return next
    })
  }

  function tipLeftPx(localX: number): number {
    const stageW = wrapRef.current?.clientWidth ?? 320
    const tipW = Math.min(200, stageW * 0.55)
    // Hysteresis so the tooltip doesn't flip sides every frame on narrow panels.
    if (tipSideRef.current === 'after' && localX > stageW * 0.62) {
      tipSideRef.current = 'before'
    } else if (tipSideRef.current === 'before' && localX < stageW * 0.38) {
      tipSideRef.current = 'after'
    }
    if (tipSideRef.current === 'before') {
      return Math.max(8, localX - tipW - 12)
    }
    return Math.min(localX + 12, Math.max(8, stageW - tipW - 8))
  }

  const tipLeft = tip ? tipLeftPx(tip.x) : 0

  return (
    <div className="ai-wars-chart-wrap">
      <div
        ref={wrapRef}
        className="ai-wars-chart-stage"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <svg
          className="ai-wars-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={ariaLabel ?? chart.title}
        >
          {yTicks.map((tick) => {
            const y = yFor(tick)
            return (
              <g key={tick}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  className="ai-wars-grid"
                />
                <text
                  x={pad.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="ai-wars-axis"
                >
                  {formatChartValue(tick, unit)}
                </text>
              </g>
            )
          })}

          {dates.map((date, i) =>
            i % labelEvery === 0 || i === dates.length - 1 ? (
              <text
                key={date}
                x={xFor(date)}
                y={height - 8}
                textAnchor="middle"
                className="ai-wars-axis"
              >
                {formatAxisDate(date, dense)}
              </text>
            ) : null,
          )}

          {visible.map((s) => (
            <SeriesPath
              key={s.id}
              series={s}
              xFor={xFor}
              yFor={yFor}
              dimmed={Boolean(focusId && focusId !== s.id)}
              active={Boolean(focusId && focusId === s.id)}
              smooth={smooth}
            />
          ))}

          {tip ? (
            <line
              x1={xFor(tip.date)}
              x2={xFor(tip.date)}
              y1={pad.top}
              y2={height - pad.bottom}
              className="ai-wars-crosshair"
            />
          ) : null}

          {tip
            ? tip.rows.map((row) => (
                <circle
                  key={`tip-${row.id}`}
                  cx={xFor(tip.date)}
                  cy={yFor(row.value)}
                  r={3.2}
                  fill={row.color}
                  stroke="#fff"
                  strokeWidth={1.25}
                />
              ))
            : null}
        </svg>

        {tip ? (
          <div className="ai-wars-tooltip" style={{ left: tipLeft }} role="status">
            <p className="ai-wars-tooltip-date">{formatTipDate(tip.date)}</p>
            <ul>
              {tip.rows.map((row) => (
                <li key={row.id}>
                  <span
                    className="ai-wars-swatch"
                    style={{ background: row.color }}
                  />
                  <span className="ai-wars-tooltip-name">{row.name}</span>
                  <span className="ai-wars-tooltip-val">
                    {formatChartValue(row.value, unit)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <ul className="ai-wars-legend" aria-label="Series legend">
        {series.map((s) => {
          const off = hidden.has(s.id)
          return (
            <li key={s.id}>
              <button
                type="button"
                className={`ai-wars-legend-btn${off ? ' is-off' : ''}${focusId === s.id ? ' is-focus' : ''}`}
                onClick={() => toggleSeries(s.id)}
                onMouseEnter={() => setFocusId(s.id)}
                onMouseLeave={() => setFocusId(null)}
                onFocus={() => setFocusId(s.id)}
                onBlur={() => setFocusId(null)}
              >
                <span className="ai-wars-swatch" style={{ background: s.color }} />
                <span className="ai-wars-legend-name">{s.name}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="ai-wars-chart-hint">Hover for values · click legend to hide a series</p>
    </div>
  )
}

/**
 * Monotone cubic (Fritsch–Carlson) path. Chosen over Catmull-Rom because it
 * never overshoots the data — a smoothed count series must not dip below zero
 * or invent peaks between weeks.
 */
function monotonePath(xs: number[], ys: number[]): string {
  const n = xs.length
  const slopes: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const h = xs[i + 1] - xs[i]
    slopes.push(h === 0 ? 0 : (ys[i + 1] - ys[i]) / h)
  }

  const tangents: number[] = Array.from({ length: n }, () => 0)
  tangents[0] = slopes[0] ?? 0
  tangents[n - 1] = slopes[n - 2] ?? 0
  for (let i = 1; i < n - 1; i++) {
    const prev = slopes[i - 1]
    const next = slopes[i]
    if (prev * next <= 0) {
      tangents[i] = 0
    } else {
      const t = (prev + next) / 2
      const limit = Math.min(Math.abs(3 * prev), Math.abs(3 * next))
      tangents[i] = Math.sign(t) * Math.min(Math.abs(t), limit)
    }
  }

  let d = `M${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const h = xs[i + 1] - xs[i]
    const c1x = xs[i] + h / 3
    const c1y = ys[i] + (tangents[i] * h) / 3
    const c2x = xs[i + 1] - h / 3
    const c2y = ys[i + 1] - (tangents[i + 1] * h) / 3
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${xs[i + 1].toFixed(1)} ${ys[i + 1].toFixed(1)}`
  }
  return d
}

function SeriesPath({
  series,
  xFor,
  yFor,
  dimmed,
  active,
  smooth = false,
}: {
  series: ChartSeries
  xFor: (date: string) => number
  yFor: (value: number) => number
  dimmed: boolean
  active: boolean
  smooth?: boolean
}) {
  const pts = series.points
    .filter((p) => Number.isFinite(p.value))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  if (!pts.length) return null

  let path: string | null = null
  if (pts.length > 1) {
    const xs = pts.map((p) => xFor(p.date))
    const ys = pts.map((p) => yFor(p.value))
    path = smooth
      ? monotonePath(xs, ys)
      : xs
          .map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${ys[i].toFixed(1)}`)
          .join(' ')
  }

  const strokeWidth = active ? 2.75 : 2
  const opacity = dimmed ? 0.16 : 1

  return (
    <g opacity={opacity}>
      {path ? (
        <path
          d={path}
          fill="none"
          stroke={series.color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      {pts.length === 1 ? (
        <circle
          cx={xFor(pts[0].date)}
          cy={yFor(pts[0].value)}
          r={3.5}
          fill={series.color}
        />
      ) : null}
    </g>
  )
}

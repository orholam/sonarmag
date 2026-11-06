import { useMemo, useRef, useState, type PointerEvent } from 'react'
import type { AiWarsChart } from '../lib/ai-wars-history'

/**
 * 100% stacked area. Each date is sorted from the smallest share at the
 * bottom to the largest at the top. Between dates, share eases in place.
 * A rank swap is a short crossing at the moment the shares are equal,
 * not a glide across the whole week. Visible series are rescaled to fill
 * the chart.
 */

type Band = {
  id: string
  name: string
  color: string
  /** Share drawn in the stack, 0–100. */
  value: number
  low: number
  high: number
}

type Column = {
  date: string
  x: number
  bands: Band[]
}

function formatShare(value: number): string {
  if (value > 0 && value < 0.05) return '<0.1%'
  return `${value.toFixed(1)}%`
}

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

function stackRows(
  rows: Array<{ id: string; name: string; color: string; raw: number }>,
): Band[] {
  const sorted = rows.slice().sort((a, b) => a.raw - b.raw || a.name.localeCompare(b.name))
  const total = sorted.reduce((sum, row) => sum + row.raw, 0)
  if (total <= 0) return []
  let cursor = 0
  return sorted.map((row, i) => {
    const value = (row.raw / total) * 100
    const low = cursor
    const high = i === sorted.length - 1 ? 100 : cursor + value
    cursor += value
    return { id: row.id, name: row.name, color: row.color, value, low, high }
  })
}

function stackAt(series: ChartSeries[], date: string, hidden: Set<string>): Band[] {
  const rows = series.flatMap((s) => {
    if (hidden.has(s.id)) return []
    const point = s.points.find((p) => p.date === date && Number.isFinite(p.value) && p.value > 0)
    if (!point) return []
    return [{ id: s.id, name: s.name, color: s.color, raw: point.value }]
  })
  return stackRows(rows)
}

function sameSeries(left: Band[], right: Band[]): boolean {
  if (left.length !== right.length || left.length < 2) return false
  const ids = new Set(left.map((band) => band.id))
  return right.every((band) => ids.has(band.id))
}

/** Times in (0, 1) where two series' linearly eased shares change order. */
function crossingTimes(left: Band[], right: Band[]): number[] {
  if (!sameSeries(left, right)) return []
  const next = new Map(right.map((band) => [band.id, band.value]))
  const times: number[] = []
  for (let i = 0; i < left.length; i++) {
    for (let j = i + 1; j < left.length; j++) {
      const a0 = left[i].value
      const b0 = left[j].value
      const a1 = next.get(left[i].id)
      const b1 = next.get(left[j].id)
      if (a1 == null || b1 == null) continue
      const before = a0 - b0
      const after = a1 - b1
      if (before === 0 || after === 0 || Math.sign(before) === Math.sign(after)) continue
      const denom = a1 - a0 - (b1 - b0)
      if (denom === 0) continue
      const t = (b0 - a0) / denom
      if (t > 0 && t < 1) times.push(t)
    }
  }
  times.sort((a, b) => a - b)
  const unique: number[] = []
  for (const t of times) {
    if (unique.length && t - unique[unique.length - 1] < 1e-4) continue
    unique.push(t)
  }
  return unique
}

function easedRows(left: Band[], right: Band[], t: number) {
  const next = new Map(right.map((band) => [band.id, band]))
  return left.flatMap((band) => {
    const other = next.get(band.id)
    if (!other) return []
    return [
      {
        id: band.id,
        name: band.name,
        color: band.color,
        raw: band.value + (other.value - band.value) * t,
      },
    ]
  })
}

function stackInOrder(
  rows: Array<{ id: string; name: string; color: string; raw: number }>,
  order: string[],
): Band[] {
  const byId = new Map(rows.map((row) => [row.id, row]))
  const ordered = order.flatMap((id) => {
    const row = byId.get(id)
    return row ? [row] : []
  })
  const total = ordered.reduce((sum, row) => sum + row.raw, 0)
  if (total <= 0) return []
  let cursor = 0
  return ordered.map((row, i) => {
    const value = (row.raw / total) * 100
    const low = cursor
    const high = i === ordered.length - 1 ? 100 : cursor + value
    cursor += value
    return { id: row.id, name: row.name, color: row.color, value, low, high }
  })
}

/**
 * One vertical cut per rank swap, at the moment the shares are equal.
 * A straight morph between the old slot and the new one leaves a gap in
 * the stack, so the band changes place at that x instead of gliding.
 */
function swapSamples(left: Column, right: Column): Column[] {
  const span = right.x - left.x
  if (span <= 1) return []
  const times = crossingTimes(left.bands, right.bands)
  return times.flatMap((t) => {
    const rows = easedRows(left.bands, right.bands, t)
    const before = stackRows(easedRows(left.bands, right.bands, Math.max(0, t - 1e-4))).map(
      (band) => band.id,
    )
    const after = stackRows(easedRows(left.bands, right.bands, Math.min(1, t + 1e-4))).map(
      (band) => band.id,
    )
    const x = left.x + span * t
    return [
      { date: left.date, x, bands: stackInOrder(rows, before) },
      { date: left.date, x, bands: stackInOrder(rows, after) },
    ]
  })
}

function bandPath(
  runs: Array<Array<{ x: number; low: number; high: number }>>,
  yFor: (value: number) => number,
  fullWidth: { left: number; right: number } | null,
): string {
  const parts: string[] = []
  for (const run of runs) {
    if (!run.length) continue
    if (run.length === 1) {
      const band = run[0]
      const left = fullWidth ? fullWidth.left : band.x - 5
      const right = fullWidth ? fullWidth.right : band.x + 5
      const top = yFor(band.high)
      const bottom = yFor(band.low)
      parts.push(`M ${left} ${top} H ${right} V ${bottom} H ${left} Z`)
      continue
    }
    const top = run.map((band) => `${band.x} ${yFor(band.high)}`)
    const bottom = run
      .slice()
      .reverse()
      .map((band) => `${band.x} ${yFor(band.low)}`)
    parts.push(`M ${top[0]} L ${top.slice(1).join(' L ')} L ${bottom.join(' L ')} Z`)
  }
  return parts.join(' ')
}

export function ShareStackChart({
  chart,
  height = 380,
}: {
  chart: AiWarsChart
  height?: number
}) {
  const { dates, series } = chart
  const wrapRef = useRef<HTMLDivElement>(null)
  const tipSideRef = useRef<'after' | 'before'>('after')
  const [tipDate, setTipDate] = useState<string | null>(null)
  const [tipX, setTipX] = useState(0)
  const [tipSvgX, setTipSvgX] = useState(0)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())

  const width = 860
  const pad = { top: 16, right: 16, bottom: 32, left: 44 }
  const plotLeft = pad.left
  const plotRight = width - pad.right
  const innerH = height - pad.top - pad.bottom
  const yFor = (value: number) => pad.top + innerH - (value / 100) * innerH
  const yTicks = [0, 25, 50, 75, 100]

  const columns = useMemo<Column[]>(() => {
    return dates.flatMap((date, i) => {
      const bands = stackAt(series, date, hidden)
      if (!bands.length) return []
      const x =
        dates.length <= 1
          ? (plotLeft + plotRight) / 2
          : plotLeft + (i / Math.max(dates.length - 1, 1)) * (plotRight - plotLeft)
      return [{ date, x, bands }]
    })
  }, [dates, series, hidden, plotLeft, plotRight])

  const geometry = useMemo(() => {
    const sampled: Column[] = []
    for (let i = 0; i < columns.length; i++) {
      sampled.push(columns[i])
      const next = columns[i + 1]
      if (next) sampled.push(...swapSamples(columns[i], next))
    }
    return sampled
  }, [columns])

  const paths = useMemo(() => {
    const fullWidth = dates.length <= 1 ? { left: plotLeft, right: plotRight } : null
    return series.flatMap((s) => {
      const runs: Array<Array<{ x: number; low: number; high: number }>> = []
      let run: Array<{ x: number; low: number; high: number }> = []
      for (const column of geometry) {
        const band = column.bands.find((item) => item.id === s.id)
        if (!band) {
          if (run.length) runs.push(run)
          run = []
          continue
        }
        run.push({ x: column.x, low: band.low, high: band.high })
      }
      if (run.length) runs.push(run)
      const d = bandPath(runs, yFor, fullWidth)
      if (!d) return []
      return [{ id: s.id, color: s.color, d }]
    })
  }, [series, geometry, dates.length, plotLeft, plotRight, yFor])

  const labelEvery = Math.max(1, Math.ceil(dates.length / 7))
  const dense = dates.length > 40
  const lastColumn = columns[columns.length - 1] ?? null

  function toggleSeries(id: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < series.length - 1) next.add(id)
      return next
    })
  }

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const el = wrapRef.current
    if (!el || !columns.length) return
    const rect = el.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * width
    if (svgX < plotLeft - 12 || svgX > plotRight + 12) return
    let best = columns[0]
    let bestDist = Infinity
    for (const column of columns) {
      const dist = Math.abs(column.x - svgX)
      if (dist < bestDist) {
        bestDist = dist
        best = column
      }
    }
    const svgY = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * height
    const under = best.bands.find((band) => svgY >= yFor(band.high) && svgY <= yFor(band.low))
    setFocusId(under?.id ?? null)
    setTipDate(best.date)
    setTipX(e.clientX - rect.left)
    setTipSvgX(svgX)
  }

  function onLeave() {
    tipSideRef.current = 'after'
    setTipDate(null)
    setFocusId(null)
  }

  const tip = columns.find((column) => column.date === tipDate) ?? null
  const tipRows = tip ? tip.bands.slice().reverse() : []

  function tipLeftPx(localX: number): number {
    const stageW = wrapRef.current?.clientWidth ?? 320
    const tipW = Math.min(200, stageW * 0.55)
    if (tipSideRef.current === 'after' && localX > stageW * 0.62) tipSideRef.current = 'before'
    else if (tipSideRef.current === 'before' && localX < stageW * 0.38) tipSideRef.current = 'after'
    if (tipSideRef.current === 'before') return Math.max(8, localX - tipW - 12)
    return Math.min(localX + 12, Math.max(8, stageW - tipW - 8))
  }

  if (!dates.length || !series.length || !columns.length) {
    return <p className="ai-wars-empty">No history for this chart yet.</p>
  }

  return (
    <div className="ai-wars-stack">
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
          aria-label={chart.title}
        >
          {paths.map((path) => {
            const dimmed = Boolean(focusId && focusId !== path.id)
            return (
              <path
                key={path.id}
                d={path.d}
                fill={path.color}
                stroke="#fff"
                strokeWidth={0.8}
                strokeLinejoin="round"
                opacity={dimmed ? 0.2 : 1}
              />
            )
          })}

          {yTicks.map((tick) => {
            const y = yFor(tick)
            return (
              <g key={tick}>
                <line
                  x1={plotLeft - 5}
                  x2={plotLeft}
                  y1={y}
                  y2={y}
                  stroke="rgba(23,23,23,0.28)"
                  strokeWidth={1}
                />
                <text x={plotLeft - 8} y={y + 3} textAnchor="end" className="ai-wars-axis">
                  {Math.round(tick)}%
                </text>
              </g>
            )
          })}

          {columns.map((column, i) =>
            columns.length === 1 || i % labelEvery === 0 || i === columns.length - 1 ? (
              <text
                key={column.date}
                x={columns.length === 1 ? (plotLeft + plotRight) / 2 : column.x}
                y={height - 8}
                textAnchor="middle"
                className="ai-wars-axis"
              >
                {formatAxisDate(column.date, dense)}
              </text>
            ) : null,
          )}

          {lastColumn
            ? lastColumn.bands.map((band) => {
                const bandH = ((band.high - band.low) / 100) * innerH
                if (bandH < 36) return null
                const dimmed = Boolean(focusId && focusId !== band.id)
                return (
                  <text
                    key={`in-${band.id}`}
                    x={plotRight - 8}
                    y={yFor((band.low + band.high) / 2)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="ai-wars-stack-inlabel"
                    opacity={dimmed ? 0.25 : 1}
                  >
                    {band.name} {formatShare(band.value)}
                  </text>
                )
              })
            : null}

          {tip ? (
            <line
              x1={columns.length === 1 ? Math.min(plotRight, Math.max(plotLeft, tipSvgX)) : tip.x}
              x2={columns.length === 1 ? Math.min(plotRight, Math.max(plotLeft, tipSvgX)) : tip.x}
              y1={pad.top}
              y2={height - pad.bottom}
              className="ai-wars-crosshair"
            />
          ) : null}
        </svg>

        {tip ? (
          <div className="ai-wars-tooltip" style={{ left: tipLeftPx(tipX) }} role="status">
            <p className="ai-wars-tooltip-date">{formatTipDate(tip.date)}</p>
            <ul>
              {tipRows.map((row) => (
                <li key={row.id} className={row.id === focusId ? 'is-hot' : undefined}>
                  <span className="ai-wars-swatch" style={{ background: row.color }} />
                  <span className="ai-wars-tooltip-name">{row.name}</span>
                  <span className="ai-wars-tooltip-val">{formatShare(row.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <ol className="ai-wars-stack-key" aria-label="Share key, largest at the top">
        {(tip ?? lastColumn)?.bands
          .slice()
          .reverse()
          .map((band) => (
            <li key={band.id}>
              <button
                type="button"
                className={focusId === band.id ? 'is-focus' : undefined}
                onClick={() => toggleSeries(band.id)}
                onMouseEnter={() => setFocusId(band.id)}
                onMouseLeave={() => setFocusId(null)}
                onFocus={() => setFocusId(band.id)}
                onBlur={() => setFocusId(null)}
              >
                <span className="ai-wars-swatch" style={{ background: band.color }} />
                <span className="ai-wars-stack-key-name">{band.name}</span>
                <span className="ai-wars-stack-key-val">{formatShare(band.value)}</span>
              </button>
            </li>
          ))}
        {series
          .filter((s) => hidden.has(s.id))
          .map((s) => (
            <li key={s.id}>
              <button type="button" className="is-off" onClick={() => toggleSeries(s.id)}>
                <span className="ai-wars-swatch" style={{ background: s.color }} />
                <span className="ai-wars-stack-key-name">{s.name}</span>
                <span className="ai-wars-stack-key-val">off</span>
              </button>
            </li>
          ))}
      </ol>
      <p className="ai-wars-chart-hint">Hover a band for that week. Click a name to hide it.</p>
    </div>
  )
}

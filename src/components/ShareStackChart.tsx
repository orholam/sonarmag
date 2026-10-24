import { useMemo, useRef, useState, type PointerEvent } from 'react'
import type { AiWarsChart, ChartSeries } from '../lib/ai-wars-history'

/**
 * 100% stacked area. Each date is sorted from the smallest share at the
 * bottom to the largest at the top, so a series changes bands when it
 * passes another. Visible series are rescaled to fill the chart.
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

type Label = {
  id: string
  name: string
  color: string
  value: number
  y: number
  labelY: number
}

function formatShare(value: number): string {
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

function latestPoint(series: ChartSeries) {
  const pts = series.points.filter((p) => Number.isFinite(p.value))
  if (!pts.length) return null
  return pts.reduce((best, p) => (p.date > best.date ? p : best))
}

function layoutLabels(items: Array<Omit<Label, 'labelY'>>, top: number, bottom: number, gap = 15): Label[] {
  const sorted = items.slice().sort((a, b) => a.y - b.y)
  if (!sorted.length) return []
  const ys = sorted.map((item) => item.y)
  for (let i = 1; i < ys.length; i++) {
    if (ys[i] < ys[i - 1] + gap) ys[i] = ys[i - 1] + gap
  }
  const overflow = ys[ys.length - 1] - bottom
  if (overflow > 0) {
    for (let i = 0; i < ys.length; i++) ys[i] -= overflow
  }
  if (ys[0] < top) {
    const shift = top - ys[0]
    for (let i = 0; i < ys.length; i++) ys[i] += shift
  }
  if (ys[ys.length - 1] - ys[0] > bottom - top && ys.length > 1) {
    const step = (bottom - top) / (ys.length - 1)
    for (let i = 0; i < ys.length; i++) ys[i] = top + i * step
  }
  return sorted.map((item, i) => ({ ...item, labelY: ys[i] }))
}

function stackAt(series: ChartSeries[], date: string, hidden: Set<string>): Band[] {
  const rows = series.flatMap((s) => {
    if (hidden.has(s.id)) return []
    const point = s.points.find((p) => p.date === date && Number.isFinite(p.value) && p.value > 0)
    if (!point) return []
    return [{ id: s.id, name: s.name, color: s.color, raw: point.value }]
  })
  rows.sort((a, b) => a.raw - b.raw || a.name.localeCompare(b.name))
  const total = rows.reduce((sum, row) => sum + row.raw, 0)
  if (total <= 0) return []
  let cursor = 0
  return rows.map((row, i) => {
    const value = (row.raw / total) * 100
    const low = cursor
    const high = i === rows.length - 1 ? 100 : cursor + value
    cursor += value
    return { id: row.id, name: row.name, color: row.color, value, low, high }
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
  const pad = { top: 16, right: 188, bottom: 32, left: 44 }
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

  const paths = useMemo(() => {
    const fullWidth = dates.length <= 1 ? { left: plotLeft, right: plotRight } : null
    return series.flatMap((s) => {
      const runs: Array<Array<{ x: number; low: number; high: number }>> = []
      let run: Array<{ x: number; low: number; high: number }> = []
      for (const column of columns) {
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
  }, [series, columns, dates.length, plotLeft, plotRight, yFor])

  const labels = useMemo(() => {
    const last = columns[columns.length - 1]
    if (!last) return []
    const items = last.bands.map((band) => ({
      id: band.id,
      name: band.name,
      color: band.color,
      value: band.value,
      y: yFor((band.low + band.high) / 2),
    }))
    return layoutLabels(items, pad.top + 6, height - pad.bottom - 4)
  }, [columns, height, pad.top, pad.bottom, yFor])

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
    setTipDate(best.date)
    setTipX(e.clientX - rect.left)
    setTipSvgX(svgX)
  }

  function onLeave() {
    tipSideRef.current = 'after'
    setTipDate(null)
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
                strokeWidth={0.6}
                strokeLinejoin="round"
                opacity={dimmed ? 0.18 : 1}
              />
            )
          })}

          {yTicks.map((tick) => {
            const y = yFor(tick)
            return (
              <g key={tick}>
                <line
                  x1={plotLeft}
                  x2={plotRight}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.45)"
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

          {labels.map((label) => {
            const dimmed = Boolean(focusId && focusId !== label.id)
            const shifted = Math.abs(label.labelY - label.y) > 5
            return (
              <g key={`end-${label.id}`} opacity={dimmed ? 0.25 : 1}>
                {shifted ? (
                  <line
                    x1={plotRight}
                    y1={label.y}
                    x2={plotRight + 4}
                    y2={label.labelY}
                    stroke={label.color}
                    strokeWidth={1}
                    strokeOpacity={0.55}
                  />
                ) : null}
                <text
                  x={plotRight + 8}
                  y={label.labelY}
                  dominantBaseline="middle"
                  className="ai-wars-end-label"
                  fill={label.color}
                >
                  {label.name}
                  <tspan className="ai-wars-end-label-value" dx="7">
                    {formatShare(label.value)}
                  </tspan>
                </text>
              </g>
            )
          })}

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
                <li key={row.id}>
                  <span className="ai-wars-swatch" style={{ background: row.color }} />
                  <span className="ai-wars-tooltip-name">{row.name}</span>
                  <span className="ai-wars-tooltip-val">{formatShare(row.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <ul className="ai-wars-legend" aria-label="Series legend">
        {series.map((s) => {
          const off = hidden.has(s.id)
          const shown = lastColumn?.bands.find((band) => band.id === s.id)
          const raw = latestPoint(s)?.value
          const pct = shown?.value ?? raw
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
                {pct != null ? <span className="ai-wars-legend-value">{formatShare(pct)}</span> : null}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="ai-wars-chart-hint">Hover for a week · click legend to hide a series</p>
    </div>
  )
}

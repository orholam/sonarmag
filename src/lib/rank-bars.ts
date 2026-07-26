/** Parse compact metric strings like "1.2B", "890K", "1421". */
export function parseMetricValue(metric: string): number {
  const match = metric
    .trim()
    .replace(/,/g, '')
    .match(/^([\d.]+)\s*([KMBT])?/i)
  if (!match) return 0
  const n = Number(match[1])
  if (!Number.isFinite(n)) return 0
  const unit = (match[2] || '').toUpperCase()
  const mult =
    unit === 'T' ? 1e12 : unit === 'B' ? 1e9 : unit === 'M' ? 1e6 : unit === 'K' ? 1e3 : 1
  return n * mult
}

/** Bar widths vs the board leader; soft floor so tight Elo spreads still read. */
export function barWidths(values: number[]): number[] {
  const max = Math.max(...values, 0)
  if (!(max > 0)) return values.map(() => 0)
  const min = Math.min(...values)
  const floor = min < max * 0.97 ? min * 0.992 : max * 0.88
  const span = Math.max(max - floor, Number.EPSILON)
  return values.map((v) => Math.max(8, Math.min(100, ((v - floor) / span) * 100)))
}

export function formatCompactCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n >= 1e12) return `${(n / 1e12).toFixed(n >= 10e12 ? 1 : 2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 100e9 ? 0 : 1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 100e6 ? 0 : 1)}M`
  if (n >= 1e3) {
    const k = n / 1e3
    return `${k >= 100 ? k.toFixed(0) : k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`
  }
  return String(Math.round(n))
}

import { displayModelName } from './ai-race'
import { formatCompactCount } from './rank-bars'
import { supabase } from './supabase'

export type ChartPoint = { date: string; value: number }

export type ChartSeries = {
  id: string
  name: string
  color: string
  points: ChartPoint[]
}

export type AiWarsChart = {
  id: string
  title: string
  subtitle: string
  sourceUrl: string
  asOf: string | null
  dates: string[]
  series: ChartSeries[]
  unit: 'tokens' | 'elo' | 'share' | 'count' | 'score'
}

export type AiWarsHistory = {
  openrouterVolume: AiWarsChart | null
  openrouterVendors: AiWarsChart | null
  arenaElo: AiWarsChart | null
}

type ChartRow = {
  id: string
  title: string
  subtitle: string
  source_url: string
  as_of: string | null
  payload: {
    dates?: string[]
    series?: ChartSeries[]
    unit?: AiWarsChart['unit']
  }
  fetched_at: string
}

type OpenRouterRow = {
  date: string
  model_permaslug: string
  total_tokens: string
}

type ArenaModel = {
  rank: number
  model: string
  vendor?: string | null
  score?: number | null
}

const OPENROUTER_RANKINGS_URL =
  'https://openrouter.ai/api/v1/datasets/rankings-daily'
const ARENA_URL =
  'https://api.wulong.dev/arena-ai-leaderboards/v1/leaderboard?name=text'

const MAX_AGE_MS = 18 * 60 * 60 * 1000
const SERIES_COLORS = [
  '#e11d2e', // sonar red
  '#171717', // ink
  '#0f7a8a', // teal
  '#c47a00', // amber
  '#1f5fbf', // blue
  '#8b4513', // saddle brown
  '#2f7d4a', // green
  '#9f1239', // rose
]

function openRouterKey(): string | undefined {
  return (
    (typeof process !== 'undefined' ? process.env.OPENROUTER_API_KEY : undefined) ||
    import.meta.env.OPENROUTER_API_KEY
  )
}

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isFresh(fetchedAt: string | undefined): boolean {
  if (!fetchedAt) return false
  const t = Date.parse(fetchedAt)
  if (!Number.isFinite(t)) return false
  return Date.now() - t < MAX_AGE_MS
}

function colorAt(i: number): string {
  return SERIES_COLORS[i % SERIES_COLORS.length]
}

function formatMonthDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function rowToChart(row: ChartRow): AiWarsChart | null {
  const dates = Array.isArray(row.payload?.dates) ? row.payload.dates : []
  const series = Array.isArray(row.payload?.series) ? row.payload.series : []
  if (!dates.length || !series.length) return null
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    sourceUrl: row.source_url,
    asOf: row.as_of,
    dates,
    series,
    unit: row.payload.unit ?? 'tokens',
  }
}

async function loadCachedCharts(): Promise<Map<string, ChartRow>> {
  const { data, error } = await supabase
    .from('ai_wars_charts')
    .select('id, title, subtitle, source_url, as_of, payload, fetched_at')
  if (error || !data) return new Map()
  return new Map((data as ChartRow[]).map((row) => [row.id, row]))
}

async function persistChart(chart: AiWarsChart): Promise<void> {
  const { error } = await supabase.rpc('upsert_ai_wars_chart', {
    p_id: chart.id,
    p_title: chart.title,
    p_subtitle: chart.subtitle,
    p_source_url: chart.sourceUrl,
    p_as_of: chart.asOf,
    p_payload: {
      dates: chart.dates,
      series: chart.series,
      unit: chart.unit,
    },
  })
  if (error) {
    console.error(`[ai-wars] cache write failed for ${chart.id}:`, error.message)
  }
}

function pickTopKeys(
  totals: Map<string, number>,
  leaders: Set<string>,
  limit: number,
): string[] {
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)
  const picked: string[] = []
  for (const key of [...leaders, ...ranked]) {
    if (picked.includes(key)) continue
    picked.push(key)
    if (picked.length >= limit) break
  }
  return picked
}

async function buildOpenRouterCharts(): Promise<{
  volume: AiWarsChart | null
  vendors: AiWarsChart | null
}> {
  const key = openRouterKey()
  if (!key) return { volume: null, vendors: null }

  const end = new Date()
  const endDate = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - 1),
  )
  const startDate = new Date(endDate)
  startDate.setUTCDate(startDate.getUTCDate() - 89)
  const url = `${OPENROUTER_RANKINGS_URL}?start_date=${toYmd(startDate)}&end_date=${toYmd(endDate)}`

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${key}`,
    },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) return { volume: null, vendors: null }

  const payload = (await res.json()) as {
    data?: OpenRouterRow[]
    meta?: { as_of?: string; end_date?: string; start_date?: string }
  }
  const rows = (payload.data ?? []).filter((r) => r.model_permaslug !== 'other')
  if (!rows.length) return { volume: null, vendors: null }

  const dates = [...new Set(rows.map((r) => r.date))].sort()
  const latest = dates[dates.length - 1]
  const asOf = payload.meta?.as_of?.slice(0, 10) ?? latest

  const modelDay = new Map<string, Map<string, number>>()
  const modelTotals = new Map<string, number>()
  const vendorDay = new Map<string, Map<string, number>>()
  const vendorTotals = new Map<string, number>()
  const dayLeaders = new Set<string>()
  const vendorLeaders = new Set<string>()

  for (const date of dates) {
    modelDay.set(date, new Map())
    vendorDay.set(date, new Map())
  }

  for (const row of rows) {
    const tokens = Number(row.total_tokens)
    if (!Number.isFinite(tokens)) continue
    const modelMap = modelDay.get(row.date)
    if (modelMap) modelMap.set(row.model_permaslug, tokens)
    modelTotals.set(
      row.model_permaslug,
      (modelTotals.get(row.model_permaslug) ?? 0) + tokens,
    )

    const vendor = row.model_permaslug.includes('/')
      ? row.model_permaslug.split('/')[0]
      : row.model_permaslug
    const vendorMap = vendorDay.get(row.date)
    if (vendorMap) {
      vendorMap.set(vendor, (vendorMap.get(vendor) ?? 0) + tokens)
    }
    vendorTotals.set(vendor, (vendorTotals.get(vendor) ?? 0) + tokens)
  }

  for (const date of dates) {
    const models = [...(modelDay.get(date)?.entries() ?? [])].sort((a, b) => b[1] - a[1])
    if (models[0]) dayLeaders.add(models[0][0])
    const vendors = [...(vendorDay.get(date)?.entries() ?? [])].sort((a, b) => b[1] - a[1])
    if (vendors[0]) vendorLeaders.add(vendors[0][0])
  }

  // Prefer models that lead recently.
  for (const [slug] of [...(modelDay.get(latest)?.entries() ?? [])]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)) {
    dayLeaders.add(slug)
  }

  const topModels = pickTopKeys(modelTotals, dayLeaders, 6)
  const topVendors = pickTopKeys(vendorTotals, vendorLeaders, 6)

  const volume: AiWarsChart = {
    id: 'openrouter-volume',
    title: 'OpenRouter volume',
    subtitle: `Daily tokens · ${formatMonthDay(dates[0])}–${formatMonthDay(latest)}`,
    sourceUrl: 'https://openrouter.ai/rankings',
    asOf,
    dates,
    unit: 'tokens',
    series: topModels.map((slug, i) => ({
      id: slug,
      name: displayModelName(slug),
      color: colorAt(i),
      points: dates.map((date) => ({
        date,
        value: modelDay.get(date)?.get(slug) ?? 0,
      })),
    })),
  }

  // Vendor share of daily top-50+other equivalent: use day totals from tracked vendors + rest.
  const vendors: AiWarsChart = {
    id: 'openrouter-vendors',
    title: 'Provider share',
    subtitle: `% of OpenRouter tokens · ${formatMonthDay(dates[0])}–${formatMonthDay(latest)}`,
    sourceUrl: 'https://openrouter.ai/rankings',
    asOf,
    dates,
    unit: 'share',
    series: topVendors.map((vendor, i) => ({
      id: vendor,
      name: vendor,
      color: colorAt(i),
      points: dates.map((date) => {
        const dayMap = vendorDay.get(date) ?? new Map()
        const dayTotal = [...dayMap.values()].reduce((a, b) => a + b, 0)
        const value = dayTotal > 0 ? ((dayMap.get(vendor) ?? 0) / dayTotal) * 100 : 0
        return { date, value }
      }),
    })),
  }

  return { volume, vendors }
}

function weeklyDates(endYmd: string, weeks: number): string[] {
  const end = new Date(`${endYmd}T12:00:00Z`)
  const out: string[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setUTCDate(d.getUTCDate() - i * 7)
    out.push(toYmd(d))
  }
  return out
}

async function fetchArenaSnapshot(date?: string): Promise<{
  date: string
  models: ArenaModel[]
} | null> {
  const url = date ? `${ARENA_URL}&date=${date}` : ARENA_URL
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (compatible; SonarMag/1.0; +https://www.sonarmag.com)',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const payload = (await res.json()) as {
      meta?: { last_updated?: string; fetched_at?: string }
      models?: ArenaModel[]
    }
    const models = payload.models ?? []
    if (!models.length) return null
    return {
      date: date ?? toYmd(new Date()),
      models,
    }
  } catch {
    return null
  }
}

async function buildArenaEloChart(): Promise<AiWarsChart | null> {
  const latest = await fetchArenaSnapshot()
  if (!latest) return null

  // Prefer a calendar end-date that exists in the archive (today's dated
  // snapshot often 404s before the daily scrape lands).
  const endDate = toYmd(
    new Date(Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate() - 1,
    )),
  )
  const sampleDates = weeklyDates(endDate, 12)
  const snapshots = await Promise.all(
    sampleDates.map(async (date) => fetchArenaSnapshot(date)),
  )

  const byDate = new Map<string, ArenaModel[]>()
  for (const snap of snapshots) {
    if (snap) byDate.set(snap.date, snap.models)
  }
  // Always include the freshest undated board under today's label if missing.
  if (!byDate.has(endDate) && !byDate.has(latest.date)) {
    byDate.set(endDate, latest.models)
  } else if (![...byDate.values()].some((models) => models[0]?.model === latest.models[0]?.model)) {
    byDate.set(endDate, latest.models)
  }

  const dates = [...byDate.keys()].sort()
  if (dates.length < 2) return null

  const track = latest.models.slice(0, 5).map((m) => m.model)
  const series: ChartSeries[] = track.map((model, i) => ({
    id: model,
    name: displayModelName(model),
    color: colorAt(i),
    points: dates
      .map((date) => {
        const hit = byDate.get(date)?.find((m) => m.model === model)
        return hit?.score != null
          ? { date, value: hit.score }
          : null
      })
      .filter((p): p is ChartPoint => Boolean(p)),
  }))

  const usable = series.filter((s) => s.points.length >= 2)
  if (!usable.length) return null

  return {
    id: 'arena-elo',
    title: 'Arena Elo',
    subtitle: `Weekly snapshots · current top models`,
    sourceUrl: 'https://arena.ai/leaderboard/text',
    asOf: dates[dates.length - 1] ?? null,
    dates,
    unit: 'elo',
    series: usable,
  }
}

/**
 * Historical AI Wars charts. Cache-first; remotes refresh ~every 18h.
 */
export async function fetchAiWarsHistory(): Promise<AiWarsHistory> {
  const cached = await loadCachedCharts()
  const ids = ['openrouter-volume', 'openrouter-vendors', 'arena-elo'] as const

  const fresh = Object.fromEntries(
    ids.map((id) => {
      const row = cached.get(id)
      if (row && isFresh(row.fetched_at)) {
        return [id, rowToChart(row)]
      }
      return [id, null]
    }),
  ) as Record<(typeof ids)[number], AiWarsChart | null>

  const needOpenRouter = !fresh['openrouter-volume'] || !fresh['openrouter-vendors']
  const needArena = !fresh['arena-elo']

  const [remoteOr, remoteArena] = await Promise.all([
    needOpenRouter ? buildOpenRouterCharts().catch(() => ({ volume: null, vendors: null })) : null,
    needArena ? buildArenaEloChart().catch(() => null) : null,
  ])

  let openrouterVolume = fresh['openrouter-volume']
  let openrouterVendors = fresh['openrouter-vendors']
  let arenaElo = fresh['arena-elo']

  if (remoteOr?.volume) {
    openrouterVolume = remoteOr.volume
    await persistChart(remoteOr.volume)
  } else if (!openrouterVolume) {
    const stale = cached.get('openrouter-volume')
    openrouterVolume = stale ? rowToChart(stale) : null
  }

  if (remoteOr?.vendors) {
    openrouterVendors = remoteOr.vendors
    await persistChart(remoteOr.vendors)
  } else if (!openrouterVendors) {
    const stale = cached.get('openrouter-vendors')
    openrouterVendors = stale ? rowToChart(stale) : null
  }

  if (remoteArena) {
    arenaElo = remoteArena
    await persistChart(remoteArena)
  } else if (!arenaElo) {
    const stale = cached.get('arena-elo')
    arenaElo = stale ? rowToChart(stale) : null
  }

  return { openrouterVolume, openrouterVendors, arenaElo }
}

export function formatChartValue(value: number, unit: AiWarsChart['unit']): string {
  if (unit === 'share') return `${value.toFixed(value >= 10 ? 0 : 1)}%`
  if (unit === 'elo' || unit === 'score') return String(Math.round(value))
  if (unit === 'count') return formatCompactCount(value)
  return formatCompactCount(value)
}

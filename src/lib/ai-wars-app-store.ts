/**
 * US App Store rank tape for major AI consumer apps.
 * Scrapes Apple Marketing Tools (overall) + iTunes RSS (Productivity).
 */

import { supabase } from './supabase'

export type AppStoreRankEntry = {
  rank: number
  name: string
  detail: string
  vendor: string
  appKey: string
  appleId: string
  productivityRank: number | null
  overallRank: number | null
  url: string
}

export type AppStoreRankPoint = {
  measuredOn: string
  productivityRank: number | null
  overallRank: number | null
}

export type AppStoreRankSeries = {
  appKey: string
  name: string
  company: string
  color: string
  points: AppStoreRankPoint[]
}

export type AppStoreRankBoard = {
  asOf: string | null
  chart: 'productivity' | 'overall'
  entries: AppStoreRankEntry[]
  series: AppStoreRankSeries[]
  dates: string[]
}

type TrackedApp = {
  key: string
  appleId: string
  name: string
  company: string
  color: string
}

/** Curated AI consumer apps — Productivity-category focus. */
const APPS: TrackedApp[] = [
  {
    key: 'chatgpt',
    appleId: '6448311069',
    name: 'ChatGPT',
    company: 'OpenAI',
    color: '#10a37f',
  },
  {
    key: 'claude',
    appleId: '6473753684',
    name: 'Claude',
    company: 'Anthropic',
    color: '#d97706',
  },
  {
    key: 'gemini',
    appleId: '6477489729',
    name: 'Gemini',
    company: 'Google',
    color: '#1a73e8',
  },
  {
    key: 'grok',
    appleId: '6670324846',
    name: 'Grok',
    company: 'xAI',
    color: '#171717',
  },
  {
    key: 'meta-ai',
    appleId: '1558240027',
    name: 'Meta AI',
    company: 'Meta',
    color: '#0668e1',
  },
  {
    key: 'perplexity',
    appleId: '1668000334',
    name: 'Perplexity',
    company: 'Perplexity',
    color: '#20808d',
  },
  {
    key: 'copilot',
    appleId: '6472538445',
    name: 'Copilot',
    company: 'Microsoft',
    color: '#00a4ef',
  },
  {
    key: 'deepseek',
    appleId: '6737597349',
    name: 'DeepSeek',
    company: 'DeepSeek',
    color: '#4d6bfe',
  },
]

const OVERALL_URL =
  'https://rss.applemarketingtools.com/api/v2/us/apps/top-free/100/apps.json'
/** Productivity = genre 6007 */
const PRODUCTIVITY_URL =
  'https://itunes.apple.com/us/rss/topfreeapplications/limit=100/genre=6007/json'

const MAX_AGE_MS = 6 * 60 * 60 * 1000
const UA = 'SonarMag/1.0 (+https://sonarmag.com/ai-wars)'

type DbRow = {
  measured_on: string
  app_key: string
  name: string
  company: string
  apple_id: string
  productivity_rank: number | null
  overall_rank: number | null
  url: string | null
  fetched_at: string
}

function emptyBoard(): AppStoreRankBoard {
  return {
    asOf: null,
    chart: 'productivity',
    entries: [],
    series: [],
    dates: [],
  }
}

function appUrl(appleId: string): string {
  return `https://apps.apple.com/us/app/id${appleId}`
}

/** Inverse rank for charts: #1 → 100, missing → null. */
export function rankToScore(rank: number | null, ceiling = 100): number | null {
  if (rank == null || !Number.isFinite(rank) || rank < 1) return null
  if (rank > ceiling) return null
  return ceiling + 1 - rank
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function ranksFromMarketingTools(
  payload: unknown,
): Map<string, { rank: number; name: string }> {
  const map = new Map<string, { rank: number; name: string }>()
  const results = (payload as { feed?: { results?: Array<{ id?: string; name?: string }> } })
    ?.feed?.results
  if (!Array.isArray(results)) return map
  results.forEach((item, i) => {
    const id = item.id?.trim()
    if (!id) return
    map.set(id, { rank: i + 1, name: item.name?.trim() || id })
  })
  return map
}

function ranksFromItunesRss(
  payload: unknown,
): Map<string, { rank: number; name: string }> {
  const map = new Map<string, { rank: number; name: string }>()
  const entry = (payload as { feed?: { entry?: unknown } })?.feed?.entry
  const list = Array.isArray(entry) ? entry : entry ? [entry] : []
  list.forEach((raw, i) => {
    const item = raw as {
      id?: { attributes?: { 'im:id'?: string } }
      'im:name'?: { label?: string }
    }
    const id = item.id?.attributes?.['im:id']?.trim()
    if (!id) return
    map.set(id, {
      rank: i + 1,
      name: item['im:name']?.label?.trim() || id,
    })
  })
  return map
}

async function scrapeSnapshot(): Promise<AppStoreRankEntry[] | null> {
  const [overallPayload, prodPayload] = await Promise.all([
    fetchJson(OVERALL_URL),
    fetchJson(PRODUCTIVITY_URL),
  ])
  if (!overallPayload && !prodPayload) return null

  const overall = ranksFromMarketingTools(overallPayload)
  const productivity = ranksFromItunesRss(prodPayload)

  const entries: AppStoreRankEntry[] = APPS.map((app) => {
    const prod = productivity.get(app.appleId)
    const ov = overall.get(app.appleId)
    return {
      rank: 0,
      name: app.name,
      detail: '',
      vendor: app.company,
      appKey: app.key,
      appleId: app.appleId,
      productivityRank: prod?.rank ?? null,
      overallRank: ov?.rank ?? null,
      url: appUrl(app.appleId),
    }
  })

  // Sort by productivity rank (nulls last), then overall.
  entries.sort((a, b) => {
    const ap = a.productivityRank ?? 9999
    const bp = b.productivityRank ?? 9999
    if (ap !== bp) return ap - bp
    const ao = a.overallRank ?? 9999
    const bo = b.overallRank ?? 9999
    return ao - bo
  })

  entries.forEach((e, i) => {
    e.rank = i + 1
    const bits: string[] = []
    if (e.productivityRank != null) bits.push(`#${e.productivityRank} Productivity`)
    else bits.push('Outside Productivity top 100')
    if (e.overallRank != null) bits.push(`#${e.overallRank} overall`)
    e.detail = bits.join(' · ')
  })

  return entries
}

async function persistSnapshot(entries: AppStoreRankEntry[]): Promise<void> {
  const rows = entries.map((e) => ({
    app_key: e.appKey,
    name: e.name,
    company: e.vendor,
    apple_id: e.appleId,
    productivity_rank: e.productivityRank,
    overall_rank: e.overallRank,
    url: e.url,
  }))
  const { error } = await supabase.rpc('upsert_ai_wars_app_store_snapshot', {
    p_rows: rows,
  })
  if (error) {
    console.error('[ai-wars-app-store] cache write failed:', error.message)
  }
}

async function metaFetchedAt(): Promise<string | null> {
  const { data } = await supabase
    .from('ai_wars_app_store_meta')
    .select('fetched_at')
    .eq('id', 'us')
    .maybeSingle()
  return (data as { fetched_at?: string } | null)?.fetched_at ?? null
}

function isFresh(iso: string | null): boolean {
  if (!iso) return false
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return false
  return Date.now() - t < MAX_AGE_MS
}

function boardFromRows(rows: DbRow[]): AppStoreRankBoard {
  if (!rows.length) return emptyBoard()

  const dates = [...new Set(rows.map((r) => r.measured_on))].sort()
  const latest = dates[dates.length - 1]
  const latestRows = rows.filter((r) => r.measured_on === latest)

  const entries: AppStoreRankEntry[] = latestRows
    .map((r) => ({
      rank: 0,
      name: r.name,
      detail: '',
      vendor: r.company,
      appKey: r.app_key,
      appleId: r.apple_id,
      productivityRank: r.productivity_rank,
      overallRank: r.overall_rank,
      url: r.url || appUrl(r.apple_id),
    }))
    .sort((a, b) => {
      const ap = a.productivityRank ?? 9999
      const bp = b.productivityRank ?? 9999
      if (ap !== bp) return ap - bp
      return (a.overallRank ?? 9999) - (b.overallRank ?? 9999)
    })
    .map((e, i) => {
      const bits: string[] = []
      if (e.productivityRank != null) bits.push(`#${e.productivityRank} Productivity`)
      else bits.push('Outside Productivity top 100')
      if (e.overallRank != null) bits.push(`#${e.overallRank} overall`)
      return { ...e, rank: i + 1, detail: bits.join(' · ') }
    })

  const series: AppStoreRankSeries[] = APPS.map((app) => ({
    appKey: app.key,
    name: app.name,
    company: app.company,
    color: app.color,
    points: dates.map((d) => {
      const row = rows.find((r) => r.app_key === app.key && r.measured_on === d)
      return {
        measuredOn: d,
        productivityRank: row?.productivity_rank ?? null,
        overallRank: row?.overall_rank ?? null,
      }
    }),
  })).filter((s) => s.points.some((p) => p.productivityRank != null || p.overallRank != null))

  return {
    asOf: latest,
    chart: 'productivity',
    entries,
    series,
    dates,
  }
}

/**
 * App Store rank board. Cache-first; refreshes Apple charts ~every 6h and
 * appends today's snapshot so the tape builds over time.
 */
export async function fetchAppStoreRanks(): Promise<AppStoreRankBoard> {
  const fetchedAt = await metaFetchedAt()

  if (!isFresh(fetchedAt)) {
    const scraped = await scrapeSnapshot()
    if (scraped?.length) await persistSnapshot(scraped)
  }

  const { data, error } = await supabase
    .from('ai_wars_app_store_ranks')
    .select(
      'measured_on, app_key, name, company, apple_id, productivity_rank, overall_rank, url, fetched_at',
    )
    .order('measured_on', { ascending: true })

  if (error || !data?.length) {
    // Cold start: return live scrape even if persist failed.
    const scraped = await scrapeSnapshot()
    if (!scraped?.length) return emptyBoard()
    const today = new Date().toISOString().slice(0, 10)
    return {
      asOf: today,
      chart: 'productivity',
      entries: scraped,
      series: APPS.map((app) => {
        const e = scraped.find((s) => s.appKey === app.key)
        return {
          appKey: app.key,
          name: app.name,
          company: app.company,
          color: app.color,
          points: e
            ? [
                {
                  measuredOn: today,
                  productivityRank: e.productivityRank,
                  overallRank: e.overallRank,
                },
              ]
            : [],
        }
      }).filter((s) => s.points.length),
      dates: [today],
    }
  }

  return boardFromRows(data as DbRow[])
}

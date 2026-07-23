import { supabase } from './supabase'

/** How long a successful sync stays fresh (matches RPC default). */
const MAX_AGE_MS = 45 * 60 * 1000

/** Lookback window for “Popular” (unique visitors). */
const WINDOW_DAYS = 7

/** Persist more than the homepage rail so /popular can show a longer list. */
const STORE_LIMIT = 10

export type PopularRankEntry = {
  slug: string
  rank: number
  visitors: number
  pageviews: number
}

export type PopularSyncResult = {
  ok: boolean
  updated: boolean
  entries: PopularRankEntry[]
  reason?: string
  error?: string
}

type AnalyticsAggregateRow = {
  requestPath?: string
  pageviews?: number
  visitors?: number
  count?: number
}

type PopularSettingsValue = {
  window?: string
  synced_at?: string
  entries?: PopularRankEntry[]
}

function env(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env[name]) {
    return process.env[name]
  }
  const meta = (import.meta as ImportMeta & { env: Record<string, string | undefined> })
    .env
  return meta[name]
}

function slugFromArticlePath(path: string): string | null {
  const cleaned = path.split('?')[0]?.split('#')[0] ?? ''
  const match = cleaned.match(/^\/article\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/i)
  return match?.[1]?.toLowerCase() ?? null
}

async function rankingIsFresh(): Promise<boolean> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('updated_at')
    .eq('key', 'popular_ranking')
    .maybeSingle()

  if (error || !data?.updated_at) return false
  const t = Date.parse(data.updated_at)
  if (!Number.isFinite(t)) return false
  return Date.now() - t < MAX_AGE_MS
}

async function fetchTopArticlePaths(): Promise<PopularRankEntry[]> {
  const token = env('VERCEL_API_TOKEN') || env('VERCEL_TOKEN')
  const projectId = env('VERCEL_PROJECT_ID')
  const teamId = env('VERCEL_TEAM_ID') || env('VERCEL_ORG_ID')

  if (!token) {
    throw new Error('Missing VERCEL_API_TOKEN (or VERCEL_TOKEN)')
  }
  if (!projectId) {
    throw new Error('Missing VERCEL_PROJECT_ID')
  }

  const until = new Date()
  const since = new Date(until.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const params = new URLSearchParams()
  params.set('projectId', projectId)
  params.set('since', since.toISOString())
  params.set('until', until.toISOString())
  params.append('by', 'requestPath')
  params.set('limit', '50')
  params.set('filter', "startswith(requestPath,'/article/')")
  if (teamId) params.set('teamId', teamId)

  const res = await fetch(
    `https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    },
  )

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(
      `Vercel Analytics API ${res.status}: ${body.slice(0, 240) || res.statusText}`,
    )
  }

  const payload = (await res.json()) as { data?: AnalyticsAggregateRow[] }
  const rows = Array.isArray(payload.data) ? payload.data : []

  const bySlug = new Map<string, { visitors: number; pageviews: number }>()
  for (const row of rows) {
    const path = row.requestPath
    if (!path) continue
    const slug = slugFromArticlePath(path)
    if (!slug) continue
    const visitors = Number(row.visitors ?? 0)
    const pageviews = Number(row.pageviews ?? row.count ?? 0)
    const prev = bySlug.get(slug)
    if (prev) {
      prev.visitors += Number.isFinite(visitors) ? visitors : 0
      prev.pageviews += Number.isFinite(pageviews) ? pageviews : 0
    } else {
      bySlug.set(slug, {
        visitors: Number.isFinite(visitors) ? visitors : 0,
        pageviews: Number.isFinite(pageviews) ? pageviews : 0,
      })
    }
  }

  const ranked = [...bySlug.entries()]
    .sort((a, b) => {
      if (b[1].visitors !== a[1].visitors) return b[1].visitors - a[1].visitors
      return b[1].pageviews - a[1].pageviews
    })
    .slice(0, STORE_LIMIT)

  if (!ranked.length) return []

  // Only keep slugs that exist as published articles.
  const { data: published, error } = await supabase
    .from('articles')
    .select('slug')
    .eq('status', 'published')
    .in(
      'slug',
      ranked.map(([slug]) => slug),
    )

  if (error) throw error

  const allowed = new Set((published ?? []).map((row) => row.slug as string))
  const entries: PopularRankEntry[] = []
  for (const [slug, stats] of ranked) {
    if (!allowed.has(slug)) continue
    entries.push({
      slug,
      rank: entries.length + 1,
      visitors: stats.visitors,
      pageviews: stats.pageviews,
    })
  }
  return entries
}

/**
 * Pull top /article/* paths from Vercel Web Analytics and write popular_rank.
 * Age-gated unless `force` is true (cron).
 */
export async function syncPopularFromAnalytics(
  options: { force?: boolean } = {},
): Promise<PopularSyncResult> {
  const force = Boolean(options.force)

  try {
    if (!force && (await rankingIsFresh())) {
      return { ok: true, updated: false, entries: [], reason: 'fresh' }
    }

    const entries = await fetchTopArticlePaths()
    if (!entries.length) {
      return {
        ok: true,
        updated: false,
        entries: [],
        reason: 'no_article_traffic',
      }
    }

    const { data, error } = await supabase.rpc('upsert_popular_ranking', {
      p_entries: entries,
      p_window: `${WINDOW_DAYS}d`,
      p_max_age: force ? '0 seconds' : '45 minutes',
    })

    if (error) {
      return {
        ok: false,
        updated: false,
        entries,
        error: error.message,
      }
    }

    return {
      ok: true,
      updated: Boolean(data),
      entries,
      reason: data ? 'synced' : 'fresh',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[popular-sync]', message)
    return { ok: false, updated: false, entries: [], error: message }
  }
}

/**
 * Best-effort refresh before homepage / popular page reads.
 * Never throws — stale ranks beat an empty rail.
 */
export async function ensurePopularRanking(): Promise<void> {
  const token = env('VERCEL_API_TOKEN') || env('VERCEL_TOKEN')
  const projectId = env('VERCEL_PROJECT_ID')
  // Without credentials, keep whatever popular_rank already exists.
  if (!token || !projectId) return
  await syncPopularFromAnalytics({ force: false })
}

export async function readPopularSyncMeta(): Promise<PopularSettingsValue | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'popular_ranking')
    .maybeSingle()

  if (error || data?.value == null) return null
  return data.value as PopularSettingsValue
}

/**
 * Changelog / public-news velocity for AI labs.
 * Scrapes RSS feeds + news sitemaps; aggregates posts/7d and posts/30d.
 */

import { supabase } from './supabase'

export type ChangelogPost = {
  id: string
  companyId: string
  company: string
  title: string
  url: string
  publishedAt: string
  source: string
}

export type ChangelogCompany = {
  companyId: string
  company: string
  color: string
  posts7d: number
  posts30d: number
  recent: ChangelogPost[]
}

export type ChangelogWeekPoint = {
  weekStart: string
  count: number
}

export type ChangelogSeries = {
  companyId: string
  company: string
  color: string
  points: ChangelogWeekPoint[]
}

export type ChangelogBoard = {
  asOf: string | null
  entries: Array<{
    rank: number
    name: string
    detail: string
    vendor: string
    companyId: string
    posts7d: number
    posts30d: number
  }>
  companies: ChangelogCompany[]
  series: ChangelogSeries[]
  weeks: string[]
}

type FeedSource = {
  companyId: string
  company: string
  color: string
  kind: 'rss' | 'news-sitemap'
  url: string
  /** For news-sitemap: match article locs (not the index page). */
  locPattern?: RegExp
}

const SOURCES: FeedSource[] = [
  {
    companyId: 'openai',
    company: 'OpenAI',
    color: '#10a37f',
    kind: 'rss',
    url: 'https://openai.com/news/rss.xml',
  },
  {
    companyId: 'anthropic',
    company: 'Anthropic',
    color: '#d97706',
    kind: 'news-sitemap',
    url: 'https://www.anthropic.com/sitemap.xml',
    locPattern: /^https:\/\/www\.anthropic\.com\/news\/[^/]+\/?$/,
  },
  {
    companyId: 'xai',
    company: 'xAI',
    color: '#171717',
    kind: 'news-sitemap',
    url: 'https://x.ai/sitemap.xml',
    locPattern: /^https:\/\/x\.ai\/news\/[^/]+\/?$/,
  },
  {
    companyId: 'google',
    company: 'Google',
    color: '#1a73e8',
    kind: 'rss',
    url: 'https://blog.google/technology/ai/rss/',
  },
  {
    companyId: 'deepmind',
    company: 'DeepMind',
    color: '#ea4335',
    kind: 'rss',
    url: 'https://deepmind.google/blog/rss.xml',
  },
  {
    companyId: 'mistral',
    company: 'Mistral',
    color: '#f54e00',
    kind: 'rss',
    url: 'https://mistral.ai/rss.xml',
  },
  {
    companyId: 'cursor',
    company: 'Cursor',
    color: '#0f7a8a',
    kind: 'rss',
    url: 'https://cursor.com/changelog/rss.xml',
  },
]

const MAX_AGE_MS = 12 * 60 * 60 * 1000
/** Keep a year so the weekly chart can run long. */
const KEEP_DAYS = 365
/** Monday-start weeks shown on the posts-per-week chart. */
const CHART_WEEKS = 52
const UA = 'SonarMag/1.0 (+https://sonarmag.com/ai-wars)'

type DbPost = {
  id: string
  company_id: string
  company: string
  title: string
  url: string
  published_at: string
  source: string
}

function emptyBoard(): ChangelogBoard {
  return { asOf: null, entries: [], companies: [], series: [], weeks: [] }
}

/** Stable short id without Node crypto (works on Edge + Node). */
function postId(url: string): string {
  let h = 2166136261
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `p${(h >>> 0).toString(16)}${url.length.toString(16)}`
}

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function titleFromSlug(url: string): string {
  const slug = url.replace(/\/$/, '').split('/').pop() || url
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function parseRfc822(dateStr: string): Date | null {
  const t = Date.parse(dateStr)
  if (!Number.isFinite(t)) return null
  return new Date(t)
}

function cutoffIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': UA,
      },
      signal: AbortSignal.timeout(20000),
      redirect: 'follow',
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function parseRssItems(
  xml: string,
  source: FeedSource,
  since: Date,
): ChangelogPost[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []
  const out: ChangelogPost[] = []
  for (const item of items) {
    const titleM = item.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
    const linkM =
      item.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i) ||
      item.match(/<guid\b[^>]*>([\s\S]*?)<\/guid>/i)
    const dateM = item.match(/<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i)
    if (!titleM || !linkM || !dateM) continue
    const title = decodeXml(titleM[1])
    const url = decodeXml(linkM[1])
    const published = parseRfc822(decodeXml(dateM[1]))
    if (!title || !url || !published || published < since) continue
    if (title.toLowerCase() === `${source.company} blog`.toLowerCase()) continue
    out.push({
      id: postId(url),
      companyId: source.companyId,
      company: source.company,
      title,
      url,
      publishedAt: published.toISOString(),
      source: source.url,
    })
  }
  return out
}

function parseNewsSitemap(
  xml: string,
  source: FeedSource,
  since: Date,
): ChangelogPost[] {
  const pattern = source.locPattern
  if (!pattern) return []
  const out: ChangelogPost[] = []
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/gi) ?? []
  for (const block of blocks) {
    const locM = block.match(/<loc>([\s\S]*?)<\/loc>/i)
    const modM = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/i)
    if (!locM || !modM) continue
    const url = decodeXml(locM[1])
    if (!pattern.test(url)) continue
    if (/\/news\/?$/.test(url)) continue
    const published = new Date(decodeXml(modM[1]))
    if (Number.isNaN(published.getTime()) || published < since) continue
    out.push({
      id: postId(url),
      companyId: source.companyId,
      company: source.company,
      title: titleFromSlug(url),
      url,
      publishedAt: published.toISOString(),
      source: source.url,
    })
  }
  return out
}

async function scrapePosts(): Promise<ChangelogPost[]> {
  const since = new Date(cutoffIso(KEEP_DAYS))
  const batches = await Promise.all(
    SOURCES.map(async (source) => {
      const text = await fetchText(source.url)
      if (!text) return [] as ChangelogPost[]
      if (source.kind === 'news-sitemap') {
        return parseNewsSitemap(text, source, since)
      }
      return parseRssItems(text, source, since)
    }),
  )
  const byUrl = new Map<string, ChangelogPost>()
  for (const post of batches.flat()) {
    byUrl.set(post.url, post)
  }
  return [...byUrl.values()]
}

async function persistPosts(posts: ChangelogPost[]): Promise<void> {
  if (!posts.length) return
  const sorted = [...posts].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  )
  // RPC allows 2000; keep a little headroom.
  const payload = sorted.slice(0, 1900).map((p) => ({
    id: p.id,
    company_id: p.companyId,
    company: p.company,
    title: p.title,
    url: p.url,
    published_at: p.publishedAt,
    source: p.source,
  }))
  const { error } = await supabase.rpc('upsert_ai_wars_changelog_posts', {
    p_posts: payload,
  })
  if (error) {
    console.error('[ai-wars-changelog] cache write failed:', error.message)
  }
}

async function metaFetchedAt(): Promise<string | null> {
  const { data } = await supabase
    .from('ai_wars_changelog_meta')
    .select('fetched_at')
    .eq('id', 'all')
    .maybeSingle()
  return (data as { fetched_at?: string } | null)?.fetched_at ?? null
}

function isFresh(iso: string | null): boolean {
  if (!iso) return false
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return false
  return Date.now() - t < MAX_AGE_MS
}

function mondayUtc(d: Date): string {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  )
  const day = x.getUTCDay() // 0 Sun
  const diff = day === 0 ? -6 : 1 - day
  x.setUTCDate(x.getUTCDate() + diff)
  return x.toISOString().slice(0, 10)
}

function boardFromPosts(posts: ChangelogPost[]): ChangelogBoard {
  if (!posts.length) return emptyBoard()

  const now = Date.now()
  const t7 = now - 7 * 24 * 60 * 60 * 1000
  const t30 = now - 30 * 24 * 60 * 60 * 1000

  const colorById = new Map(SOURCES.map((s) => [s.companyId, s.color]))
  const byCompany = new Map<string, ChangelogPost[]>()
  for (const p of posts) {
    const list = byCompany.get(p.companyId) ?? []
    list.push(p)
    byCompany.set(p.companyId, list)
  }

  const companies: ChangelogCompany[] = [...byCompany.entries()]
    .map(([companyId, list]) => {
      const sorted = [...list].sort(
        (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
      )
      const company = sorted[0]?.company ?? companyId
      return {
        companyId,
        company,
        color: colorById.get(companyId) ?? '#171717',
        posts7d: sorted.filter((p) => Date.parse(p.publishedAt) >= t7).length,
        posts30d: sorted.filter((p) => Date.parse(p.publishedAt) >= t30).length,
        recent: sorted.slice(0, 4),
      }
    })
    .sort((a, b) => b.posts7d - a.posts7d || b.posts30d - a.posts30d)

  // Weekly series: up to CHART_WEEKS, trimmed to the oldest post we actually have.
  const oldestMs = Math.min(...posts.map((p) => Date.parse(p.publishedAt)))
  const oldestMonday = mondayUtc(new Date(oldestMs))
  const newestMonday = mondayUtc(new Date())
  const weeks: string[] = []
  for (let i = CHART_WEEKS - 1; i >= 0; i--) {
    const d = new Date(`${newestMonday}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - i * 7)
    const w = d.toISOString().slice(0, 10)
    if (w >= oldestMonday) weeks.push(w)
  }

  const series: ChangelogSeries[] = companies.map((c) => {
    const counts = new Map(weeks.map((w) => [w, 0]))
    for (const p of byCompany.get(c.companyId) ?? []) {
      const w = mondayUtc(new Date(p.publishedAt))
      if (counts.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1)
    }
    return {
      companyId: c.companyId,
      company: c.company,
      color: c.color,
      points: weeks.map((weekStart) => ({
        weekStart,
        count: counts.get(weekStart) ?? 0,
      })),
    }
  })

  const latest = [...posts].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  )[0]?.publishedAt

  return {
    asOf: latest?.slice(0, 10) ?? null,
    entries: companies.map((c, i) => ({
      rank: i + 1,
      name: c.company,
      detail: `${c.posts7d} posts · 7d · ${c.posts30d} · 30d`,
      vendor: c.companyId,
      companyId: c.companyId,
      posts7d: c.posts7d,
      posts30d: c.posts30d,
    })),
    companies,
    series,
    weeks,
  }
}

/**
 * Changelog velocity board. Cache-first; refreshes RSS/sitemap ~every 12h.
 */
export async function fetchChangelogVelocity(): Promise<ChangelogBoard> {
  const fetchedAt = await metaFetchedAt()

  if (!isFresh(fetchedAt)) {
    const scraped = await scrapePosts()
    if (scraped.length) await persistPosts(scraped)
  }

  const { data, error } = await supabase
    .from('ai_wars_changelog_posts')
    .select('id, company_id, company, title, url, published_at, source')
    .gte('published_at', cutoffIso(KEEP_DAYS))
    .order('published_at', { ascending: false })

  if (error || !data?.length) {
    const scraped = await scrapePosts()
    return boardFromPosts(scraped)
  }

  const posts: ChangelogPost[] = (data as DbPost[]).map((r) => ({
    id: r.id,
    companyId: r.company_id,
    company: r.company,
    title: r.title,
    url: r.url,
    publishedAt: r.published_at,
    source: r.source,
  }))

  return boardFromPosts(posts)
}

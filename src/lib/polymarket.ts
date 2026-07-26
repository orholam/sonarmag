/**
 * Polymarket Gamma API (public, no auth) — AI-relevant prediction markets
 * for the AI Wars board. Prefers longer-horizon events over markets about
 * to resolve.
 */

export type PolymarketOutcome = {
  name: string
  /** Implied probability 0–100 */
  yesPct: number
}

export type PolymarketEventCard = {
  title: string
  slug: string
  url: string
  endDate: string | null
  volume24hr: number | null
  outcomes: PolymarketOutcome[]
}

export type PolymarketAiWars = {
  asOf: string | null
  events: PolymarketEventCard[]
  /** @deprecated kept for older callers — always null */
  us: PolymarketEventCard | null
  /** @deprecated kept for older callers — always null */
  international: PolymarketEventCard | null
}

const GAMMA = 'https://gamma-api.polymarket.com'

/** Prefer these when still open and far enough from resolution. */
const PRIORITY_SLUGS = [
  'which-company-has-best-ai-model-end-of-august-20260717015626546',
  'which-company-has-the-best-ai-agent-end-of-august-20260716210246314',
  'next-claude-opus-text-arena-debut-20260714204425670',
  'anthropic-ipo-by',
  'will-any-ai-model-reach-overall-arena-score-by-september-30',
  'will-any-ai-model-reach-coding-arena-score-by-december-31',
  'which-company-has-the-best-ai-model-end-of-september-20260717143435868',
  'which-company-has-the-best-ai-agent-end-of-september-20260716211946456',
  'best-ai-model-on-august-10-20260724144642842',
  'us-government-removes-public-access-to-a-major-chinese-ai-model-in-2026-20260703203328223',
  '2-ai-lab-end-of-august-style-control-on-20260720231255330',
  'will-anthropic-or-openai-ipo-first',
  'will-anthropics-valuation-hit-by-december-31',
  'highest-claude-score-on-humanitys-last-exam-in-2026-20260723190836285',
  'highest-openai-score-on-humanitys-last-exam-in-2026-20260723225144062',
]

const SEARCH_QUERIES = [
  'best AI model',
  'AI agent',
  'Arena Score',
  'Anthropic IPO',
  'Claude Arena',
  'Chinese AI',
  'Coding Arena',
]

const AI_TITLE =
  /\b(ai|anthropic|openai|claude|gemini|deepseek|arena|llm|gpt|grok|cursor|coding agent|ai lab|ai model|ai agent)\b/i

const NOISE_TITLE =
  /\b(largest company|elon musk|net worth|dow say|boeing|apple app store|foldable|searched actor|databricks|cxmt|what will elon post|earnings call)\b/i

/** Skip markets resolving within this many days. */
const MIN_DAYS_OUT = 10
const MAX_EVENTS = 6
const MAX_OUTCOMES = 8

type GammaMarket = {
  groupItemTitle?: string
  question?: string
  outcomes?: string | string[]
  outcomePrices?: string | string[]
  volume?: number | string
  volumeNum?: number
  active?: boolean
  closed?: boolean
}

type GammaEvent = {
  title?: string
  slug?: string
  endDate?: string
  volume?: number
  volume24hr?: number
  closed?: boolean
  active?: boolean
  markets?: GammaMarket[]
}

function parseJsonArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  }
  return []
}

function pct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 1000) / 10))
}

function marketVolume(m: GammaMarket): number {
  if (typeof m.volumeNum === 'number' && Number.isFinite(m.volumeNum)) {
    return m.volumeNum
  }
  const v = typeof m.volume === 'string' ? Number(m.volume) : m.volume
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function isPlaceholderLabel(name: string): boolean {
  return (
    /^company\s+[a-z]$/i.test(name) ||
    /^option\s+[a-z0-9]+$/i.test(name) ||
    /^other$/i.test(name)
  )
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return null
  return (t - Date.now()) / (1000 * 60 * 60 * 24)
}

function farEnough(event: GammaEvent): boolean {
  const d = daysUntil(event.endDate)
  if (d == null) return true
  return d >= MIN_DAYS_OUT
}

function isAiRelevant(title: string): boolean {
  if (NOISE_TITLE.test(title)) return false
  return AI_TITLE.test(title)
}

function outcomesFromEvent(markets: GammaMarket[]): PolymarketOutcome[] {
  const out: PolymarketOutcome[] = []

  for (const m of markets) {
    if (m.closed) continue
    // Placeholder legs Polymarket leaves in the event shell.
    if (m.active === false) continue

    const outcomes = parseJsonArray(m.outcomes)
    const prices = parseJsonArray(m.outcomePrices).map(Number)
    if (!outcomes.length || prices.length !== outcomes.length) continue
    if (prices.some((p) => !Number.isFinite(p))) continue

    const vol = marketVolume(m)
    const label = (m.groupItemTitle || '').trim()
    const yesNo =
      outcomes.length === 2 &&
      outcomes.map((o) => o.toLowerCase()).includes('yes') &&
      outcomes.map((o) => o.toLowerCase()).includes('no')

    if (yesNo) {
      const yesIdx = outcomes.findIndex((o) => o.toLowerCase() === 'yes')
      const yes = prices[yesIdx] ?? 0
      const name = label || (m.question || 'Yes').trim()
      if (!name || isPlaceholderLabel(name)) continue
      // Untraded 50/50 shells.
      if (vol <= 0 && Math.abs(yes - 0.5) < 0.001) continue
      // Effectively dead / dust.
      if (yes < 0.005) continue
      out.push({ name, yesPct: pct(yes) })
      continue
    }

    for (let i = 0; i < outcomes.length; i++) {
      const name = outcomes[i]?.trim()
      if (!name || isPlaceholderLabel(name)) continue
      const p = prices[i] ?? 0
      if (p < 0.005 || p > 0.995) continue
      out.push({ name, yesPct: pct(p) })
    }
  }

  out.sort((a, b) => b.yesPct - a.yesPct)
  return out.slice(0, MAX_OUTCOMES)
}

function mapEvent(event: GammaEvent): PolymarketEventCard | null {
  if (!event.title || !event.slug || event.closed) return null
  if (!farEnough(event)) return null
  if (!isAiRelevant(event.title)) return null

  const outcomes = outcomesFromEvent(event.markets ?? [])
  if (!outcomes.length) return null

  return {
    title: event.title,
    slug: event.slug,
    url: `https://polymarket.com/event/${event.slug}`,
    endDate: event.endDate ?? null,
    volume24hr:
      typeof event.volume24hr === 'number' ? event.volume24hr : null,
    outcomes,
  }
}

async function gammaFetch(path: string): Promise<unknown> {
  const res = await fetch(`${GAMMA}${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(9000),
  })
  if (!res.ok) return null
  return res.json()
}

async function fetchEventBySlug(slug: string): Promise<GammaEvent | null> {
  const data = await gammaFetch(`/events?slug=${encodeURIComponent(slug)}`)
  if (!data) return null
  if (Array.isArray(data)) return (data[0] as GammaEvent) ?? null
  return data as GammaEvent
}

async function discoverCandidateSlugs(): Promise<string[]> {
  const slugs = new Set<string>(PRIORITY_SLUGS)

  const searches = await Promise.all(
    SEARCH_QUERIES.map(async (q) => {
      const data = await gammaFetch(
        `/public-search?q=${encodeURIComponent(q)}&limit_per_type=10`,
      )
      return data as { events?: GammaEvent[] } | null
    }),
  )

  for (const data of searches) {
    for (const e of data?.events ?? []) {
      if (e.slug && !e.closed) slugs.add(e.slug)
    }
  }

  const tagged = await gammaFetch(
    '/events?tag_slug=ai&closed=false&limit=25&order=volume24hr&ascending=false',
  )
  if (Array.isArray(tagged)) {
    for (const e of tagged as GammaEvent[]) {
      if (e.slug && !e.closed) slugs.add(e.slug)
    }
  }

  return [...slugs]
}

export async function fetchPolymarketAiWars(): Promise<PolymarketAiWars> {
  try {
    const slugs = await discoverCandidateSlugs()
    const raw = await Promise.all(slugs.map((s) => fetchEventBySlug(s)))

    const priorityIndex = new Map(PRIORITY_SLUGS.map((s, i) => [s, i]))
    const cards = raw
      .map((e) => (e ? mapEvent(e) : null))
      .filter((c): c is PolymarketEventCard => c != null)
      .sort((a, b) => {
        const pa = priorityIndex.has(a.slug) ? 0 : 1
        const pb = priorityIndex.has(b.slug) ? 0 : 1
        if (pa !== pb) return pa - pb
        if (priorityIndex.has(a.slug) && priorityIndex.has(b.slug)) {
          return (
            (priorityIndex.get(a.slug) ?? 99) -
            (priorityIndex.get(b.slug) ?? 99)
          )
        }
        return (b.volume24hr ?? 0) - (a.volume24hr ?? 0)
      })
      .slice(0, MAX_EVENTS)

    return {
      asOf: new Date().toISOString(),
      events: cards,
      us: null,
      international: null,
    }
  } catch (err) {
    console.error('[polymarket]', err instanceof Error ? err.message : err)
    return { asOf: null, events: [], us: null, international: null }
  }
}

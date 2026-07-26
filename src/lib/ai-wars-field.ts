import type { AiWarsChart } from './ai-wars-history'
import { supabase } from './supabase'

export type FieldRegion = 'us' | 'international'

/** Desk assessment scores, 0–100. */
export type FieldScores = {
  /** Strategic seat in models, distribution, and capital. */
  positioning: number
  /** Near-term momentum: usage, preference, community chatter. */
  heat: number
}

export type FieldCompany = {
  id: string
  name: string
  region: FieldRegion
  /** Domain for logo.dev */
  domain: string
  hq: string
  /** True if primary / frontier models are open-weight or self-hostable (not side experiments). */
  openWeight: boolean
  /** One-line card dek. */
  blurb: string
  /** Full desk analysis (≈3 paragraphs) backing the scores. */
  analysis: [string, string, string]
  scores: FieldScores
  /** ISO timestamp when the desk last edited this row. */
  updatedAt: string | null
}

export type RankedFieldCompany = FieldCompany & {
  /** Rank within region (1 = strongest), from positioning + heat. */
  rank: number
}

/** One desk snapshot of positioning (0–100) by company id. */
export type FieldPositioningSnapshot = {
  measuredOn: string
  positioning: Record<string, number>
}

export type AiWarsFieldBoard = {
  companies: FieldCompany[]
  history: FieldPositioningSnapshot[]
}

type CompanyRow = {
  id: string
  name: string
  region: string
  domain: string
  hq: string
  open_weight: boolean
  blurb: string
  analysis: unknown
  positioning: number
  heat: number
  updated_at: string | null
}

type HistoryRow = {
  company_id: string
  measured_on: string
  positioning: number
}

const FIELD_COLORS = [
  '#e11d2e',
  '#171717',
  '#0f7a8a',
  '#c47a00',
  '#1f5fbf',
  '#8b4513',
]

function fieldScore(c: FieldCompany): number {
  return c.scores.positioning + c.scores.heat
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function parseAnalysis(raw: unknown): [string, string, string] | null {
  if (!Array.isArray(raw) || raw.length !== 3) return null
  if (!raw.every((p) => typeof p === 'string' && p.trim())) return null
  return [raw[0], raw[1], raw[2]]
}

function mapCompany(row: CompanyRow): FieldCompany | null {
  if (row.region !== 'us' && row.region !== 'international') return null
  const analysis = parseAnalysis(row.analysis)
  if (!analysis) return null
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    domain: row.domain,
    hq: row.hq,
    openWeight: Boolean(row.open_weight),
    blurb: row.blurb,
    analysis,
    scores: {
      positioning: clampScore(row.positioning),
      heat: clampScore(row.heat),
    },
    updatedAt: row.updated_at ?? null,
  }
}

function buildHistory(rows: HistoryRow[]): FieldPositioningSnapshot[] {
  const byDate = new Map<string, Record<string, number>>()
  for (const row of rows) {
    let bucket = byDate.get(row.measured_on)
    if (!bucket) {
      bucket = {}
      byDate.set(row.measured_on, bucket)
    }
    bucket[row.company_id] = clampScore(row.positioning)
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([measuredOn, positioning]) => ({ measuredOn, positioning }))
}

/**
 * Load desk field companies + positioning history from Supabase.
 * Manual updates: edit `ai_wars_companies` (or call `set_ai_wars_company_scores`).
 * Changing `positioning` auto-upserts today’s history row.
 */
export async function fetchAiWarsField(): Promise<AiWarsFieldBoard> {
  const [companiesRes, historyRes] = await Promise.all([
    supabase
      .from('ai_wars_companies')
      .select(
        'id, name, region, domain, hq, open_weight, blurb, analysis, positioning, heat, updated_at',
      )
      .order('sort_hint', { ascending: true }),
    supabase
      .from('ai_wars_positioning_history')
      .select('company_id, measured_on, positioning')
      .order('measured_on', { ascending: true }),
  ])

  if (companiesRes.error) {
    console.error('[ai-wars-field]', companiesRes.error.message)
  }
  if (historyRes.error) {
    console.error('[ai-wars-field-history]', historyRes.error.message)
  }

  const companies = ((companiesRes.data ?? []) as CompanyRow[])
    .map(mapCompany)
    .filter((c): c is FieldCompany => c != null)

  let history = buildHistory((historyRes.data ?? []) as HistoryRow[])

  // If history is empty but companies exist, synthesize a point from current scores.
  if (!history.length && companies.length) {
    history = [
      {
        measuredOn: new Date().toISOString().slice(0, 10),
        positioning: Object.fromEntries(
          companies.map((c) => [c.id, c.scores.positioning]),
        ),
      },
    ]
  }

  return { companies, history }
}

export function fieldByRegion(
  companies: FieldCompany[],
  region: FieldRegion,
): RankedFieldCompany[] {
  const sorted = companies.filter((c) => c.region === region).sort((a, b) => {
    const scoreDiff = fieldScore(b) - fieldScore(a)
    if (scoreDiff !== 0) return scoreDiff
    const posDiff = b.scores.positioning - a.scores.positioning
    if (posDiff !== 0) return posDiff
    const heatDiff = b.scores.heat - a.scores.heat
    if (heatDiff !== 0) return heatDiff
    return a.name.localeCompare(b.name)
  })
  return sorted.map((company, i) => ({ ...company, rank: i + 1 }))
}

/** Latest desk edit among companies in a region (ISO), or null. */
export function fieldUpdatedAt(
  companies: FieldCompany[],
  region: FieldRegion,
): string | null {
  let latest: string | null = null
  let latestMs = -Infinity
  for (const c of companies) {
    if (c.region !== region || !c.updatedAt) continue
    const ms = Date.parse(c.updatedAt)
    if (!Number.isFinite(ms)) continue
    if (ms > latestMs) {
      latestMs = ms
      latest = c.updatedAt
    }
  }
  return latest
}

export function formatFieldUpdatedAt(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Positioning time series for one region — feeds SeriesLineChart. */
export function positioningChartForRegion(
  companies: FieldCompany[],
  history: FieldPositioningSnapshot[],
  region: FieldRegion,
): AiWarsChart {
  const ranked = fieldByRegion(companies, region)
  const dates = history.map((s) => s.measuredOn).sort()
  const latest = dates[dates.length - 1] ?? null

  return {
    id: `field-positioning-${region}`,
    title: 'Positioning over time',
    subtitle: 'Desk score · 0–100',
    sourceUrl: '',
    asOf: latest,
    dates,
    unit: 'score',
    series: ranked.map((c, i) => ({
      id: c.id,
      name: c.name,
      color: FIELD_COLORS[i % FIELD_COLORS.length],
      points: history
        .filter((snap) => snap.positioning[c.id] != null)
        .sort((a, b) => a.measuredOn.localeCompare(b.measuredOn))
        .map((snap) => ({
          date: snap.measuredOn,
          value: clampScore(snap.positioning[c.id]!),
        })),
    })),
  }
}

export function logoDevUrl(
  domain: string,
  opts: { size?: number; format?: 'png' | 'webp' | 'jpg' } = {},
): string | null {
  const token =
    (typeof process !== 'undefined'
      ? process.env.PUBLIC_LOGO_DEV_TOKEN
      : undefined) || import.meta.env.PUBLIC_LOGO_DEV_TOKEN
  if (!token) return null
  const size = opts.size ?? 64
  const format = opts.format ?? 'png'
  const params = new URLSearchParams({
    token,
    size: String(size),
    format,
    retina: 'true',
  })
  return `https://img.logo.dev/${encodeURIComponent(domain)}?${params}`
}

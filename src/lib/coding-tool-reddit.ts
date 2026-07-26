import { formatCompactCount } from './rank-bars'
import { supabase } from './supabase'

export type CodingToolRedditPoint = {
  toolId: string
  name: string
  subreddit: string
  weeklyVisitors: number
  measuredOn: string
}

export type CodingToolSeries = {
  toolId: string
  name: string
  subreddit: string
  color: string
  points: Array<{ measuredOn: string; weeklyVisitors: number }>
}

export type CodingToolRedditBoard = {
  asOf: string | null
  entries: Array<{
    rank: number
    name: string
    detail: string
    vendor: string
    toolId: string
    weeklyVisitors: number
  }>
  series: CodingToolSeries[]
  dates: string[]
}

/** @deprecated Use CodingToolRedditBoard */
export type CodingToolDauBoard = CodingToolRedditBoard

const TOOL_COLORS: Record<string, string> = {
  'claude-code': '#e11d2e',
  codex: '#171717',
  cursor: '#0f7a8a',
  'github-copilot': '#1f5fbf',
  windsurf: '#c47a00',
  cline: '#8b4513',
}

const FALLBACK_COLORS = [
  '#e11d2e',
  '#171717',
  '#0f7a8a',
  '#c47a00',
  '#1f5fbf',
  '#8b4513',
  '#2f7d4a',
  '#9f1239',
]

type Row = {
  tool_id: string
  name: string
  subreddit: string
  weekly_visitors: number
  measured_on: string
}

function colorFor(toolId: string, index: number): string {
  return TOOL_COLORS[toolId] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

/**
 * Latest snapshot ranked as a board, plus full series for the over-time chart.
 * Metric: Reddit weekly visitors for each tool’s subreddit (not DAU).
 */
export async function fetchCodingToolReddit(): Promise<CodingToolRedditBoard> {
  const { data, error } = await supabase
    .from('coding_tool_reddit')
    .select('tool_id, name, subreddit, weekly_visitors, measured_on')
    .order('measured_on', { ascending: true })

  if (error || !data?.length) {
    if (error) console.error('[coding-tool-reddit]', error.message)
    return { asOf: null, entries: [], series: [], dates: [] }
  }

  const rows = data as Row[]
  const dates = [...new Set(rows.map((r) => r.measured_on))].sort()
  const latest = dates[dates.length - 1] ?? null

  const latestRows = latest
    ? rows
        .filter((r) => r.measured_on === latest)
        .sort((a, b) => b.weekly_visitors - a.weekly_visitors)
    : []

  const byTool = new Map<string, CodingToolSeries>()
  for (const row of rows) {
    let series = byTool.get(row.tool_id)
    if (!series) {
      series = {
        toolId: row.tool_id,
        name: row.name,
        subreddit: row.subreddit,
        color: colorFor(row.tool_id, byTool.size),
        points: [],
      }
      byTool.set(row.tool_id, series)
    }
    series.points.push({
      measuredOn: row.measured_on,
      weeklyVisitors: row.weekly_visitors,
    })
  }

  const latestRank = new Map(latestRows.map((r, i) => [r.tool_id, i]))
  const series = [...byTool.values()].sort((a, b) => {
    const ra = latestRank.get(a.toolId) ?? 999
    const rb = latestRank.get(b.toolId) ?? 999
    if (ra !== rb) return ra - rb
    return a.name.localeCompare(b.name)
  })

  return {
    asOf: latest,
    entries: latestRows.map((r, i) => ({
      rank: i + 1,
      name: r.name,
      detail: formatCompactCount(r.weekly_visitors),
      vendor: `r/${r.subreddit}`,
      toolId: r.tool_id,
      weeklyVisitors: r.weekly_visitors,
    })),
    series,
    dates,
  }
}

/** @deprecated Use fetchCodingToolReddit */
export const fetchCodingToolDau = fetchCodingToolReddit

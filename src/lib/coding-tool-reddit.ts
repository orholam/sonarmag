import type { AiWarsChart } from './ai-wars-history'
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
  'opencode-cli': '#0d9488',
  opencode: '#2f7d4a',
  antigravity: '#4285f4',
  cursor: '#0f7a8a',
  'github-copilot': '#1f5fbf',
  windsurf: '#c47a00',
  cline: '#8b4513',
  grokbot: '#0369a1',
  'openai-codex': '#6d28d9',
  'muse-agent': '#db2777',
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

/** Subreddits that belong to one product, summed on the combined chart. */
const COMBINED_GROUPS: Array<{
  id: string
  name: string
  toolIds: string[]
}> = [
  { id: 'codex', name: 'Codex', toolIds: ['codex', 'openai-codex'] },
  { id: 'opencode', name: 'OpenCode', toolIds: ['opencode', 'opencode-cli'] },
]

/** Combined chart: one line per product, subreddit totals added together. */
export function codingToolsChart(board: CodingToolRedditBoard): AiWarsChart | null {
  if (!board.series.length || !board.dates.length) return null

  const consumed = new Set<string>()
  const series: AiWarsChart['series'] = []

  for (const group of COMBINED_GROUPS) {
    const members = board.series.filter((s) => group.toolIds.includes(s.toolId))
    if (!members.length) continue
    for (const member of members) consumed.add(member.toolId)
    const byDate = new Map<string, number>()
    for (const member of members) {
      for (const point of member.points) {
        byDate.set(
          point.measuredOn,
          (byDate.get(point.measuredOn) ?? 0) + point.weeklyVisitors,
        )
      }
    }
    const lead = members.find((s) => s.toolId === group.toolIds[0]) ?? members[0]
    series.push({
      id: group.id,
      name: group.name,
      color: lead.color,
      points: [...byDate.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, value]) => ({ date, value })),
    })
  }

  for (const row of board.series) {
    if (consumed.has(row.toolId)) continue
    series.push({
      id: row.toolId,
      name: row.name,
      color: row.color,
      points: row.points.map((p) => ({
        date: p.measuredOn,
        value: p.weeklyVisitors,
      })),
    })
  }

  series.sort((a, b) => {
    const av = a.points[a.points.length - 1]?.value ?? 0
    const bv = b.points[b.points.length - 1]?.value ?? 0
    return bv - av
  })

  return {
    id: 'coding-reddit-visitors',
    title: 'Weekly visitors, combined',
    subtitle:
      'Log scale. Codex adds r/CodexAI and r/OpenAICodex. OpenCode adds r/opencode and r/opencodeCLI.',
    sourceUrl: '',
    asOf: board.asOf,
    dates: board.dates,
    series,
    unit: 'count',
  }
}

/** @deprecated Use fetchCodingToolReddit */
export const fetchCodingToolDau = fetchCodingToolReddit

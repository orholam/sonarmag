import { supabase } from './supabase'

export type AiRaceEntry = {
  rank: number
  name: string
  detail: string
  vendor?: string | null
}

export type AiRaceBoard = {
  id: 'arena' | 'openrouter'
  title: string
  subtitle: string
  sourceUrl: string
  asOf: string | null
  entries: AiRaceEntry[]
}

export type AiRaceData = {
  boards: AiRaceBoard[]
}

type BoardId = AiRaceBoard['id']

type ArenaModel = {
  rank: number
  model: string
  vendor?: string | null
  score?: number | null
  votes?: number | null
}

type OpenRouterRow = {
  date: string
  model_permaslug: string
  total_tokens: string
}

type AiRaceBoardRow = {
  id: BoardId
  title: string
  subtitle: string
  source_url: string
  as_of: string | null
  entries: AiRaceEntry[]
  fetched_at: string
}

const ARENA_URL =
  'https://api.wulong.dev/arena-ai-leaderboards/v1/leaderboard?name=text'
const OPENROUTER_RANKINGS_URL =
  'https://openrouter.ai/api/v1/datasets/rankings-daily'

/** Keep a few extra rows in DB so the UI limit can change without a refetch. */
const STORE_LIMIT = 10

/** Match the RPC default — refresh remote sources about once a day. */
const MAX_AGE_MS = 18 * 60 * 60 * 1000

function formatTokens(raw: string | number): string {
  const n = typeof raw === 'string' ? Number(raw) : raw
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n >= 1e12) return `${(n / 1e12).toFixed(n >= 10e12 ? 1 : 2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 100e9 ? 0 : 1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 100e6 ? 0 : 1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return String(Math.round(n))
}

function formatVotes(votes: number | null | undefined): string {
  if (votes == null || !Number.isFinite(votes)) return ''
  if (votes >= 1e6) return `${(votes / 1e6).toFixed(1)}M votes`
  if (votes >= 1e3) return `${(votes / 1e3).toFixed(votes >= 10e3 ? 0 : 1)}K votes`
  return `${votes} votes`
}

/** Strip date stamps / :free for a readable label. */
export function displayModelName(permaslugOrModel: string): string {
  const base = permaslugOrModel.includes('/')
    ? permaslugOrModel.split('/').pop() || permaslugOrModel
    : permaslugOrModel
  return base
    .replace(/:free$/i, '')
    .replace(/-\d{8}(?=$|[:.])/g, '')
    .replace(/-preview(?=$|[:.])/gi, '')
}

function formatDateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function rowToBoard(row: AiRaceBoardRow): AiRaceBoard {
  const entries = Array.isArray(row.entries) ? row.entries : []
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    sourceUrl: row.source_url,
    asOf: row.as_of,
    entries,
  }
}

function isFresh(fetchedAt: string | undefined): boolean {
  if (!fetchedAt) return false
  const t = Date.parse(fetchedAt)
  if (!Number.isFinite(t)) return false
  return Date.now() - t < MAX_AGE_MS
}

async function loadCachedBoards(): Promise<Map<BoardId, AiRaceBoardRow>> {
  const { data, error } = await supabase.from('ai_race_boards').select(
    'id, title, subtitle, source_url, as_of, entries, fetched_at',
  )
  if (error || !data) return new Map()
  const map = new Map<BoardId, AiRaceBoardRow>()
  for (const row of data as AiRaceBoardRow[]) {
    if (row.id === 'arena' || row.id === 'openrouter') map.set(row.id, row)
  }
  return map
}

async function persistBoard(board: AiRaceBoard): Promise<void> {
  const { error } = await supabase.rpc('upsert_ai_race_board', {
    p_id: board.id,
    p_title: board.title,
    p_subtitle: board.subtitle,
    p_source_url: board.sourceUrl,
    p_as_of: board.asOf,
    p_entries: board.entries,
  })
  if (error) {
    console.error(`[ai-race] cache write failed for ${board.id}:`, error.message)
  }
}

async function fetchArena(limit: number): Promise<AiRaceBoard | null> {
  try {
    const res = await fetch(ARENA_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const payload = (await res.json()) as {
      meta?: { last_updated?: string; source_url?: string }
      models?: ArenaModel[]
    }
    const models = (payload.models ?? []).slice(0, limit)
    if (!models.length) return null
    return {
      id: 'arena',
      title: 'Arena Elo',
      subtitle: 'Human preference · text',
      sourceUrl: payload.meta?.source_url || 'https://arena.ai/leaderboard/text',
      asOf: payload.meta?.last_updated ?? null,
      entries: models.map((m) => ({
        rank: m.rank,
        name: displayModelName(m.model),
        detail: [m.score != null ? String(m.score) : null, formatVotes(m.votes)]
          .filter(Boolean)
          .join(' · '),
        vendor: m.vendor ?? null,
      })),
    }
  } catch {
    return null
  }
}

async function fetchOpenRouter(limit: number): Promise<AiRaceBoard | null> {
  // Prefer process.env so Vercel injects the secret at runtime (Vite can
  // statically replace import.meta.env at build time).
  const key =
    (typeof process !== 'undefined' ? process.env.OPENROUTER_API_KEY : undefined) ||
    import.meta.env.OPENROUTER_API_KEY
  if (!key) return null

  try {
    const end = new Date()
    // Rankings settle on completed UTC days; pull a short window.
    const endDate = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - 1))
    const startDate = new Date(endDate)
    startDate.setUTCDate(startDate.getUTCDate() - 2)
    const toYmd = (d: Date) => d.toISOString().slice(0, 10)
    const url = `${OPENROUTER_RANKINGS_URL}?start_date=${toYmd(startDate)}&end_date=${toYmd(endDate)}`

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const payload = (await res.json()) as {
      data?: OpenRouterRow[]
      meta?: { as_of?: string; end_date?: string }
    }
    const rows = payload.data ?? []
    if (!rows.length) return null

    const dates = [...new Set(rows.map((r) => r.date))].sort()
    const latest = dates[dates.length - 1]
    const day = rows
      .filter((r) => r.date === latest && r.model_permaslug !== 'other')
      .sort((a, b) => Number(b.total_tokens) - Number(a.total_tokens))
      .slice(0, limit)

    if (!day.length) return null

    return {
      id: 'openrouter',
      title: 'OpenRouter',
      subtitle: `API tokens · ${formatDateLabel(latest)}`,
      sourceUrl: 'https://openrouter.ai/rankings',
      asOf: payload.meta?.as_of?.slice(0, 10) ?? latest,
      entries: day.map((r, i) => ({
        rank: i + 1,
        name: displayModelName(r.model_permaslug),
        detail: formatTokens(r.total_tokens),
        vendor: r.model_permaslug.includes('/')
          ? r.model_permaslug.split('/')[0]
          : null,
      })),
    }
  } catch {
    return null
  }
}

async function refreshBoard(
  id: BoardId,
  limit: number,
): Promise<AiRaceBoard | null> {
  const remote =
    id === 'arena' ? await fetchArena(limit) : await fetchOpenRouter(limit)
  if (!remote) return null
  await persistBoard(remote)
  return remote
}

/**
 * Homepage AI Race boards. Reads Supabase cache first; hits Arena / OpenRouter
 * at most ~once per 18h per board, then writes back.
 */
export async function fetchAiRaceData(limit = 5): Promise<AiRaceData> {
  const cached = await loadCachedBoards()
  const boardIds: BoardId[] = ['arena', 'openrouter']

  const boards = await Promise.all(
    boardIds.map(async (id) => {
      const row = cached.get(id)
      if (row && isFresh(row.fetched_at) && Array.isArray(row.entries) && row.entries.length) {
        return rowToBoard(row)
      }

      const refreshed = await refreshBoard(id, STORE_LIMIT)
      if (refreshed) return refreshed

      // Stale-but-present beats an empty rail if the remote call fails.
      if (row && Array.isArray(row.entries) && row.entries.length) {
        return rowToBoard(row)
      }
      return null
    }),
  )

  return {
    boards: boards
      .filter((b): b is AiRaceBoard => Boolean(b))
      .map((board) => ({
        ...board,
        entries: board.entries.slice(0, limit),
      })),
  }
}

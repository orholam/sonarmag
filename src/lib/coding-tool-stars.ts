/**
 * Live GitHub stargazer counts for open coding agents/tools.
 * Curated repo list fetched at request time — not stored in Supabase.
 */

import { formatCompactCount } from './rank-bars'

export type CodingToolStarsEntry = {
  rank: number
  name: string
  detail: string
  vendor: string
  stars: number
  repo: string
  url: string
  surface: string
}

export type CodingToolStarsBoard = {
  asOf: string | null
  entries: CodingToolStarsEntry[]
}

type CuratedRepo = {
  id: string
  name: string
  owner: string
  repo: string
  /** Where the tool mainly lives — shown as a small chip. */
  surface: 'TUI' | 'CLI' | 'IDE' | 'Editor' | 'Web' | 'Agent' | 'Router' | 'Neovim'
}

/**
 * Open coding agents / CLIs / IDE agents — competitors in the open harness race.
 * Stars fetched live (ungh + optional GitHub token).
 */
const REPOS: CuratedRepo[] = [
  { id: 'opencode', name: 'OpenCode', owner: 'anomalyco', repo: 'opencode', surface: 'TUI' },
  { id: 'gemini-cli', name: 'Gemini CLI', owner: 'google-gemini', repo: 'gemini-cli', surface: 'CLI' },
  { id: 'codex', name: 'Codex', owner: 'openai', repo: 'codex', surface: 'CLI' },
  { id: 'openhands', name: 'OpenHands', owner: 'OpenHands', repo: 'OpenHands', surface: 'Agent' },
  {
    id: 'open-interpreter',
    name: 'Open Interpreter',
    owner: 'openinterpreter',
    repo: 'openinterpreter',
    surface: 'TUI',
  },
  { id: 'cline', name: 'Cline', owner: 'cline', repo: 'cline', surface: 'IDE' },
  { id: 'goose', name: 'Goose', owner: 'aaif-goose', repo: 'goose', surface: 'CLI' },
  { id: 'aider', name: 'Aider', owner: 'Aider-AI', repo: 'aider', surface: 'CLI' },
  {
    id: 'claude-code-router',
    name: 'Claude Code Router',
    owner: 'musistudio',
    repo: 'claude-code-router',
    surface: 'Router',
  },
  { id: 'continue', name: 'Continue', owner: 'continuedev', repo: 'continue', surface: 'IDE' },
  { id: 'tabby', name: 'Tabby', owner: 'TabbyML', repo: 'tabby', surface: 'IDE' },
  { id: 'void', name: 'Void', owner: 'voideditor', repo: 'void', surface: 'Editor' },
  { id: 'crush', name: 'Crush', owner: 'charmbracelet', repo: 'crush', surface: 'TUI' },
  { id: 'kilocode', name: 'Kilo Code', owner: 'Kilo-Org', repo: 'kilocode', surface: 'IDE' },
  { id: 'qwen-code', name: 'Qwen Code', owner: 'QwenLM', repo: 'qwen-code', surface: 'TUI' },
  { id: 'roo-code', name: 'Roo Code', owner: 'RooCodeInc', repo: 'Roo-Code', surface: 'IDE' },
  { id: 'grok-build', name: 'Grok Build', owner: 'xai-org', repo: 'grok-build', surface: 'TUI' },
  { id: 'buzz', name: 'Buzz', owner: 'block', repo: 'buzz', surface: 'Agent' },
  { id: 'dyad', name: 'Dyad', owner: 'dyad-sh', repo: 'dyad', surface: 'Editor' },
  { id: 'swe-agent', name: 'SWE-agent', owner: 'SWE-agent', repo: 'SWE-agent', surface: 'Agent' },
  { id: 'bolt-diy', name: 'Bolt.diy', owner: 'stackblitz-labs', repo: 'bolt.diy', surface: 'Web' },
  { id: 'avante', name: 'Avante', owner: 'yetone', repo: 'avante.nvim', surface: 'Neovim' },
  {
    id: 'freebuff',
    name: 'Freebuff',
    owner: 'CodebuffAI',
    repo: 'codebuff',
    surface: 'CLI',
  },
]

/** Display order for surface groups on the starboard. */
export const STAR_SURFACE_ORDER = [
  'TUI',
  'CLI',
  'IDE',
  'Editor',
  'Agent',
  'Web',
  'Router',
  'Neovim',
] as const

type GhRepo = {
  stargazerCount: number
  nameWithOwner: string
  url: string
}

function githubToken(): string | undefined {
  const fromProcess =
    typeof process !== 'undefined' ? process.env.GITHUB_TOKEN : undefined
  return (fromProcess || import.meta.env.GITHUB_TOKEN)?.trim() || undefined
}

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'sonarmag-ai-wars',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  const token = githubToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

/** Cached unofficial mirror — avoids burning unauthenticated GitHub rate limits. */
async function fetchViaUngh(): Promise<Map<string, GhRepo>> {
  const out = new Map<string, GhRepo>()
  const results = await Promise.allSettled(
    REPOS.map(async (r) => {
      const res = await fetch(`https://ungh.cc/repos/${r.owner}/${r.repo}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'sonarmag-ai-wars' },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) throw new Error(`${r.id} ${res.status}`)
      const data = (await res.json()) as {
        repo?: { stars?: number; repo?: string }
      }
      const stars = data.repo?.stars
      if (stars == null) throw new Error(`${r.id} no stars`)
      const nameWithOwner = data.repo?.repo ?? `${r.owner}/${r.repo}`
      return {
        id: r.id,
        repo: {
          stargazerCount: stars,
          nameWithOwner,
          url: `https://github.com/${nameWithOwner}`,
        } satisfies GhRepo,
      }
    }),
  )

  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    out.set(result.value.id, result.value.repo)
  }
  return out
}

async function fetchViaGraphql(): Promise<Map<string, GhRepo> | null> {
  if (!githubToken()) return null

  const fields = REPOS.map(
    (r, i) =>
      `r${i}: repository(owner: "${r.owner}", name: "${r.repo}") { stargazerCount nameWithOwner url }`,
  ).join('\n')

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      ...githubHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: `query { ${fields} }` }),
    signal: AbortSignal.timeout(12_000),
  })

  if (!res.ok) return null
  const json = (await res.json()) as {
    data?: Record<
      string,
      { stargazerCount?: number; nameWithOwner?: string; url?: string } | null
    >
  }
  if (!json.data) return null

  const out = new Map<string, GhRepo>()
  REPOS.forEach((r, i) => {
    const row = json.data?.[`r${i}`]
    if (row?.stargazerCount == null) return
    out.set(r.id, {
      stargazerCount: row.stargazerCount,
      nameWithOwner: row.nameWithOwner ?? `${r.owner}/${r.repo}`,
      url: row.url ?? `https://github.com/${r.owner}/${r.repo}`,
    })
  })
  return out.size ? out : null
}

/**
 * Ranked open coding-tool GitHub stars. Empty board if remotes are unreachable.
 */
export async function fetchCodingToolStars(): Promise<CodingToolStarsBoard> {
  try {
    const stars = (await fetchViaGraphql()) ?? (await fetchViaUngh())
    if (!stars.size) return { asOf: null, entries: [] }

    const ranked = REPOS.map((r) => {
      const row = stars.get(r.id)
      if (!row) return null
      return {
        name: r.name,
        surface: r.surface,
        stars: row.stargazerCount,
        repo: row.nameWithOwner,
        url: row.url,
      }
    })
      .filter((x): x is NonNullable<typeof x> => x != null)
      .sort((a, b) => b.stars - a.stars)

    return {
      asOf: new Date().toISOString(),
      entries: ranked.map((r, i) => ({
        rank: i + 1,
        name: r.name,
        detail: formatCompactCount(r.stars),
        vendor: r.repo,
        stars: r.stars,
        repo: r.repo,
        url: r.url,
        surface: r.surface,
      })),
    }
  } catch (err) {
    console.error(
      '[coding-tool-stars]',
      err instanceof Error ? err.message : err,
    )
    return { asOf: null, entries: [] }
  }
}

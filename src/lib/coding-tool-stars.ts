/**
 * Live GitHub stargazer counts for open coding agents/tools.
 * Curated repo list + public GitHub API — not stored in Supabase.
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
}

/** Open coding agents / CLIs — stars fetched at request time. */
const REPOS: CuratedRepo[] = [
  { id: 'opencode', name: 'OpenCode', owner: 'anomalyco', repo: 'opencode' },
  { id: 'codex', name: 'Codex', owner: 'openai', repo: 'codex' },
  { id: 'gemini-cli', name: 'Gemini CLI', owner: 'google-gemini', repo: 'gemini-cli' },
  { id: 'openhands', name: 'OpenHands', owner: 'OpenHands', repo: 'OpenHands' },
  { id: 'cline', name: 'Cline', owner: 'cline', repo: 'cline' },
  { id: 'goose', name: 'Goose', owner: 'aaif-goose', repo: 'goose' },
  { id: 'aider', name: 'Aider', owner: 'Aider-AI', repo: 'aider' },
  { id: 'continue', name: 'Continue', owner: 'continuedev', repo: 'continue' },
  { id: 'void', name: 'Void', owner: 'voideditor', repo: 'void' },
  { id: 'kilocode', name: 'Kilo Code', owner: 'Kilo-Org', repo: 'kilocode' },
  { id: 'roo-code', name: 'Roo Code', owner: 'RooCodeInc', repo: 'Roo-Code' },
  { id: 'grok-build', name: 'Grok Build', owner: 'xai-org', repo: 'grok-build' },
]

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

async function fetchViaGraphql(): Promise<Map<string, GhRepo> | null> {
  // GraphQL requires auth; skip when no token.
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

async function fetchViaRest(): Promise<Map<string, GhRepo>> {
  const out = new Map<string, GhRepo>()
  const results = await Promise.allSettled(
    REPOS.map(async (r) => {
      const res = await fetch(
        `https://api.github.com/repos/${r.owner}/${r.repo}`,
        {
          headers: githubHeaders(),
          signal: AbortSignal.timeout(10_000),
          redirect: 'follow',
        },
      )
      if (!res.ok) throw new Error(`${r.id} ${res.status}`)
      const data = (await res.json()) as {
        stargazers_count?: number
        full_name?: string
        html_url?: string
      }
      if (data.stargazers_count == null) throw new Error(`${r.id} no stars`)
      return {
        id: r.id,
        repo: {
          stargazerCount: data.stargazers_count,
          nameWithOwner: data.full_name ?? `${r.owner}/${r.repo}`,
          url: data.html_url ?? `https://github.com/${r.owner}/${r.repo}`,
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

/**
 * Ranked open coding-tool GitHub stars. Empty board if GitHub is unreachable.
 */
export async function fetchCodingToolStars(): Promise<CodingToolStarsBoard> {
  try {
    const stars = (await fetchViaGraphql()) ?? (await fetchViaRest())
    if (!stars.size) return { asOf: null, entries: [] }

    const ranked = REPOS.map((r) => {
      const row = stars.get(r.id)
      if (!row) return null
      return {
        name: r.name,
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

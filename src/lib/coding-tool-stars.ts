/**
 * Live GitHub stargazer counts for flagship AI repos from AI Wars field companies.
 * Curated repo list fetched at request time — not stored in Supabase.
 */

import { formatCompactCount } from './rank-bars'

export type CodingToolStarsEntry = {
  rank: number
  name: string
  detail: string
  /** Company display name from the field board. */
  company: string
  /** Field company id (matches ai_wars_companies). */
  companyId: string
  /** Domain for logo.dev. */
  domain: string
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
  /** Short label on the chip. */
  name: string
  owner: string
  repo: string
  companyId: string
  company: string
  domain: string
}

/**
 * Flagship AI repos from field-board labs (+ xAI).
 * Stars fetched live (ungh + optional GitHub token).
 */
const REPOS: CuratedRepo[] = [
  // —— Anthropic ——
  {
    id: 'claude-code',
    name: 'Claude Code',
    owner: 'anthropics',
    repo: 'claude-code',
    companyId: 'anthropic',
    company: 'Anthropic',
    domain: 'anthropic.com',
  },
  {
    id: 'claude-cookbooks',
    name: 'Claude Cookbooks',
    owner: 'anthropics',
    repo: 'claude-cookbooks',
    companyId: 'anthropic',
    company: 'Anthropic',
    domain: 'anthropic.com',
  },
  {
    id: 'anthropic-prompt-eng',
    name: 'Prompt Eng Tutorial',
    owner: 'anthropics',
    repo: 'prompt-eng-interactive-tutorial',
    companyId: 'anthropic',
    company: 'Anthropic',
    domain: 'anthropic.com',
  },
  {
    id: 'anthropic-courses',
    name: 'Anthropic Courses',
    owner: 'anthropics',
    repo: 'courses',
    companyId: 'anthropic',
    company: 'Anthropic',
    domain: 'anthropic.com',
  },
  // —— OpenAI ——
  {
    id: 'whisper',
    name: 'Whisper',
    owner: 'openai',
    repo: 'whisper',
    companyId: 'openai',
    company: 'OpenAI',
    domain: 'openai.com',
  },
  {
    id: 'codex',
    name: 'Codex',
    owner: 'openai',
    repo: 'codex',
    companyId: 'openai',
    company: 'OpenAI',
    domain: 'openai.com',
  },
  {
    id: 'openai-cookbook',
    name: 'OpenAI Cookbook',
    owner: 'openai',
    repo: 'openai-cookbook',
    companyId: 'openai',
    company: 'OpenAI',
    domain: 'openai.com',
  },
  {
    id: 'openai-clip',
    name: 'CLIP',
    owner: 'openai',
    repo: 'CLIP',
    companyId: 'openai',
    company: 'OpenAI',
    domain: 'openai.com',
  },
  {
    id: 'openai-gym',
    name: 'Gym',
    owner: 'openai',
    repo: 'gym',
    companyId: 'openai',
    company: 'OpenAI',
    domain: 'openai.com',
  },
  {
    id: 'gpt-oss',
    name: 'gpt-oss',
    owner: 'openai',
    repo: 'gpt-oss',
    companyId: 'openai',
    company: 'OpenAI',
    domain: 'openai.com',
  },
  {
    id: 'openai-python',
    name: 'openai-python',
    owner: 'openai',
    repo: 'openai-python',
    companyId: 'openai',
    company: 'OpenAI',
    domain: 'openai.com',
  },
  // —— SpaceX / Cursor ——
  {
    id: 'cursor',
    name: 'Cursor',
    owner: 'cursor',
    repo: 'cursor',
    companyId: 'spacex',
    company: 'SpaceX',
    domain: 'spacex.com',
  },
  // —— xAI (not on field board; major open release) ——
  {
    id: 'grok-1',
    name: 'Grok-1',
    owner: 'xai-org',
    repo: 'grok-1',
    companyId: 'xai',
    company: 'xAI',
    domain: 'x.ai',
  },
  {
    id: 'grok-build',
    name: 'Grok Build',
    owner: 'xai-org',
    repo: 'grok-build',
    companyId: 'xai',
    company: 'xAI',
    domain: 'x.ai',
  },
  // —— Google ——
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    owner: 'google-gemini',
    repo: 'gemini-cli',
    companyId: 'google',
    company: 'Google',
    domain: 'google.com',
  },
  {
    id: 'google-bert',
    name: 'BERT',
    owner: 'google-research',
    repo: 'bert',
    companyId: 'google',
    company: 'Google',
    domain: 'google.com',
  },
  {
    id: 'langextract',
    name: 'LangExtract',
    owner: 'google',
    repo: 'langextract',
    companyId: 'google',
    company: 'Google',
    domain: 'google.com',
  },
  {
    id: 'adk-python',
    name: 'ADK',
    owner: 'google',
    repo: 'adk-python',
    companyId: 'google',
    company: 'Google',
    domain: 'google.com',
  },
  {
    id: 'magika',
    name: 'Magika',
    owner: 'google',
    repo: 'magika',
    companyId: 'google',
    company: 'Google',
    domain: 'google.com',
  },
  {
    id: 'alphafold',
    name: 'AlphaFold',
    owner: 'google-deepmind',
    repo: 'alphafold',
    companyId: 'google',
    company: 'Google',
    domain: 'google.com',
  },
  {
    id: 'gemini-cookbook',
    name: 'Gemini Cookbook',
    owner: 'google-gemini',
    repo: 'cookbook',
    companyId: 'google',
    company: 'Google',
    domain: 'google.com',
  },
  // —— Microsoft ——
  {
    id: 'autogen',
    name: 'AutoGen',
    owner: 'microsoft',
    repo: 'autogen',
    companyId: 'microsoft',
    company: 'Microsoft',
    domain: 'microsoft.com',
  },
  {
    id: 'deepspeed',
    name: 'DeepSpeed',
    owner: 'deepspeedai',
    repo: 'DeepSpeed',
    companyId: 'microsoft',
    company: 'Microsoft',
    domain: 'microsoft.com',
  },
  {
    id: 'bitnet',
    name: 'BitNet',
    owner: 'microsoft',
    repo: 'BitNet',
    companyId: 'microsoft',
    company: 'Microsoft',
    domain: 'microsoft.com',
  },
  {
    id: 'graphrag',
    name: 'GraphRAG',
    owner: 'microsoft',
    repo: 'graphrag',
    companyId: 'microsoft',
    company: 'Microsoft',
    domain: 'microsoft.com',
  },
  {
    id: 'semantic-kernel',
    name: 'Semantic Kernel',
    owner: 'microsoft',
    repo: 'semantic-kernel',
    companyId: 'microsoft',
    company: 'Microsoft',
    domain: 'microsoft.com',
  },
  {
    id: 'jarvis',
    name: 'JARVIS',
    owner: 'microsoft',
    repo: 'JARVIS',
    companyId: 'microsoft',
    company: 'Microsoft',
    domain: 'microsoft.com',
  },
  // —— Meta ——
  {
    id: 'pytorch',
    name: 'PyTorch',
    owner: 'pytorch',
    repo: 'pytorch',
    companyId: 'meta',
    company: 'Meta',
    domain: 'meta.com',
  },
  {
    id: 'llama',
    name: 'Llama',
    owner: 'meta-llama',
    repo: 'llama',
    companyId: 'meta',
    company: 'Meta',
    domain: 'meta.com',
  },
  {
    id: 'segment-anything',
    name: 'SAM',
    owner: 'facebookresearch',
    repo: 'segment-anything',
    companyId: 'meta',
    company: 'Meta',
    domain: 'meta.com',
  },
  {
    id: 'detectron2',
    name: 'Detectron2',
    owner: 'facebookresearch',
    repo: 'detectron2',
    companyId: 'meta',
    company: 'Meta',
    domain: 'meta.com',
  },
  {
    id: 'llama3',
    name: 'Llama 3',
    owner: 'meta-llama',
    repo: 'llama3',
    companyId: 'meta',
    company: 'Meta',
    domain: 'meta.com',
  },
  // —— DeepSeek ——
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    owner: 'deepseek-ai',
    repo: 'DeepSeek-V3',
    companyId: 'deepseek',
    company: 'DeepSeek',
    domain: 'deepseek.com',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    owner: 'deepseek-ai',
    repo: 'DeepSeek-R1',
    companyId: 'deepseek',
    company: 'DeepSeek',
    domain: 'deepseek.com',
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    owner: 'deepseek-ai',
    repo: 'DeepSeek-Coder',
    companyId: 'deepseek',
    company: 'DeepSeek',
    domain: 'deepseek.com',
  },
  {
    id: 'deepseek-ocr',
    name: 'DeepSeek OCR',
    owner: 'deepseek-ai',
    repo: 'DeepSeek-OCR',
    companyId: 'deepseek',
    company: 'DeepSeek',
    domain: 'deepseek.com',
  },
  {
    id: 'deepseek-janus',
    name: 'Janus',
    owner: 'deepseek-ai',
    repo: 'Janus',
    companyId: 'deepseek',
    company: 'DeepSeek',
    domain: 'deepseek.com',
  },
  // —— Tencent ——
  {
    id: 'hunyuan-3d',
    name: 'Hunyuan3D',
    owner: 'Tencent-Hunyuan',
    repo: 'Hunyuan3D-2',
    companyId: 'tencent',
    company: 'Tencent',
    domain: 'tencent.com',
  },
  {
    id: 'hunyuan-video',
    name: 'HunyuanVideo',
    owner: 'Tencent-Hunyuan',
    repo: 'HunyuanVideo',
    companyId: 'tencent',
    company: 'Tencent',
    domain: 'tencent.com',
  },
  {
    id: 'photomaker',
    name: 'PhotoMaker',
    owner: 'TencentARC',
    repo: 'PhotoMaker',
    companyId: 'tencent',
    company: 'Tencent',
    domain: 'tencent.com',
  },
  // —— MiniMax ——
  {
    id: 'minimax-01',
    name: 'MiniMax-01',
    owner: 'MiniMax-AI',
    repo: 'MiniMax-01',
    companyId: 'minimax',
    company: 'MiniMax',
    domain: 'minimaxi.com',
  },
  {
    id: 'minimax-m1',
    name: 'MiniMax M1',
    owner: 'MiniMax-AI',
    repo: 'MiniMax-M1',
    companyId: 'minimax',
    company: 'MiniMax',
    domain: 'minimaxi.com',
  },
  // —— Xiaomi ——
  {
    id: 'mimo',
    name: 'MiMo',
    owner: 'XiaomiMiMo',
    repo: 'MiMo',
    companyId: 'xiaomi',
    company: 'Xiaomi',
    domain: 'mi.com',
  },
  {
    id: 'mimo-audio',
    name: 'MiMo Audio',
    owner: 'XiaomiMiMo',
    repo: 'MiMo-Audio',
    companyId: 'xiaomi',
    company: 'Xiaomi',
    domain: 'mi.com',
  },
  // —— Moonshot ——
  {
    id: 'kimi-k2',
    name: 'Kimi K2',
    owner: 'MoonshotAI',
    repo: 'Kimi-K2',
    companyId: 'moonshot',
    company: 'Moonshot',
    domain: 'moonshot.cn',
  },
  {
    id: 'kimi-audio',
    name: 'Kimi Audio',
    owner: 'MoonshotAI',
    repo: 'Kimi-Audio',
    companyId: 'moonshot',
    company: 'Moonshot',
    domain: 'moonshot.cn',
  },
  // —— Z.ai ——
  {
    id: 'chatglm-6b',
    name: 'ChatGLM-6B',
    owner: 'zai-org',
    repo: 'ChatGLM-6B',
    companyId: 'zai',
    company: 'Z.ai',
    domain: 'zhipuai.cn',
  },
  {
    id: 'chatglm3',
    name: 'ChatGLM3',
    owner: 'zai-org',
    repo: 'ChatGLM3',
    companyId: 'zai',
    company: 'Z.ai',
    domain: 'zhipuai.cn',
  },
  {
    id: 'codegeex',
    name: 'CodeGeeX',
    owner: 'zai-org',
    repo: 'CodeGeeX',
    companyId: 'zai',
    company: 'Z.ai',
    domain: 'zhipuai.cn',
  },
  {
    id: 'glm-4',
    name: 'GLM-4',
    owner: 'zai-org',
    repo: 'GLM-4',
    companyId: 'zai',
    company: 'Z.ai',
    domain: 'zhipuai.cn',
  },
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
 * Ranked field-company GitHub stars. Empty board if remotes are unreachable.
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
        company: r.company,
        companyId: r.companyId,
        domain: r.domain,
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
        company: r.company,
        companyId: r.companyId,
        domain: r.domain,
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

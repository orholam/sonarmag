import { useMemo, useState } from 'react'
import { logoDevUrl } from '../lib/ai-wars-field'
import type {
  CodingToolStarsBoard,
  CodingToolStarsEntry,
} from '../lib/coding-tool-stars'
import { formatCompactCount } from '../lib/rank-bars'

const PREVIEW_COUNT = 20

/** Stable colors per lab — enough for the field board + xAI. */
const COMPANY_COLORS: Record<string, string> = {
  anthropic: '#d97706',
  openai: '#10a37f',
  spacex: '#171717',
  xai: '#e11d2e',
  google: '#1a73e8',
  microsoft: '#00a4ef',
  meta: '#0668e1',
  deepseek: '#4d6bfe',
  tencent: '#12b7f5',
  minimax: '#e11d48',
  xiaomi: '#ff6900',
  moonshot: '#0f766e',
  zai: '#7c3aed',
}

const FALLBACK_COLORS = [
  '#e11d2e',
  '#0f7a8a',
  '#c47a00',
  '#1f5fbf',
  '#8b4513',
  '#6d28d9',
]

function formatFetchedAt(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  )
}

function RepoChip({ entry }: { entry: CodingToolStarsEntry }) {
  const logo = logoDevUrl(entry.domain, { size: 32 })
  return (
    <li>
      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        title={`${entry.company} · ${entry.repo}`}
      >
        {logo ? (
          <img
            className="ai-wars-starboard-logo"
            src={logo}
            alt=""
            width={16}
            height={16}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="ai-wars-starboard-mono" aria-hidden="true">
            {entry.company.slice(0, 1)}
          </span>
        )}
        <span className="ai-wars-starboard-name">{entry.name}</span>
        <span className="ai-wars-starboard-score">
          <span aria-hidden="true">★</span>
          {formatCompactCount(entry.stars)}
        </span>
      </a>
    </li>
  )
}

type CompanyShare = {
  companyId: string
  company: string
  stars: number
  repos: number
  color: string
}

function companyShares(entries: CodingToolStarsEntry[]): CompanyShare[] {
  const byId = new Map<
    string,
    { company: string; stars: number; repos: number }
  >()
  for (const entry of entries) {
    const row = byId.get(entry.companyId) ?? {
      company: entry.company,
      stars: 0,
      repos: 0,
    }
    row.stars += entry.stars
    row.repos += 1
    byId.set(entry.companyId, row)
  }

  let fallbackIdx = 0
  return [...byId.entries()]
    .map(([companyId, row]) => {
      const color =
        COMPANY_COLORS[companyId] ??
        FALLBACK_COLORS[fallbackIdx++ % FALLBACK_COLORS.length]
      return {
        companyId,
        company: row.company,
        stars: row.stars,
        repos: row.repos,
        color,
      }
    })
    .sort((a, b) => b.stars - a.stars)
}

/**
 * Compact star chips for field-company flagship GitHub repos.
 * Shows the top N by stars; expands for the rest.
 */
export function AiWarsStars({ board }: { board: CodingToolStarsBoard }) {
  const [expanded, setExpanded] = useState(false)
  const shares = useMemo(() => companyShares(board.entries), [board.entries])
  const totalStars = useMemo(
    () => shares.reduce((sum, s) => sum + s.stars, 0),
    [shares],
  )

  if (!board.entries.length) return null

  const fetched = formatFetchedAt(board.asOf)
  const hidden = Math.max(0, board.entries.length - PREVIEW_COUNT)
  const visible = expanded
    ? board.entries
    : board.entries.slice(0, PREVIEW_COUNT)

  return (
    <section
      className="ai-wars-starboard"
      aria-labelledby="ai-wars-starboard-heading"
    >
      {totalStars > 0 ? (
        <div
          className="ai-wars-starboard-share"
          role="img"
          aria-label={shares
            .map(
              (s) =>
                `${s.company} ${((s.stars / totalStars) * 100).toFixed(0)}%`,
            )
            .join(', ')}
        >
          {shares.map((s) => {
            const pct = (s.stars / totalStars) * 100
            return (
              <div
                key={s.companyId}
                className="ai-wars-starboard-share-seg"
                style={{
                  flexGrow: s.stars,
                  flexBasis: 0,
                  background: s.color,
                }}
                title={`${s.company}: ★${formatCompactCount(s.stars)} across ${s.repos} repo${s.repos === 1 ? '' : 's'} (${pct.toFixed(1)}%)`}
              >
                <span className="ai-wars-starboard-share-label">{s.company}</span>
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="ai-wars-starboard-body">
        <header className="ai-wars-starboard-head">
          <div>
            <h2 id="ai-wars-starboard-heading">
              <GitHubMark className="ai-wars-starboard-gh" />
              Lab repos
            </h2>
            <p>
              Flagship GitHub projects from the tracked labs
              {fetched ? ` · ${fetched}` : ''}
            </p>
          </div>
        </header>

        <ul className="ai-wars-starboard-list">
          {visible.map((entry) => (
            <RepoChip key={entry.repo} entry={entry} />
          ))}
        </ul>

        {hidden > 0 ? (
          <button
            type="button"
            className="ai-wars-starboard-more"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Show less' : `Show ${hidden} more`}
          </button>
        ) : null}
      </div>
    </section>
  )
}

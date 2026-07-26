import type { CodingToolStarsBoard, CodingToolStarsEntry } from '../lib/coding-tool-stars'
import { STAR_SURFACE_ORDER } from '../lib/coding-tool-stars'
import { formatCompactCount } from '../lib/rank-bars'

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

function groupBySurface(entries: CodingToolStarsEntry[]) {
  const bySurface = new Map<string, CodingToolStarsEntry[]>()
  for (const entry of entries) {
    const list = bySurface.get(entry.surface) ?? []
    list.push(entry)
    bySurface.set(entry.surface, list)
  }

  const ordered: Array<{ surface: string; entries: CodingToolStarsEntry[] }> = []
  for (const surface of STAR_SURFACE_ORDER) {
    const group = bySurface.get(surface)
    if (!group?.length) continue
    ordered.push({
      surface,
      entries: [...group].sort((a, b) => b.stars - a.stars),
    })
    bySurface.delete(surface)
  }
  for (const [surface, group] of bySurface) {
    ordered.push({
      surface,
      entries: [...group].sort((a, b) => b.stars - a.stars),
    })
  }
  return ordered
}

/**
 * Hand-curated open coding tools as compact pills, grouped by surface type.
 */
export function AiWarsStars({ board }: { board: CodingToolStarsBoard }) {
  if (!board.entries.length) return null

  const fetched = formatFetchedAt(board.asOf)
  const groups = groupBySurface(board.entries)

  return (
    <section
      className="ai-wars-starboard"
      aria-labelledby="ai-wars-starboard-heading"
    >
      <header className="ai-wars-starboard-head">
        <h2 id="ai-wars-starboard-heading">
          <GitHubMark className="ai-wars-starboard-gh" />
          Open-source stars
        </h2>
        <p>
          Hand-curated · live stargazers
          {fetched ? ` · ${fetched}` : ''}
        </p>
      </header>

      <div className="ai-wars-starboard-groups">
        {groups.map((group) => (
          <div key={group.surface} className="ai-wars-starboard-group">
            <p className="ai-wars-starboard-group-label">{group.surface}</p>
            <ul className="ai-wars-starboard-pills">
              {group.entries.map((entry) => (
                <li key={entry.repo}>
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={entry.repo}
                  >
                    <span className="ai-wars-starboard-name">{entry.name}</span>
                    <span className="ai-wars-starboard-score">
                      <span aria-hidden="true">★</span>
                      {formatCompactCount(entry.stars)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

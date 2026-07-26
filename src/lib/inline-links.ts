/** Inline markdown links in article body strings: [label](/path) or [label](https://…). */

const INLINE_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g

function isSafeHref(href: string): boolean {
  if (href.startsWith('/') && !href.startsWith('//')) return true
  try {
    const url = new URL(href)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Split a prose paragraph into text + <a> nodes for markdown-style links.
 * Unmatched or unsafe hrefs stay as literal text.
 */
export function renderInlineLinks(text: string): Array<string | { href: string; label: string }> {
  const parts: Array<string | { href: string; label: string }> = []
  let lastIndex = 0

  for (const match of text.matchAll(INLINE_LINK_RE)) {
    const full = match[0]
    const label = match[1] ?? ''
    const href = match[2] ?? ''
    const index = match.index ?? 0

    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index))
    }

    if (label && href && isSafeHref(href)) {
      parts.push({ href, label })
    } else {
      parts.push(full)
    }

    lastIndex = index + full.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

import type { Components } from 'react-markdown'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function isSafeHref(href: string | undefined): boolean {
  if (!href) return false
  if (href.startsWith('/') && !href.startsWith('//')) return true
  try {
    const url = new URL(href)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const components: Components = {
  a({ href, children }) {
    if (!isSafeHref(href)) {
      return <span>{children}</span>
    }
    const external = href!.startsWith('http')
    return (
      <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  },
  table({ children }) {
    return (
      <div className="article-table-wrap">
        <table>{children}</table>
      </div>
    )
  },
  pre({ children }) {
    return <pre className="article-pre">{children}</pre>
  },
}

type ArticleMarkdownProps = {
  source: string
  className?: string
}

/** Render one article body block as Markdown (GFM). */
export function ArticleMarkdown({ source, className }: ArticleMarkdownProps) {
  return (
    <div className={className ? `article-md ${className}` : 'article-md'}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </Markdown>
    </div>
  )
}

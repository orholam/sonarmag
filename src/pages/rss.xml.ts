import type { APIRoute } from 'astro'
import { fetchRssArticles } from '../lib/api'
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from '../lib/site'
import { textBlocks } from '../lib/types'

export const prerender = false

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfc822(iso: string | undefined): string {
  const date = iso ? new Date(iso) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toUTCString()
  return date.toUTCString()
}

export const GET: APIRoute = async () => {
  const articles = await fetchRssArticles()
  const buildDate = toRfc822(articles[0]?.publishedAt)

  const items = articles
    .map((article) => {
      const link = absoluteUrl(`/article/${article.slug}`)
      const description =
        article.excerpt?.trim() ||
        textBlocks(article.paragraphs)[0] ||
        DEFAULT_DESCRIPTION
      const categories = [article.category, article.ticker]
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => `      <category>${escapeXml(value.trim())}</category>`)
        .join('\n')

      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${toRfc822(article.publishedAt)}</pubDate>
      <dc:creator>${escapeXml(article.author)}</dc:creator>
      <description>${escapeXml(description)}</description>
${categories ? `${categories}\n` : ''}    </item>`
    })
    .join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(SITE_URL)}/</link>
    <description>${escapeXml(DEFAULT_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${escapeXml(`${SITE_URL}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}

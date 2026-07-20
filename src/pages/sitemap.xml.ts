import type { APIRoute } from 'astro'
import { fetchSitemapEntries } from '../lib/api'
import { SITE_URL } from '../lib/site'

export const prerender = false

export const GET: APIRoute = async () => {
  const entries = await fetchSitemapEntries()
  const today = new Date().toISOString().slice(0, 10)

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((entry) => {
    const loc = `${SITE_URL}${entry.loc === '/' ? '/' : entry.loc}`
    const lastmod = entry.lastmod || today
    const priority =
      entry.loc === '/' ? '1.0' : entry.loc.startsWith('/article/') ? '0.8' : '0.5'
    const changefreq =
      entry.loc === '/'
        ? 'daily'
        : entry.loc.startsWith('/article/')
          ? 'weekly'
          : 'monthly'
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  })
  .join('\n')}
</urlset>
`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}

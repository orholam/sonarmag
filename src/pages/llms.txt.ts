import type { APIRoute } from 'astro'
import { fetchSitemapEntries } from '../lib/api'
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from '../lib/site'

export const prerender = false

export const GET: APIRoute = async () => {
  const entries = await fetchSitemapEntries()
  const articles = entries
    .filter((entry) => entry.loc.startsWith('/article/'))
    .slice(0, 12)
  const sections = entries.filter((entry) =>
    ['/world', '/business', '/lifestyle', '/about', '/subscribe'].includes(
      entry.loc,
    ),
  )

  const articleLines = articles
    .map((entry) => `- [${entry.loc.replace('/article/', '')}](${SITE_URL}${entry.loc})`)
    .join('\n')
  const sectionLines = sections
    .map((entry) => `- [${entry.loc.slice(1)}](${SITE_URL}${entry.loc})`)
    .join('\n')

  const body = `# ${SITE_NAME}

> ${DEFAULT_DESCRIPTION}

Website: ${SITE_URL}

Sonar Mag is an independent online publication. We publish essays, reporting, and cultural field notes across World, Business, and Lifestyle.

## Start here
- [Homepage](${SITE_URL}/)
- [About](${SITE_URL}/about)
- [Subscribe / newsletter](${SITE_URL}/#subscribe)
- [Sitemap](${SITE_URL}/sitemap.xml)

## Sections
${sectionLines || `- [World](${SITE_URL}/world)
- [Business](${SITE_URL}/business)
- [Lifestyle](${SITE_URL}/lifestyle)`}

## Recent stories
${articleLines || `- See ${SITE_URL}/ for the latest board.`}

## Optional
- Contact: desk@sonarmag.com
- Keywords: journalism, culture, markets, essays, independent media, Sonar Mag
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}

import type { APIRoute } from 'astro'
import { SITE_URL } from '../lib/site'

export const prerender = false

const AI_BOTS = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'Bytespider',
  'CCBot',
  'cohere-ai',
]

export const GET: APIRoute = async () => {
  const aiBlocks = AI_BOTS.map(
    (bot) => `User-agent: ${bot}
Allow: /
`,
  ).join('\n')

  const body = `User-agent: *
Allow: /

${aiBlocks}
Sitemap: ${SITE_URL}/sitemap.xml
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

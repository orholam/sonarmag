import type { APIRoute } from 'astro'
import { submitIndexNow, urlsForPublishedArticle } from '../../lib/indexnow'

export const prerender = false

type Body = {
  urls?: string[]
  slug?: string
}

/**
 * POST /api/indexnow
 * Body: { "urls": ["https://...", "/article/slug"] } or { "slug": "article-slug" }
 *
 * Requires Authorization: Bearer <INDEXNOW_SUBMIT_SECRET> in production.
 */
export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.INDEXNOW_SUBMIT_SECRET
  if (import.meta.env.PROD && !secret) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'INDEXNOW_SUBMIT_SECRET is not configured',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }
  if (secret) {
    const auth = request.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (token !== secret) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const urls: string[] = []
  if (body.slug?.trim()) {
    urls.push(...urlsForPublishedArticle(body.slug.trim()))
  }
  if (Array.isArray(body.urls)) {
    urls.push(...body.urls.filter((u) => typeof u === 'string' && u.trim()))
  }

  if (urls.length === 0) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Provide urls[] or slug' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const result = await submitIndexNow(urls)
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
  })
}

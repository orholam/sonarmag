import type { APIRoute } from 'astro'
import { syncPopularFromAnalytics } from '../../lib/popular-sync'

export const prerender = false

function cronAuthorized(request: Request): boolean {
  const secret =
    (typeof process !== 'undefined' ? process.env.CRON_SECRET : undefined) ||
    import.meta.env.CRON_SECRET

  // Local / unset: allow so `curl` works in development.
  if (!secret) return !import.meta.env.PROD

  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === secret
}

/**
 * GET /api/cron/sync-popular
 * Daily Vercel Cron (and manual) refresh of Popular ranks from Web Analytics.
 * Schedule is once/day because Hobby only allows daily crons; homepage also
 * refreshes Popular lazily when the snapshot is stale.
 *
 * Auth: Authorization: Bearer <CRON_SECRET> when CRON_SECRET is set.
 */
export const GET: APIRoute = async ({ request }) => {
  if (!cronAuthorized(request)) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const result = await syncPopularFromAnalytics({ force: true })
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
  })
}

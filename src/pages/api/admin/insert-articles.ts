import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'

export const prerender = false

const ADMIN_SECRET = 'sonar-publish-20260804-once'

function getEnv(key: string): string | undefined {
  return (typeof process !== 'undefined' ? process.env[key] : undefined) ||
    (import.meta.env as Record<string, string | undefined>)[key]
}

function getAnonClient() {
  const url = getEnv('PUBLIC_SUPABASE_URL')
  const key = getEnv('PUBLIC_SUPABASE_ANON_KEY')
  if (!url || !key) throw new Error('Missing Supabase URL/anon key')
  return createClient(url, key, { auth: { persistSession: false } })
}

function getServiceClient() {
  const url = getEnv('PUBLIC_SUPABASE_URL')
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

async function insertViaServiceRole(
  articles: Array<Record<string, unknown>>,
): Promise<{ ok: boolean; results?: unknown[]; error?: string }> {
  const sb = getServiceClient()
  if (!sb) return { ok: false, error: 'No service role key available' }

  const results: unknown[] = []
  for (const a of articles) {
    const { data: existing } = await sb
      .from('articles')
      .select('slug')
      .eq('slug', String(a.slug))
      .maybeSingle()

    if (existing) {
      results.push({ slug: a.slug, status: 'exists' })
      continue
    }

    const { data, error } = await sb
      .from('articles')
      .insert({ ...a, published_at: new Date().toISOString() })
      .select('slug, is_highlighted, status, seo_title')
      .single()

    if (error) return { ok: false, error: error.message, results }
    results.push({ ...data, inserted: true })
  }
  return { ok: true, results }
}

async function insertViaRpc(
  articles: Array<Record<string, unknown>>,
): Promise<{ ok: boolean; results?: unknown; error?: string }> {
  const sb = getAnonClient()
  const { data, error } = await sb.rpc('insert_article_batch', {
    p_articles: articles,
    p_secret: ADMIN_SECRET,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, results: data }
}

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('x-sonar-publish') !== ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let articles: Array<Record<string, unknown>>
  try {
    articles = await request.json()
    if (!Array.isArray(articles)) throw new Error('Expected array')
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Try service role first, fall back to security definer RPC
  const svcResult = await insertViaServiceRole(articles)
  if (svcResult.ok) {
    return new Response(JSON.stringify({ ok: true, method: 'service_role', results: svcResult.results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const rpcResult = await insertViaRpc(articles)
  if (rpcResult.ok) {
    return new Response(JSON.stringify({ ok: true, method: 'rpc', results: rpcResult.results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      error: 'Both methods failed',
      service_role_error: svcResult.error,
      rpc_error: rpcResult.error,
    }),
    { status: 503, headers: { 'Content-Type': 'application/json' } },
  )
}

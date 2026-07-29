/**
 * One-off probe for App Store + changelog scrapers (no Astro env needed).
 * Usage: node scripts/probe-ai-wars-scrapers.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnv() {
  const text = readFileSync(resolve('.env.local'), 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2]
  }
}

loadEnv()

const UA = 'SonarMag/1.0 (+https://sonarmag.com/ai-wars)'
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY,
)

const APPS = [
  { key: 'chatgpt', appleId: '6448311069', name: 'ChatGPT', company: 'OpenAI' },
  { key: 'claude', appleId: '6473753684', name: 'Claude', company: 'Anthropic' },
  { key: 'gemini', appleId: '6477489729', name: 'Gemini', company: 'Google' },
  { key: 'grok', appleId: '6670324846', name: 'Grok', company: 'xAI' },
  { key: 'meta-ai', appleId: '1558240027', name: 'Meta AI', company: 'Meta' },
  { key: 'perplexity', appleId: '1668000334', name: 'Perplexity', company: 'Perplexity' },
  { key: 'copilot', appleId: '6472538445', name: 'Copilot', company: 'Microsoft' },
  { key: 'deepseek', appleId: '6737597349', name: 'DeepSeek', company: 'DeepSeek' },
]

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json()
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { Accept: '*/*', 'User-Agent': UA },
    signal: AbortSignal.timeout(20000),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.text()
}

function postId(url) {
  let h = 2166136261
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `p${(h >>> 0).toString(16)}${url.length.toString(16)}`
}

async function probeAppStore() {
  const overall = await fetchJson(
    'https://rss.applemarketingtools.com/api/v2/us/apps/top-free/100/apps.json',
  )
  const prod = await fetchJson(
    'https://itunes.apple.com/us/rss/topfreeapplications/limit=100/genre=6007/json',
  )

  const overallMap = new Map()
  overall.feed.results.forEach((item, i) => overallMap.set(item.id, i + 1))
  const prodMap = new Map()
  const entries = Array.isArray(prod.feed.entry) ? prod.feed.entry : [prod.feed.entry]
  entries.forEach((item, i) => {
    const id = item.id?.attributes?.['im:id']
    if (id) prodMap.set(id, i + 1)
  })

  const rows = APPS.map((app) => ({
    app_key: app.key,
    name: app.name,
    company: app.company,
    apple_id: app.appleId,
    productivity_rank: prodMap.get(app.appleId) ?? null,
    overall_rank: overallMap.get(app.appleId) ?? null,
    url: `https://apps.apple.com/us/app/id${app.appleId}`,
  }))

  console.log('\nApp Store ranks:')
  for (const r of rows.sort(
    (a, b) => (a.productivity_rank ?? 999) - (b.productivity_rank ?? 999),
  )) {
    console.log(
      `  ${r.name.padEnd(12)} prod=#${String(r.productivity_rank ?? '—').padStart(3)} overall=#${r.overall_rank ?? '—'}`,
    )
  }

  const { data, error } = await supabase.rpc('upsert_ai_wars_app_store_snapshot', {
    p_rows: rows,
    p_max_age: '0 seconds',
  })
  console.log('upsert app store:', { data, error: error?.message })
}

async function probeChangelog() {
  const feeds = [
    ['openai', 'OpenAI', 'https://openai.com/news/rss.xml'],
    ['google', 'Google', 'https://blog.google/technology/ai/rss/'],
    ['deepmind', 'DeepMind', 'https://deepmind.google/blog/rss.xml'],
    ['mistral', 'Mistral', 'https://mistral.ai/rss.xml'],
    ['cursor', 'Cursor', 'https://cursor.com/changelog/rss.xml'],
  ]
  const since = Date.now() - 90 * 864e5
  const posts = []

  for (const [companyId, company, url] of feeds) {
    const xml = await fetchText(url)
    const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []
    let n = 0
    for (const item of items) {
      const titleM = item.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
      const linkM =
        item.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i) ||
        item.match(/<guid\b[^>]*>([\s\S]*?)<\/guid>/i)
      const dateM = item.match(/<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i)
      if (!titleM || !linkM || !dateM) continue
      const published = Date.parse(dateM[1].replace(/<!\[CDATA\[|\]\]>/g, ''))
      if (!Number.isFinite(published) || published < since) continue
      const link = linkM[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim()
      const title = titleM[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim()
      posts.push({
        id: postId(link),
        company_id: companyId,
        company,
        title,
        url: link,
        published_at: new Date(published).toISOString(),
        source: url,
      })
      n++
    }
    console.log(`RSS ${company}: ${n} posts in 90d`)
  }

  const sm = await fetchText('https://www.anthropic.com/sitemap.xml')
  const blocks = sm.match(/<url>[\s\S]*?<\/url>/gi) ?? []
  let anthro = 0
  for (const block of blocks) {
    const locM = block.match(/<loc>([\s\S]*?)<\/loc>/i)
    const modM = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/i)
    if (!locM || !modM) continue
    const url = locM[1].trim()
    if (!/^https:\/\/www\.anthropic\.com\/news\/[^/]+\/?$/.test(url)) continue
    const published = Date.parse(modM[1])
    if (!Number.isFinite(published) || published < since) continue
    const slug = url.replace(/\/$/, '').split('/').pop()
    posts.push({
      id: postId(url),
      company_id: 'anthropic',
      company: 'Anthropic',
      title: slug
        .split('-')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' '),
      url,
      published_at: new Date(published).toISOString(),
      source: 'https://www.anthropic.com/sitemap.xml',
    })
    anthro++
  }
  console.log(`Anthropic sitemap: ${anthro} posts in 90d`)
  console.log(`Total posts: ${posts.length}`)

  const payload = posts
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
    .slice(0, 480)

  const { data, error } = await supabase.rpc('upsert_ai_wars_changelog_posts', {
    p_posts: payload,
    p_max_age: '0 seconds',
  })
  console.log('upsert changelog:', { data, error: error?.message })

  const t7 = Date.now() - 7 * 864e5
  const counts = {}
  for (const p of posts) {
    if (Date.parse(p.published_at) >= t7) {
      counts[p.company] = (counts[p.company] || 0) + 1
    }
  }
  console.log('Posts last 7d:', counts)
}

await probeAppStore()
await probeChangelog()

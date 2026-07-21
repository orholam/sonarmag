# Sonar Mag

Independent online publication — **Astro SSR** on Vercel, content in **Supabase**.

Live site: [https://www.sonarmag.com](https://www.sonarmag.com)

## Architecture

| Layer | Choice |
| --- | --- |
| App | Astro 7 (`output: 'server'`) + React islands (SSR only, no client hydration for main UI) |
| Adapter | `@astrojs/vercel` |
| CMS / data | Supabase Postgres (`sonarmag` project) |
| Hosting | Vercel |
| Rendering | On-demand HTML per request + short CDN cache (`s-maxage=60`) |

**Content workflow:** create or edit rows in Supabase (`articles`, `pages`, etc.). Pages fetch live on each request (with a 60s edge cache). No code change or redeploy required for new articles.

**Why Astro (not Next.js / not Vite SPA):** HTML-first for SEO and Core Web Vitals; full page navigations start at the top naturally; React used only as server-rendered components for the board/article markup.

## Environment

Copy `.env.example` → `.env.local`:

```bash
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
PUBLIC_SITE_URL=https://www.sonarmag.com
OPENROUTER_API_KEY=<server-only-openrouter-key>
```

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SUPABASE_URL` | Supabase API URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Public anon/publishable key (RLS-protected reads) |
| `PUBLIC_SITE_URL` | Canonical origin for meta, sitemap, robots |
| `OPENROUTER_API_KEY` | Server-only key for OpenRouter usage rankings on the homepage AI Race rail |
| `INDEXNOW_KEY` | IndexNow ownership key (must match `public/{key}.txt`) |
| `INDEXNOW_SUBMIT_SECRET` | Bearer secret for `POST /api/indexnow` (set in production) |

Also set these on Vercel for **Production** (and Preview). The code still accepts legacy `VITE_*` names as fallbacks. Never prefix `OPENROUTER_API_KEY` or IndexNow secrets with `PUBLIC_`.

## Supabase schema

Public tables (read via anon key + RLS):

- `authors`, `categories`, `articles`
- `pages`, `podcast_episodes`, `market_tickers`, `site_settings`
- `ai_race_boards` — cached Arena + OpenRouter leaderboards (refreshed ~daily)
- `comments` — public read + insert; `articles.comments_count` stays in sync via trigger
- `newsletter_subscribers` — insert-only (`email`, `source`, `created_at`); homepage collector posts to `/api/newsletter`

Schema reference: `supabase/migrations/`.

AI / crawler surfaces:

- `/llms.txt` — brand brief for LLM crawlers
- `/robots.txt` — allows major AI bots + sitemap
- JSON-LD: Organization, WebSite, FAQPage (home/about), NewsArticle (stories)

Homepage:

- Insert a published row → it appears on the board automatically
- `is_highlighted = true` → large splash hero (newest highlighted wins)
- Secondary, opinion, dark card, and Latest fill from remaining recent stories
- Popular: optional `popular_rank` ascending

## SEO

Server-rendered in `src/layouts/BaseLayout.astro`:

- `<title>`, description, canonical, robots
- Open Graph + Twitter cards
- Article extras: `article:published_time`, `article:author`, `article:section`
- JSON-LD: Organization/WebSite (home), NewsArticle + BreadcrumbList (articles)

Dynamic endpoints:

- `/sitemap.xml` — built from published articles + pages
- `/robots.txt` — points at the sitemap
- IndexNow — key at `/{INDEXNOW_KEY}.txt`; notify Bing via `POST /api/indexnow` with `{ "slug": "…" }` or `{ "urls": […] }`

## Develop

```bash
npm install
npm run dev
```

Dev server: http://127.0.0.1:5173/

## Build / preview

```bash
npm run build
npm run preview
```

## Key paths

- `astro.config.mjs` — SSR + Vercel adapter + React
- `src/pages/index.astro` — homepage
- `src/pages/article/[slug].astro` — articles
- `src/pages/[slug].astro` — static pages from Supabase
- `src/components/HomeBoard.tsx` / `ArticleView.tsx` — React SSR markup (no `client:*`)
- `src/components/SiteHeader.astro` / `SiteFooter.astro`
- `src/lib/api.ts` — Supabase queries

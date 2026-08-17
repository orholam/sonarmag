# Sonar Mag SEO journey

Living log. Append a dated entry after every SEO pass. Do not rewrite history;
strike through a plan in the log if we reversed it.

**Property:** [Google Search Console](https://search.google.com/search-console) → `https://www.sonarmag.com/` (URL-prefix, www only).  
**Live site:** https://www.sonarmag.com  
**Sitemap:** https://www.sonarmag.com/sitemap.xml  
**Related:** [directory submissions](directory-submissions.md) (brand/backlinks; do not re-submit).

## How to re-measure

Pull Search Console for `https://www.sonarmag.com/` from **2026-07-20** through yesterday (GSC lags 1–2 days). Record clicks, impressions, CTR, average position, `/ai-wars` impressions/CTR, and sitemap last-downloaded date. Paste a new **Log** row. Do not treat the sitemap “0 indexed” counter as coverage failure if URL Inspection still says “Submitted and indexed.”

## Baseline — 2026-08-17

First full desk look since launch (first GSC day: 2026-07-20). Data through **2026-08-15**.

| Metric | Value |
| --- | --- |
| Google clicks | 3 (Jul 24, 26, 28 only) |
| Impressions | 420 |
| CTR | 0.71% |
| Average position | 22.4 |
| Published articles | 54 |
| URLs with ≥1 impression | 36 |
| `/ai-wars` | 144 impressions, position 13.3, **0 clicks** |
| OpenAI refusals article | 47 impressions, position 13.5, 0 clicks |
| Waymo / Apollo Go article | 17 impressions, position 15.0, 0 clicks |
| Brand queries (“sonar magazine”) | 3 impressions, 0 clicks |
| Sitemap last downloaded by Google | **2026-07-26** (stale; GSC still showed 33 URLs) |
| Live sitemap that day | 69 URLs, with `/latest` and `/popular` duplicated |
| Sample URL Inspection | Homepage, `/ai-wars`, newest + early articles: indexed. `/latest` and `/popular`: Discovered – not indexed. |

Verdict at baseline: crawl/index is healthy. Discovery is growing (118 impressions through Jul 28 → 420 through Aug 15). Clicks are not. One third of impressions are AI Wars.

Do not chase named GSC queries stuffed with `-site:reddit.com` / `-site:twitter.com`. Those are agent searches; they inflate impressions and will not click.

## Open work

| Item | Status | Notes |
| --- | --- | --- |
| AI Wars SERP title + description | **Shipped in code 2026-08-17** | Needs deploy. On-page `<h1>` stays “AI Wars”. |
| Sitemap dedupe; drop listing pages | **Shipped in code 2026-08-17** | Needs deploy. GSC API could not re-submit (missing scopes). Click Submit on the sitemap in Search Console after deploy. |
| `noindex, follow` on `/latest` and `/popular` | **Shipped in code 2026-08-17** | Thin archives. Google had already declined to index them. |
| Truncate article meta descriptions to ~160 chars | **Shipped in code 2026-08-17** | Homepage card `excerpt` unchanged. |
| OpenAI refusals `seo_title` | **Blocked** | Current: `OpenAI Disabled Safety Refusals to Benchmark Cyber Attacks`. Proposed: `OpenAI Turned Off Refusals to Benchmark Cyber Attacks` (53 chars, closer to “openai refusal”). Needs Sonar Mag Supabase write (`igrhfqirkbvxbvilfoca`). This workspace only has the Kanban MCP. |
| Waymo / Apollo Go `seo_title` | **Leave** | Already `Waymo vs. Apollo Go in the Self-Driving Race`. |
| Brand demand | Parked | Directories + bylines, not on-page. See directory logs. Do not re-mail To: addresses in the local outreach ledger. |
| Bing Webmaster Tools | Parked | Not connected. IndexNow key already on the site. |
| Domain property for apex `sonarmag.com` | Parked | GSC is www URL-prefix only. Referring URLs include the apex. |
| Google News / Top Stories | Ignore for now | Four-week-old site. NewsArticle JSON-LD validates; rich results currently show breadcrumbs only. |

## Log

### 2026-08-17 — first pass after launch audit

**Did**

- Rewrote `/ai-wars` `<title>` / `og:title` from `AI Wars: AI model & coding agent scoreboard` to `AI Wars live scoreboard of OpenAI vs Anthropic` (46 chars before ` — Sonar Mag`). Meta description now leads with OpenAI / Anthropic / Google / xAI, then live ranks. Matches the query family already ranking the page (`anthropic vs openai`, coding-agent leaderboard) without turning the on-page headline into keyword paste.
- Stopped listing `/latest` and `/popular` in `fetchSitemapEntries()` (they were hardcoded **and** in `pages`, so they appeared twice). Dedupe by `loc`. `/brief` stays out of this sitemap pass until that page ships.
- Set `robots="noindex, follow"` on those two listing pages so Google can still walk through to articles.
- Added `searchDescription()` so article `<meta name="description">` and NewsArticle JSON-LD stop dumping the full homepage dek (often 70–110 words) into the SERP snippet.
- Pinged IndexNow for `/`, `/ai-wars`, and the sitemap (HTTP 200). Bing-side notice only.
- Attempted to resubmit the sitemap through the Search Console API: **insufficient scopes**. Google’s last download is still 2026-07-26 until someone clicks Submit in the GSC Sitemaps UI (or Google recrawls after deploy).

**Did not**

- Change article `title` fields (on-page headlines).
- Rewrite the OpenAI or Waymo `seo_title` rows (no Sonar Mag Supabase write from this session).
- Connect Bing or add an apex domain property.
- Optimize for agent-style GSC queries.

**Watch next (re-check ~2026-08-31)**

- `/ai-wars` CTR and clicks vs the 144 / 0 baseline.
- Sitemap last-downloaded date and submitted URL count (should move off 33).
- Whether listing pages stay “not indexed” after the robots tag ships.

## Recheck cadence

Every two weeks until `/ai-wars` has a real CTR, then monthly. Same GSC window: launch date → yesterday. Add a **Log** entry even if nothing changed.

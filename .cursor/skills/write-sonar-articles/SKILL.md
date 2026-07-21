---
name: write-sonar-articles
description: >-
  Create exactly two new Sonar Mag articles in Supabase from a user brief (or,
  if no topics are given, from fresh tech×philosophy news research), with one
  marked is_highlighted for the homepage splash hero. Use when the user asks to
  write articles, publish stories, or run the Sonar article skill.
---

# Write Sonar Mag articles (pair)

## Mandatory first step

Read and obey the full manifesto before drafting:

[`docs/anti-slop-manifesto.md`](../../docs/anti-slop-manifesto.md)

Also follow [`.cursor/rules/writing-articles.mdc`](../rules/writing-articles.mdc) for CMS fields and tweet embeds.

## Output contract

Produce **exactly two** published articles unless the user explicitly overrides:

1. **Highlighted** — `is_highlighted = true` (splash hero)
2. **Companion** — `is_highlighted = false` (flows into secondary / Latest automatically)

Both must be original Sonar copy. If the brief is one topic, split into two distinct angles (e.g. news frame + opinion/analysis), not a duplicated rewrite.

## When the user gives no topics

If the user invokes this skill without naming subjects, **do not invent evergreen essays**. Start with discovery, then draft.

### Discovery beat (required)

1. **Research fresh news** at the intersection of **tech and philosophy** — ideas with a live hook: AI and agency, platforms and speech, surveillance and dignity, automation and work, biotech and personhood, computation and knowledge, virtual worlds and identity, crypto/governance, content moderation and truth, etc.
2. Prefer **what broke in the last ~7–14 days** (reports, filings, product launches, court rulings, lab papers with a public claim, major essays reacting to a fresh event). Avoid decade-old thinkpieces recycled as "trending."
3. Use web search (and primary sources when possible). Cross-check numbers. Skip anything you cannot date or attribute.
4. **Avoid duplicates:** `select slug, title, published_at from articles order by published_at desc limit 20` and do not rehash a case Sonar just covered.
5. Shortlist **3–5** candidate stories. Pick **two** that share a territory but need different jobs (e.g. news ledger + judgment companion), or two adjacent tech×philosophy fights from the same week.
6. Tell the user the two chosen angles in one sentence each **before or as you publish** (no long pitch deck). If the user already said "just write," proceed without waiting.

### Freshness rules

- Hard prefer stories with a **datable news peg** this week or last.
- Reject "timeless" prompts (*What is consciousness?*, *Is technology good?*) unless tied to a concrete new artifact (a paper, a bill, a model release, a ruling).
- If the only hits are stale, widen the search once (adjacent beats, international desks), then pick the freshest defensible pegs. Do not pad with old culture-war reheats.

### Opinion sprinkle

Wire rewrite is not enough. Each piece needs a Sonar **judgment** — a clear view earned by the particulars — without becoming a Substack vibe dump.

- Lead with the fact or collision; let opinion sharpen the frame and the ending.
- Companion piece may lean more argumentative; highlighted piece may lean more reported. Both need a point of view.
- Still obey manifesto voice and **§8a LLM tells**. Opinion is not *not X, but Y* profundity.

## Workflow

Copy and track:

```
Article pair
- [ ] Read anti-slop manifesto
- [ ] If no topics: research tech×philosophy news (fresh pegs) + pick 2 angles
- [ ] Resolve authors + categories from Supabase
- [ ] Draft A (highlighted) + Draft B
- [ ] Manifesto checklist pass on both (incl. §8a)
- [ ] Insert both rows (status published)
- [ ] Confirm /article/{slug} and homepage hero for A
- [ ] Ping IndexNow for both article URLs + homepage
```

### 1. Load CMS context

Via Supabase MCP (`execute_sql` on project `igrhfqirkbvxbvilfoca` / sonarmag) or local env:

- `select id, name, slug from authors`
- `select id, name, slug from categories`
- Ensure new `slug` values are unique
- When topicless: also load recent titles to avoid repeats

### 2. Draft

For each article set:

- **Title first** — pass the manifesto title test (specific case / verdict / real question; no colon-SEO, topic tags, or slogan-oversells of study claims). Clever tone without a clear referent fails.
- **Excerpt as continuous card dek** — splash/opinion boards show the excerpt in two CSS columns as one flowing text (~70–110 words). Do not dump body paras into a side-by-side grid.
- Excerpt, ticker, hero/thumb images + alts (see **Images** below)
- `read_minutes` / `listen_minutes`, `published_label` (e.g. `Today`)
- `paragraphs` jsonb (5–9 prose strings in manifesto voice; tweet objects if the brief includes X URLs)
- Optional title `highlight_word` / `highlight_tone` (mark a phrase that already appears in the title)

Fetch tweet text before embedding. Do not invent stats.
Open with a claim or sharp comparison; keep particulars denser than abstractions.
Before insert, run §8a: strip em-dash pairs, *not X but Y*, and *actually*-as-emphasis.

### Images (hero + thumb)

Follow manifesto **§12a**. Short version: prefer case-specific objects, places, and documentary frames. **Deprioritize** (do not absolute-ban) casting-call stock people *and* generic offices / computers / laptop flat-lays / server-rack wallpaper. Humans, desks, and screens are fine when the photo is specific and earned.

Same Unsplash (or equivalent) URL pattern for `hero_image` and `thumb_image`; write `hero_alt` as a concrete scene, not a vibe caption. If the first hit is interchangeable stock, search again.

### 3. Insert

Insert two rows into `public.articles` with `status = 'published'`. Set **only one** `is_highlighted = true`.

Do not set `featured_slot` for layout.

### 4. Verify

- Open `/article/{slug}` for both
- Homepage large card shows the highlighted piece (allow ~60s cache)

### 5. IndexNow (required after publish)

Notify Bing/IndexNow so new URLs are crawled promptly:

```bash
curl -sS -X POST https://www.sonarmag.com/api/indexnow \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $INDEXNOW_SUBMIT_SECRET" \
  -d '{"urls":["/","/article/SLUG-A","/article/SLUG-B"]}'
```

If `INDEXNOW_SUBMIT_SECRET` is unset locally, omit the Authorization header. Prefer calling the live site after rows are published (not localhost). Or POST directly to `https://api.indexnow.org/indexnow` using the key in `public/{key}.txt` / `INDEXNOW_KEY` — see `src/lib/indexnow.ts`.

## Anti-patterns

- Writing one article when the skill was invoked for a pair
- Highlighting both (or neither) without user instruction
- Skipping the manifesto read
- Redeploying the app to "publish" copy — rows are enough
- Topicless runs that skip research and invent evergreen philosophy
- Topicless runs that chase pure gadget news with no idea at stake (or pure theory with no news peg)
- Re-covering a slug/case already on the board without a new development
- Defaulting to stock people, empty offices, or laptop flat-lays when a more specific image exists (see manifesto §12a)

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
4. **Avoid duplicates:** `select slug, title, published_at from articles order by published_at desc limit 20` and do not rehash a case Sonar just covered. Keep that list handy for **internal links** (below).
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
- [ ] Pick unique hero images (not already on any article; A ≠ B) + concrete hero_alt each
- [ ] Add 0–2 internal links each (only if earned)
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
- For linking: keep `slug` + `title` for recent published stories (same query is fine)
- **Taken images (required):** load every photo already in use so new heroes do not collide:

```sql
select distinct public.article_image_key(url) as image_key
from (
  select hero_image as url from articles where coalesce(hero_image, '') <> ''
  union
  select thumb_image from articles where coalesce(thumb_image, '') <> ''
) u
where public.article_image_key(url) is not null;
```

Treat each `image_key` (usually `photo-{id}` for Unsplash) as reserved. Postgres will reject inserts that reuse a key.

### 2. Draft

#### Title mode (required, before drafting titles)

Do **not** ask yourself to "vary titles" or paste Atlantic example lists into the draft step. LLMs collapse to one high-prior formula under that kind of instruction. Variety comes from an **external assignment**, then obeying it.

Before writing either title, roll modes in the shell (do not invent the roll):

```bash
pick() {
  # House formula is majority (~50%). Alternates are equal minority shares.
  local bag=(actor-verb actor-verb actor-verb actor-verb how problem-with even question portrait)
  echo "${bag[RANDOM % ${#bag[@]}]}"
}
MODE_A=$(pick); MODE_B=$(pick)
# Pair must not share a mode — re-roll B until different
while [ "$MODE_B" = "$MODE_A" ]; do MODE_B=$(pick); done
printf 'A=%s B=%s\n' "$MODE_A" "$MODE_B"
```

Then write each title **only** in its assigned mode:

| Mode | Shape (structure only — do not copy sample wording) |
| --- | --- |
| `actor-verb` | Named actor + charged verb + concrete object (the house formula) |
| `how` | *How* + subject + lost/failed/became/learned + stakes |
| `problem-with` | *The Problem With* / *The Truth About* + specific object |
| `even` | *Even* + unlikely actor + can't/won't + concrete failure |
| `question` | Real question with stakes (piece must attempt an answer) |
| `portrait` | Short charged phrase or verdict-noun (no throat-clearing) |

Quality bar is unchanged: manifesto title tests, bans, and title↔body contract still apply. A mode is a syntactic slot, not a free pass for vague buckets or slogan-oversells. If the rolled mode cannot name the case cleanly, re-roll **that article only** once; then ship.

Record the two modes in the short publish note to the user (one line).

For each article set:

- **Title first** — under the rolled mode, pass the manifesto title test (specific case / verdict / real question; no colon-SEO, topic tags, or slogan-oversells of study claims). Clever tone without a clear referent fails.
- **Excerpt as continuous card dek** — splash/opinion boards show the excerpt in two CSS columns as one flowing text (~70–110 words). Do not dump body paras into a side-by-side grid.
- Excerpt, ticker, hero/thumb images + alts (see **Images** below)
- `read_minutes` / `listen_minutes`, `published_label` (e.g. `Today`)
- `paragraphs` jsonb (5–9 prose strings in manifesto voice; tweet objects if the brief includes X URLs)
- Optional title `highlight_word` / `highlight_tone` (mark a phrase that already appears in the title)

Fetch tweet text before embedding. Do not invent stats.
Open with a claim or sharp comparison; keep particulars denser than abstractions.
Before insert, run §8a: strip em-dash pairs, *not X but Y*, and *actually*-as-emphasis.

### Internal links (minimal)

Body paragraphs support markdown-style links: `[anchor text](/article/slug)`.

Use them sparingly:

- **Budget:** 0–2 internal links per article. Zero is fine. Do not pad.
- **Earn it:** link only when another Sonar story sharpens *this* point (same case, prior reporting, or the companion in the pair). If the sentence works without the link, skip it.
- **Pair cross-link:** at most one each way between the two new pieces, and only when the reader gains something (not “see also our other piece”).
- **Archive links:** prefer a recent related `slug` from the CMS query over inventing a “related reading” section.
- **Placement:** mid-body prose only. Never in `title`, `excerpt`, or `ticker`. Never a footer list of links.
- **Anchor text:** concrete phrase the reader would click (*the Hugging Face break-in*, *Delaware’s liability box*) — not “click here” or the full headline.
- **Href shape:** site-relative `/article/{slug}` only for Sonar stories.

Anti-patterns: link dumps, SEO keyword stuffing, linking every proper noun, “Further reading” closers.

### Images (hero + thumb)

Follow manifesto **§12a**. Short version: prefer case-specific objects, places, and documentary frames. **Deprioritize** (do not absolute-ban) casting-call stock people *and* generic offices / computers / laptop flat-lays / server-rack wallpaper. Humans, desks, and screens are fine when the photo is specific and earned.

Same Unsplash (or equivalent) URL pattern for `hero_image` and `thumb_image` on **one** article. If the first hit is interchangeable stock, search again.

**`hero_alt` is required** (DB check: non-empty whenever `hero_image` is set):

- One concrete scene sentence: what is visibly in the frame (*A padlock on a chain-link gate*, not *AI security vibes*).
- Never leave `hero_alt` null/blank. Never use the article title as a lazy stand-in unless it literally describes the photo.
- Thumbnails reuse the same `hero_alt` in the UI — write it for both contexts.

**No reused photos across articles:**

- Extract the Unsplash id from the path (`photo-…`). That id must not appear in the taken-images query above, and the two new pieces must not share an id with each other.
- Query-string differences (`w=`, `q=`) do **not** make a photo unique — the DB normalizes via `article_image_key()`.
- If insert fails with `article image already used by "…"`, pick a different photo and retry.
- Within a pair: two distinct photos, even when the stories share a beat.

### 3. Insert

Insert two rows into `public.articles` with `status = 'published'`. Set **only one** `is_highlighted = true`.

Do not set `featured_slot` for layout.

### 4. Verify

- Open `/article/{slug}` for both
- Homepage large card shows the highlighted piece (allow ~60s cache)
- If you added internal links, spot-check that the anchors resolve

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
- Reusing a hero/thumb photo already attached to another article (or to the other piece in the pair)
- Shipping a hero_image without a concrete non-empty hero_alt
- Stuffing internal links, “related reading” footers, or linking without an earned referent
- Asking the model to “add title variety” or stuffing more Atlantic examples into the draft step instead of rolling title modes
- Ignoring a rolled title mode, or forcing every piece into `actor-verb` after the roll

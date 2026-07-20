---
name: write-sonar-articles
description: >-
  Create exactly two new Sonar Mag articles in Supabase from a user brief, with
  one marked is_highlighted for the homepage splash hero. Use when the user asks
  to write articles, publish stories, or run the Sonar article skill.
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

## Workflow

Copy and track:

```
Article pair
- [ ] Read anti-slop manifesto
- [ ] Resolve authors + categories from Supabase
- [ ] Draft A (highlighted) + Draft B
- [ ] Manifesto checklist pass on both
- [ ] Insert both rows (status published)
- [ ] Confirm /article/{slug} and homepage hero for A
```

### 1. Load CMS context

Via Supabase MCP (`execute_sql` on project `igrhfqirkbvxbvilfoca` / sonarmag) or local env:

- `select id, name, slug from authors`
- `select id, name, slug from categories`
- Ensure new `slug` values are unique

### 2. Draft

For each article set:

- Title, excerpt, ticker, hero/thumb images + alts
- `read_minutes` / `listen_minutes`, `published_label` (e.g. `Today`)
- `paragraphs` jsonb (5–9 prose strings; tweet objects if the brief includes X URLs)
- Optional title `highlight_word` / `highlight_tone`

Fetch tweet text before embedding. Do not invent stats.

### 3. Insert

Insert two rows into `public.articles` with `status = 'published'`. Set **only one** `is_highlighted = true`.

Do not set `featured_slot` for layout.

### 4. Verify

- Open `/article/{slug}` for both
- Homepage large card shows the highlighted piece (allow ~60s cache)

## Anti-patterns

- Writing one article when the skill was invoked for a pair
- Highlighting both (or neither) without user instruction
- Skipping the manifesto read
- Redeploying the app to "publish" copy — rows are enough

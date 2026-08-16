---
name: update-ai-wars-analysis
description: >-
  Weekly refresh of Sonar Mag AI Wars Current-state scoring and analysis in
  Supabase (positioning, heat, blurbs, week moves, citations, three-paragraph
  analyses). Use when the user asks to update AI Wars analysis, re-score
  companies, or run the desk refresh.
---

# Update AI Wars analysis (desk refresh)

You maintain Sonar Mag’s AI Wars “Current state” desk board in Supabase (project sonarmag / `igrhfqirkbvxbvilfoca`).

Goal: refresh company scoring and analysis so https://sonarmag.com/ai-wars stays current.

## Data to update

Table `ai_wars_companies`. Key fields:

- `positioning` (0–100), `heat` (0–100)
- `blurb` — one-line current-state dek
- `week_move` — 3–5 short paragraphs, blank-line separated. Always: (1) old score → new score, and what “positioning” means in this case; (2) the facts that argued for a raise; (3) the facts that argued against a bigger move or a cut; (4) why this delta and not another. Mark every load-bearing fact with inline `[n]` where `n` is the 1-based index into `citations`. Ban desk slang. A stranger should follow the argument without the rest of the page.
- `citations` — jsonb array of `{ "label", "url", "kind", "note" }`. Index 0 is `[1]`. **`note` is required** (what the source is). The argument itself lives in `week_move` next to the `[n]`, not only in the note.
- `analysis` — jsonb array of exactly 3 strings
- `open_weight`, `updated_at` (auto)

Prefer `set_ai_wars_company_scores(id, positioning, heat, blurb, analysis, open_weight, measured_on, week_move, citations)` — it always upserts that day’s `ai_wars_positioning_history` row even when positioning is unchanged. Do not skip a company just because scores held flat; every active board company needs a history point for the desk week.

**Every company every week must get a non-empty `week_move` and at least two real `citations` with working URLs and a `note` on each.** Board metrics count as `data` (OpenRouter, Arena, Reddit visitors, App Store). Changelog/vendor posts are `vendor`. Wire news is `news`. Essays/analysis pieces that informed the take are `opinion`.

`week_move` and citations render **only in the opened analysis** (dialog + Desk analyses), not on the compact Current-state cards. Write them for a reader who does not already know the scoring jargon.

After writes, verify the week’s history completeness:

```sql
select measured_on, count(*) as n, bool_or(company_id = 'anthropic') as has_anthropic
from ai_wars_positioning_history
group by measured_on
order by measured_on desc
limit 4;
```

Also verify week_move/citations coverage:

```sql
select id,
  length(week_move) as move_len,
  jsonb_array_length(citations) as cites,
  (select bool_and(coalesce(c->>'note','') <> '') from jsonb_array_elements(citations) c) as notes_ok
from ai_wars_companies
order by id;
```

`n` must equal the live company count (currently 12). If any company is missing from history, insert the held score for that `measured_on` before finishing. If any `move_len = 0`, `cites < 2`, or `notes_ok` is false, fix before finishing.

## Research (past ~7 days)

Pull fresh signals before scoring — news, trends, launches, deals, usage slips, board metrics:

- LMSYS/Arena text preference and vote mass
- OpenRouter daily token volume / provider share (esp. international labs)
- Coding-agent Reddit weekly visitors (Claude Code, Codex, Cursor, Copilot, etc.) — weekly visitors, not DAU
- Distribution, capital, deals, product launches
- Open vs closed primary/frontier weights
- Relevant longer-horizon Polymarket AI markets when they inform heat/positioning

Also read current `ai_wars_companies` rows so you revise from the live board, not from memory alone.

**Opinion / analysis pieces:** hard news and quantitative trends are the default. Strong opinion or analysis essays can also move scores and copy when they make good points (a clear, well-argued frame that changes how the desk should read a lab’s footing) — do not ignore them just because they are not wire-service news. Still require a concrete referent; vibe takes without particulars do not count. When an opinion piece shaped the week_move, cite it.

## Scoring rules

- Rank is never hand-ordered: UI sorts by positioning + heat (then positioning, then heat).
- Use real spread on positioning (top vs bottom should not sit within ~10–15 points). Mid-pack labs should not crowd the leaders.
- Heat reflects near-term discourse/usage momentum; positioning is strategic seat (models + distribution + capital + product).
- Scores are 0–100 integers.

## Analysis / blurb / week_move voice

- Blurb: one-line card dek (current state).
- Week move: 3–5 paragraphs with inline `[n]` on every load-bearing fact. Include the counter-evidence, not only the raise.
- Analysis: exactly three paragraphs, signal-dense (“Signals: …”), not prosaic essays. Cite concrete board metrics, ranks, open/closed, competitive cross-pressure, and score logic.
- Do not invent unverifiable numbers; prefer ranges or qualitative when sources disagree.
- Do not invent citation URLs — only links you fetched or already have in changelog/board data.

## Scope

- Update all companies in both regions (us + international) unless a row is clearly obsolete — then note it.
- Do not edit frontend/CSS unless a schema or tooling bug blocks the update.
- After writes, verify with a SELECT of id, region, positioning, heat, week_move, citations, updated_at and briefly report what moved week-over-week.
- Also confirm that week’s `ai_wars_positioning_history` includes every live company (see completeness query above).

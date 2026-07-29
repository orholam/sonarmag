---
name: update-ai-wars-analysis
description: >-
  Weekly refresh of Sonar Mag AI Wars Current-state scoring and analysis in
  Supabase (positioning, heat, blurbs, three-paragraph analyses). Use when the
  user asks to update AI Wars analysis, re-score companies, or run the desk
  refresh.
---

# Update AI Wars analysis (desk refresh)

You maintain Sonar Mag’s AI Wars “Current state” desk board in Supabase (project sonarmag / `igrhfqirkbvxbvilfoca`).

Goal: refresh company scoring and analysis so https://sonarmag.com/ai-wars stays current.

## Data to update

Table `ai_wars_companies`. Key fields: `positioning` (0–100), `heat` (0–100), `blurb`, `analysis` (jsonb array of exactly 3 strings), `open_weight`, `updated_at` (auto).

Changing positioning auto-upserts today’s row in `ai_wars_positioning_history`. Prefer `set_ai_wars_company_scores(id, positioning, heat, blurb, analysis, open_weight)` when available, or equivalent SQL updates.

## Research (past ~7 days)

Pull fresh signals before scoring — news, trends, launches, deals, usage slips, board metrics:

- LMSYS/Arena text preference and vote mass
- OpenRouter daily token volume / provider share (esp. international labs)
- Coding-agent Reddit weekly visitors (Claude Code, Codex, Cursor, Copilot, etc.) — weekly visitors, not DAU
- Distribution, capital, deals, product launches
- Open vs closed primary/frontier weights
- Relevant longer-horizon Polymarket AI markets when they inform heat/positioning

Also read current `ai_wars_companies` rows so you revise from the live board, not from memory alone.

**Opinion / analysis pieces:** hard news and quantitative trends are the default. Strong opinion or analysis essays can also move scores and copy when they make good points (a clear, well-argued frame that changes how the desk should read a lab’s footing) — do not ignore them just because they are not wire-service news. Still require a concrete referent; vibe takes without particulars do not count.

## Scoring rules

- Rank is never hand-ordered: UI sorts by positioning + heat (then positioning, then heat).
- Use real spread on positioning (top vs bottom should not sit within ~10–15 points). Mid-pack labs should not crowd the leaders.
- Heat reflects near-term discourse/usage momentum; positioning is strategic seat (models + distribution + capital + product).
- Scores are 0–100 integers.

## Analysis / blurb voice

- Blurb: one-line card dek.
- Analysis: exactly three paragraphs, signal-dense (“Signals: …”), not prosaic essays. Cite concrete board metrics, ranks, open/closed, competitive cross-pressure, and score logic.
- Do not invent unverifiable numbers; prefer ranges or qualitative when sources disagree.

## Scope

- Update all companies in both regions (us + international) unless a row is clearly obsolete — then note it.
- Do not edit frontend/CSS unless a schema or tooling bug blocks the update.
- After writes, verify with a SELECT of id, region, positioning, heat, updated_at and briefly report what moved week-over-week.

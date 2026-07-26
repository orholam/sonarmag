-- Desk “current state” for AI Wars: manual company scores + analysis.
-- Update rows in Supabase; positioning changes auto-snapshot into history.

create table public.ai_wars_companies (
  id text primary key,
  name text not null,
  region text not null check (region in ('us', 'international')),
  domain text not null,
  hq text not null,
  open_weight boolean not null default false,
  blurb text not null,
  analysis jsonb not null
    check (
      jsonb_typeof(analysis) = 'array'
      and jsonb_array_length(analysis) = 3
    ),
  positioning integer not null check (positioning between 0 and 100),
  heat integer not null check (heat between 0 and 100),
  sort_hint integer not null default 0,
  updated_at timestamptz not null default now()
);

create index ai_wars_companies_region_idx
  on public.ai_wars_companies (region);

create table public.ai_wars_positioning_history (
  id bigint generated always as identity primary key,
  company_id text not null references public.ai_wars_companies (id) on delete cascade,
  measured_on date not null,
  positioning integer not null check (positioning between 0 and 100),
  created_at timestamptz not null default now(),
  unique (company_id, measured_on)
);

create index ai_wars_positioning_history_measured_on_idx
  on public.ai_wars_positioning_history (measured_on desc);

create index ai_wars_positioning_history_company_idx
  on public.ai_wars_positioning_history (company_id, measured_on desc);

alter table public.ai_wars_companies enable row level security;
alter table public.ai_wars_positioning_history enable row level security;

create policy "Public read ai wars companies"
  on public.ai_wars_companies for select
  to anon, authenticated
  using (true);

create policy "Public read ai wars positioning history"
  on public.ai_wars_positioning_history for select
  to anon, authenticated
  using (true);

create or replace function public.ai_wars_companies_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ai_wars_companies_set_updated_at
  before update on public.ai_wars_companies
  for each row
  execute function public.ai_wars_companies_touch_updated_at();

-- When positioning changes (or on insert), upsert today's history point.
create or replace function public.ai_wars_snapshot_positioning()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT'
     or new.positioning is distinct from old.positioning then
    insert into public.ai_wars_positioning_history (
      company_id,
      measured_on,
      positioning
    )
    values (
      new.id,
      current_date,
      new.positioning
    )
    on conflict (company_id, measured_on) do update
      set positioning = excluded.positioning;
  end if;
  return new;
end;
$$;

create trigger ai_wars_companies_snapshot_positioning
  after insert or update of positioning on public.ai_wars_companies
  for each row
  execute function public.ai_wars_snapshot_positioning();

-- Convenience: update scores (+ optional copy) in one call from SQL editor.
create or replace function public.set_ai_wars_company_scores(
  p_id text,
  p_positioning integer,
  p_heat integer,
  p_blurb text default null,
  p_analysis jsonb default null,
  p_open_weight boolean default null,
  p_measured_on date default current_date
)
returns public.ai_wars_companies
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.ai_wars_companies;
begin
  if p_positioning < 0 or p_positioning > 100 then
    raise exception 'positioning must be 0–100';
  end if;
  if p_heat < 0 or p_heat > 100 then
    raise exception 'heat must be 0–100';
  end if;
  if p_analysis is not null
     and (
       jsonb_typeof(p_analysis) <> 'array'
       or jsonb_array_length(p_analysis) <> 3
     ) then
    raise exception 'analysis must be a jsonb array of exactly 3 strings';
  end if;

  update public.ai_wars_companies c
  set
    positioning = p_positioning,
    heat = p_heat,
    blurb = coalesce(p_blurb, c.blurb),
    analysis = coalesce(p_analysis, c.analysis),
    open_weight = coalesce(p_open_weight, c.open_weight)
  where c.id = p_id
  returning * into row;

  if row.id is null then
    raise exception 'unknown company id: %', p_id;
  end if;

  -- Allow backdated / explicit snapshot date (trigger uses current_date).
  if p_measured_on is distinct from current_date then
    insert into public.ai_wars_positioning_history (
      company_id,
      measured_on,
      positioning
    )
    values (p_id, p_measured_on, p_positioning)
    on conflict (company_id, measured_on) do update
      set positioning = excluded.positioning;
  end if;

  return row;
end;
$$;

revoke all on function public.set_ai_wars_company_scores(
  text, integer, integer, text, jsonb, boolean, date
) from public;
-- Desk-only via service role / SQL editor; not exposed to anon.
grant execute on function public.set_ai_wars_company_scores(
  text, integer, integer, text, jsonb, boolean, date
) to service_role;

-- —— Seed: July 2026 desk board ——
insert into public.ai_wars_companies (
  id, name, region, domain, hq, open_weight, blurb, analysis, positioning, heat, sort_hint
)
values
(
  'anthropic', 'Anthropic', 'us', 'anthropic.com', 'San Francisco', false,
  'Owns the preference board and coding-agent conversation. Claude family leads Arena text; Claude Code is the loudest subreddit heat signal.',
  $json$[
    "Signals: Arena text — Claude family holds #1–#4 band (claude-fable-5 ~1507 Elo; opus-thinking variants immediately behind) with large vote bases (tens of thousands). Coding agents — Claude Code ~890K subreddit weekly visitors, ~58% of the desk’s six-tool weekly-visitor pool (Codex ~440K, Cursor ~104K, Copilot ~92K). Weights: closed. Stack: preference leader + coding-agent weekly visitors leader in one company — the only US lab with that double.",
    "Positioning 96: frontier preference + developer agent product + enterprise “safe lab” brand + closed-weight lock-in. Weak relative signal: OpenRouter daily tokens often dominated by DeepSeek/Tencent/Xiaomi/MiniMax, not Claude — Anthropic wins quality/agent boards more than cheap routed volume. Concentration risk: Arena + Claude Code move together if either cools.",
    "Heat 96: highest US heat. Drivers — continuous Arena occupancy, Claude Code discourse dominance, every peer forced to answer coding-agent releases. Not driven by OpenRouter share. Net: sets US tempo on preference + agents; does not set global token-price tempo."
  ]$json$::jsonb,
  96, 96, 10
),
(
  'openai', 'OpenAI', 'us', 'openai.com', 'San Francisco', false,
  'Still the default frontier brand. Codex community heat is real; model preference is contested, but distribution and brand remain unmatched.',
  $json$[
    "Signals: ChatGPT still default consumer/dev surface; Microsoft/Azure distribution intact. Coding — Codex ~440K weekly visitors (#2 on desk board, ~half Claude Code). Arena text — no longer monopoly; Anthropic leads, Gemini/Meta pressing. OpenRouter — not the volume story (DeepSeek/HY3/MiMo/M3 dominate). Weights: closed.",
    "Positioning 84: brand + ChatGPT install + Codex product + partner distribution outweigh missing Arena #1 and missing OpenRouter #1 — still a clear tier below Anthropic’s double (preference + agent weekly visitors). Heat 82: Codex keeps coding narrative hot; preference discourse no longer auto-centers OpenAI on every release.",
    "Cross-pressure: reclaim coding mindshare from Claude Code and SpaceX/Cursor; defend default-frontier status while Chinese labs own cheap tokens. Score logic: #2 US franchise; gap to #1 is structural (Arena ridge + ~2× coding weekly visitors), not a tweak."
  ]$json$::jsonb,
  84, 82, 20
),
(
  'spacex', 'SpaceX', 'us', 'spacex.com', 'Hawthorne', false,
  'Cursor is the SpaceX AI coding bet after the Anysphere deal — IDE distribution plus Colossus compute, aimed straight at Claude Code and Codex.',
  $json$[
    "Signals: Corporate — xAI merge + Anysphere/Cursor ~$60B all-stock path; Cursor → SpaceX AI coding wedge. Coding weekly visitors — Cursor ~104K (#3 desk board), behind Claude Code 890K / Codex 440K, ahead of Copilot 92K. Compute narrative — Colossus / owned training capacity. Arena/OpenRouter — SpaceX not a token or Elo leader under its own model names yet. Weights: closed.",
    "Positioning 71: IDE distribution to pro engineers + public-company capital + owned supercompute + Grok-adjacent surface — rare vertical, still below OpenAI’s installed franchise and well below Anthropic’s preference+agent stack. Execution risk: mega-acquisition can blunt product taste.",
    "Heat 83: deal + Cursor culture + Composer/Grok Build shipping talk. Heat > Cursor’s weekly-visitor share because narrative amp is corporate, not just subreddit size. Competitive targets explicit: Claude Code + Codex."
  ]$json$::jsonb,
  71, 83, 30
),
(
  'google', 'Google', 'us', 'google.com', 'Mountain View', false,
  'Gemini stays in the Arena top tier with massive vote volume. Product surface is everywhere; research velocity is the question, not reach.',
  $json$[
    "Signals: Arena — Gemini 3.x-class models recur in top-10 with very large vote counts (often larger sample than flashy new entries). Distribution — Search, Android, Workspace, Cloud. Coding-agent weekly visitors board — no Google-native row in the desk’s six-tool set. OpenRouter — not a Google volume story vs DeepSeek/Tencent. Weights: primary Gemini closed (Gemma does not flip the dot).",
    "Positioning 56: distribution + Arena presence + cloud is a real floor, not a frontier-war lead. Missing coding-agent seat and OpenRouter volume keep Google a full tier under OpenAI/SpaceX. Heat 74: durable, low-drama — infra/product updates > culture-war launch cycles.",
    "Score logic: Google can lose “most exciting lab” and still hold mid-50s positioning. Does not need OpenRouter #1; needs Gemini preference sticky and an agent product that shows up on the weekly-visitor board before it can re-enter the 70s."
  ]$json$::jsonb,
  56, 74, 40
),
(
  'microsoft', 'Microsoft', 'us', 'microsoft.com', 'Redmond', false,
  'Copilot is embedded in work software most people already pay for. Heat is quieter than startups; positioning is distribution.',
  $json$[
    "Signals: Distribution — Copilot in M365, Windows, GitHub, Azure. Coding weekly visitors — GitHub Copilot ~92K (#4), behind Claude Code / Codex / Cursor. Arena — not Microsoft-branded Elo leadership. OpenRouter — not MS volume story. Weights: primary closed (Phi secondary; dot stays red). Partnership — OpenAI still core to many Copilot paths.",
    "Positioning 38: procurement + seat licenses + Azure is real money, not frontier leadership. ~60 pts behind Anthropic — not “a few product tweaks.” Heat 52: lowest US heat — weak timeline presence; Copilot weekly visitors real but not discourse-leading.",
    "Score logic: mid-low positioning / low heat on purpose. Microsoft monetizes “already installed” while builders’ attention, Arena, and agent weekly visitors live elsewhere. Climbing into the 70s needs preference or agent possession, not another Copilot surface."
  ]$json$::jsonb,
  38, 52, 50
),
(
  'meta', 'Meta', 'us', 'meta.com', 'Menlo Park', false,
  'Muse Spark climbing preference tables; Llama remains the open-weight line, but the frontier push is closed. Less API-share theater, more ecosystem influence.',
  $json$[
    "Signals: Arena — Muse Spark / Muse Spark 1.1 in top preference band (Meta vendor, closed/proprietary primary). Llama — separate open-weight track (ecosystem fine-tunes/hosts); does not make primary frontier open. OpenRouter — Meta rarely owns daily token podium vs DeepSeek/HY3/MiMo. Coding weekly visitors board — no Meta agent row. Dot: closed (Muse Spark primary).",
    "Positioning 28: research + social distribution + Llama ecosystem gravity, but weakest US seat on this board — no coding-agent weekly visitors, weak OpenRouter, frontier monetization secondary to ads. Heat 64: spikes on Muse Spark / Llama drops, then cedes timeline to Claude Code, Codex, Cursor, DeepSeek.",
    "Score logic: open Llama ≠ open primary. Preference signal is Muse Spark (closed). Ecosystem influence ≠ board positioning; Meta can move charts on release week and still sit near the floor until agents or API share show up."
  ]$json$::jsonb,
  28, 64, 60
),
(
  'deepseek', 'DeepSeek', 'international', 'deepseek.com', 'Hangzhou', true,
  'The OpenRouter volume story. Flash and Pro variants have owned daily token share for weeks — usage leadership outside US labs.',
  $json$[
    "Signals: OpenRouter rankings-daily (~90d window) — DeepSeek Flash/Pro lines repeatedly #1 or top-tier on daily tokens; multi-week #1 occupancy in desk samples. Open weight: yes (primary). Arena — present but not the main DeepSeek story vs volume. Coding weekly visitors board — no DeepSeek-native IDE row. US labs win preference/agents; DeepSeek wins routed usage.",
    "Positioning 92: cost/speed leadership + open weights + global builder default for cheap intelligence. Soft spots: Western enterprise trust, consumer brand, regulatory comfort vs Anthropic/OpenAI. Clear international #1 — not a photo-finish with Tencent.",
    "Heat 95: max international heat. OpenRouter moves on ship days; price/speed pressure hits everyone. #1 international on positioning+heat because “tokens actually called” is the clearest non-US primary metric on this page."
  ]$json$::jsonb,
  92, 95, 10
),
(
  'tencent', 'Tencent', 'international', 'tencent.com', 'Shenzhen', true,
  'HY3 spikes keep showing up in routed traffic. A platform company that can turn model capacity into consumer distribution overnight.',
  $json$[
    "Signals: OpenRouter — HY3 / HY3-preview / free variants recur in top daily token ranks; multi-day #1 streaks in desk window alongside DeepSeek. Open weight: yes. Distribution — WeChat, games, cloud, ads (domestic). Arena — not the HY3 headline vs volume. Coding weekly visitors — no Tencent row on desk six-tool board.",
    "Positioning 73: platform install base + ability to manufacture usage via pricing/free tiers + cloud. ~20 pts behind DeepSeek — strong #2, not co-leader. Western brand thinner than domestic machine.",
    "Heat 81: bursty — high when HY3 owns/co-owns OpenRouter podium, quieter in English discourse between spikes. Score pair = heavyweight volume + distribution, not continuous Arena/agent possession."
  ]$json$::jsonb,
  73, 81, 20
),
(
  'minimax', 'MiniMax', 'international', 'minimaxi.com', 'Shanghai', true,
  'M3 stays in the global token mix. Competitive on cost and throughput; still building a Western brand story.',
  $json$[
    "Signals: OpenRouter — M3 repeatedly upper-rank / podium-adjacent across days (consistency > single viral peak). Open weight: yes. Arena/coding weekly visitors — secondary. Consumer myth in West — weak vs ChatGPT/Claude/DeepSeek name recognition.",
    "Positioning 52: API utility + cost/throughput for agent stacks; incomplete Western brand. Mid-pack international — well below Tencent’s platform seat, above Xiaomi’s still-forming model identity. Heat 71: token-chart persistence compounds builder mindshare.",
    "Score logic: keep volume → climb; need sharper product narrative for positioning to catch heat. Currently heat-led international mid-tier."
  ]$json$::jsonb,
  52, 71, 30
),
(
  'xiaomi', 'Xiaomi', 'international', 'mi.com', 'Beijing', true,
  'MiMo has punched above expectations on OpenRouter. Hardware + software stack gives it a lane most pure labs do not have.',
  $json$[
    "Signals: OpenRouter — MiMo variants in top token tier over desk window (including multi-day leadership samples). Open weight: yes. Hardware — phones/IoT channel for eventual edge. Arena/coding weekly visitors — not Xiaomi’s primary board signals here.",
    "Positioning 44: usage receipt real; Western AI brand still forming; OpenRouter ≠ full frontier franchise. Hardware loop is upside not yet fully scored. Tier below MiniMax consistency.",
    "Heat 70: > positioning — “Xiaomi on the token podium” is a high-surprise signal. Sustain vs one-off spike is the watch item for both meters."
  ]$json$::jsonb,
  44, 70, 40
),
(
  'moonshot', 'Moonshot', 'international', 'moonshot.cn', 'Beijing', true,
  'Kimi keeps a seat in Arena and OpenRouter tops. Long-context reputation; heat comes in waves with each release.',
  $json$[
    "Signals: Product ID — Kimi / long-context (named). Arena — intermittent top-band presence. OpenRouter — seats, rarely multi-week #1 like DeepSeek. Open weight: yes. Coding weekly visitors — none on desk board.",
    "Positioning 33: real-lab tier via Arena + API presence + brand clarity, but far from volume kings. Heat 63: release-wave pattern — spikes then settles. Long-context moat eroded (table stakes in 2026).",
    "Watch: durable usage wedge or coding/agent beachhead required to climb. Intact franchise, not agenda-setter — multi-decade gap in score terms to DeepSeek/Tencent."
  ]$json$::jsonb,
  33, 63, 50
),
(
  'zai', 'Z.ai', 'international', 'zhipuai.cn', 'Beijing', true,
  'GLM family is a consistent presence in routed volume. Strong domestic footprint; international recognition still catching up.',
  $json$[
    "Signals: OpenRouter — GLM family recurring in broader top ranks (steady calls, not usually the #1 plot). Open weight: yes. Brand string — Zhipu / GLM / Z.ai fragmented internationally. Domestic China base — strong. Arena leadership / coding weekly visitors — not primary.",
    "Positioning 22: lowest international set — consistency without owning preference, tokens, or agents narratives. Heat 61: API-visible, not agenda-setting.",
    "Score logic: respected utility lab. Breakout multimodal/agent release that travels could jump both meters; until then, correctly floor-tier on this board’s positioning scale."
  ]$json$::jsonb,
  22, 61, 60
);

-- Explicit baseline date (trigger also wrote current_date; keep a stable chart origin).
insert into public.ai_wars_positioning_history (company_id, measured_on, positioning)
select id, date '2026-07-26', positioning
from public.ai_wars_companies
on conflict (company_id, measured_on) do update
  set positioning = excluded.positioning;

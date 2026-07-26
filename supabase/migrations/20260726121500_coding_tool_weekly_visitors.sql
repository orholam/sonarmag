-- Reddit coding-agent metric is weekly visitors, not DAU.

alter table public.coding_tool_dau rename to coding_tool_reddit;

alter table public.coding_tool_reddit
  rename column dau to weekly_visitors;

alter index if exists coding_tool_dau_measured_on_idx
  rename to coding_tool_reddit_measured_on_idx;

alter index if exists coding_tool_dau_tool_measured_idx
  rename to coding_tool_reddit_tool_measured_idx;

comment on table public.coding_tool_reddit is
  'Coding-agent community heat: subreddit weekly visitor snapshots for AI Wars.';

comment on column public.coding_tool_reddit.weekly_visitors is
  'Reddit weekly visitors for the tool subreddit (not DAU).';

-- Fix desk copy that said DAU.
update public.ai_wars_companies
set analysis = replace(analysis::text, 'subreddit DAU', 'subreddit weekly visitors')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'six-tool DAU pool', 'six-tool weekly-visitor pool')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'coding-agent DAU', 'coding-agent weekly visitors')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'Coding DAU', 'Coding weekly visitors')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'coding DAU', 'coding weekly visitors')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'agent DAU', 'agent weekly visitors')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'DAU share', 'weekly-visitor share')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'DAU board', 'weekly-visitor board')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, '~440K DAU', '~440K weekly visitors')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'Copilot DAU', 'Copilot weekly visitors')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'coding DAU', 'coding weekly visitors')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, '× coding DAU', '× coding weekly visitors')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, '2× coding DAU', '2× coding weekly visitors')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'Arena/coding DAU', 'Arena/coding weekly visitors')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, '/ coding DAU', '/ coding weekly visitors')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'Coding DAU —', 'Coding weekly visitors —')::jsonb;

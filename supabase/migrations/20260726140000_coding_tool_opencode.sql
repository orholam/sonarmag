-- Add OpenCode to the coding-agent weekly-visitor board.

insert into public.coding_tool_reddit (
  tool_id,
  name,
  subreddit,
  weekly_visitors,
  measured_on,
  note
)
values (
  'opencode',
  'OpenCode',
  'opencode',
  48000,
  '2026-07-01',
  'July 2026 baseline'
)
on conflict (tool_id, measured_on) do update
set
  name = excluded.name,
  subreddit = excluded.subreddit,
  weekly_visitors = excluded.weekly_visitors,
  note = excluded.note;

-- Desk copy still said six-tool after OpenCode was added.
update public.ai_wars_companies
set analysis = replace(analysis::text, 'six-tool weekly-visitor pool', 'seven-tool weekly-visitor pool')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'six-tool set', 'seven-tool set')::jsonb;

update public.ai_wars_companies
set analysis = replace(analysis::text, 'desk six-tool board', 'desk seven-tool board')::jsonb;

update public.ai_wars_companies
set analysis = replace(
  analysis::text,
  'Claude Code ~890K subreddit weekly visitors, ~58% of the desk’s seven-tool weekly-visitor pool (Codex ~440K, Cursor ~104K, Copilot ~92K)',
  'Claude Code ~890K subreddit weekly visitors, ~56% of the desk’s seven-tool weekly-visitor pool (Codex ~440K, Cursor ~104K, Copilot ~92K, OpenCode ~48K)'
)::jsonb;

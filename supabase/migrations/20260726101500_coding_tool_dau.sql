-- Coding-agent community heat: subreddit daily-active-user snapshots for AI Wars.
-- Manual inserts over time; public read for the /ai-wars page.

create table public.coding_tool_dau (
  id bigint generated always as identity primary key,
  tool_id text not null,
  name text not null,
  subreddit text not null,
  dau integer not null check (dau >= 0),
  measured_on date not null,
  note text,
  created_at timestamptz not null default now(),
  unique (tool_id, measured_on)
);

create index coding_tool_dau_measured_on_idx
  on public.coding_tool_dau (measured_on desc);

create index coding_tool_dau_tool_measured_idx
  on public.coding_tool_dau (tool_id, measured_on desc);

alter table public.coding_tool_dau enable row level security;

create policy "Public read coding tool dau"
  on public.coding_tool_dau for select
  to anon, authenticated
  using (true);

-- July 2026 baseline (DAU as community-heat proxy).
insert into public.coding_tool_dau (tool_id, name, subreddit, dau, measured_on, note)
values
  ('claude-code', 'Claude Code', 'ClaudeAI', 890000, '2026-07-01', 'July 2026 baseline'),
  ('codex', 'Codex', 'CodexAI', 440000, '2026-07-01', 'July 2026 baseline'),
  ('cursor', 'Cursor', 'cursor', 104000, '2026-07-01', 'July 2026 baseline'),
  ('github-copilot', 'GitHub Copilot', 'GithubCopilot', 92000, '2026-07-01', 'July 2026 baseline'),
  ('windsurf', 'Windsurf', 'Windsurf', 9700, '2026-07-01', 'July 2026 baseline'),
  ('cline', 'Cline', 'cline', 8000, '2026-07-01', 'July 2026 baseline');

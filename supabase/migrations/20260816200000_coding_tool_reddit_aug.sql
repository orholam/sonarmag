-- Three weekly Reddit visitor snapshots (Aug 2 / 9 / 16, 2026).

insert into public.coding_tool_reddit (
  tool_id,
  name,
  subreddit,
  weekly_visitors,
  measured_on,
  note
)
values
  -- 2026-08-02
  ('claude-code', 'Claude Code', 'ClaudeAI', 895000, '2026-08-02', 'Weekly visitors snapshot'),
  ('codex', 'Codex', 'CodexAI', 438000, '2026-08-02', 'Weekly visitors snapshot'),
  ('cursor', 'Cursor', 'cursor', 102000, '2026-08-02', 'Weekly visitors snapshot'),
  ('github-copilot', 'GitHub Copilot', 'GithubCopilot', 92000, '2026-08-02', 'Weekly visitors snapshot'),
  ('opencode', 'OpenCode', 'opencode', 49000, '2026-08-02', 'Weekly visitors snapshot'),
  ('windsurf', 'Windsurf', 'Windsurf', 9700, '2026-08-02', 'Weekly visitors snapshot'),
  ('cline', 'Cline', 'cline', 8100, '2026-08-02', 'Weekly visitors snapshot'),
  -- 2026-08-09
  ('claude-code', 'Claude Code', 'ClaudeAI', 815000, '2026-08-09', 'Weekly visitors snapshot'),
  ('codex', 'Codex', 'CodexAI', 416000, '2026-08-09', 'Weekly visitors snapshot'),
  ('cursor', 'Cursor', 'cursor', 90000, '2026-08-09', 'Weekly visitors snapshot'),
  ('github-copilot', 'GitHub Copilot', 'GithubCopilot', 78000, '2026-08-09', 'Weekly visitors snapshot'),
  ('opencode', 'OpenCode', 'opencode', 60000, '2026-08-09', 'Weekly visitors snapshot'),
  ('windsurf', 'Windsurf', 'Windsurf', 7200, '2026-08-09', 'Weekly visitors snapshot'),
  ('cline', 'Cline', 'cline', 12000, '2026-08-09', 'Weekly visitors snapshot'),
  -- 2026-08-16
  ('claude-code', 'Claude Code', 'ClaudeAI', 795000, '2026-08-16', 'Weekly visitors snapshot'),
  ('codex', 'Codex', 'CodexAI', 385000, '2026-08-16', 'Weekly visitors snapshot'),
  ('cursor', 'Cursor', 'cursor', 92000, '2026-08-16', 'Weekly visitors snapshot'),
  ('github-copilot', 'GitHub Copilot', 'GithubCopilot', 74000, '2026-08-16', 'Weekly visitors snapshot'),
  ('opencode', 'OpenCode', 'opencode', 67000, '2026-08-16', 'Weekly visitors snapshot'),
  ('windsurf', 'Windsurf', 'Windsurf', 6600, '2026-08-16', 'Weekly visitors snapshot'),
  ('cline', 'Cline', 'cline', 12000, '2026-08-16', 'Weekly visitors snapshot')
on conflict (tool_id, measured_on) do update
set
  name = excluded.name,
  subreddit = excluded.subreddit,
  weekly_visitors = excluded.weekly_visitors,
  note = excluded.note;

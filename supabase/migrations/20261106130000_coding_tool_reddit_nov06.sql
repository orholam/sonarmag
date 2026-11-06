-- Weekly Reddit visitor snapshot, 2026-11-06.
-- Bare figures are thousands. claudeduet was reported as 325 (hundred), stored as 325.
insert into public.coding_tool_reddit (
  tool_id, name, subreddit, weekly_visitors, measured_on, note
)
values
  ('claude-code', 'Claude Code', 'ClaudeAI', 1200000, '2026-11-06', 'Weekly visitors snapshot'),
  ('codex', 'Codex', 'CodexAI', 398000, '2026-11-06', 'Weekly visitors snapshot'),
  ('antigravity', 'Antigravity', 'google_antigravity', 149000, '2026-11-06', 'Weekly visitors snapshot'),
  ('opencode', 'OpenCode', 'opencode', 164000, '2026-11-06', 'Weekly visitors snapshot'),
  ('hermes-agent', 'Hermes Agent', 'hermesagent', 139000, '2026-11-06', 'Weekly visitors snapshot'),
  ('opencode-cli', 'OpenCode CLI', 'opencodeCLI', 82000, '2026-11-06', 'Weekly visitors snapshot'),
  ('grokbot', 'Grok Bot', 'GrokBot', 81000, '2026-11-06', 'Weekly visitors snapshot'),
  ('cursor', 'Cursor', 'cursor', 72000, '2026-11-06', 'Weekly visitors snapshot'),
  ('openai-codex', 'OpenAI Codex', 'OpenAICodex', 65000, '2026-11-06', 'Weekly visitors snapshot'),
  ('muse-agent', 'Muse Agent', 'MuseAgent', 53000, '2026-11-06', 'Weekly visitors snapshot'),
  ('github-copilot', 'GitHub Copilot', 'GithubCopilot', 52000, '2026-11-06', 'Weekly visitors snapshot'),
  ('antigravity-google', 'Antigravity Google', 'antigravitygoogle', 29000, '2026-11-06', 'Weekly visitors snapshot'),
  ('cline', 'Cline', 'cline', 6200, '2026-11-06', 'Weekly visitors snapshot'),
  ('windsurf', 'Windsurf', 'Windsurf', 4300, '2026-11-06', 'Weekly visitors snapshot'),
  ('devin', 'Devin', 'devinai', 1400, '2026-11-06', 'Weekly visitors snapshot'),
  ('claude-duet', 'Claude Duet', 'claudeduet', 325, '2026-11-06', 'Weekly visitors snapshot. Reported as 325 (hundred), stored as 325.')
on conflict (tool_id, measured_on) do update
set
  name = excluded.name,
  subreddit = excluded.subreddit,
  weekly_visitors = excluded.weekly_visitors,
  note = excluded.note;

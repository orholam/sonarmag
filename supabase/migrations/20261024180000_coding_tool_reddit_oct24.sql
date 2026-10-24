-- Weekly Reddit visitor snapshot, 2026-10-24.
-- Antigravity's primary subreddit is now r/google_antigravity (same tool_id).
-- Newly tracked: r/antigravitygoogle, r/hermesagent, r/devinai.

insert into public.coding_tool_reddit (
  tool_id, name, subreddit, weekly_visitors, measured_on, note
)
values
  ('claude-code', 'Claude Code', 'ClaudeAI', 993000, '2026-10-24', 'Weekly visitors snapshot'),
  ('codex', 'Codex', 'CodexAI', 486000, '2026-10-24', 'Weekly visitors snapshot'),
  ('antigravity', 'Antigravity', 'google_antigravity', 152000, '2026-10-24', 'Subreddit is now r/google_antigravity; weekly visitors snapshot'),
  ('hermes-agent', 'Hermes Agent', 'hermesagent', 141000, '2026-10-24', 'Newly tracked subreddit; weekly visitors snapshot'),
  ('opencode', 'OpenCode', 'opencode', 139000, '2026-10-24', 'Weekly visitors snapshot'),
  ('opencode-cli', 'OpenCode CLI', 'opencodeCLI', 90000, '2026-10-24', 'Weekly visitors snapshot'),
  ('cursor', 'Cursor', 'cursor', 75000, '2026-10-24', 'Weekly visitors snapshot'),
  ('openai-codex', 'OpenAI Codex', 'OpenAICodex', 74000, '2026-10-24', 'Weekly visitors snapshot'),
  ('github-copilot', 'GitHub Copilot', 'GithubCopilot', 62000, '2026-10-24', 'Weekly visitors snapshot'),
  ('grokbot', 'Grok Bot', 'GrokBot', 37000, '2026-10-24', 'Weekly visitors snapshot'),
  ('muse-agent', 'Muse Agent', 'MuseAgent', 35000, '2026-10-24', 'Weekly visitors snapshot'),
  ('antigravity-google', 'Antigravity Google', 'antigravitygoogle', 26000, '2026-10-24', 'Newly tracked subreddit; weekly visitors snapshot'),
  ('cline', 'Cline', 'cline', 7400, '2026-10-24', 'Weekly visitors snapshot'),
  ('windsurf', 'Windsurf', 'Windsurf', 4200, '2026-10-24', 'Weekly visitors snapshot'),
  ('devin', 'Devin', 'devinai', 1300, '2026-10-24', 'Newly tracked subreddit; weekly visitors snapshot')
on conflict (tool_id, measured_on) do update
set
  name = excluded.name,
  subreddit = excluded.subreddit,
  weekly_visitors = excluded.weekly_visitors,
  note = excluded.note;

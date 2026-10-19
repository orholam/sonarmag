-- Weekly Reddit visitor snapshots:
-- 2026-10-18 measured; 2026-10-11 interpolated midpoint of 2026-10-09 and 2026-10-18
-- (missed Sunday). OpenAI Codex and Muse Agent start on 2026-10-18 (no prior).

insert into public.coding_tool_reddit (
  tool_id, name, subreddit, weekly_visitors, measured_on, note
)
values
  ('claude-code', 'Claude Code', 'ClaudeAI', 886000, '2026-10-11', 'Interpolated midpoint of 2026-10-09 and 2026-10-18 (missed weekend)'),
  ('codex', 'Codex', 'CodexAI', 580000, '2026-10-11', 'Interpolated midpoint of 2026-10-09 and 2026-10-18 (missed weekend)'),
  ('opencode', 'OpenCode', 'opencode', 120000, '2026-10-11', 'Interpolated midpoint of 2026-10-09 and 2026-10-18 (missed weekend)'),
  ('antigravity', 'Antigravity', 'antigravity', 130500, '2026-10-11', 'Interpolated midpoint of 2026-10-09 and 2026-10-18 (missed weekend)'),
  ('opencode-cli', 'OpenCode CLI', 'opencodeCLI', 96500, '2026-10-11', 'Interpolated midpoint of 2026-10-09 and 2026-10-18 (missed weekend)'),
  ('cursor', 'Cursor', 'cursor', 91500, '2026-10-11', 'Interpolated midpoint of 2026-10-09 and 2026-10-18 (missed weekend)'),
  ('github-copilot', 'GitHub Copilot', 'GithubCopilot', 67000, '2026-10-11', 'Interpolated midpoint of 2026-10-09 and 2026-10-18 (missed weekend)'),
  ('grokbot', 'Grok Bot', 'GrokBot', 23500, '2026-10-11', 'Interpolated midpoint of 2026-10-09 and 2026-10-18 (missed weekend)'),
  ('cline', 'Cline', 'cline', 7900, '2026-10-11', 'Interpolated midpoint of 2026-10-09 and 2026-10-18 (missed weekend)'),
  ('windsurf', 'Windsurf', 'Windsurf', 4900, '2026-10-11', 'Interpolated midpoint of 2026-10-09 and 2026-10-18 (missed weekend)'),
  ('claude-code', 'Claude Code', 'ClaudeAI', 932000, '2026-10-18', 'Weekly visitors snapshot'),
  ('codex', 'Codex', 'CodexAI', 543000, '2026-10-18', 'Weekly visitors snapshot'),
  ('antigravity', 'Antigravity', 'antigravity', 145000, '2026-10-18', 'Weekly visitors snapshot'),
  ('opencode', 'OpenCode', 'opencode', 124000, '2026-10-18', 'Weekly visitors snapshot'),
  ('opencode-cli', 'OpenCode CLI', 'opencodeCLI', 94000, '2026-10-18', 'Weekly visitors snapshot'),
  ('openai-codex', 'OpenAI Codex', 'OpenAICodex', 90000, '2026-10-18', 'Newly tracked subreddit; weekly visitors snapshot'),
  ('cursor', 'Cursor', 'cursor', 90000, '2026-10-18', 'Weekly visitors snapshot'),
  ('github-copilot', 'GitHub Copilot', 'GithubCopilot', 65000, '2026-10-18', 'Weekly visitors snapshot'),
  ('grokbot', 'Grok Bot', 'GrokBot', 29000, '2026-10-18', 'Weekly visitors snapshot'),
  ('muse-agent', 'Muse Agent', 'MuseAgent', 28000, '2026-10-18', 'Newly tracked subreddit; weekly visitors snapshot'),
  ('cline', 'Cline', 'cline', 7800, '2026-10-18', 'Weekly visitors snapshot'),
  ('windsurf', 'Windsurf', 'Windsurf', 4500, '2026-10-18', 'Weekly visitors snapshot')
on conflict (tool_id, measured_on) do update
set
  name = excluded.name,
  subreddit = excluded.subreddit,
  weekly_visitors = excluded.weekly_visitors,
  note = excluded.note;

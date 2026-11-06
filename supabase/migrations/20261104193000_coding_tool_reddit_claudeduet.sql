-- First reading for r/claudeduet: 400 weekly visitors, reported 2026-11-04.
-- Stored on the latest complete snapshot (2026-10-30) so the board
-- does not collapse to a single partial date.

insert into public.coding_tool_reddit (
  tool_id, name, subreddit, weekly_visitors, measured_on, note
)
values
  (
    'claude-duet',
    'Claude Duet',
    'claudeduet',
    400,
    '2026-10-30',
    'First reading, reported 2026-11-04 (0.4k). Recorded on the latest complete snapshot.'
  )
on conflict (tool_id, measured_on) do update
set
  name = excluded.name,
  subreddit = excluded.subreddit,
  weekly_visitors = excluded.weekly_visitors,
  note = excluded.note;

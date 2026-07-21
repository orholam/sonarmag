-- Cached AI Race leaderboards (Arena Elo + OpenRouter usage).
-- Homepage reads these; remote APIs refresh at most ~once/day via upsert RPC.

create table public.ai_race_boards (
  id text primary key check (id in ('arena', 'openrouter')),
  title text not null,
  subtitle text not null,
  source_url text not null,
  as_of text,
  entries jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_race_boards enable row level security;

create policy "Public read ai race boards"
  on public.ai_race_boards for select
  to anon, authenticated
  using (true);

-- Upsert only when missing or older than 18h (anon-callable; low-stakes public stats).
create or replace function public.upsert_ai_race_board(
  p_id text,
  p_title text,
  p_subtitle text,
  p_source_url text,
  p_as_of text,
  p_entries jsonb,
  p_max_age interval default interval '18 hours'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  fresh boolean;
begin
  if p_id is null or p_id not in ('arena', 'openrouter') then
    raise exception 'invalid ai race board id';
  end if;

  if jsonb_typeof(p_entries) is distinct from 'array' then
    raise exception 'entries must be a json array';
  end if;

  if jsonb_array_length(p_entries) > 20 then
    raise exception 'entries too long';
  end if;

  select exists (
    select 1
    from public.ai_race_boards b
    where b.id = p_id
      and b.fetched_at > now() - p_max_age
  ) into fresh;

  if fresh then
    return false;
  end if;

  insert into public.ai_race_boards as b (
    id, title, subtitle, source_url, as_of, entries, fetched_at, updated_at
  ) values (
    p_id, p_title, p_subtitle, p_source_url, p_as_of, p_entries, now(), now()
  )
  on conflict (id) do update set
    title = excluded.title,
    subtitle = excluded.subtitle,
    source_url = excluded.source_url,
    as_of = excluded.as_of,
    entries = excluded.entries,
    fetched_at = now(),
    updated_at = now()
  where b.fetched_at <= now() - p_max_age;

  return true;
end;
$$;

revoke all on function public.upsert_ai_race_board(text, text, text, text, text, jsonb, interval) from public;
grant execute on function public.upsert_ai_race_board(text, text, text, text, text, jsonb, interval) to anon, authenticated;

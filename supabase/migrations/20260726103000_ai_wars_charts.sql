-- Cached multi-series charts for /ai-wars (OpenRouter history, Arena Elo trends, etc.)

create table public.ai_wars_charts (
  id text primary key,
  title text not null,
  subtitle text not null,
  source_url text not null,
  as_of text,
  payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_wars_charts enable row level security;

create policy "Public read ai wars charts"
  on public.ai_wars_charts for select
  to anon, authenticated
  using (true);

create or replace function public.upsert_ai_wars_chart(
  p_id text,
  p_title text,
  p_subtitle text,
  p_source_url text,
  p_as_of text,
  p_payload jsonb,
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
  if p_id is null or length(trim(p_id)) = 0 then
    raise exception 'invalid ai wars chart id';
  end if;

  if jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception 'payload must be a json object';
  end if;

  select exists (
    select 1
    from public.ai_wars_charts c
    where c.id = p_id
      and c.fetched_at > now() - p_max_age
  ) into fresh;

  if fresh then
    return false;
  end if;

  insert into public.ai_wars_charts as c (
    id, title, subtitle, source_url, as_of, payload, fetched_at, updated_at
  ) values (
    p_id, p_title, p_subtitle, p_source_url, p_as_of, p_payload, now(), now()
  )
  on conflict (id) do update set
    title = excluded.title,
    subtitle = excluded.subtitle,
    source_url = excluded.source_url,
    as_of = excluded.as_of,
    payload = excluded.payload,
    fetched_at = now(),
    updated_at = now()
  where c.fetched_at <= now() - p_max_age;

  return true;
end;
$$;

revoke all on function public.upsert_ai_wars_chart(text, text, text, text, text, jsonb, interval) from public;
grant execute on function public.upsert_ai_wars_chart(text, text, text, text, text, jsonb, interval) to anon, authenticated;

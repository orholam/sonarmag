-- Traffic-backed Popular rail: sync writes ranks from Vercel Web Analytics.
-- Mirrors ai_race_boards upsert pattern (age-gated security definer RPC).

create or replace function public.upsert_popular_ranking(
  p_entries jsonb,
  p_window text default '7d',
  p_max_age interval default interval '45 minutes'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  fresh boolean;
  entry jsonb;
  entry_slug text;
  entry_rank int;
  entry_count int;
begin
  if jsonb_typeof(p_entries) is distinct from 'array' then
    raise exception 'entries must be a json array';
  end if;

  entry_count := jsonb_array_length(p_entries);
  if entry_count < 1 or entry_count > 20 then
    raise exception 'entries length must be between 1 and 20';
  end if;

  if p_window is null or length(trim(p_window)) = 0 or length(p_window) > 16 then
    raise exception 'invalid window';
  end if;

  -- Reject unknown / draft slugs before mutating ranks.
  for entry in select value from jsonb_array_elements(p_entries)
  loop
    entry_slug := entry->>'slug';
    entry_rank := (entry->>'rank')::int;

    if entry_slug is null or entry_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
      raise exception 'invalid slug in popular ranking';
    end if;

    if entry_rank is null or entry_rank < 1 or entry_rank > 20 then
      raise exception 'invalid rank in popular ranking';
    end if;

    if not exists (
      select 1 from public.articles a
      where a.slug = entry_slug and a.status = 'published'
    ) then
      raise exception 'unknown or unpublished slug: %', entry_slug;
    end if;
  end loop;

  select exists (
    select 1
    from public.site_settings s
    where s.key = 'popular_ranking'
      and s.updated_at > now() - p_max_age
  ) into fresh;

  if fresh then
    return false;
  end if;

  update public.articles
  set popular_rank = null,
      updated_at = now()
  where popular_rank is not null;

  update public.articles a
  set
    popular_rank = (e.elem->>'rank')::int,
    updated_at = now()
  from jsonb_array_elements(p_entries) as e(elem)
  where a.slug = e.elem->>'slug'
    and a.status = 'published';

  insert into public.site_settings as s (key, value, updated_at)
  values (
    'popular_ranking',
    jsonb_build_object(
      'window', p_window,
      'entries', p_entries,
      'synced_at', now()
    ),
    now()
  )
  on conflict (key) do update set
    value = excluded.value,
    updated_at = now()
  where s.updated_at <= now() - p_max_age;

  return true;
end;
$$;

comment on function public.upsert_popular_ranking(jsonb, text, interval) is
  'Age-gated write of Popular rail ranks from analytics sync. Clears prior popular_rank values.';

revoke all on function public.upsert_popular_ranking(jsonb, text, interval) from public;
grant execute on function public.upsert_popular_ranking(jsonb, text, interval) to anon, authenticated;

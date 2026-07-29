-- Raise changelog upsert payload so a year of multi-lab posts fits.

create or replace function public.upsert_ai_wars_changelog_posts(
  p_posts jsonb,
  p_max_age interval default interval '12 hours'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  fresh boolean;
  r jsonb;
begin
  if jsonb_typeof(p_posts) is distinct from 'array' then
    raise exception 'posts must be a json array';
  end if;

  if jsonb_array_length(p_posts) > 2000 then
    raise exception 'posts too long';
  end if;

  select exists (
    select 1
    from public.ai_wars_changelog_meta m
    where m.id = 'all'
      and m.fetched_at > now() - p_max_age
  ) into fresh;

  if fresh then
    return false;
  end if;

  for r in select * from jsonb_array_elements(p_posts)
  loop
    insert into public.ai_wars_changelog_posts as t (
      id, company_id, company, title, url, published_at, source, fetched_at
    ) values (
      r->>'id',
      r->>'company_id',
      r->>'company',
      r->>'title',
      r->>'url',
      (r->>'published_at')::timestamptz,
      r->>'source',
      now()
    )
    on conflict (id) do update set
      company_id = excluded.company_id,
      company = excluded.company,
      title = excluded.title,
      url = excluded.url,
      published_at = excluded.published_at,
      source = excluded.source,
      fetched_at = now();
  end loop;

  insert into public.ai_wars_changelog_meta (id, fetched_at)
  values ('all', now())
  on conflict (id) do update set fetched_at = now();

  return true;
end;
$$;

revoke all on function public.upsert_ai_wars_changelog_posts(jsonb, interval) from public;
grant execute on function public.upsert_ai_wars_changelog_posts(jsonb, interval) to anon, authenticated;

-- App Store rank tape + changelog velocity for AI Wars.

create table if not exists public.ai_wars_app_store_ranks (
  measured_on date not null,
  app_key text not null,
  name text not null,
  company text not null,
  apple_id text not null,
  productivity_rank int,
  overall_rank int,
  url text,
  fetched_at timestamptz not null default now(),
  primary key (measured_on, app_key)
);

create index if not exists ai_wars_app_store_ranks_measured_idx
  on public.ai_wars_app_store_ranks (measured_on desc);

alter table public.ai_wars_app_store_ranks enable row level security;

drop policy if exists "Public read ai wars app store ranks" on public.ai_wars_app_store_ranks;
create policy "Public read ai wars app store ranks"
  on public.ai_wars_app_store_ranks for select
  to anon, authenticated
  using (true);

create table if not exists public.ai_wars_app_store_meta (
  id text primary key check (id = 'us'),
  fetched_at timestamptz not null default now()
);

alter table public.ai_wars_app_store_meta enable row level security;

drop policy if exists "Public read ai wars app store meta" on public.ai_wars_app_store_meta;
create policy "Public read ai wars app store meta"
  on public.ai_wars_app_store_meta for select
  to anon, authenticated
  using (true);

create or replace function public.upsert_ai_wars_app_store_snapshot(
  p_rows jsonb,
  p_max_age interval default interval '6 hours'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  fresh boolean;
  r jsonb;
  day date := (timezone('utc', now()))::date;
begin
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'rows must be a json array';
  end if;

  select exists (
    select 1
    from public.ai_wars_app_store_meta m
    where m.id = 'us'
      and m.fetched_at > now() - p_max_age
  ) into fresh;

  if fresh then
    return false;
  end if;

  for r in select * from jsonb_array_elements(p_rows)
  loop
    insert into public.ai_wars_app_store_ranks as t (
      measured_on, app_key, name, company, apple_id,
      productivity_rank, overall_rank, url, fetched_at
    ) values (
      day,
      r->>'app_key',
      r->>'name',
      r->>'company',
      r->>'apple_id',
      nullif(r->>'productivity_rank', '')::int,
      nullif(r->>'overall_rank', '')::int,
      r->>'url',
      now()
    )
    on conflict (measured_on, app_key) do update set
      name = excluded.name,
      company = excluded.company,
      apple_id = excluded.apple_id,
      productivity_rank = excluded.productivity_rank,
      overall_rank = excluded.overall_rank,
      url = excluded.url,
      fetched_at = now();
  end loop;

  insert into public.ai_wars_app_store_meta (id, fetched_at)
  values ('us', now())
  on conflict (id) do update set fetched_at = now();

  return true;
end;
$$;

revoke all on function public.upsert_ai_wars_app_store_snapshot(jsonb, interval) from public;
grant execute on function public.upsert_ai_wars_app_store_snapshot(jsonb, interval) to anon, authenticated;

create table if not exists public.ai_wars_changelog_posts (
  id text primary key,
  company_id text not null,
  company text not null,
  title text not null,
  url text not null,
  published_at timestamptz not null,
  source text not null,
  fetched_at timestamptz not null default now()
);

create unique index if not exists ai_wars_changelog_posts_url_uidx
  on public.ai_wars_changelog_posts (url);

create index if not exists ai_wars_changelog_posts_company_published_idx
  on public.ai_wars_changelog_posts (company_id, published_at desc);

alter table public.ai_wars_changelog_posts enable row level security;

drop policy if exists "Public read ai wars changelog posts" on public.ai_wars_changelog_posts;
create policy "Public read ai wars changelog posts"
  on public.ai_wars_changelog_posts for select
  to anon, authenticated
  using (true);

create table if not exists public.ai_wars_changelog_meta (
  id text primary key check (id = 'all'),
  fetched_at timestamptz not null default now()
);

alter table public.ai_wars_changelog_meta enable row level security;

drop policy if exists "Public read ai wars changelog meta" on public.ai_wars_changelog_meta;
create policy "Public read ai wars changelog meta"
  on public.ai_wars_changelog_meta for select
  to anon, authenticated
  using (true);

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

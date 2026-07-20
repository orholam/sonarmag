-- Authors
create table public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- Categories / sections
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Articles
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  highlight_word text,
  highlight_tone text check (highlight_tone is null or highlight_tone in ('red', 'tan')),
  author_id uuid not null references public.authors(id),
  category_id uuid references public.categories(id),
  published_at timestamptz not null default now(),
  published_label text,
  comments_count int not null default 0,
  listen_minutes int not null default 0,
  read_minutes int not null default 0,
  hero_image text,
  hero_alt text,
  thumb_image text,
  ticker text,
  excerpt text,
  badge text,
  paragraphs jsonb not null default '[]'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  featured_slot text check (featured_slot is null or featured_slot in ('hero', 'secondary', 'opinion')),
  popular_rank int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_published_at_idx on public.articles (published_at desc);
create index articles_status_idx on public.articles (status);
create index articles_popular_rank_idx on public.articles (popular_rank);

-- Static pages
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  eyebrow text,
  paragraphs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Podcast episodes
create table public.podcast_episodes (
  id uuid primary key default gen_random_uuid(),
  show_name text not null default 'Sonar Signal',
  episode_number int not null,
  title text not null,
  dek text,
  host text,
  image_url text,
  slug text unique,
  published_at timestamptz not null default now()
);

-- Market tickers on homepage
create table public.market_tickers (
  id uuid primary key default gen_random_uuid(),
  pair text not null,
  change_pct numeric not null,
  value text not null,
  is_up boolean not null default true,
  sort_order int not null default 0
);

-- Site settings (listen count, etc.)
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Newsletter signups
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.authors enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.pages enable row level security;
alter table public.podcast_episodes enable row level security;
alter table public.market_tickers enable row level security;
alter table public.site_settings enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy "Public read authors"
  on public.authors for select
  to anon, authenticated
  using (true);

create policy "Public read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "Public read published articles"
  on public.articles for select
  to anon, authenticated
  using (status = 'published');

create policy "Public read pages"
  on public.pages for select
  to anon, authenticated
  using (true);

create policy "Public read podcasts"
  on public.podcast_episodes for select
  to anon, authenticated
  using (true);

create policy "Public read markets"
  on public.market_tickers for select
  to anon, authenticated
  using (true);

create policy "Public read settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

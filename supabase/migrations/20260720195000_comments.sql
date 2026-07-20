-- Comments on articles
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint comments_author_name_len check (char_length(trim(author_name)) between 1 and 80),
  constraint comments_body_len check (char_length(trim(body)) between 1 and 2000)
);

create index if not exists comments_article_created_idx
  on public.comments (article_id, created_at desc);

alter table public.comments enable row level security;

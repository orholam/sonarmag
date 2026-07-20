-- Highlighted stories drive the large homepage splash card.
-- Secondary / opinion / dark card / latest fill automatically from recent published rows.

alter table public.articles
  add column if not exists is_highlighted boolean not null default false;

comment on column public.articles.is_highlighted is
  'When true, eligible for the main homepage splash hero. Newest highlighted published article wins.';

-- Backfill from legacy slot / flag.
update public.articles
set is_highlighted = true
where featured_slot = 'hero'
   or is_featured = true;

-- The story that landed in Latest without splash treatment.
update public.articles
set is_highlighted = true
where slug = 'heteropessimism-dating-recession';

create index if not exists articles_is_highlighted_published_idx
  on public.articles (is_highlighted, published_at desc)
  where status = 'published';

-- Cover FK joins used by homepage / article queries.
create index if not exists articles_author_id_idx on public.articles (author_id);
create index if not exists articles_category_id_idx on public.articles (category_id);

-- Keep displayed counts aligned with real letters.
update public.articles a
set comments_count = (
  select count(*)::int from public.comments c where c.article_id = a.id
);

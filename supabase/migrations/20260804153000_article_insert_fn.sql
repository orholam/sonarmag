-- One-time article batch insert function for the publish-articles admin API.
-- Uses SECURITY DEFINER so it can be called with the anon key when needed.
-- Protected by a caller-supplied secret checked in application code.

create or replace function public.insert_article_batch(
  p_articles jsonb,
  p_secret text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  a jsonb;
  result jsonb := '[]'::jsonb;
  inserted_row record;
  slug_val text;
begin
  -- Secret check as a belt-and-suspenders measure on top of the API layer.
  if p_secret is distinct from 'sonar-publish-20260804-once' then
    raise exception 'invalid secret';
  end if;

  if jsonb_typeof(p_articles) is distinct from 'array' then
    raise exception 'articles must be a jsonb array';
  end if;

  if jsonb_array_length(p_articles) > 10 then
    raise exception 'too many articles (max 10)';
  end if;

  for a in select value from jsonb_array_elements(p_articles) loop
    slug_val := a->>'slug';
    if slug_val is null then
      raise exception 'article missing slug';
    end if;

    -- Skip if already exists
    if exists (select 1 from public.articles where slug = slug_val) then
      result := result || jsonb_build_array(jsonb_build_object('slug', slug_val, 'status', 'exists'));
      continue;
    end if;

    insert into public.articles (
      slug, title, seo_title, excerpt, ticker,
      author_id, category_id,
      hero_image, hero_alt, thumb_image,
      read_minutes, listen_minutes,
      published_at, published_label,
      paragraphs, status, is_highlighted,
      highlight_word, highlight_tone
    )
    values (
      slug_val,
      a->>'title',
      a->>'seo_title',
      a->>'excerpt',
      a->>'ticker',
      (a->>'author_id')::uuid,
      (a->>'category_id')::uuid,
      a->>'hero_image',
      a->>'hero_alt',
      a->>'thumb_image',
      coalesce((a->>'read_minutes')::int, 5),
      coalesce((a->>'listen_minutes')::int, 7),
      now(),
      coalesce(a->>'published_label', 'Today'),
      coalesce(a->'paragraphs', '[]'::jsonb),
      coalesce(a->>'status', 'published'),
      coalesce((a->>'is_highlighted')::boolean, false),
      a->>'highlight_word',
      a->>'highlight_tone'
    )
    returning slug, is_highlighted, status, seo_title into inserted_row;

    result := result || jsonb_build_array(jsonb_build_object(
      'slug', inserted_row.slug,
      'is_highlighted', inserted_row.is_highlighted,
      'status', inserted_row.status,
      'seo_title', left(inserted_row.seo_title, 40),
      'inserted', true
    ));
  end loop;

  return result;
end;
$$;

comment on function public.insert_article_batch(jsonb, text) is
  'Batch article insert for automated publish workflow. Secret-protected.';

revoke all on function public.insert_article_batch(jsonb, text) from public;
grant execute on function public.insert_article_batch(jsonb, text) to anon, authenticated;

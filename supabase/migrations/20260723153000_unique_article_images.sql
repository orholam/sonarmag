-- Prevent the same source photo from illustrating multiple articles.
-- Same article may still use one URL for both hero_image and thumb_image.

create or replace function public.article_image_key(url text)
returns text
language plpgsql
immutable
as $$
declare
  path text;
  m text[];
begin
  if url is null or btrim(url) = '' then
    return null;
  end if;

  path := lower(split_part(split_part(btrim(url), '?', 1), '#', 1));

  -- images.unsplash.com/photo-{id}
  m := regexp_match(path, 'images\.unsplash\.com/(photo-[a-z0-9-]+)');
  if m is not null then
    return m[1];
  end if;

  -- unsplash.com/photos/{slug-id}
  m := regexp_match(path, 'unsplash\.com/photos/([a-z0-9_-]+)');
  if m is not null then
    return m[1];
  end if;

  -- Fallback: full path without query (covers non-Unsplash hosts)
  return path;
end;
$$;

comment on function public.article_image_key(text) is
  'Normalize an article image URL to a stable key (Unsplash photo id when possible).';

create or replace function public.enforce_unique_article_images()
returns trigger
language plpgsql
as $$
declare
  keys text[];
  conflict_slug text;
begin
  keys := array(
    select distinct k
    from unnest(array[
      public.article_image_key(new.hero_image),
      public.article_image_key(new.thumb_image)
    ]) as k
    where k is not null
  );

  if coalesce(array_length(keys, 1), 0) = 0 then
    return new;
  end if;

  select a.slug into conflict_slug
  from public.articles a
  where a.id is distinct from new.id
    and (
      public.article_image_key(a.hero_image) = any (keys)
      or public.article_image_key(a.thumb_image) = any (keys)
    )
  limit 1;

  if conflict_slug is not null then
    raise exception
      'article image already used by "%" — pick a different hero/thumb',
      conflict_slug
      using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists articles_unique_images on public.articles;

create trigger articles_unique_images
  before insert or update of hero_image, thumb_image
  on public.articles
  for each row
  execute function public.enforce_unique_article_images();

revoke all on function public.article_image_key(text) from public;
grant execute on function public.article_image_key(text) to anon, authenticated, service_role;

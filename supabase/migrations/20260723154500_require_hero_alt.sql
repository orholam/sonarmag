-- Require a concrete hero_alt whenever a hero_image is set.

alter table public.articles
  drop constraint if exists articles_hero_alt_required;

alter table public.articles
  add constraint articles_hero_alt_required
  check (
    coalesce(btrim(hero_image), '') = ''
    or coalesce(btrim(hero_alt), '') <> ''
  );

comment on constraint articles_hero_alt_required on public.articles is
  'Published art needs alt text: hero_image implies non-empty hero_alt.';

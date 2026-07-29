alter table public.articles
  add column seo_title text
  check (
    seo_title is null
    or char_length(btrim(seo_title)) between 1 and 120
  );

comment on column public.articles.seo_title is
  'Optional search/browser title. The visible article headline remains articles.title.';

create or replace function public.articles_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists articles_set_updated_at on public.articles;

create trigger articles_set_updated_at
before update on public.articles
for each row
execute function public.articles_touch_updated_at();

update public.articles
set seo_title = case slug
  when 'openai-turned-off-refusals-to-grade-the-threat'
    then 'OpenAI Disabled Safety Refusals to Benchmark Cyber Attacks'
  when 'chinese-models-took-most-openrouter-us-tokens'
    then 'Chinese Models Hit 58% of OpenRouter US Token Share'
  when 'delaware-liability-box-for-ai-bosses'
    then 'Delaware Proposes Liability Rules for AI-Run Companies'
  when 'silicon-valley-answered-falling-births-with-embryo-scores'
    then 'Pronatalism, Embryo Scores, and Silicon Valley''s Fertility Bet'
  when 'whos-really-winning-the-self-driving-race'
    then 'Waymo vs. Apollo Go in the Self-Driving Race'
end
where slug in (
  'openai-turned-off-refusals-to-grade-the-threat',
  'chinese-models-took-most-openrouter-us-tokens',
  'delaware-liability-box-for-ai-bosses',
  'silicon-valley-answered-falling-births-with-embryo-scores',
  'whos-really-winning-the-self-driving-race'
);

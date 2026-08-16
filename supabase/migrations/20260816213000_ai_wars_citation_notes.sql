-- Citations must say what the desk took from the source.

create or replace function public.set_ai_wars_company_scores(
  p_id text,
  p_positioning integer,
  p_heat integer,
  p_blurb text default null,
  p_analysis jsonb default null,
  p_open_weight boolean default null,
  p_measured_on date default current_date,
  p_week_move text default null,
  p_citations jsonb default null
)
returns public.ai_wars_companies
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.ai_wars_companies;
  cite jsonb;
  kind text;
begin
  if p_positioning < 0 or p_positioning > 100 then
    raise exception 'positioning must be 0–100';
  end if;
  if p_heat < 0 or p_heat > 100 then
    raise exception 'heat must be 0–100';
  end if;
  if p_analysis is not null
     and (
       jsonb_typeof(p_analysis) <> 'array'
       or jsonb_array_length(p_analysis) <> 3
     ) then
    raise exception 'analysis must be a jsonb array of exactly 3 strings';
  end if;

  if p_citations is not null then
    if jsonb_typeof(p_citations) <> 'array' then
      raise exception 'citations must be a jsonb array';
    end if;
    for cite in select * from jsonb_array_elements(p_citations)
    loop
      if jsonb_typeof(cite) <> 'object' then
        raise exception 'each citation must be an object';
      end if;
      if coalesce(cite->>'label', '') = ''
         or coalesce(cite->>'url', '') = ''
         or coalesce(cite->>'note', '') = '' then
        raise exception 'each citation needs label, url, and note';
      end if;
      kind := coalesce(cite->>'kind', '');
      if kind not in ('news', 'opinion', 'data', 'vendor') then
        raise exception 'citation kind must be news|opinion|data|vendor';
      end if;
    end loop;
  end if;

  update public.ai_wars_companies c
  set
    positioning = p_positioning,
    heat = p_heat,
    blurb = coalesce(p_blurb, c.blurb),
    analysis = coalesce(p_analysis, c.analysis),
    open_weight = coalesce(p_open_weight, c.open_weight),
    week_move = coalesce(p_week_move, c.week_move),
    citations = coalesce(p_citations, c.citations)
  where c.id = p_id
  returning * into row;

  if row.id is null then
    raise exception 'unknown company id: %', p_id;
  end if;

  insert into public.ai_wars_positioning_history (
    company_id,
    measured_on,
    positioning
  )
  values (p_id, p_measured_on, p_positioning)
  on conflict (company_id, measured_on) do update
    set positioning = excluded.positioning;

  return row;
end;
$$;

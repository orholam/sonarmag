-- Weekly desk must leave a positioning history point even when the score is held flat.
-- Previously the trigger skipped unchanged positioning, so leaders like Anthropic
-- dropped out of weeks where only heat/copy moved (Aug 2 and Aug 16, 2026).

insert into public.ai_wars_positioning_history (company_id, measured_on, positioning)
values
  ('anthropic', '2026-08-02', 96),
  ('anthropic', '2026-08-16', 97)
on conflict (company_id, measured_on) do update
  set positioning = excluded.positioning;

create or replace function public.ai_wars_snapshot_positioning()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    insert into public.ai_wars_positioning_history (
      company_id,
      measured_on,
      positioning
    )
    values (
      new.id,
      current_date,
      new.positioning
    )
    on conflict (company_id, measured_on) do update
      set positioning = excluded.positioning;
  end if;
  return new;
end;
$$;

create or replace function public.set_ai_wars_company_scores(
  p_id text,
  p_positioning integer,
  p_heat integer,
  p_blurb text default null,
  p_analysis jsonb default null,
  p_open_weight boolean default null,
  p_measured_on date default current_date
)
returns public.ai_wars_companies
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.ai_wars_companies;
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

  update public.ai_wars_companies c
  set
    positioning = p_positioning,
    heat = p_heat,
    blurb = coalesce(p_blurb, c.blurb),
    analysis = coalesce(p_analysis, c.analysis),
    open_weight = coalesce(p_open_weight, c.open_weight)
  where c.id = p_id
  returning * into row;

  if row.id is null then
    raise exception 'unknown company id: %', p_id;
  end if;

  -- Always upsert the desk-week point (even when positioning is unchanged).
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

revoke all on function public.set_ai_wars_company_scores(
  text, integer, integer, text, jsonb, boolean, date
) from public;
grant execute on function public.set_ai_wars_company_scores(
  text, integer, integer, text, jsonb, boolean, date
) to service_role;

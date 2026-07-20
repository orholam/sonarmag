-- Harden newsletter signups for the homepage collector.
alter table public.newsletter_subscribers
  add column if not exists source text not null default 'homepage';

alter table public.newsletter_subscribers
  drop constraint if exists newsletter_subscribers_email_format;

alter table public.newsletter_subscribers
  add constraint newsletter_subscribers_email_format
  check (
    char_length(trim(email)) >= 5
    and char_length(trim(email)) <= 254
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

comment on table public.newsletter_subscribers is
  'Email newsletter signups. Public insert-only via RLS; no public select.';

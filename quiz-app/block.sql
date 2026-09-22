-- ============================================================
-- Blocklist in the database  ·  run in the Supabase SQL Editor
-- Refuses any audience question (or name) containing a blocked
-- word, whatever page sent it. Keep the list in step with
-- BLOCKED_WORDS in config.js. Safe to re-run.
-- ============================================================

create or replace function fc_blocked(txt text)
returns boolean
language sql
immutable
as $$
  select txt ~* '\m(hitler|nazis?|fuck(ing)?|shit|cunt|retard(ed)?|fag(got)?|rape)\M';
$$;

create or replace function fc_refuse_blocked()
returns trigger
language plpgsql
as $$
begin
  if fc_blocked(new.text) or fc_blocked(coalesce(new.author, '')) then
    raise exception 'blocked' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists fc_refuse_blocked on audience_questions;
create trigger fc_refuse_blocked
  before insert or update of text, author on audience_questions
  for each row execute function fc_refuse_blocked();

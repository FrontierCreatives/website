-- ============================================================
-- Frontier Creatives · small groups  ·  run in the Supabase SQL Editor
-- Run this whole file once. Safe to re-run; it keeps existing data.
-- Then set the QR switch passphrase (see the first handy query at the
-- bottom). Until it is set, the switch refuses every change and the QR
-- code stays on the Q&A app.
-- One row per phone: its group, its one survey question and answer,
-- and its happiness tap. No names or emails. The pages only reach
-- this data through the functions below; the tables have no public
-- read or write.
-- ============================================================

create table if not exists breakout_settings (
  id          int primary key default 1,
  group_count int not null default 12 check (group_count > 0),
  scans       int not null default 0,
  constraint breakout_settings_singleton check (id = 1)
);

insert into breakout_settings (id) values (1) on conflict (id) do nothing;

-- The QR switch: where the printed code sends people ('qa' or 'groups'),
-- and the passphrase needed to change it. The passphrase lives only here,
-- never in the site's files; the table has no public read.
alter table breakout_settings add column if not exists qr_target text not null default 'qa'
  check (qr_target in ('qa', 'groups'));
alter table breakout_settings add column if not exists passphrase text;

create table if not exists breakout_phones (
  participant_id text primary key,
  scan_number    int not null,
  group_number   int not null,
  question       text,
  answer         text[],
  mood           int check (mood between 1 and 5),
  created_at     timestamptz not null default now()
);

alter table breakout_settings enable row level security;
alter table breakout_phones   enable row level security;

-- Gives a phone its group, in rotation, and its scan number (the page
-- uses it to rotate the survey question). The same phone always gets the
-- same answer back. The update locks the settings row, so two phones
-- scanning at the same moment still get consecutive numbers.
drop function if exists breakout_join(text);
create function breakout_join(pid text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  g int;
  n int;
  c int;
begin
  select group_number, scan_number into g, n from breakout_phones where participant_id = pid;
  if g is not null then
    return json_build_object('group', g, 'slot', n);
  end if;

  update breakout_settings set scans = scans + 1 where id = 1
  returning scans, group_count into n, c;

  g := ((n - 1) % c) + 1;

  insert into breakout_phones (participant_id, scan_number, group_number)
  values (pid, n, g)
  on conflict (participant_id) do nothing;

  select group_number, scan_number into g, n from breakout_phones where participant_id = pid;
  return json_build_object('group', g, 'slot', n);
end $$;

-- Saves the survey answers (q is the question's key, a the list picked) and/or the happiness tap.
drop function if exists breakout_answer(text, text, text, int);
drop function if exists breakout_answer(text, text, text[], int);
create function breakout_answer(pid text, q text default null, a text[] default null, happiness int default null)
returns void
language sql
security definer
set search_path = public
as $$
  update breakout_phones
     set question = coalesce(left(q, 40), question),
         answer   = coalesce((select array_agg(left(x, 80)) from unnest(a[1:6]) x), answer),
         mood     = coalesce(happiness, mood)
   where participant_id = pid;
$$;

-- Where the printed QR code sends people right now. Public: go.html reads it.
create or replace function qr_target()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select qr_target from breakout_settings where id = 1;
$$;

-- Flips the QR code. Returns false unless the passphrase matches.
create or replace function set_qr_target(pass text, target text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  select passphrase is not null and passphrase = pass into ok from breakout_settings where id = 1;
  if not coalesce(ok, false) then
    return false;
  end if;
  update breakout_settings set qr_target = target where id = 1;
  return true;
end $$;

-- Totals for the admin page. Counts only; never individual phones.
create or replace function breakout_summary()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'group_count', (select group_count from breakout_settings where id = 1),
    'qr_target', (select qr_target from breakout_settings where id = 1),
    'scans', (select count(*) from breakout_phones),
    'groups', coalesce((select json_agg(json_build_object('group', group_number, 'size', n) order by group_number)
                          from (select group_number, count(*) n from breakout_phones group by 1) g), '[]'::json),
    'survey', coalesce((select json_agg(json_build_object('question', question, 'answer', opt, 'n', n))
                          from (select question, opt, count(*) n from breakout_phones, unnest(answer) opt group by 1, 2) s), '[]'::json),
    'respondents', coalesce((select json_agg(json_build_object('question', question, 'n', n))
                          from (select question, count(*) n from breakout_phones where answer is not null group by 1) r), '[]'::json),
    'mood',   coalesce((select json_agg(json_build_object('mood', mood, 'n', n) order by mood)
                          from (select mood, count(*) n from breakout_phones where mood is not null group by 1) m), '[]'::json)
  );
$$;

grant execute on function breakout_join(text) to anon;
grant execute on function breakout_answer(text, text, text[], int) to anon;
grant execute on function breakout_summary() to anon;
grant execute on function qr_target() to anon;
grant execute on function set_qr_target(text, text) to anon;

-- ---- Handy queries (run one at a time, as needed) -----------
--
-- Set the QR switch passphrase (do this once; use a long phrase of a few
-- words, and share it privately, never in the repo):
--   update breakout_settings set passphrase = 'your long phrase here' where id = 1;
--
-- Flip the QR code by hand, if the admin page is unavailable:
--   update breakout_settings set qr_target = 'groups' where id = 1;   -- or 'qa'
--
-- Change the number of groups, before the QR goes up:
--   update breakout_settings set group_count = 10 where id = 1;
--
-- How many phones have scanned:
--   select count(*) from breakout_phones;
--
-- Group sizes:
--   select group_number, count(*) from breakout_phones group by 1 order by 1;
--
-- Survey results, per question:
--   select question, opt, count(*) from breakout_phones, unnest(answer) opt group by 1, 2 order by 1, 3 desc;
--
-- Happiness results (1 is lowest, 5 is highest):
--   select mood, count(*) from breakout_phones where mood is not null group by 1 order by 1;
--
-- Clear test data before doors, so numbering starts at group 1:
--   truncate breakout_phones;
--   update breakout_settings set scans = 0 where id = 1;

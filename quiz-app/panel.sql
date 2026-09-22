-- ============================================================
-- Panel phase and safe upvotes  ·  run once in the Supabase SQL Editor
-- (after schema.sql and reset.sql). Safe to re-run.
--
-- Adds two functions the pages call:
--   upvote_question(qid)    atomic +1, so simultaneous taps don't lose votes
--   set_live_question(qid)  puts one audience question "on the floor" and
--                           marks whichever was live before as asked
--
-- quiz_state.phase gains the value 'panel' and audience_questions.status
-- gains 'live'. Both columns are plain text, so no table change is needed.
-- ============================================================

create or replace function upvote_question(qid uuid)
returns int
language sql
security definer
set search_path = public
as $$
  update audience_questions set votes = votes + 1 where id = qid returning votes;
$$;

grant execute on function upvote_question(uuid) to anon;

create or replace function set_live_question(qid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  quiz uuid;
begin
  select quiz_id into quiz from audience_questions where id = qid;
  update audience_questions set status = 'asked' where quiz_id = quiz and status = 'live' and id <> qid;
  update audience_questions set status = 'live' where id = qid;
end $$;

grant execute on function set_live_question(uuid) to anon;

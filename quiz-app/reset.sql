-- ============================================================
-- One-click reset  ·  run once in the Supabase SQL Editor
-- Adds a function the moderator's "Reset" button calls. It clears
-- all answers and audience questions for the ACTIVE quiz and drops
-- the room back to the lobby — the quiz and its questions stay put.
-- ============================================================

create or replace function reset_session()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  aq uuid;
begin
  select active_quiz_id into aq from quiz_state where id = 1;
  delete from responses where question_id in (select id from questions where quiz_id = aq);
  delete from audience_questions where quiz_id = aq;
  update quiz_state set phase = 'lobby', updated_at = now() where id = 1;
end $$;

grant execute on function reset_session() to anon;

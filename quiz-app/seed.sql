-- ============================================================
-- Frontier Creatives · new event  ·  run in the Supabase SQL Editor
-- Creates a fresh event container (the row audience questions hang
-- off), makes it active, and puts the screen on the join view. Run
-- once per Volume, before doors. Safe to re-run; each run starts
-- the board empty. The event name shown on screen comes from
-- EVENT_TITLE in config.js, so this title is just a label.
-- ============================================================

do $$
declare
  e_id uuid;
begin
  update quizzes set is_active = false where is_active;

  insert into quizzes (title, is_active)
  values ('Vol. 04 · Interactive panel', true)
  returning id into e_id;

  update quiz_state
     set active_quiz_id = e_id, current_question_id = null,
         phase = 'lobby', updated_at = now()
   where id = 1;
end $$;

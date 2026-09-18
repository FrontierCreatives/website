-- ============================================================
-- Frontier Creatives quiz seed  ·  run AFTER schema.sql
-- Generated from quiz.json. Replaces the current quiz of the day
-- and makes it active. Re-runnable.
-- ============================================================

do $$
declare
  q_id uuid;
  first_q uuid;
begin
  delete from quizzes where title = 'Frontier Creatives — Quiz of the Day';

  insert into quizzes (title, is_active)
  values ('Frontier Creatives — Quiz of the Day', true)
  returning id into q_id;

  insert into questions (quiz_id, sort_order, prompt, type, options) values
    (q_id, 1, 'Which best describes your professional identity?', 'single', '["Graphic / Visual Designer","UX / Product Designer","Front-end Development","Software Developer","Product Manager","Marketing / Advertising","Photo / Video","3D / Motion","Entrepreneur / Founder","Other"]'::jsonb),
    (q_id, 2, 'Which sort of speakers would you like to see us feature?', 'multi', '["Industry experts / thought leaders","Real people from the trenches, just like me","Startups / founders — the business crowd","Diverse, equitable representation. I''ve seen enough tech bros","The marketing & advertising people using AI","Other"]'::jsonb),
    (q_id, 3, 'Which other sorts of events would you like to see in the future?', 'multi', '["Classes and workshops, laptops open","Networking — professional ''speed dating''","Mastermind groups refined to subject matter","Hackathons — group build or competition","Social mixers, coffeeshop or bar","Other"]'::jsonb);

  select id into first_q from questions where quiz_id = q_id order by sort_order limit 1;

  update quiz_state
     set active_quiz_id = q_id, current_question_id = first_q,
         phase = 'lobby', display_mode = 'bar', updated_at = now()
   where id = 1;
end $$;

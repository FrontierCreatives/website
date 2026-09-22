-- ============================================================
-- Frontier Creatives quiz seed. Run after schema.sql.
-- Generated from quiz.json (or open make-seed.html on the site).
-- Replaces the quiz with this title, makes it active, and puts
-- the room in the lobby. Re-runnable. New question ids mean
-- every phone can answer again, which is the full reset.
-- ============================================================

do $$
declare
  q_id uuid;
  first_q uuid;
begin
  delete from quizzes where title = 'Vol. 04 · Interactive panel';
  update quizzes set is_active = false where is_active;

  insert into quizzes (title, is_active)
  values ('Vol. 04 · Interactive panel', true)
  returning id into q_id;

  insert into questions (quiz_id, sort_order, prompt, type, options) values
    (q_id, 1, 'Which best describes what you do?', 'single', '["Graphic or visual design", "UX or product design", "Front-end development", "Software development", "Product management", "Marketing or advertising", "Photo or video", "3D or motion", "Founder", "Other"]'::jsonb),
    (q_id, 2, 'One word for how AI changed your process this year', 'word', '[]'::jsonb),
    (q_id, 3, 'Which of these do you actually use in your work?', 'multi', '["Claude", "ChatGPT", "Figma Make or similar", "Cursor, Claude Code or another coding agent", "Midjourney, Runway or another image and video model", "None yet", "Other"]'::jsonb),
    (q_id, 4, 'One word for what still worries you about it', 'word', '[]'::jsonb),
    (q_id, 5, 'Which speakers would you like to see us feature?', 'multi', '["Industry experts and thought leaders", "Real people from the trenches, like me", "Founders and the business crowd", "Diverse representation; enough tech bros", "Marketing and advertising people using AI", "Other"]'::jsonb),
    (q_id, 6, 'Which other kinds of events would you come to?', 'multi', '["Classes and workshops, laptops open", "Networking, professional speed dating", "Mastermind groups by subject", "Hackathons, group build or competition", "Social mixers at a coffee shop or bar", "Other"]'::jsonb);

  select id into first_q from questions where quiz_id = q_id order by sort_order limit 1;

  update quiz_state
     set active_quiz_id = q_id, current_question_id = first_q,
         phase = 'lobby', display_mode = 'bar', updated_at = now()
   where id = 1;
end $$;

-- ============================================================
-- Frontier Creatives · Interactive panel · Database schema (v1)
-- The quizzes/questions/responses tables remain from the v1 quiz build;
-- the panel tool uses quizzes as the event container and audience_questions.
-- Paste this whole file into the Supabase SQL Editor and run it.
-- It creates the tables, turns on realtime, and sets access rules.
-- Then run reset.sql and panel.sql (helper functions), then seed.sql.
-- ============================================================

-- ---- Tables ------------------------------------------------

create table if not exists quizzes (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id         uuid primary key default gen_random_uuid(),
  quiz_id    uuid not null references quizzes(id) on delete cascade,
  sort_order int  not null default 0,
  prompt     text not null,
  -- type: 'single' (pick one) | 'multi' (pick many) | 'word' (one-word open text -> cloud)
  type       text not null default 'single',
  -- options: JSON array of strings, e.g. ["Red","Green","Blue"].  Empty for 'word' type.
  options    jsonb not null default '[]'::jsonb
);

create table if not exists responses (
  id             uuid primary key default gen_random_uuid(),
  question_id    uuid not null references questions(id) on delete cascade,
  participant_id text not null,
  answer         text not null,
  created_at     timestamptz not null default now()
);

create table if not exists audience_questions (
  id         uuid primary key default gen_random_uuid(),
  quiz_id    uuid not null references quizzes(id) on delete cascade,
  text       text not null,
  author     text,
  votes      int  not null default 0,
  -- status: 'pending' | 'queued' | 'live' | 'asked' | 'dismissed'  (one 'live' at a time; see panel.sql)
  status     text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Single control row (id is always 1). Moderator writes it; screens watch it.
create table if not exists quiz_state (
  id                  int primary key default 1,
  active_quiz_id      uuid references quizzes(id) on delete set null,
  current_question_id uuid references questions(id) on delete set null,
  -- phase (what the screen shows): 'lobby' (join QR) | 'qa' (the board) | 'panel' (on the floor) | 'ended'
  phase               text not null default 'lobby',
  -- display_mode: 'bar' | 'pie' | 'cloud'
  display_mode        text not null default 'bar',
  updated_at          timestamptz not null default now(),
  constraint quiz_state_singleton check (id = 1)
);

insert into quiz_state (id) values (1) on conflict (id) do nothing;

-- Helpful index for tallying
create index if not exists responses_question_idx on responses(question_id);

-- ---- Realtime ----------------------------------------------
-- Broadcast row changes so the pages update live.
alter publication supabase_realtime add table responses;
alter publication supabase_realtime add table audience_questions;
alter publication supabase_realtime add table quiz_state;

-- ---- Row Level Security ------------------------------------
-- v1 (classroom): anonymous phones can read the quiz and submit
-- answers/questions. The moderator page is protected by an
-- unguessable URL rather than a login. Tighten in a later phase.

alter table quizzes            enable row level security;
alter table questions          enable row level security;
alter table responses          enable row level security;
alter table audience_questions enable row level security;
alter table quiz_state         enable row level security;

-- Everyone may read everything needed to render the screens.
create policy "read quizzes"   on quizzes            for select using (true);
create policy "read questions" on questions          for select using (true);
create policy "read responses" on responses          for select using (true);
create policy "read aq"        on audience_questions for select using (true);
create policy "read state"     on quiz_state         for select using (true);

-- Phones may submit answers and questions, and upvote/flag questions.
create policy "insert responses" on responses          for insert with check (true);
create policy "insert aq"        on audience_questions for insert with check (true);
create policy "update aq"        on audience_questions for update using (true) with check (true);

-- Moderator (same anon key, secret URL) may drive the control row.
create policy "update state" on quiz_state for update using (true) with check (true);

-- Seeding the quiz content itself is done from the SQL editor
-- (seed.sql) or the seed.html tool, so no anon write policy is
-- needed on quizzes/questions.

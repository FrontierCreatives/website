# Frontier Creatives — Live Quiz & Q&A App
### Build plan (v1)

A Slido-style live audience app for Frontier Creatives. Audience scans a QR code, answers
multiple-choice questions on their phones, and the aggregate results animate live on the big
screen — toggleable between pie, bar, and word cloud. A second mode lets the audience submit
questions that a moderator curates for the presenters.

This plan reflects the four decisions you made: **Supabase** for realtime data, **config-driven
questions** for v1 (no drag-and-drop builder yet), **classroom scale (~50)**, and **one "quiz of
the day"** at a time.

---

## The core idea that keeps this simple

The whole thing is **three static HTML pages plus one hosted database**. No server to run, no
build step, no terminal — the same "poor man's CMS" spirit as your Speakers Gallery.

- The three pages are plain HTML/CSS/JS. They pull in the Supabase JavaScript client from a CDN.
- **Supabase** (free hosted Postgres) holds the quiz and every answer, and pushes live updates to
  any page that's subscribed. That realtime push is the "magic" that makes the screen update the
  instant a phone submits.
- Each day's quiz is written as one **Markdown/JSON file**, loaded into Supabase by a tiny seed
  script — exactly the workflow you already use for speakers.
- Everything deploys to **Netlify** by dropping the folder in, like the gallery.

Because there's no server and no build, you can edit a page and redeploy in seconds, and I can
rebuild any part on request without you touching a command line.

---

## The three screens

**1. Participant (phone)** — what the QR code opens.
Shows the active quiz, one question at a time. Tap an answer → it's recorded → advance. When the
Q&A portion opens, the same page lets them type a question and (optionally) upvote others'
questions. No login, no app install — just a browser.

**2. Presentation (big screen)** — the projected view.
Shows the current question and its live aggregate results. A control strip toggles the
visualization: **pie · bar · word cloud**. Large type, high contrast, tuned for a projector.
Switches to a Q&A display when the moderator calls it. This page only ever *reads* — it can't be
tampered with from the room.

**3. Moderator (secret link)** — your control panel.
Advance to the next question, open/close voting, and flip what the big screen is showing. During
Q&A, see every incoming audience question, and mark which ones to **queue → ask → dismiss**. For a
classroom, an unguessable URL is enough security in v1; real login can come later.

---

## Data model (Supabase / Postgres)

| Table | Purpose | Key fields |
|---|---|---|
| `quizzes` | One per event/day | id, title, is_active |
| `questions` | The multiple-choice questions | id, quiz_id, sort_order, prompt, type, options (JSON) |
| `responses` | Every answer submitted | id, question_id, participant_id, answer, created_at |
| `audience_questions` | Q&A submissions | id, quiz_id, text, author (optional), votes, status |
| `quiz_state` | Single control row the moderator writes and the big screen watches | active_quiz_id, current_question_id, phase, display_mode |

`quiz_state` is the trick that keeps all three screens in sync: the moderator writes to it, and
the participant and presentation pages subscribe to it, so "next question" or "show word cloud"
propagates to every device at once.

**Question types for v1:** single-select and multi-select multiple choice. The **word cloud**
renders from either a multiple-choice tally (options sized by votes) or a short open-text question
("one word for how this makes you feel") aggregated live.

---

## Branding

Built on your established Frontier Creatives tokens, with a **light + dark toggle** (dark is the
default, matching the gallery; light is tuned for bright rooms and projectors that wash out).

- **Accent:** coral `#E76F51`, soft coral `#F0987F`
- **Dark grounds:** `#0B0A09`, `#17120E`, surface `#211913`
- **Light grounds / text:** sand `#F3EDE3`, muted `#C2B5A1` / `#A99E8D`
- **Type:** EB Garamond for display/headings, Montserrat for UI and data labels
- Charts use coral as the primary series color with a restrained supporting ramp — no rainbow
  defaults, consistent with your aesthetic.

The presentation view gets its own oversized scale so results read from the back of a room.

---

## Build phases

**Phase 0 — Foundation.** Create the Supabase project, the tables above, and the access rules
(anonymous phones can submit answers and questions but not edit anyone else's; the big screen is
read-only). Set up the FC theme (tokens, fonts, light/dark toggle) and the seed script that turns
a quiz Markdown/JSON file into database rows.

**Phase 1 — The live loop (the core "wow").** Participant answering + presentation view with live
pie/bar/word-cloud toggle + the moderator's advance/open/close controls. At the end of this phase
you can run a real quiz end to end.

**Phase 2 — Q&A.** Audience question submission and optional upvoting, plus the moderator's
queue → ask → dismiss workflow and the presenter-facing Q&A display.

**Phase 3 — Later, optional.** Replace config files with a visual question builder (start with a
simple add/edit form, grow toward drag-and-drop), add moderator login, and add post-event result
exports.

---

## What I'd need from you along the way

- A **Supabase account** (free) — I'll walk you through the one-time signup and I can scaffold the
  database for you. This is the only new account required.
- Your **Netlify** is already connected here, so deploying is covered.
- The **content of your first quiz** (a handful of questions) whenever you're ready — or I'll seed
  a realistic placeholder quiz so we can build and test against something real, then swap it.

## Open items I'll assume unless you say otherwise

- QR code simply points at the participant URL (I'll generate it).
- Moderator security in v1 = unguessable link, no password.
- One active quiz at a time; you swap in the next one by marking it active.

---

## Effort at a glance

Small, classroom-scale, and free to run. Phase 0–1 is the bulk of the work and gets you a
working live quiz; Phase 2 adds Q&A; Phase 3 is optional polish for later. I can start on Phase 0
whenever you give the word.

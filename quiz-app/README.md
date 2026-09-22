# Frontier Creatives · Interactive panel (live quiz and Q&A)

A Slido-style live audience app. Phones scan a QR code, answer questions, and results
animate on the big screen (bar / pie / word cloud). A Q&A mode lets the audience submit and
upvote questions, and a panel mode puts one question at a time "on the floor" behind the
panelists with the room's live answers beside it. Static pages plus Supabase, no server.

Styled on the brand guide v1.3 (`/brand`): true black, Inter over Krub, hierarchy from
spacing, coral only on what you can act on. Dark is the only surfaced mode; add `?light`
to any page for a washed-out projector or print.

## Files
| File | What it is |
|---|---|
| `index.html` | **Participant** page, the QR target. Answer, ask, upvote on your phone. |
| `present.html` | **Big screen**. Lobby QR, live results, audience questions, the panel view. Read-only. |
| `moderate.html` | **Moderator** control panel (password in `config.js`; keep the URL quiet). |
| `results.html` | Live summary plus CSV and Markdown exports (same password). |
| `join-poster.html` | Printable "scan to join" poster (light variant). |
| `schema.sql` | Tables, realtime, access rules. Run once. |
| `reset.sql` | The one-click reset the moderator uses. Run once. |
| `panel.sql` | Atomic upvotes and "put on screen". Run once. |
| `quiz.json` | The editable quiz. |
| `seed.sql` | Generated from `quiz.json`; loads the quiz and makes it active. |
| `make-seed.html` | Reads `quiz.json` and hands you paste-ready seed SQL. |
| `config.js` | Supabase URL, anon key, moderator password. |
| `lib.js`, `styles.css` | Shared theme, figures, charts, gate. |

## One-time setup

1. Create a Supabase project (free).
2. SQL editor: run `schema.sql`, then `reset.sql`, then `panel.sql`, then `seed.sql`.
3. Paste the Project URL and anon key into `config.js`. Change `MODERATOR_PASSWORD`.
4. Push to `main`; Vercel deploys `/quiz-app/`.

## Running a Volume

Open `present.html` on the projector, `moderate.html` on a laptop or phone.

**The room is in** one of six states, set from the moderator page:

| State | Phone shows | Screen shows |
|---|---|---|
| Lobby | "You're in" | Scan to join, with the QR on the cardioid |
| Voting | The current question | The question and live tally |
| Results | The tally | The tally, plus any "Other" write-ins |
| Q&A | Ask, upvote, see the queue | Queued questions, the live one first |
| Panel | The question on the floor, the current poll, ask and upvote | Two columns: the live question and what's up next; the room's answers to the current question |
| End | "That's a wrap" | Same, with the star |

**Audience questions** move `new → queued → on the floor → asked`, or `dismissed`.
"Put on screen" promotes a question and marks whatever was on the floor as asked;
only one question is ever live. For the panel, a moderator (Madison) drives from a phone
while the screen shows the room what is being discussed.

**Screen shows** picks bar, pie or cloud for the current question. One-word questions
always render a cloud. Bar reads best from the back; use pie for three options or fewer.

## Before an event
- Reseed (`make-seed.html` → copy → run in Supabase). New question ids let every phone
  answer again; **Reset** alone clears answers but phones that already answered remember it.
- Export first if you want last time's data (`results.html`).

## Changing the quiz
Edit `quiz.json`, open `make-seed.html` on the deployed site, Copy SQL, run it in the
Supabase SQL editor. Types: `single`, `multi`, `word` (one-word open text; renders a cloud).
An option starting with "Other" gets a write-in field. No em-dashes in prompts or options.

## Security note
The moderator page is a light gate (password in page source), and the anonymous key can
insert answers and questions. Fine for a room of 50; keep the moderator URL private. Real
login via Supabase Auth is the later upgrade.

# Frontier Creatives · Interactive panel

A live audience Q&A for the panel. Phones scan a QR code, send questions, and upvote the
ones they want answered; the big screen is a live leaderboard that reorders as votes land.
The moderator puts one question "on the floor" at a time. Static pages plus Supabase, no server.

Styled on the brand guide v1.3 (`/brand`): true black, Inter over Krub, hierarchy from
spacing, coral only on what you can act on. Dark is the only surfaced mode; add `?light`
to any page for a washed-out projector or print.

## Files
| File | What it is |
|---|---|
| `index.html` | **Phone.** Ask a question, upvote others. Always open. |
| `present.html` | **Big screen.** Join QR, the board, the one on the floor, the wrap. Read-only. |
| `moderate.html` | **Moderator.** Picks what the screen shows, puts questions on the floor. Password in `config.js`. |
| `results.html` | Export the questions and votes (CSV, Markdown). Same password. |
| `join-poster.html` | Printable "ask the panel" poster (light variant). |
| `config.js` | Supabase URL, anon key, moderator password, `EVENT_TITLE`. |
| `schema.sql` | Tables, realtime, access rules. Run once, ever. |
| `reset.sql` | The moderator's one-click reset. Run once, ever. |
| `panel.sql` | Atomic upvotes and "put on screen". Run once, ever. |
| `seed.sql` | Starts a fresh event. Run before each Volume. |
| `lib.js`, `styles.css` | Shared theme, figures, helpers. |

## Running a Volume

Open `present.html` on the projector and `moderate.html` on a phone or laptop.

**Phones can ask and vote the whole time**, in every state except End. The screen shows
one of four things, picked by the moderator:

| Screen shows | What it is |
|---|---|
| Join screen | The QR and the ask, on the cardioid. Doors and the talks. |
| The board | The live leaderboard, most votes first, with a small QR. During the break before the panel. |
| On the floor | The question being answered, big, with up next beside it. During the panel. |
| End | That's a wrap. |

**Put on screen** promotes a question to the floor (and flips the screen to On the floor);
whatever was there before is marked asked. **Queue** is an optional shortlist. **Dismiss** hides
a question from the board; **Restore** brings it back.

## Before each Volume
1. Set `EVENT_TITLE` in `config.js` and push.
2. Run `seed.sql` in the Supabase SQL editor. It starts a fresh, empty board. (Or use
   **Reset for next event** on the moderator page, which clears the current board in place.)

Export first if you want last time's questions (`results.html`).

## Security note
The moderator page is a light gate (password in page source), and the anonymous key can
insert questions and votes. Fine for a room of 50; keep the moderator URL private. Real
login via Supabase Auth is the later upgrade.

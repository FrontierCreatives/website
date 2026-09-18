# Frontier Creatives — Live Quiz & Q&A

A Slido-style live audience app. Phones scan a QR code, answer questions, and results
animate on the big screen (pie / bar / word cloud). A Q&A mode lets the audience submit
questions for the moderator to curate. Three static pages + Supabase, no server.

## Files
| File | What it is |
|---|---|
| `index.html` | **Participant** page — the QR target. Answer + Q&A on your phone. |
| `present.html` | **Big screen** — live results, join QR, pie/bar/cloud. Read-only. |
| `moderate.html` | **Moderator** control panel (keep this URL private). |
| `schema.sql` | Database structure + realtime + access rules. Run once. |
| `seed.sql` | Loads the placeholder quiz and makes it active. |
| `quiz.json` | The editable source for your quiz. |
| `make-seed.html` | Reads `quiz.json` and hands you paste-ready seed SQL (no terminal). |
| `config.js` | Where you paste your two Supabase keys. |

## One-time setup (about 10 minutes)

1. **Create a Supabase project** at supabase.com (free). Give it a name, pick a region, wait for it to spin up.
2. **Run the schema.** In the project, open **SQL Editor → New query**, paste all of `schema.sql`, and Run. Then do the same with `seed.sql`, and once more with `reset.sql` (adds the one-click reset the moderator uses).
3. **Paste your keys.** In Supabase go to **Settings → API**. Copy the **Project URL** and the **anon public** key into `config.js`.
4. **Deploy.** Drag this whole folder onto Netlify (same as the Speakers Gallery). You'll get a URL like `your-quiz.netlify.app`.

That's it. Open `present.html` on the projector, share the QR, and drive it from `moderate.html`.

## Running a session
- Open **`/present.html`** on the big screen — it shows a join QR.
- Open **`/moderate.html`** on your laptop/phone (private link).
- Use the moderator panel: **Next** to advance questions, **Voting open / Show results** to control the room, and **Bar / Pie / Cloud** to change the visualization live.
- Switch to **Q & A** phase when it's question time; **Queue** the questions you want the presenters to see on screen, **Mark asked** as you go.

## Moderator password
The moderator page asks for a password. Set it in `config.js` as `MODERATOR_PASSWORD` before you
deploy. This is a light gate to stop casual/accidental access — it isn't hardened security (a
determined person could read it in the page source), so keep the moderator URL private too. Real
login is a later upgrade via Supabase Auth.

## Reset between events
On the moderator page, **↺ Reset for next event** (bottom of the top card) clears all answers and
audience questions for the active quiz and drops the room back to the lobby — the quiz and its
questions stay put. It needs `reset.sql` to have been run once (setup step 2). Note: phones that
already answered remember it in their own browser, so a reset is meant for a *fresh* audience; to
fully reset for the *same* crowd, re-run `seed.sql` (new question IDs let everyone answer again).

## Saving / exporting results
Open **`/results.html`** (same password as the moderator, and there's a **⤓ Export results** link on
the moderator page). It shows a live summary and three download buttons:

- **Raw answers (CSV)** — one row per answer: question, answer, participant, timestamp.
- **Summary (CSV)** — per-question tallies: option, votes, % of respondents.
- **Report (Markdown)** — a readable write-up of every question's results plus the audience questions.

Export *before* you reset or reseed, since those clear the data. (Zero-code fallback: Supabase's
Table Editor can also export any table to CSV directly.)

## Changing the quiz
Edit `quiz.json`, open **`/make-seed.html`** on the deployed site, click **Copy SQL**, and run it in the Supabase SQL Editor. (Or hand `quiz.json` to Claude and ask for fresh `seed.sql`.)

## Security note (v1)
For classroom scale, the moderator page is protected by its unguessable URL rather than a
login, and the anonymous key allows submitting answers/questions. That's the deliberate v1
tradeoff. A later phase can add moderator login and lock the control table down.

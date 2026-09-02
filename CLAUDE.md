# Working in this repo

Read this before editing anything. It is short on purpose.

## 1. This is a shared repo. Fetch before you edit.

More than one person pushes to `main`, and they push the same file: `index.html`. Assume this clone is stale.

```
git fetch origin
git status -sb
```

- `[behind N]` → **do not edit.** Update first, then make the change.
- `[ahead N]` → an unpushed commit is already here. Find out what it is before adding to it.
- Read what is coming in, not just the counts: `git log --oneline HEAD..origin/main` and `git diff HEAD...origin/main`. Incoming changes are usually content, so they may contradict whatever you are about to write.

Skipping this costs a rejected push and a conflicted rebase in a 62 KB single-file site. It has already happened once.

## 2. Do not run git commands that write.

`fetch`, `log`, `show`, `diff`, `status` are yours. Anything that writes the index, moves a ref, commits, or pushes belongs to the human. Write the commands out and hand them over.

If a push is rejected and the change is small, **rebuild rather than merge** — re-derive the edit on the fresh base instead of resolving conflict markers:

```
git show origin/main:index.html > /tmp/base.html   # then re-apply the edit to it
```

To find out whether a rebase would conflict without touching this working tree, copy `.git` to a scratch directory and rebase there.

## 3. Edit by anchoring, never by line number or bare index.

The site is one 62 KB HTML file with the design system inlined. Every programmatic edit must anchor on a unique string and assert it matches **exactly once** before replacing. A bare `.index()` on this file once produced a negative-length slice, which is an empty string, and replacing on an empty string inserts between every character. `brand/index.html` went from 52 KB to 50 MB.

Never re-type file content from tool output; it may have been truncated. Read, modify, write.

## 4. Verify by rendering, not by reading the diff.

After any change to `index.html`, at minimum: parse it (no unclosed tags, no nested `<a>`), confirm the JSON-LD still parses, and render it headless at 1440 / DPR 2. CSS is inline, so a single-file render is faithful.

Two checks specific to this page:

- **Document height must be identical before and after a full scroll pass.** `#hlayer` measures text and draws highlight rects; if it inflates the page it will loop.
- **Audit every Luma href after any event change**, not just the one you edited:
  `grep -o 'href="https://luma.com/[^"]*"' index.html | sort | uniq -c`

## 5. House style

The design system is at https://frontiercreatives.design/brand and it governs. In particular: no borders, cards, bento grids or dividers; hierarchy comes from spacing. Sentence case everywhere; the eyebrow is the only label style. Dark is the default, `?light` is the variant. **No em-dashes** anywhere in copy; use a semicolon or a colon.

`.rowi` is itself an anchor, so never put a link inside a calendar row's text.

**Calendar row states are manual and must be moved when the hero rolls:**

- `.rowi.next` — the one upcoming event the hero is currently advertising. Carries the **only** coral in the list. Exactly one row has it.
- `.rowi.past` — a completed event. Also carries the `COMPLETE` marker. Recedes by weight (title to secondary, blurb to tertiary), never by badge color.
- No class — upcoming, but not the one the hero is on.

Coral marks what you can act on. Never put it on `COMPLETE`; that spends the loudest color on the page on the events nobody can attend. And do not fade `.lead` or `.tr` on past rows: they sit on the dimmest token already, and 72% opacity measures 2.82:1 in light mode, under AA for 14px text.

## 6. Deploy

Push to `main` auto-deploys to https://frontiercreatives.design via Vercel, usually inside a minute. There is no build step to babysit. If a change does not appear, check `git status -sb` for `[ahead N]` before blaming the deploy or a cache.

`assets/` here is a working copy mirrored by hand from the `design-system` repo's `FC DS/assets/`. If you add an asset, add it in both.

## 7. If you are working through the Claude desktop device bridge

The mount refuses `unlink`, which has two consequences:

- Every git command that writes the index leaves a stale `.git/index.lock`. The next command needs `rm -f .git/index.lock` first.
- `git checkout <file>` and plain `>` redirects fail. Pipe through a truncating write instead:
  `git show HEAD:index.html | python3 -c "import sys;open('index.html','w').write(sys.stdin.read())"`
- Files cannot be deleted, only moved. Use a gitignored `_to_delete/` and tell the human.

---

Longer narrative versions of these rules, plus per-volume history, live in the "Frontier Creatives" Claude project (`claude/shared-repo-rules.md` and the `vol-NN` docs). This file is the operational subset that travels with the repo.

# Give this file to your AI

You downloaded the Frontier Creatives asset pack. Paste this file into Claude, ChatGPT, Cursor, or whatever you build with, alongside the SVGs in this folder. It is everything needed to use the geometry correctly, and to not make the one mistake everybody makes.

Everything here is generated from a single 72-line skeleton, so an AI can produce any figure, any in-between frame, any size, on demand. That is the point of the system. It only works if the rules below are followed exactly.

---

## What is in this folder

| | |
|---|---|
| `GIVE-THIS-TO-YOUR-AI.md` | this file |
| `place-figure.py` | the placement formula, runnable; `place` and `decode` |
| `fc-figure-{star,cardioid,pursuit}.svg` | the three masters, coral, 800 x 800, 72 lines |
| `fc-texture-*-gray.svg` | the same three for light grounds |
| `fc-mark.svg`, `-on-black`, `-light-bg` | the mark; `-light-bg` is `#BE4A2B` for light grounds |
| `fc-mark-1600.png`, `fc-mark-black-1600.png` | raster mark |
| `fc-mark-animated-800.{mp4,gif}` | the morph loop, starting on the star; see *Rendering the loop* to make any other |
| `styles.css` | the entry point; link this and it imports all four token files |
| `tokens/colors.css`, `fonts.css`, `spacing.css`, `typography.css` | **authoritative values**; `fonts.css` loads Inter and Krub for you |
| `components/core/*.jsx`, `.d.ts`, `.prompt.md` | Button, Input, Badge, Eyebrow, ListItem, Person, Stat, Tag |

**Read `tokens/` rather than trusting any summary,** including the one at the bottom of this file. The token files are the source of truth for every hex, alpha, size and step; the prose here exists to explain what the values are for, not to replace them.

---

## The one mistake

**Do not regenerate the figures from their mathematical constructions. Place the master SVGs in this folder.**

The figures animate by morphing into each other, and the morph works by interpolating line *i* of one figure toward line *i* of the next. That means line *i* has to play the same structural role in every figure. The masters are authored on the shared skeleton and already satisfy this.

A figure you rebuild from scratch will not. A cardioid written as a monotonic sweep around a circle and a star written as four arms of eighteen rings both look perfectly correct standing still, and share no line order at all. Line *i* lands somewhere unrelated in the next figure, half the field swings across the frame, and the morph turns to spaghetti.

The failure is invisible in a static render and obvious in motion, so it tends to survive review and blow up later. If your AI offers to "just generate the curve," say no.

---

## The skeleton

Every figure is exactly **72 lines**, authored as **18 rings x 4 arms, ring-major order, consistent rotation**. Curve-stitch construction: straight lines whose envelope reads as a curve. The three canonical figures:

| file | figure | used for |
|---|---|---|
| `fc-figure-star.svg` | star | identity at rest: nav, favicon, avatar |
| `fc-figure-cardioid.svg` | cardioid | events, volume announcements |
| `fc-figure-pursuit.svg` | pursuit spiral | thinking, essays, process content |

Masters are `800 x 800`, centred at `(400, 400)`. The `-gray` variants are the same geometry for light grounds.

**Never redraw the mark.** Every asset generates from these.

---

## The placement formula

A placed figure is a master under a **similarity transform**, and nothing else. Three numbers: scale, rotation, centre.

```
p' = centre + scale * R(theta) * (p - (400, 400))
```

applied to every line of the master, **in file order**. File order is load-bearing; see "the one mistake" above.

```python
import math, re

def load(path):
    """The 72 lines of a master, in file order. Order is load-bearing."""
    src = open(path).read()
    return [[float(v) for v in m] for m in re.findall(
        r'x1="([-\d.]+)"\s+y1="([-\d.]+)"\s+x2="([-\d.]+)"\s+y2="([-\d.]+)"', src)]

def place(figure, scale, rot_deg, cx, cy):
    """Master figure -> keyframe. The only correct way to move a figure."""
    t = math.radians(rot_deg)
    a, b = math.cos(t) * scale, math.sin(t) * scale
    out = []
    for line in figure:
        placed = []
        for i in (0, 2):
            u, v = line[i] - 400.0, line[i + 1] - 400.0
            placed += [round(cx + a * u - b * v, 1), round(cy + b * u + a * v, 1)]
        out.append(placed)
    return out

star = place(load("fc-figure-star.svg"), 2.1976, 0, 1040, 380)
```

### Four rules, each learned by breaking it

1. **Place the master, never rebuild it.** The one mistake, above.
2. **Never translate an existing keyframe to a new centre.** Placed figures are full-bleed and wider than the frame. Sliding one sideways pushes most of it off canvas and it reads as a fan rather than a figure. Re-place from the master at the centre you want.
3. **Decode with a similarity fit, not scale-plus-translate.** Keyframes carry rotation. Fitting only scale and translation to a rotated keyframe reports error in the hundreds of pixels and looks like the line order is broken. It is not; the figure is turned.
4. **Interpolate plainly.** Given a shared line order, a straight cartesian lerp per endpoint is smooth. Reindexing the lines, interpolating in polar coordinates, and dissolve-and-restitch are all attempts to fix in the interpolation a problem that lives in the data.

---

## Animating the field

Scroll is the timeline. Nothing loops on its own.

- **A section owns a figure.** Each section holds its figure fully resolved; the morph lives only in a tight window between sections.
- **Sides alternate** down the scroll: right, left, right, left. Figures fill a section and bleed off the page. Never centred as an object.
- **Per-line stagger**, so the figure dissolves leading-edge-first and re-stitches the same way:

  ```
  t_i = smoothstep(clamp((t * 1.18) - (i / 72) * 0.18))
  ```

  then lerp line *i* from keyframe A to keyframe B by `t_i`.
- **`prefers-reduced-motion`:** snap between resolved figures. Never animate.

### Reference composition

The live site's four keyframes, for anyone reproducing or extending it. The sequence itself is free; these are the placements that are known to work.

| keyframe | figure | scale | rotation | centre | side |
|---|---|---|---|---|---|
| 0 | star | 2.1976 | 0 | 1040, 380 | right |
| 1 | cardioid | 2.2095 | -20 | 300, 460 | left |
| 2 | pursuit | 2.2893 | -20 | 1310, 390 | right |
| 3 | star | 2.7209 | -40 | 420, 450 | left |

In a `1440 x 900` viewBox, rendered `preserveAspectRatio="xMidYMid slice"`, fixed behind the page.

---

## Rendering the loop

The pack ships one ready-made animation. Everything else about motion is reproducible from the masters, so here is the recipe rather than a folder of variants.

**Structure.** The loop is the three figures in sequence, each held still, each morphing into the next, ending where it started: star, cardioid, pursuit, star. It has to close on its first figure or it will not loop seamlessly.

**Timing, as shipped** (measured off `fc-mark-animated-800.mp4`, not estimated):

| | |
|---|---|
| Frames | 198 at 30fps, 6.60s total |
| Canvas | 800 x 800 |
| Per figure | hold ~32 frames (~1.07s), morph ~34 frames (~1.13s) |

Three holds and three morphs: `3 x 32 + 3 x 34 = 198`.

**Per frame.** Interpolate line *i* from keyframe A to keyframe B, using the stagger above so the figure dissolves leading-edge-first and re-stitches the same way. During a hold, emit the resolved keyframe unchanged.

**Stroke.** Use the **standalone** treatment, full-opacity coral at the mark's own weight, not the field values. An exported loop is alone in its frame.

**Encoding.** Render each frame from its placed SVG (cairosvg, or a headless browser) and encode. The shipped GIF is an optimised 51 frames: one held frame per figure at 1130ms, plus 16 morph frames at 60ms between each. That is a third of the file size of a naive 198-frame GIF and reads identically. The MP4 is roughly a third of even that; prefer it wherever autoplay is available.

**Starting on a different figure** is a rotation of the frame order, not a re-render. One trap, learned by getting it wrong: cut *inside* a true hold, not near one. Find the hold windows by measuring frame-to-frame pixel difference and taking the zero-motion runs. Eyeballing a contact sheet looks right and lands a frame or two into a morph, which produces a first frame that is visibly not a resolved figure.

---

## Stroke: two treatments of the same geometry

Picked by whether anything sits on top of the figure. Getting this wrong is the second most common error.

| treatment | when | value |
|---|---|---|
| **Standalone** | the mark, hero bands, exported loops, anything alone in its frame | full-opacity coral at the mark's own weight, about **3.2px at ship size** |
| **Field** | behind type, section backgrounds | **0.8px non-scaling**, coral `#E76F51` at **0.38** opacity on dark; warm gray `#C2B5A1` at 0.5 on light, 0.4 on mobile |

The field treatment is tuned to disappear under text and does exactly that when nothing is on top of it. Use standalone values for a logo and it will look correct; use field values and it will look broken.

---

## Text over the field: content protection

If you put type over the geometry, no line may touch a glyph. The fix is a measured highlight layer, and it has four rules:

1. **Bars are background-colored.** Black on dark, white on light. They read as the geometry parting around the words, never as cards or panels.
2. **Measure the text, not the box.** `Range.getClientRects()` per element; a block element such as an eyebrow or label reports full column width and over-covers.
3. **Above the figures, below all text.** The bars live on their own layer between the line field and the type. Wrong paint order and the lines cover the bars.
4. **The layer may never inflate the page.** Give it real height (a zero-height SVG is clipped in Safari and the bars vanish), measure the document with the layer collapsed, and guard the resize observer on **width** so a height change cannot loop the layout into infinite growth.

Re-measure on resize, on content change, and on font load.

---

## Colour and type, the short version

Summarised for orientation. `tokens/colors.css`, `fonts.css`, `spacing.css` and `typography.css` in this folder are authoritative; read those before you build anything.

- Ground is true black `#000000`. Sections carry a full-bleed wash at 5 to 6 percent alpha, alternating coral `rgba(231,111,81,.05)` and sand `rgba(244,162,97,.06)`, melting to transparent at the top and bottom edges so sections blend instead of banding.
- Coral `#E76F51` is the geometry and the one interaction accent. `#BE4A2B` for button fill and for the mark on light grounds. Sand `#F4A261`, sage `#A8D5BA`, teal `#3B7A9D` are gentle supporting tints, used sparingly, never as large fields.
- Text: `#F2EDE5` primary, `#C4BBB0` secondary, `#9C9287` tertiary.
- Inter for display, Krub for body at 17px / 1.7. Sentence case everywhere. The eyebrow is the only uppercase: 13px, tracked +0.08em, coral.
- Single-column editorial flow. Hierarchy from spacing, scale and rhythm, never from borders, rules, dividers or boxed cards. No section divider rules, ever; straight hairlines fight the line geometry. If a screen feels busy or boxy, add space and remove elements.
- No monospace anywhere. No em-dashes in generated copy; use commas, colons, semicolons, periods.

---

## Components

`components/core/` holds eight built components, each as a `.jsx`, a `.d.ts`, and a `.prompt.md` written for you rather than for a human: Button, Input, Badge, Eyebrow, ListItem, Person, Stat, Tag. Read the `.prompt.md` files; they carry the usage rules that the code cannot enforce, such as one primary action per view, and accent belonging to `primary` alone.

Use them rather than rebuilding. The texture is the memorable half of this system, but a page is mostly buttons and inputs, and a correct field of coral geometry sitting above invented UI stops looking like us immediately.

`styles.css` is the entry point. Link it and the four token files come with it, fonts included.

**Not in this pack:** the scroll engine that drives the figures section by section, and the highlight layer that protects text from them. Both are specified above in enough detail to build, and neither is shipped as code. If you are reproducing the site itself rather than making something new in the brand, read the rendered guide.

---

## If you only remember three things

1. Place the master SVGs. Never regenerate a figure.
2. Never translate a placed figure; re-place it from the master.
3. Standalone stroke and field stroke are different, and swapping them looks broken.

`place-figure.py` in this folder does both directions: `place` puts a master into a keyframe, `decode` recovers scale, rotation and centre from one that exists.

Full guide: **https://frontiercreatives.design/brand**

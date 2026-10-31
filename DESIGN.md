# Design System: Guita_Ink

> Source of truth for generating **new** screens (Google Stitch or any generator)
> that have to sit next to `guitaink.com` without looking bolted on.
>
> This file documents the system that already exists. It is not a proposal.
> Where it deliberately departs from a stock "premium" ruleset, the departure is
> marked **[brand override]** and the reason is given. Those are identity
> decisions, already approved. Do not silently normalise them.
>
> This is a source document. It does not ship in the deploy bundle.

---

## 1. Visual Theme & Atmosphere

**Since 31 October 2026 the site is ink on paper, and the work is the star.**
Frede asked for the whole design to be rethought, with one aim: the art had
been getting lost among sections, text and decoration. At the same time the
first logo the site ever had, the 墨 seal ("ink"), came back.

So the page is a quiet sheet of paper with one blue stamp on it. The intro is
a short band of type, and the gallery starts straight after it, still on the
first screen: on a 1440×900 laptop more than half a row of artwork shows
before any scrolling. Nothing decorative stands between the visitor and the
work. The Survival of Kings sky and the three character cut-outs that framed
the site in October left the layout; the line-up of seven stays, as the
picture beside the commissions, because it is exactly what a commission buys.

Type does the structure: a Japanese mincho for headings (its serifs come from
the brush) and a quiet gothic for everything else. Separation comes from space
and from the white of the mats, not from boxes or rules. A faint film grain
sits over the paper.

Motion is restrained. The seal stamps once, titles wipe in like ink, artwork
grows 2% under the cursor. Nothing moves on scroll except reveals that happen
once.

**Dial reading of the built site:**

| Dial | Value | Reading |
| --- | --- | --- |
| Density | **3** | Gallery airy. Section rhythm `clamp(64px, 9vw, 128px)`, body copy capped at `36rem`. The wall itself is dense on purpose: 12px between tiles. |
| Variance | **5** | Asymmetric where text meets art (intro 1fr / 28rem, featured project 5 / 7, commissions 5 / 7); the wall is a calm uniform grid. |
| Motion | **4** | Fluid CSS, few effects. |

New screens hold these values.

---

## 2. Color Palette & Roles

Ink, paper and one blue. The blue has three token names (`--sky`,
`--sky-lift`, `--sky-raise`, kept from the sky era) so a tint can exist only
where contrast against a surface demands it; today, in each theme, all three
hold the same value. Treat them as one colour.

### Day (default)

- **Void** (`#F2F1EE`) — the paper. Neutral: neither cream nor blue, so the
  art brings all the colour.
- **Raise** (`#FFFFFF`) — the mats behind artwork and the shop's cards.
- **Raise 2** (`#E7E6E1`) — inset panels, placeholder plates.
- **Sky** (`#0E5CAB`) — the seal's blue, the single accent: filled buttons,
  the active nav mark, kickers, links, the open badge, selection, focus.
  5.93:1 on Void, 6.69:1 on Raise, 5.36:1 on Raise 2.
- **Text on Sky is Void**: 5.93:1.
- **Bone** (`#141414`) — the ink: headings and running text. 16.3:1.
- **Bone Dim** (`#5C5B56`) — secondary only: captions, notes, metadata, the
  footer. 6.02 / 6.81 / 5.45:1.
- **Hair** (`rgba(20,20,20,.12)`) — the few rules that remain (see §4).

### Night (`[data-theme="dark"]`, phones in dark mode)

- **Void** `#121211` · **Raise** `#1B1B1A` · **Raise 2** `#242422` — the paper
  turned to ink.
- **Sky** `#8DB6F2` — the same blue, lifted to read on the dark: 9.02:1 on
  Void, 8.30:1 on Raise, 7.48:1 on Raise 2. Void on top of it: 9.02:1.
- **Bone** `#EDEBE6` · **Bone Dim** `#9E9B94` (6.76 / 6.21 / 5.61:1) ·
  **Hair** `rgba(237,235,230,.12)`

**The seal does not change with the theme.** It is `#0E5CAB` with a white 墨
in the SVG, on day and night alike.

**Fixed colours, on purpose.** The tile caption band (`#141414` with
`#F2F1EE` text, 16.3:1) and the lightbox (`rgba(10,10,10,.96)` with `#F2F1EE`
and `#9E9B94`) sit on the artwork, not on the page, so they do not follow the
theme.

---

## 3. Typography Rules

Two families, both from Japanese foundries, so the type speaks the same
language as the 墨 seal. Both are served by the site itself (`fonts/`, Latin
subset only, SIL OFL), not by Google Fonts: through Google the stylesheet for
these two was 457 KB of Japanese character slices the site never shows.

- **Display — `Shippori Mincho B1` 700.** Headings, the wordmark, prices, the
  big email, timeline years, captions. Sentence case, tracking `-0.01em` to
  `-0.025em`, line-height 1.02–1.08. The intro title runs up to `4.75rem`.
- **Text and UI — `Zen Kaku Gothic New` 400 / 500.** Running text at 400,
  buttons, nav, chips and labels at 500. Line-height 1.65.
- **Sizes are steps:** paragraphs `1rem` (16px) and leads `1.0625–1.1875rem`
  in full Bone; buttons, links and notes `.875rem` (14px); labels never under
  `.75rem` (12px). Bone Dim is for what is secondary.
- **Labels.** The few uppercase labels (badges, the timeline's month, the
  About meta line) are Zen 500 at 12px, `0.12–0.14em` tracking. Kickers above
  project titles are sentence case in Sky, 14px.
- **Fallbacks:** `'Hiragino Mincho ProN', 'Yu Mincho', Georgia, serif` for the
  display face, `system-ui` for the text face. A safety net, not a choice.
- **Only the weights actually rendered** are served: Shippori 700, Zen 400 and
  500. Adding a weight means adding its file to `fonts/` and an `@font-face`.

---

## 4. Component Stylings

- **The 墨 seal (logo).** The first logo the site had (September 2026), back
  since 31 October 2026 after the frog and the G coin: the character 墨, white,
  on a rounded square of the site's blue (corners at ~26% of the side, as the
  original 30px square with an 8px radius). The character is the real outline
  from Shippori Mincho B1 ExtraBold, so it is identical everywhere (in
  September it was live text, and every system drew it with whatever CJK font
  it had). 34px in the bar, 30px on phones (`images/logo.svg`), with
  `width`/`height` on the `<img>`. Made by `tools/make-logo.py`, which also
  writes the favicon and `tools/logo-1024.png` for use off the site. Stamps in
  once on load: `scale(1.5) rotate(-14deg)` → rest, 550ms on
  `cubic-bezier(.2, 1.5, .4, 1)`, the only overshoot in the system, because a
  stamp bounces. Do not redraw, recolour or re-animate it.
- **Buttons.** `2px` radius, near-square, printed. Outline buttons have a
  1px ink border and fill with ink on hover; the primary is a Sky fill with
  Void text that turns to ink on hover (it never goes hollow). A light sweep
  crosses the filled button on hover (`transform`, 650ms). **Every control
  answers a press** with `transform: scale(.97)` over 120ms; artwork tiles are
  the exception (a tile is for the eye, and on a phone a scroll starts with a
  touch on one).
- **Header controls.** Language, theme and the mobile menu toggle share one
  44px circular control with a hairline border. 44px is the touch-target
  floor.
- **Mobile menu.** Below 621px the bar links give way to a toggle that opens a
  full-screen panel under the header, so the toggle doubles as close. Links
  cloned from the bar at boot; `aria-expanded`, focus trapped, Escape closes.
- **Chips (filters).** `999px` radius, Zen 500 `.8125rem`, Bone Dim with a
  hairline until active, ink fill when active. `aria-pressed`.
- **Frames (artwork tiles).** A 4:5 white mat (`Raise`), no border, no radius,
  no shadow. **Artwork is never cropped:** anything that is not 4:5 is fitted
  whole (`object-fit: contain`) on the mat, like a print. On hover the art
  grows 2% inside its frame and a caption band of ink slides up from the
  bottom edge with the title. No numbers on the tiles (the lightbox keeps
  them). Keyboard-operable: `role="button"`, Enter and Space.
- **Project cards.** The cover whole on its white mat at one fixed height
  (so the three titles line up), then the kicker, the title, the description
  and "Open project →" on the paper. No box around them.
- **Featured project.** Cover left (5 columns), text right (7): kicker,
  title, description, a strip of the series and the links (the project's own
  outbound link when it has one).
- **Lines that remain.** The bar's bottom edge, the footer's top, the
  commission formats list and the timeline's axis. Sections are separated by
  space and their heading, not by rules.
- **Loading / empty.** A project with no artwork renders a typographic plate.
  A missing image renders a labelled placeholder. Never a spinner, never a
  stock image.

---

## 5. Layout Principles

- Container `max-width: 1400px` (the wall wants the width), one side margin
  everywhere: `--pad: clamp(16px, 3vw, 40px)`.
- **Home page order:** intro band → the wall (selected work) → projects →
  commissions → about (bio beside the timeline) → contact.
- **The intro band:** the title left, the line "I'm Frederico Guita…" and the
  two buttons right (`1fr / 28rem`); stacked under 980px. The title is always
  exactly two lines (`max-width: 10.5em` and a size that follows the column),
  which keeps its reserved height exact; `verify.mjs` sweeps 320 to 1600px in
  both languages.
- **The wall:** a bar with the title, the filters and the count, then a
  uniform 4:5 grid, 3 columns on desktop, 2 below 980px, 12px gaps. It opens
  with the first `wallPreview` (12) pieces and a "See all N pieces" button; a
  filter always shows its whole category.
- **Projects:** the featured one full width, the other three in a row; below
  620px the row becomes a horizontal scroll-snap strip, each card 80% wide so
  the next one peeks in.
- **Commissions:** text, buttons and the four formats left; the Survival of
  Kings line-up right. Formats only (§7).
- **Reserved heights:** every string is written by JavaScript, so every box on
  the first screen reserves its height in CSS (the title, the line, the
  buttons, the wall bar, the filters, the wall). Measured CLS: 0.006 on a
  400 kbps line.
- **Responsive:** 980px (grids to one or two columns), 780 to 621px (the nav
  condenses so the bar still fits), 620px (mobile menu), plus
  `prefers-reduced-motion` and `hover: none`. Type scales with `clamp()`. No
  horizontal overflow; 44px targets.

---

## 6. Motion & Interaction

- **The house curves.** `cubic-bezier(.2, .7, .3, 1)` for reveals and small
  UI motion, `cubic-bezier(.16, .84, .36, 1)` for the ink wipe on section
  titles (1.1s), `cubic-bezier(.2, 1.5, .4, 1)` reserved for the seal's stamp.
- **Reveals fire once, via `IntersectionObserver`.** Not one `window` scroll
  listener in the codebase.
- **Transform and opacity only.** Transitions name their properties; never
  `transition: all`.
- **Small motions, sized to how often they happen:** the mobile menu cascades
  in .3s with 30ms steps; the lightbox opens with a 180ms fade while the art
  grows from `.98` and closes in 120ms; changing artwork with the arrows never
  animates; the shop's floating bag button rises 8px in 200ms.
- **Touch screens get no moving hovers** (`hover: none`): no card lift, no art
  growing, no sweep, and a filled button stays filled.
- **`prefers-reduced-motion` disables everything**, colour fades included.
- **Grain veil.** Fixed pseudo-element, inline SVG turbulence, `opacity: .35`,
  `pointer-events: none`.

---

## 7. Anti-Patterns (Banned)

### Craft

- No emojis. The 墨 in the seal is a typeset character, drawn from a font.
- No pure `#000000`, and no pure `#FFFFFF` as the page or as text. White is
  the mats' colour and the lightbox buttons'.
- No second accent hue. One blue, and the seal is that blue.
- No decoration over or around the artwork: no overlays at rest, no patterns
  sweeping across it, no frames with borders. The art is the star.
- No neon, glow, shadows or gradients (the button sweep is light, not colour).
- No custom cursors. No `100vh`. No `window` scroll listeners. No spinners.
- No pill buttons; pills are for filter chips and badges only.
- No filler UI text ("Scroll to explore") and no AI copy clichés ("Elevate",
  "Seamless", "Unleash"). The voice is terse in both EN and PT.
- No em-dashes in user-facing site copy. (This source document is exempt.)
- No stock photography and no placeholders from image services. An empty slot
  is answered with type.
- No dead `#` links. Unavailable items render as muted text.

### Business and legal — these outrank every taste rule above

- **Fan art is never sold.** 15 of 37 works are fan art. A collab is a flag on
  top of the category (the "Collabs" chip), so a fan-art collab stays fan art.
  They display; they carry no price, no cart, no print or merch affordance,
  and no `offer` in structured data. Any commerce element filters to
  `character` and `sketches`.
- **No location.** No city, no country, in copy, meta, alt text or schema. The
  only exception is event venues in the timeline.
- **Illustrator first.** Architecture appears once, in About, as training
  background. It never reaches a tagline, meta description or schema.
- **No commission terms.** The four formats and nothing else: no prices, no
  stages, no turnaround, no payment split, no deposit language.
- **Nothing invented.** No copy asserting anything not verifiable in CONFIG,
  no unrelated artwork in an empty slot.
- **CONFIG is the contract.** Copy, prices, image list, timeline and links
  live in the CONFIG block.
- **Full EN/PT parity.** Every `data-t` key resolves in both languages.

### Build

One static HTML file per page. No build step, no framework, no npm, and no
request to any other server (the fonts are files in `fonts/`). It must keep
working opened directly from disk over `file://`.

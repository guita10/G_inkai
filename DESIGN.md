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

**Since 31 October 2026 the work is the star** (and since 1 November it is
shown on Midnight Black: see §2).
Frede asked for the whole design to be rethought, with one aim: the art had
been getting lost among sections, text and decoration. At the same time the
first logo the site ever had, the 墨 seal ("ink"), came back.

So the page is a black wall with a cobalt stamp and one lime highlight. The intro is
a poster (since 1 November 2026, after Frede found the first version's
landing too weak): the name, large, with what he does under it; one of his
originals, whole and as tall as the screen, beside it; a different piece on
each visit. The gallery follows. Nothing decorative stands between the visitor and the
work. The Survival of Kings sky and the three character cut-outs that framed
the site in October left the layout; the line-up of seven stays, as the
picture beside the commissions, because it is exactly what a commission buys.

Type does the structure: a Japanese mincho for headings (its serifs come from
the brush) and a quiet gothic for everything else. Separation comes from space
and from the tone of the mats, not from boxes or rules. A faint film grain
sits over the page.

Motion is restrained. The seal stamps once, titles wipe in like ink, artwork
grows 2% under the cursor. Nothing moves on scroll except reveals that happen
once.

**Dial reading of the built site:**

| Dial | Value | Reading |
| --- | --- | --- |
| Density | **3** | Gallery airy. Section rhythm `clamp(64px, 9vw, 128px)`, body copy capped at `36rem`. The wall itself is dense on purpose: 12px between tiles. |
| Variance | **5** | Asymmetric where text meets art, all on one twelve-column reading with one gutter: intro 6 / 6 (the name and lines left, the picture right), featured project 5 / 7, commissions 5 / 7, about 5 / 7; the wall is a calm uniform grid. |
| Motion | **4** | Fluid CSS, few effects. |

New screens hold these values.

---

## 2. Color Palette & Roles

**Three colours, from Frede's palette card (1 November 2026):** Midnight Black
`#030407`, Electric Cobalt `#1558C9` and Acid Lime `#D8F454` (the lime's code
was cut off on the card; `#D8F454` is measured from its swatch and changes in
one place per page). **The site opens dark**, for everyone: the black is the
page and the light theme lives on the ◐ toggle. Cobalt replaced the Royal
`#2E45FF` of that morning everywhere, the seal included.

Each colour has a job, because each fails somewhere:

| Role | Token | Night (default) | Day (toggle) | Rule |
| --- | --- | --- | --- | --- |
| Page | `--void` | `#030407` Midnight Black | `#F3F4F6` | |
| Mats and cards | `--raise` / `--raise-2` | `#0E1015` / `#181B21` | `#FFFFFF` / `#E6E8EC` | the art sits on `--raise` |
| Text | `--bone` | `#EEF0F3` (17.96:1) | `#030407` (18.63:1) | running text always in full Bone |
| Secondary text | `--bone-dim` | `#9BA0AA` (7.81 / 7.25 / 6.57:1) | `#565B64` (6.20 / 6.83 / 5.56:1) | captions, notes, metadata |
| Lines | `--hair` | `rgba(238,240,243,.13)` | `rgba(3,4,7,.12)` | the few rules left (§4) |
| Cobalt, filled | `--sky` | `#1558C9` | `#1558C9` | buttons, the seal, the upcoming dot. **Text on it is `#FFFFFF`** (6.42:1). As text on the black it fails (3.19:1), so it never is |
| Cobalt, as text | `--sky-lift`, `--sky-raise` | `#6E9BF2` (7.45 / 6.92 / 6.27:1) | `#1558C9` (5.83 / 6.42 / 5.23:1) | kickers, venues, links, prices, focus |
| Lime, filled | `--lime` | `#D8F454` | `#D8F454` | the active filter, the OPEN and DROP badges, the timeline flag, selection. **Text on it is `#030407`** (16.58:1). On the light page as text or a line it disappears (1.09:1), so it never is |
| Highlight line or text | `--hi` | `#D8F454` lime (16.58:1) | `#1558C9` cobalt (5.83:1) | the big email, the current-section mark, the upcoming year |

Lime is the highlight: keep it to the few things that are "here, now". An
accent in ten places means nothing.

**The seal does not change with the theme.** It is cobalt `#1558C9` with a
white 墨 in the SVG, on night and day alike.

**Fixed colours, on purpose.** The tile caption band (`#030407` with
`#EEF0F3`, 17.96:1), text on cobalt (`#FFFFFF`), text on lime (`#030407`) and
the lightbox (`rgba(3,4,7,.96)` with `#EEF0F3` and `#9BA0AA`) do not follow
the theme: they sit on the artwork or on a colour that is the same in both.

History: Royal `#2E45FF` (September) → the frog's green (early October) → the
Survival of Kings sky (October) → ink on paper with `#0E5CAB` (31 October) →
Royal again (1 November, morning) → Midnight Black, Electric Cobalt and Acid
Lime, dark by default (1 November, afternoon).

---

## 3. Typography Rules

Two families, both from Japanese foundries, so the type speaks the same
language as the 墨 seal. Both are served by the site itself (`fonts/`, Latin
subset only, SIL OFL), not by Google Fonts: through Google the stylesheet for
these two was 457 KB of Japanese character slices the site never shows.

- **Display — `Shippori Mincho B1` 700.** Headings, the wordmark, prices, the
  big email, timeline years, captions. Sentence case, tracking `-0.01em` to
  `-0.025em`, line-height 1.02–1.08 (1.15 for the 24px subtitles, which often
  run to two lines). The name in the intro is the one size above the scale
  (see below).
- **Text and UI — `Zen Kaku Gothic New` 400 / 500.** Running text at 400,
  buttons, nav, chips and labels at 500. Line-height 1.6.
- **Seven sizes, and only seven** (since 1 November 2026; a measurement found
  fifteen on the home page and fourteen in the shop, several almost equal:
  51 / 45 / 40px titles, 25.6 / 24 / 20px subtitles, 19 / 18 / 17px text).
  Desktop values; the top two scale down with `clamp()` on phones:

  | Step | Size | Used by |
  | --- | --- | --- |
  | Display | up to `4.4rem` (70px) | the intro title, the shop and project titles, the big email |
  | Heading | up to `2.8rem` (45px) | section titles and the featured project's title |
  | Subtitle | `1.5rem` (24px) | card titles, timeline entries and years, the four commission formats, merch titles, prices, the bag |
  | Lead | `1.125rem` (18px) | the intro line, the bio, the ledes, the wordmark |
  | Body | `1rem` (16px) | running text, descriptions, tile captions |
  | Small | `.875rem` (14px) | buttons, nav, chips, links, kickers, notes, footer |
  | Label | `.75rem` (12px) | the spaced-capital labels; never smaller |

  Running text in full Bone; Bone Dim is for what is secondary. A new size
  needs a reason the table cannot give.

  **The one exception is the name** in the intro, "Guita_Ink", up to
  `7.5rem` (about 120px at 1440px): it is the page's focal point, and its
  size follows its column (`column / 5.1`; the name measures 4.83em in the
  mincho) so it is always one line and never overflows.
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
- **Chips (filters).** `999px` radius, Zen 500 `.875rem`, Bone Dim with a
  hairline until active, ink fill when active. `aria-pressed`.
- **Frames (artwork tiles).** A 4:5 mat (`Raise`: near-black at night, white by day), no border, no radius,
  no shadow, with an even margin of 4% of its width on all four sides (a
  passe-partout, since 1 November 2026: before it, 4:5 art ran to the frame's
  edge while square art floated in bands, so some pieces looked framed and
  others did not). **Artwork is never cropped:** anything that is not 4:5 is
  fitted whole (`object-fit: contain`) on the mat, like a print. On hover the art
  grows 2% inside its frame and a caption band of ink slides up from the
  bottom edge with the title. No numbers on the tiles (the lightbox keeps
  them). Keyboard-operable: `role="button"`, Enter and Space.
- **Project cards.** The cover whole on the same 4:5 mat as the wall, with
  the same 4% margin (the box used to be nearly square, so the two tall
  covers filled 68% and 73% of it; now 84–89%). The three columns are equal,
  so the three boxes are the same height and the titles line up. Then the
  kicker, the title, the description and "Open project →" on the paper. No
  box around them.
- **Featured project.** Cover left (5 columns, on the same mat), text right
  (7): kicker, title (at the section-title size, never larger than the
  heading above it), description, a strip of the series and the links (the
  project's own outbound link when it has one).
- **Project page series.** A series of one proportion (the deck, Tokyo
  Revengers, Survival of Kings) is a plain grid. A series of mixed
  proportions (PAMP: 4:5, 16:9 and tall posters) is laid in rows of one
  height, each piece as wide as its proportion asks (flex-grow proportional to
  width/height). Never cropped, never banded.
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
- **One gutter between columns:** `--gut: clamp(24px, 4vw, 64px)`, used by
  the intro, the featured project, the project row, the commissions and the
  about section (there were four different gaps). With the splits in twelfths
  (6 / 6, 5 / 7, 4 / 4 / 4) the second columns land on the same grid: the
  featured text, the commission cast and the timeline all start at one x.
- **Home page order:** the intro → the wall (selected work) → projects →
  commissions → about (bio beside the timeline) → contact.
- **The intro (a poster):** two equal columns. Left, top: "Guita_Ink" (one
  line, sized by its column) and "Illustration and character design" at the
  heading size, always two lines (`max-width: 11em`; its reserve depends on
  it). Left, bottom: "I'm Frederico Guita…", the two buttons and two facts in
  Bone Dim, taken word for word from the timeline and the bio ("Iberanime
  manga contest, 1st place", "A cover a month with Distrito Manga"). Right:
  one original from `CONFIG.heroArt`, on its 4:5 mat, as wide as the screen's
  height lets it be whole on the first screen (1280×720 to 1920×1080),
  right-aligned to the margin, its title and "n / 6" hanging underneath. A
  click opens it in the lightbox. The next piece in the list on each visit.
  **Under the facts, the six originals as small frames** (the "Flip", chosen
  by Frede from four prototypes): pointing at one, focusing it or tapping it
  swaps the big piece. The swap is instant, never animated (it is repeated
  many times in a row), and waits for the new piece to decode so the mat
  never flashes empty. The chosen frame has the highlight outline (`--hi`).
  Two columns down to 621px; stacked on phones: name, role, line, buttons,
  facts, picture, frames.
- **The shop's first screen:** the title with the drop's badge, the merch's
  sentence, a button down to the commissions, and the products straight
  after, so photos, names and prices are on the first screen. (It was the
  title, two buttons and paper, with the merch from 570px down, repeating
  "Merch" and the sentence under its own heading.)
- **The wall:** a bar with the title, the filters and the count, then a
  uniform 4:5 grid, 3 columns on desktop, 2 below 980px, 12px gaps. It opens
  with the first `wallPreview` (12) pieces and a "See all N pieces" button; a
  filter always shows its whole category.
- **Projects:** the featured one full width, the other three in a row; below
  620px they stack, one per row, each cover the page's width. (They were a
  sideways strip that ran to the screen's edge, the next card cut at 0px,
  which read as clipped rather than as "swipe".)
- **Commissions:** text, buttons and the four formats left; the Survival of
  Kings line-up right. Formats only (§7). In the shop the line-up sits right
  of the closing lines (the email note, the button, "Questions first?"), not
  under everything at full width, where it was ~680px tall and left the
  shop's last screen almost empty.
- **About:** the bio left (5), the timeline right (7). The bio is capped at
  `36rem` so it stays near 60 characters a line when the section goes to one
  column on tablets.
- **Reserved heights:** every string is written by JavaScript, so every box on
  the first screen reserves its height in CSS (the role line, the sentence,
  the buttons, the facts, the picture; the wall bar, the filters and the wall
  for links that land on it). The name and the picture are set by a small
  script right after the intro's markup, before the first paint. In the shop
  everything below the merch stays invisible until the cards are drawn (it
  used to be shoved a screen down: 0.61 on a slow line). Measured CLS on a
  400 kbps line: about 0.006 on the home page, 0.003 in the shop.
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

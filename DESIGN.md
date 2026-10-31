# Design System: Guita_Ink

> Source of truth for generating **new** screens (Google Stitch or any generator)
> that have to sit next to `guitaink.com` without looking bolted on.
>
> This file documents the system that already exists. It is not a proposal.
> Where it deliberately departs from the stock "premium AI" ruleset, the
> departure is marked **[brand override]** and the reason is given. Those are
> identity decisions, already approved. Do not silently normalise them.
>
> This is a source document. It does not ship in the deploy bundle.

---

## 1. Visual Theme & Atmosphere

**Since October 2026 (the second change that month) the site is the sky.**
Frede chose two of his own originals from the Survival of Kings universe as the
base of the whole site: the sky over a hill with two silhouettes, and the
line-up of seven characters. The palette was measured off them, the sky opens
the home page and the shop full-bleed, and the cast closes the commissions.
Day is the default; a phone in dark mode gets the same sky at night.

Three of the cast then walk into the layout as cut-outs (Frede's own, no
background): the knight under the bio in About, the white-haired boy beside
the email in Contact, the archer in the shop's sky band. Each rises from the
edge its drawing is cut on and stands on one of the site's hairlines, like a
figure stepping onto the ruled lines of a proof sheet. They are the only
decoration besides the sky, and they never stand behind text.

A cloud-white editorial field where the artwork is the only thing allowed to
be loud. Off-white paper, one blue taken from the top of the sky and used like
a stamp pad, and a great deal of air. The mood is a printer's proof sheet rather than a product page:
serif display type set large and tight, uppercase micro-labels tracked wide
like plate captions, hairline rules instead of boxes, and a fixed film-grain
veil over everything so the flat vectors read as paper rather than screen.

Motion is restrained and physical. Things stamp, bleed and wipe — they do not
float or bounce. Nothing moves on scroll except reveals that happen once.

**Dial reading of the built site:**

| Dial | Value | Reading |
| --- | --- | --- |
| Density | **3** | Art Gallery Airy. Section rhythm `clamp(56px, 8vw, 96px)`, body copy capped at `30rem`. |
| Variance | **6** | Offset Asymmetric. Every multi-column block is deliberately unequal; no centred hero. |
| Motion | **5** | Fluid CSS. Was 8 before the scroll-driven parallax was deleted; the current figure is the target, not a shortfall. |

New screens hold these values. A generated screen at Density 7 or Motion 8 does
not belong to this site.

---

## 2. Color Palette & Roles

One accent hue. It has three token names (`--sky`, `--sky-lift`,
`--sky-raise`) so a tint can exist **only** where contrast against a surface
demands it; today, in each theme, all three hold the same value. Treat them as
one colour with accessibility variants, never as a three-colour palette.

Every value below was measured off the two Survival of Kings pieces: the sky
(`images/bg/sky-*`) and the cast (`images/bg/cast-*`).

### Day (default)

- **Void** (`#F3F7F8`) — the field; the white of the clouds. Never `#FFFFFF`.
- **Raise** (`#FFFFFF`) — raised surface: cards, tiles, frames.
- **Raise 2** (`#E8EEF0`) — second-level surface, inset panels.
- **Sky** (`#0E5CAB`) — the single accent, the blue at the top of the sky. Fills, selection, focus, the italic. 6.21:1 on Void, 6.69:1 on Raise, 5.71:1 on Raise 2.
- **Sky Lift / Sky Raise** — kept as names (small text on Void / on Raise) for the day one shade is not enough; today both equal Sky.
- **Text on Sky is Void** (`var(--void)`): 6.21:1.
- **Bone** (`#0E2233`) — primary text: the night-blue of the silhouettes.
- **Bone Dim** (`#56646C`) — secondary text, captions, metadata. 5.67 / 6.11 / 5.22:1.
- **Hair** (`rgba(14,34,51,.13)`) — 1px structural rules and card borders. The site draws lines, not boxes.

### Night (`[data-theme="dark"]`, phones in dark mode)

- **Void** `#081A28` · **Raise** `#0D2435` · **Raise 2** `#122D42` — the dark blue-teal of the sky, darkened.
- **Sky** `#77D8F1` — the cyan at the horizon: 10.83:1 on Void, 9.75:1 on Raise, 8.70:1 on Raise 2. Void on top of it: 10.83:1.
- **Bone** `#E6F4F6` (cloud) · **Bone Dim** `#8FA6B2` (6.95 / 6.26 / 5.59:1) · **Hair** `rgba(230,244,246,.13)`

**Over the sky, text is white in both themes**, on a measured veil of the
sky's own deep blue (`rgba(9,52,104,…)`, night: `rgba(8,26,40,…)`) laid behind
the text block. White on the bare mid-sky is 3.78:1 and fails; `verify.mjs`
measures the real pixels behind every line (95th percentile) in both themes.

**The frog stays green.** The coin is Frede's drawing and keeps the frog's
own green (`#80AB5C`, fixed in the SVG); it is the logo, not a theme colour,
and it sits on the sky like the grass it matches. The frog's other colours
(belly `#C9E4B9`, mouth `#6F3A28`, eye `#E2C259`) live in the logo only.

The accent stays applied like ink: small fills, hairlines, the italic, never as
a glow, a gradient wash or a neon edge.

---

## 3. Typography Rules

- **Display — `Playfair Display`** (400 / 500 / 400 italic). Headlines at
  `clamp(3.2rem, 9vw, 7rem)` with `-0.025em` tracking. Hierarchy comes from
  weight, tracking and colour; the italic in Sky is the emphasis device.
- **Body — `LT Museum`, falling back to `Lora`.** Weight 300, line-height 1.65,
  measure capped at `30rem`–`42rem`.
- **UI — `Inter`** (300 / 400 / 500). Nav, buttons, chips, eyebrows, captions,
  every small tracked label.
- **Micro-labels.** Uppercase, `0.16em`–`0.22em` tracking, `Inter`, Bone Dim.
  Used above section headlines and on artwork numbering. This is the one place
  all-caps is correct here — they are plate captions, not subheads.
- **Only request the weights actually rendered.** One combined Google Fonts
  request, loaded non-blocking. Changing the type means re-auditing computed
  styles and updating the request in both directions.

**[brand override] — `Inter`.** The stock ruleset bans Inter and pushes Geist /
Satoshi / Outfit. Rejected. Inter is not doing the expressive work here —
Playfair is. Inter is deliberately neutral scaffolding under a serif that
carries all the character, and the pairing is the recognisable brand. Swapping
it buys a fresher sans and costs the identity, which fails the brand fidelity
audit this project is held to.

**Georgia** appears only as a fallback in both serif stacks, never as a chosen
face. Leave it there; a fallback is a safety net, not a type decision.

**Figures.** All three faces ship *proportional* numerals. Measured at 200px:
Inter spreads 48px between its narrowest and widest digit, Lora 51px, Playfair
46px. `font-variant-numeric: tabular-nums` closes Inter and Lora to zero, and
does **nothing** to Playfair, whose Google latin subset carries no `tnum`
feature. So the artwork numbers (Lora) are set tabular; the prices and the
timeline years (Playfair) are not, because there the declaration would be
inert. Do not add it to Playfair and assume it took.

---

## 4. Component Stylings

- **Buttons.** `2px` radius — near-square, printed, not pill. `1px` Hair border,
  transparent fill; the primary inverts to a Sky fill with Void text and
  wipes back to transparent on hover. A diagonal light sweep crosses the filled
  button on hover (`left: -120% → 100%`, 650ms). No outer glow, ever.
  Transition: `background .25s ease, border-color .25s ease, color .25s ease`.
  **Every control answers a press** with `transform: scale(.97)` over 120ms.
  Buttons, chips, knobs and lightbox controls. Artwork tiles are the deliberate
  exception: a tile is a target for the eye, not a control, and a wall of 28
  pieces flinching under the cursor would be noise.
- **Header controls.** Language, theme and the mobile menu toggle share one
  44px circular control, hairline border, `Inter`. 44px is the touch-target
  floor, not a style choice.
- **Mobile menu.** Below 621px the bar links give way to a toggle that opens a
  full-screen panel; the panel sits *under* the header so the toggle stays
  visible and doubles as the close control. Its links are cloned from the bar
  nav at boot, so there is one list, not two. `aria-expanded`, focus trapped,
  Escape closes and returns focus, and it closes itself if the viewport grows
  past the breakpoint.
- **Commission steps.** Four stages in an ordered list, each with a Sky top
  rule, staggered down a staircase (`margin-top` 0 / 18 / 36 / 54px) over
  unequal columns (`1.18fr 1fr 1fr .92fr`). **No step numbers.** The stage name
  is the label; the list order and the staircase carry the sequence. Numbering
  a step "01 Brief" is the pattern to avoid.
- **Chips (filters).** `999px` radius, `Inter` 0.76rem, `0.04em` tracking, Bone
  Dim until active. Carry `aria-pressed`. The one place a pill is right, because
  they are toggles and read as tokens.
- **Frames (artwork tiles).** Raise fill, 1px Hair border, no radius, no shadow.
  **Artwork is never cropped.** Every tile shares one height and takes its width
  from the file's true pixel ratio (`aspect-ratio: var(--ar)`, set from the DIMS
  map). Do not force artwork into a fixed frame ratio, and do not rely on
  `object-fit: cover` to make it fit — a portfolio that crops the work defeats
  itself. In the wall the column width is shared and the height follows the
  file, which is what makes it read as a gallery hang rather than a grid.
  Border warms to the accent on hover; a mask-position wipe reveals the caption.
  `scroll-snap-align: start`. Keyboard-operable: `role="button"`, Enter **and**
  Space.
- **The frog coin** (October 2026; it replaced the 墨 seal). Frede's own
  drawing, traced into flat vector shapes ink by ink (line, body, belly, mouth,
  tongue, the eye and its ochre half) and set on a coin of the frog's green
  (`#80AB5C`, in the SVG; not a theme token since the sky, Oct 2026). The
  frog's body shares the coin's green, so his black line does the drawing, the
  way a stamp does. It is the seal's successor: a field of the accent carrying
  one mark. A circle keeps the same footprint everywhere: the bar, the browser
  tab, Shopify, an Instagram avatar. 36×36px in the bar
  (`images/frog-logo.svg`, sharp at any density), with `width`/`height` on the
  `<img>`. Made by `tools/make-frog-logo.py` from `tools/frog-source.jpg`,
  which also writes the favicon. Stamps in on load: `scale(1.5) rotate(-14deg)` → rest, 550ms on
  `cubic-bezier(.2, 1.5, .4, 1)` — the only overshoot in the system, and it is
  there because a stamp bounces. Do not redraw, recolour or re-animate it
  differently on new screens.
- **Cards.** Only where elevation carries hierarchy. Default to a `1px` Hair
  top rule and whitespace instead. Radius stays at `2px`; `999px` is for chips
  and dots only.
- **Touch targets.** Every interactive element clears 44px. Nav links carry
  vertical padding rather than relying on the line box.
- **Sections.** Separated by a single `1px` Hair top border. No shadows anywhere
  in the system.
- **Loading / empty.** A project with no artwork renders a typographic plate —
  its title set large in the grid slot. That is the empty state. Never a
  spinner, never a stock image, never a substituted illustration.

---

## 5. Layout Principles

- Container `max-width: 1240px`, `26px` gutters, centred.
- Section rhythm `clamp(56px, 8vw, 96px)` top and bottom.
- **Home page order** (Sept 2026): hero → projects → selected work →
  commissions band → about (with the timeline beside the bio as "Along the
  way") → contact. Projects lead, with the featured one (`CONFIG.featured`,
  Survival of Kings) as a full-width card: cover left, text right, a strip of
  its series, a Sky top rule. The other projects follow in a row.
- **Selected work is one uniform grid**, no project highlighted: 4:5 frames
  in rows (4 / 3 / 2 columns). Uniform never means cropped: art that is not
  4:5 is fitted whole (`contain`) on the raised surface, like a print mat.
- **The wall opens with a preview** of the first `wallPreview` (12) pieces in
  `CONFIG` order and a "See all N pieces" button. A filter always shows its
  whole category.
- **Projects** are four across on desktop, two across below 980px, and a
  horizontal scroll-snap row below 620px, each card 80% wide so the next one
  peeks in and signals there is more.
- **Hero:** the Survival of Kings sky, full-bleed (it leaves the 1240px
  container), `min-height: min(82svh, 780px)` so nothing below it moves. Text
  left over the veil, never centred; on a phone the text sits at the top, in
  the deepest blue, and the silhouettes and grass stay whole at the bottom.
  No artwork column since October 2026: the sky is the hero's picture, and the
  piece that stood there (OC 01) is on the wall.
- **Section headers stack vertically, left-aligned** — eyebrow, then headline.
  The title-left / small-text-right split header is banned.
- **Every multi-column block is deliberately unequal.** Projects run
  `1.35fr 1fr .85fr`; commission tiers run `1.55fr 1fr 1fr 1fr` with the first
  tier given more padding and a larger price. Equal columns are the banned
  pattern; extra height alone is not how a tier gets highlighted here.
- **The wall is the signature.** The gallery is a masonry of columns
  (`column-count`, 4 / 3 / 2) in which every piece keeps its own proportion, so
  the ragged bottom edge and the mixed heights do the work a uniform grid
  cannot. All 28 pieces are visible at once.

  *This replaced a horizontal filmstrip, which earlier versions of this file
  called the signature. The filmstrip showed four pieces at a time out of 28,
  the filters could not pay off inside it (28 down to 10 still showed four),
  and it was the largest single source of layout shift. For an illustrator the
  work is the product, so the thing that hid the work had to go. Distinctive
  is not worth more than legible.*
- CSS Grid throughout. No flexbox percentage math, no `calc()` hacks.
- Full-height sections use `100dvh`, never `100vh`.
- Nothing overlaps. No absolutely-positioned content stacking. The only fixed
  layer is the grain veil, which is `pointer-events: none`.
- **Responsive:** every multi-column block collapses to one column under 768px.
  Breakpoints in use: **980px** (grids go to one or two columns), **780px down
  to 621px** (the nav condenses so the header still fits: the full bar needs
  744px), and **620px** (bar links give way to the mobile menu). Headlines scale via `clamp()`. No
  horizontal overflow — `overflow-x: hidden` on body is a backstop, not a
  licence. Interactive targets stay at 44px or more.

---

## 6. Motion & Interaction

- **The two house curves.** `cubic-bezier(.2, .7, .3, 1)` for reveals (800ms,
  opacity + transform) and `cubic-bezier(.16, .84, .36, 1)` for the ink-bleed
  `clip-path` wipe on section titles (1.1s). Use these; do not introduce new
  easings casually. `cubic-bezier(.2, 1.5, .4, 1)` is reserved for the logo stamp.
- **Reveals fire once, via `IntersectionObserver`.** There is not a single
  `window` scroll listener in the codebase and there must not be one. Scroll-spy
  in the nav is also an observer, with `aria-current` on the active link.
- **Staggered entry.** Siblings cascade with a `(i % 8) * ms` transition delay,
  never mounting as a block.
- **Transform and opacity only.** Never `top`, `left`, `width`, `height`.
- **Transitions name their properties.** `transition: all` is banned anywhere in
  the system: it makes the browser watch every animatable property and silently
  picks up any that is added to the rule later. List what actually changes.
- **`prefers-reduced-motion` disables everything.** The clip-path reveal, the
  logo stamp, the button sweep, the timeline dot pulse, smooth scrolling, every
  staggered delay, every press-scale, and every interactive control — buttons, theme and language
  knobs, filter chips, lightbox controls. Colour-only fades
  count: if one control is silenced they all are. Anything added must extend
  those two media blocks. This is a hard requirement, not a nicety.
- **CLS is 0.** Every image carries explicit `width` and `height`, and the global
  image rule pairs `max-width: 100%` with `height: auto` so a constrained column
  scales both axes instead of squashing one. Keep all three.
- **Grain veil.** Fixed pseudo-element, inline SVG turbulence, `opacity: .5`,
  `pointer-events: none`. Measured at no frame-time cost under 4× CPU throttle.

---

## 7. Anti-Patterns (Banned)

### Craft

- No emojis. The CJK glyphs on the typographic plates are typeset characters,
  not emoji, and the frog is a drawing, not an icon set.
- No pure `#000000` anywhere, and no pure `#FFFFFF` as the field or as body text.
  `#fff` is allowed only on the artwork scrim, the lightbox and the sky (the
  hero and the shop's page head): the tile title, the lightbox controls, the
  text over the sky. Those grounds do not follow the theme, so the text on them
  must not either. Anything sitting on a Sky fill (the skip link, the
  filled button, the open badge, flags, the selection) uses `var(--void)`.
- No second accent hue. The Sky tints are one colour. (The frog coin is green
  because it is the frog, not a second accent.)
- No neon, glow, or outer-shadow treatments on the accent.
- No gradient text on headlines.
- No shadows. This system draws hairlines.
- No custom cursors.
- No overlapping or absolutely-stacked content. (One exception, measured: the
  archer stands in the corner of the shop's sky band, absolutely placed, and
  `verify.mjs` fails the build if her box ever crosses text.)
- No equal-width column groups — not three cards, not four tiers.
- No centred hero.
- No split section headers (title left, text right).
- No pill-shaped buttons; `2px` radius. Pills are for filter chips only.
- No `100vh`.
- No `window` scroll listeners.
- No spinners. Skeletons or typographic plates.
- No filler UI text: "Scroll to explore", "Swipe down", bouncing chevrons.
- No AI copy clichés: "Elevate", "Seamless", "Unleash", "Next-Gen", "Discover".
  The voice is terse in both EN and PT. Do not smooth it out.
- No em-dashes in user-facing site copy. (This source document is exempt.)
- No stock photography, and no `picsum.photos` placeholders. This is an
  illustrator's portfolio; a stock photo on it is a contradiction, and an empty
  slot is answered with type, not with someone else's image.
- No dead `#` links. Unavailable items render as muted text, not as a link.

### Business and legal — these outrank every taste rule above

- **Fan art is never sold.** 15 of 37 works are fan art. A collab is a flag on
  top of the category (the "Collabs" chip), so a fan-art collab stays fan art. They display; they
  carry no price, no cart, no print or merch affordance, and no `offer` in
  structured data. Any commerce element filters to `character` and `sketches`.
- **No location.** No city, no country, in copy, meta, alt text or schema. The
  only exception is event venues in the timeline, which are facts about those
  events.
- **Illustrator first.** Architecture appears once, in About, as training
  background. It never reaches a tagline, meta description or schema.
- **No commission terms.** Four stages and the turnaround, nothing more. No
  payment split, no percentages, no deposit language, in any wording.
- **Nothing invented.** Do not write copy asserting anything not verifiable in
  CONFIG, and do not fill an empty slot with unrelated artwork.
- **CONFIG is the contract.** Copy, prices, image list, timeline and links live
  in the CONFIG block. New content goes there, never hardcoded into markup.
- **Full EN/PT parity.** Every `data-t` key resolves in both languages.

### Build

Single static HTML file per page. No build step, no framework, no npm. It must
keep working opened directly from disk over `file://`.

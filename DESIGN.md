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

An ink-dark editorial field where the artwork is the only thing allowed to be
loud. Near-black paper, one saturated blue used like a stamp pad, and a great
deal of air. The mood is a printer's proof sheet rather than a product page:
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

One accent hue. Three tints of it exist **only** because contrast against three
different surfaces demands it — treat them as one colour with accessibility
variants, never as a three-colour palette.

### Dark (default)

- **Void** (`#0A0A0A`) — the field; page background. Never `#000000`.
- **Raise** (`#121212`) — raised surface: cards, tiles, frames.
- **Raise 2** (`#1A1A1A`) — second-level surface, inset panels.
- **Royal** (`#2E45FF`) — the single accent. Fills, seal, selection, focus.
- **Royal Lift** (`#5568FF`) — same accent, lifted for small text **on Void** (4.54:1, just over the 4.5 AA floor). Also the italic in the hero headline.
- **Royal Raise** (`#6B7BFF`) — same accent, lifted again for small text **on Raise** (5.27:1). Royal Lift only reaches 4.29:1 there and fails AA.
- **Bone** (`#F2F0EC`) — primary text. Warm off-white, never `#FFFFFF`.
- **Bone Dim** (`#8C877F`) — secondary text, captions, metadata.
- **Hair** (`rgba(242,240,236,.13)`) — 1px structural rules and card borders. The site draws lines, not boxes.

### Light

- **Void** `#F4F2ED` · **Raise** `#FFFFFF` · **Raise 2** `#EDEAE3`
- **Royal** `#2436C9` — all three accent tints collapse to this one value; on white cards it reaches 8.59:1 unaided.
- **Bone** `#141310` · **Bone Dim** `#6B655C` · **Hair** `rgba(20,19,16,.13)`

**[brand override] — accent saturation.** `#2E45FF` is 100% saturated, over the
80% ceiling, and it is a blue. This is the Queen of Jacks blue and it is the
identity; it is also why the seal reads as an ink stamp rather than a UI chip.
Not negotiable. It is applied like ink — small fills, one seal, hairlines —
never as a glow, a gradient wash, or a neon edge, which is what the ceiling
exists to prevent. The light theme value `#2436C9` measures ~70% and complies
on its own.

---

## 3. Typography Rules

- **Display — `Playfair Display`** (400 / 500 / 400 italic). Headlines at
  `clamp(3.2rem, 9vw, 7rem)` with `-0.025em` tracking. Hierarchy comes from
  weight, tracking and colour; the italic in Royal Lift is the emphasis device.
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

**Not yet applied:** `font-variant-numeric: tabular-nums` on prices and the
artwork numbering. Worth doing on any new screen with figures in a column.

---

## 4. Component Stylings

- **Buttons.** `2px` radius — near-square, printed, not pill. `1px` Hair border,
  transparent fill; the primary inverts to a Royal fill with white text and
  wipes back to transparent on hover. A diagonal light sweep crosses the filled
  button on hover (`left: -120% → 100%`, 650ms). No outer glow, ever.
  Transition: `background .25s ease, border-color .25s ease, color .25s ease`.
- **Chips (filters).** `999px` radius, `Inter` 0.76rem, `0.04em` tracking, Bone
  Dim until active. Carry `aria-pressed`. The one place a pill is right, because
  they are toggles and read as tokens.
- **Frames (artwork tiles).** Raise fill, 1px Hair border, no radius, no shadow.
  Border warms to the accent on hover; a mask-position wipe reveals the caption.
  `scroll-snap-align: start`. Keyboard-operable: `role="button"`, Enter **and**
  Space.
- **The 墨 seal.** 30px, `8px` radius, Royal fill, Playfair glyph in white.
  Stamps in on load: `scale(1.5) rotate(-14deg)` → rest, 550ms on
  `cubic-bezier(.2, 1.5, .4, 1)` — the only overshoot in the system, and it is
  there because a stamp bounces. Do not restyle, recolour or animate it
  differently on new screens.
- **Cards.** Only where elevation carries hierarchy. Default to a `1px` Hair
  top rule and whitespace instead. Radius stays at `2px`; `999px` is for chips
  and dots only.
- **Sections.** Separated by a single `1px` Hair top border. No shadows anywhere
  in the system.
- **Loading / empty.** A project with no artwork renders a typographic plate —
  its title set large in the grid slot. That is the empty state. Never a
  spinner, never a stock image, never a substituted illustration.

---

## 5. Layout Principles

- Container `max-width: 1240px`, `26px` gutters, centred.
- Section rhythm `clamp(56px, 8vw, 96px)` top and bottom.
- **Hero:** asymmetric split, `minmax(0,1fr) / minmax(0,.72fr)`, `60px` gap,
  `align-items: start`. Text left, artwork right. Never centred.
- **Section headers stack vertically, left-aligned** — eyebrow, then headline.
  The title-left / small-text-right split header is banned.
- **Every multi-column block is deliberately unequal.** Projects run
  `1.35fr 1fr .85fr`; commission tiers run `1.55fr 1fr 1fr 1fr` with the first
  tier given more padding and a larger price. Equal columns are the banned
  pattern; extra height alone is not how a tier gets highlighted here.
- **The filmstrip is the signature.** The gallery scrolls horizontally with snap
  points. It is the reason the site does not read as another portfolio grid.
  Keep it on any screen that lists work.
- CSS Grid throughout. No flexbox percentage math, no `calc()` hacks.
- Full-height sections use `100dvh`, never `100vh`.
- Nothing overlaps. No absolutely-positioned content stacking. The only fixed
  layer is the grain veil, which is `pointer-events: none`.
- **Responsive:** every multi-column block collapses to one column under 768px
  (breakpoints in use: 980px, 620px). Headlines scale via `clamp()`. No
  horizontal overflow — `overflow-x: hidden` on body is a backstop, not a
  licence. Interactive targets stay at 44px or more.

---

## 6. Motion & Interaction

- **The two house curves.** `cubic-bezier(.2, .7, .3, 1)` for reveals (800ms,
  opacity + transform) and `cubic-bezier(.16, .84, .36, 1)` for the ink-bleed
  `clip-path` wipe on section titles (1.1s). Use these; do not introduce new
  easings casually. `cubic-bezier(.2, 1.5, .4, 1)` is reserved for the seal.
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
  seal stamp, the button sweep, the timeline dot pulse, smooth scrolling, every
  staggered delay, and every interactive control — buttons, theme and language
  knobs, filter chips, filmstrip arrows, lightbox controls. Colour-only fades
  count: if one control is silenced they all are. Anything added must extend
  those two media blocks. This is a hard requirement, not a nicety.
- **CLS is 0.** Every image carries explicit `width` and `height`. Keep them.
- **Grain veil.** Fixed pseudo-element, inline SVG turbulence, `opacity: .5`,
  `pointer-events: none`. Measured at no frame-time cost under 4× CPU throttle.

---

## 7. Anti-Patterns (Banned)

### Craft

- No emojis. The 墨 glyph is a typeset character, not an emoji, and is the only
  non-Latin mark in the system.
- No pure `#000000` or pure `#FFFFFF` for text or the field.
- No second accent hue. The three Royal tints are one colour.
- No neon, glow, or outer-shadow treatments on the accent.
- No gradient text on headlines.
- No shadows. This system draws hairlines.
- No custom cursors.
- No overlapping or absolutely-stacked content.
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

- **Fan art is never sold.** 10 of 28 works are fan art. They display; they
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

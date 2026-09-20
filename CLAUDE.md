# Guita_Ink — repository rules

Portfolio site for Frederico Guita, working as Guita_Ink: an anime and manga
influenced illustrator taking commissions. Live at `https://guitaink.com`,
deployed to Netlify by drag-and-drop.

**Read this before the first edit.** The architecture is unusual on purpose and
most of the conventions a front-end tool expects are absent by decision, not by
neglect.

---

## 0. The one-paragraph version

There is no framework, no npm, no build step, no component library, no icon
library, and no CSS methodology. The entire site is four hand-written HTML files
plus an images folder. `index.html` is 1,743 lines and contains a `CONFIG`
object, one `<style>` block, the markup, and the render JavaScript. It must keep
working when opened directly from disk over `file://`. Content lives in `CONFIG`
and is rendered by plain DOM functions. Anything that reads like "add a
dependency", "extract a component", or "run a build" is wrong for this repo.

---

## 1. Token definitions

**Where:** one `:root` block at the top of the `<style>` in `index.html`, with a
`[data-theme="light"]` block overriding a subset. `projeto.html` and `404.html`
carry their own copies.

**Format:** plain CSS custom properties. No JSON, no Style Dictionary, no
transformation pipeline. Twelve tokens total.

```css
:root{
  --void:#0A0A0A;         /* the field */
  --raise:#121212;        /* raised surface */
  --raise-2:#1A1A1A;
  --royal:#2E45FF;        /* Queen of Jacks blue */
  --royal-lift:#5568FF;   /* for small text on near-black */
  --royal-raise:#6B7BFF;  /* for small text on --raise */
  --bone:#F2F0EC;
  --bone-dim:#8C877F;
  --hair:rgba(242,240,236,.13);
  --f-disp:'Playfair Display',Georgia,serif;
  --f-body:'LT Museum','Lora',Georgia,serif;
  --f-ui:'Inter',system-ui,-apple-system,sans-serif;
}
```

**The three blues are one colour.** `--royal-lift` and `--royal-raise` exist only
because contrast against different surfaces demands it. Treat them as
accessibility variants, never as a three-colour palette. The measured ratios are
in `DESIGN.md` and they are tight: `--royal-lift` on `--void` is 4.54:1 against a
4.5 floor.

There is no spacing scale token. Spacing is written inline, usually as
`clamp()`. Do not invent a scale and refactor to it.

**`DESIGN.md` in the repo root is the semantic companion to this file** — the
same system described for a screen generator, with the reasoning behind each
rule. Keep the two in sync when you change a token.

---

## 2. Component library

**There isn't one.** No React, no Vue, no web components, no Storybook.

What plays the role of components is a set of module-scope functions in the
render `<script>` of `index.html` that build DOM nodes from `CONFIG`:

| Function | Builds |
| --- | --- |
| `artEl(item, full)` | an `<img>` with WebP/JPEG fallback, dimensions, srcset on the hero |
| `renderWall()` | the 28-tile gallery wall |
| `renderHeroArt()` | the hero artwork |
| `renderText()` | everything language-dependent: `[data-t]` text, filters, projects, tiers, timeline |
| `openLb` / `drawLb` / `closeLb` / `stepLb` | the lightbox |
| `observeReveals` / `stagger` | scroll reveals |
| `trackCurrentSection()` | nav scroll-spy |
| `setNav(open, refocus)` | the mobile menu |
| `syncStructuredData()` | writes JSON-LD from `CONFIG` |

Boot is five calls at the bottom of the file, in order:

```js
renderHeroArt();
renderWall();
renderText();
syncStructuredData();
trackCurrentSection();
```

`renderText()` must run after anything that clones `[data-t]` nodes — the mobile
menu clones the bar nav before boot for exactly this reason.

---

## 3. Frameworks, libraries, build

**None of any kind.** No `package.json`. No bundler. No transpiler. No
post-processor. No lockfile.

The only external request the page makes is one combined Google Fonts
stylesheet, loaded non-blocking:

```html
<link rel="stylesheet" media="print" onload="this.media='all'"
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500&family=Lora:wght@400&display=swap">
<noscript><link rel="stylesheet" href="…"></noscript>
```

Only the weights actually rendered are requested. If you change typography,
re-audit computed styles and update the request in both directions.

The build-adjacent scripts live in `tools/`, are run by hand, and are never part
of a deploy. They need `Pillow` and `numpy` locally; the site itself still ships
nothing.

| Script | Does |
| --- | --- |
| `add-artwork.py` | the whole ingest: originals (or a whole folder) → 1600px JPEG + 760px thumb, then calls the two below |
| `make-webp.py` | regenerates the WebP derivatives |
| `dims.py` | rewrites the `DIMS` map **and the wall's reserved height** in `index.html`, both from the real pixels |
| `make-og-card.py` | redraws `images/og-card.jpg`, the 1200x630 social card |
| `verify.mjs` | drives Chromium over the whole site and runs every check in §10 |

`add-artwork.py` is the one to reach for. Adding art by hand means four steps and
the last two, `DIMS` and the wall reserve, fail silently: a wrong number throws
no error, it just puts the layout shift back. It takes a folder, skips files
that are byte-identical to one already in the batch, and **refuses** a batch
where two different files slugify to the same name rather than let one
overwrite the other. `--dry-run` shows the plan without writing.

**Do not add a dependency.** If a task seems to need one, the task is wrong for
this repo or the answer is a dozen lines of vanilla code.

---

## 4. Asset management

```
images/           28 full-size JPEG (1600px longest side) + 25 WebP
images/thumb/     28 thumbnails (760px) + 27 WebP
```

Four files have no WebP because WebP came out larger than the JPEG. That is
intentional; the `onerror` chain handles it.

**Serving logic** (in `artEl`): feature-detect WebP once, swap the extension per
image, fall back to `.jpg` on error, then to a typographic placeholder plate.

```js
const WEBP_OK = (() => {
  try { return document.createElement('canvas')
    .toDataURL('image/webp').indexOf('data:image/webp') === 0; }
  catch(e){ return false; }
})();
```

**`DIMS`** is a generated map of every image's real pixel dimensions, full and
thumb. It drives three things: the `width`/`height` attributes that keep CLS at
0, the hero `srcset`, and the tile `aspect-ratio` via a `--ar` custom property.
**Artwork is never cropped** — the tile takes its proportion from the file.

`srcset` must be assigned **before** `src`, or the browser fetches twice.

**Reserved height is load-bearing.** Every string on the page is written by JS
from `CONFIG`, and that script sits at the end of a large file. On a slow line
the browser paints the skeleton with every text box at zero height, then the
script inflates them and shoves the page down. Measured on a 400 kbps line this
was **CLS 0.96**. The fix is reserving the space in CSS up front:

| Element | Reserve | Why that number |
| --- | --- | --- |
| `.hero h1` | `2.12em` | two lines; measured constant across every `clamp()` value |
| `.sec-title` | `1.06em` | one line, same trick |
| `.bar` | `73 / 71 / 64px` | per breakpoint; empty it is 54px |
| `.btn` | `44px` | also the minimum touch target |
| `.hero-art .shot` | `aspect-ratio` | was 14px empty, 605px full: the single biggest shift |
| `.hero h1` | `max-width:10.5em` | forces two lines at every size, so the 2.24em reserve is always exact |
| `.wall` | a `calc()` | see below |

The wall's reserve is a formula, not a constant, because the right height
changes with viewport width: the sum of every piece's height-over-width ratio
(**31.8** for these 28) times one column's width, over the column count, plus
margins. Aim **1-5% under** the real height. Under-reserving settles by a few
pixels; over-reserving opens a gap that closes again, which counts just the
same. Result after all of it: 0.006 throttled, 0 unthrottled.

**The three coefficients are generated — never hand-edit them.** They used to
be the repo's sharpest footgun: change the gallery, forget the 31.8 and the 28,
and the CLS quietly comes back. `dims.py` now derives all three from the thumb
ratios in `DIMS` and the length of `CONFIG.artworks`, and rewrites the CSS. Run
it after any change to the gallery, not just after adding files.

**Source order is part of the reserve.** The hero artwork is written *before*
the copy in the markup, and `order` swaps them back on desktop. It used to be
the other way round, with `order:-1` lifting the art above the text on phones.
On a slow line that shifted 0.33: the browser painted the copy at the top while
still streaming, then the parser reached the art, `order` put it above, and the
copy dropped 452px. It only reproduced in roughly one load in three, depending
on when the first paint landed, so **measure a shift like this several times
before believing it is gone.** Nothing you reserve in CSS helps against an
element the parser has not created yet; the fix is to put it earlier in the
file.

**`images/og-card.jpg` is not artwork.** It is the 1200x630 card unfurlers show
when the link is shared, drawn in `tools/og-card.html` and screenshotted by
`tools/make-og-card.py`. It has no thumbnail and no WebP on purpose, and both
`dims.py` and `make-webp.py` skip it by name. Never add it to `CONFIG.artworks`
or it lands in the gallery and the ImageGallery JSON-LD.

No CDN. No image service. Netlify serves the files as they are.

---

## 5. Icon system

**There is no icon system and no icon library.** Do not add one.

Icons are four things, in order of preference:

1. **Text glyphs in markup** — `‹` `›` `×` for the lightbox controls, `◐` for
   the theme toggle, `↗` on outbound links, `→` on internal ones. Each carries
   an `aria-label`.
2. **The 墨 seal** — a CJK character set in Playfair on a Royal square. It is the
   logo. Never restyle, recolour, or re-animate it.
3. **CSS-drawn geometry** — the mobile menu hamburger is two pseudo-elements that
   rotate into an X. No SVG.
4. **Inline SVG data URIs** — exactly two in the whole repo: the favicon, and the
   `feTurbulence` film grain. Both are backgrounds, not markup.

Any button that renders a glyph **must set `font-family`**. Five of them once
didn't and fell through to the browser default, rendering in Arial.

---

## 6. Styling approach

One `<style>` block per file. Plain selectors, no methodology, no preprocessor.

**The system draws lines, not boxes.** `1px solid var(--hair)` at 13% opacity is
the structural device. There is **no elevation shadow anywhere** — the only two
`box-shadow` declarations in the file are inside a `@keyframes` that pulses a
ring out of the timeline's upcoming-event dot. Do not introduce elevation,
glassmorphism, or a card with a border *and* a shadow.

**Radius is a documented three-value system**, and mixing outside it is a bug:

| Radius | Used by |
| --- | --- |
| `2px` | buttons, skip link — near-square, printed |
| `8px` | the 墨 seal only |
| `999px` | chips, knobs, dots, lightbox controls |

**Responsive** — four media queries, no more:

```css
@media (max-width:980px)                        /* grids to 1 or 2 columns   */
@media (min-width:621px) and (max-width:780px)  /* nav condenses; the full
                                                   bar needs 744px           */
@media (max-width:620px)                        /* bar links → mobile menu   */
@media (prefers-reduced-motion:reduce)          /* every effect off          */
```

Type and spacing scale with `clamp()` rather than breakpoints wherever possible.

**Motion:** two house curves — `cubic-bezier(.2,.7,.3,1)` for reveals,
`cubic-bezier(.16,.84,.36,1)` for the clip-path title wipe. `cubic-bezier(.2,1.5,.4,1)`
is reserved for the seal stamp. Plain `ease` is correct for colour transitions.
**Never `transition: all`** — name the properties. Animate only `transform` and
`opacity`. There is not one `window` scroll listener in the codebase and there
must not be; use `IntersectionObserver`.

Every interactive control answers a press with `transform: scale(.97)` over
120ms, and every effect collapses under `prefers-reduced-motion`.

---

## 7. Project structure

```
index.html      the whole single-page site (CONFIG + CSS + markup + render JS)
projeto.html    per-project detail page, reads ?p=sok|tr|pamp
404.html        standalone, self-contained
robots.txt
sitemap.xml     four URLs; update lastmod when content changes
images/         + images/thumb/
comissoes/      the commission system; nothing here is served
  README.md       how site, Notion and email fit together
  email-onboarding.md  the acceptance email, PT and EN
tools/          all run by hand, none part of the deploy
  add-artwork.py  originals or a folder → full + thumb + webp + DIMS, in one command
  make-webp.py    regenerates the WebP derivatives
  dims.py         rewrites the DIMS map and the wall reserve from the real pixels
  make-og-card.py redraws images/og-card.jpg from og-card.html
  og-card.html    the social card's layout; not served, just the mould
  verify.mjs      runs §10 against a real browser; exit 1 if anything fails
DESIGN.md       the design system in semantic form
CLAUDE.md       this file
```

No feature folders, no `src/`, no routing. `index.html` is organised top to
bottom as: meta and JSON-LD → `CONFIG` → `<style>` → markup → render `<script>`.

**`projeto.html` holds a slice of `CONFIG`, not a copy.** It used to hold the
whole thing, and the copy drifted: commission prices, the four stages and the
2-4 week turnaround were still sitting in it long after §9.4 took them off the
site. They rendered nothing, but they shipped in the source Netlify serves.
It now carries only what that page reads: `artistName`, `realName`, `projects`,
and `i18n.{en,pt}.projects`. Those four still have to match `index.html`.
Nothing else belongs there, so nothing else can go stale.

---

## 8. Integrating a Figma design

Honest assessment first: **this repo is a poor target for an automated
Figma-to-code pipeline.** There is no component to map a Figma component onto,
no token file to write variables into, and no build step to run a transform. The
MCP tools that read a Figma file are still useful; the ones that generate code
have nowhere to put it.

What actually works:

1. **Pull the design context** (`get_design_context`, `get_variable_defs`,
   `get_screenshot`) to see intent and values.
2. **Hand-translate to the existing system.** Map Figma variables onto the twelve
   CSS custom properties. If a Figma value has no token, ask whether the token
   should exist before adding a thirteenth.
3. **Write vanilla CSS into the one `<style>` block**, and any new content into
   `CONFIG`, never hardcoded into markup.
4. **Reject, out of hand:** Tailwind classes, React/JSX output, a `tokens.json`,
   an icon package, `styled-components`, or a `package.json`.
5. **Download assets** (`download_assets`) anywhere, then run
   `python3 tools/add-artwork.py <ficheiro|pasta>` — it does the resize, the
   WebP, the `DIMS` entry and the wall reserve. Filling `CONFIG` stays manual,
   on purpose: the script prints the lines with `label` and `cat` left blank,
   because it cannot see what is in the picture and must not guess (§9.5).

A Figma file will not know about the constraints in §9. Those outrank it.

---

## 9. Hard constraints — business and legal, not style

These are Frede's decisions. They outrank every design skill, every Figma file,
and every suggestion in this document.

1. **Fan art is never sold.** 10 of the 28 works are fan art (Chainsaw Man,
   Attack on Titan, Jujutsu Kaisen, One Piece) and carry `cat:"fanart"`. They may
   be displayed, never sold as prints or merch. Any commerce affordance filters
   to `character` and `sketches`. The ImageGallery JSON-LD deliberately attaches
   no offer to any artwork.
2. **No location anywhere.** No city, no country, in copy, meta, alt text or
   schema. The single exception is event venues in the timeline, which are facts
   about those events.
3. **Illustrator first.** Architecture training appears exactly once, in About,
   and only as a subordinate clause about method. Never in a tagline, meta
   description or schema. The bio is first person and three short paragraphs:
   what he draws, the one architecture line, and ink before colour.
4. **No commission terms and no prices on the site.** The section shows the four
   formats and nothing else: no prices, no stages, no turnaround, no shop links,
   no payment split, no percentages, no deposit language, in any wording. The
   price is not in the markup, not in `CONFIG`, and not in the JSON-LD, because
   that block is what Google prints in the results. Prices live in exactly two
   places: the Shopify product and `Guita_Ink_Comissoes_PT.pdf`. The visitor
   writes first and the number comes back by email, with the PDF. See
   `comissoes/README.md`.
5. **Nothing invented.** Projects with no artwork render a typographic plate on
   purpose. Never substitute an unrelated illustration, never write copy
   asserting anything unverifiable from `CONFIG`. Project copy comes from what
   Frede says about the job, not from what the artwork looks like: the Tokyo
   Revengers card said "promotional cover illustrations" until he explained it
   is a monthly series that recasts each cover with people from the community.
6. **`CONFIG` is the contract.** Copy, prices, image list, timeline and links live
   there. New content goes in `CONFIG`.
7. **Full EN/PT parity.** Every `data-t` key resolves in both languages. Verify by
   running a script, not by reading.
8. **`prefers-reduced-motion` disables every effect.** Extend the two media blocks
   for anything you add.
9. **No em-dashes in user-facing copy.** Source comments are exempt.

---

## 10. How to verify

The standing instruction from Frede: *"Verify your work by running actual checks
— parse the JS, confirm every referenced image exists, confirm i18n parity — not
by reading the diff and assuming."*

**`node tools/verify.mjs` runs all of this.** It serves the folder, drives
Chromium and exits 1 if anything fails, so it can gate a deploy. It needs no
install: Playwright and Chromium are already on the machine, and it blocks the
Google Fonts request so it works offline. `--rapido` skips the throttled CLS
runs (the slow part); `--shop-aberto` also tests the shop with `shopOpen:true`,
on a temporary copy.

It is checked against planted bugs, not just against a green repo: breaking
i18n parity, adding an em-dash, putting a commission price back in `CONFIG`,
forcing horizontal overflow and corrupting one `DIMS` number are all caught.
When you fix a bug, add a test there rather than testing it by hand again.

The checks themselves, and why each one exists:

- **JS parses** — extract the non-JSON-LD `<script>` blocks and `node --check`.
- **No tile is cropped** — compare each `img.naturalWidth/naturalHeight` against
  its rendered box. **Force lazy images to load first**, or most of them report
  `naturalWidth: 0` and pass by default.
- **CLS is 0** on load. A scripted `openLb()` injects a shift with no
  `hadRecentInput` and will read as a false regression; measure without it.
- **Contrast** against computed colours in both themes.
- **EN/PT parity** across every `data-t` key.
- **No horizontal overflow** — sweep widths, don't spot-check. The 621–743px
  band was broken for months and 390/768/1440 all looked fine.
- **Reduced motion** — assert `transitionDuration` is `0s` and no `@keyframes`
  is running, on **every** element including `<body>`, in all three pages.
  Do not test `transition-property`: `all` is its initial value, so an element
  with no transition at all reports `all` and a naive check flags the whole
  document. Four real leaks hid behind that false positive for months.
- **`file://` still works**, not just HTTP.

When a measurement contradicts your expectation, suspect the harness before the
site, and say so when it turns out to be the harness.

---

## 11. Working with Frede

He is not a developer and is learning this as he runs the business. Explain the
reasoning as you go. Make surgical, documented edits rather than rewrites — the
inline comments are in Portuguese and are part of the codebase; match them.

If you think something he decided is wrong, say so directly and say why. Do not
quietly work around it.

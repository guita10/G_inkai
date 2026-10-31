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
(`index.html`, `projeto.html`, `loja.html`, `404.html`) plus an images folder.
`index.html` is about 1,760 lines and contains a `CONFIG`
object, one `<style>` block, the markup, and the render JavaScript. It must keep
working when opened directly from disk over `file://`. Content lives in `CONFIG`
and is rendered by plain DOM functions. Anything that reads like "add a
dependency", "extract a component", or "run a build" is wrong for this repo.

---

## 1. Token definitions

**Where:** one `:root` block at the top of the `<style>` in `index.html` (the
day, the default), with a `[data-theme="dark"]` block overriding a subset (the
night). `projeto.html`, `loja.html`
and `404.html` carry their own copies.

**Format:** plain CSS custom properties. No JSON, no Style Dictionary, no
transformation pipeline. Twelve tokens total.

```css
:root{
  --void:#F3F7F8;         /* the field: cloud white (night: #081A28) */
  --raise:#FFFFFF;        /* raised surface (night: #0D2435) */
  --raise-2:#E8EEF0;      /* (night: #122D42) */
  --sky:#0E5CAB;          /* the accent: top of the sky (night: #77D8F1) */
  --sky-lift:#0E5CAB;     /* small text on --void */
  --sky-raise:#0E5CAB;    /* small text on --raise */
  --bone:#0E2233;         /* text: the silhouettes' night blue (night: #E6F4F6) */
  --bone-dim:#56646C;     /* (night: #8FA6B2) */
  --hair:rgba(14,34,51,.13);
  --f-disp:'Playfair Display',Georgia,serif;
  --f-body:'LT Museum','Lora',Georgia,serif;
  --f-ui:'Inter',system-ui,-apple-system,sans-serif;
}
```

**The site is the sky, and the accent is one colour.** In October 2026 (the
second change that month) Frede chose two of his originals from the Survival of
Kings universe as the base of the site: the sky over a hill with two
silhouettes, and the line-up of seven characters (`images/bg/`). The palette
is measured off them: day is cloud white, night-blue text and the blue at the
top of the sky, `#0E5CAB`; night is the sky's dark blue-teal, cloud-white text
and the cyan at the horizon, `#77D8F1`. **Day is the default**; a one-line
script at the top of each page sets `data-theme="dark"` when the phone prefers
dark (at the top so a dark-mode phone never flashes day first). The toggle
still overrides both ways; `404.html` uses a plain `@media` instead.

The accent replaced the frog's green `#80AB5C` (which had replaced the Royal
blue `#2E45FF`), and the tokens were renamed `--frog*` → `--sky*` so no blue
is called frog. **The frog coin stays green**: it is Frede's drawing, its
green lives in the SVG, and it is not a theme colour. `--sky-lift` and
`--sky-raise` are accessibility variants, not a palette; today they equal
`--sky` in each theme. **Text on the accent is `var(--void)`** in both themes
(6.21:1 day, 10.83:1 night). **Text over the sky is white** in both themes, on
a veil of the sky's own blue behind the text block; `verify.mjs` measures the
pixels behind it. The measured ratios are in `DESIGN.md`.

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
| `frameEl(item, i)` | one wall tile (a 4:5 frame that opens the lightbox) |
| `renderWall()` | the gallery wall, one tile per `CONFIG.artworks` entry |
| `renderText()` | everything language-dependent: `[data-t]` text, filters, projects (including the wide card of the featured project, `CONFIG.featured`), tiers, timeline |
| `openLb` / `drawLb` / `closeLb` / `stepLb` | the lightbox |
| `observeReveals` / `stagger` | scroll reveals |
| `trackCurrentSection()` | nav scroll-spy |
| `setNav(open, refocus)` | the mobile menu |
| `syncStructuredData()` | writes JSON-LD from `CONFIG` |

Boot is four calls at the bottom of the file, in order (`renderHeroArt()`
went with the hero artwork, October 2026: the hero is now the sky, in CSS):

```js
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
| `make-frog-logo.py` | traces the frog in `tools/frog-source.jpg` into vector shapes, ink by ink (it does not redraw it), sets it on a `--frog` coin, writes `images/frog-logo.svg`, the favicon in all four pages, and `tools/frog-logo-1024.png` for use off the site. Needs `potracer` |
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
images/           70 full-size JPEG (1600px longest side: 37 artworks, 3 project
                  covers, Tokyo Revengers vols 2-4 (proj-tr-2/3/4) and five PAMP
                  identity pieces (proj-pamp-2..6), both on their project pages
                  only, and the One Piece Deck: 22 cards plus the card back,
                  on the deck's project page; the Ace of Hearts is the deck's
                  cover and its one card on the wall) + og-card.jpg, and a WebP for most (see below)
images/thumb/     70 thumbnails (760px) + WebP
images/merch/     four 800x800 shop-card photos (loja.html). Not artwork: dims.py
                  and make-webp.py only read images/ itself, so they skip it
images/bg/        Survival of Kings originals used as decoration (Oct 2026),
                  not artwork in the gallery (dims.py and make-webp.py only
                  read images/ itself):
                  sky-900/1920 (.webp + .jpg): behind the hero and the shop's
                    page head
                  cast-cut-1000/1920: the seven, cut out by Frede (no
                    background), under the commissions on both pages
                  knight-1000, boy-1000, archer-900 (.webp) + a small .png
                    each as the fallback: Frede's cut-outs, trimmed to the
                    figure and nothing else changed
images/frog-logo.svg
                  the logo: the frog, traced to vector, on a green coin. Used by
                  the bar and the social card. Not artwork; SVG, so dims.py and
                  make-webp.py (JPEG only) never see it. Made by
                  tools/make-frog-logo.py
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
| `.hero` | `min-height:min(82svh,780px)` | the sky band is a fixed height, so text arriving after the JS moves nothing below |
| `.hero-copy` | `calc(2.24 × h1 + 144px)` | the text block is centred in the sky; without the reserve each line arriving pulled the title up |
| `.hero h1` | `max-width:10.5em` | forces two lines at every size, so the 2.24em reserve is always exact |
| `.wall` | a `calc()` | see below |

The wall's reserve is a formula, not a constant, because the right height
changes with viewport width. Since the September 2026 uniform grid every tile
is 4:5, so the height is simply rows × (1.25 × one column's width) + the gaps
between rows, and the CSS stores only the row count (`--wall-rows`, three
places: 4, 3 and 2 columns). The wall opens with the first
`CONFIG.wallPreview` pieces (12); the rest appear on a click, which is user
input and does not count as layout shift. The featured project card at the
top of Projects reserves its own height too (`.proj-feat` min-height: half the
content width on desktop, the cover's full height on a phone).

**Uniform tiles never crop.** Tiles are 4:5 because 17 of the 29 wall pieces
are exactly 4:5; everything else is fitted whole with `object-fit:contain`
and sits on `--raise` like a mat. `verify.mjs` accepts a tile only if its
image either matches the frame's ratio or is `contain`; switching to `cover`
is caught (tested against that planted bug). The covers in the row of project cards follow the same rule: one fixed height, the cover whole inside it (`contain`), so the three titles line up; `verify.mjs` checks both. Aim **1-5% under** the real height. Under-reserving settles by a few
pixels; over-reserving opens a gap that closes again, which counts just the
same. Result after all of it: 0.006 throttled, 0 unthrottled.

**The three coefficients are generated — never hand-edit them.** They used to
be the repo's sharpest footgun: change the gallery, forget the ratio sum and the count,
and the CLS quietly comes back. `dims.py` now derives the row counts from
`CONFIG.artworks` and `CONFIG.wallPreview` and rewrites the CSS. Run it after
any change to the gallery, not just after adding files.

**Source order is part of the reserve.** (The hero artwork this paragraph is
about left in October 2026; the lesson stands for anything placed with
`order`.) The hero artwork was written *before*
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

**The One Piece Deck on the wall is one card only**: the Ace of Hearts, as a
way in (Frede's request). It is also the deck's project cover. The other
cards, and the card back (`op-deck-back.jpg`, first in the deck's `gallery`),
are on the project page, in natural deck order: the back, then suit by suit
(spades, hearts, diamonds, clubs), each Ace, 2, Jack, Queen, King, then the two
Jokers. The Ace of Hearts appears again in its hearts slot, on purpose, so that
suit reads complete under the cover. Each ace carries its king's flag, which is
how the suits were checked: Shanks spades, Luffy hearts, Roger diamonds,
Blackbeard clubs.

No CDN. No image service. Netlify serves the files as they are.

---

## 5. Icon system

**There is no icon system and no icon library.** Do not add one.

Icons are four things, in order of preference:

1. **Text glyphs in markup** — `‹` `›` `×` for the lightbox controls, `◐` for
   the theme toggle, `↗` on outbound links, `→` on internal ones. Each carries
   an `aria-label`.
2. **The frog coin** — Frede's own drawing, the logo since October 2026 (it
   replaced the 墨 seal). The drawing is traced into vector shapes, one per ink,
   and set on a coin of the frog's green: the body shares the coin's green, so his
   black line does the drawing, like a stamp. A circle keeps one footprint in
   the bar, the browser tab, Shopify and an Instagram avatar. Never redraw,
   recolour, or re-animate the frog (its coin is the frog's own green,
   `#80AB5C`, in the SVG: the site's blue never touches it); if Frede redraws it, replace
   `tools/frog-source.jpg` and run `tools/make-frog-logo.py`, then
   `tools/make-og-card.py`. A new colour in the drawing has to be added to
   `TINTAS` in the script, measured off the drawing, or the nearest ink takes
   it (the eye's ochre half once came out pink).
3. **CSS-drawn geometry** — the mobile menu hamburger is two pseudo-elements that
   rotate into an X. No SVG.
4. **Inline data URIs** — the `feTurbulence` film grain (SVG, the only inline
   SVG in the repo) and the favicon (a 64x64 PNG of the frog, written into all
   four pages by `make-frog-logo.py`; inline so `404.html` stays self-contained
   at any path).

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

**Survival of Kings pictures are the decoration, and only these**: all CSS
backgrounds (no `<img>`, no CONFIG entry: they are not the portfolio), WebP
through `image-set()` with a JPEG/PNG line before it as the fallback.

- **The sky** behind the hero and the shop's page head, full-bleed by negative
  margin plus padding inside `.wrap`. Text over it is white, on the veil.
- **The cast** (`cast-cut`, no background) under the commissions on both
  pages, below the text, never behind it. One file for day and night.
- **Three characters (`.cut`)**, each a decorative `<div aria-hidden>` whose
  `::before` holds the drawing: the knight at the end of About (index), the
  white-haired boy in Contact (index), the archer in the shop's sky band
  (loja). The rules they follow:
  - **Each rises from the side its drawing is cut on**: the knight is cut
    left and bottom, so he sits flush with the screen's left edge
    (`--bleed`); the boy is cut right and bottom, so the right edge; the
    archer only at the bottom. Never flip or recrop a drawing to make it fit
    elsewhere.
  - **Each stands on a hairline**: the next section's border, the footer's,
    or the bottom of the sky band. `#about` and `#contact` have no bottom
    padding for that reason; the column beside the figure keeps it.
  - **Never behind text.** The knight and the boy have their own grid cells;
    the archer is the one absolute figure, in the band's right corner, and is
    hidden at 620px and below. `verify.mjs` sweeps 390 to 1600px and fails if
    any figure's box crosses any text box.
  - `aspect-ratio` reserves each stage, so nothing shifts when it loads.
  - **The entrance**: the drawing rises 14% out of its own stage (overflow
    hidden) with the reveal curve, once, when the stage scrolls in (the
    archer on page load). Under reduced motion it is simply there.

Any text placed over a picture needs a veil and the pixel check in
`verify.mjs`.

**Radius is a documented two-value system**, and mixing outside it is a bug:

| Radius | Used by |
| --- | --- |
| `2px` | buttons, skip link — near-square, printed |
| `999px` | chips, knobs, dots, lightbox controls |

(`8px` was the 墨 seal's alone; it went with the seal.)

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
is reserved for the logo stamp. Plain `ease` is correct for colour transitions.
**Never `transition: all`** — name the properties. Animate only `transform` and
`opacity`. There is not one `window` scroll listener in the codebase and there
must not be; use `IntersectionObserver`.

Every interactive control answers a press with `transform: scale(.97)` over
120ms, and every effect collapses under `prefers-reduced-motion`.

---

## 7. Project structure

```
index.html      the whole single-page site (CONFIG + CSS + markup + render JS)
projeto.html    per-project detail page, reads ?p=sok|tr|pamp|deck
loja.html       the selling page: commissions (four formats, no prices) and,
                once shopOpen is true, the merch. Reads ?lang=pt|en. Its
                footer links the Livro de Reclamações Eletrónico, required
                by law for selling online in Portugal; verify.mjs checks it
404.html        standalone, self-contained
robots.txt
sitemap.xml     six URLs; update lastmod when content changes
images/         + images/thumb/, images/merch/, images/bg/ (the two backgrounds)
comissoes/      the commission system; nothing here is served
  README.md       how site, Notion and email fit together
  email-onboarding.md  the acceptance email, PT and EN
marca/          the brand sheet for printers and collaborators; not served
  Guita_Ink-brand-sheet.pdf  one A4 page: the frog coin, the palette (HEX,
                  RGB, approximate CMYK), the three faces, the rules
  ⚠️ both predate the sky (Oct 2026): they still show the frog green as the
                  accent. Redo them with the sky palette.
  brand-sheet.tpl.html  its source. The fonts (Google Fonts woff2, base64)
                  and images/frog-logo.svg are pasted in at /*FONTS*/ and
                  /*LOGO*/, then Chromium prints it to A4. Redo it when a
                  token or the logo changes
politicas/      the shop's policies, PT and EN; nothing here is served
  politicas-loja.md  source of the texts pasted into Shopify (returns,
                  shipping, terms, contact, the privacy contact line). No
                  prices, no shipping amounts: those stay in Shopify
tools/          all run by hand, none part of the deploy
  add-artwork.py  originals or a folder → full + thumb + webp + DIMS, in one command
  make-webp.py    regenerates the WebP derivatives
  dims.py         rewrites the DIMS map and the wall reserve from the real pixels
  make-og-card.py redraws images/og-card.jpg from og-card.html
  make-frog-logo.py the frog coin logo (SVG) and the favicon, from frog-source.jpg
  frog-source.jpg the frog as Frede drew it; not served
  frog-logo-1024.png the coin as a big PNG, for Instagram, Shopify, email; not served
  og-card.html    the social card's layout; not served, just the mould
  verify.mjs      runs §10 against a real browser; exit 1 if anything fails
DESIGN.md       the design system in semantic form
CLAUDE.md       this file
.claude/skills/ skills for Claude sessions; not served
  grill-me/       "grill me": one multiple-choice question at a time about a
                  plan, until every decision is made. From
                  github.com/RobMitt/grill-me-skill, copied unchanged
  ui-ux-pro-max/  a searchable UI/UX guidance database (Python, standard
                  library only, no network). From github.com/nextlevelbuilder/
                  ui-ux-pro-max-skill at 9a3f14f, copied unchanged plus its
                  MIT LICENSE. Its SKILL.md calls the script through
                  ${CLAUDE_PLUGIN_ROOT}, which is unset here: run
                  `python3 -B .claude/skills/ui-ux-pro-max/scripts/search.py`
                  from the repo root. Its answers are generic advice and rank
                  BELOW this file and DESIGN.md: asked about this site it
                  proposed a blue accent, white text on the CTA, Swiss
                  minimalism and a spacing scale, all wrong here. Never take
                  from it an icon library, GSAP, Tailwind, a stack, a palette
                  or fonts, and never run it with --persist: DESIGN.md is the
                  design system, and a design-system/MASTER.md would be a
                  second one
```

No feature folders, no `src/`, no routing. `index.html` is organised top to
bottom as: meta and JSON-LD → `CONFIG` → `<style>` → markup → render `<script>`.

**Home page order**: hero → projects (the featured project, `CONFIG.featured`,
as a full-width card with its cover, text, a strip of its series and its
links; the others in a row below) → selected work (one uniform grid, no
project highlighted; the Survival of Kings cast sits after the other
originals on purpose) → commissions band → about (bio beside the timeline) →
contact. The timeline is not its own
section any more; its `id="timeline"` sits on the block inside About, so old
`#timeline` links still land. `DESIGN.md` §5 has the reasoning.

**A project can be a series.** `CONFIG.projects[].src` is the cover: it is what
the card on `index.html` shows and what unfurlers get as `og:image`. An optional
`gallery: []` holds the rest of the series, in order, and `projeto.html` renders
cover-then-gallery as a stack. Without `gallery` the page behaves exactly as it
always did, one image. Every image in both fields gets its real dimensions from
`PROJ_DIMS`, which `dims.py` generates — with a series the zero-height-box
problem multiplies per image, so this matters more here than it did with one.

**`projeto.html` holds a slice of `CONFIG`, not a copy.** It used to hold the
whole thing, and the copy drifted: commission prices, the four stages and the
2-4 week turnaround were still sitting in it long after §9.4 took them off the
site. They rendered nothing, but they shipped in the source Netlify serves.
It now carries only what that page reads: `artistName`, `realName`, `projects`,
and `i18n.{en,pt}.projects`. Those four still have to match `index.html`.
Nothing else belongs there, so nothing else can go stale.

**`loja.html` is where the site sells, and it owns what only it uses.** The
merch list and its prices, the Shopify address, the drop name, the shop copy
and the commission email template live there and nowhere else; `verify.mjs`
fails if `merch`, `shop`, `shopDrop` or `merchCollection` reappear in
`index.html`. The home page keeps a short commissions band that links to it.
The fields both pages read have to match, and `verify.mjs` checks them:
`artistName`, `realName`, `email`, `instagram`, `commissionsOpen`, `tiers`,
`shopOpen`, and the copy keys `commTitle`, `commOpen`, `commClosed`,
`commIntro`, `navShop`, `navComm`, `tiers`. That is why launching the shop is
`shopOpen:true` in **both** files. **The shop launched on 30 September 2026**
with four products fulfilled by Printful (t-shirt, hoodie, art print, stickers).
A merch entry with `hold: true` exists in Shopify but is not published, so its
card is hidden (the limited edition and the keychain); lifting a hold and
publishing the product go together, and `verify.mjs` checks one card per
unheld product. Links from the home page carry the chosen
language as `?lang=pt`, and the page's back links carry it home again.

**People buy on `loja.html`, not on the Shopify storefront.** Each merch card
has its options (design, colour, size) and an "Add to bag" button; the bag
lives on the page, and "Checkout" opens Shopify's checkout with the bag
already in it, through a cart permalink: `<shop>/cart/ID:QTY,ID:QTY`. Only
the payment leaves the site: Shopify takes payment on its own checkout only,
and that order is what Printful fulfils. No request goes to Shopify before
the click, so the page still works offline and over `file://`, and no
Shopify script is loaded. The bag is kept in `localStorage` for two days,
every access in `try/catch`. The size has no default on purpose (a
pre-selected S is a wrong-size shirt in the post).

That needs every variant's Shopify ID, in `CONFIG.merch[].variants`, in
Cartesian order of `opts` (first option slowest, the order Shopify lists
them). **The IDs are copies.** If Printful re-syncs a product and Shopify
issues new IDs, checkout opens without that item; after touching a product in
Printful, pull the IDs again. `verify.mjs` checks one unique ID per
combination, and checks the checkout link against one sample taken from
Shopify (T-shirt Monk / White / M = `60968526905678`); update that sample if
the IDs change. It also sweeps overflow on the shop in PT with a full bag:
"Escolhe" is wider than "Choose", and that combination once pushed the cards
past 320px while EN with an empty bag passed.

---

## 8. Integrating a Figma design

Honest assessment first: **this repo is a poor target for an automated
Figma-to-code pipeline.** There is no component to map a Figma component onto,
no token file to write variables into, and no build step to run a transform. The
MCP tools that read a Figma file are still useful; the ones that generate code
have nowhere to put it.

**There is now a Figma file**, built from this repo and kept deliberately thin:
`https://www.figma.com/design/EHXuNfm8pYQbyFiUDYLGUk` — "Guita_Ink — Sistema do
site". It holds the twelve tokens as Figma variables (each with `var(--name)`
code syntax), the nine text styles, and six components: Selo, Botão, Chip de
filtro, Distintivo, Moldura da parede, Cartão de merch.

**It is a mirror, not a source of truth.** `index.html` is still the only place
a token is defined. If the two disagree, the code wins and the Figma file is
what gets corrected. Three things it cannot represent, all worth knowing before
trusting it:

- **No `clamp()`.** Every type size in Figma is the clamp *maximum*, i.e. the
  wide-desktop value. The site scales; the Figma file does not.
- **No light/dark switch.** Frede's Figma plan allows one mode per variable
  collection, so the two themes are two folders of variables (`escuro/…`,
  `claro/…`) rather than two modes of one set. Swapping a frame's theme is
  manual.
- **Three pages, and no spacing tokens.** The plan caps pages at three, so
  every component shares one page. Spacing stays inline `clamp()` here, as §1
  says, so there is nothing to mirror.

Six fills in the Figma file are hard-coded hex rather than bound to a variable.
That is correct and matches the code: they sit on Royal or on the gallery
scrim, neither of which changes with the theme, so a theme-following token
would be wrong. Any *other* unbound fill is a bug.

**⚠️ The Figma file predates the frog and the sky (October 2026).** It still
holds the Royal blue variables and the Selo component. Until it is updated, trust it for
type and layout only, never for colour or the logo.

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

1. **Fan art is never sold.** 15 of the 37 works in `CONFIG.artworks` are fan
   art (Chainsaw Man, including Kon, the Fox Devil; Attack on Titan; Jujutsu
   Kaisen; One Piece, including the One Piece Deck's Ace of Hearts; Dragon
   Ball, the Duelo collab; and Clair and ArkEvil, confirmed by Frede) and carry
   `cat:"fanart"`. Fan art means *not an original*, whatever the label says:
   Kon, Duelo, Clair and ArkEvil sat in Character design until a review in
   September 2026. A collab is marked with
   `collab: true` **on top of** its category, never instead of it, so a fan-art
   collab stays fan art; the "Collabs" chip reads that flag. The whole One
   Piece Deck project is fan art; its other cards are on its page only. They may
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
4. **No commission terms and no prices on the site.** The commissions section
   (on `loja.html`; the home page only has a band linking there) shows the four
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
runs (the slow part); `--shop-aberto` also tests the shop with `shopOpen:true` (in `index.html` and `loja.html`),
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
- **Contrast** against computed colours in both themes. Text over a picture
  (the sky) is skipped there and measured in the pixels instead: the text is
  made transparent, each line's box is photographed, and white is compared
  with the 95th-percentile pixel behind it, day and night, at 1280 and 390px.
  Tested against a removed veil.
- **The characters never cover text**: each visible `.cut` box against every
  text box, 390 to 1600px, on the home page and the shop. Tested against an
  oversized archer.
- **EN/PT parity** across every `data-t` key.
- **No horizontal overflow** — sweep widths, don't spot-check. The 621–743px
  band was broken for months and 390/768/1440 all looked fine.
- **Reduced motion** — assert `transitionDuration` is `0s` and no `@keyframes`
  is running, on **every** element including `<body>`, in all three pages.
  Do not test `transition-property`: `all` is its initial value, so an element
  with no transition at all reports `all` and a naive check flags the whole
  document. Four real leaks hid behind that false positive for months.
- **No em-dashes**, checked twice: once over `CONFIG` and once over what the
  browser actually renders, including `alt` and `aria-label`. The second check
  exists because copy can be born in JavaScript and never pass through `CONFIG`
  — that is how an em-dash got into the alt text of an image series, where a
  screen reader reads it aloud. Source comments are exempt, so the walk skips
  `<script>` and `<style>`.
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

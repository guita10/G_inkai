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
night, **the default since 1 Nov 2026**), with a `[data-theme="light"]` block
overriding a subset (the day, on the ◐ toggle). `projeto.html`, `loja.html`
and `404.html` carry their own copies (404 is always dark: it has no toggle).

**Format:** plain CSS custom properties. No JSON, no Style Dictionary, no
transformation pipeline. Fourteen tokens total (twelve until the palette
below added `--lime` and `--hi`).

```css
:root{                    /* the night, the default */
  --void:#030407;         /* Midnight Black, the page (day: #F3F4F6) */
  --raise:#0E1015;        /* the mats behind artwork, the cards (day: #FFFFFF) */
  --raise-2:#181B21;      /* (day: #E6E8EC) */
  --sky:#1558C9;          /* Electric Cobalt, FILLED: buttons, seal (both) */
  --sky-lift:#6E9BF2;     /* cobalt as small text on --void (day: #1558C9) */
  --sky-raise:#6E9BF2;    /* cobalt as small text on --raise (day: #1558C9) */
  --bone:#EEF0F3;         /* the text (day: #030407) */
  --bone-dim:#9BA0AA;     /* (day: #565B64) */
  --hair:rgba(238,240,243,.13);
  --lime:#D8F454;         /* Acid Lime, FILLED only: highlights (both) */
  --hi:#D8F454;           /* highlight as a line or text (day: #1558C9) */
  --f-disp:'Shippori Mincho B1','Hiragino Mincho ProN','Yu Mincho',Georgia,serif;
  --f-body:'Zen Kaku Gothic New',system-ui,-apple-system,'Segoe UI',sans-serif;
  --f-ui:'Zen Kaku Gothic New',system-ui,-apple-system,'Segoe UI',sans-serif;
}
```

Plus two layout variables, which are not colour or type tokens: `--pad` (the
page's side margin, `clamp(16px,3vw,40px)`) and `--gut` (the one gutter
between columns, `clamp(24px,4vw,64px)`, since 1 Nov 2026: there were four,
and each section's second column started at a different x).

**Midnight Black, Electric Cobalt, Acid Lime** (1 November 2026, afternoon:
Frede's palette card). `#030407` and `#1558C9` are the card's codes; the
lime's code was cut off, and `#D8F454` is measured from its swatch (swap it
in the four token blocks if Frede sends the exact one). **The site opens
dark for everyone**: `<html data-theme="dark">` is in the markup and the old
"dark if the phone prefers it" script is gone; the toggle flips to light
and back (it does not remember). Cobalt replaced Royal everywhere, seal
included.

Each colour fails somewhere, so each has a job (ratios in `DESIGN.md` §2):

- **Cobalt is for filling** (buttons, the seal, the upcoming dot), with
  **`#FFFFFF` text on it** (6.42:1, both themes). As text on the black it
  fails (3.19:1); small cobalt text uses `--sky-lift`/`--sky-raise`, lifted to
  `#6E9BF2` at night.
- **Lime is for filling** too (the active filter, the OPEN and DROP badges,
  the timeline flag, the pre-order flag, selection), with **`#030407` text on
  it** (16.58:1). On the light page as text or a thin line it disappears
  (1.09:1), so it never is.
- **`--hi` is the highlight as a line or text** (the big email, the
  current-section mark, the upcoming year): lime at night, cobalt by day.
- Text on an accent is therefore a fixed colour, no longer `var(--void)`
  (that rule died with the light default: black on cobalt is 3.19:1).

History, so old comments make sense: Royal blue `#2E45FF` (September) → the
frog's green `#80AB5C` (early October) → the Survival of Kings sky (October)
→ ink and paper with `#0E5CAB`, day by default (31 October) → the same with
Royal back (1 November, morning) → Midnight Black / Electric Cobalt / Acid
Lime, night by default (1 November, afternoon). The tile caption band
(`#030407` / `#EEF0F3`) and the lightbox keep fixed colours (they sit on the
artwork, not on the page).

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
| `renderText()` | everything language-dependent: `[data-t]` text, `[data-ta]` screen-reader labels (`aria-label` from a CONFIG key), filters, projects (including the wide card of the featured project, `CONFIG.featured`), tiers, timeline |
| `openLb` / `drawLb` / `closeLb` / `stepLb` | the lightbox |
| `observeReveals` / `stagger` | scroll reveals |
| `trackCurrentSection()` | nav scroll-spy |
| `setNav(open, refocus)` | the mobile menu |
| `syncStructuredData()` | writes JSON-LD from `CONFIG` |

Boot is four calls at the bottom of the file, in order (`renderHeroArt()`
went with the hero artwork, October 2026). **The intro's name and big picture
are not written by the boot**: since 1 Nov 2026 a small inline script right
after the intro's markup fills `#heroName` from `CONFIG.realName` and picks
the piece from `CONFIG.heroArt`, so the browser requests the image while it
is still reading the page (it is the largest thing on the first screen). The
click that opens that piece in the lightbox is wired in the render script.

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

**The page makes no request to any other server.** Since 31 October 2026 the
fonts are files in the repo, `fonts/`: the Latin subset of Shippori Mincho B1
700 and Zen Kaku Gothic New 400 and 500 (SIL OFL, licences beside them). Each
page declares them with `@font-face` (`font-display:swap`) and preloads the
two most used:

```html
<link rel="preload" href="fonts/shippori-mincho-b1-700-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/zen-kaku-gothic-new-400-latin.woff2" as="font" type="font/woff2" crossorigin>
```

Why not Google Fonts: these are Japanese families, and Google's stylesheet
for them lists every slice of Japanese characters, 457 KB (118 KB
compressed) for a site that only shows Latin letters. `404.html` uses
absolute paths (`/fonts/...`) because it is served at any address. Only the
weights actually rendered are served; a new weight means a new file and a new
`@font-face` in every page.

The build-adjacent scripts live in `tools/`, are run by hand, and are never part
of a deploy. They need `Pillow` and `numpy` locally; the site itself still ships
nothing.

| Script | Does |
| --- | --- |
| `add-artwork.py` | the whole ingest: originals (or a whole folder) → 1600px JPEG + 760px thumb, then calls the two below |
| `make-webp.py` | regenerates the WebP derivatives |
| `dims.py` | rewrites the `DIMS` map **and the wall's reserved height** in `index.html`, both from the real pixels |
| `make-og-card.py` | redraws `images/og-card.jpg`, the 1200x630 social card |
| `make-logo.py` | draws the logo: the 墨 seal (the site's first logo, back since 31 Oct 2026), the character's real outline from Shippori Mincho B1 ExtraBold, white on a rounded Electric Cobalt `#1558C9` square; writes `images/logo.svg`, the favicon in all four pages, and `tools/logo-1024.png` for use off the site. Needs `fonttools` and network for the full font (the site only serves its Latin subset, which has no 墨) |
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
images/bg/        Survival of Kings originals, not artwork in the gallery
                  (dims.py and make-webp.py only read images/ itself):
                  cast-cut-1000/1920: the seven, cut out by Frede (no
                    background), beside the commissions on the home page and
                    beside their closing lines in the shop. The one Survival of Kings picture
                    still in the layout since 31 Oct 2026
                  sky-900/1920, knight, boy, archer: the sky and the three
                    cut-outs that framed the site in October. Out of the
                    layout since the ink redesign; kept, not referenced
images/logo.svg   the logo: the 墨 seal. Used by the bar of the three pages and
                  the social card. Not artwork; SVG, so dims.py and
                  make-webp.py (JPEG only) never see it. Made by
                  tools/make-logo.py
fonts/            the three font files (Latin subsets) and their OFL licences
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
| `.hero h1 .nm` | none (a `2em` min-height as a guard) | the name ("Frederico Guita", `CONFIG.realName`) is written by the inline script before first paint; always two lines, "Frederico" over "Guita", at a size that follows its column (`column / 5.1`: "Frederico" is 4.65em wide, so it fits, and the whole name is 7.48em, so it never fits on one line) |
| `.hero h1 .role` | `2.16em` | two lines at 1.08; `max-width:11em` keeps it from fitting on one, and no half is longer than 11em (the PT is the longest); `verify.mjs` sweeps 320 to 1600px in both languages, counting real text lines |
| `.hero-info` | `min-height:calc(24px + 48px)` (20 + 48 on phones) | it holds only the two buttons since the evening of 1 Nov 2026, and they are in the markup with a fixed 48px height, so this is a guard. When it also held the sentence and the facts, which came from the script at the end, they pushed it 119px up on a slow line (one load in three) until its whole height was reserved |
| `.hero-mini` | a fixed grid row, `24px + 70px` (`20 + 70` on tablets; on phones a `min-height` of one row of six) | the six small frames are drawn by the render script at the end, so the row must not be born at zero. The facts sat in this row before the Flip and jumped 87px for exactly that reason |
| `.hero-art` | `aspect-ratio:4/5` + a width from the screen's height (`--art-w`) | the picture is whole on the first screen at 1280×720, 1440×900 and 1920×1080; `verify.mjs` checks it |
| `.hero` | `min-height` = the picture's height (`--art-w × 1.25`) + padding, two columns only | in one slow load out of two the browser painted before it read the `<figure>`: the grid was as tall as the text and the line and buttons dropped 240px when the picture arrived (0.03). Measured six times after the fix: 0.005–0.006 every time |
| `.sec-title` | `1.08em` | one line |
| `.bar` | `73 / 71 / 64px` | per breakpoint; empty it is 54px. Its links reserve `32px + 1.6em` |
| `.btn` | `44px`, line-height `20px` | also the minimum touch target; the px line-height makes it 48px with the fallback font and with Zen alike (with `normal` it grew 4px when the font arrived) |
| `.filters` | `38px` / `84px` on phones | one row of chips / two |
| `.wall` | a `calc()` | see below; on touch screens it adds `--cap-h` (28px, the one-line title under each tile) once per row |

The wall's reserve is a formula, not a constant, because the right height
changes with viewport width. Since the September 2026 uniform grid every tile
is 4:5, so the height is simply rows × (1.25 × one column's width) + the gaps
between rows, and the CSS stores only the row count (`--wall-rows`, three
places: 3, 2 and 2 columns, 12px gaps, the width from `--pad`). The wall
opens with the first `CONFIG.wallPreview` pieces (12); the rest appear on a
click, which is user input and does not count as layout shift. Since 1 Nov
2026 the intro fills the first screen and the wall starts below the fold; the
reserves stay, because `#work` links land straight on it.

**The shop starts in its open state.** Its HTML used to start with the merch
hidden; the script at the end revealed it, and on a 400 kbps line the
commissions and the cast painted first and were shoved a whole screen down:
**CLS 0.61**. Since 1 Nov 2026 the markup is the open shop (open since 30
Sep), the head line reserves its lines, and everything after the merch grid
(the bag, the commissions, the footer) is `visibility:hidden` until
`render()` adds `.pronto` to `<html>` (a moving invisible element does not
count; without JavaScript the `.js` class is never set and nothing is
hidden). Measured: 0.003 on a slow line, desktop; 0.0095 on a phone.
`verify.mjs` measures the shop's CLS too, fast and throttled.

**Uniform tiles never crop.** Tiles are 4:5 because most wall pieces are
exactly 4:5; everything else is fitted whole with `object-fit:contain` and
sits on the white `--raise` like a mat. `verify.mjs` accepts a tile only if its
image either matches the frame's ratio or is `contain`; switching to `cover`
is caught (tested against that planted bug). The covers in the row of project cards follow the same rule: the same 4:5 box in three equal columns (so one height, and the three titles line up), the cover whole inside it (`contain`); `verify.mjs` checks both. Since 1 Nov 2026 every mat (wall tiles, project covers, the featured cover) has an even 4% margin on all sides, a passe-partout: before it, 4:5 art ran to the frame's edge while square art floated in bands. Padding in % counts from the width, so it is equal on the four sides, and with `border-box` the frame stays 4:5 outside: the wall reserve does not change. Aim **1-5% under** the real height. Under-reserving settles by a few
pixels; over-reserving opens a gap that closes again, which counts just the
same. Result after all of it, with the wall on the first screen: about 0.006
throttled, 0 to 0.001 unthrottled.

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

**New art arrives through Google Drive** (6 Nov 2026, Frede's request: "when
I upload the images to them you can update them in the site"). In the Drive
of `frederico@guitaink.com` (the account the Google Drive connector uses),
inside the folder `Site [Imagens]` (`1kA7eF_8nnlcFzTwj33uC9OHHTNnlqweh`),
each subfolder is a place on the site. **The folder is Frede's word on the
category** (§9.1): never move a picture to another category because of what
it looks like.

| Drive folder | id | On the site |
| --- | --- | --- |
| `Design de personagens` | `1NT7HmnOgBDF3b_LSIlZe_y6eMC7ONZrc` | `cat:"character"` |
| `Fan art` | `1AkCHsXty3qh4Ok77XaNKkI694nkEldpq` | `cat:"fanart"` |
| `Esboços` | `1PuioU6u0mryHTpu-OUWVPvwqKyVNeYso` | `cat:"sketches"` |
| `Colaborações/Originais` | `1F886x9w6mhuegt2B7n_a22Cs502rH7He` | `cat:"character", collab:true` |
| `Colaborações/Fan art` | `1jCjVYH6vKq0lpZ_mumpw2QTCisgyJlq8` | `cat:"fanart", collab:true` |
| `Projetos/Survival of Kings` | `1leX-PlIdeYHtpXl6ApPztSJgM4MyZ7nK` | the `sok` project's `gallery` |
| `Projetos/Tokyo Revengers` | `1WjNVXK7gzKa7_vsJjQc7EiqdJjhwjhbp` | the `tr` project's `gallery` |
| `Projetos/PAMP` | `1i5Cx9fkAsDVDc9-B0bLJX8rJMyDI69BE` | the `pamp` project's `gallery` |
| `Projetos/One Piece Deck` | `1TYBFrstwThbw8_M_fQ72_GX6nM30phXM` | the `deck` project's `gallery` (fan art, §9.1) |

`Colaborações` (`1uAPosE-JsJgVAvFYGIiLC3Mo1QbULhxo`) and `Projetos`
(`1b_M9U5Qw9Z-iqBO3asZykudWIhMe5QH8`) only hold their subfolders: a collab
is still an original or fan art (§9.1), so it needs both. The 28 PNGs loose
at the top of `Site [Imagens]` are the August 2026 originals, already on
the site: never import them again. Frede's other Drive folders
(`Capas_TokyoRevengers`, `Survival of Kings`, `Deck OP` at the root) are his
own and are not read.

How a picture comes across (tested 6 Nov 2026 on a 5.8 MB PNG, byte for
byte): `download_file_content` is too big for the conversation, so the
harness saves it to a file in the session's tool-results folder; its
`content` field is base64 (`jq -r .content <file> | base64 -d > <name>`).
Decode each into an empty scratch folder, never into the repo, and delete
the saved file after. A fresh cloud container's system Pillow is broken
(`cannot import name '_imaging'`); `python3 -m pip install
--break-system-packages --ignore-installed Pillow numpy` fixes it. Then the
usual path: `add-artwork.py` (a name already on the site is replaced, which
is how a corrected re-upload works), the `CONFIG` lines, `dims.py`,
`verify.mjs`, commit, zip. **Still to agree with Frede** before this runs
on its own: where the title comes from (the proposal: the file name, as
he writes it), where a new piece sits on the wall, and whether the folders
are checked on a schedule or when he asks.

---

## 5. Icon system

**There is no icon system and no icon library.** Do not add one.

Icons are four things, in order of preference:

1. **Text glyphs in markup** — `‹` `›` `×` for the lightbox controls, `◐` for
   the theme toggle, `↗` on outbound links, `→` on internal ones. Each carries
   an `aria-label`.
2. **The 墨 seal** — the site's first logo (3 September 2026), back since 31
   October 2026 at Frede's request, after the frog coin and the G coin: the
   character 墨 ("ink") in white on a rounded square of Electric Cobalt `#1558C9`
   (corners at ~26% of the side, as the original 30px square with an 8px
   radius). In September it was live text, so every system drew 墨 with
   whatever CJK font it had; now it is the real outline from Shippori Mincho
   B1 ExtraBold, in vector, the same everywhere. It does not change with the
   theme. To change it, edit the constants in `tools/make-logo.py` and run it,
   then `tools/make-og-card.py`; never hand-edit `images/logo.svg` or the
   favicons. The earlier logos are in git history (the G: `make-logo.py` of 31
   Oct; the frog: `tools/make-frog-logo.py`, with Frede's drawing kept in
   `tools/frog-source.jpg`).
3. **CSS-drawn geometry** — the mobile menu hamburger is two pseudo-elements that
   rotate into an X. No SVG.
4. **Inline data URIs** — the `feTurbulence` film grain (SVG, the only inline
   SVG in the repo) and the favicon (a 64x64 PNG of the logo coin, written into
   all four pages by `make-logo.py`; inline so `404.html` stays self-contained
   at any path).

Any button that renders a glyph **must set `font-family`**. Five of them once
didn't and fell through to the browser default, rendering in Arial.

---

## 6. Styling approach

One `<style>` block per file. Plain selectors, no methodology, no preprocessor.

**Space and tone, few lines** (since 31 Oct 2026). Sections are separated by
space and their heading, not by rules, and the art sits on mats (near-black at night, white by day) with no
border. `1px solid var(--hair)` survives only where it carries structure: the
bar's bottom edge, the footer's top, the commission formats list, the
timeline's axis and the shop's bag. There is **no elevation shadow anywhere**:
the only `box-shadow` is inside the `@keyframes` that pulses a ring out of the
timeline's upcoming-event dot. Do not introduce elevation, glassmorphism, or
boxes around content.

**Nothing decorates the art.** The ink redesign took out everything that
competed with the work: the Survival of Kings sky behind the hero and the
shop's head, the three character cut-outs (`.cut`), the screentone that swept
across tiles and the speed lines under the title. The one Survival of Kings
picture left in the layout is the line-up of seven (`cast-cut`), beside the
commissions on the home page (`.comm-art`) and beside the closing lines of
the commissions in the shop (`.comm-art` in `.comm-foot`; it was a full-width
`#comissoes::after` under everything, ~680px tall, until 1 Nov 2026): a CSS background, not an `<img>` and not in CONFIG,
because it is decoration and not the portfolio, and because it shows exactly
what a commission buys. It never sits behind text.

Any text placed over a picture needs a veil and a pixel check in
`verify.mjs`. Today none does (the white-on-sky pixel test left with the sky;
put one back if text ever goes over a picture again). The tile caption is an
opaque ink band, so the normal contrast test measures it.

**Type sizes are seven steps** (late Oct 2026, after a taste-skill review
measured running text at 13.8px in grey; tightened on 1 Nov 2026, when a
measurement still found 15 sizes on the home page and 14 in the shop, several
almost equal): display up to 70px (`4.4rem`), headings up to 45px
(`2.8rem`), subtitles 24px (`1.5rem`), leads 18px (`1.125rem`), body 16px
(`1rem`), small 14px (`.875rem`), labels 12px (`.75rem`, never smaller). Body
line-height 1.6. Running text in full `--bone`; `--bone-dim` is for what is
secondary. Adding a size needs a reason the table in `DESIGN.md` §3 cannot
give.

**Radius is a documented two-value system**, and mixing outside it is a bug:

| Radius | Used by |
| --- | --- |
| `2px` | buttons, skip link — near-square, printed |
| `999px` | chips, badges, knobs, dots, lightbox controls |

(The 墨 seal has its own rounded corners, ~26% of its side, inside its SVG;
no CSS radius matches it, on purpose.)

**Responsive** — four media queries, no more:

```css
@media (max-width:980px)                        /* grids to 1 or 2 columns   */
@media (min-width:621px) and (max-width:780px)  /* nav condenses; the full
                                                   bar needs 744px           */
@media (max-width:620px)                        /* bar links → mobile menu   */
@media (prefers-reduced-motion:reduce)          /* every effect off          */
```

Plus `(hover:none)` for touch screens, which is not a breakpoint: a tap sets
`:hover` and it sticks, so there the hovers that move (the project card's
lift, the art growing in its tile, the button sweep) are cancelled and a
filled button stays filled. On the index it sits after the rules it cancels (same
specificity, the last one wins). Since 1 Nov 2026 it also carries two layouts
for touch: the wall's titles as a line under each tile (the mat moves to the
image) and the lightbox arrows in the bottom corners, filled, with the
"Swipe to browse" hint; the 620px block repeats the arrows for a narrow
window with a mouse.

**The section-title wipe clips past the line box** (`inset(-.2em -.1em
-.3em -.1em)` when revealed): with `inset(0)` the mincho's descenders, which
hang below a 1.08 line, were cut ("Say hi" lost the tail of its y).

Type and spacing scale with `clamp()` rather than breakpoints wherever possible.

**Motion:** two house curves — `cubic-bezier(.2,.7,.3,1)` for reveals,
`cubic-bezier(.16,.84,.36,1)` for the clip-path title wipe. `cubic-bezier(.2,1.5,.4,1)`
is reserved for the seal's stamp (it was born for it, in September). Few
effects, on purpose: the title wipe, the seal's stamp, the sweep on filled
buttons, the timeline dot, and on a tile the art growing 2% with the caption
band sliding up. Plain `ease` is correct for colour transitions.
**Never `transition: all`** — name the properties. Animate only `transform` and
`opacity`. There is not one `window` scroll listener in the codebase and there
must not be; use `IntersectionObserver`.

Every interactive control answers a press with `transform: scale(.97)` over
120ms, and every effect collapses under `prefers-reduced-motion`.

Small motions are sized to how often they happen (Emil Kowalski's rules, Oct
2026): the mobile menu cascades in .3s with 30ms steps; the lightbox opens
with a 180ms fade and the art growing from `.98` (`@starting-style`), closes
in 120ms (`transition-behavior: allow-discrete` on `display`), and changing
artwork with the arrows never animates; the shop's floating bag button rises
8px in 200ms when it appears. Browsers without `@starting-style` just show
them, as before.

---

## 7. Project structure

```
index.html      the whole single-page site (CONFIG + CSS + markup + render JS)
projeto.html    per-project detail page, reads ?p=sok|tr|pamp|deck. Since late
                Oct 2026 it has the shop's bar (logo, back, language, theme),
                the site's 1240px width, the text beside a large cover on
                desktop, the series in a grid below, and the project's own
                outbound link as its button when it has one
loja.html       the selling page: commissions (four formats, no prices) and,
                once shopOpen is true, the merch. Reads ?lang=pt|en. Its
                footer links the Livro de Reclamações Eletrónico, required
                by law for selling online in Portugal; verify.mjs checks it
404.html        standalone, self-contained
robots.txt
sitemap.xml     six URLs; update lastmod when content changes
images/         + images/thumb/, images/merch/, images/bg/ (Survival of Kings)
fonts/          the three font files (Latin subsets) + OFL licences
comissoes/      the commission system; nothing here is served
  README.md       how site, Notion and email fit together
  email-onboarding.md  the acceptance email, PT and EN
marca/          the brand sheet for printers and collaborators; not served
  Guita_Ink-brand-sheet.pdf  one A4 page: the frog coin, the palette (HEX,
                  RGB, approximate CMYK), the three faces, the rules
  ⚠️ both predate the ink redesign (31 Oct 2026) and the palette of
                  1 Nov 2026: they still show the frog coin, the frog green
                  and the old faces. Redo them with Midnight Black, Electric
                  Cobalt and Acid Lime (§1), the two Japanese faces and
                  images/logo.svg.
  brand-sheet.tpl.html  its source. The fonts (Google Fonts woff2, base64)
                  and the logo SVG are pasted in at /*FONTS*/ and /*LOGO*/,
                  then Chromium prints it to A4 (it was made with the old
                  frog-logo.svg; paste images/logo.svg when redoing it). Redo
                  it when a token or the logo changes
politicas/      the shop's policies, PT and EN; nothing here is served
  politicas-loja.md  source of the texts pasted into Shopify (returns,
                  shipping, terms, contact, the privacy contact line). No
                  prices, no shipping amounts: those stay in Shopify
tools/          all run by hand, none part of the deploy
  add-artwork.py  originals or a folder → full + thumb + webp + DIMS, in one command
  make-webp.py    regenerates the WebP derivatives
  dims.py         rewrites the DIMS map and the wall reserve from the real pixels
  make-og-card.py redraws images/og-card.jpg from og-card.html
  make-logo.py    the 墨 seal (SVG), the favicon in the four pages, logo-1024.png
  logo-1024.png   the seal as a big PNG, for Instagram, Shopify, email; not served
  frog-source.jpg the frog as Frede drew it (the logo in October 2026); kept,
                  not served
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
  design-taste-frontend/  "taste-skill" v2: art direction for web pages,
                  a source linter and a real-browser inspector (Node 22, no
                  install). From github.com/Leonxlnx/taste-skill at 12af471
                  (2.1.5): its skills/taste-skill folder copied unchanged plus
                  its MIT LICENSE (the scroll-scene files its SKILL.md names
                  are missing upstream). From the repo root:
                  `node .claude/skills/design-taste-frontend/scripts/lint.mjs
                  index.html loja.html` and `.../scripts/inspect.mjs
                  index.html`. The inspector needs CHROME_PATH, and a cloud
                  session runs as root, where Chromium only starts with
                  --no-sandbox: point CHROME_PATH at a two-line wrapper that
                  adds it. Working files land in .taste-skill/, which git
                  ignores. It ranks BELOW this file and DESIGN.md. Its review
                  shaped the ink redesign of 31 Oct 2026 (art first, readable
                  sizes, two typefaces, few lines), but some of its house
                  rules still contradict decisions made here: the kickers
                  above project titles, the few uppercase labels, the lines
                  that remain (§6) and the 001 numbers in the lightbox. So:
                  never let it deal a direction, palette or type (Frede
                  chooses those; if ever, only with --keep palette,type);
                  never use assets.mjs to bring in found
                  pictures (every picture here is Frede's, §9.5); never fill
                  copy with its "sample details" (§9.5 again); and do not
                  silence its findings with taste-skill-ignore comments. Use
                  it for what it measures (type sizes, margins, empty
                  screens, text at the screen edge) and for its critique
                  rubric, then weigh each finding against §1 to §10
  emil skills/    sixteen folders, one per skill, from
                  github.com/emilkowalski/skill at a81dbca (28 Oct 2026),
                  installed 1 Nov 2026 with `npx skills add emilkowalski/skill
                  --skill '*' --agent claude-code --copy -y`: copied
                  unchanged (checked byte for byte against upstream) plus its
                  MIT LICENSE in each folder. Markdown only, no scripts. The
                  installer also writes skills-lock.json at the root, which
                  git ignores. Each folder has its own exception in
                  .gitignore. They rank BELOW this file and DESIGN.md.
                  Useful here:
                    animate, review-animations, improve-animations,
                    find-animation-opportunities, remove-animations,
                    animation-performance, animation-vocabulary: motion,
                    within §6 (only transform and opacity, the house
                    curves, every effect off under reduced motion, no
                    scroll listeners)
                    emil-design-eng: the same philosophy as the user-level
                    anthropic-skills:emil-design-eng; reviews in its
                    Before / After / Why table
                    apple-design, mobile-native: touch, springs, the phone
                    (mobile-native's sticky-hover and 100vh notes match §6)
                    break-ui: worst-case data for a component. Never leave
                    its "Demo data / Worst case" toggle in a page, and never
                    put its fake data in CONFIG (§9.5)
                    prototype: variants behind a picker, to choose from; the
                    picker never ships, the chosen one is rebuilt in the
                    house style
                  Not for this site (kept because the package installs
                  whole): animate-expo (React Native), write-swift (Swift),
                  ask-sonner (a React toast library), pick-ui-library (it
                  picks libraries, and §3 forbids adding any).
                  review-animations, prototype and pick-ui-library only run
                  when typed as /commands (disable-model-invocation upstream)
  impeccable/     Impeccable (impeccable.style, Paul Bakaus, Apache 2.0, its
                  LICENSE and NOTICE beside it): one skill, /impeccable, with
                  sub-commands (critique, audit, polish, typeset, layout,
                  quieter, bolder, animate…) and a design detector. Installed
                  1 Nov 2026 by copying the Claude Code build from
                  github.com/pbakaus/impeccable at e89e3ad (v4.8.0) unchanged,
                  plus its four agents in .claude/agents/impeccable-*.md: the
                  official `npx impeccable install` downloads its bundle from
                  impeccable.style, which the cloud session's network does not
                  reach (Nothing was installed). The engine is a binary that
                  scripts/impeccable downloads once from the project's GitHub
                  releases into ~/.impeccable/bin, checked against
                  engine-checksums.txt. It ranks BELOW this file and DESIGN.md
                  (it reads DESIGN.md as the incumbent system, and its own
                  rules say a refinement preserves it). Never run
                  `/impeccable document` (it regenerates DESIGN.md from the
                  code, replacing the hand-kept reasoning) or `extract` (it
                  pulls tokens and components into a design system, §1 and §2).
                  `/impeccable init` writes a PRODUCT.md after asking Frede
                  questions; §9 outranks anything in it. The automatic design
                  hook (a check after every edit and a 30s pass at the end of
                  each turn) is NOT installed: it would live in
                  .claude/settings.json and run in every session; turn it on
                  only if Frede asks. The detector by hand, from the repo root:
                  `.claude/skills/impeccable/scripts/impeccable detect
                  http://127.0.0.1:<port>/index.html` on a served page (needs
                  CHROME_PATH, with --no-sandbox as for the taste-skill). On
                  install day it found 0 problems on the rendered home and
                  shop, and three notes that are decisions, not bugs: the
                  bounce curve is the seal's stamp (§6); on the source file
                  (not the rendered page) `#heroImg` "has no src" because the
                  intro's inline script fills it (§2), and the stripes are the
                  placeholder plate for a missing artwork (§9.5).
                  Its critiques are archived in .impeccable/critique/
                  (committed: `/impeccable polish` reads the last one). The
                  first, 1 Nov 2026, scored the home page 26/36 and led to
                  the fixes for the clipped titles, the English screen-reader
                  labels on the PT page, the commission ask, the phone
                  lightbox and the wall's titles on touch screens
  Superpowers     fifteen folders, one per skill (brainstorming, writing-
                  plans, executing-plans, subagent-driven-development,
                  dispatching-parallel-agents, test-driven-development,
                  systematic-debugging, verification-before-completion,
                  requesting-code-review, receiving-code-review,
                  using-git-worktrees, finishing-a-development-branch,
                  writing-skills, diagnosing-superpowers, using-superpowers),
                  from github.com/obra/superpowers at 2ce8aa1 (v7.0.1, Jesse
                  Vincent, MIT), installed 3 Nov 2026: its skills/ folder
                  copied unchanged (checked with diff -r) plus its LICENSE in
                  each folder. The official install is `/plugin install
                  superpowers@claude-plugins-official`, a plugin kept in the
                  user's own Claude settings, which a cloud container loses
                  when it ends; copied here, every session has them. Each
                  folder has its own exception in .gitignore. A workflow
                  more than a toolbox: ask what is wanted (brainstorming),
                  write a plan, build it test first, review, finish the
                  branch. Their text names each other `superpowers:<name>`;
                  here they are plain `<name>`. **Its SessionStart hook is
                  NOT installed** (as with Impeccable's): it pastes
                  using-superpowers ("if there is even a 1% chance a skill
                  applies, you MUST invoke it") into the start of every
                  session; without it the skills load by their
                  descriptions. Turn it on only if Frede asks. They rank
                  BELOW this file and DESIGN.md (using-superpowers says so
                  itself: CLAUDE.md takes precedence over skills), and a few
                  of their defaults do not fit this repo:
                    test-driven-development: the tests are tools/verify.mjs,
                    and §10 already works this way (write the check, watch
                    it fail on a bug planted on purpose, then fix). Never
                    add a test framework or a package.json for it (§3), and
                    its "delete code written before the test" applies to
                    new code in the task, never to what is already here
                    systematic-debugging, verification-before-completion:
                    fit as they are (§10: "suspect the harness before the
                    site", evidence before saying done)
                    brainstorming, writing-plans: their documents go in
                    docs/superpowers/specs/ and docs/superpowers/plans/,
                    committed; nothing there is served (the deploy zip
                    holds only the four pages, robots, the sitemap, images/
                    and fonts/). Brainstorming's visual companion is a
                    local server with a localhost link, which Frede cannot
                    open from a cloud session (show him screenshots or an
                    artifact instead), and its page loads a logo from
                    primeradiant.com to count users: set
                    SUPERPOWERS_DISABLE_TELEMETRY=1 if it is ever used
                    using-git-worktrees: not in a cloud session. The work
                    stays on the session's own branch; no worktree, no new
                    branch
                    finishing-a-development-branch: never merge into main
                    locally and never "discard" work without asking. The
                    branch goes to GitHub as a pull request, and Frede
                    merges it
                    subagent-driven-development, dispatching-parallel-
                    agents: each task goes to a fresh agent, which costs
                    more; only when Frede asks for that way of working
                    diagnosing-superpowers: it reads the session's
                    transcript, which holds Frede's email and the shop's
                    details. Never file an issue on obra/superpowers or
                    hand out its bundle unless he asks for it
                  Their working folder, .superpowers/ (plan workspaces,
                  brainstorm sessions), is ignored by git
```

No feature folders, no `src/`, no routing. `index.html` is organised top to
bottom as: meta and JSON-LD → `CONFIG` → `<style>` → markup → render `<script>`.

**Home page order** (since 31 Oct 2026, "the work first"): the intro, which
since 1 Nov 2026 is a poster: "Frederico Guita" large, on two lines, with
"Illustration and character design" under it, top left; the two buttons
bottom left; on the
right one of Frede's originals, whole, on its mat, as tall as the first
screen allows, a different one each visit (the next in `CONFIG.heroArt`, kept
in `localStorage`; only originals, never fan art or collabs, each with its
WebP, all checked by `verify.mjs`). **The Flip** (1 Nov 2026, chosen by
Frede from four prototypes made with `/prototype`): under the buttons, the
same six originals as small frames; resting the mouse on one for 140ms,
focusing it or tapping it swaps the big piece, with no animation (a gesture
repeated many times in a row), but only once the new piece is decoded, so
the mat never flashes empty. The 140ms pause came from the second critique
(1 Nov 2026): with an instant swap on pointing, the way from a frame to the
big picture crossed the next frame and swapped to it (from 5 of the 6), so
a click opened the wrong piece. The six are one Tab stop (the chosen one,
`role="toolbar"`), with the arrow keys, Home and End moving between them. The first touch of the frames preloads all six.
The chosen frame carries the `--hi` outline; the caption reads "title" and
"n / 6". **The only words of the intro are the name and what he does**
(Frede, 1 Nov 2026, evening: "apenas manter Frederico Guita, Ilustração e
design de personagens"): the big name was "Guita_Ink" until then, and the
sentence "I'm Frederico Guita…" and the two facts (the Iberanime contest,
the Distrito Manga covers) left with it. The brand stays in the bar, beside
the seal; the buttons, the caption and the frames stay. Two columns down to
621px, stacked on phones (name, role, buttons, picture, frames; the picture
is whole on a 390×844 first screen) → selected
work (the wall: one uniform grid, no project
highlighted; the Survival of Kings cast sits after the other originals on
purpose; the opening twelve, `CONFIG.wallPreview`, never repeat the intro's
six, which come right after them: Frede's choice after the Impeccable
critique of 1 Nov 2026, checked by `verify.mjs`) → projects (the featured project, `CONFIG.featured`, as a full-width
card with its cover, text, a strip of its series and its links; the others in
a row below; on phones those three are compact, a small cover beside the
kicker, title and link, the description left to the project page) →
commissions (a short band beside the cast: title, OPEN badge, one sentence,
"Formats and how to ask →" and "Shop →"; the four format names left the home
page after the second critique, because they looked like links and repeated
the shop) →
about (bio beside the timeline) → contact. The timeline is not its own
section any more; its `id="timeline"` sits on the block inside About, so old
`#timeline` links still land. `DESIGN.md` §1 and §5 have the reasoning.

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
Nothing else belongs there, so nothing else can go stale. A project may carry
an optional `link` (its outbound address) with the button's words in
`i18n.<lang>.projects.<key>.link`: today only Survival of Kings (its Webtoon)
and PAMP (its Instagram) have one, and the home page's featured card reads
the same field. Never add a link a project does not really have (§9.5).

**`loja.html` is where the site sells, and it owns what only it uses.** The
merch list and its prices, the Shopify address, the drop name, the shop copy
and the commission email template live there and nowhere else; `verify.mjs`
fails if `merch`, `shop`, `shopDrop` or `merchCollection` reappear in
`index.html`. The home page keeps a short commissions band that links to it.
The fields both pages read have to match, and `verify.mjs` checks them:
`artistName`, `realName`, `email`, `instagram`, `commissionsOpen`, `tiers`,
`shopOpen`, and the copy keys `commTitle`, `commOpen`, `commClosed`,
`commIntro`, `navShop`, `navComm`, `tiers`. (`commCta`, "Ask about a
commission", is the shop's own email button; the home band's button is
`commSee`, "Formats and how to ask", since it only takes you there.) That is why launching the shop is
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

**⚠️ The Figma file predates every October and November 2026 change, the
Midnight Black / Electric Cobalt / Acid Lime palette included** (the frog, the sky,
the G logo and the ink redesign of the 31st, with its two Japanese faces).
It still holds the Royal blue variables and the Selo component. Until it is
updated, trust it for type and layout only, never for colour or the logo.

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
install: Playwright and Chromium are already on the machine, and the site
makes no outside request (the fonts are in `fonts/`), so it works offline. `--rapido` skips the throttled CLS
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
- **CLS is 0** on load, on the home page and in the shop. A scripted `openLb()` injects a shift with no
  `hadRecentInput` and will read as a false regression; measure without it.
- **The site opens dark**: all four pages load on Midnight Black `#030407`
  without touching the toggle, even with the system set to light.
- **Contrast** against computed colours in both themes. (Text over a picture
  would be skipped there and needs a pixel test; the one for the sky left with
  the sky, see §6.)
- **The intro**, EN and PT, 320 to 1600px: the name is `CONFIG.realName`,
  on exactly two lines (counted in the text, not the box, which reserves two)
  and inside its column, the role line ("Illustration and character design")
  on exactly two (its reserve depends on it), and the picture whole on a
  laptop's first screen. Tested against planted bugs: a name too big, a name
  on one line, the brand instead of the name, a role on one line and on
  three.
- **The intro picture is an original**: every `CONFIG.heroArt` entry is in
  `artworks` with `cat:"character"` and no `collab`, with both WebPs.
- **The Flip**, EN and PT: six frames, exactly one chosen and it is the big
  piece; a tap on another swaps the piece, the caption ("title", "n / 6")
  and the choice; the labels exist in both languages. Tested against a
  planted bug (a swap that does nothing).
- **EN/PT parity** across every `data-t` key.
- **Screen-reader labels follow the language** (1 Nov 2026, from the
  Impeccable critique): in the markup of the index, shop and project pages
  every `aria-label` carries `data-ta` and the skip link a `data-t`; opened
  with `?lang=pt`, every labelled control reads differently from EN. Nine
  English labels had sat on the PT page unseen, because the parity check only
  looked at `data-t`.
- **Section titles whole after the ink wipe**, EN and PT, 390 and 1440px:
  the text box (ascent and descent) fits inside the clip.
- **The phone lightbox**: on a touch screen (390 and 320px, with touch on) no
  arrow and no close button lies over the artwork, and the visible hint is
  the gesture one; with a mouse at 1280px, the keyboard one.
- **The Flip's mouse path** (second critique, 1 Nov 2026): rest on each frame,
  then move to the big picture at a normal speed (400ms): the piece chosen
  must still be there. One Tab stop for the six; → moves and swaps.
- **What a screen reader hears on the index**, EN and PT: each project card
  named by its title, the lightbox's title and position in an `aria-live`
  region, no `→`/`↗` read aloud, and the language button's name starting
  with the letters it shows.
- **The phone layout** (360–620px, touch, EN and PT): compact project cards
  (cover under half the card, no description), the wall count beside its
  title, the filter chips within their 84px reserve.
- **The wall on a touch screen** (390 and 820px): every visible tile has its
  title under the art, on one 20px line, and the wall's reserve is 95–100%
  of its real height.
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
- **Project pages**: every key and an invalid one, in both languages, with
  the whole series loaded and nothing cropped, the bar present, and Survival
  of Kings' Webtoon button there.

When a measurement contradicts your expectation, suspect the harness before the
site, and say so when it turns out to be the harness.

---

## 11. Working with Frede

He is not a developer and is learning this as he runs the business. Explain the
reasoning as you go. Make surgical, documented edits rather than rewrites — the
inline comments are in Portuguese and are part of the codebase; match them.

If you think something he decided is wrong, say so directly and say why. Do not
quietly work around it.

---

## 12. Parked ideas

Ideas Frede wants to keep for later. Not to be built until he asks; listed so
a future session finds them.

- **A drawing timelapse** (parked 31 Oct 2026, from the taste-skill review).
  The review asked for one moving picture on the site, and the most honest
  one is Frede inking: Procreate and Clip Studio record a timelapse of every
  drawing. Shown as a muted loop with a poster frame, it would fit the bio's
  "line before colour". Needs the clip from Frede; never a stock or found
  video (§9.5). Reduced motion shows the poster only (§9.8).
- **Portfolio, projects and shop "the way I picture it"** (parked 6 Nov
  2026). Frede asked for "a page to work as my art portfolio that also
  shows my projects and works as merchandise store". The site already does
  all three (the wall and the projects on `index.html`, each project on
  `projeto.html`, the merch and the bag on `loja.html`); asked what is
  missing, he said it "doesn't do the way you picture it", then parked it
  before describing his picture. Nothing was built or decided. Start by
  asking him to walk through it as a visitor (what they see first, what he
  wants them to end up doing), because the answer decides the job: the
  order of the sections, one page instead of three, or the look. One page
  would undo the split of 1 Nov 2026, when the merch moved to `loja.html`
  and `verify.mjs` began failing if it reappears in `index.html` (§7); say
  so before building it. Use the brainstorming skill (§7, Superpowers).

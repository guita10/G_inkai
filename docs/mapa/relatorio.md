# Graph Report - guitaink  (2026-11-13)

## Corpus Check
- 24 files · ~60,865 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .xml 1)

## Summary
- 230 nodes · 453 edges · 11 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Home page features
- Logo tool and shared modules
- Site checks and copy rules
- Pages, shop and services
- Merch mockups
- CONFIG, projects and new art
- Image sizes and layout shift
- Adding artwork
- Shop bag and checkout
- WebP versions of images
- Design and brand

## God Nodes (most connected - your core abstractions)
1. `tshirt()` - 10 edges
2. `artEl()` - 10 edges
3. `renderText()` - 10 edges
4. `main()` - 9 edges
5. `hoodie()` - 9 edges
6. `drawLb()` - 9 edges
7. `main()` - 8 edges
8. `main()` - 8 edges
9. `renderHeroMini()` - 8 edges
10. `loja.html (shop and commissions)` - 8 edges

## Surprising Connections (you probably didn't know these)
- `PROJ_DIMS (project image sizes)` --references--> `proj_block()`  [EXTRACTED]
  CLAUDE.md → tools/dims.py
- `Wall's reserved height` --references--> `rows()`  [EXTRACTED]
  CLAUDE.md → tools/dims.py
- `WebP with JPEG fallback` --references--> `WEBP_OK`  [EXTRACTED]
  CLAUDE.md → index.inline.js
- `WebP with JPEG fallback` --references--> `artEl()`  [EXTRACTED]
  CLAUDE.md → index.inline.js
- `Rule 7: full EN/PT parity` --rationale_for--> `renderText()`  [EXTRACTED]
  CLAUDE.md → index.inline.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Hard constraints (section 9)** — claude_rule_fan_art_never_sold, claude_rule_no_location, claude_rule_illustrator_first, claude_rule_no_prices, claude_rule_nothing_invented, claude_rule_config_contract, claude_rule_en_pt_parity, claude_rule_reduced_motion, claude_rule_no_em_dashes [EXTRACTED 1.00]
- **Where prices live: Shopify and the PDF only** — claude_rule_no_prices, claude_shopify, comissoes_readme_onboarding_pdf [EXTRACTED 1.00]

## Communities (11 total, 0 thin omitted)

### Community 0 - "Home page features"
Cohesion: 0.12
Nodes (36): The intro and the Flip, The lightbox, Motion: few effects, two house curves, Bar, scroll-spy and mobile menu, The wall (gallery of artworks), applyFilter(), artEl(), closeLb() (+28 more)

### Community 1 - "Logo tool and shared modules"
Cohesion: 0.15
Nodes (9): proj_block(), wall(), baixa_fonte(), main(), rasteriza(), svg_selo(), embedded_fonts(), main() (+1 more)

### Community 2 - "Site checks and copy rules"
Cohesion: 0.11
Nodes (15): Parked idea: drawing timelapse, verify.mjs: the site's checks, CHAVES, chk(), config(), estatico(), mau(), navegador() (+7 more)

### Community 3 - "Pages, shop and services"
Cohesion: 0.13
Nodes (20): 404.html, Self-hosted fonts: Shippori Mincho B1, Zen Kaku Gothic New, Guita_Ink site (guitaink.com), index.html (home page), Livro de Reclamações link (legal), loja.html (shop and commissions), Merch: t-shirt, hoodie, art print, stickers, Netlify (drag-and-drop deploy) (+12 more)

### Community 4 - "Merch mockups"
Cohesion: 0.23
Nodes (15): autocolante(), bez(), cena_autocolante(), costura(), estampa(), fundo(), gola(), hoodie() (+7 more)

### Community 5 - "CONFIG, projects and new art"
Cohesion: 0.12
Nodes (17): Adding artwork (add-artwork.py), CONFIG, the contract, New art through Google Drive (only when Frede says so), Featured project card (CONFIG.featured), PROJ_DIMS (project image sizes), A project can be a series (gallery), CONFIG, featProj() (+9 more)

### Community 6 - "Image sizes and layout shift"
Cohesion: 0.16
Nodes (9): DIMS map (real image sizes), Wall's reserved height, DIMS, build(), dims_line(), main(), reserve_value(), rewrite() (+1 more)

### Community 7 - "Adding artwork"
Cohesion: 0.17
Nodes (8): digest(), expand(), fit(), flatten(), main(), save(), slugify(), triage()

### Community 8 - "Shop bag and checkout"
Cohesion: 0.26
Nodes (15): Shop bag and cart-permalink checkout, cesto, descreve(), desenhaCesto(), guarda(), idDe(), junta(), linkCheckout() (+7 more)

### Community 9 - "WebP versions of images"
Cohesion: 0.20
Nodes (8): WebP with JPEG fallback, WEBP_OK, WEBP_OK, best_webp(), encode(), main(), process(), ssim()

### Community 10 - "Design and brand"
Cohesion: 0.33
Nodes (7): Brand sheet (out of date), DESIGN.md (design system), Design tokens: Midnight Black, Electric Cobalt, Acid Lime, Figma file (mirror, out of date), Social card (og-card.jpg), The 墨 seal (logo), Claude skills (Impeccable, taste-skill, Superpowers and others)

## Knowledge Gaps
- **6 isolated node(s):** `Netlify (drag-and-drop deploy)`, `Livro de Reclamações link (legal)`, `verify.mjs: the site's checks`, `Figma file (mirror, out of date)`, `Claude skills (Impeccable, taste-skill, Superpowers and others)` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 65 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WebP with JPEG fallback` connect `WebP versions of images` to `Home page features`, `Site checks and copy rules`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **What connects `Netlify (drag-and-drop deploy)`, `Livro de Reclamações link (legal)`, `verify.mjs: the site's checks` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Home page features` be split into smaller, more focused modules?**
  _Cohesion score 0.12233285917496443 - nodes in this community are weakly interconnected._
- **Why does `loja.html (shop and commissions)` connect `Pages, shop and services` to `Shop bag and checkout`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Should `Logo tool and shared modules` be split into smaller, more focused modules?**
  _Cohesion score 0.1452991452991453 - nodes in this community are weakly interconnected._
- **Why does `Merch: t-shirt, hoodie, art print, stickers` connect `Pages, shop and services` to `Merch mockups`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Should `Site checks and copy rules` be split into smaller, more focused modules?**
  _Cohesion score 0.10541310541310542 - nodes in this community are weakly interconnected._
import json, sys, pathlib
G = sys.argv[1]; OUT = sys.argv[2]
CL = f"{G}/CLAUDE.md"; CR = f"{G}/comissoes/README.md"
nodes, edges, hyper = [], [], []
def n(id, label, ft="concept", src=CL, rationale=None):
    d = {"id": id, "label": label, "file_type": ft, "source_file": src, "source_location": None,
         "source_url": None, "captured_at": None, "author": None, "contributor": None}
    if rationale: d["rationale"] = rationale
    nodes.append(d)
def e(s, t, rel="references", conf="EXTRACTED", score=None, src=CL):
    edges.append({"source": s, "target": t, "relation": rel, "confidence": conf,
                  "confidence_score": 1.0 if conf == "EXTRACTED" else score,
                  "source_file": src, "source_location": None, "weight": 1.0})

# pages and the contract
n("claude_guita_ink_site", "Guita_Ink site (guitaink.com)", rationale="Four hand-written HTML pages, no framework, no build step; must work over file://.")
n("claude_index_page", "index.html (home page)")
n("claude_projeto_page", "projeto.html (project page)")
n("claude_loja_page", "loja.html (shop and commissions)")
n("claude_404_page", "404.html")
for p in ["index", "projeto", "loja", "404"]:
    e("claude_guita_ink_site", f"claude_{p}_page")
e("claude_index_page", "index_inline"); e("claude_projeto_page", "projeto_inline"); e("claude_loja_page", "loja_inline")
n("claude_config", "CONFIG, the contract", rationale="Copy, image list, timeline and links live in CONFIG; new content goes there, never hard-coded in markup.")
e("claude_config", "index_inline_config", "shares_data_with")
e("claude_config", "projeto_inline_config", "shares_data_with")
e("claude_config", "loja_inline_config", "shares_data_with")
e("loja_inline_config", "index_inline_config", "shares_data_with")
e("projeto_inline_config", "index_inline_config", "shares_data_with")

# look and type
n("claude_design_tokens", "Design tokens: Midnight Black, Electric Cobalt, Acid Lime", rationale="Each colour fails somewhere, so each has a job: cobalt and lime fill, --hi is the highlight as line or text.")
n("claude_design_md", "DESIGN.md (design system)", "document")
e("claude_design_md", "claude_design_tokens")
n("claude_fonts", "Self-hosted fonts: Shippori Mincho B1, Zen Kaku Gothic New", rationale="Latin subsets in fonts/: Google's stylesheet for these Japanese families is 457 KB for a Latin-only site.")
n("claude_seal_logo", "The 墨 seal (logo)")
e("claude_seal_logo", "tools_make_logo"); e("claude_seal_logo", "claude_design_tokens", "conceptually_related_to", "INFERRED", 0.85)
n("claude_og_card", "Social card (og-card.jpg)")
e("claude_og_card", "tools_make_og_card"); e("claude_og_card", "claude_seal_logo")

# images and layout shift
n("claude_dims_map", "DIMS map (real image sizes)", rationale="Generated; drives width/height, the hero srcset and each tile's aspect ratio. Never hand-edit.")
e("claude_dims_map", "index_inline_dims", "shares_data_with"); e("tools_dims", "claude_dims_map")
n("claude_wall_reserve", "Wall's reserved height", rationale="Rows x 1.25 x column width + gaps; dims.py derives the row counts so the layout shift never comes back.")
e("tools_dims", "claude_wall_reserve"); e("claude_wall_reserve", "tools_dims_rows")
n("claude_cls", "Layout shift (CLS) kept near 0", "rationale", rationale="On a 400 kbps line the late script once shoved the page down: CLS 0.96. Every text box reserves its space in CSS.")
e("claude_cls", "claude_wall_reserve", "rationale_for"); e("claude_cls", "claude_dims_map", "rationale_for")
n("claude_proj_dims", "PROJ_DIMS (project image sizes)")
e("claude_proj_dims", "projeto_inline_proj_dims", "shares_data_with"); e("tools_dims", "claude_proj_dims"); e("claude_proj_dims", "tools_dims_proj_block")
n("claude_webp_fallback", "WebP with JPEG fallback")
e("claude_webp_fallback", "index_inline_webp_ok"); e("claude_webp_fallback", "index_inline_artel"); e("claude_webp_fallback", "projeto_inline_webp_ok"); e("tools_make_webp", "claude_webp_fallback")
n("claude_artwork_ingest", "Adding artwork (add-artwork.py)")
e("claude_artwork_ingest", "tools_add_artwork"); e("tools_add_artwork", "tools_make_webp"); e("tools_add_artwork", "tools_dims")

# home page features
n("claude_the_wall", "The wall (gallery of artworks)", rationale="One uniform 4:5 grid, art never cropped; the opening twelve (wallPreview) never repeat the intro's six.")
e("claude_the_wall", "index_inline_renderwall"); e("claude_the_wall", "index_inline_frameel"); e("claude_the_wall", "index_inline_applyfilter")
n("claude_intro_flip", "The intro and the Flip", rationale="Name, role, two buttons and one original; six small frames swap the big piece after a 140ms rest.")
e("claude_intro_flip", "index_inline_heroswap"); e("claude_intro_flip", "index_inline_renderheromini"); e("claude_intro_flip", "index_inline_herolist")
n("claude_lightbox", "The lightbox")
for f in ["openlb", "drawlb", "closelb", "steplb"]: e("claude_lightbox", f"index_inline_{f}")
n("claude_featured_project", "Featured project card (CONFIG.featured)")
e("claude_featured_project", "index_inline_featproj")
n("claude_project_series", "A project can be a series (gallery)")
e("claude_project_series", "projeto_inline"); e("claude_project_series", "claude_proj_dims")
n("claude_nav", "Bar, scroll-spy and mobile menu")
e("claude_nav", "index_inline_setnav"); e("claude_nav", "index_inline_trackcurrentsection")
n("claude_structured_data", "JSON-LD for search engines")
e("claude_structured_data", "index_inline_syncstructureddata")
n("claude_motion", "Motion: few effects, two house curves", rationale="Only transform and opacity, no scroll listeners; reveals use IntersectionObserver.")
e("claude_motion", "index_inline_observereveals"); e("claude_motion", "index_inline_stagger")

# shop
n("claude_shopify", "Shopify (checkout and products)")
n("claude_printful", "Printful (makes and ships the merch)")
n("claude_netlify", "Netlify (drag-and-drop deploy)")
e("claude_guita_ink_site", "claude_netlify")
n("claude_shop_bag", "Shop bag and cart-permalink checkout", rationale="The bag lives on the page; only payment leaves the site, through Shopify's checkout. No Shopify script is loaded.")
e("claude_shop_bag", "loja_inline_cesto"); e("claude_shop_bag", "loja_inline_linkcheckout"); e("claude_shop_bag", "loja_inline_variantes"); e("claude_shop_bag", "claude_shopify")
n("claude_merch", "Merch: t-shirt, hoodie, art print, stickers")
e("claude_merch", "claude_printful"); e("claude_merch", "claude_shopify"); e("claude_loja_page", "claude_merch")
e("tools_merch_mockups", "claude_merch", "references", "INFERRED", 0.85)
n("claude_livro_reclamacoes", "Livro de Reclamações link (legal)")
e("claude_loja_page", "claude_livro_reclamacoes")

# the nine hard rules
rules = [("fan_art_never_sold", "Rule 1: fan art is never sold"), ("no_location", "Rule 2: no location anywhere"),
         ("illustrator_first", "Rule 3: illustrator first"), ("no_prices", "Rule 4: no commission terms or prices on the site"),
         ("nothing_invented", "Rule 5: nothing invented"), ("config_contract", "Rule 6: CONFIG is the contract"),
         ("en_pt_parity", "Rule 7: full EN/PT parity"), ("reduced_motion", "Rule 8: reduced motion turns every effect off"),
         ("no_em_dashes", "Rule 9: no em-dashes in copy")]
for k, lbl in rules:
    n(f"claude_rule_{k}", lbl, "rationale")
    e(f"claude_rule_{k}", "tools_verify", "references", "INFERRED", 0.85)
hyper.append({"id": "claude_hard_constraints", "label": "Hard constraints (section 9)", "nodes": [f"claude_rule_{k}" for k, _ in rules],
              "relation": "form", "confidence": "EXTRACTED", "confidence_score": 1.0, "source_file": CL})
e("claude_rule_fan_art_never_sold", "claude_merch", "rationale_for")
e("claude_rule_no_prices", "claude_loja_page", "rationale_for")
e("claude_rule_config_contract", "claude_config", "rationale_for")
e("claude_rule_en_pt_parity", "index_inline_rendertext", "rationale_for")
e("claude_rule_reduced_motion", "claude_motion", "rationale_for")
e("claude_rule_nothing_invented", "claude_artwork_ingest", "rationale_for")

# verification
n("claude_verify", "verify.mjs: the site's checks", rationale="Drives Chromium over every page and exits 1 on any failure; tested against bugs planted on purpose.")
e("claude_verify", "tools_verify")
for k in ["claude_cls", "claude_the_wall", "claude_intro_flip", "claude_lightbox", "claude_shop_bag", "claude_webp_fallback"]:
    e("tools_verify", k, "references", "EXTRACTED")

# Google Drive import
n("claude_drive_import", "New art through Google Drive (only when Frede says so)", rationale="Each Drive folder is a place on the site; tools/drive-importados.json records what already came in.")
e("claude_drive_import", "claude_artwork_ingest"); e("claude_drive_import", "claude_the_wall"); e("claude_drive_import", "claude_project_series")

# other references
n("claude_figma_file", "Figma file (mirror, out of date)")
e("claude_figma_file", "claude_design_tokens", "references")
n("claude_brand_sheet", "Brand sheet (out of date)")
e("claude_brand_sheet", "claude_design_tokens"); e("claude_brand_sheet", "claude_seal_logo")
n("claude_skills", "Claude skills (Impeccable, taste-skill, Superpowers and others)", rationale="They rank below CLAUDE.md and DESIGN.md.")
e("claude_skills", "claude_design_md", "references", "EXTRACTED")
n("claude_parked_timelapse", "Parked idea: drawing timelapse")
n("claude_parked_portfolio_shop", "Parked idea: portfolio, projects and shop 'the way I picture it'")
e("claude_parked_portfolio_shop", "claude_loja_page"); e("claude_parked_portfolio_shop", "claude_index_page")

# commission system (comissoes/README.md)
n("comissoes_readme_commission_system", "Commission system: site, Notion, email", src=CR)
n("comissoes_readme_notion_pipeline", "Notion database: Comissões, Guita_Ink", src=CR)
n("comissoes_readme_onboarding_pdf", "Guita_Ink_Comissoes_PT.pdf (onboarding and prices)", src=CR)
n("comissoes_readme_onboarding_routine", "Onboarding email routine (off until connectors are given)", src=CR)
n("comissoes_readme_miro_boards", "Miro boards: Processo and Fluxo de Comissões", src=CR,
  rationale="Moved to the frederico@guitaink.com Miro account on 9 Nov 2026; they carry no prices.")
n("comissoes_readme_commission_request", "Commission request email from the shop", src=CR)
for t in ["comissoes_readme_notion_pipeline", "comissoes_readme_onboarding_pdf", "comissoes_readme_onboarding_routine", "comissoes_readme_miro_boards", "comissoes_readme_commission_request"]:
    e("comissoes_readme_commission_system", t, src=CR)
e("comissoes_readme_commission_request", "claude_loja_page", src=CR)
e("comissoes_readme_onboarding_routine", "comissoes_readme_notion_pipeline", "references", src=CR)
e("comissoes_readme_onboarding_routine", "comissoes_readme_onboarding_pdf", "references", src=CR)
e("claude_rule_no_prices", "comissoes_readme_onboarding_pdf", "references")
e("claude_rule_no_prices", "claude_shopify", "references")
e("claude_loja_page", "comissoes_readme_commission_system")
hyper.append({"id": "claude_price_homes", "label": "Where prices live: Shopify and the PDF only", "nodes": ["claude_rule_no_prices", "claude_shopify", "comissoes_readme_onboarding_pdf"],
              "relation": "form", "confidence": "EXTRACTED", "confidence_score": 1.0, "source_file": CL})

# links stated in CLAUDE.md that the first pass missed
e("claude_guita_ink_site", "claude_fonts")            # section 3: no request to another server, fonts are in the repo
e("claude_404_page", "claude_fonts")                  # 404.html uses absolute /fonts/ paths
e("claude_design_md", "claude_fonts")                 # the two Japanese faces
e("claude_rule_no_prices", "claude_structured_data", "rationale_for")          # price not in the JSON-LD
e("claude_rule_fan_art_never_sold", "claude_structured_data", "rationale_for") # ImageGallery JSON-LD attaches no offer
e("claude_featured_project", "claude_project_series") # the wide card carries a strip of its series
e("claude_featured_project", "claude_config")         # CONFIG.featured
e("claude_parked_timelapse", "claude_rule_nothing_invented")  # never a stock or found video
e("claude_parked_timelapse", "claude_rule_reduced_motion")    # reduced motion shows the poster only
e("claude_printful", "claude_shopify", "references")          # the Shopify order is what Printful fulfils

lines = lambda p: sum(1 for _ in open(p, encoding="utf-8"))
out = {"nodes": nodes, "edges": edges, "hyperedges": hyper, "input_tokens": 0, "output_tokens": 0,
       "coverage": {CL: lines(CL), CR: lines(CR)}}
ids = {x["id"] for x in nodes}
pathlib.Path(OUT).write_text(json.dumps(out, indent=2, ensure_ascii=False))
print(len(nodes), "nodes", len(edges), "edges", len(hyper), "hyperedges")
print("links to code parts:", sorted({x["target"] for x in edges if x["target"] not in ids} | {x["source"] for x in edges if x["source"] not in ids}))

import json
from pathlib import Path
from graphify.diagnostics import diagnose_extraction, format_diagnostic_report
from graphify.build import build_from_json
from graphify.analyze import suggest_questions
from graphify.report import generate
from graphify.export import to_json
ext = json.loads(Path('graphify-out/.graphify_extract.json').read_text())
det = json.loads(Path('graphify-out/.graphify_detect.json').read_text())
an = json.loads(Path('graphify-out/.graphify_analysis.json').read_text())
root = Path('graphify-out/.graphify_root').read_text().strip()
s = diagnose_extraction(ext, directed=False, root=root)
flags = [f"{s[k]} {k}" for k in ('dangling_endpoint_edges','missing_endpoint_edges','self_loop_edges','undirected_same_endpoint_collapsed_edges') if s.get(k, 0)]
print('GRAPH HEALTH WARNING: ' + '; '.join(flags) if flags else 'Graph health: OK (no dangling/missing/collapsed edges).')
labels = {0: "Home page features", 1: "Logo tool and shared modules", 2: "Site checks and copy rules", 3: "Pages, shop and services",
          4: "Merch mockups", 5: "CONFIG, projects and new art", 6: "Image sizes and layout shift", 7: "Adding artwork",
          8: "Shop bag and checkout", 9: "WebP versions of images", 10: "Design and brand"}
G = build_from_json(ext, root=root, directed=False)
com = {int(k): v for k, v in an['communities'].items()}; coh = {int(k): v for k, v in an['cohesion'].items()}
q = suggest_questions(G, com, labels)
Path('graphify-out/GRAPH_REPORT.md').write_text(generate(G, com, coh, labels, an['gods'], an['surprises'], det, {'input': 0, 'output': 0}, root, suggested_questions=q))
Path('graphify-out/.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False))
print('wrote graph.json:', to_json(G, com, 'graphify-out/graph.json', community_labels=labels))

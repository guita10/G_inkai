import json
from pathlib import Path
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json
ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text())
sem = json.loads(Path('graphify-out/.graphify_semantic.json').read_text())
for x in sem['nodes'] + sem['edges']: x.setdefault('_origin', 'semantic')
seen = {n['id'] for n in ast['nodes']}; nodes = list(ast['nodes'])
for n in sem['nodes']:
    if n['id'] not in seen: nodes.append(n); seen.add(n['id'])
ext = {'nodes': nodes, 'edges': ast['edges'] + sem['edges'], 'hyperedges': sem.get('hyperedges', []), 'input_tokens': 0, 'output_tokens': 0}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(ext, indent=2, ensure_ascii=False))
print(f"Merged: {len(nodes)} nodes, {len(ext['edges'])} edges ({len(ast['nodes'])} code + {len(sem['nodes'])} docs)")
det = json.loads(Path('graphify-out/.graphify_detect.json').read_text())
root = Path('graphify-out/.graphify_root').read_text().strip()
G = build_from_json(ext, root=root, directed=False)
assert G.number_of_nodes() > 0
com = cluster(G); coh = score_all(G, com); gods = god_nodes(G); sur = surprising_connections(G, com)
labels = {c: 'Community ' + str(c) for c in com}
q = suggest_questions(G, com, labels)
assert to_json(G, com, 'graphify-out/graph.json', force=True)
Path('graphify-out/GRAPH_REPORT.md').write_text(generate(G, com, coh, labels, gods, sur, det, {'input': 0, 'output': 0}, root, suggested_questions=q))
Path('graphify-out/.graphify_analysis.json').write_text(json.dumps({'communities': {str(k): v for k, v in com.items()}, 'cohesion': {str(k): v for k, v in coh.items()}, 'gods': gods, 'surprises': sur, 'questions': q}, indent=2, ensure_ascii=False))
print(f'Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(com)} communities')
lab = {n: d.get('label', n) for n, d in G.nodes(data=True)}
for c, members in sorted(com.items(), key=lambda kv: -len(kv[1])):
    print(c, len(members), [lab[m] for m in members][:14])

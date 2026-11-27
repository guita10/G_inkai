"""Copia o JavaScript que vive dentro das paginas para ficheiros .inline.js,
para o graphify o ler como codigo (sozinho, so le o HTML como documento).
Corre-se sobre a COPIA de trabalho do site, nunca sobre o repositorio:
    python3 extrai-scripts.py <pasta-da-copia>
"""
import pathlib, re, sys

g = pathlib.Path(sys.argv[1])
for page in ['index', 'loja', 'projeto']:
    src = (g / f'{page}.html').read_text()
    blocos = [m.group(2) for m in re.finditer(r'<script(\s[^>]*)?>(.*?)</script>', src, re.S)
              if not (m.group(1) and 'ld+json' in m.group(1))]
    js = '\n\n'.join(f'// --- inline script {i+1} of {page}.html ---\n' + b for i, b in enumerate(blocos))
    (g / f'{page}.inline.js').write_text(js)
    print(page, len(blocos), 'scripts')

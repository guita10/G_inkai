#!/usr/bin/env python3
"""
make-logo.py — o logotipo do site: o selo 墨, o primeiro que o site teve.

PARA QUE SERVE
  O primeiro logotipo do site (3 de Setembro de 2026) foi um selo: o caracter
  墨 ("tinta"), branco, num quadrado de cantos redondos da cor da casa. Depois
  veio o sapo (Outubro) e um G numa moeda (fim de Outubro). A 31 de Outubro o
  Frede pediu para voltar ao primeiro, com a cor do site (o azul #0E5CAB).

  O selo de Setembro era texto: um <span>墨</span> com a letra dos titulos, que
  nao tem caracteres japoneses, por isso cada sistema desenhava o 墨 com a fonte
  que tinha (no Windows uma, no Mac outra). Este script desenha-o de vez: o
  contorno do 墨 sai da propria fonte Shippori Mincho B1 ExtraBold (a mincho dos
  titulos do site desde a mesma data), com o fontTools, e fica em vector. Igual
  em todo o lado, nitido em qualquer tamanho.

  As medidas sao as do selo original: quadrado com os cantos a ~1/4 do lado
  (30px com 8px de raio, na barra), o 墨 branco ao centro.

  Um comando, tres saidas:
    images/logo.svg        o selo (barra das tres paginas, cartao de partilha)
    o <link rel="icon">    dos quatro .html, como data URI PNG de 64x64
                           (assim o 404 continua sozinho: o Netlify serve-o em
                           qualquer endereco e um caminho relativo partia-se)
    tools/logo-1024.png    a versao grande para usar fora do site (Instagram,
                           Shopify, assinatura de email). Nao vai para o ar.

QUANDO CORRER
  Quando o selo mudar (a cor, o raio, o tamanho do 墨). Depois corre o
  tools/make-og-card.py, que usa o logo.svg.
  Os logotipos de antes estao no historico do git: o G (este mesmo ficheiro,
  versao de 31 Out), o sapo (tools/make-frog-logo.py; o desenho original do
  Frede continua em tools/frog-source.jpg).

COMO CORRER
    python3 tools/make-logo.py

  Precisa de:  pip install fonttools
  e do Playwright com o Chromium (o mesmo do verify.mjs), para os PNG.
  A fonte inteira (com o 墨) vem do Google Fonts, por isso precisa de rede; o
  site so serve o subconjunto latino dela (pasta fonts/), que nao tem o 墨.
"""

import base64
import os
import re
import subprocess
import sys
import tempfile
import urllib.request

try:
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.boundsPen import BoundsPen
    from fontTools.pens.transformPen import TransformPen
except ImportError:
    sys.exit("Falta o fontTools. Corre:  pip install fonttools")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG_OUT = os.path.join(ROOT, "images", "logo.svg")
BIG_OUT = os.path.join(ROOT, "tools", "logo-1024.png")
PAGINAS = ["index.html", "projeto.html", "loja.html", "404.html"]

COR = "#0E5CAB"         # o azul do site (o --sky do dia)
TINTA = "#FFFFFF"       # o 墨
LADO = 512              # o quadrado, em unidades do SVG
RAIO = 0.26             # o raio dos cantos, em fraccao do lado (8px em 30)
OCUPA = 0.62            # o 墨 ocupa 62% do lado, na maior das duas medidas
CARACTER = "墨"
# um user-agent simples faz o Google Fonts responder com o TTF inteiro (com os
# caracteres japoneses), que o fontTools le directo
FONTE_CSS = "https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@800&display=swap"


def baixa_fonte(pasta):
    pedido = urllib.request.Request(FONTE_CSS, headers={"User-Agent": "Mozilla/5.0"})
    css = urllib.request.urlopen(pedido, timeout=30).read().decode("utf-8")
    m = re.search(r"url\((https://fonts\.gstatic\.com/[^)]+\.ttf)\)", css)
    if not m:
        sys.exit("O Google Fonts nao devolveu um TTF. Sem rede?")
    caminho = os.path.join(pasta, "shippori-mincho-b1-800.ttf")
    urllib.request.urlretrieve(m.group(1), caminho)
    return caminho


def svg_selo(fonte):
    f = TTFont(fonte)
    gs = f.getGlyphSet()
    cmap = f.getBestCmap()
    if ord(CARACTER) not in cmap:
        sys.exit(f"A fonte nao tem o {CARACTER}.")
    g = cmap[ord(CARACTER)]
    bp = BoundsPen(gs)
    gs[g].draw(bp)
    xmin, ymin, xmax, ymax = bp.bounds
    # escala: a maior das duas medidas do caracter ocupa OCUPA do quadrado
    k = LADO * OCUPA / max(xmax - xmin, ymax - ymin)
    # centrado pela caixa real do caracter (y da fonte cresce para cima)
    ox = LADO / 2 - (xmin + xmax) / 2 * k
    oy = LADO / 2 + (ymin + ymax) / 2 * k
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (k, 0, 0, -k, ox, oy)))
    r = LADO * RAIO
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LADO} {LADO}" role="img" aria-label="Guita_Ink">'
            f'<rect width="{LADO}" height="{LADO}" rx="{r:.0f}" fill="{COR}"/>'
            f'<path fill="{TINTA}" d="{pen.getCommands()}"/></svg>\n')


RASTER = r"""
import { chromium } from 'playwright';
const [page, png, lado] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +lado, height: +lado } });
await p.goto('file://' + page);
await p.screenshot({ path: png, omitBackground: true });
await b.close();
"""


def rasteriza(svg_path, lado, png_path):
    """O SVG em PNG transparente, pelo Chromium (o mesmo que o verify.mjs usa)."""
    pw = "/opt/node22/lib/node_modules/playwright/index.mjs"
    tmp = tempfile.mkdtemp()
    js = os.path.join(tmp, "raster.mjs")
    open(js, "w").write(RASTER.replace("'playwright'", repr(pw) if os.path.exists(pw) else "'playwright'", 1))
    page = os.path.join(tmp, "p.html")
    open(page, "w").write(f'<html><body style="margin:0;background:transparent">'
                          f'<img src="file://{svg_path}" style="width:{lado}px;height:{lado}px;display:block"></body></html>')
    r = subprocess.run(["node", js, page, png_path, str(lado)], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("O Chromium falhou:\n" + (r.stderr or r.stdout))


def main():
    tmp = tempfile.mkdtemp()
    print("A buscar o Shippori Mincho B1 ExtraBold ao Google Fonts…")
    fonte = baixa_fonte(tmp)
    svg = svg_selo(fonte)
    open(SVG_OUT, "w", encoding="utf-8").write(svg)
    print(f"images/logo.svg  {len(svg) / 1024:.1f} KB")

    fav = os.path.join(tmp, "fav.png")
    rasteriza(SVG_OUT, 64, fav)
    uri = "data:image/png;base64," + base64.b64encode(open(fav, "rb").read()).decode("ascii")
    novo = f'<link rel="icon" type="image/png" href="{uri}">'
    for pag in PAGINAS:
        p = os.path.join(ROOT, pag)
        s = open(p, encoding="utf-8").read()
        s2, n = re.subn(r'<link rel="icon"[^>]*>', lambda _: novo, s, count=1)
        if n != 1:
            sys.exit(f"{pag}: nao encontrei o <link rel=\"icon\">")
        open(p, "w", encoding="utf-8").write(s2)
    print(f"favicon (64x64, {len(uri) / 1024:.1f} KB em base64) escrito em {', '.join(PAGINAS)}")

    rasteriza(SVG_OUT, 1024, BIG_OUT)
    print("tools/logo-1024.png  para o Instagram, o Shopify, o email (nao vai para o ar)")


if __name__ == "__main__":
    main()

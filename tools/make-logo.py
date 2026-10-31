#!/usr/bin/env python3
"""
make-logo.py — o logotipo do site: o G e o traco de tinta, numa moeda do azul do ceu.

PARA QUE SERVE
  Desde o fim de Outubro de 2026 o logotipo ja nao e o sapo (pedido do Frede:
  "um logotipo que combine melhor com o site"). O sapo era verde, a unica cor
  da pagina fora do ceu; o site passou a ser o ceu do Survival of Kings e o
  logotipo passou a ser dele tambem:

    - a moeda e o azul do topo do ceu (--sky de dia, #0E5CAB). Redonda, como
      era a do sapo: a mesma pegada na barra, no separador do browser, no
      Shopify e na foto do Instagram (que ja e um circulo);
    - o G e o G de Guita, no Playfair Display Medium Italico, a letra dos
      titulos do site. Nao e desenhado a mao: sao os contornos da propria
      fonte, tirados com o fontTools, por isso batem certo com o resto;
    - o traco a seguir ao G e o "_" de Guita_Ink, desenhado como uma pincelada
      de tinta: grosso a esquerda, a afinar para a direita, como a pena quando
      levanta. O G e o _ dizem o nome; o traco diz o Ink.

  Branco sobre o azul: 6,69:1. A moeda e a mesma nos dois temas; na barra da
  noite (#081A28) destaca-se a 2,64:1, pela cor e pelo G branco dentro dela.

  Um comando, tres saidas:
    images/logo.svg        o logotipo (barra das tres paginas, cartao de partilha)
    o <link rel="icon">    dos quatro .html, como data URI PNG de 64x64
                           (assim o 404 continua sozinho: o Netlify serve-o em
                           qualquer endereco e um caminho relativo partia-se)
    tools/logo-1024.png    a versao grande para usar fora do site (Instagram,
                           Shopify, assinatura de email). Nao vai para o ar.

QUANDO CORRER
  Quando o logotipo mudar (a cor da moeda, as proporcoes, a letra). Depois
  corre o tools/make-og-card.py, que usa o logo.svg.
  O sapo nao se perdeu: o desenho original continua em tools/frog-source.jpg,
  e o script que o tracava esta no historico do git (tools/make-frog-logo.py).

COMO CORRER
    python3 tools/make-logo.py

  Precisa de:  pip install fonttools
  e do Playwright com o Chromium (o mesmo do verify.mjs), para os PNG.
  A fonte vem do Google Fonts (a mesma que o site pede), por isso precisa de
  rede da primeira vez; nao fica guardada no repositorio.
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

MOEDA = "#0E5CAB"       # --sky do dia: o azul do topo do ceu
TINTA = "#FFFFFF"       # o G e o traco
# o Playfair Display 500 italico; o pedido com um user-agent de browser de
# secretaria faz o Google Fonts responder com TTF (o fontTools le-o directo)
FONTE_CSS = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,500&display=swap"

ALTURA = 272            # a altura das maiusculas do G, numa moeda de 512
BASE = 388              # a linha de base do G (e do traco)
TRACO = 0.42            # o comprimento do traco, em fraccao da altura do G
GROSSURA = 0.13         # a grossura do traco no lado grosso, idem
FOLGA = 0.02            # o espaco entre o G e o traco, idem


def baixa_fonte(pasta):
    pedido = urllib.request.Request(FONTE_CSS, headers={"User-Agent": "Mozilla/5.0"})
    css = urllib.request.urlopen(pedido, timeout=30).read().decode("utf-8")
    m = re.search(r"url\((https://fonts\.gstatic\.com/[^)]+\.ttf)\)", css)
    if not m:
        sys.exit("O Google Fonts nao devolveu um TTF. Sem rede?")
    caminho = os.path.join(pasta, "playfair-500-italic.ttf")
    urllib.request.urlretrieve(m.group(1), caminho)
    return caminho


def contorno_g(fonte, cx):
    """O G em contorno SVG: altura de maiusculas ALTURA, centrado em cx pela
    sua caixa real, com a linha de base em BASE. Devolve (path, caixa)."""
    f = TTFont(fonte)
    gs = f.getGlyphSet()
    g = f.getBestCmap()[ord("G")]
    k = ALTURA / f["OS/2"].sCapHeight
    bp = BoundsPen(gs)
    gs[g].draw(bp)
    xmin, ymin, xmax, ymax = bp.bounds
    ox = cx - (xmin + xmax) / 2 * k
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (k, 0, 0, -k, ox, BASE)))
    return pen.getCommands(), (xmin * k + ox, BASE - ymax * k, xmax * k + ox, BASE - ymin * k)


def svg_logo(fonte):
    # o G e o traco formam um par; e o par que fica ao centro da moeda
    _, (x0, _, x1, _) = contorno_g(fonte, 0)
    largura = (x1 - x0) + ALTURA * (FOLGA + TRACO)
    d, (x0, _, x1, _) = contorno_g(fonte, (256 - largura / 2) + (x1 - x0) / 2)
    bx, L, h = x1 + ALTURA * FOLGA, ALTURA * TRACO, ALTURA * GROSSURA
    r = h / 2
    # o traco de tinta: ponta redonda a esquerda, afina para a direita
    traco = (f"M{bx + r:.1f} {BASE - h:.1f}"
             f"C{bx + L * .45:.1f} {BASE - h * 1.02:.1f} {bx + L * .8:.1f} {BASE - h * .9:.1f} {bx + L:.1f} {BASE - h * .62:.1f}"
             f"C{bx + L * .82:.1f} {BASE - h * .18:.1f} {bx + L * .45:.1f} {BASE + h * .02:.1f} {bx + r:.1f} {BASE:.1f}"
             f"A{r:.1f} {r:.1f} 0 0 1 {bx + r:.1f} {BASE - h:.1f}Z")
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Guita_Ink">'
            f'<circle cx="256" cy="256" r="256" fill="{MOEDA}"/>'
            f'<path fill="{TINTA}" d="{d}"/><path fill="{TINTA}" d="{traco}"/></svg>\n')


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
    print("A buscar o Playfair Display italico ao Google Fonts…")
    fonte = baixa_fonte(tmp)
    svg = svg_logo(fonte)
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

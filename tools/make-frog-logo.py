#!/usr/bin/env python3
"""
make-frog-logo.py — o sapo e o logotipo: traca-o em vector e gera tudo o que sai dele.

PARA QUE SERVE
  Desde Outubro de 2026 o logotipo do site e o sapo do Frede, e ja nao o selo
  墨. O desenho original (tools/frog-source.jpg) e um JPEG: ruido de
  compressao a volta das linhas, e a 30px o sapo inteiro virava borrao.

  Este script NAO redesenha o sapo. Separa o desenho nas suas tintas (linha
  preta, verde do corpo, barriga, boca, lingua, olho e a sombra do olho), traca
  cada uma com o potrace e monta o sapo de novo em formas vectoriais: as mesmas
  linhas e proporcoes, com cores chapadas e arestas limpas em qualquer tamanho.

  O sapo assenta numa moeda do verde do site (--frog, #80AB5C): e o herdeiro do
  selo 墨, que era um quadrado de cor com uma marca. O corpo do sapo tem o mesmo
  verde da moeda, por isso e o contorno preto que o desenha, como um carimbo.
  A moeda redonda tem a mesma pegada em todo o lado: barra, separador do
  browser, Shopify, foto de perfil do Instagram (que ja e um circulo).

  Um comando, duas saidas:
    images/frog-logo.svg   o logotipo (barra do site, cartao de partilha)
    o <link rel="icon">    dos quatro .html, como data URI PNG de 64x64
                           (assim o 404 continua sozinho: o Netlify serve-o em
                           qualquer endereco e um caminho relativo partia-se)
  E deixa em tools/frog-logo-1024.png uma versao grande para usar fora do site
  (Instagram, Shopify, assinatura de email). Nao vai para o ar.

QUANDO CORRER
  Quando o sapo for redesenhado: troca tools/frog-source.jpg e corre isto.
  Depois corre o tools/make-og-card.py, que usa o frog-logo.svg.
  Se o desenho novo tiver cores novas, acrescenta-as a TINTAS (mede-as no
  desenho; foi assim que a sombra ocre do olho deixou de sair cor-de-rosa).

COMO CORRER
    python3 tools/make-frog-logo.py

  Precisa de:  pip install Pillow numpy potracer
  e do Playwright com o Chromium (o mesmo do verify.mjs), para o favicon.
"""

import base64
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

try:
    import potrace          # pip install potracer
except ImportError:
    sys.exit("Falta o potracer. Corre:  pip install potracer")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "frog-source.jpg")
SVG_OUT = os.path.join(ROOT, "images", "frog-logo.svg")
BIG_OUT = os.path.join(ROOT, "tools", "frog-logo-1024.png")
PAGINAS = ["index.html", "projeto.html", "loja.html", "404.html"]

INK = "#0A0A0A"                 # a linha: --void, nunca #000 puro
MOEDA = "#80AB5C"               # --frog, o verde do site
# as tintas do desenho, medidas nele (mediana de cada zona)
TINTAS = {
    "corpo":   "#80AB5C",
    "barriga": "#C9E4B9",
    "boca":    "#6F3A28",
    "lingua":  "#AA8477",
    "olho":    "#E2C259",
    "olho2":   "#B79D50",      # a metade ocre do olho
}
UP = 2                          # tracar a 2x da origem da curvas mais lisas
FOLGA = 0.90                    # o ponto mais afastado do sapo fica a 90% do raio


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def camadas(im):
    """Separa o desenho nas suas tintas. Devolve (silhueta, linha, {tinta: mascara})."""
    im = im.convert("RGB").resize((im.width * UP, im.height * UP), Image.BICUBIC)
    a = np.asarray(im).astype(np.float32)
    lum = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    # silhueta: tudo o que nao e o branco ligado a margem. .copy(): no Pillow 12
    # uma imagem feita de um array e so de leitura e o floodfill nao faz nada.
    claro = Image.fromarray(((a.min(axis=2) > 215) * 255).astype(np.uint8)).copy()
    w, h = claro.size
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if claro.getpixel(xy) == 255:
            ImageDraw.floodfill(claro, xy, 128)
    sil = np.asarray(claro) != 128

    def limpa(m, r):
        """abre a mascara: tira as franjas finas que o JPEG deixa nas arestas"""
        img = Image.fromarray((m * 255).astype(np.uint8))
        img = img.filter(ImageFilter.MinFilter(2 * r + 1)).filter(ImageFilter.MaxFilter(2 * r + 1))
        return np.asarray(img) > 127

    # a linha e o que e escuro. A boca (#6F3A28) e escura tambem, mas nao tanto.
    linha = limpa((lum < 55) & sil, 1)
    nomes = list(TINTAS)
    cores = np.array([hexrgb(TINTAS[n]) for n in nomes], dtype=np.float32)
    perto = ((a[..., None, :] - cores[None, None]) ** 2).sum(-1).argmin(-1)
    out = {}
    for i, n in enumerate(nomes):
        m = (perto == i) & sil & ~linha
        out[n] = limpa(m, UP if n.startswith("olho") else 2 * UP)
    return sil, linha, out


def traca(m, turd):
    """Uma mascara → um 'd' de SVG, nas coordenadas da imagem original."""
    bm = potrace.Bitmap(~m)     # o potracer le valores claros como fundo: tinta = False
    curvas = bm.trace(turdsize=turd, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
                      alphamax=1.0, opticurve=True, opttolerance=0.3)
    f = lambda p: f"{p.x / UP:.0f},{p.y / UP:.0f}"
    ds = []
    for c in curvas:
        d = [f"M{f(c.start_point)}"]
        for s in c.segments:
            if s.is_corner:
                d.append(f"L{f(s.c)}L{f(s.end_point)}")
            else:
                d.append(f"C{f(s.c1)} {f(s.c2)} {f(s.end_point)}")
        ds.append("".join(d) + "Z")
    return "".join(ds)


def svg_moeda(sil, linha, tintas):
    ys, xs = np.nonzero(sil)
    cx, cy = (xs.min() + xs.max()) / 2 / UP, (ys.min() + ys.max()) / 2 / UP
    rmax = np.sqrt((xs / UP - cx) ** 2 + (ys / UP - cy) ** 2).max()
    R = 500
    s = FOLGA * R / rmax
    corpo = [f'<path d="{traca(sil, 400)}" fill="{INK}" fill-rule="evenodd"/>']
    for n, m in tintas.items():
        if m.sum():
            # o traco da mesma cor fecha as frinchas entre tintas vizinhas; a
            # linha preta, por cima de tudo, repoe as arestas certas
            corpo.append(f'<path d="{traca(m, 12 * UP * UP)}" fill="{TINTAS[n]}" fill-rule="evenodd" '
                         f'stroke="{TINTAS[n]}" stroke-width="3" stroke-linejoin="round"/>')
    corpo.append(f'<path d="{traca(linha, 6 * UP * UP)}" fill="{INK}" fill-rule="evenodd"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {2 * R} {2 * R}">'
            f'<title>Guita_Ink</title>'
            f'<circle cx="{R}" cy="{R}" r="{R}" fill="{MOEDA}"/>'
            f'<g transform="translate({R},{R}) scale({s:.4f}) translate({-cx:.1f},{-cy:.1f})">'
            + "".join(corpo) + "</g></svg>")


RASTER = r"""
import { chromium } from 'playwright';
const [svg, png, lado] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +lado, height: +lado } });
await p.goto('file://' + svg);
await p.screenshot({ path: png, omitBackground: true });
await b.close();
"""


def rasteriza(svg_path, lado, png_path):
    """O SVG em PNG transparente, pelo Chromium (o mesmo que o verify.mjs usa)."""
    pw = "/opt/node22/lib/node_modules/playwright/index.mjs"
    tmp = tempfile.mkdtemp()
    js = os.path.join(tmp, "raster.mjs")
    open(js, "w").write(RASTER.replace("'playwright'", repr(pw) if os.path.exists(pw) else "'playwright'", 1))
    # uma pagina so com o SVG a encher o quadrado
    page = os.path.join(tmp, "p.html")
    open(page, "w").write(f'<html><body style="margin:0;background:transparent">'
                          f'<img src="file://{svg_path}" style="width:{lado}px;height:{lado}px;display:block"></body></html>')
    r = subprocess.run(["node", js, page, png_path, str(lado)], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("O Chromium falhou:\n" + (r.stderr or r.stdout))


def main():
    if not os.path.exists(SRC):
        sys.exit(f"falta o desenho original: {SRC}")
    print("A separar as tintas e a tracar…")
    sil, linha, tintas = camadas(Image.open(SRC))
    svg = svg_moeda(sil, linha, tintas)
    open(SVG_OUT, "w", encoding="utf-8").write(svg)
    print(f"images/frog-logo.svg  {len(svg) // 1024} KB")

    tmp = tempfile.mkdtemp()
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
    print(f"favicon (64x64, {len(uri) // 1024} KB em base64) escrito em {', '.join(PAGINAS)}")

    rasteriza(SVG_OUT, 1024, BIG_OUT)
    print("tools/frog-logo-1024.png  para o Instagram, o Shopify, o email (nao vai para o ar)")


if __name__ == "__main__":
    main()

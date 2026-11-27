#!/usr/bin/env python3
"""
make-og-card.py — gera o cartao de partilha, images/og-card.jpg (1200x630).

PARA QUE SERVE
  Quando alguem poe o link do site no Facebook, no LinkedIn, no WhatsApp ou no
  Discord, aparece um cartao com uma imagem. Essa imagem tem de ser deitada,
  1200x630. Durante muito tempo o site apontava para uma ilustracao vertical
  (1280x1600) e todos eles a cortavam ao meio, deixando de fora a cabeca e os
  pes do desenho.

  Este script desenha o cartao em HTML (tools/og-card.html), fotografa-o com o
  Chromium e grava o resultado. E HTML porque assim o cartao usa as mesmas
  cores, o mesmo tipo de letra e o mesmo selo do site, sem ser preciso abrir um
  editor de imagem.

  As fontes sao as do proprio site (pasta fonts/, desde Out 2026 (3)), metidas
  dentro da pagina em base64. Sem isso o Chromium desenhava com a letra de
  reserva, e o cartao ficava com outra letra que nao a do site.

QUANDO CORRER
  Quando mudares a arte do cartao, o nome, ou os factos que ele mostra.
  Depois de correr, confirma que o og:image no index.html e no projeto.html
  continua a apontar para images/og-card.jpg.

COMO CORRER
    python3 tools/make-og-card.py

  Precisa de:  pip install Pillow     e o Playwright com o Chromium.
"""

import base64
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(ROOT, "tools")
TEMPLATE = os.path.join(TOOLS, "og-card.html")
OUT = os.path.join(ROOT, "images", "og-card.jpg")

FONTES = os.path.join(ROOT, "fonts")
# as tres letras do site: (familia, peso, ficheiro)
FACES = [("Shippori Mincho B1", 700, "shippori-mincho-b1-700-latin.woff2"),
         ("Zen Kaku Gothic New", 400, "zen-kaku-gothic-new-400-latin.woff2"),
         ("Zen Kaku Gothic New", 500, "zen-kaku-gothic-new-500-latin.woff2")]


def embedded_fonts():
    """As letras do site (pasta fonts/) como @font-face em base64."""
    faces = []
    for fam, peso, ficheiro in FACES:
        caminho = os.path.join(FONTES, ficheiro)
        if not os.path.exists(caminho):
            print(f"  ! falta {ficheiro} — o cartao sai com a letra de reserva")
            continue
        b64 = base64.b64encode(open(caminho, "rb").read()).decode()
        faces.append(f"@font-face{{font-family:'{fam}';font-weight:{peso};"
                     f"src:url(data:font/woff2;base64,{b64}) format('woff2')}}")
        print(f"  fonte embebida: {fam} {peso}")
    return "<style>" + "\n".join(faces) + "</style>"


SHOT = r"""
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1200,height:630}, deviceScaleFactor:1 });
await p.goto('file://' + process.argv[2], { waitUntil:'networkidle' });
await p.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0),
                        null, { timeout:30000 }).catch(()=>{});
await p.waitForTimeout(1200);
await p.screenshot({ path: process.argv[3] });
await b.close();
"""


def playwright_path():
    for c in ("/opt/node22/lib/node_modules/playwright/index.mjs", "playwright"):
        if c == "playwright" or os.path.exists(c):
            return c
    return "playwright"


def main():
    if not os.path.exists(TEMPLATE):
        sys.exit(f"Falta o molde: {TEMPLATE}")

    print("A buscar as fontes…")
    html = open(TEMPLATE, encoding="utf-8").read().replace("<!--FONTS-->", embedded_fonts())

    tmp = tempfile.mkdtemp()
    page = os.path.join(tmp, "card.html")
    png = os.path.join(tmp, "card.png")
    # o molde aponta para ../images/, por isso a pagina tem de viver em tools/
    page = os.path.join(TOOLS, ".og-card-build.html")
    open(page, "w", encoding="utf-8").write(html)

    shot = os.path.join(tmp, "shot.mjs")
    open(shot, "w", encoding="utf-8").write(
        SHOT.replace("'playwright'", repr(playwright_path()), 1))

    print("A fotografar com o Chromium…")
    r = subprocess.run(["node", shot, page, png], capture_output=True, text=True)
    os.remove(page)
    if r.returncode != 0 or not os.path.exists(png):
        sys.exit("O Chromium falhou:\n" + (r.stderr or r.stdout))

    try:
        from PIL import Image
    except ImportError:
        sys.exit("Falta a Pillow. Corre:  pip install Pillow")

    with Image.open(png) as im:
        if im.size != (1200, 630):
            print(f"  ! saiu {im.size[0]}x{im.size[1]}, esperava 1200x630")
        im.convert("RGB").save(OUT, "JPEG", quality=88, optimize=True, progressive=True)

    print(f"\nFeito: images/og-card.jpg  {os.path.getsize(OUT) // 1024} KB")
    print("Confirma que o og:image aponta para ele no index.html e no projeto.html.")


if __name__ == "__main__":
    main()

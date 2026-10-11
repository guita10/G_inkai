#!/usr/bin/env python3
"""
make-frog-logo.py — o sapo e o logotipo: recorta-o e gera tudo o que sai dele.

PARA QUE SERVE
  Desde Outubro de 2026 o logotipo do site e o sapo do Frede, e ja nao o selo
  墨. O desenho original (tools/frog-source.jpg) vem com fundo branco e
  contorno preto. No tema escuro o contorno preto desaparecia no fundo
  (#0A0A0A), por isso o sapo ganha uma borda clara a toda a volta, como um
  autocolante recortado: le-se no escuro e no claro.

  Um comando, tres saidas:
    images/frog-logo.png     o logotipo da barra (108px de altura = 3x os 36px
                             a que aparece, para ecras retina)
    images/frog-sticker.png  o mesmo, maior (360px), para o cartao de partilha
    o <link rel="icon">      dos quatro .html, como data URI PNG de 64x64
                             (assim o 404 continua sozinho: o Netlify serve-o em
                             qualquer endereco e um caminho relativo partia-se)

QUANDO CORRER
  Quando o sapo for redesenhado: troca tools/frog-source.jpg e corre isto.
  Depois corre o tools/make-og-card.py, que usa o frog-sticker.png.

COMO CORRER
    python3 tools/make-frog-logo.py

  Precisa de:  pip install Pillow numpy
"""

import base64
import io
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "frog-source.jpg")
PAGINAS = ["index.html", "projeto.html", "loja.html", "404.html"]

BONE = (242, 240, 236)          # --bone, a cor da borda de autocolante
MESTRE_H = 360                  # altura do sapo-mestre, de onde sai tudo
BORDA = 11                      # px de borda clara, a 360px de altura


def recorta(im):
    """Fundo branco → transparente. So o branco LIGADO A MARGEM sai: o brilho
    branco dentro da boca fica, porque o contorno preto o fecha."""
    rgb = np.asarray(im.convert("RGB")).astype(np.float32)
    lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    claro = (rgb.min(axis=2) > 215).astype(np.uint8) * 255
    # .copy(): no Pillow 12 uma imagem feita de um array numpy e so de leitura,
    # e o floodfill nela nao faz nada, sem dar erro nenhum
    mapa = Image.fromarray(claro, "L").copy()
    w, h = mapa.size
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if mapa.getpixel(xy) == 255:
            ImageDraw.floodfill(mapa, xy, 128)
    fora = np.asarray(mapa) == 128
    # a franja: os pixeis cinzentos entre o branco de fora e o contorno preto.
    # Ficam pretos, com a opacidade que a escuridao deles diz.
    perto = np.asarray(Image.fromarray(fora.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0
    alfa = np.full(lum.shape, 255.0, dtype=np.float32)
    franja = perto
    alfa[franja] = np.clip((255 - lum[franja]) * 1.15, 0, 255)
    alfa[fora & (lum > 245)] = 0
    cor = rgb.copy()
    cor[franja] = 0
    rgba = np.dstack([cor, alfa]).astype(np.uint8)
    out = Image.fromarray(rgba, "RGBA")
    return out.crop(out.getbbox())


def autocolante(sapo):
    """Reduz para o mestre e poe a borda clara por baixo."""
    esc = MESTRE_H / sapo.height
    tam = (round(sapo.width * esc), MESTRE_H)
    # reduzir em alfa pre-multiplicado, senao a franja fica com um halo claro
    pequeno = sapo.convert("RGBa").resize(tam, Image.LANCZOS).convert("RGBA")
    pad = BORDA + 3
    tela = Image.new("RGBA", (tam[0] + 2 * pad, tam[1] + 2 * pad), (0, 0, 0, 0))
    tela.paste(pequeno, (pad, pad), pequeno)
    mascara = tela.getchannel("A").point(lambda v: 255 if v > 60 else 0)
    for _ in range(BORDA):
        mascara = mascara.filter(ImageFilter.MaxFilter(3))
    mascara = mascara.filter(ImageFilter.GaussianBlur(1.1))
    fundo = Image.new("RGBA", tela.size, BONE + (0,))
    fundo.putalpha(mascara)
    return Image.alpha_composite(fundo, tela)


def guarda_png(im, caminho, altura=None):
    if altura:
        im = im.convert("RGBa").resize((round(im.width * altura / im.height), altura), Image.LANCZOS).convert("RGBA")
    im.save(caminho, optimize=True)
    return im


def favicon(mestre):
    """64x64, o sapo inteiro dentro do quadrado, centrado."""
    lado, margem = 64, 2
    esc = (lado - 2 * margem) / max(mestre.size)
    tam = (round(mestre.width * esc), round(mestre.height * esc))
    p = mestre.convert("RGBa").resize(tam, Image.LANCZOS).convert("RGBA")
    q = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    q.paste(p, ((lado - tam[0]) // 2, (lado - tam[1]) // 2), p)
    buf = io.BytesIO()
    q.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def main():
    if not os.path.exists(SRC):
        sys.exit(f"falta o desenho original: {SRC}")
    mestre = autocolante(recorta(Image.open(SRC)))
    logo = guarda_png(mestre, os.path.join(ROOT, "images", "frog-logo.png"), altura=108)
    guarda_png(mestre, os.path.join(ROOT, "images", "frog-sticker.png"))
    print(f"images/frog-logo.png     {logo.width}x{logo.height}")
    print(f"images/frog-sticker.png  {mestre.width}x{mestre.height}")

    uri = favicon(mestre)
    novo = f'<link rel="icon" type="image/png" href="{uri}">'
    for pag in PAGINAS:
        p = os.path.join(ROOT, pag)
        s = open(p, encoding="utf-8").read()
        s2, n = re.subn(r'<link rel="icon"[^>]*>', lambda _: novo, s, count=1)
        if n != 1:
            sys.exit(f"{pag}: nao encontrei o <link rel=\"icon\">")
        open(p, "w", encoding="utf-8").write(s2)
    print(f"favicon (64x64, {len(uri) // 1024} KB em base64) escrito em {', '.join(PAGINAS)}")
    # a medida da barra: o <img> leva width/height para nao saltar ao carregar
    print(f"no <img> do logotipo: width=\"{round(36 * logo.width / logo.height)}\" height=\"36\"")


if __name__ == "__main__":
    main()

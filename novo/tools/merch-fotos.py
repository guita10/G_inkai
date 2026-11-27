#!/usr/bin/env python3
"""merch-fotos.py — as fotos da loja do site novo, uma por desenho e cor.

PARA QUE SERVE
  O cartao de cada produto (e o palco, no computador) mostra a peca no
  desenho e na cor escolhidos, e os botoes do desenho levam uma miniatura.
  Este script faz essas imagens a partir dos mockups de 2000 px que ja estao
  no repositorio (merch/drop-01 e merch/oc-prints, os mesmos do Shopify):

    images/merch/<nome>.jpg       1000x1000, a peca a ocupar o quadro
    images/merch/mini/<nome>.jpg  160x160, so a zona do desenho (os botoes)

  Nao redesenha nada: so recorta a margem vazia a volta da peca e reduz. A
  arte e a peca ficam inteiras. Os nomes sao os de merch/ (tshirt-queen-
  black, print-oc-01, sticker-sumo, ...), e o campo `foto` de cada produto
  no CONFIG (loja.html) diz como se monta o nome a partir das escolhas.

  Quando chegarem os mockups da Printful, poem-se em merch/ com os mesmos
  nomes e corre-se isto outra vez.

USO (da raiz do repositorio)
  python3 novo/tools/merch-fotos.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

RAIZ = Path(__file__).resolve().parents[2]
FONTES = [RAIZ / 'merch' / 'drop-01', RAIZ / 'merch' / 'oc-prints']
SAI, MINI = RAIZ / 'images' / 'merch', RAIZ / 'images' / 'merch' / 'mini'
NOMES = ([f'{p}-{d}-{c}' for p in ('tshirt', 'hoodie') for d in ('queen', 'monk', 'sumo') for c in ('black', 'white')]
         + [f'sticker-{d}' for d in ('queen', 'monk', 'sumo')]
         + [f'print-oc-0{n}' for n in (1, 2, 3)])
LADO, LADO_MINI = 1000, 160


def fonte(nome):
    for d in FONTES:
        f = d / (nome + '.jpg')
        if f.exists():
            return f
    raise SystemExit(f'falta o mockup {nome}.jpg em merch/')


def caixa_peca(a):
    """a peca: tudo o que difere do fundo. O fundo e um degrade vertical, por
    isso compara-se cada linha com a cor das suas pontas."""
    fundo = (a[:, :8].mean(1) + a[:, -8:].mean(1)) / 2
    dif = np.abs(a - fundo[:, None, :]).max(2) > 22
    ys, xs = np.where(dif)
    return xs.min(), ys.min(), xs.max(), ys.max()


def caixa_arte(a):
    """o desenho: os pixeis com cor (a peca e preta, branca ou bege)"""
    sat = (a.max(2) - a.min(2)) > 40
    ys, xs = np.where(sat)
    return xs.min(), ys.min(), xs.max(), ys.max()


def quadrado(im, caixa, folga):
    x0, y0, x1, y1 = caixa
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    lado = max(x1 - x0, y1 - y0) * folga
    lado = min(lado, im.width, im.height)
    l = min(max(cx - lado / 2, 0), im.width - lado)
    t = min(max(cy - lado / 2, 0), im.height - lado)
    return im.crop((round(l), round(t), round(l + lado), round(t + lado)))


def main():
    SAI.mkdir(parents=True, exist_ok=True); MINI.mkdir(parents=True, exist_ok=True)
    for nome in NOMES:
        im = Image.open(fonte(nome)).convert('RGB')
        a = np.asarray(im).astype(int)
        grande = quadrado(im, caixa_peca(a), 1.14).resize((LADO, LADO), Image.LANCZOS)
        grande.save(SAI / (nome + '.jpg'), quality=84, optimize=True, progressive=True)
        mini = quadrado(im, caixa_arte(a), 1.12).resize((LADO_MINI, LADO_MINI), Image.LANCZOS)
        mini.save(MINI / (nome + '.jpg'), quality=82, optimize=True)
        print(f'{nome}: {(SAI / (nome + ".jpg")).stat().st_size // 1024} KB, mini {(MINI / (nome + ".jpg")).stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()

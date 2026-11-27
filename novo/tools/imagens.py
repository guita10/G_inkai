"""imagens.py — o que o site novo precisa de saber das imagens.

PARA QUE SERVE
  1. novo/mini/<nome>.webp: uma miniatura pequena (360px no lado maior) de cada
     obra, para as folhas de molduras. As miniaturas de 760px que ja existem em
     images/thumb/ pesam 40-80 KB cada; uma folha com 37 pedia quase 2 MB.
  2. novo/dims.js: as medidas reais de cada imagem (grande e miniatura) e se
     existe a versao .webp. E com isto que cada moldura nasce ja com a sua
     proporcao, sem a pagina saltar.

COMO SE USA (a partir da raiz do repositorio, depois de arte nova entrar em
images/ pelo tools/add-artwork.py do costume):
    python3 novo/tools/imagens.py

So le images/ e images/thumb/; nunca lhes mexe. Precisa do Pillow.
"""
import json, os, sys
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
NOVO = os.path.dirname(AQUI)
RAIZ = os.path.dirname(NOVO)
IMG = os.path.join(RAIZ, 'images')
THUMB = os.path.join(IMG, 'thumb')
MINI = os.path.join(NOVO, 'mini')
FORA = {'og-card.jpg'}          # o cartao de partilha nao e uma obra
LADO = 360


def medidas(caminho):
    with Image.open(caminho) as im:
        return im.size


def main():
    os.makedirs(MINI, exist_ok=True)
    dims, feitas = {}, 0
    for f in sorted(os.listdir(IMG)):
        if not f.endswith('.jpg') or f in FORA:
            continue
        k = f[:-4]
        w, h = medidas(os.path.join(IMG, f))
        t = os.path.join(THUMB, f)
        if not os.path.exists(t):
            sys.exit(f'falta a miniatura de {f}: corre primeiro o tools/add-artwork.py')
        tw, th = medidas(t)
        dims[k] = {
            'w': w, 'h': h, 'tw': tw, 'th': th,
            'f': int(os.path.exists(os.path.join(IMG, k + '.webp'))),
            't': int(os.path.exists(os.path.join(THUMB, k + '.webp'))),
        }
        dest = os.path.join(MINI, k + '.webp')
        if not os.path.exists(dest) or os.path.getmtime(dest) < os.path.getmtime(t):
            with Image.open(t) as im:
                im = im.convert('RGB')
                im.thumbnail((LADO, LADO), Image.LANCZOS)
                im.save(dest, 'WEBP', quality=74, method=6)
            feitas += 1
    # miniaturas de obras que ja sairam do site
    for f in os.listdir(MINI):
        if f.endswith('.webp') and f[:-5] not in dims:
            os.remove(os.path.join(MINI, f))
    linhas = ',\n'.join(f'  {json.dumps(k)}: {json.dumps(v, separators=(",", ":"))}' for k, v in dims.items())
    with open(os.path.join(NOVO, 'dims.js'), 'w', encoding='utf-8') as o:
        o.write('/* GERADO por novo/tools/imagens.py a partir dos pixeis reais. Nao editar a mao.\n'
                '   w,h = imagem grande; tw,th = miniatura de 760px; f,t = existe o .webp de cada uma. */\n'
                'window.DIMS = {\n' + linhas + '\n};\n')
    print(f'{len(dims)} imagens medidas, {feitas} miniaturas novas em novo/mini/')


if __name__ == '__main__':
    main()

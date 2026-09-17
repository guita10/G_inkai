#!/usr/bin/env python3
"""
dims.py — reescreve o mapa DIMS do index.html a partir dos pixeis reais.

PARA QUE SERVE
  O index.html tem uma linha com o mapa DIMS: para cada ficheiro em images/,
  o tamanho em pixeis do original e o da miniatura. Esse mapa faz tres coisas
  e todas partem do mesmo numero:

    1. os atributos width/height de cada <img>. Sao eles que fazem o browser
       reservar o espaco certo ANTES de a imagem chegar. E o que mantem o CLS
       (o salto da pagina a carregar) a zero.
    2. o srcset da obra do hero, que so funciona se as larguras estiverem certas.
    3. a proporcao de cada moldura, via --ar. E daqui que vem a regra de que
       nenhuma arte e cortada: a moldura toma a forma do ficheiro.

  Escrever este mapa a mao e onde as coisas partem em silencio — um numero
  trocado nao da erro nenhum, so volta a por a pagina a saltar. Por isso
  existe este script: le os ficheiros e escreve o mapa por ti.

QUANDO CORRER
  Sempre que adicionares, substituires ou apagares arte em images/.
  Depois do tools/add-artwork.py (que ja o chama sozinho no fim).

COMO CORRER
    python3 tools/dims.py            # reescreve o mapa no index.html
    python3 tools/dims.py --check    # so diz o que mudaria, nao escreve nada

  Precisa de:  pip install Pillow
"""

import json
import os
import re
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta a Pillow. Corre:  pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FULL = os.path.join(ROOT, "images")
THUMB = os.path.join(FULL, "thumb")
PAGE = os.path.join(ROOT, "index.html")

# A linha do mapa no index.html. O ; final faz parte para nao apanhar de mais.
PATTERN = re.compile(r"const DIMS = (\{.*?\});")


def build():
    """Le images/ e images/thumb/ e devolve o mapa {ficheiro: {w,h,tw,th}}."""
    out, missing = {}, []
    for name in sorted(os.listdir(FULL)):
        if not name.lower().endswith((".jpg", ".jpeg")):
            continue
        thumb = os.path.join(THUMB, name)
        if not os.path.exists(thumb):
            missing.append(name)
            continue
        with Image.open(os.path.join(FULL, name)) as im:
            w, h = im.size
        with Image.open(thumb) as im:
            tw, th = im.size
        out[name] = {"w": w, "h": h, "tw": tw, "th": th}
    return out, missing


def main():
    check = "--check" in sys.argv

    dims, missing = build()
    for name in missing:
        print(f"  ! {name}: nao tem miniatura em images/thumb/ — fora do mapa")

    # O mapa fica numa linha so, ficheiros por ordem alfabetica e, dentro de
    # cada um, sempre w,h,tw,th — a mesma ordem que ja la estava. Se deixasse
    # o json ordenar tudo, sairia h,th,tw,w e o diff mudava as 28 linhas sem
    # necessidade. Por isso e montado a mao.
    body = ",".join(
        '%s:{"w":%d,"h":%d,"tw":%d,"th":%d}' % (json.dumps(k), d["w"], d["h"], d["tw"], d["th"])
        for k, d in sorted(dims.items())
    )
    line = "const DIMS = {" + body + "};"

    src = open(PAGE, encoding="utf-8").read()
    found = PATTERN.search(src)
    if not found:
        sys.exit("Nao encontrei a linha 'const DIMS = {...};' no index.html.")

    old = json.loads(found.group(1))
    added = sorted(set(dims) - set(old))
    gone = sorted(set(old) - set(dims))
    changed = sorted(k for k in set(dims) & set(old) if dims[k] != old[k])

    for k in added:
        print(f"  + {k}: {dims[k]['w']}x{dims[k]['h']} (miniatura {dims[k]['tw']}x{dims[k]['th']})")
    for k in gone:
        print(f"  - {k}: ja nao existe em images/ — retirado do mapa")
    for k in changed:
        o, n = old[k], dims[k]
        print(f"  ~ {k}: {o['w']}x{o['h']} -> {n['w']}x{n['h']}")

    if not (added or gone or changed):
        print(f"Mapa ja certo: {len(dims)} imagens, nada a mudar.")
        if "--force" not in sys.argv:
            return

    if check:
        print("\n(--check: nao foi escrito nenhum ficheiro)")
        return

    open(PAGE, "w", encoding="utf-8").write(src[:found.start()] + line + src[found.end():])
    print(f"\nFeito: mapa reescrito com {len(dims)} imagens.")


if __name__ == "__main__":
    main()

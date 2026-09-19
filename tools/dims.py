#!/usr/bin/env python3
"""
dims.py — reescreve tudo o que sai dos pixeis reais das imagens.

PARA QUE SERVE
  Tres coisas nas paginas sao numeros calculados a partir dos ficheiros que
  estao em images/. Escrever qualquer uma delas a mao e onde as coisas partem
  em silencio: um numero trocado nao da erro nenhum, so volta a por a pagina
  a saltar enquanto carrega. Por isso existe este script.

  1. O MAPA DIMS — para cada ficheiro, o tamanho em pixeis do original e o da
     miniatura. Faz tres coisas, todas a partir do mesmo numero:
       a) os atributos width/height de cada <img>. Sao eles que fazem o
          browser reservar o espaco certo ANTES de a imagem chegar.
       b) o srcset da obra do hero, que so funciona com as larguras certas.
       c) a proporcao de cada moldura, via --ar. E daqui que vem a regra de
          que nenhuma arte e cortada: a moldura toma a forma do ficheiro.

  2. A ALTURA RESERVADA DA PAREDE — os tres min-height do .wall, um por cada
     numero de colunas (4, 3, 2). A parede so nasce quando o JS la do fundo
     corre; sem espaco reservado antes disso, empurrava para baixo tudo o que
     vem a seguir. A conta esta explicada no proprio index.html e depende de
     duas coisas que mudam sempre que mexes na galeria: quantas obras ha e
     qual a soma das proporcoes delas. Era isto que ate agora tinhas de
     actualizar a mao sempre que juntavas arte.

  3. O PROJ_DIMS DA projeto.html — o mesmo que o ponto 1, mas so para as tres
     artes dos projectos, que e do que aquela pagina precisa. Sem ele a caixa
     da imagem tinha altura zero e a nota e o rodape saltavam ao carregar.

QUANDO CORRER
  Sempre que adicionares, substituires ou apagares arte em images/, ou sempre
  que mexeres no artworks do CONFIG. Depois do tools/add-artwork.py (que ja o
  chama sozinho no fim).

COMO CORRER
    python3 tools/dims.py            # reescreve o que estiver errado
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
PROJ = os.path.join(ROOT, "projeto.html")

# A linha do mapa no index.html. O ; final faz parte para nao apanhar de mais.
PATTERN = re.compile(r"const DIMS = (\{.*?\});")

# A lista de obras da parede, dentro do CONFIG.
ARTWORKS = re.compile(r"\n  artworks:\s*\[(.*?)\n  \],", re.S)

# Cada um dos tres min-height do .wall. A contagem de colunas vem de dentro do
# proprio min-height, por isso um so padrao chega para os tres.
RESERVE = re.compile(
    r"min-height:calc\([\d.]+ \* \(var\(--wall-w\) - \d+px\) / (\d+) \+ \d+px\)")

# O mapa pequeno da pagina de projecto. So as artes dos projectos, so w e h:
# aquela pagina nao usa miniaturas. Era o ultimo mapa de pixeis escrito a mao.
PROJ_DIMS = re.compile(r"const PROJ_DIMS = \{.*?\n\};", re.S)

# Os projectos, para saber que ficheiros entram no PROJ_DIMS.
PROJECTS = re.compile(r"\n  projects:\s*\[(.*?)\n  \],", re.S)

# O espaco entre colunas e por baixo de cada moldura: column-gap e margin-bottom
# do .frame, os dois a 14px. Se mexeres num, mexe aqui.
GAP = 14

# Ficheiros que vivem em images/ sem serem obras da galeria: nao tem
# miniatura, nao entram no mapa e nao ha nada de errado com isso.
NOT_ARTWORK = {"og-card.jpg"}


def build():
    """Le images/ e images/thumb/ e devolve o mapa {ficheiro: {w,h,tw,th}}."""
    out, missing = {}, []
    for name in sorted(os.listdir(FULL)):
        if not name.lower().endswith((".jpg", ".jpeg")):
            continue
        if name in NOT_ARTWORK:
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


def dims_line(dims):
    """O mapa numa linha so.

    Ficheiros por ordem alfabetica e, dentro de cada um, sempre w,h,tw,th — a
    mesma ordem que ja la estava. Se deixasse o json ordenar tudo, sairia
    h,th,tw,w e o diff mudava as linhas todas sem necessidade. Por isso e
    montado a mao.
    """
    body = ",".join(
        '%s:{"w":%d,"h":%d,"tw":%d,"th":%d}' % (json.dumps(k), d["w"], d["h"], d["tw"], d["th"])
        for k, d in sorted(dims.items())
    )
    return "const DIMS = {" + body + "};"


def wall(src, dims):
    """Quantas obras tem a parede e quanto somam as proporcoes delas.

    A soma e das miniaturas, que sao o que a parede serve. Devolve tambem os
    nomes que estao no artworks sem estarem no mapa: sao obras que o CONFIG
    promete e que o browser nao vai conseguir medir.
    """
    found = ARTWORKS.search(src)
    if not found:
        sys.exit("Nao encontrei a lista 'artworks: [...]' no index.html.")
    names = re.findall(r'src:\s*"images/([^"]+)"', found.group(1))
    orphans = [n for n in names if n not in dims]
    total = sum(dims[n]["th"] / dims[n]["tw"] for n in names if n in dims)
    return len(names), total, orphans


def reserve_value(cols, count, total):
    """O min-height de uma parede de `cols` colunas.

    A altura de uma parede em n colunas e a soma das proporcoes de todas as
    pecas vezes a largura de uma coluna, tudo a dividir pelo numero de
    colunas, mais as margens por baixo das molduras. A largura de uma coluna e
    a largura da parede menos as goteiras, tambem a dividir por n — e por isso
    que o (n-1)*14 esta la dentro.

    Da de proposito 1 a 5% ABAIXO do real: reservar a menos deixa a pagina
    assentar uns pixeis, reservar a mais abre um buraco que depois fecha, o
    que conta como salto na mesma.
    """
    coef = f"{total / cols:.2f}".rstrip("0").rstrip(".")
    gutters = (cols - 1) * GAP
    margins = round(count / cols * GAP)
    return f"min-height:calc({coef} * (var(--wall-w) - {gutters}px) / {cols} + {margins}px)"


def proj_block(src, dims):
    """O PROJ_DIMS da projeto.html, a partir das artes dos projectos.

    Aquela pagina tem um mapa so dela porque nao precisa do resto. Estava a ser
    escrito a mao, com o mesmo problema de sempre: um numero trocado nao da
    erro, so poe a nota e o rodape a saltar quando a imagem chega.
    """
    found = PROJECTS.search(src)
    if not found:
        sys.exit("Nao encontrei a lista 'projects: [...]' no index.html.")
    files = [f for f in re.findall(r'src:\s*"images/([^"]+)"', found.group(1))]
    rows, orphans = [], []
    pad = max((len(f) for f in files), default=0) + 3
    for f in files:
        if f not in dims:
            orphans.append(f)
            continue
        rows.append('  %-*s {w:%d, h:%d},' % (pad, '"%s":' % f, dims[f]["w"], dims[f]["h"]))
    return "const PROJ_DIMS = {\n" + "\n".join(rows) + "\n};", orphans


def main():
    check = "--check" in sys.argv
    force = "--force" in sys.argv
    src = open(PAGE, encoding="utf-8").read()

    # ---- 1. o mapa -------------------------------------------------------
    dims, missing = build()
    for name in missing:
        print(f"  ! {name}: nao tem miniatura em images/thumb/ — fora do mapa")

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

    src = src[:found.start()] + dims_line(dims) + src[found.end():]
    map_dirty = bool(added or gone or changed)
    if not map_dirty:
        print(f"Mapa ja certo: {len(dims)} imagens, nada a mudar.")

    # ---- 2. a altura reservada da parede ---------------------------------
    # Depois do mapa, de proposito: a soma das proporcoes sai dos numeros
    # novos, nao dos que la estavam.
    count, total, orphans = wall(src, dims)
    for n in orphans:
        print(f"  ! {n}: esta no artworks mas nao tem imagem — fora da conta da parede")

    wall_dirty = False
    out, last = [], 0
    for m in RESERVE.finditer(src):
        cols = int(m.group(1))
        new = reserve_value(cols, count, total)
        if new != m.group(0):
            wall_dirty = True
            print(f"  ~ parede a {cols} colunas: {m.group(0)}\n"
                  f"                         -> {new}")
        out.append(src[last:m.start()] + new)
        last = m.end()
    out.append(src[last:])

    if len(out) != 4:
        sys.exit(f"Esperava tres min-height do .wall no index.html, encontrei {len(out) - 1}.")
    src = "".join(out)

    if not wall_dirty:
        print(f"Parede ja certa: {count} obras, proporcoes somam {total:.2f}.")

    # ---- 3. o mapa da pagina de projecto ----------------------------------
    psrc = open(PROJ, encoding="utf-8").read()
    block, porphans = proj_block(src, dims)
    for n in porphans:
        print(f"  ! {n}: e a arte de um projecto mas nao esta em images/ — fora do PROJ_DIMS")
    pfound = PROJ_DIMS.search(psrc)
    if not pfound:
        sys.exit("Nao encontrei o 'const PROJ_DIMS = {...};' no projeto.html.")
    proj_dirty = pfound.group(0) != block
    if proj_dirty:
        print("  ~ projeto.html: PROJ_DIMS actualizado")
    else:
        print(f"PROJ_DIMS ja certo: {len(block.splitlines()) - 2} artes de projecto.")
    psrc = psrc[:pfound.start()] + block + psrc[pfound.end():]

    # ---- 4. escrever -----------------------------------------------------
    if not (map_dirty or wall_dirty or proj_dirty or force):
        return
    if check:
        print("\n(--check: nao foi escrito nenhum ficheiro)")
        return

    if map_dirty or wall_dirty or force:
        open(PAGE, "w", encoding="utf-8").write(src)
    if proj_dirty or force:
        open(PROJ, "w", encoding="utf-8").write(psrc)
    print(f"\nFeito: {len(dims)} imagens no mapa, parede reservada para {count} obras.")


if __name__ == "__main__":
    main()

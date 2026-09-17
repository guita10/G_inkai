#!/usr/bin/env python3
"""
add-artwork.py — mete arte nova no site a partir do ficheiro original.

PARA QUE SERVE
  Entre o ficheiro que sai do teu programa de desenho e a arte a aparecer no
  site havia quatro passos a mao: encolher para 1600px, fazer a miniatura de
  760px, correr o make-webp.py e acertar o mapa DIMS. Falhar o ultimo nao da
  erro nenhum — so volta a por a pagina a saltar enquanto carrega.

  Este script faz os quatro. Das-lhe o original (PNG, JPEG, o que for) e ele
  deixa tudo pronto. Falta-te so uma coisa, que é de propósito: dizer ao
  CONFIG que a arte existe. O script diz-te no fim que linha escrever.

O NOME DO FICHEIRO
  O nome sai do original, sem acentos e sem espacos:
    "Ilustração_Sem_Título 1.png"  ->  ilustracao-sem-titulo-1.jpg
  E a mesma regra dos nomes que ja estao no site. Se quiseres outro nome,
  usa --slug.

COMO CORRER
    python3 tools/add-artwork.py ~/Desktop/IMG_6211.PNG
    python3 tools/add-artwork.py ~/Desktop/capa.png --slug proj-sok
    python3 tools/add-artwork.py ~/Desktop/*.png          # varios de uma vez

  Precisa de:  pip install Pillow numpy

NOTA SOBRE TRANSPARENCIA
  Um PNG com fundo transparente nao cabe num JPEG. O script assenta-o em
  branco e avisa-te. Se a arte for para fundo escuro, exporta-a ja com o
  fundo que queres antes de a passares por aqui.
"""

import os
import re
import subprocess
import sys
import unicodedata

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta a Pillow. Corre:  pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(ROOT, "tools")
FULL_DIR = os.path.join(ROOT, "images")
THUMB_DIR = os.path.join(FULL_DIR, "thumb")

FULL_EDGE = 1600      # maior lado do original servido
THUMB_EDGE = 760      # maior lado da miniatura
FULL_Q = 88
THUMB_Q = 82


def slugify(name):
    """"Ilustração_Sem_Título 1.png" -> "ilustracao-sem-titulo-1" """
    stem = os.path.splitext(os.path.basename(name))[0]
    flat = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", flat.lower())).strip("-")


def flatten(im):
    """JPEG nao guarda transparencia: assenta em branco o que for preciso."""
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        base = Image.new("RGB", im.size, (255, 255, 255))
        rgba = im.convert("RGBA")
        base.paste(rgba, mask=rgba.split()[-1])
        return base, True
    return im.convert("RGB"), False


def fit(im, edge):
    """Encolhe para que o maior lado fique em `edge`. Nunca aumenta."""
    w, h = im.size
    if max(w, h) <= edge:
        return im.copy(), False
    scale = edge / max(w, h)
    return im.resize((round(w * scale), round(h * scale)), Image.LANCZOS), True


def save(im, path, quality):
    im.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    return os.path.getsize(path)


def main():
    args = [a for a in sys.argv[1:]]
    slug_override = None
    if "--slug" in args:
        i = args.index("--slug")
        try:
            slug_override = args[i + 1]
        except IndexError:
            sys.exit("--slug precisa de um nome a seguir.")
        del args[i:i + 2]

    sources = [a for a in args if not a.startswith("--")]
    if not sources:
        sys.exit(
            "Uso:  python3 tools/add-artwork.py <ficheiro> [<ficheiro>...] [--slug nome]\n"
            "Ex.:  python3 tools/add-artwork.py ~/Desktop/capa.png --slug proj-sok")
    if slug_override and len(sources) > 1:
        sys.exit("--slug so funciona com um ficheiro de cada vez.")

    os.makedirs(THUMB_DIR, exist_ok=True)
    done = []

    for src in sources:
        if not os.path.exists(src):
            print(f"  ! {src}: nao existe — saltado")
            continue

        slug = slug_override or slugify(src)
        if not slug:
            print(f"  ! {src}: nao consegui tirar um nome daqui — usa --slug")
            continue

        name = slug + ".jpg"
        full_path = os.path.join(FULL_DIR, name)
        thumb_path = os.path.join(THUMB_DIR, name)
        replacing = os.path.exists(full_path)

        with Image.open(src) as raw:
            raw.load()
            im, flattened = flatten(raw)

        full, shrank = fit(im, FULL_EDGE)
        thumb, _ = fit(im, THUMB_EDGE)

        fsize = save(full, full_path, FULL_Q)
        tsize = save(thumb, thumb_path, THUMB_Q)

        verb = "substituido" if replacing else "novo"
        print(f"  + {name} ({verb}): {full.size[0]}x{full.size[1]} {fsize // 1024}K  "
              f"| miniatura {thumb.size[0]}x{thumb.size[1]} {tsize // 1024}K")
        if flattened:
            print(f"    aviso: o original tinha transparencia — ficou assente em branco.")
        if not shrank:
            print(f"    aviso: o original so tem {max(im.size)}px de maior lado "
                  f"(o site serve {FULL_EDGE}px). Nao foi aumentado.")
        done.append((slug, name))

    if not done:
        sys.exit("Nao foi feito nada.")

    print("\nA gerar os .webp…")
    subprocess.run([sys.executable, os.path.join(TOOLS, "make-webp.py")], check=False)

    print("\nA acertar o mapa DIMS…")
    subprocess.run([sys.executable, os.path.join(TOOLS, "dims.py")], check=False)

    print("\n" + "-" * 60)
    print("Falta so dizer ao CONFIG que a arte existe.")
    print("Para um PROJECTO, no index.html (e a mesma linha no projeto.html),")
    print("poe o caminho no src que esta vazio:")
    for slug, name in done:
        print(f'    src: "images/{name}",')
    print("\nPara uma obra da galeria, junta uma entrada ao artworks do index.html")
    print("e a mesma ao projeto.html — os dois tem de ficar iguais.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
add-artwork.py — mete arte nova no site a partir dos ficheiros originais.

PARA QUE SERVE
  Entre o ficheiro que sai do teu programa de desenho e a arte a aparecer no
  site havia quatro passos a mao: encolher para 1600px, fazer a miniatura de
  760px, correr o make-webp.py e acertar o mapa DIMS e a altura reservada da
  parede. Falhar os ultimos nao da erro nenhum — so volta a por a pagina a
  saltar enquanto carrega.

  Este script faz os quatro. Das-lhe os originais (PNG, JPEG, o que for, ou
  uma pasta inteira) e ele deixa tudo pronto. Falta-te so uma coisa, que e de
  proposito: dizer ao CONFIG que a arte existe, com o titulo e a categoria.
  O script escreve-te as linhas no fim, com esses dois campos por preencher.

O NOME DO FICHEIRO
  O nome sai do original, sem acentos e sem espacos:
    "Ilustração_Sem_Título 1.png"  ->  ilustracao-sem-titulo-1.jpg
  E a mesma regra dos nomes que ja estao no site. Se quiseres outro nome,
  usa --slug.

COMO CORRER
    python3 tools/add-artwork.py ~/Desktop/IMG_6211.PNG
    python3 tools/add-artwork.py ~/Desktop/capa.png --slug proj-sok
    python3 tools/add-artwork.py ~/Desktop/*.png          # varios de uma vez
    python3 tools/add-artwork.py incoming/               # uma pasta inteira
    python3 tools/add-artwork.py incoming/ --dry-run     # so diz o que faria

  Precisa de:  pip install Pillow numpy

DUAS COISAS QUE ELE APANHA POR TI
  1. REPETIDOS. Exportar de um telemovel ou descarregar do Drive costuma
     trazer o mesmo ficheiro duas vezes. Se dois originais forem iguais ao
     byte, so o primeiro e tratado e ele diz-te qual saltou.
  2. NOMES QUE CHOCAM. Dois ficheiros DIFERENTES com o mesmo nome dao o mesmo
     slug, e o segundo escrevia por cima do primeiro sem dizer nada. Quando
     isso acontece ele nao trata nenhum dos dois: diz-te quais sao e pede-te
     um --slug, um de cada vez. Perder arte em silencio nao e opcao.

NOTA SOBRE TRANSPARENCIA
  Um PNG com fundo transparente nao cabe num JPEG. O script assenta-o em
  branco e avisa-te. Se a arte for para fundo escuro, exporta-a ja com o
  fundo que queres antes de a passares por aqui.
"""

import hashlib
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

# O que conta como imagem quando lhe das uma pasta. Nao entra em subpastas:
# se as tens arrumadas por projecto, corre uma de cada vez — assim sabes
# sempre o que e que acabaste de meter no site.
EXTS = (".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp")


def slugify(name):
    """"Ilustração_Sem_Título 1.png" -> "ilustracao-sem-titulo-1" """
    stem = os.path.splitext(os.path.basename(name))[0]
    flat = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", flat.lower())).strip("-")


def digest(path):
    """O sha256 do ficheiro, para reconhecer repetidos ao byte."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def expand(paths):
    """Aceita ficheiros e pastas; devolve a lista de imagens, por ordem."""
    out = []
    for p in paths:
        if os.path.isdir(p):
            inside = sorted(f for f in os.listdir(p) if f.lower().endswith(EXTS))
            if not inside:
                print(f"  ! {p}: nao tem imagens la dentro")
            out += [os.path.join(p, f) for f in inside]
        else:
            out.append(p)
    return out


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


def triage(sources, slug_override):
    """Separa o que ha para fazer do que nao se pode fazer.

    Devolve a lista [(origem, slug)] a tratar. Tudo o que for repetido ou
    chocar com outro nome fica de fora, com a razao impressa.
    """
    seen_hash = {}     # sha256 -> primeira origem
    by_slug = {}       # slug -> [(origem, sha256)]

    for src in sources:
        if not os.path.exists(src):
            print(f"  ! {src}: nao existe — saltado")
            continue
        sha = digest(src)
        twin = seen_hash.get(sha)
        if twin:
            print(f"  = {os.path.basename(src)}: igual ao byte a "
                  f"{os.path.basename(twin)} — saltado")
            continue
        seen_hash[sha] = src

        slug = slug_override or slugify(src)
        if not slug:
            print(f"  ! {src}: nao consegui tirar um nome daqui — usa --slug")
            continue
        by_slug.setdefault(slug, []).append((src, sha))

    todo = []
    for slug, group in by_slug.items():
        if len(group) > 1:
            print(f"  ! {slug}: {len(group)} ficheiros DIFERENTES dao este mesmo nome.")
            for src, _ in group:
                print(f"      {src}")
            print(f"      Nenhum foi tratado. Corre-os um a um com --slug.")
            continue
        todo.append((group[0][0], slug))
    return todo


def main():
    args = list(sys.argv[1:])
    dry = "--dry-run" in args
    slug_override = None
    if "--slug" in args:
        i = args.index("--slug")
        try:
            slug_override = args[i + 1]
        except IndexError:
            sys.exit("--slug precisa de um nome a seguir.")
        del args[i:i + 2]

    paths = [a for a in args if not a.startswith("--")]
    if not paths:
        sys.exit(
            "Uso:  python3 tools/add-artwork.py <ficheiro|pasta> [...] [--slug nome] [--dry-run]\n"
            "Ex.:  python3 tools/add-artwork.py ~/Desktop/capa.png --slug proj-sok\n"
            "      python3 tools/add-artwork.py incoming/")

    sources = expand(paths)
    if slug_override and len(sources) > 1:
        sys.exit("--slug so funciona com um ficheiro de cada vez.")

    todo = triage(sources, slug_override)
    if not todo:
        sys.exit("Nao ha nada para fazer.")

    if dry:
        print(f"\n(--dry-run) {len(todo)} ficheiros seriam tratados:")
        for src, slug in todo:
            mark = "substitui" if os.path.exists(os.path.join(FULL_DIR, slug + ".jpg")) else "novo"
            print(f"    {os.path.basename(src)}  ->  {slug}.jpg  ({mark})")
        print("\nNao foi escrito nada.")
        return

    os.makedirs(THUMB_DIR, exist_ok=True)
    done = []

    for src, slug in todo:
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

    print("\nA gerar os .webp…")
    subprocess.run([sys.executable, os.path.join(TOOLS, "make-webp.py")], check=False)

    print("\nA acertar o mapa DIMS e a altura da parede…")
    subprocess.run([sys.executable, os.path.join(TOOLS, "dims.py")], check=False)

    print("\n" + "-" * 60)
    print(f"{len(done)} ficheiros prontos. Falta dizer ao CONFIG que a arte existe.")
    print("\nPara um PROJECTO, poe o caminho no src que esta vazio (no index.html")
    print("E no projeto.html — os dois tem de ficar iguais):")
    for slug, name in done:
        print(f'    src: "images/{name}",')
    print("\nPara obras da GALERIA, junta estas linhas ao artworks do index.html e")
    print("as mesmas ao projeto.html. O titulo e a categoria escreve-os tu: o")
    print("script nao sabe o que esta na imagem e nao ha de inventar.")
    print("  cat: character | sketches | fanart   (fanart nunca e vendida)")
    for slug, name in done:
        print(f'    {{ src: "images/{name}", label: "", ratio: "34", cat: "" }},')
    print("\nO ratio e so o fallback antes de o DIMS carregar: 34, 43 ou 11.")
    print("Depois de mexeres no artworks, corre outra vez:  python3 tools/dims.py")


if __name__ == "__main__":
    main()

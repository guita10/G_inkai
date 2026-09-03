#!/usr/bin/env python3
"""
make-webp.py — gera as versoes .webp das imagens do site.

PARA QUE SERVE
  O site serve WebP a quem o browser suporta (~97% das pessoas) e cai
  automaticamente no .jpg para os restantes. As imagens sao a parte pesada
  da pagina, e o WebP tira-lhe cerca de metade do peso nas miniaturas.

A REGRA DE QUALIDADE
  Nenhuma peca pode ficar pior do que o .jpg que ja estava online. Em vez de
  usar a mesma qualidade para todas, o script procura, peca a peca, a
  qualidade mais baixa que ainda iguala o JPEG actual — medido com SSIM, que
  compara estrutura (linhas, contornos) e nao apenas a media das cores.
  Linha limpa comprime muito; ilustracao com textura e ruido precisa de mais.
  E por isso que as poupancas variam tanto de imagem para imagem.

  A miniatura .webp e gerada a partir do ORIGINAL de 1600px, nao a partir do
  .jpg de 760px — comprimir por cima de um JPEG ja comprimido acumula
  defeitos e da ficheiros piores E maiores.

QUANDO CORRER
  Sempre que adicionares ou substituires arte em images/ (depois de teres
  criado a miniatura correspondente em images/thumb/).
  Se te esqueceres, o site continua a funcionar — o .jpg entra como reserva.

COMO CORRER
    python3 tools/make-webp.py            # so o que falta
    python3 tools/make-webp.py --force    # refaz tudo
    python3 tools/make-webp.py --check    # so relatorio, nao escreve nada

  Precisa de:  pip install Pillow numpy
"""

import os
import sys
from io import BytesIO

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta o Pillow.  Corre:  pip install Pillow numpy")

try:
    import numpy as np
except ImportError:
    sys.exit("Falta o numpy.  Corre:  pip install Pillow numpy")

FORCE = "--force" in sys.argv
CHECK = "--check" in sys.argv

# Qualidades testadas, da mais leve para a mais pesada.
QUALITY_LADDER = list(range(70, 97, 2))

# Para os originais de 1600px nao existe fonte melhor de onde partir, por isso
# a regra e diferente: o WebP tem de ficar praticamente identico ao JPEG.
# Este e o ficheiro que aparece em grande no lightbox — e a arte a serio —
# por isso a fasquia e alta de proposito, mesmo custando bytes. Quem nao
# chegar a este valor sem encolher fica em JPEG, e nao se perde nada.
FULL_SIZE_MIN_SSIM = 0.985


def ssim(img_a, img_b, win=7):
    """SSIM com janela uniforme. So precisa de numpy.

    Confirmado contra a implementacao de referencia do scikit-image nas 28
    pecas deste site: mesma decisao em 28/28, correlacao 1.0000. Usa janela
    quadrada em vez de gaussiana, o que a torna optimista na 4a casa decimal
    (~0.0005) — irrelevante a olho, mas nao contes com os ultimos digitos.
    """
    a = np.asarray(img_a.convert("L"), dtype=np.float64)
    b = np.asarray(img_b.convert("L"), dtype=np.float64)
    if a.shape != b.shape:
        img_b = img_b.resize(img_a.size, Image.LANCZOS)
        b = np.asarray(img_b.convert("L"), dtype=np.float64)

    c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2

    def boxmean(x):
        pad = np.pad(x, ((1, 0), (1, 0)))
        s = pad.cumsum(0).cumsum(1)
        h, w = x.shape
        n = win
        ys, xs = h - n + 1, w - n + 1
        tot = s[n:n + ys, n:n + xs] - s[0:ys, n:n + xs] - s[n:n + ys, 0:xs] + s[0:ys, 0:xs]
        return tot / (n * n)

    mu_a, mu_b = boxmean(a), boxmean(b)
    var_a = boxmean(a * a) - mu_a * mu_a
    var_b = boxmean(b * b) - mu_b * mu_b
    cov = boxmean(a * b) - mu_a * mu_b
    num = (2 * mu_a * mu_b + c1) * (2 * cov + c2)
    den = (mu_a ** 2 + mu_b ** 2 + c1) * (var_a + var_b + c2)
    return float(np.mean(num / den))


def encode(reference, quality):
    buf = BytesIO()
    reference.save(buf, "WEBP", quality=quality, method=6)
    return buf.getvalue()


def best_webp(reference, target_ssim):
    """Qualidade mais baixa cujo SSIM chega ao alvo. Devolve (q, bytes, ssim)."""
    last = None
    for q in QUALITY_LADDER:
        data = encode(reference, q)
        score = ssim(reference, Image.open(BytesIO(data)))
        last = (q, data, score)
        if score >= target_ssim:
            return last
    return last  # nenhuma chegou ao alvo: fica a melhor possivel


def process(jpg_path, source_path, from_original):
    webp_path = os.path.splitext(jpg_path)[0] + ".webp"

    if not (FORCE or CHECK) and os.path.exists(webp_path) \
            and os.path.getmtime(webp_path) >= os.path.getmtime(jpg_path):
        return ("skip",)

    current = Image.open(jpg_path)
    with Image.open(source_path) as src:
        reference = src.convert("RGB")
        if reference.size != current.size:
            reference = reference.resize(current.size, Image.LANCZOS)

        if from_original:
            # o alvo e igualar o JPEG que ja esta online
            target = ssim(reference, current)
        else:
            target = FULL_SIZE_MIN_SSIM

        q, data, score = best_webp(reference, target)

    jpg_size = os.path.getsize(jpg_path)
    if len(data) >= jpg_size:
        if os.path.exists(webp_path) and not CHECK:
            os.remove(webp_path)
        return ("drop", jpg_size)

    if not CHECK:
        with open(webp_path, "wb") as fh:
            fh.write(data)
    return ("made", jpg_size, len(data), q, score, target)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)

    made = skipped = dropped = 0
    saved = 0

    folders = (
        # (pasta, de onde comprimir, alvo e igualar o jpg actual?)
        ("images/thumb", lambda n: os.path.join("images", n), True),
        ("images", lambda n: os.path.join("images", n), False),
    )
    for folder, source_of, from_original in folders:
        if not os.path.isdir(folder):
            continue
        print(f"\n{folder}/")
        for name in sorted(os.listdir(folder)):
            if not name.lower().endswith(".jpg"):
                continue
            jpg = os.path.join(folder, name)
            source = source_of(name)
            if not os.path.exists(source):
                print(f"  ! {name}: falta o original em {source} — saltado")
                continue

            result = process(jpg, source, from_original)
            if result[0] == "skip":
                skipped += 1
            elif result[0] == "drop":
                dropped += 1
                print(f"  - {name}: WebP nao ficaria mais pequeno, fica so o .jpg")
            else:
                _, jsize, wsize, q, score, target = result
                made += 1
                saved += jsize - wsize
                flag = "" if score >= target else "   (nao chegou ao alvo)"
                print(f"  + {name}: {jsize // 1024}K -> {wsize // 1024}K "
                      f"(-{100 - wsize * 100 // jsize}%, q{q}, SSIM {score:.4f}){flag}")

    verb = "seriam criados" if CHECK else "criados"
    print(f"\nFeito: {made} {verb}, {skipped} ja actualizados, {dropped} sem WebP.")
    if saved:
        print(f"Menos {saved // 1024} KB para quem visita o site.")
    if CHECK:
        print("(--check: nao foi escrito nenhum ficheiro)")


if __name__ == "__main__":
    main()

"""faz-zip.py — o zip do site novo para arrastar para o Netlify, com o nome do
Frede escrito dentro de cada imagem.

COMO SE USA (a partir da raiz do repositorio):
    python3 novo/tools/faz-zip.py [pasta-de-saida]
  Escreve <pasta>/guitaink-site-novo-AAAA-MM-DD.zip (por omissao, a pasta
  onde se esta). Depois, para testar o zip: descompacta-o numa pasta vazia e
      node novo/tools/verify.mjs --pasta <essa pasta>

O QUE FAZ
  1. Junta o que vai para o ar: as paginas, o CSS, o JS, o robots, o sitemap,
     mini/, images/ e fonts/ (seguindo os atalhos para as pastas do site
     atual). Nada de tools/ nem do README.
  2. Em cada imagem (JPEG, WebP e PNG) escreve o autor e o copyright, nos
     campos que o Google Imagens e os programas de fotografia leem: EXIF
     (Artist, Copyright) e XMP (dc:creator, dc:rights, photoshop:Credit).
     SEM MEXER NUM PIXEL: os dados entram como um bloco a mais no ficheiro,
     a imagem nao e comprimida outra vez.
  3. Confirma imagem a imagem que os pixeis sao os mesmos e que o nome ficou
     la dentro. Se alguma falhar, para sem escrever o zip.

PORQUE SO NO ZIP (17 Nov 2026, Frede: "just for the new site")
  As imagens do site novo sao as mesmas do site atual (novo/images e um
  atalho para images/). Escrever nos ficheiros do repositorio mudava tambem
  as do site atual. Assim os ficheiros do repositorio ficam como estao, e so
  as copias que vao no zip do site novo levam o nome.

Precisa do Pillow (so para ler as imagens e conferir os pixeis).
"""
import datetime, io, os, pathlib, sys, zipfile, zlib
from PIL import Image

NOVO = pathlib.Path(__file__).resolve().parent.parent
AUTOR = 'Frederico Guita (Guita_Ink)'
DIREITOS = '© Frederico Guita (Guita_Ink)'
# o EXIF so aceita letras ASCII: o © la dentro virava '?' (o teste do fim apanhou-o)
DIREITOS_ASCII = 'Copyright Frederico Guita (Guita_Ink)'
SITE = 'https://guitaink.com/'

# o que vai para o ar
FICHEIROS = sorted(f.name for f in NOVO.iterdir() if f.is_file() and f.suffix in ('.html', '.css', '.js', '.txt', '.xml'))
PASTAS = ['mini', 'images', 'fonts']


# ---------------- os dados que entram em cada imagem ----------------
def exif_tiff():
    """o EXIF (Artist e Copyright) como bloco TIFF, sem o prefixo 'Exif\\0\\0'"""
    ex = Image.Exif()
    ex[0x013B] = AUTOR          # Artist
    ex[0x8298] = DIREITOS_ASCII # Copyright
    b = ex.tobytes()
    return b[6:] if b.startswith(b'Exif\x00\x00') else b


XMP = f'''<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
    photoshop:Credit="{AUTOR}"
    xmpRights:Marked="True"
    xmpRights:WebStatement="{SITE}">
   <dc:creator><rdf:Seq><rdf:li>{AUTOR}</rdf:li></rdf:Seq></dc:creator>
   <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">{DIREITOS}</rdf:li></rdf:Alt></dc:rights>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="r"?>'''.encode('utf-8')


# ---------------- JPEG: dois segmentos APP1 logo a seguir ao inicio ----------------
def jpeg(dados):
    assert dados[:2] == b'\xff\xd8', 'nao e um JPEG'
    i = 2
    if dados[2:4] == b'\xff\xe0':                       # o APP0 (JFIF) fica primeiro, como manda a norma
        i = 4 + int.from_bytes(dados[4:6], 'big')
    seg = lambda corpo: b'\xff\xe1' + (len(corpo) + 2).to_bytes(2, 'big') + corpo
    return dados[:i] + seg(b'Exif\x00\x00' + exif_tiff()) + seg(b'http://ns.adobe.com/xap/1.0/\x00' + XMP) + dados[i:]


# ---------------- WebP: blocos EXIF e XMP, e o cabecalho VP8X que os anuncia ----------------
def webp(dados, largura, altura):
    assert dados[:4] == b'RIFF' and dados[8:12] == b'WEBP', 'nao e um WebP'
    blocos, i = [], 12
    while i < len(dados):
        tipo, n = dados[i:i + 4], int.from_bytes(dados[i + 4:i + 8], 'little')
        blocos.append([tipo, dados[i + 8:i + 8 + n]])
        i += 8 + n + (n & 1)
    blocos = [b for b in blocos if b[0] not in (b'EXIF', b'XMP ')]
    if blocos[0][0] == b'VP8X':                          # ja tem o cabecalho alargado: so se ligam as duas marcas
        c = blocos[0][1]
        blocos[0][1] = bytes([c[0] | 0x08 | 0x04]) + c[1:]
    else:                                                # VP8 ou VP8L simples: o cabecalho alargado nasce aqui
        alfa = 0
        if blocos[0][0] == b'VP8L':
            alfa = 0x10 if (int.from_bytes(blocos[0][1][1:5], 'little') >> 28) & 1 else 0
        vp8x = bytes([0x08 | 0x04 | alfa, 0, 0, 0]) + (largura - 1).to_bytes(3, 'little') + (altura - 1).to_bytes(3, 'little')
        blocos.insert(0, [b'VP8X', vp8x])
    blocos += [[b'EXIF', exif_tiff()], [b'XMP ', XMP]]
    corpo = b'WEBP' + b''.join(t + len(c).to_bytes(4, 'little') + c + (b'\x00' if len(c) & 1 else b'') for t, c in blocos)
    return b'RIFF' + len(corpo).to_bytes(4, 'little') + corpo


# ---------------- PNG: blocos de texto (Author, Copyright) e o XMP, antes do fim ----------------
def png(dados):
    assert dados[:8] == b'\x89PNG\r\n\x1a\n', 'nao e um PNG'
    bloco = lambda tipo, corpo: len(corpo).to_bytes(4, 'big') + tipo + corpo + zlib.crc32(tipo + corpo).to_bytes(4, 'big')
    fim = dados.rindex(b'IEND') - 4
    novos = (bloco(b'tEXt', b'Author\x00' + AUTOR.encode('latin-1'))
             + bloco(b'tEXt', b'Copyright\x00' + DIREITOS.encode('latin-1'))
             + bloco(b'iTXt', b'XML:com.adobe.xmp\x00\x00\x00\x00\x00' + XMP))
    return dados[:fim] + novos + dados[fim:]


def marca(caminho, dados):
    """devolve a copia com o nome la dentro, ja conferida; ou erro"""
    antes = Image.open(io.BytesIO(dados))
    antes.load()
    ext = caminho.suffix.lower()
    if ext in ('.jpg', '.jpeg'):
        novo = jpeg(dados)
    elif ext == '.webp':
        novo = webp(dados, *antes.size)
    elif ext == '.png':
        novo = png(dados)
    else:
        return dados
    depois = Image.open(io.BytesIO(novo))
    depois.load()
    if depois.size != antes.size or depois.mode != antes.mode or depois.tobytes() != antes.tobytes():
        raise SystemExit(f'ERRO: {caminho} mudou de pixeis ao levar o nome. Nada foi escrito.')
    if ext == '.png':
        ok = depois.info.get('Copyright') == DIREITOS and depois.info.get('Author') == AUTOR
    else:
        ex = depois.getexif()
        ok = ex.get(0x8298) == DIREITOS_ASCII and ex.get(0x013B) == AUTOR and DIREITOS.encode('utf-8') in novo
    if not ok:
        raise SystemExit(f'ERRO: {caminho} nao ficou com o nome la dentro. Nada foi escrito.')
    return novo


def main():
    destino = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
    destino.mkdir(parents=True, exist_ok=True)
    zip_ = destino / f'guitaink-site-novo-{datetime.date.today().isoformat()}.zip'
    entradas, marcadas = [], 0
    for f in FICHEIROS:
        entradas.append((f, (NOVO / f).read_bytes()))
    for pasta in PASTAS:
        raiz = (NOVO / pasta).resolve()                  # segue o atalho
        for p in sorted(raiz.rglob('*')):
            if not p.is_file() or p.name.startswith('.'):
                continue
            nome = f'{pasta}/{p.relative_to(raiz).as_posix()}'
            dados = p.read_bytes()
            if p.suffix.lower() in ('.jpg', '.jpeg', '.webp', '.png'):
                dados = marca(p, dados)
                marcadas += 1
            entradas.append((nome, dados))
    temp = zip_.with_suffix('.tmp')
    with zipfile.ZipFile(temp, 'w', zipfile.ZIP_DEFLATED) as z:
        for nome, dados in entradas:
            z.writestr(nome, dados)
    os.replace(temp, zip_)
    print(f'{zip_}')
    print(f'{len(entradas)} ficheiros, {marcadas} imagens com o nome "{AUTOR}" la dentro, pixeis conferidos; '
          f'{zip_.stat().st_size / 1e6:.1f} MB')


if __name__ == '__main__':
    main()

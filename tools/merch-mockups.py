"""Mockups do Drop 01 para as fichas do Shopify. Planos, honestos: a arte
real do Frede sobre uma peca desenhada, nunca redesenhada. 2000x2000."""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np, sys, os
D = sys.argv[1]; O = sys.argv[2]
S = 4000                     # desenha a 2x e reduz: bordas limpas
U = S / 1000                 # coordenadas em unidades de 0 a 1000
NOMES = {'1-rainha': 'queen', '2-monge': 'monk', '3-sumo': 'sumo'}

def fundo(top=(237, 234, 228), bot=(221, 216, 207)):
    t, b = np.array(top), np.array(bot); k = np.linspace(0, 1, S)[:, None]
    g = (t * (1 - k) + b * k).astype(np.uint8)
    return Image.fromarray(np.repeat(g[:, None, :], S, axis=1)).convert('RGBA')

def bez(p0, p1, p2, n=40):
    return [((1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0], (1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]) for t in np.linspace(0, 1, n)]

def px(pts): return [(x*U, y*U) for x, y in pts]

def mascara(pts):
    m = Image.new('L', (S, S), 0); ImageDraw.Draw(m).polygon(px(pts), fill=255); return m

def tecido(mask, cor, escuro):
    """cor lisa + luz suave de cima e sombra nas bordas, so dentro da peca"""
    base = Image.new('RGBA', (S, S), cor + (255,))
    k = np.linspace(0, 1, S)[:, None]
    luz = (1.04 - 0.10 * k) * np.ones((S, S))
    borda = np.array(mask.filter(ImageFilter.GaussianBlur(60)), float) / 255
    f = luz * (0.80 + 0.20 * borda) if escuro else luz * (0.90 + 0.10 * borda)
    arr = np.clip(np.array(base, float)[..., :3] * f[..., None], 0, 255).astype(np.uint8)
    out = Image.fromarray(arr).convert('RGBA'); out.putalpha(mask); return out, f

def sombra(canvas, mask, dx=40, dy=70, blur=70, forca=0.30):
    sh = mask.filter(ImageFilter.GaussianBlur(blur)).point(lambda v: int(v * forca))
    layer = Image.new('RGBA', (S, S), (60, 50, 40, 255)); layer.putalpha(sh)
    canvas.alpha_composite(layer, (dx, dy))

def costura(d, pts, cor, w=5):
    d.line(px(pts), fill=cor, width=int(w), joint='curve')

def estampa(canvas, art, box, f):
    """a arte cabe inteira na caixa (x0,y0,x1,y1 em unidades), centrada; leva
    a mesma luz do tecido para parecer impressa e nao colada"""
    x0, y0, x1, y1 = [v * U for v in box]
    w, h = x1 - x0, y1 - y0; s = min(w / art.width, h / art.height)
    a = art.resize((int(art.width * s), int(art.height * s)), Image.LANCZOS)
    ox = int(x0 + (w - a.width) / 2); oy = int(y0 + (h - a.height) / 2)
    arr = np.array(a, float)
    arr[..., :3] *= f[oy:oy + a.height, ox:ox + a.width][..., None] ** 0.8
    canvas.alpha_composite(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)), (ox, oy))

def gola(pts_neck):  # a abertura do pescoco: arco de 590,150 a 410,150
    return bez((590, 150), (500, 235), (410, 150))

def tshirt(art, escuro):
    cor = (26, 26, 28) if escuro else (244, 243, 240)
    linha = (48, 48, 52) if escuro else (214, 211, 205)
    corpo = [(410, 150), (300, 178), (150, 270), (212, 418), (298, 372), (300, 872),
             (700, 872), (702, 372), (788, 418), (850, 270), (700, 178), (590, 150)] + gola(None)
    m = mascara(corpo)
    c = fundo(); sombra(c, m)
    pano, f = tecido(m, cor, escuro); c.alpha_composite(pano)
    d = ImageDraw.Draw(c)
    dentro = tuple(int(v * (0.62 if escuro else 0.90)) for v in cor)
    d.polygon(px(bez((410, 150), (500, 182), (590, 150)) + bez((590, 150), (500, 235), (410, 150))), fill=dentro)
    costura(d, bez((590, 150), (500, 235), (410, 150)), linha, 14)     # gola canelada
    costura(d, bez((574, 158), (500, 218), (426, 158)), linha, 4)
    costura(d, [(300, 178), (298, 372)], linha, 4); costura(d, [(700, 178), (702, 372)], linha, 4)
    costura(d, [(185, 368), (262, 336)], linha, 4); costura(d, [(815, 368), (738, 336)], linha, 4)
    costura(d, [(300, 846), (700, 846)], linha, 4)
    estampa(c, art, (380, 250, 620, 570), f)   # area 12x16 in a proporcao do ficheiro
    return c

def hoodie(art, escuro):
    cor = (28, 28, 30) if escuro else (242, 241, 238)
    linha = (52, 52, 56) if escuro else (210, 207, 200)
    capuz = bez((385, 222), (300, 70), (500, 62)) + bez((500, 62), (700, 70), (615, 222))
    corpo = [(395, 215), (280, 225), (170, 330), (118, 800), (212, 812), (262, 470), (282, 470),
             (282, 905), (718, 905), (718, 470), (738, 470), (788, 812), (882, 800), (830, 330), (720, 225), (605, 215)]
    mh = mascara(capuz + [(605, 215), (395, 215)]); m = mascara(corpo)
    tudo = ImageChops.lighter(m, mh)
    c = fundo(); sombra(c, tudo)
    # capuz por tras, um pouco mais escuro
    pc, _ = tecido(mh, tuple(int(v * (0.95 if not escuro else 0.9)) for v in cor), escuro); c.alpha_composite(pc)
    pano, f = tecido(m, cor, escuro); c.alpha_composite(pano)
    d = ImageDraw.Draw(c)
    # abertura do capuz a frente
    d.polygon(px(bez((412, 220), (500, 130), (588, 220)) + bez((588, 220), (500, 318), (412, 220))),
              fill=tuple(int(v * (0.86 if not escuro else 0.62)) for v in cor))
    costura(d, bez((395, 215), (500, 310), (605, 215)), linha, 10)
    # cordoes
    # bolso canguru
    costura(d, [(360, 660), (640, 660), (672, 840), (328, 840), (360, 660)], linha, 5)
    costura(d, [(360, 660), (330, 760)], linha, 4); costura(d, [(640, 660), (670, 760)], linha, 4)
    # punhos e cos
    costura(d, [(282, 872), (718, 872)], linha, 5)
    costura(d, [(122, 770), (214, 780)], linha, 5); costura(d, [(878, 770), (786, 780)], linha, 5)
    costura(d, [(280, 225), (282, 470)], linha, 4); costura(d, [(720, 225), (718, 470)], linha, 4)
    estampa(c, art, (385, 300, 615, 640), f)
    d = ImageDraw.Draw(c)
    fio = (205, 203, 198) if escuro else (60, 60, 64)
    costura(d, [(468, 262), (462, 400)], fio, 9); costura(d, [(532, 262), (538, 400)], fio, 9)
    for x in (462, 538): d.ellipse([(x-7)*U, 398*U, (x+7)*U, 418*U], fill=fio)
    return c

def moldura(pf, parede_escura=False):
    c = fundo()
    ph = 1500 * S / 2000; pw = ph * pf.width / pf.height; fb = 34 * S / 2000
    x = (S - pw) / 2 - fb; y = (S - ph) / 2 - fb - 40
    m = Image.new('L', (S, S), 0); ImageDraw.Draw(m).rectangle([x, y, x + pw + 2*fb, y + ph + 2*fb], fill=255)
    sombra(c, m, 30, 50, 60, 0.35)
    ImageDraw.Draw(c).rectangle([x, y, x + pw + 2*fb, y + ph + 2*fb], fill=(22, 22, 24, 255))
    c.alpha_composite(pf.convert('RGBA').resize((int(pw), int(ph)), Image.LANCZOS), (int(x + fb), int(y + fb)))
    return c

def autocolante(art, altura, borda, cor=(250, 250, 248)):
    s = altura / art.height; a = art.resize((int(art.width * s), int(altura)), Image.LANCZOS)
    pad = borda * 3; big = Image.new('RGBA', (a.width + 2*pad, a.height + 2*pad), (0, 0, 0, 0)); big.alpha_composite(a, (pad, pad))
    mm = big.split()[3].point(lambda v: 255 if v > 40 else 0)
    off = mm.filter(ImageFilter.GaussianBlur(borda * 0.9)).point(lambda v: 255 if v > 18 else 0).filter(ImageFilter.GaussianBlur(1.5))
    w = Image.new('RGBA', big.size, cor + (255,)); w.putalpha(off)
    out = Image.new('RGBA', big.size, (0, 0, 0, 0)); out.alpha_composite(w); out.alpha_composite(big); return out

def cena_autocolante(art):
    c = fundo((52, 54, 60), (34, 35, 40))
    st = autocolante(art, 2900, 60).rotate(-4, resample=Image.BICUBIC, expand=True)
    x = (S - st.width) // 2; y = (S - st.height) // 2
    sh = st.split()[3].filter(ImageFilter.GaussianBlur(40)).point(lambda v: int(v * 0.5))
    l = Image.new('RGBA', st.size, (0, 0, 0, 255)); l.putalpha(sh)
    c.alpha_composite(l, (x + 30, y + 50)); c.alpha_composite(st, (x, y)); return c

def porta_chaves(art):
    """acrilico transparente: a arte com uma margem clara e translucida, furo
    e argola em cima"""
    c = fundo()
    st = autocolante(art, 2400, 70, cor=(235, 240, 245))
    a = np.array(st, float); fora = a[..., 3] > 0
    # margem translucida: onde nao ha arte, o acrilico deixa ver o fundo
    arte = np.array(autocolante(art, 2400, 1, cor=(0, 0, 0)).split()[3].resize(st.size), float) if False else None
    st2 = st.copy(); al = np.array(st2.split()[3], float)
    orig = Image.new('RGBA', st.size, (0, 0, 0, 0))
    s = 2400 / art.height; aa = art.resize((int(art.width * s), 2400), Image.LANCZOS)
    orig.alpha_composite(aa, (70 * 3, 70 * 3))
    oa = np.array(orig.split()[3], float)
    al = np.where(oa > 40, al, al * 0.45); st2.putalpha(Image.fromarray(al.astype(np.uint8)))
    x = (S - st2.width) // 2; y = (S - st2.height) // 2 + 250
    sh = st.split()[3].filter(ImageFilter.GaussianBlur(40)).point(lambda v: int(v * 0.25))
    l = Image.new('RGBA', st.size, (40, 30, 20, 255)); l.putalpha(sh); c.alpha_composite(l, (x + 30, y + 50))
    c.alpha_composite(st2, (x, y))
    d = ImageDraw.Draw(c)
    # contorno fino do acrilico
    cx = S // 2; top = y + 60
    d.ellipse([cx - 55, top - 55, cx + 55, top + 55], outline=(200, 205, 210), width=14)
    d.ellipse([cx - 150, top - 420, cx + 150, top - 120], outline=(165, 168, 172), width=26)
    d.line([(cx, top - 120), (cx, top - 55)], fill=(165, 168, 172), width=20)
    return c

def grava(img, nome):
    img.convert('RGB').resize((2000, 2000), Image.LANCZOS).save(os.path.join(O, nome), quality=90, optimize=True)

for k, n in NOMES.items():
    tee = Image.open(f'{D}/tshirt-frente-{k}.png').convert('RGBA')
    art = Image.open(f'{D}/arte-centrada-{k}.png').convert('RGBA')
    art = art.crop(art.getchannel('A').getbbox())
    for escuro, cn in ((True, 'black'), (False, 'white')):
        grava(tshirt(tee, escuro), f'tshirt-{n}-{cn}.jpg')
        grava(hoodie(art, escuro), f'hoodie-{n}-{cn}.jpg')
    if os.environ.get('SO_ROUPA'): print(n,'roupa'); continue
    i = k[0]
    grava(moldura(Image.open(f'{D}/print-A4-{i}-papel-preto.png')), f'print-{n}.jpg')
    grava(cena_autocolante(art), f'sticker-{n}.jpg')
    grava(porta_chaves(art), f'keychain-{n}.jpg')
    print(n, 'ok')

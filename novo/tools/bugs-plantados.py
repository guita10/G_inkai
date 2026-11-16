"""bugs-plantados.py — prova que o verify.mjs apanha o que diz apanhar.

Copia o site novo para uma pasta de trabalho, estraga UMA coisa de cada vez
(um preco numa comissao, uma moldura a cortar a obra, um ID do Shopify
trocado, um texto diferente do site atual...) e confirma que o verify.mjs
falha, e falha no teste certo. Um teste que nunca falhou nao prova nada.

    python3 novo/tools/bugs-plantados.py . /tmp/plantado          # os 21
    python3 novo/tools/bugs-plantados.py . /tmp/plantado 3 10     # so esses

A pasta de trabalho tem de se chamar "plantado" e ficar FORA do repositorio:
o script apaga-a e volta a cria-la a cada bug. O site verdadeiro nunca e
tocado. Demora uns 15 minutos (cada bug abre um browser)."""
import os, shutil, subprocess, sys, pathlib

raiz = pathlib.Path(sys.argv[1]).resolve()
trab = pathlib.Path(sys.argv[2]).resolve()
novo = raiz / 'novo'
FICHEIROS = ['index.html', 'loja.html', 'projeto.html', '404.html', 'site.css', 'site.js', 'dados.js', 'dims.js', 'robots.txt', 'sitemap.xml']


def copia():
    if trab.exists():
        shutil.rmtree(trab)
    trab.mkdir(parents=True)
    for f in FICHEIROS:
        shutil.copy(novo / f, trab / f)
    for d in ['images', 'fonts']:
        os.symlink(raiz / d, trab / d)
    os.symlink(novo / 'mini', trab / 'mini')


def troca(f, a, b, vezes=1):
    p = trab / f
    s = p.read_text(encoding='utf-8')
    assert s.count(a) >= 1, (f, a[:60])
    p.write_text(s.replace(a, b, vezes), encoding='utf-8')


BUGS = [
    ('paridade EN/PT partida (uma chave so em EN)', lambda: troca('dados.js', 'heroRole: "Illustration and character design"', 'heroRole: "Illustration and character design", soEmIngles: "x"'), 'paridade EN/PT'),
    ('um travessao num texto', lambda: troca('dados.js', 'Drawn & built by hand.', 'Drawn — built by hand.'), 'travessao'),
    ('um preco numa comissao', lambda: troca('dados.js', 'Head and shoulders, fully rendered.', 'Head and shoulders, fully rendered. From 40 €.'), 'comissoes'),
    # so "cover" nao corta nada nas folhas (cada moldura tem a proporcao da sua imagem); o bug a serio e a moldura ter outra proporcao
    ('as seis molduras a cortar a obra (quadradas, cover)', lambda: (troca('site.css', '.fr img{width:100%;height:100%;object-fit:contain}', '.fr img{width:100%;height:100%;object-fit:cover}'),
                                                                     troca('site.css', '.sheet.six .fr{aspect-ratio:4/5}', '.sheet.six .fr{aspect-ratio:1}')), 'cortada'),
    ('o palco a cortar a obra (cover)', lambda: troca('site.css', 'width:100%;height:100%;object-fit:contain;opacity:0', 'width:100%;height:100%;object-fit:cover;opacity:0'), 'inteira no primeiro ecra'),
    ('um numero errado no dims.js', lambda: troca('dims.js', '"aki": {"w":1280', '"aki": {"w":1281'), 'dims.js bate'),
    ('uma coisa mais larga que o ecra', lambda: troca('site.css', '.chips{display:flex;flex-wrap:wrap;gap:8px}', '.chips{display:flex;flex-wrap:nowrap;gap:8px}'), 'transborda'),
    ('a folga da barra de volta a pagina (scroll-padding)', lambda: troca('site.css', 'html{scroll-behavior:smooth;', 'html{scroll-padding-top:88px;scroll-behavior:smooth;'), 'focar um botao da barra'),
    ('apontar sem a pausa de 140 ms', lambda: troca('site.js', 'if (a) t = setTimeout(() => faz(a), 140);', 'if (a) faz(a);'), 'o caminho ate ela'),
    ('apontar com pointerover (a pagina a rolar troca a peca)', lambda: troca('site.js', "el.addEventListener('pointermove', e => {", "el.addEventListener('pointerover', e => {"), 'rolar a pagina'),
    ('um ID de variante trocado', lambda: troca('dados.js', '60968526905678', '60968526905679'), 'checkout do Shopify'),
    ('o tamanho ja escolhido', lambda: troca('site.js', "checked: !o.pick && i === 0", "checked: i === 0"), 'tamanho nao vem escolhido'),
    ('um texto do site atual mudado', lambda: troca('dados.js', 'Tell me what you have in mind', 'Tell me what you want'), 'esta igual no dados.js'),
    ('uma obra a menos', lambda: troca('dados.js', 'label: "Angela"', 'label: "Angel"'), 'esta igual no dados.js'),
    ('uma transicao que nao desliga com movimento reduzido', lambda: troca('site.css', '  *,*::before,*::after{transition:none!important;animation:none!important}', '  *,*::before,*::after{animation:none!important}'), 'movimento reduzido'),
    ('o site a abrir claro', lambda: troca('index.html', '<html lang="en" data-theme="dark" data-page="home">', '<html lang="en" data-theme="light" data-page="home">'), 'abre no escuro'),
    ('uma etiqueta de leitor de ecra so em ingles', lambda: troca('site.js', "'data-ta': 'a11yTheme', text: '◐'", "'aria-label': 'Switch theme', text: '◐'"), 'leitores de ecra'),
    ('fan art com oferta no JSON-LD', lambda: troca('site.js', "const o = { '@type': 'ImageObject', name: a.label,", "const o = { '@type': 'ImageObject', offers: { price: 10 }, name: a.label,"), 'sem nenhuma oferta'),
    ('um pedido a outro servidor', lambda: troca('index.html', '<link rel="stylesheet" href="site.css">', '<link rel="stylesheet" href="site.css">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">'), 'outro servidor'),
    ('texto cinzento a mais (contraste)', lambda: troca('site.css', '--bone-dim:#9BA0AA;', '--bone-dim:#4A4E57;'), 'contraste'),
    ('um botao pequeno demais para o dedo', lambda: troca('site.css', '.tool{font-family:var(--f-body);font-size:.875rem;font-weight:500;min-width:44px;height:44px;', '.tool{font-family:var(--f-body);font-size:.875rem;font-weight:500;min-width:30px;height:30px;'), '44px'),
]

PARTES = [1, 1, 1, 3, 3, 1, 4, 3, 3, 3, 6, 6, 2, 2, 7, 7, 7, 3, 1, 4, 4]      # em que parte do verify.mjs cada bug e apanhado
assert len(PARTES) == len(BUGS)
assert trab.name == 'plantado' and raiz not in trab.parents and trab != raiz, 'a pasta de trabalho tem de se chamar "plantado" e ficar fora do repositorio'
so = sys.argv[3:]
apanhados = 0
for i, (nome, estraga, esperado) in enumerate(BUGS):
    if so and str(i) not in so:
        continue
    copia()
    estraga()
    r = subprocess.run(['node', str(novo / 'tools' / 'verify.mjs'), '--rapido', '--so', str(PARTES[i]), '--pasta', str(trab), '--atual', str(raiz)], capture_output=True, text=True)
    falhas = [l.strip() for l in r.stdout.splitlines() if '✗' in l]
    bate = [l for l in falhas if esperado in l]
    ok = r.returncode == 1 and bool(bate)
    apanhados += ok
    print(('APANHADO ' if ok else 'ESCAPOU  ') + f'[{i}] {nome}')
    print('          ' + (bate[0][:150] if bate else f'(saiu com {r.returncode}; falhas: ' + ' | '.join(f[:70] for f in falhas[:3]) + ')'))
    sys.stdout.flush()
print(f'\n{apanhados} de {len(BUGS) if not so else len(so)} bugs plantados foram apanhados')
if trab.exists():
    shutil.rmtree(trab)

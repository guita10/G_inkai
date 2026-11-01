#!/usr/bin/env node
/**
 * verify.mjs — corre no site os testes que ja apanharam bugs a serio.
 *
 * PARA QUE SERVE
 *   A instrucao do Frede e "verifica o teu trabalho a correr testes a serio,
 *   nao a ler o diff e a assumir". Este ficheiro e essa instrucao feita
 *   comando. Cada teste aqui dentro apanhou pelo menos um bug real neste
 *   repositorio — nenhum esta ca por desencargo de consciencia.
 *
 * COMO CORRER
 *     node tools/verify.mjs               # tudo
 *     node tools/verify.mjs --rapido      # salta o CLS travado (o mais lento)
 *     node tools/verify.mjs --shop-aberto # testa tambem com shopOpen:true (index e loja)
 *
 *   Sai com codigo 1 se alguma coisa falhar, para poder travar um deploy.
 *   Nao precisa de instalar nada: o Playwright e o Chromium ja ca estao.
 *
 * TRES ARMADILHAS QUE ESTE FICHEIRO JA EVITA POR TI
 *   1. transition-property nao serve para testar reduced-motion. `all` e o
 *      valor INICIAL da propriedade, por isso um elemento sem transicao
 *      nenhuma tambem reporta `all` e um teste ingenuo marca o documento
 *      inteiro. O que conta e a transition-DURATION. Quatro fugas reais
 *      estiveram escondidas atras desse falso positivo.
 *   2. Trocar de tema e medir logo a seguir da valores a meio do caminho: o
 *      body tem uma transicao de cor de 0,4s. Aqui espera-se que assente.
 *   3. As imagens lazy reportam naturalWidth 0 se nao forem forcadas a
 *      carregar, e um teste de recorte passa por engano em todas.
 */

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const RAPIDO = process.argv.includes('--rapido');
const SHOP = process.argv.includes('--shop-aberto');

/* as chaves dos projectos saem do proprio CONFIG: um projecto novo entra no
   teste sem ninguem se lembrar de o acrescentar aqui */
const CHAVES = (() => {
  const s = readFileSync(join(ROOT, 'projeto.html'), 'utf8');
  const i = s.indexOf('const CONFIG'), j = s.indexOf('</script>', i);
  return new Function(`${s.slice(i, j)}; return CONFIG;`)().projects.map(p => p.key);
})();

/* as paginas que vao para o ar */
const PAGINAS = ['index.html', 'projeto.html', 'loja.html', '404.html'];

let falhas = 0, testes = 0;
const ok   = (m, d = '') => { testes++; console.log(`  \x1b[32m✓\x1b[0m ${m}${d ? '  ' + d : ''}`); };
const mau  = (m, d = '') => { testes++; falhas++; console.log(`  \x1b[31m✗\x1b[0m ${m}${d ? '  ' + d : ''}`); };
const chk  = (cond, m, d = '') => cond ? ok(m, d) : mau(m, d);
const tit  = m => console.log(`\n\x1b[1m${m}\x1b[0m`);

/* ---------- servidor ---------- */
const PORTA = 8931 + Math.floor(Math.random() * 60);
const servir = dir => {
  const s = spawn('python3', ['-m', 'http.server', String(PORTA), '--bind', '127.0.0.1'],
    { cwd: dir, stdio: 'ignore' });
  return s;
};
const base = `http://127.0.0.1:${PORTA}/`;

/* ---------- 1. estatico: nada de browser ---------- */
function estatico(){
  tit('1. Ficheiros e conteudo');

  // o JS parseia? (cada bloco <script> que nao seja JSON-LD)
  for (const pag of PAGINAS) {
    const src = readFileSync(join(ROOT, pag), 'utf8');
    let i = 0, erro = null;
    for (const m of src.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) {
      if (!m[1].trim()) continue;
      const f = join(tmpdir(), `vf_${pag}_${i++}.js`);
      writeFileSync(f, m[1]);
      try { execFileSync('node', ['--check', f], { stdio: 'pipe' }); }
      catch (e) { erro = String(e.stderr).split('\n').slice(0, 3).join(' '); }
    }
    chk(!erro, `${pag}: o JavaScript parseia`, erro || `${i} blocos`);
    // JSON-LD valido
    let jerro = null, jn = 0;
    for (const m of src.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      jn++; try { JSON.parse(m[1]); } catch (e) { jerro = e.message; }
    }
    if (jn) chk(!jerro, `${pag}: o JSON-LD e valido`, jerro || `${jn} blocos`);
  }

  // todas as imagens referidas existem
  const faltam = [];
  for (const pag of PAGINAS) {
    const src = readFileSync(join(ROOT, pag), 'utf8');
    for (const m of src.matchAll(/["'(](images\/[^"')\s]+)/g)) {
      if (m[1].includes('nome.jpg')) continue;            // exemplo num comentario
      if (!existsSync(join(ROOT, m[1]))) faltam.push(`${pag}: ${m[1]}`);
    }
  }
  chk(faltam.length === 0, 'todas as imagens referidas existem no disco', faltam.join(' '));

  // o mapa DIMS e a reserva da parede estao certos
  try {
    const out = execFileSync('python3', [join(ROOT, 'tools', 'dims.py'), '--check'], { encoding: 'utf8' });
    const sujo = /~|\+ |- /.test(out);
    chk(!sujo, 'DIMS, reserva da parede e PROJ_DIMS estao actualizados',
      sujo ? 'corre python3 tools/dims.py' : out.trim().split('\n')[0]);
  } catch (e) { mau('dims.py --check nao correu', String(e.message).slice(0, 120)); }
}

/* ---------- 2. CONFIG: contrato, i18n, regras duras ---------- */
function config(){
  tit('2. CONFIG, traducoes e regras duras');
  const carrega = pag => {
    const s = readFileSync(join(ROOT, pag), 'utf8');
    const i = s.indexOf('const CONFIG'), j = s.indexOf('</script>', i);
    return new Function(`${s.slice(i, j)}; return CONFIG;`)();
  };
  const A = carrega('index.html'), B = carrega('projeto.html');
  const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

  const en = Object.keys(A.i18n.en).sort(), pt = Object.keys(A.i18n.pt).sort();
  const so = [...en.filter(k => !pt.includes(k)), ...pt.filter(k => !en.includes(k))];
  chk(so.length === 0, 'paridade EN/PT no index', so.length ? so.join(' ') : `${en.length} chaves de cada lado`);

  const src = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const usados = [...new Set([...src.matchAll(/data-t="([^"]+)"/g)].map(m => m[1]))];
  const orfaos = usados.filter(k => !(k in A.i18n.en) || !(k in A.i18n.pt));
  chk(orfaos.length === 0, 'todos os data-t resolvem nas duas linguas', orfaos.join(' ') || `${usados.length} chaves`);

  /* a obra grande da abertura (1 Nov 2026): so originais (nunca fan art nem
     colabs, §9.1 e §9.5: e a cara do site), cada uma na parede tambem (o
     clique abre-a na lightbox) e com o .webp grande e o da miniatura, porque
     o <picture> da abertura pede o .webp sem perguntar se existe. */
  {
    const maus = [];
    const lista = A.heroArt || [];
    if (!lista.length) maus.push('heroArt vazio');
    for (const src of lista) {
      const g = A.artworks.find(a => a.src === src);
      if (!g) { maus.push(`${src}: nao esta no artworks`); continue; }
      if (g.cat !== 'character' || g.collab) maus.push(`${src}: nao e original (${g.cat}${g.collab ? ', collab' : ''})`);
      const w = src.replace(/\.jpe?g$/i, '.webp');
      for (const f of [src, w, w.replace(/^images\//, 'images/thumb/')])
        if (!existsSync(join(ROOT, f))) maus.push(`falta ${f}`);
    }
    chk(maus.length === 0, 'a obra da abertura e sempre uma original, com o .webp grande e pequeno',
      maus.join(' ') || `${lista.length} obras`);
  }

  // projeto.html so guarda a fatia que le, e essa tem de bater certo
  const fatia = ['artistName', 'realName', 'projects', 'i18n'];
  const extra = Object.keys(B).filter(k => !fatia.includes(k));
  chk(extra.length === 0, 'projeto.html nao guarda mais do que a sua fatia', extra.join(' '));
  chk(eq(A.projects, B.projects) && A.artistName === B.artistName && A.realName === B.realName
      && eq(A.i18n.en.projects, B.i18n.en.projects) && eq(A.i18n.pt.projects, B.i18n.pt.projects),
      'a fatia de projeto.html esta sincronizada com o index');

  /* loja.html: e a casa da loja e das comissoes. O que o index tambem le
     tem de ser igual nos dois; o que so a loja usa ja nao pode estar no
     index (foi assim que o projeto.html acumulou precos mortos). */
  const L = carrega('loja.html');
  const comuns = ['artistName', 'realName', 'email', 'instagram', 'commissionsOpen', 'tiers', 'shopOpen'];
  const txt = ['commTitle', 'commOpen', 'commClosed', 'commIntro', 'navShop', 'navComm', 'commCta', 'tiers'];
  const dif = [...comuns.filter(k => !eq(A[k], L[k])),
    ...['en', 'pt'].flatMap(l => txt.filter(k => !eq(A.i18n[l][k], L.i18n[l][k])).map(k => `${l}.${k}`))];
  chk(dif.length === 0, 'loja.html e index.html dizem o mesmo nos campos que partilham', dif.join(' '));
  const soLoja = ['shop', 'merch', 'shopDrop', 'merchCollection'].filter(k => k in A);
  chk(soLoja.length === 0, 'o merch vive so no loja.html, nao no index', soLoja.join(' '));
  /* o cesto compra pelo ID de cada variante: um ID em falta ou repetido e um
     artigo que nao chega ao checkout, ou o artigo errado. Um por combinacao,
     so digitos, nenhum repetido em lado nenhum, e cada opcao com nome nas
     duas linguas. (Se os IDs batem com o Shopify, isto nao ve: e o teste do
     browser que confere uma amostra.) */
  {
    const maus = [], vistos = new Set();
    for (const m of L.merch.filter(m => !m.hold)) {
      if (!m.opts || !m.variants) { maus.push(`${m.key}: sem opts/variants`); continue; }
      const combos = m.opts.reduce((a, o) => a * o.v.length, 1);
      if (m.variants.length !== combos) maus.push(`${m.key}: ${m.variants.length} IDs para ${combos} combinacoes`);
      for (const id of m.variants) {
        if (!/^\d{10,}$/.test(id)) maus.push(`${m.key}: ID estranho ${id}`);
        if (vistos.has(id)) maus.push(`${m.key}: ID repetido ${id}`);
        vistos.add(id);
      }
      for (const o of m.opts) for (const l of ['en', 'pt'])
        if (!L.i18n[l].optNames[o.k]) maus.push(`${l}: opcao ${o.k} sem nome`);
    }
    chk(maus.length === 0, 'o cesto tem um ID do Shopify por variante, sem repetidos',
      maus.join(' ') || `${vistos.size} variantes`);
  }
  const len = Object.keys(L.i18n.en).sort(), lpt = Object.keys(L.i18n.pt).sort();
  const lso = [...len.filter(k => !lpt.includes(k)), ...lpt.filter(k => !len.includes(k))];
  chk(lso.length === 0, 'paridade EN/PT no loja.html', lso.join(' ') || `${len.length} chaves de cada lado`);

  // §9.9 — nada de em-dashes na copia visivel
  const emdash = [];
  const anda = (o, p) => { for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') { if (v.includes('—')) emdash.push(`${p}.${k}`); }
    else if (v && typeof v === 'object') anda(v, `${p}.${k}`); } };
  anda(A.i18n, 'index'); anda(B.i18n, 'projeto'); anda(L.i18n, 'loja');
  chk(emdash.length === 0, '§9.9 nenhum em-dash na copia visivel', emdash.join(' '));

  // §9.4 — nenhum preco de comissao no CONFIG nem no JSON-LD
  /* no loja.html so a parte das comissoes: o merch tem precos de prateleira
     na pagina de proposito, as comissoes nunca. */
  const daComissao = l => Object.fromEntries(Object.entries(L.i18n[l]).filter(([k]) => /^comm|^tiers$|^mail/.test(k)));
  const comiss = JSON.stringify({ tiers: A.tiers, i18n: { en: A.i18n.en.tiers, pt: A.i18n.pt.tiers } })
    + JSON.stringify(B) + JSON.stringify({ tiers: L.tiers, en: daComissao('en'), pt: daComissao('pt') });
  chk(!/"price"|priceCurrency|€\s*\d|\d\s*€/.test(comiss),
      '§9.4 nenhum preco de comissao no CONFIG');
  const ld = [...src.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(m => m[1]).join('');
  chk(!/"price"|priceCurrency|"offers"/.test(ld), '§9.4 nenhum preco no JSON-LD');

  // §9.1 — fan art sem oferta nenhuma no schema
  const fan = A.artworks.filter(a => a.cat === 'fanart').length;
  chk(!/"offers"/.test(ld), `§9.1 o ImageGallery nao anexa oferta a nenhuma obra`, `${fan} pecas de fan art`);

  // §9.2 — nenhuma localizacao fora dos locais de evento
  const copia = JSON.stringify({ ...A.i18n, timeline: undefined });
  const meta = [...src.matchAll(/<meta[^>]*content="([^"]*)"/g)].map(m => m[1]).join(' ');
  chk(!/\bPortugal\b|\bPorto\b|\bLisboa\b|\bLisbon\b/.test(meta),
      '§9.2 nenhuma localizacao nas meta tags');
}

/* ---------- 3. browser ---------- */
async function navegador(dir, etiqueta){
  const srv = servir(dir);
  await new Promise(r => setTimeout(r, 1200));
  const b = await chromium.launch();
  const erros = [];
  const nova = async (w = 1280, opts = {}) => {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, ...opts });
    p.on('pageerror', e => erros.push('JS: ' + e.message));
    /* As fontes do Google sao o unico pedido externo do site. Aqui sao
       bloqueadas de proposito: os testes tem de correr sem rede. */
    await p.route('**fonts.g**', r => r.abort());
    return p;
  };

  tit(`3. Browser ${etiqueta} — layout e comportamento`);

  /* --- CLS sem travao ---
     Na loja tambem desde 1 Nov 2026: o merch passou para o primeiro ecra, e
     numa ligacao lenta as comissoes pintavam-se primeiro e eram empurradas
     um ecra para baixo quando os cartoes chegavam (0,61). */
  for (const pag of ['index.html', 'loja.html']) {
    const p = await nova(1440);
    await p.addInitScript(() => { window.__cls = 0;
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(base + pag, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const cls = await p.evaluate(() => window.__cls);
    chk(cls < 0.01, `CLS sem travao abaixo de 0,01, ${pag}`, cls.toFixed(4));
    await p.close();
  }

  /* --- CLS travado a 400 kbps, tres voltas ---
     Tres e nao uma de proposito: o salto de 0,33 que o order:-1 causava so
     aparecia em cerca de uma carga em tres, consoante o momento do primeiro
     desenho. Uma volta so nao prova nada. */
  if (!RAPIDO) for (const pag of ['index.html', 'loja.html']) {
    const vals = [];
    for (let i = 0; i < 3; i++) {
      const p = await nova(1440);
      await p.addInitScript(() => { window.__cls = 0;
        new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
          .observe({ type: 'layout-shift', buffered: true }); });
      const cdp = await p.context().newCDPSession(p);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions',
        { offline: false, latency: 400, downloadThroughput: 400 * 1024 / 8, uploadThroughput: 400 * 1024 / 8 });
      await p.goto(base + pag, { waitUntil: 'load' });
      await p.waitForTimeout(4000);
      vals.push(await p.evaluate(() => window.__cls));
      await p.close();
    }
    chk(Math.max(...vals) < 0.05, `CLS travado a 400 kbps, tres voltas, ${pag}`,
      vals.map(v => v.toFixed(4)).join(' / '));
  }

  /* --- overflow horizontal: varrer, nao espreitar ---
     A banda dos 621-743px esteve partida durante meses e 390/768/1440
     pareciam todos bem. Por isso e de 4 em 4 pixeis.
     A loja tambem em PT e com o cesto cheio: "Escolhe" e mais largo do que
     "Choose", e foi em PT, com artigos no cesto, que os cartoes rebentaram
     os 320px (Set 2026). So em EN e vazia, o teste passava. */
  {
    const maus = [];
    for (const pag of ['index.html', 'loja.html', 'loja.html?lang=pt']) {
      const p = await nova(1280);
      await p.goto(base + pag, { waitUntil: 'networkidle' });
      if (pag.startsWith('loja')) await p.evaluate(() => {
        if (!CONFIG.shopOpen) return;
        /* a ultima variante de cada produto (a mais comprida: Sumo / White /
           XL), dez de cada, sem guardar no browser */
        cesto = CONFIG.merch.filter(m => m.variants && !m.hold)
          .map(m => ({ id: m.variants[m.variants.length - 1], q: 10 }));
        desenhaCesto(); });
      for (let w = 320; w <= 1600; w += 4) {
        await p.setViewportSize({ width: w, height: 900 });
        await p.waitForTimeout(40);
        const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (o > 0) maus.push(`${pag} ${w}px:+${o}`);
        /* a barra tem margem dos dois lados. Um padding:10px 0 no .bar anulou
           durante meses o padding lateral do .wrap, e abaixo dos ~1290px a
           marca e o ultimo botao colavam-se a borda do ecra (a 0px no
           telemovel). So se viu quando o logotipo passou a ser o sapo. */
        const m = await p.evaluate(() => {
          const bar = document.querySelector('.bar');
          const vis = [...bar.querySelectorAll('a, button, img')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
          const r = vis.map(e => e.getBoundingClientRect());
          return { esq: Math.min(...r.map(x => x.left)), dir: innerWidth - Math.max(...r.map(x => x.right)) };
        });
        if (m.esq < 8 || m.dir < 8) maus.push(`${pag} ${w}px: barra encostada (esq ${Math.round(m.esq)}, dir ${Math.round(m.dir)})`);
      }
      await p.close();
    }
    chk(maus.length === 0, 'zero overflow horizontal de 320 a 1600px (de 4 em 4), e a barra com margem, index e loja EN/PT com o cesto cheio',
      maus.slice(0, 6).join(' '));
  }

  /* --- nenhuma peca cortada ---
     As lazy TEM de ser forcadas a carregar: sem isso reportam naturalWidth 0
     e passam todas por engano. */
  {
    const p = await nova(1440);
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    /* a parede abre so com as primeiras pecas: as escondidas tinham caixa 0 e
       passavam o teste por engano. Abre-se toda antes de medir. */
    await p.evaluate(() => { const m = document.getElementById('wallMore'); if (m && m.offsetParent) m.click();
      for (const i of document.querySelectorAll('img')) i.loading = 'eager';
      window.scrollTo(0, document.body.scrollHeight); });
    await p.waitForTimeout(3000);
    const cort = await p.evaluate(() => {
      const o = [];
      /* Com a grelha uniforme (Set 2026) a caixa do <img> e a moldura 4:5,
         nao a proporcao da obra: a obra entra inteira por object-fit:contain.
         Por isso o teste aceita as duas coisas que garantem "nada cortado" —
         proporcoes iguais, ou contain — e falha com cover ou fill. */
      for (const i of document.querySelectorAll('.wall img, .pf img, .proj > img')) {
        if (!i.naturalWidth) { o.push(i.getAttribute('src') + ':nao carregou'); continue; }
        const r = i.getBoundingClientRect();
        const igual = Math.abs(i.naturalWidth / i.naturalHeight - r.width / r.height) <= 0.02;
        if (!igual && getComputedStyle(i).objectFit !== 'contain') o.push(i.getAttribute('src'));
      }
      return o;
    });
    chk(cort.length === 0, 'nenhuma peca da parede nem capa de projecto esta cortada', cort.join(' '));
    /* as capas da fila de projectos tem a mesma altura (Set 2026): larguras de
       coluna diferentes e proporcoes diferentes davam titulos desalinhados */
    const alt = await p.evaluate(() => [...document.querySelectorAll('.proj > img')].map(i => Math.round(i.getBoundingClientRect().height)));
    chk(alt.length > 0 && new Set(alt).size === 1, 'as capas dos projectos tem todas a mesma altura', alt.join(' / '));
    await p.close();
  }

  /* --- o site abre escuro (1 Nov 2026): a paleta do Frede, Midnight Black,
     Electric Cobalt e Acid Lime. Sem tocar no botao do tema, as quatro paginas
     abrem no #030407, e o claro so aparece pelo botao. --- */
  {
    const maus = [];
    for (const pag of ['index.html', 'projeto.html?p=sok', 'loja.html', '404.html']) {
      const p = await nova(1280, { colorScheme: 'light' });   // nem um telemovel em claro muda isto
      await p.goto(base + pag, { waitUntil: 'networkidle' });
      const fundo = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
      if (fundo !== 'rgb(3, 4, 7)') maus.push(`${pag}: ${fundo}`);
      await p.close();
    }
    chk(maus.length === 0, 'as quatro paginas abrem no Midnight Black (#030407), mesmo com o sistema em claro',
      maus.join('  '));
  }

  /* --- reduced-motion: pela DURACAO, nunca pela propriedade --- */
  {
    const fugas = {};
    for (const pag of ['index.html', 'projeto.html?p=sok', 'loja.html', '404.html']) {
      const p = await nova(1280, { reducedMotion: 'reduce' });
      await p.goto(base + pag, { waitUntil: 'networkidle' });
      await p.waitForTimeout(600);
      fugas[pag] = await p.evaluate(() => [...new Set(
        [document.body, ...document.querySelectorAll('body *')].flatMap(e => {
          const c = getComputedStyle(e), o = [];
          if (c.transitionDuration.split(',').some(x => parseFloat(x) > 0)) o.push('trans:' + e.tagName.toLowerCase());
          if (c.animationName !== 'none' && parseFloat(c.animationDuration) > 0) o.push('anim:' + c.animationName);
          return o;
        }))]);
      await p.close();
    }
    const total = Object.values(fugas).flat();
    chk(total.length === 0, '§9.8 zero efeitos sob prefers-reduced-motion, nas quatro paginas',
      total.join(' '));
  }

  /* --- contraste, nos dois temas, DEPOIS de a transicao assentar ---
     Elementos com background-image (gradiente) ficam de fora: a cor de fundo
     computada nao diz nada sobre eles e o resultado seria um falso positivo.
     Esses medem-se nos pixeis, nao no DOM. */
  for (const pag of ['index.html', 'loja.html']) {
    const p = await nova(1280);
    await p.goto(base + pag, { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    for (const tema of ['dark', 'light']) {
      await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), tema);
      await p.waitForTimeout(900);                    // a transicao do body e de 0,4s
      const f = await p.evaluate(() => {
        const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
          const v = m[1].split(/[, /]+/).map(Number);
          return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
        const over = (f, b) => ({ r: f.r*f.a + b.r*(1-f.a), g: f.g*f.a + b.g*(1-f.a), b: f.b*f.a + b.b*(1-f.a), a: 1 });
        const lum = c => { const g = x => { x /= 255; return x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4); };
          return 0.2126*g(c.r) + 0.7152*g(c.g) + 0.0722*g(c.b); };
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x+0.05)/(y+0.05); };
        const out = [];
        for (const el of document.querySelectorAll('body *')) {
          if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
          const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
          const fg = parse(cs.color); if (!fg) continue;
          // sobe ate encontrar um fundo opaco, desistindo se apanhar um gradiente
          let n = el, bg = null, grad = false;
          while (n) { const c = getComputedStyle(n);
            if (c.backgroundImage && c.backgroundImage !== 'none') { grad = true; break; }
            const p = parse(c.backgroundColor);
            if (p && p.a === 1) { bg = p; break; }
            n = n.parentElement; }
          if (grad || !bg) continue;
          const eff = fg.a < 1 ? over(fg, bg) : fg;
          const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
          const min = (px >= 24 || (px >= 18.66 && bold)) ? 3 : 4.5;
          const got = ratio(eff, bg);
          if (got < min) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${got.toFixed(2)}<${min}`);
        }
        return [...new Set(out)];
      });
      chk(f.length === 0, `contraste no tema ${tema}, ${pag}`, f.slice(0, 5).join('  '));
    }
    await p.close();
  }

  /* --- a abertura: o nome em duas linhas, o que faz em duas (1 Nov 2026) ---
     O nome e o nome proprio (CONFIG.realName, "Frederico Guita", desde o
     pedido do Frede de so deixar o nome e o que faz): "Frederico" em cima,
     "Guita" em baixo, sempre duas linhas, com o tamanho a seguir a coluna,
     que podia empurrar "Frederico" para fora dela e por baixo da obra. As
     linhas contam-se no texto, nao na caixa: a caixa guarda duas linhas
     (min-height) e esconderia um nome que coubesse numa. A linha de
     baixo ("Ilustracao e design de personagens") tem duas linhas reservadas,
     por isso tem de ter sempre duas (com tres empurrava os botoes e a obra no
     telemovel). E a obra da abertura cabe inteira no primeiro ecra dos
     portateis. Varre-se a largura, nas duas linguas, com a letra ja carregada.
     (Substitui o teste do titulo de duas linhas, que saiu com ele.) */
  {
    const maus = [];
    for (const lq of ['', '?lang=pt']) for (const w of [320, 360, 390, 430, 620, 640, 700, 780, 900, 980, 1024, 1180, 1280, 1440, 1600]) {
      const p = await nova(w);
      await p.goto(base + 'index.html' + lq, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      const r = await p.evaluate(() => {
        const nm = document.querySelector('.hero h1 .nm'), role = document.querySelector('.hero h1 .role');
        const col = document.querySelector('.hero-info').getBoundingClientRect();
        const n = nm.getBoundingClientRect(), lr = parseFloat(getComputedStyle(role).lineHeight);
        const rng = document.createRange(); rng.selectNodeContents(nm);
        const texto = rng.getBoundingClientRect();
        const linhas = (el, lh) => { const q = document.createRange(); q.selectNodeContents(el);
          return new Set([...q.getClientRects()].filter(x => x.width > 1).map(x => Math.round(x.top / lh))).size; };
        return { nome: nm.textContent, quer: CONFIG.realName, linhasNome: linhas(nm, parseFloat(getComputedStyle(nm).lineHeight)),
          fora: Math.round(texto.right - Math.max(col.right, n.right)),
          /* linhas do texto, nao da caixa: a reserva de duas linhas escondia
             um texto que coubesse numa (testado com um bug plantado) */
          linhasRole: linhas(role, lr) };
      });
      const tag = `${lq || 'en'} ${w}px`;
      if (!r.quer || r.nome !== r.quer) maus.push(`${tag}: nome "${r.nome}" (quer "${r.quer}")`);
      if (r.linhasNome !== 2) maus.push(`${tag}: nome em ${r.linhasNome} linhas`);
      if (r.fora > 1) maus.push(`${tag}: nome sai ${r.fora}px da coluna`);
      if (r.linhasRole !== 2) maus.push(`${tag}: "o que faz" em ${r.linhasRole} linhas`);
      await p.close();
    }
    for (const [w, h] of [[1280, 720], [1440, 900], [1920, 1080]]) {
      const p = await nova(w, { viewport: { width: w, height: h } });
      await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
      const r = await p.evaluate(() => { const m = document.querySelector('.hero-art .mat').getBoundingClientRect();
        return { fundo: Math.round(m.bottom), dentro: m.right <= innerWidth && m.width > 250 }; });
      if (r.fundo > h || !r.dentro) maus.push(`${w}x${h}: a obra acaba em ${r.fundo}px`);
      await p.close();
    }
    chk(maus.length === 0, 'a abertura: o nome em duas linhas dentro da coluna, o que faz em duas, a obra inteira no primeiro ecra',
      maus.slice(0, 6).join('  '));
  }

  /* --- o Flip (1 Nov 2026): as seis originais em pequeno trocam a obra da
     abertura. Seis molduras, uma so escolhida e e a da obra grande; um
     toque noutra troca a obra, a legenda ("titulo" e "n / 6") e a escolha;
     as palavras existem nas duas linguas. --- */
  {
    const maus = [];
    for (const lq of ['', '?lang=pt']) {
      const p = await nova(1280);
      await p.goto(base + 'index.html' + lq, { waitUntil: 'networkidle' });
      const a = await p.evaluate(() => {
        const minis = [...document.querySelectorAll('#heroMini .mini')];
        const fig = document.querySelector('#heroArt');
        const outro = minis.find(b => b.getAttribute('aria-pressed') !== 'true');
        return { n: minis.length, escolhidas: minis.filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.idx),
          idx: fig.dataset.idx, alvo: outro ? outro.dataset.idx : null, grupo: document.querySelector('#heroMini').getAttribute('aria-label'),
          rotulos: minis.map(b => b.getAttribute('aria-label')) };
      });
      const tag = lq ? 'pt' : 'en';
      if (a.n !== 6) maus.push(`${tag}: ${a.n} molduras`);
      if (a.escolhidas.length !== 1 || a.escolhidas[0] !== a.idx) maus.push(`${tag}: escolhida ${a.escolhidas} vs obra ${a.idx}`);
      const verbo = lq ? 'Mostrar ' : 'Show ';
      if (!a.grupo || a.rotulos.some(r => !r || !r.startsWith(verbo))) maus.push(`${tag}: rotulos ${a.grupo} / ${a.rotulos[0]}`);
      if (a.alvo !== null) {
        await p.click(`#heroMini .mini[data-idx="${a.alvo}"]`);
        await p.waitForFunction(i => document.querySelector('#heroArt').dataset.idx === i, a.alvo, { timeout: 4000 }).catch(() => {});
        /* o browser escolhe o ficheiro do srcset um instante depois de o src
           mudar: ate la o currentSrc vem vazio (o teste leu-o cedo demais na
           primeira versao; era o teste, nao o site) */
        await p.waitForFunction(() => { const i = document.querySelector('#heroImg');
          const g = CONFIG.artworks[+document.querySelector('#heroArt').dataset.idx];
          return i.currentSrc && i.currentSrc.includes(g.src.split('/').pop().replace(/\.jpe?g$/i, '')); }, null, { timeout: 4000 }).catch(() => {});
        const d = await p.evaluate(() => {
          const fig = document.querySelector('#heroArt'), g = CONFIG.artworks[+fig.dataset.idx];
          const lista = CONFIG.heroArt.map(s => CONFIG.artworks.findIndex(x => x.src === s));
          return { idx: fig.dataset.idx, src: document.querySelector('#heroImg').currentSrc,
            stem: g.src.split('/').pop().replace(/\.jpe?g$/i, ''), cap: document.querySelector('#heroCap').textContent, label: g.label,
            pos: document.querySelector('#heroPos').textContent, quer: `${lista.indexOf(+fig.dataset.idx) + 1} / ${lista.length}`,
            escolhidas: [...document.querySelectorAll('#heroMini .mini[aria-pressed=true]')].map(b => b.dataset.idx) };
        });
        if (d.idx !== a.alvo) maus.push(`${tag}: o toque nao trocou a obra (${d.idx} em vez de ${a.alvo})`);
        else {
          if (!d.src.includes(d.stem)) maus.push(`${tag}: a imagem nao e a escolhida (${d.src.split('/').pop()})`);
          if (d.cap !== d.label || d.pos !== d.quer) maus.push(`${tag}: legenda "${d.cap} ${d.pos}"`);
          if (d.escolhidas.length !== 1 || d.escolhidas[0] !== a.alvo) maus.push(`${tag}: escolhida ${d.escolhidas}`);
        }
      }
      await p.close();
    }
    chk(maus.length === 0, 'o Flip: seis molduras, uma escolhida, o toque troca a obra, a legenda e a escolha (EN e PT)',
      maus.join('  '));
  }

  /* --- os titulos inteiros depois da tinta (1 Nov 2026, critica do Impeccable) ---
     O titulo revela-se por um clip-path; com inset(0) o corte ficava na caixa
     da linha (line-height 1.08) e a mincho desce abaixo dela: "Say hi" perdia
     a perna do y, "Featured projects" a do p e a do j. Com a tinta ja
     espalhada (sem transicao), a caixa do texto (ascendente + descendente)
     tem de caber dentro do corte, em cima e em baixo, nas duas linguas. */
  {
    const maus = [];
    for (const lq of ['', '?lang=pt']) for (const w of [390, 1440]) {
      const p = await nova(w);
      await p.goto(base + 'index.html' + lq, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      await p.addStyleTag({ content: '*{transition:none!important}' });
      await p.evaluate(() => document.querySelectorAll('.head').forEach(h => h.classList.add('in')));
      const r = await p.evaluate(() => [...document.querySelectorAll('.sec-title')].map(el => {
        const cs = getComputedStyle(el), e = el.getBoundingClientRect(), q = document.createRange(); q.selectNodeContents(el);
        const t = q.getBoundingClientRect(), m = cs.clipPath.match(/inset\(([^)]*)\)/);
        if (!m) return null;
        const v = m[1].trim().split(/\s+/).map(parseFloat), top = v[0], bottom = v[2] ?? v[0];
        const fora = Math.max(t.bottom - (e.bottom - bottom), (e.top + top) - t.top);
        return fora > 0.5 ? `"${el.textContent}" ${fora.toFixed(1)}px` : null;
      }).filter(Boolean));
      r.forEach(x => maus.push(`${lq || 'en'} ${w}px: ${x}`));
      await p.close();
    }
    chk(maus.length === 0, 'os titulos das seccoes inteiros depois da tinta (o corte nao come as pernas das letras)', maus.slice(0, 6).join('  '));
  }

  /* --- o leitor de ecra na lingua da pagina (1 Nov 2026, critica do Impeccable) ---
     As etiquetas dos controlos sem texto (aria-label) e a ligacao de saltar
     estavam escritas em ingles na marcacao e ficavam em ingles na pagina em
     PT. A paridade dos data-t nao as via. Agora: (1) na marcacao (fora dos
     <script>), todo o aria-label leva data-ta e a ligacao de saltar leva
     data-t; (2) com a pagina aberta em PT, cada etiqueta data-ta existe e e
     diferente da inglesa. */
  {
    const maus = [];
    for (const pag of ['index.html', 'loja.html', 'projeto.html']) {
      const html = readFileSync(join(ROOT, pag), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
      for (const m of html.matchAll(/<[a-z][^>]*\saria-label="[^"]*"[^>]*>/g))
        if (!/\sdata-ta="/.test(m[0])) maus.push(`${pag}: aria-label sem data-ta: ${m[0].slice(0, 70)}`);
      for (const m of html.matchAll(/<a[^>]*class="skip"[^>]*>/g))
        if (!/\sdata-t="/.test(m[0])) maus.push(`${pag}: a ligacao de saltar sem data-t`);
    }
    for (const pag of ['index.html', 'loja.html', 'projeto.html?p=sok']) {
      const ler = async lang => {
        const p = await nova(1280);
        await p.goto(base + pag + (pag.includes('?') ? '&' : '?') + 'lang=' + lang, { waitUntil: 'networkidle' });
        const r = await p.evaluate(() => ({ lang: document.documentElement.lang,
          et: Object.fromEntries([...document.querySelectorAll('[data-ta]')].map(e => [e.dataset.ta, e.getAttribute('aria-label') || ''])),
          skip: document.querySelector('a.skip')?.textContent || null }));
        await p.close(); return r;
      };
      const en = await ler('en'), pt = await ler('pt');
      if (pt.lang !== 'pt') maus.push(`${pag}: lang="${pt.lang}" com ?lang=pt`);
      for (const [k, v] of Object.entries(pt.et))
        if (!v || v === en.et[k]) maus.push(`${pag}: ${k} em PT "${v}" (EN "${en.et[k]}")`);
      if (pt.skip !== null && (!pt.skip || pt.skip === en.skip)) maus.push(`${pag}: saltar "${pt.skip}"`);
    }
    chk(maus.length === 0, 'as etiquetas do leitor de ecra (aria-label) e a ligacao de saltar seguem a lingua da pagina', maus.slice(0, 6).join('  '));
  }

  /* --- a lightbox num telemovel (1 Nov 2026, critica do Impeccable) ---
     As setas eram transparentes, a meio do ecra, e num telemovel ficavam por
     cima da obra: nas de fundo branco (Angela) desapareciam. E a dica falava
     de teclas. Num ecra de toque (e numa janela estreita), nenhuma seta, nem
     o fechar, pode tapar a obra, e a dica visivel e a do gesto; com rato, a
     das teclas. Abre-se a lightbox nas quatro primeiras obras da parede. */
  {
    const maus = [];
    /* 820px com toque e um tablet: so a regra (hover:none) poe la as setas em
       baixo (abaixo dos 621px o bloco dos 620 tambem as poe, e esconderia a falta) */
    for (const [w, h, toque, lq] of [[390, 844, true, '?lang=pt'], [320, 640, true, ''], [820, 1180, true, ''], [1280, 800, false, '']]) {
      const p = await nova(w, { viewport: { width: w, height: h }, hasTouch: toque, isMobile: toque });
      await p.goto(base + 'index.html' + lq, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.querySelector('#work').scrollIntoView());
      for (let i = 0; i < 4; i++) {
        await p.locator('.frame').nth(i).click();
        await p.waitForTimeout(400);
        const r = await p.evaluate(() => {
          const R = s => document.querySelector(s).getBoundingClientRect();
          const art = R('#lbStage img'), sob = q => { const b = R(q); return !(b.right <= art.left || art.right <= b.left || b.bottom <= art.top || art.bottom <= b.top); };
          const dicas = [...document.querySelectorAll('.lb-hint')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.dataset.t);
          return { cap: document.querySelector('#lbCap').textContent, tapa: ['#lbPrev', '#lbNext', '#lbClose'].filter(sob), dicas };
        });
        const tag = `${w}px ${toque ? 'toque' : 'rato'} "${r.cap}"`;
        if (toque && r.tapa.length) maus.push(`${tag}: ${r.tapa.join(' ')} por cima da obra`);
        const quer = toque ? 'lightboxHintTouch' : 'lightboxHint';
        if (r.dicas.length !== 1 || r.dicas[0] !== quer) maus.push(`${tag}: dica ${r.dicas.join('+') || 'nenhuma'}`);
        await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      }
      await p.close();
    }
    chk(maus.length === 0, 'a lightbox no telemovel: as setas e o fechar nunca tapam a obra, e a dica e a do gesto (a das teclas com rato)', maus.slice(0, 6).join('  '));
  }

  /* --- a parede num ecra de toque: o titulo por baixo (1 Nov 2026) ---
     Sem hover, a faixa do titulo nunca subia e a parede nao dizia o nome de
     nenhuma obra. Num ecra de toque, cada moldura visivel mostra o titulo por
     baixo da obra, numa linha so (a reserva da parede conta 28px por fila), e
     a reserva fica entre 95% e 100% da altura real (o mesmo alvo do resto). */
  {
    const maus = [];
    for (const [w, h] of [[390, 844], [820, 1180]]) {
      const p = await nova(w, { viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
      await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
      const reserva = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#wall')).minHeight));
      await p.evaluate(async () => { const is = [...document.querySelectorAll('#wall img')]; is.forEach(i => i.loading = 'eager');
        await Promise.all(is.map(i => i.decode().catch(() => {}))); });
      const r = await p.evaluate(() => { const fr = [...document.querySelectorAll('#wall .frame')].filter(f => f.offsetParent);
        return { real: document.querySelector('#wall').getBoundingClientRect().height,
          maus: fr.map(f => { const im = f.querySelector('img, .ph').getBoundingClientRect(), m = f.querySelector('.meta'), mb = m.getBoundingClientRect();
            const ok = getComputedStyle(m).transform === 'none' && mb.top >= im.bottom - 1 && Math.round(mb.height) === 20 && m.textContent.trim();
            return ok ? null : `"${m.textContent}" ${Math.round(mb.height)}px`; }).filter(Boolean) }; });
      r.maus.slice(0, 3).forEach(x => maus.push(`${w}px: ${x}`));
      if (!(reserva <= r.real + 1 && reserva >= r.real * 0.95)) maus.push(`${w}px: reserva ${Math.round(reserva)} para ${Math.round(r.real)} reais`);
      await p.close();
    }
    chk(maus.length === 0, 'a parede num ecra de toque: o titulo por baixo de cada obra, numa linha, e a reserva certa', maus.slice(0, 6).join('  '));
  }

  /* --- seletores sem alvo e afordancias falsas --- */
  for (const pag of ['index.html', 'loja.html']) {
    const p = await nova(1280);
    await p.goto(base + pag, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    /* A loja tem dois estados com CSS proprio: o do merch so tem alvo com a
       loja aberta, o de "so comissoes" so com ela fechada. Mede-se nos dois e
       so e morto o seletor que nao tem alvo em NENHUM. */
    const medir = () => p.evaluate(() => {
      const mortos = [];
      for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; }
        const anda = l => { for (const r of l) { if (r.cssRules) { anda(r.cssRules); continue; }
          if (!r.selectorText) continue;
          for (const sel of r.selectorText.split(',').map(s => s.trim())) {
            const base = sel.replace(/::?(hover|active|focus|focus-visible|focus-within|before|after|placeholder|selection|backdrop|first-line|marker|-webkit-[\w-]+)/g, '');
            if (!base || base === '*') continue;
            try { if (!document.querySelector(base)) mortos.push(sel); } catch (e) {} } } };
        anda(rs); }
      const falsos = [];
      for (const el of document.querySelectorAll('body *')) {
        if (getComputedStyle(el).cursor !== 'pointer') continue;
        if (!el.closest('a[href],button,input,select,textarea,[role=button],[onclick],[tabindex]'))
          falsos.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]);
      }
      return { mortos: [...new Set(mortos)], falsos: [...new Set(falsos)] };
    });
    const r = await medir();
    if (pag === 'loja.html') {
      await p.evaluate(() => { CONFIG.shopOpen = !CONFIG.shopOpen; render(); });
      const r2 = await medir();
      r.mortos = r.mortos.filter(x => r2.mortos.includes(x));
      r.falsos = [...new Set([...r.falsos, ...r2.falsos])];
    }
    chk(r.mortos.length === 0, `nenhum seletor CSS sem alvo, ${pag}`, r.mortos.slice(0, 5).join(' '));
    chk(r.falsos.length === 0, `nenhum cursor:pointer sem destino clicavel, ${pag}`, r.falsos.join(' '));
    await p.close();
  }

  /* --- titulos de seccao revelam-se ---
     O .sec-title nasce todo recortado por clip-path. Ja esteve invisivel em
     todas as seccoes porque o observer nunca o via entrar. */
  {
    const p = await nova(1280);
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, 800); await p.waitForTimeout(200); }
    await p.waitForTimeout(800);
    const t = await p.evaluate(() => [...document.querySelectorAll('h2.sec-title')]
      .filter(h => h.offsetParent)                 // ignora seccoes escondidas
      /* aberto = o corte da direita ja nao esta nos 100% do inicio (desde
         1 Nov 2026 o corte aberto vai para la da caixa: inset negativo) */
      .map(h => { const v = (getComputedStyle(h).clipPath.match(/inset\(([^)]*)\)/) || [, ''])[1].trim().split(/\s+/);
        const dir = v[1] ?? v[0]; return { t: h.textContent.trim(), abre: !!dir && !dir.includes('%') && parseFloat(dir) <= 0 }; }));
    const fechados = t.filter(x => !x.abre).map(x => x.t);
    chk(fechados.length === 0, 'todos os titulos de seccao visiveis se revelam',
      fechados.join(' ') || `${t.length} titulos`);
    await p.close();
  }

  /* --- a lightbox: abrir, navegar, dar a volta, fechar, devolver o foco --- */
  {
    const p = await nova(1440);
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    await p.evaluate(() => document.querySelectorAll('.wall .frame')[0].click());
    await p.waitForTimeout(400);
    const abriu = await p.evaluate(() => document.getElementById('lb').classList.contains('open'));
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(400);
    const volta = await p.evaluate(() => document.getElementById('lbPos').textContent.trim());
    /* a lightbox percorre todas as obras, as do destaque incluidas */
    const nPecas = await p.evaluate(() => CONFIG.artworks.length);
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    const fechou = await p.evaluate(() => ({
      fechada: !document.getElementById('lb').classList.contains('open'),
      scroll: document.body.style.overflow }));
    chk(abriu && volta.includes(String(nPecas)) && fechou.fechada && fechou.scroll === '',
      'lightbox abre, da a volta, fecha e solta o scroll', `${volta} de ${nPecas}`);
    await p.close();
  }

  /* --- a parede abre na pre-visualizacao, e o botao abre-a toda --- */
  {
    const p = await nova(1440);
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const vis = () => [...document.querySelectorAll('.wall .frame')].filter(f => getComputedStyle(f).display !== 'none').length;
      const total = document.querySelectorAll('#wall .frame').length, prev = CONFIG.wallPreview;
      const btn = document.getElementById('wallMore');
      const antes = vis(), temBotao = !!btn.offsetParent, texto = btn.textContent;
      btn.click();
      return { total, prev, antes, temBotao, texto, depois: vis(),
               foco: document.activeElement === document.querySelectorAll('.wall .frame')[prev],
               some: !document.getElementById('wallMoreRow').offsetParent };
    });
    const ok = r.antes === Math.min(r.prev, r.total) && r.temBotao === (r.total > r.prev)
      && r.texto.includes(String(r.total)) && r.depois === r.total && r.some && r.foco;
    chk(ok, 'a parede abre com as primeiras pecas e o botao mostra as outras',
      `${r.antes} de ${r.total}, depois ${r.depois}${r.foco ? '' : ', foco perdido'}`);
    await p.close();
  }

  /* --- o projecto em destaque: o cartao grande nos Projectos --- */
  {
    const p = await nova(1440);
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const proj = CONFIG.projects.find(x => x.key === CONFIG.featured);
      if (!proj) return { sem: true };
      const box = document.getElementById('projFeat');
      const outros = [...document.querySelectorAll('#projGrid .proj')].map(a => a.getAttribute('href'));
      return { capa: !!box.querySelector('.pf-art img'),
               tira: box.querySelectorAll('.pf-strip img').length, quer: Math.min(7, (proj.gallery || []).length),
               titulo: (box.querySelector('.pf h3') || {}).textContent || '',
               abre: [...box.querySelectorAll('a')].some(a => a.getAttribute('href').includes('p=' + proj.key)),
               repetido: outros.some(h => h.includes('p=' + proj.key)),
               nOutros: outros.length, total: CONFIG.projects.length };
    });
    chk(r.sem || (r.capa && r.tira === r.quer && r.titulo.trim() && r.abre && !r.repetido && r.nOutros === r.total - 1),
      'o projecto em destaque tem o cartao grande, a tira da serie e nao se repete',
      r.sem ? 'sem destaque' : `${r.tira} de ${r.quer} na tira, ${r.nOutros} outros cartoes`);
    await p.close();
  }

  /* --- filtros: as partes somam o todo --- */
  {
    const p = await nova(1440);
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    const { o: r, querCol } = await p.evaluate(() => {
      const m = document.getElementById('wallMore'); if (m && m.offsetParent) m.click();
      const chips = [...document.querySelectorAll('#filters .chip')];
      const conta = () => [...document.querySelectorAll('.wall .frame')].filter(f => getComputedStyle(f).display !== 'none').length;
      const o = [];
      const lb = () => { // quantas pecas a lightbox percorre com este filtro
        const vistos = new Set(); const f = [...document.querySelectorAll('.wall .frame')].find(x => getComputedStyle(x).display !== 'none');
        if (!f) return 0; f.click();
        for (let k = 0; k < 200; k++) { const s = document.getElementById('lbCap').textContent; if (vistos.has(s)) break; vistos.add(s); document.getElementById('lbNext').click(); }
        document.getElementById('lbClose').click(); return vistos.size;
      };
      for (const c of chips) { c.click(); o.push({ n: c.textContent.trim(), cat: c.dataset.cat, v: conta(), lb: c.dataset.cat === 'collab' ? lb() : null }); }
      chips[0].click();
      return { o, querCol: CONFIG.artworks.filter(a => a.collab).length };
    });
    /* as categorias partem a parede sem sobras; "collab" e uma marca por cima
       delas (uma colab de fan art esta nos dois), por isso fica fora da soma */
    const partes = r.slice(1).filter(x => x.cat !== 'collab');
    const todos = r[0].v, soma = partes.reduce((a, x) => a + x.v, 0);
    chk(todos === soma, 'os filtros somam o total da parede',
      `${partes.map(x => x.v).join('+')} = ${soma} de ${todos}`);
    const col = r.find(x => x.cat === 'collab');
    chk(querCol === 0 ? !col : (col && col.v === querCol && col.lb === querCol),
      'o filtro das colaboracoes mostra todas as colabs, e a lightbox percorre so essas',
      col ? `${col.v} na parede, ${col.lb} na lightbox, de ${querCol}` : 'sem colabs, sem chip');
    await p.close();
  }

  /* --- projeto.html: todas as chaves, as duas linguas --- */
  {
    const maus = [];
    let serieSok = 0;
    for (const loc of ['en-US', 'pt-PT']) {
      const p = await nova(1100, { locale: loc });
      for (const k of [...CHAVES, 'naoexiste', '']) {
        await p.goto(`${base}projeto.html?p=${k}`, { waitUntil: 'networkidle' });
        /* a serie inteira, nao so a capa: as outras sao lazy e sem as forcar
           reportavam naturalWidth 0 e passavam por engano */
        await p.evaluate(() => { for (const i of document.querySelectorAll('main img')) i.loading = 'eager'; });
        await p.waitForTimeout(700);
        const r = await p.evaluate(() => {
          /* main e nao .wrap: desde Out 2026 a barra (com o logotipo) tambem e .wrap */
          const imgs = [...document.querySelectorAll('main img')];
          /* a grelha da serie tambem nao pode cortar nada */
          const cortadas = imgs.filter(i => { const r = i.getBoundingClientRect();
            return i.naturalWidth && Math.abs(i.naturalWidth / i.naturalHeight - r.width / r.height) > 0.02; }).length;
          return { h1: document.querySelector('h1').textContent.trim(), cortadas,
                   img: imgs.length ? imgs.every(i => i.naturalWidth > 0) : null, n: imgs.length,
                   robots: document.querySelector('meta[name="robots"]').content,
                   /* a barra do site (Out 2026) e o link de fora, quando o projecto o tem */
                   barra: !!document.querySelector('header .logo') && !!document.getElementById('langTgl'),
                   link: (document.querySelector('#acts a') || {}).href || '' };
        });
        if (k === 'sok') serieSok = r.n;
        const real = CHAVES.includes(k);
        if (!r.h1) maus.push(`${loc} ${k}: sem titulo`);
        if (real && r.img === false) maus.push(`${loc} ${k}: imagem partida`);
        if (r.cortadas) maus.push(`${loc} ${k}: ${r.cortadas} imagens cortadas`);
        if (!real && !r.robots.includes('noindex')) maus.push(`${loc} ${k}: devia ser noindex`);
        if (!r.barra) maus.push(`${loc} ${k}: sem a barra (logotipo, lingua)`);
        if (k === 'sok' && !r.link.includes('webtoons.com')) maus.push(`${loc} sok: sem o botao do Webtoon`);
      }
      await p.close();
    }
    /* a lingua que vem no link do index manda sobre a do browser */
    {
      const p = await nova(1100, { locale: 'en-US' });
      await p.goto(`${base}projeto.html?p=sok&lang=pt`, { waitUntil: 'networkidle' });
      const l = await p.evaluate(() => ({ lang: document.documentElement.lang, volta: document.querySelector('.back').getAttribute('href') }));
      if (l.lang !== 'pt' || !l.volta.includes('lang=pt')) maus.push(`?lang=pt ignorado: ${l.lang} ${l.volta}`);
      await p.close();
    }
    chk(maus.length === 0, `projeto.html nas ${CHAVES.length} chaves + invalida + vazia, EN e PT, a serie toda carregada`,
      maus.join(' ') || `Survival of Kings: ${serieSok} imagens`);
  }

  /* --- loja.html: as duas linguas, fechada e aberta, e o caminho desde o index --- */
  {
    const maus = [], lrMaus = [];
    for (const lq of ['', '?lang=pt']) {
      const p = await nova(1100, { locale: 'en-US' });
      await p.goto(`${base}loja.html${lq}`, { waitUntil: 'networkidle' });
      const r = await p.evaluate(() => {
        /* Livro de Reclamacoes: obrigatorio por lei, visivel no site. Um
           rodape refeito que o perca nao da erro nenhum; este teste da. */
        const a = document.getElementById('footLr');
        const lr = a && { href: a.href, txt: a.textContent.trim(),
          vis: a.getBoundingClientRect().width > 0 && getComputedStyle(a).visibility !== 'hidden' };
        const fechada = { lr, h1: document.querySelector('h1').textContent.trim(),
          lang: document.documentElement.lang,
          merch: !document.getElementById('merch').hidden,
          formatos: document.querySelectorAll('#tiers .tier').length,
          mail: document.getElementById('commCta').href.startsWith('mailto:') };
        const eraAberta = CONFIG.shopOpen;
        CONFIG.shopOpen = true; render();
        const cartoes = [...document.querySelectorAll('#merchGrid .merch-card')];
        const aberta = { merch: !document.getElementById('merch').hidden, cartoes: cartoes.length,
          /* desde o cesto (30 Set 2026) cada cartao compra: tem de ter o botao */
          loja: cartoes.every(c => c.querySelector('button.add')),
          /* um produto em hold nao esta publicado no Shopify: ia para o
             checkout um artigo que nao se pode comprar. Tem de haver um cartao
             por cada produto sem hold, nem mais nem menos. */
          quer: CONFIG.merch.filter(m => !m.hold).length,
          semHold: cartoes.every(c => !CONFIG.merch.some(m => m.hold && m.key === c.dataset.key)) };
        CONFIG.shopOpen = eraAberta; render();
        return { fechada, aberta, eraAberta };
      });
      const quer = lq ? 'pt' : 'en';
      if (r.fechada.lang !== quer) maus.push(`${lq || 'sem ?lang'}: lingua ${r.fechada.lang}`);
      if (!r.fechada.h1) maus.push(`${quer}: sem titulo`);
      if (r.fechada.formatos !== 4) maus.push(`${quer}: ${r.fechada.formatos} formatos`);
      if (!r.fechada.mail) maus.push(`${quer}: o pedido nao e um mailto`);
      if (!r.eraAberta && r.fechada.merch) maus.push(`${quer}: merch visivel com shopOpen:false`);
      if (!r.aberta.merch || r.aberta.cartoes < 1 || !r.aberta.loja) maus.push(`${quer}: merch aberto partido`);
      if (r.aberta.cartoes !== r.aberta.quer || !r.aberta.semHold) maus.push(`${quer}: ${r.aberta.cartoes} cartoes de merch, esperava ${r.aberta.quer} (os em hold nao aparecem)`);
      const lr = r.fechada.lr;
      if (!lr) lrMaus.push(`${quer}: sem #footLr`);
      else {
        if (!lr.href.startsWith('https://www.livroreclamacoes.pt/')) lrMaus.push(`${quer}: aponta para ${lr.href}`);
        if (!lr.vis) lrMaus.push(`${quer}: escondido`);
        if (lr.txt.length < 6) lrMaus.push(`${quer}: sem texto`);
        if (quer === 'pt' && !lr.txt.includes('Livro de Reclamações')) lrMaus.push(`pt: diz "${lr.txt}"`);
      }
      await p.close();
    }
    chk(lrMaus.length === 0, 'loja.html mostra o Livro de Reclamacoes no rodape, EN e PT', lrMaus.join(' '));
    /* do index para a loja, a lingua vai no link */
    const p = await nova(1280, { locale: 'en-US' });
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.getElementById('langTgl').click());
    const hrefs = await p.evaluate(() => [...document.querySelectorAll('[data-loja]')].map(a => a.getAttribute('href')));
    if (!hrefs.length || !hrefs.every(h => h.startsWith('loja.html?lang=pt'))) maus.push('index PT: links sem ?lang=pt ' + hrefs.join(' '));
    await p.close();
    chk(maus.length === 0, 'loja.html em EN e PT, fechada e aberta, e o index leva la a lingua', maus.join(' '));
  }

  /* --- o cesto: escolher, juntar, contar, o link do checkout e guardar ---
     O link e o que o Shopify recebe; um ID trocado e a t-shirt errada em
     casa de alguem. Por isso compara-se com uma AMOSTRA tirada do Shopify
     (30 Set 2026): Monk / White / M da t-shirt tem este ID e mais nenhum. */
  {
    const maus = [];
    const AMOSTRA = { valores: ['Monk', 'White', 'M'], id: '60968526905678' };
    const p = await nova(1100, { locale: 'en-US' });
    await p.goto(base + 'loja.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => { localStorage.clear(); CONFIG.shopOpen = true; cesto = []; render(); });
    const card = k => `#merchGrid .merch-card[data-key="${k}"]`;
    // 1. sem tamanho nao entra
    await p.click(`${card('tee')} button.add`);
    let r = await p.evaluate(k => ({ n: cesto.length,
      msg: document.querySelector(`${k} .card-msg`).textContent,
      inval: !!document.querySelector(`${k} select[aria-invalid="true"]`) }), card('tee'));
    if (r.n || !r.msg || !r.inval) maus.push(`sem tamanho: entrou no cesto ou sem aviso (${JSON.stringify(r)})`);
    // 2. Monk / White / M, duas vezes, e um print OC 03
    const sels = await p.$$(`${card('tee')} select`);
    for (const [i, v] of AMOSTRA.valores.entries()) await sels[i].selectOption(v);
    await p.click(`${card('tee')} button.add`);
    await p.click(`${card('tee')} button.add`);
    await p.locator(`${card('print')} select`).selectOption('OC 03');
    await p.click(`${card('print')} button.add`);
    r = await p.evaluate(() => ({ cesto: JSON.parse(JSON.stringify(cesto)),
      href: document.getElementById('pagar').getAttribute('href'),
      total: document.getElementById('total').textContent,
      linhas: document.querySelectorAll('#linhas .linha').length,
      print: CONFIG.merch.find(m => m.key === 'print').variants[2], shop: CONFIG.shop,
      precos: CONFIG.merch.filter(m => ['tee', 'print'].includes(m.key)).map(m => +m.price) }));
    if (r.cesto[0]?.id !== AMOSTRA.id) maus.push(`Monk/White/M deu ${r.cesto[0]?.id}, o Shopify diz ${AMOSTRA.id}`);
    const querHref = `${r.shop}/cart/${AMOSTRA.id}:2,${r.print}:1`;
    if (r.href !== querHref) maus.push(`checkout ${r.href}, esperava ${querHref}`);
    if (r.linhas !== 2) maus.push(`${r.linhas} linhas no cesto, esperava 2`);
    const querTotal = r.precos[0] * 2 + r.precos[1];
    if (parseInt(r.total) !== querTotal) maus.push(`total ${r.total}, esperava ${querTotal}`);
    // 3. todas as variantes vao e voltam: valores → ID → os mesmos valores
    const ida = await p.evaluate(() => Object.entries(VARIANTES)
      .filter(([id, x]) => idDe(x.m, x.valores) !== id).map(([id]) => id));
    if (ida.length) maus.push(`${ida.length} variantes nao voltam ao mesmo ID: ${ida[0]}`);
    // 4. sobrevive a um recarregar, e em PT fala portugues
    await p.reload({ waitUntil: 'networkidle' });
    r = await p.evaluate(() => { CONFIG.shopOpen = true; render();
      document.getElementById('langTgl').click();
      return { n: document.querySelectorAll('#linhas .linha').length,
        txt: document.getElementById('linhas').textContent }; });
    if (r.n !== 2) maus.push(`depois de recarregar: ${r.n} linhas`);
    if (!r.txt.includes('Branco')) maus.push('em PT a cor nao vem traduzida');
    // 5. menos, tirar, e vazio outra vez
    await p.click('#linhas .linha:nth-child(2) .menos');
    await p.click('#linhas .linha:nth-child(1) .tirar');
    r = await p.evaluate(() => ({ n: cesto.length, fim: document.getElementById('cestoFim').hidden,
      vazio: !document.getElementById('cestoVazio').hidden, href: document.getElementById('pagar').getAttribute('href') }));
    if (r.n || !r.fim || !r.vazio || r.href !== '#') maus.push(`esvaziar falhou ${JSON.stringify(r)}`);
    await p.evaluate(() => localStorage.clear());
    await p.close();
    chk(maus.length === 0, 'o cesto escolhe, soma, guarda e manda o checkout certo ao Shopify', maus.join(' '));
  }

  /* --- §9.9: em-dashes na copia VISIVEL, nao so no CONFIG ---
     O teste estatico le o CONFIG. Nao chega: ha copia que nasce no JavaScript
     e nunca passa pelo CONFIG — foi assim que um em-dash entrou no alt de uma
     serie de imagens, que um leitor de ecra le em voz alta. Aqui ve-se o que
     o browser tem mesmo: texto renderizado e atributos alt. */
  {
    const achados = [];
    for (const pag of ['index.html', 'projeto.html?p=sok', 'projeto.html?p=tr', 'loja.html', 'loja.html?lang=pt', '404.html']) {
      const p = await nova(1280);
      await p.goto(base + pag, { waitUntil: 'networkidle' });
      await p.waitForTimeout(500);
      const r = await p.evaluate(() => {
        const o = [];
        const anda = n => {
          if (n.nodeType === 3 && n.textContent.includes('\u2014')) o.push('texto: ' + n.textContent.trim().slice(0, 50));
          /* <script> e <style> sao codigo-fonte, e os comentarios do codigo
             estao isentos do §9.9. So conta o que o visitante le. */
          if (n.nodeType === 1) {
            if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.tagName === 'NOSCRIPT') return;
            if (n.alt && n.alt.includes('\u2014')) o.push('alt: ' + n.alt.slice(0, 50));
            if (n.getAttribute && n.getAttribute('aria-label') && n.getAttribute('aria-label').includes('\u2014'))
              o.push('aria-label: ' + n.getAttribute('aria-label').slice(0, 50));
            for (const f of n.childNodes) anda(f);
          }
        };
        anda(document.body);
        return [...new Set(o)];
      });
      for (const x of r) achados.push(`${pag} ${x}`);
      await p.close();
    }
    chk(achados.length === 0, '§9.9 nenhum em-dash na copia renderizada', achados.slice(0, 4).join('  '));
  }

  /* --- file:// ainda funciona --- */
  {
    const p = await nova(1280);
    await p.goto('file://' + join(ROOT, 'index.html'), { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => ({
      molduras: document.querySelectorAll('.wall .frame').length,
      h1: document.querySelector('.hero h1').textContent.trim().length }));
    await p.goto('file://' + join(ROOT, 'loja.html'), { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    const formatos = await p.evaluate(() => document.querySelectorAll('#tiers .tier').length);
    chk(r.molduras > 0 && r.h1 > 0 && formatos === 4, 'o site abre por file://, index e loja',
      `${r.molduras} molduras, ${formatos} formatos`);
    await p.close();
  }

  const jsErros = erros.filter(e => e.startsWith('JS:'));
  chk(jsErros.length === 0, 'nenhum erro de JavaScript em nenhuma pagina', jsErros.join(' '));

  await b.close();
  srv.kill();
}

/* ---------- correr ---------- */
console.log('\x1b[1mverify.mjs — Guita_Ink\x1b[0m');
estatico();
config();
await navegador(ROOT, 'com a loja como esta');

if (SHOP) {
  /* A loja fechada e o estado que vai para o ar, mas o estado aberto tem de
     ser testado antes do dia do lancamento, nao nesse dia. */
  const tmp = mkdtempSync(join(tmpdir(), 'gi-shop-'));
  for (const f of PAGINAS)
    writeFileSync(join(tmp, f), readFileSync(join(ROOT, f), 'utf8')
      .replace('  shopOpen: false,', '  shopOpen: true,'));
  execFileSync('cp', ['-r', join(ROOT, 'images'), tmp]);
  await navegador(tmp, 'com a loja ABERTA (copia temporaria)');
}

console.log(`\n${falhas ? '\x1b[31m' : '\x1b[32m'}${testes - falhas}/${testes} testes passaram\x1b[0m`);
process.exit(falhas ? 1 : 0);

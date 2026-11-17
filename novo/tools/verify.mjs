#!/usr/bin/env node
/**
 * verify.mjs — os testes do site novo, num browser a serio.
 *
 * PARA QUE SERVE
 *   A instrucao do Frede: "verifica o teu trabalho a correr testes a serio,
 *   nao a ler o diff e a assumir". Sao os mesmos testes do site atual
 *   (CLAUDE.md, seccao 10), escritos para a forma do site novo, mais um que so
 *   aqui faz sentido: o site novo tem de dizer EXATAMENTE o mesmo que o atual.
 *
 * COMO CORRER (da raiz do repositorio)
 *     node novo/tools/verify.mjs             # tudo
 *     node novo/tools/verify.mjs --rapido    # salta o CLS em linha lenta (o mais demorado)
 *     node novo/tools/verify.mjs --so 3,6    # so essas partes (1 a 7)
 *     node novo/tools/verify.mjs --pasta X   # testa outra copia do site (para os bugs plantados)
 *
 *   Sai com codigo 1 se alguma coisa falhar. Nao precisa de instalar nada.
 *
 * ARMADILHAS JA EVITADAS (as do verify.mjs do site atual)
 *   - reduced-motion mede-se pela transition-DURATION, nao pela property;
 *   - as imagens lazy tem de ser forcadas a carregar antes de se medir recortes;
 *   - um openViewer() por script conta como salto de layout: o CLS mede-se sem ele;
 *   - aberto do disco (file://) o Chromium recusa as letras da pasta fonts/ (cada
 *     ficheiro e uma "origem" diferente) e a pagina cai na letra do sistema. E
 *     assim tambem no site atual; esses avisos nao contam como erro.
 */
import { createRequire } from 'node:module';
import http from 'node:http';
import { readFileSync, existsSync, readFile } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const PASTA = resolve(arg('--pasta') || dirname(dirname(fileURLToPath(import.meta.url))));
const ATUAL = resolve(arg('--atual') || dirname(dirname(dirname(fileURLToPath(import.meta.url)))));   // o site atual, ao lado
const RAPIDO = process.argv.includes('--rapido');
const SO = arg('--so') ? arg('--so').split(',') : null;
const corre = n => !SO || SO.includes(String(n));
const TEM_ATUAL = ['index.html', 'loja.html', 'projeto.html'].every(f => existsSync(join(ATUAL, f))) && ATUAL !== PASTA;

let falhas = 0, testes = 0;
const ok = (m, d = '') => { testes++; console.log(`  \x1b[32m✓\x1b[0m ${m}${d ? '  ' + d : ''}`); };
const mau = (m, d = '') => { testes++; falhas++; console.log(`  \x1b[31m✗\x1b[0m ${m}${d ? '  ' + d : ''}`); };
const chk = (c, m, d = '') => (c ? ok(m, d) : mau(m, d));
const tit = m => console.log(`\n\x1b[1m${m}\x1b[0m`);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/* tudo o que o velho tem esta igual no novo (o novo pode ter campos a mais) */
const contem = (v, n) => (Array.isArray(v) ? Array.isArray(n) && v.length === n.length && v.every((x, i) => contem(x, n[i]))
  : v && typeof v === 'object' ? !!n && typeof n === 'object' && Object.keys(v).every(k => contem(v[k], n[k])) : v === n);
const le = f => readFileSync(join(PASTA, f), 'utf8');

/* o CONFIG e o DIMS, lidos como o browser os le */
const carrega = f => { const w = {}; new Function('window', le(f))(w); return w; };
const CONFIG = carrega('dados.js').CONFIG, DIMS = carrega('dims.js').DIMS;
const chave = src => src.split('/').pop().replace(/\.\w+$/, '');
/* as paginas (o 404 a parte). Desde 17 Nov 2026 uma por parte do site. */
const PAGINAS = ['index.html', 'trabalho.html', 'projetos.html', 'loja.html', 'comissoes.html', 'sobre.html', 'projeto.html'];
/* cada pagina com o endereco com que se abre e o caminho da barra que a marca */
const SITIO = [['index.html', ''], ['trabalho.html', 'work'], ['projetos.html', 'projects'], ['loja.html', 'shop'],
  ['comissoes.html', 'comm'], ['sobre.html', 'about'], ['projeto.html?p=sok', 'projects']];
const NAVALVO = { work: 'trabalho.html', projects: 'projetos.html', shop: 'loja.html', comm: 'comissoes.html', about: 'sobre.html', contact: 'sobre.html#contact' };
const comLingua = (u, l) => u + (u.includes('?') ? '&' : '?') + 'lang=' + l;
const CHAVES = CONFIG.projects.map(p => p.key);
const VISIVEIS = CONFIG.merch.filter(m => !m.hold && m.src);

/* a largura e a altura de um JPEG, lidas do proprio ficheiro */
function medeJpeg(f) {
  const b = readFileSync(f); let i = 2;
  while (i < b.length - 9) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    if (m === 0xFF) { i++; continue; }
    if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

/* ============================================================ 1. sem browser */
function estatico() {
  tit('1. Ficheiros e conteudo');

  for (const f of ['dados.js', 'dims.js', 'site.js']) {
    let e = null;
    try { execFileSync('node', ['--check', join(PASTA, f)], { stdio: 'pipe' }); } catch (x) { e = String(x.stderr).split('\n').slice(0, 3).join(' '); }
    chk(!e, `${f}: o JavaScript parseia`, e || '');
  }
  for (const pag of [...PAGINAS, '404.html']) {
    const s = le(pag); let e = null, n = 0;
    for (const m of s.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) { n++; try { JSON.parse(m[1]); } catch (x) { e = x.message; } }
    if (n) chk(!e, `${pag}: o JSON-LD e valido`, e || `${n} bloco`);
  }

  /* todas as imagens existem, nos tres tamanhos, e o DIMS diz a verdade */
  const fontes = new Set();
  CONFIG.artworks.forEach(a => fontes.add(a.src));
  CONFIG.projects.forEach(p => [p.src, ...(p.gallery || [])].forEach(s => fontes.add(s)));
  const faltam = [], errados = [];
  for (const src of fontes) {
    const k = chave(src), d = DIMS[k];
    for (const f of [`images/${k}.jpg`, `images/thumb/${k}.jpg`, `mini/${k}.webp`]) if (!existsSync(join(PASTA, f))) faltam.push(f);
    if (!d) { errados.push(`${k}: sem DIMS`); continue; }
    if (existsSync(join(PASTA, `images/${k}.jpg`))) {
      const g = medeJpeg(join(PASTA, `images/${k}.jpg`)), t = medeJpeg(join(PASTA, `images/thumb/${k}.jpg`));
      if (!g || g.w !== d.w || g.h !== d.h) errados.push(`${k}: ${d.w}x${d.h} no DIMS, ${g && g.w}x${g && g.h} no ficheiro`);
      if (!t || t.w !== d.tw || t.h !== d.th) errados.push(`${k} (thumb): ${d.tw}x${d.th} no DIMS, ${t && t.w}x${t && t.h} no ficheiro`);
    }
    if (!!d.f !== existsSync(join(PASTA, `images/${k}.webp`))) errados.push(`${k}: o DIMS diz f=${d.f} e o WebP ${d.f ? 'nao existe' : 'existe'}`);
    if (!!d.t !== existsSync(join(PASTA, `images/thumb/${k}.webp`))) errados.push(`${k}: o DIMS diz t=${d.t} e o WebP do thumb ${d.t ? 'nao existe' : 'existe'}`);
  }
  for (const m of VISIVEIS) if (!existsSync(join(PASTA, m.src))) faltam.push(m.src);
  for (const f of ['images/logo.svg', 'images/bg/cast-cut-1000.png', 'images/bg/cast-cut-1000.webp', 'images/bg/cast-cut-1920.webp',
    'fonts/shippori-mincho-b1-700-latin.woff2', 'fonts/zen-kaku-gothic-new-400-latin.woff2', 'fonts/zen-kaku-gothic-new-500-latin.woff2'])
    if (!existsSync(join(PASTA, f))) faltam.push(f);
  chk(!faltam.length, 'todas as imagens e letras referidas existem', faltam.length ? faltam.slice(0, 5).join(', ') : `${fontes.size} obras x 3 tamanhos`);
  chk(!errados.length, 'o dims.js bate com os pixeis reais', errados.slice(0, 3).join(' | ') || `${fontes.size} imagens`);

  /* EN e PT com as mesmas chaves, nenhuma vazia */
  const dif = [];
  (function anda(a, b, c) {
    if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) { dif.push(c); return; }
    if (Array.isArray(a)) { if (a.length !== b.length) dif.push(c + '[]'); a.forEach((x, i) => anda(x, b[i], `${c}[${i}]`)); return; }
    if (a && typeof a === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { if (!(k in a) || !(k in b)) dif.push(`${c}.${k}`); else anda(a[k], b[k], `${c}.${k}`); } return; }
    if (typeof a === 'string' && (!a.trim() || !b.trim())) dif.push(c + ' (vazia)');
  })({ ...CONFIG.i18n.en, optValues: 0 }, { ...CONFIG.i18n.pt, optValues: 0 }, 'i18n');     // optValues: o EN mostra os valores tal como sao, so o PT os traduz
  chk(!dif.length, 'paridade EN/PT em todas as chaves', dif.slice(0, 5).join(', ') || `${Object.keys(CONFIG.i18n.en).length} chaves`);
  /* cada data-t e data-ta das paginas e do site.js resolve nas duas linguas */
  const semChave = [];
  for (const f of [...PAGINAS, 'site.js']) for (const m of le(f).matchAll(/data-ta?(?:="|': ')([\w.]+)/g))
    for (const l of ['en', 'pt']) if (typeof m[1].split('.').reduce((o, p) => (o == null ? o : o[p]), CONFIG.i18n[l]) !== 'string') semChave.push(`${f}: ${m[1]} (${l})`);
  chk(!semChave.length, 'cada data-t e data-ta tem texto nas duas linguas', semChave.slice(0, 4).join(', '));

  /* as regras do Frede (CLAUDE.md, seccao 9) */
  chk(!JSON.stringify(CONFIG).includes('—'), 'nenhum travessao no CONFIG');
  const precoCom = JSON.stringify(CONFIG.tiers) + JSON.stringify([CONFIG.i18n.en.tiers, CONFIG.i18n.pt.tiers, CONFIG.i18n.en.commIntro, CONFIG.i18n.pt.commIntro, CONFIG.i18n.en.commNote, CONFIG.i18n.pt.commNote]);
  chk(!/€|\$|\d\s?%|\beur\b|\d+\s?(weeks?|semanas?|days?|dias?)\b/i.test(precoCom) && !CONFIG.tiers.some(x => 'price' in x || 'from' in x),
    'comissoes sem precos, prazos nem percentagens no CONFIG');
  const naoOriginal = CONFIG.heroArt.filter(s => { const a = CONFIG.artworks.find(x => x.src === s); const d = DIMS[chave(s)] || {}; return !a || a.cat !== 'character' || a.collab || !d.f || !d.t; });
  chk(CONFIG.heroArt.length === 6 && !naoOriginal.length, 'as seis pecas da abertura sao originais, com os dois WebP', naoOriginal.join(', '));
  const repetem = CONFIG.artworks.slice(0, CONFIG.wallPreview).filter(a => CONFIG.heroArt.includes(a.src));
  chk(!repetem.length, 'as primeiras doze da parede nao repetem as seis da abertura', repetem.map(a => a.label).join(', '));
  const fanart = new Set(CONFIG.artworks.filter(a => a.cat === 'fanart').map(a => a.src));
  chk(!CONFIG.merch.some(m => fanart.has(m.src)) && fanart.size > 0, 'nenhum produto usa fan art', `${fanart.size} obras de fan art, so para ver`);
  const mauId = [];
  for (const m of VISIVEIS) {
    const n = m.opts.reduce((x, o) => x * o.v.length, 1);
    if (!m.variants || m.variants.length !== n || new Set(m.variants).size !== n) mauId.push(`${m.key}: ${m.variants ? m.variants.length : 0} IDs para ${n} combinacoes`);
  }
  chk(!mauId.length, 'um ID do Shopify, unico, por combinacao de opcoes', mauId.join(' | ') || `${VISIVEIS.length} produtos`);

  /* o 404 e sozinho; as outras paginas nao pedem nada a outro servidor */
  const s404 = le('404.html');
  chk(!/(?:src|href)="[^"]*(?:site\.css|site\.js|dados\.js|dims\.js)/.test(s404) && /url\("\/fonts\//.test(s404), '404.html: sozinha, com as letras por caminho absoluto');
  const fora = [];
  for (const f of [...PAGINAS, '404.html', 'site.css'])
    for (const m of le(f).matchAll(/(?:src|href|url\()\s*=?\s*["'(]+(https?:\/\/[^"') ]+)/g))
      if (!/^https:\/\/guitaink\.com\//.test(m[1])) fora.push(`${f}: ${m[1]}`);
  chk(!fora.length, 'nenhuma pagina carrega ficheiros de outro servidor', fora.slice(0, 3).join(', '));
  for (const f of ['robots.txt', 'sitemap.xml']) chk(existsSync(join(PASTA, f)), `${f} existe`);
  const urls = [...le('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const seis = ['', 'trabalho.html', 'projetos.html', 'loja.html', 'comissoes.html', 'sobre.html'];
  chk(urls.length === seis.length + CHAVES.length && seis.every(p => urls.includes('https://guitaink.com/' + p)) && CHAVES.every(k => urls.some(u => u.endsWith('projeto.html?p=' + k))),
    'sitemap: as seis paginas e uma por projeto', `${urls.length} enderecos`);
}

/* ============================================================ o servidor */
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'text/xml', '.txt': 'text/plain' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]), raiz = PASTA;
  if (p.startsWith('/__atual__/')) { raiz = ATUAL; p = p.slice(10); }
  if (p.endsWith('/')) p += 'index.html';
  readFile(join(raiz, p), (e, d) => {
    if (!e) { r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); return; }
    /* como o Netlify: um endereco que nao existe recebe o 404.html */
    readFile(join(PASTA, '404.html'), (e2, d2) => { r.writeHead(404, { 'content-type': TIPOS['.html'] }); r.end(e2 ? '404' : d2); });
  });
});
let base = '', browser = null;

async function pagina(url, o = {}) {
  const ctx = await browser.newContext({ viewport: o.vp || { width: 1440, height: 900 }, hasTouch: !!o.toque, isMobile: !!o.toque,
    reducedMotion: o.reduz ? 'reduce' : 'no-preference', colorScheme: o.esquema || 'dark' });
  const pg = await ctx.newPage();
  pg.erros = []; pg.pedidos = [];
  pg.on('console', m => { if (m.type() === 'error') pg.erros.push(m.text()); });
  pg.on('pageerror', e => pg.erros.push(e.message));
  pg.on('request', q => pg.pedidos.push(q.url()));
  await pg.goto(/^file:/.test(url) ? url : base + url, { waitUntil: 'networkidle' });
  pg.fecha = () => ctx.close();
  return pg;
}
const espera = (pg, ms) => pg.waitForTimeout(ms);
/* espera que um scroll suave acabe (a pagina e comprida: o tempo varia) */
const assenta = async pg => { let y = -1; for (let i = 0; i < 40; i++) { const n = await pg.evaluate(() => Math.round(scrollY)); if (n === y) return; y = n; await pg.waitForTimeout(160); } };
const vaiA = async (pg, s) => { await pg.evaluate(x => document.querySelector(x).scrollIntoView({ block: 'start', behavior: 'instant' }), s); await espera(pg, 450); };
const palco = pg => pg.evaluate(() => { const c = GI.palco(); return c ? { k: c.p ? c.p.k : null, kind: c.kind || 'obra', cap: document.querySelector('#stageCap').textContent, n: document.querySelector('#stageN').textContent } : null; });
/* forca as imagens lazy: sem isto reportam naturalWidth 0 e os testes de recorte passam por engano */
const carregaTudo = pg => pg.evaluate(async () => {
  const imgs = [...document.images];
  imgs.forEach(i => { i.loading = 'eager'; });
  await Promise.all(imgs.map(i => (i.complete ? 0 : new Promise(f => { i.addEventListener('load', f); i.addEventListener('error', f); setTimeout(f, 9000); }))));
});
/* uma imagem so passa se couber inteira: ou tem a proporcao da caixa, ou e contain */
const recortes = pg => pg.evaluate(() => {
  const vis = [...document.images].filter(i => i.getClientRects().length);
  const partidas = vis.filter(i => !i.naturalWidth).map(i => i.getAttribute('src'));
  const maus = vis.filter(i => i.naturalWidth).map(i => {
    const r = i.getBoundingClientRect(), nat = i.naturalWidth / i.naturalHeight;
    return { f: (i.currentSrc || '').split('/').pop(), fit: getComputedStyle(i).objectFit, d: Math.abs(nat - r.width / r.height) / nat };
  }).filter(x => x.fit !== 'contain' && x.d > 0.02).map(x => `${x.f} (${x.fit})`);
  return { n: vis.length, partidas, maus };
});
/* o texto que o browser mostra ou le em voz alta, sem <script> nem <style> */
const textoTodo = pg => pg.evaluate(() => {
  const t = [];
  const w = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement.closest('script,style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  while (w.nextNode()) t.push(w.currentNode.textContent);
  document.querySelectorAll('[alt],[aria-label],[title],[content]').forEach(e => ['alt', 'aria-label', 'title', 'content'].forEach(a => { if (e.hasAttribute(a)) t.push(e.getAttribute(a)); }));
  return t.join('\n');
});
const cls = async (url, vp, lenta) => {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 700, isMobile: vp.width < 700 });
  const pg = await ctx.newPage();
  if (lenta) {
    const cdp = await ctx.newCDPSession(pg);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 400 * 1024 / 8, uploadThroughput: 400 * 1024 / 8 });
  }
  await pg.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await pg.goto(base + url, { waitUntil: 'load', timeout: 240000 });
  await pg.waitForTimeout(lenta ? 2500 : 900);
  const v = await pg.evaluate(() => window.__cls);
  await ctx.close();
  return v;
};

/* ============================================================ 2. a mesma informacao */
async function mesmaInformacao() {
  tit('2. O site novo diz o mesmo que o site atual');
  if (!TEM_ATUAL) { console.log('  (o site atual nao esta ao lado desta pasta: teste saltado)'); return; }
  const velho = {};
  for (const [nome, url] of [['index', 'index.html'], ['loja', 'loja.html'], ['projeto', 'projeto.html?p=' + CHAVES[0]]]) {
    const pg = await pagina('__atual__/' + url);
    velho[nome] = await pg.evaluate(() => JSON.parse(JSON.stringify(CONFIG)));
    await pg.fecha();
  }
  const dif = []; let n = 0;
  for (const [nome, c] of Object.entries(velho)) {
    for (const k of Object.keys(c)) {
      if (k === 'i18n' || k === 'projectPage' || k === 'imageBase') continue;      // os dois ultimos dizem onde estao os ficheiros, nao sao conteudo
      n++; if (!contem(c[k], CONFIG[k])) dif.push(`${nome}.${k}`);
    }
    for (const l of ['en', 'pt']) for (const k of Object.keys(c.i18n[l])) { n++; if (!contem(c.i18n[l][k], CONFIG.i18n[l][k])) dif.push(`${nome}.i18n.${l}.${k}`); }
  }
  chk(!dif.length, 'cada campo e cada texto do site atual esta igual no dados.js', dif.slice(0, 6).join(', ') || `${n} campos comparados, nas tres paginas e nas duas linguas`);
  chk(igual(velho.index.artworks.map(a => a.src), CONFIG.artworks.map(a => a.src)), 'as mesmas obras, pela mesma ordem', `${CONFIG.artworks.length}`);
  /* e o que aparece escrito: cada texto do site atual tem de se ler algures no novo */
  for (const l of ['en', 'pt']) {
    const novo = (await Promise.all([...PAGINAS.filter(p => p !== 'projeto.html'), ...CHAVES.map(k => 'projeto.html?p=' + k)].map(async u => {
      const pg = await pagina(u + (u.includes('?') ? '&' : '?') + 'lang=' + l);
      const t = await textoTodo(pg); await pg.fecha(); return t;
    }))).join('\n').replace(/\s+/g, ' ');
    const T = CONFIG.i18n[l], espero = [];
    ['heroRole', 'galleryTitle', 'projectsTitle', 'tlTitle', 'aboutTitle', 'aboutMeta', 'commTitle', 'commIntro', 'commSee', 'commNote', 'commCta', 'contactTitle', 'contactBody',
      'footerNote', 'shopTitle', 'shopIntro', 'shopAll', 'bagTitle', 'bagEmpty', 'footComplaints', 'questions', 'navWork', 'navProjects', 'navAbout', 'navComm', 'navContact', 'navShop'].forEach(k => espero.push(T[k]));
    T.aboutBody.forEach(p => espero.push(p));
    CONFIG.artworks.forEach(a => espero.push(a.label));
    CONFIG.projects.forEach(p => { const t = T.projects[p.key]; espero.push(t.kicker, t.title, t.desc); if (p.link) espero.push(t.link); });
    CONFIG.timeline.forEach(e => { const t = T.timeline[e.key]; espero.push(t.title, t.where, t.desc, String(e.year)); });
    CONFIG.tiers.forEach(x => espero.push(T.tiers[x.key].name, T.tiers[x.key].desc));
    VISIVEIS.forEach(m => espero.push(T.merchItems[m.key].name, T.merchItems[m.key].desc, m.price));
    Object.values(T.filters).slice(0, 1).forEach(v => espero.push(v));
    espero.push(CONFIG.email, CONFIG.realName, CONFIG.artistName, CONFIG.shopDrop);
    const falta = espero.filter(s => !novo.includes(String(s).replace(/\s+/g, ' ')));
    chk(!falta.length, `${l.toUpperCase()}: tudo o que o site atual diz le-se no site novo`, falta.slice(0, 4).join(' | ') || `${espero.length} textos`);
  }
}

/* ============================================================ 3. as paginas */
async function inicial() {
  tit('3. As paginas: o inicio, o trabalho, os projetos, o sobre');

  /* em todas as paginas, nas duas linguas */
  const TIT = { 'trabalho.html': 'galleryTitle', 'projetos.html': 'projectsTitle', 'loja.html': 'shopTitle', 'comissoes.html': 'commTitle', 'sobre.html': 'aboutTitle' };
  for (const l of ['en', 'pt']) {
    const erros = [], fora = [], travessoes = [], setas = [], linguas = [], titulos = [], barras = [];
    for (const [url, caminho] of SITIO) {
      const pg = await pagina(comLingua(url, l));
      pg.erros.forEach(e => erros.push(`${url}: ${e}`));
      pg.pedidos.filter(u => !u.startsWith(base) && !u.startsWith('data:')).forEach(u => fora.push(`${url}: ${u}`));
      if ((await textoTodo(pg)).includes('—')) travessoes.push(url);
      const r = await pg.evaluate(() => {
        const maus = [];
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (w.nextNode()) { const n = w.currentNode; if (/[→↗←]/.test(n.textContent) && !n.parentElement.closest('[aria-hidden="true"],script') && n.parentElement.id !== 'vHint') maus.push(n.textContent.trim()); }
        document.querySelectorAll('[aria-label]').forEach(e => { if (/[→↗←]/.test(e.getAttribute('aria-label'))) maus.push(e.getAttribute('aria-label')); });
        const b = document.querySelector('#lang');
        return { setas: maus, lang: document.documentElement.lang, botao: [b.textContent, b.getAttribute('aria-label')], titulo: document.title, h1: document.querySelectorAll('h1').length,
          nav: [...document.querySelectorAll('#nav a')].map(a => [a.dataset.nav, a.getAttribute('href'), a.getAttribute('aria-current')]) };
      });
      r.setas.forEach(x => setas.push(`${url}: ${x}`));
      if (r.lang !== l || !r.botao[1].startsWith(r.botao[0])) linguas.push(url);
      const meu = url.split('?')[0];
      const esperado = TIT[meu] ? `${CONFIG.i18n[l][TIT[meu]]} · ${CONFIG.artistName}`
        : meu === 'projeto.html' ? `${CONFIG.i18n[l].projects[CHAVES[0]].title} · ${CONFIG.artistName}` : 'Guita_Ink · Illustration Portfolio';
      if (r.titulo !== esperado) titulos.push(`${url}: "${r.titulo}"`);
      if (r.nav.length !== 6 || r.h1 !== 1) barras.push(`${url}: ${r.nav.length} caminhos, ${r.h1} h1`);
      for (const [id, href, cur] of r.nav) {
        const [f, a] = NAVALVO[id].split('#');
        const alvo = f === meu ? '#' + (a || 'main') : `${f}?lang=${l}${a ? '#' + a : ''}`;
        if (href !== alvo) barras.push(`${url} ${id}: ${href}`);
        if ((cur === 'true') !== (id === caminho)) barras.push(`${url}: ${id} ${cur === 'true' ? 'marcado' : 'por marcar'}`);
      }
      await pg.fecha();
    }
    chk(!erros.length, `${l}: sem erros na consola em nenhuma pagina`, erros.slice(0, 2).join(' | ') || `${SITIO.length} paginas`);
    chk(!fora.length, `${l}: nenhuma pagina faz um pedido a outro servidor`, fora.slice(0, 2).join(', '));
    chk(!travessoes.length, `${l}: nenhum travessao no que se le ou ouve`, travessoes.join(', '));
    chk(!setas.length, `${l}: nenhuma seta lida em voz alta`, setas.slice(0, 3).join(' | '));
    chk(!linguas.length, `${l}: <html lang="${l}"> em todas, e o botao da lingua diz as letras que mostra`, linguas.join(', '));
    chk(!titulos.length, `${l}: cada separador com o titulo da sua pagina, na lingua escolhida`, titulos.slice(0, 3).join(' | '));
    chk(!barras.length, `${l}: em cada pagina a barra leva as seis paginas, com a lingua, e marca a sua`, barras.slice(0, 4).join(' | '));
  }

  /* o inicio: o nome, o que faz, as seis; e curto */
  for (const l of ['en', 'pt']) {
    const pg = await pagina('index.html?lang=' + l);
    const nome = await pg.evaluate(() => { const h = document.querySelector('#heroName'), tops = new Set();
      const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const r = document.createRange(); r.selectNodeContents(w.currentNode); [...r.getClientRects()].forEach(x => tops.add(Math.round(x.top))); }
      return { falado: h.getAttribute('aria-label'), linhas: tops.size, cabe: h.scrollWidth <= h.clientWidth + 1 }; });
    chk(nome.falado === CONFIG.realName && nome.linhas === 2 && nome.cabe, `${l}: o nome e "${CONFIG.realName}", em duas linhas`, `${nome.linhas} linhas`);
    chk((await pg.textContent('.role')) === CONFIG.i18n[l].heroRole, `${l}: por baixo, o que ele faz`);
    const r = await pg.evaluate(() => ({ alto: document.documentElement.scrollHeight / innerHeight, secs: [...document.querySelectorAll('main > section')].map(s => s.id),
      bot: [...document.querySelectorAll('.intro .cta a')].map(a => a.getAttribute('href')), menu: document.querySelectorAll('.foot-menu a').length }));
    chk(igual(r.secs, ['intro']) && r.alto <= 2 && r.menu === 6, `${l}: o inicio e curto: a abertura, e o rodape com as seis paginas`, `${r.alto.toFixed(1)} ecras`);
    chk(igual(r.bot, [`trabalho.html?lang=${l}`, `comissoes.html?lang=${l}`]), `${l}: os dois botoes da abertura levam ao trabalho e as comissoes`, r.bot.join(', '));
    await pg.fecha();
  }

  /* os enderecos antigos (de quando isto era uma pagina so) levam a pagina nova */
  const antigos = [['index.html?lang=pt#work', 'trabalho.html', ''], ['index.html#projects', 'projetos.html', ''], ['index.html#shop', 'loja.html', ''],
    ['index.html#comm', 'comissoes.html', ''], ['index.html#about', 'sobre.html', ''], ['index.html#timeline', 'sobre.html', '#timeline'],
    ['index.html#contact', 'sobre.html', '#contact'], ['loja.html?lang=en#comissoes', 'comissoes.html', '']];
  const mausA = [];
  for (const [de, para, ancora] of antigos) {
    const ctx = await browser.newContext();
    const pg = await ctx.newPage();
    try { await pg.goto(base + de, { waitUntil: 'networkidle' }); } catch (e) {}
    await pg.waitForLoadState('networkidle').catch(() => {}); await espera(pg, 150);
    const u = new URL(pg.url()), q = (de.match(/\?[^#]*/) || [''])[0];
    if (!u.pathname.endsWith('/' + para) || u.hash !== ancora || u.search !== q) mausA.push(`${de} → ${u.pathname.split('/').pop()}${u.search}${u.hash}`);
    await ctx.close();
  }
  chk(!mausA.length, 'os enderecos antigos (index.html#work, loja.html#comissoes...) levam a pagina nova, com a lingua', mausA.join(' | ') || `${antigos.length} enderecos`);

  /* o Flip e o palco, com rato */
  const pg = await pagina('index.html?lang=en');
  const seis = await pg.evaluate(() => [...document.querySelectorAll('#flip .fr')].map(b => ({ k: b._it.p.k, p: b.getAttribute('aria-pressed'), tab: b.tabIndex })));
  const p0 = await palco(pg);
  chk(seis.length === 6 && seis.filter(x => x.p === 'true').length === 1 && seis.find(x => x.p === 'true').k === p0.k && /^\d \/ 6$/.test(p0.n),
    'Flip: seis molduras, uma escolhida, e e a peca do palco', `${p0.cap}, ${p0.n}`);
  chk(seis.filter(x => x.tab === 0).length === 1, 'Flip: as seis sao uma so paragem do Tab');
  const troca = [];
  for (let i = 0; i < 6; i++) {
    const cx = await pg.locator('#flip .fr').nth(i).boundingBox();
    await pg.mouse.move(cx.x + cx.width / 2, cx.y + cx.height / 2); await espera(pg, 260);
    const a = await palco(pg);
    if (a.k !== seis[i].k || a.n !== `${i + 1} / 6`) troca.push(`${i + 1}: nao trocou`);
    /* da moldura ate a peca grande, a velocidade de uma mao: passa por cima das outras molduras */
    const st = await pg.locator('#stageArt').boundingBox();
    const [x1, y1] = [st.x + st.width / 2, st.y + st.height / 2];
    for (let s = 1; s <= 20; s++) { await pg.mouse.move(cx.x + cx.width / 2 + (x1 - cx.x - cx.width / 2) * s / 20, cx.y + cx.height / 2 + (y1 - cx.y - cx.height / 2) * s / 20); await espera(pg, 20); }
    await espera(pg, 260);
    const d = await palco(pg);
    if (d.k !== seis[i].k) troca.push(`${i + 1}: a caminho do palco passou a ${d.cap}`);
  }
  chk(!troca.length, 'Flip: pousar numa moldura troca a peca, e o caminho ate ela nao a troca', troca.join(' | '));
  await pg.mouse.move(5, 300);
  await pg.focus('.intro .btn.line'); await pg.keyboard.press('Tab'); await espera(pg, 120);
  await pg.keyboard.press('Home'); await espera(pg, 120);
  const t1 = await palco(pg); await pg.keyboard.press('ArrowRight'); await espera(pg, 120); const t2 = await palco(pg);
  chk(t1.k === seis[0].k && t2.k === seis[1].k && (await pg.evaluate(() => document.activeElement.classList.contains('fr'))), 'Flip: com o teclado, Home vai a primeira e a seta passa a seguinte', `${t1.cap}, depois ${t2.cap}`);
  await carregaTudo(pg); let rc = await recortes(pg);
  chk(!rc.maus.length && !rc.partidas.length, 'inicio: nenhuma imagem cortada ou em falta', [...rc.maus, ...rc.partidas].slice(0, 4).join(', ') || `${rc.n} imagens a vista`);
  await pg.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await espera(pg, 700);
  chk((await palco(pg)).kind === 'seal', 'inicio: no fundo, o palco mostra o selo');
  const ldP = await pg.evaluate(() => [document.querySelector('#ldPerson').textContent, !!document.querySelector('#ldGallery')]);
  const pessoa = JSON.parse(ldP[0]);
  chk(pessoa.makesOffer.length === CONFIG.tiers.length && !/price/i.test(ldP[0]) && !ldP[1], 'JSON-LD do inicio: a pessoa e os quatro formatos, sem preco');
  await pg.fecha();

  /* a peca inteira no primeiro ecra */
  for (const vp of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1060, height: 700 }]) {
    const q = await pagina('index.html?lang=pt', { vp });
    const r = await q.evaluate(() => { const a = document.querySelector('#stageArt').getBoundingClientRect(), i = document.querySelector('#stageArt img.on');
      return { dentro: a.top >= 60 && a.bottom <= innerHeight && a.right <= innerWidth && a.height > innerHeight * 0.6, fit: i && getComputedStyle(i).objectFit, ok: i && i.naturalWidth > 0 }; });
    chk(r.dentro && r.fit === 'contain' && r.ok, `${vp.width}x${vp.height}: a peca esta inteira no primeiro ecra`);
    await q.fecha();
  }

  /* ---------- o trabalho: a parede ---------- */
  const pt = await pagina('trabalho.html?lang=en');
  let s = await palco(pt);
  chk(s.k === chave(CONFIG.artworks[0].src), 'trabalho: o palco abre com a primeira obra da parede', s.cap);
  const visiveis = () => pt.evaluate(() => [...document.querySelectorAll('#wall .fr')].filter(b => b.getClientRects().length).length);
  chk((await visiveis()) === CONFIG.artworks.length, 'trabalho: a parede mostra todas as obras', `${CONFIG.artworks.length}`);
  const cats = [...new Set(CONFIG.artworks.map(a => a.cat))]; if (CONFIG.artworks.some(a => a.collab)) cats.push('collab');
  const mausF = [];
  for (const f of cats) {
    await pt.click(`#filters .chip[data-f="${f}"]`); await espera(pt, 80);
    const n = CONFIG.artworks.filter(a => (f === 'collab' ? a.collab : a.cat === f)).length;
    if ((await visiveis()) !== n || (await pt.textContent('#count')) !== `${n} / ${CONFIG.artworks.length}`) mausF.push(f);
  }
  await pt.click('#filters .chip[data-f="all"]');
  chk(!mausF.length, 'trabalho: cada filtro mostra as obras da sua categoria', mausF.join(', ') || cats.join(', '));
  const m6 = pt.locator('#wall .fr').nth(6);
  await m6.hover(); await espera(pt, 260); await m6.click(); await espera(pt, 300);
  const v1 = await pt.evaluate(() => ({ aberto: document.querySelector('#viewer').open, t: document.querySelector('#vTitle').textContent, n: document.querySelector('#vN').textContent,
    dica: document.querySelector('#vHint').textContent, fit: getComputedStyle(document.querySelector('#vPic img')).objectFit }));
  chk(v1.aberto && v1.t === CONFIG.artworks[6].label && v1.n === `007 / 0${CONFIG.artworks.length}` && v1.fit === 'contain' && v1.dica === CONFIG.i18n.en.lightboxHint,
    'trabalho: clicar na moldura escolhida abre o visualizador, com o titulo e o numero', `${v1.t}, ${v1.n}`);
  await pt.keyboard.press('ArrowRight'); await espera(pt, 150);
  const v2 = await pt.evaluate(() => [document.querySelector('#vTitle').textContent, document.querySelector('#vLive').textContent]);
  chk(v2[0] === CONFIG.artworks[7].label && v2[1].includes(v2[0]) && v2[1].includes('8'), 'as setas do teclado passam a peca seguinte, e quem ouve e avisado', v2[1]);
  await pt.keyboard.press('Escape'); await espera(pt, 300);
  const v3 = await pt.evaluate(() => ({ aberto: document.querySelector('#viewer').open, foco: document.activeElement === document.querySelectorAll('#wall .fr')[7], k: GI.palco().p.k }));
  chk(!v3.aberto && v3.foco && v3.k === chave(CONFIG.artworks[7].src), 'Esc fecha, e o foco e o palco ficam na peca onde se parou');

  /* rolar a pagina com o rato parado por cima da parede: as molduras passam por baixo dele e o palco nao vai atras */
  await vaiA(pt, '#work');
  const r0 = pt.locator('#wall .fr').nth(0); await r0.hover(); await espera(pt, 260);
  const antesRoda = await palco(pt);
  await pt.mouse.wheel(0, 260); await espera(pt, 700);
  const sob = await pt.evaluate(() => { const e = document.querySelector('#wall .fr:hover'); return e ? e._it.p.k : null; });
  const depoisRoda = await palco(pt);
  chk(antesRoda.k === depoisRoda.k && sob && sob !== antesRoda.k, 'rolar a pagina com o rato parado nao troca a peca do palco', `ficou ${depoisRoda.cap}`);

  /* a barra esta colada ao cimo: foca-la nao pode mexer a pagina, e o que se foca nao pode ficar debaixo dela */
  await pt.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' })); await espera(pt, 300);
  const f1 = await pt.evaluate(async () => { const y0 = scrollY; document.querySelector('#theme').focus(); await new Promise(r => setTimeout(r, 600));
    document.querySelector('#nav a').focus(); await new Promise(r => setTimeout(r, 600)); return [y0, scrollY]; });
  chk(f1[0] === f1[1] && f1[0] > 0, 'focar um botao da barra nao puxa a pagina para cima', `${f1[0]} → ${f1[1]}`);
  const f2 = await pt.evaluate(async () => { const b = document.querySelectorAll('#wall .fr'); const r = [];
    for (const i of [b.length - 1, 0, 20]) { b[i].focus(); await new Promise(x => setTimeout(x, 900)); const q = b[i].getBoundingClientRect(); r.push(q.top >= 60 && q.bottom <= innerHeight); } return r; });
  chk(f2.every(Boolean), 'uma moldura focada fica inteira a vista, nunca debaixo da barra');

  /* trocar de lingua sem perder o sitio */
  await vaiA(pt, '#work'); await pt.mouse.move(5, 5); await pt.locator('#wall .fr').nth(3).hover(); await espera(pt, 260);
  const antes = await palco(pt); await pt.click('#lang'); await espera(pt, 300); const depois = await palco(pt);
  const ling = await pt.evaluate(() => [document.documentElement.lang, location.search, document.querySelector('#workT').textContent, document.title]);
  chk(ling[0] === 'pt' && ling[1].includes('lang=pt') && ling[2] === CONFIG.i18n.pt.galleryTitle && ling[3].startsWith(CONFIG.i18n.pt.galleryTitle) && antes.k === depois.k,
    'o botao da lingua troca os textos e o titulo, e deixa no palco a mesma peca', ling[2]);
  const semLingua = await pt.evaluate(() => [...document.querySelectorAll('a[href*=".html"]')].map(a => a.getAttribute('href')).filter(h => !/^https?:/.test(h) && !h.includes('lang=pt')));
  chk(!semLingua.length, 'os links para as outras paginas levam a lingua escolhida', semLingua.slice(0, 3).join(', '));
  await carregaTudo(pt); rc = await recortes(pt);
  chk(!rc.maus.length && !rc.partidas.length, 'trabalho: nenhuma imagem cortada ou em falta', [...rc.maus, ...rc.partidas].slice(0, 4).join(', ') || `${rc.n} imagens a vista`);
  const ldG = await pt.evaluate(() => [(document.querySelector('#ldGallery') || {}).textContent || '', !!document.querySelector('#ldPerson')]);
  const galeria = JSON.parse(ldG[0] || '{}');
  chk((galeria.associatedMedia || []).length === CONFIG.artworks.length && !/offer|price/i.test(ldG[0]) && !ldG[1], 'JSON-LD do trabalho: a galeria toda, sem nenhuma oferta (a fan art nao se vende)');
  chk(!/addressLocality|addressCountry|"address"|"location"/i.test(ldP[0] + ldG[0]), 'JSON-LD: sem cidade nem pais');
  await pt.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await espera(pt, 700);
  chk((await palco(pt)).kind === 'seal', 'trabalho: no fundo, o palco mostra o selo');
  await pt.fecha();

  /* ---------- os projetos ---------- */
  const pp = await pagina('projetos.html?lang=en');
  const pr = await pp.evaluate(() => [...document.querySelectorAll('#projs .proj')].map(a => ({ id: a.id, feat: a.classList.contains('feat'), nome: a.querySelector('.proj-cover').getAttribute('aria-label'),
    n: a.querySelectorAll('.strip .fr').length, links: [...a.querySelectorAll('.links a')].map(x => x.getAttribute('href')) })));
  const mausP = [];
  if (pr.length !== CONFIG.projects.length || pr[0].id !== 'p-' + CONFIG.featured || !pr[0].feat) mausP.push('ordem');
  for (const p of CONFIG.projects) {
    const c = pr.find(x => x.id === 'p-' + p.key); if (!c) { mausP.push(p.key); continue; }
    const n = p.rows ? p.gallery.length : 1 + (p.gallery || []).length;
    if (c.n !== n || c.nome !== CONFIG.i18n.en.projects[p.key].title || !c.links[0].includes(`projeto.html?p=${p.key}`) || (p.link ? c.links[1] !== p.link : c.links.length !== 1)) mausP.push(p.key);
  }
  chk(!mausP.length, 'projetos: um bloco por projeto, o destacado primeiro, cada um com a sua serie e as suas ligacoes', mausP.join(', ') || pr.map(x => x.n).join(' + ') + ' pecas');
  const capa = await palco(pp);
  chk(capa.k === chave(CONFIG.projects.find(p => p.key === CONFIG.featured).src), 'projetos: o palco abre com a capa do projeto destacado', capa.cap);
  await pp.fecha();

  /* ---------- o sobre: a carta, o percurso, o contacto ---------- */
  const ps = await pagina('sobre.html?lang=en');
  const a0 = await palco(ps);
  chk(CONFIG.heroArt.map(chave).includes(a0.k), 'sobre: no palco, uma das seis pecas da abertura', a0.cap);
  await ps.click('#stageArt'); await espera(ps, 300);
  const va = await ps.evaluate(() => [document.querySelector('#viewer').open, document.querySelector('#vTitle').textContent]);
  await ps.keyboard.press('Escape'); await espera(ps, 200);
  chk(va[0] && va[1] === a0.cap, 'sobre: clicar na peca do palco abre-a grande', va[1]);
  await ps.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await espera(ps, 700);
  const fimS = await ps.evaluate(() => [(document.querySelector('#nav a[aria-current="true"]') || { dataset: {} }).dataset.nav, GI.palco().kind]);
  chk(fimS[0] === 'contact' && fimS[1] === 'seal', 'sobre: ao chegar ao contacto, a barra marca Contacto e o palco mostra o selo', fimS.join(', '));
  await ps.fecha();
}

/* ============================================================ 4. os outros ecras */
async function ecras() {
  tit('4. Telemovel, tablet e larguras');
  const P = { width: 390, height: 844 };
  for (const l of ['en', 'pt']) {
    const pg = await pagina('index.html?lang=' + l, { vp: P, toque: true });
    const h = await pg.evaluate(() => { const f = document.querySelector('#heroM').getBoundingClientRect(), i = document.querySelector('#heroM img');
      return { dentro: f.top >= 60 && f.bottom <= innerHeight, fit: getComputedStyle(i).objectFit, palco: getComputedStyle(document.querySelector('#stage')).display }; });
    chk(h.dentro && h.fit === 'contain' && h.palco === 'none', `${l}, 390x844: sem palco, e a peca da abertura inteira no primeiro ecra`);
    await pg.locator('#flip .fr').nth(2).tap(); await espera(pg, 200);
    const cap = await pg.textContent('#heroCap');
    chk(cap.includes(CONFIG.artworks.find(a => a.src === CONFIG.heroArt[2]).label) && cap.includes('3 / 6'), `${l}: tocar numa moldura troca a peca e a legenda`, cap);
    await pg.fecha();

    const pt = await pagina('trabalho.html?lang=' + l, { vp: P, toque: true });
    const vis = () => pt.evaluate(() => [...document.querySelectorAll('#wall .fr')].filter(b => b.getClientRects().length).length);
    const n0 = await vis(), botao = await pt.textContent('#more');
    await pt.tap('#more'); await espera(pt, 150);
    chk(n0 === CONFIG.wallPreview && botao === CONFIG.i18n[l].wallMore.replace('{n}', CONFIG.artworks.length) && (await vis()) === CONFIG.artworks.length,
      `${l}: a parede abre com ${CONFIG.wallPreview} e o botao mostra as ${CONFIG.artworks.length}`, botao);
    await pt.fecha();

    /* cartoes de projeto compactos, menos o destacado */
    const pp = await pagina('projetos.html?lang=' + l, { vp: P, toque: true });
    const cart = await pp.evaluate(() => [...document.querySelectorAll('#projs .proj')].map(a => ({ feat: a.classList.contains('feat'), desc: !!a.querySelector('.proj-desc').getClientRects().length,
      capa: a.querySelector('.proj-cover').getBoundingClientRect().width / a.getBoundingClientRect().width })));
    chk(cart.every(c => (c.feat ? c.desc : !c.desc && c.capa < 0.5)), `${l}: no telemovel so o projeto destacado vai por extenso`);
    await pp.fecha();

    /* alvos de toque e recortes, em todas as paginas */
    const pequenos = [], cortes = [];
    for (const [url] of SITIO) {
      const q = await pagina(comLingua(url, l), { vp: P, toque: true });
      const m = await q.evaluate(() => [...document.querySelectorAll('a,button,input')].filter(e => e.getClientRects().length && !e.closest('.skip, h1, h2, h3, p:not(.links):not(.foot-links)'))
        .map(e => { const a = e.matches('input') ? e.closest('label') : e, r = a.getBoundingClientRect(); return { n: (a.textContent || a.getAttribute('aria-label') || a.className).trim().slice(0, 24), w: r.width, h: r.height }; })
        .filter(x => x.w < 43.5 || x.h < 43.5).map(x => `${x.n} ${Math.round(x.w)}x${Math.round(x.h)}`));
      m.forEach(x => pequenos.push(`${url.split('?')[0]}: ${x}`));
      await carregaTudo(q); const rc = await recortes(q);
      [...rc.maus, ...rc.partidas].forEach(x => cortes.push(`${url.split('?')[0]}: ${x}`));
      await q.fecha();
    }
    chk(!pequenos.length, `${l}: todos os botoes e links tem pelo menos 44px, em todas as paginas`, pequenos.slice(0, 4).join(' | '));
    chk(!cortes.length, `${l}: nenhuma imagem cortada ou em falta no telemovel`, cortes.slice(0, 3).join(', ') || `${SITIO.length} paginas`);
  }
  /* o menu e o visualizador no telemovel */
  for (const w of [390, 320]) {
    const pg = await pagina('index.html?lang=en', { vp: { width: w, height: 700 }, toque: true });
    await pg.tap('#menuBtn'); await espera(pg, 400);
    const menu = await pg.evaluate(() => ({ aberto: document.querySelector('#menuBtn').getAttribute('aria-expanded'), n: [...document.querySelectorAll('#nav a')].filter(a => a.getClientRects().length).length }));
    await Promise.all([pg.waitForURL(/sobre\.html/), pg.tap('#nav a[data-nav="about"]')]); await pg.waitForLoadState('networkidle');
    const u = new URL(pg.url());
    chk(menu.aberto === 'true' && menu.n === 6 && u.pathname.endsWith('/sobre.html') && u.search === '?lang=en', `${w}px: o menu abre com os seis caminhos, e escolher um leva a essa pagina`);
    await pg.goto(base + 'trabalho.html?lang=en', { waitUntil: 'networkidle' });
    await pg.locator('#wall .fr').nth(1).tap(); await espera(pg, 350);
    const v = await pg.evaluate(() => { const im = document.querySelector('#vPic').getBoundingClientRect();
      const por = [...document.querySelectorAll('#viewer button')].filter(b => b.getClientRects().length).filter(b => { const r = b.getBoundingClientRect(); return r.bottom > im.top + 1 && r.top < im.bottom - 1; }).length;
      return { aberto: document.querySelector('#viewer').open, por, dica: document.querySelector('#vHint').textContent, setas: [...document.querySelectorAll('.v-touch button')].filter(b => b.getClientRects().length).length }; });
    chk(v.aberto && v.por === 0 && v.setas === 2 && v.dica === CONFIG.i18n.en.lightboxHintTouch, `${w}px: no visualizador nenhum botao fica por cima da obra, e a dica e a do gesto`, v.dica);
    await pg.fecha();
  }

  /* nada sai do ecra, de 320 a 1600px, nas duas linguas, em todas as paginas */
  const sai = [];
  const larguras = [...SITIO.map(([u]) => [u, u === 'loja.html' ? 'cesto' : null]), ['projeto.html?p=deck', null], ['projeto.html?p=tr', null]];
  for (const [url, prep] of larguras) {
    for (const l of ['en', 'pt']) {
      const pg = await pagina(comLingua(url, l), { vp: { width: 1600, height: 900 } });
      if (prep === 'cesto') {       // a loja mede-se com o cesto cheio: foi assim que um botao mais largo em PT empurrou a pagina
        await pg.evaluate(ids => { localStorage.setItem('gi-cesto', JSON.stringify({ t: Date.now(), itens: ids.map(id => ({ id, q: 10 })) })); }, VISIVEIS.map(m => m.variants[m.variants.length - 1]));
        await pg.reload({ waitUntil: 'networkidle' });
      }
      for (let w = 320; w <= 1600; w += (w < 1100 ? 20 : 100)) {
        await pg.setViewportSize({ width: w, height: 900 });
        const o = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (o > 0) sai.push(`${url} ${l} ${w}px (+${o})`);
      }
      await pg.fecha();
    }
  }
  chk(!sai.length, 'nenhuma pagina transborda para o lado, de 320 a 1600px', sai.slice(0, 5).join(' | ') || `${larguras.length} paginas x 2 linguas x 45 larguras, a loja com o cesto cheio`);

  /* contraste, nos dois temas, em todas as paginas */
  for (const tema of ['dark', 'light']) {
    for (const [url] of SITIO) {
      const pg = await pagina(comLingua(url, tema === 'dark' ? 'en' : 'pt'));
      if (tema === 'light') await pg.click('#theme');
      let maus = await pg.evaluate(() => {
        const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        const cor = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).map(Number); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
        const fundo = e => { for (let x = e; x; x = x.parentElement) { const cs = getComputedStyle(x), b = cor(cs.backgroundColor); if (b && b.a > 0.99) return b.c; if (cs.backgroundImage !== 'none') return null; } return null; };
        const r = [];
        for (const e of document.querySelectorAll('body *')) {
          if (!e.getClientRects().length || e.closest('.sr,.plate,noscript,.skip')) continue;
          if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
          const cs = getComputedStyle(e); if (cs.visibility === 'hidden') continue;
          const f = fundo(e), t = cor(cs.color); if (!f || !t) continue;
          const a = lum(t.c), b = lum(f), q = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          const px = parseFloat(cs.fontSize), min = (px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700)) ? 3 : 4.5;
          if (q < min) r.push(`"${e.textContent.trim().slice(0, 22)}" ${q.toFixed(2)}:1`);
        }
        return { maus: [...new Set(r)], n: document.querySelectorAll('body *').length };
      });
      const medidos = maus.n; maus = maus.maus;
      chk(!maus.length && medidos > 40, `contraste, tema ${tema === 'dark' ? 'escuro' : 'claro'}: ${url.split('?')[0]}`, maus.slice(0, 4).join(' | '));
      await pg.fecha();
    }
  }
}

/* ============================================================ 5. projetos */
async function projetos() {
  tit('5. As paginas de projeto');
  for (const l of ['en', 'pt']) {
    const maus = [];
    for (const p of CONFIG.projects) {
      const pg = await pagina(`projeto.html?p=${p.key}&lang=${l}`);
      const tp = CONFIG.i18n[l].projects[p.key], n = p.rows ? p.gallery.length : 1 + (p.gallery || []).length;
      await carregaTudo(pg);
      const r = await pg.evaluate(() => ({ t: document.querySelector('#projTitle').textContent, k: document.querySelector('#projKicker').textContent, d: document.querySelector('#projDesc').textContent,
        n: document.querySelectorAll('#series .fr').length, grupos: [...document.querySelectorAll('#series .sheet-group')].map(g => [g.querySelector('p').textContent, g.querySelectorAll('.fr').length]),
        link: (document.querySelector('#projLinks a') || { getAttribute: () => '' }).getAttribute('href') || '', titulo: document.title, og: document.querySelector('meta[property="og:image"]').content,
        outros: document.querySelectorAll('#others a').length, bar: !!document.querySelector('#nav a'), palco: GI.palco() && GI.palco().p.k }));
      const rc = await recortes(pg);
      if (r.t !== tp.title || r.k !== tp.kicker || r.d !== tp.desc || r.n !== n) maus.push(`${p.key}: texto ou serie (${r.n}/${n})`);
      if (p.rows && !igual(r.grupos, p.rows.map(x => [CONFIG.i18n[l].deckRows[x[0]], x[1]]))) maus.push(`${p.key}: filas`);
      if (r.link !== (p.link || '')) maus.push(`${p.key}: link ${r.link}`);
      if (!r.titulo.startsWith(tp.title) || !r.og.endsWith(chave(p.src) + '.jpg')) maus.push(`${p.key}: titulo ou cartao`);
      if (r.outros !== CONFIG.projects.length - 1 || !r.bar || r.palco !== chave(p.src)) maus.push(`${p.key}: outros/barra/palco`);
      if (rc.maus.length || rc.partidas.length || pg.erros.length) maus.push(`${p.key}: ${[...rc.maus, ...rc.partidas, ...pg.erros].slice(0, 2).join(', ')}`);
      if ((await textoTodo(pg)).includes('—')) maus.push(`${p.key}: travessao`);
      await pg.fecha();
    }
    chk(!maus.length, `${l}: cada projeto com o seu texto, a serie inteira sem recortes, a capa no palco`, maus.slice(0, 4).join(' | ') || CHAVES.join(', '));
    const pg = await pagina(`projeto.html?p=nao-existe&lang=${l}`);
    const r = await pg.evaluate(() => [document.querySelector('#projTitle').textContent, document.querySelectorAll('#others a').length, document.querySelector('#seriesBlock').getClientRects().length]);
    chk(r[0] === CONFIG.i18n[l].projNotFound && r[1] === CONFIG.projects.length && r[2] === 0 && !pg.erros.length, `${l}: um projeto que nao existe diz que nao existe e mostra os outros`);
    await pg.fecha();
  }
  const pg = await pagina('projeto.html?p=deck&lang=en', { vp: { width: 390, height: 844 }, toque: true });
  const c = await pg.evaluate(() => { const f = document.querySelector('#projCover'); return { vis: f.getClientRects().length > 0, fit: getComputedStyle(f.querySelector('img')).objectFit }; });
  await pg.locator('#series .fr').nth(3).tap(); await espera(pg, 300);
  const v = await pg.evaluate(() => [document.querySelector('#viewer').open, document.querySelector('#vN').textContent]);
  chk(c.vis && c.fit === 'contain' && v[0] && v[1] === '004 / 023', 'telemovel: a capa inteira no cimo, e tocar numa carta abre-a', v[1]);
  await pg.fecha();
}

/* ============================================================ 6. a loja */
async function loja() {
  tit('6. A loja e as comissoes');
  for (const l of ['en', 'pt']) {
    const pg = await pagina('loja.html?lang=' + l);
    const T = CONFIG.i18n[l];
    chk(!pg.erros.length, `${l}: sem erros na consola`, pg.erros.slice(0, 2).join(' | '));
    const fora = pg.pedidos.filter(u => !u.startsWith(base) && !u.startsWith('data:'));
    chk(!fora.length, `${l}: nenhum pedido ao Shopify nem a outro servidor antes do clique`, fora.slice(0, 2).join(', '));
    const r = await pg.evaluate(() => ({ prods: [...document.querySelectorAll('#prods .prod')].map(a => a.id), palco: GI.palco() && GI.palco().kind,
      tam: [...document.querySelectorAll('#tee .opt[data-k="size"] input')].filter(i => i.checked).length, umaOpcao: document.querySelectorAll('#print .opt').length,
      todo: document.querySelector('#shopAll').href, lr: (document.querySelector('#footLR') || {}).href, lrT: (document.querySelector('#footLR') || { textContent: '' }).textContent,
      comm: !!document.querySelector('#comissoes, #tiers'), vazio: document.querySelector('#bagEmpty').getClientRects().length > 0 }));
    chk(igual(r.prods, VISIVEIS.map(m => m.key)) && r.palco === 'photo', `${l}: um bloco por produto publicado (os retidos nao aparecem), e a fotografia no palco`, r.prods.join(', '));
    chk(r.tam === 0 && r.umaOpcao === 1, `${l}: o tamanho nao vem escolhido; uma opcao com um so valor nao se mostra`);
    chk(r.todo === `${CONFIG.shop}/collections/${CONFIG.merchCollection}` && r.lr === CONFIG.livroReclamacoes && r.lrT.includes(T.footComplaints), `${l}: a loja toda no Shopify e o Livro de Reclamacoes no rodape`);
    chk(!r.comm, `${l}: a loja e so o merch e o cesto (as comissoes tem a sua pagina)`);

    /* as comissoes, na sua pagina */
    const pc = await pagina('comissoes.html?lang=' + l);
    const c = await pc.evaluate(() => ({ tiers: [...document.querySelectorAll('#tiers .tier h3')].map(x => x.textContent), cta: document.querySelector('#commCta').getAttribute('href'),
      comm: document.querySelector('#comissoes').innerText, badge: document.querySelector('#commBadge').textContent, palco: GI.palco() && GI.palco().kind,
      lr: (document.querySelector('#footLR') || {}).href }));
    chk(igual(c.tiers, CONFIG.tiers.map(x => T.tiers[x.key].name)) && !/€|\d\s?%|\$/.test(c.comm) && c.badge === T[CONFIG.commissionsOpen ? 'commOpen' : 'commClosed'],
      `${l}: comissoes com os quatro formatos e nenhum preco`, c.tiers.join(' · '));
    chk(c.cta === `mailto:${CONFIG.email}?subject=${encodeURIComponent(T.mailSubject)}&body=${encodeURIComponent(T.mailBody)}`, `${l}: o botao das comissoes abre o email com as perguntas ja escritas`);
    chk(c.palco === 'deco' && c.lr === CONFIG.livroReclamacoes, `${l}: nas comissoes, o elenco no palco e o Livro de Reclamacoes no rodape`);
    await pc.fecha();
    chk(!(await textoTodo(pg)).includes('—'), `${l}: nenhum travessao no que se le ou ouve`);

    /* o cesto */
    await pg.click('#tee .btn'); await espera(pg, 100);
    const semTam = await pg.evaluate(() => [GI.cesto().length, document.querySelector('#tee .msg').textContent]);
    chk(semTam[0] === 0 && semTam[1] === T.pickMissing, `${l}: sem tamanho nao entra no cesto, e diz porque`, semTam[1]);
    await pg.check('#tee input[value="Monk"]', { force: true }); await pg.check('#tee input[value="White"]', { force: true }); await pg.check('#tee input[value="M"]', { force: true });
    await pg.click('#tee .btn'); await espera(pg, 100);
    const link = await pg.getAttribute('#checkout', 'href');
    chk(link === `${CONFIG.shop}/cart/60968526905678:1`, `${l}: T-shirt Monk / White / M abre o checkout do Shopify com a variante certa`, link);
    const fab = await pg.evaluate(() => { const f = document.querySelector('#fab'); return [f.classList.contains('on'), f.textContent]; });
    chk(fab[0] && fab[1] === `${T.bagShort} · 1`, `${l}: com o cesto fora do ecra, aparece o botao flutuante do cesto`, fab[1]);
    await pg.click('#print .btn'); await pg.click('#bagLines li:first-child .qty button:last-child'); await espera(pg, 100);
    const c2 = await pg.evaluate(() => ({ t: document.querySelector('#bagTotal').textContent, href: document.querySelector('#checkout').getAttribute('href'), n: document.querySelectorAll('#bagLines li').length,
      nomes: [...document.querySelectorAll('#bagLines .qty button')].map(b => b.getAttribute('aria-label')) }));
    const total = 2 * Number(CONFIG.merch.find(m => m.key === 'tee').price) + Number(CONFIG.merch.find(m => m.key === 'print').price);
    chk(c2.t === `${total} €` && c2.n === 2 && /:2,\d+:1$/.test(c2.href) && c2.nomes.every(x => x && x.length > 8), `${l}: o cesto soma, e cada botao de quantidade diz de que peca e`, `${c2.t}; ${c2.nomes[0]}`);
    await pg.reload({ waitUntil: 'networkidle' });
    const c3 = await pg.evaluate(() => GI.cesto().map(x => x.q).join(','));
    await pg.click('#bagLines li:last-child .qty button:first-child'); await espera(pg, 80);
    const c4 = await pg.evaluate(() => GI.cesto().length);
    chk(c3 === '2,1' && c4 === 1, `${l}: o cesto fica guardado ao recarregar, e tirar a ultima unidade tira a linha`);
    await carregaTudo(pg); const rc = await recortes(pg);
    chk(!rc.maus.length && !rc.partidas.length, `${l}: nenhuma imagem cortada ou em falta`, [...rc.maus, ...rc.partidas].slice(0, 3).join(', '));
    await pg.fecha();
  }
  const pg = await pagina('loja.html?lang=pt#print', { vp: { width: 390, height: 844 }, toque: true });
  await espera(pg, 700);
  const f = await pg.evaluate(() => { const a = document.querySelector('#print'), i = a.querySelector('.prod-photo'), r = i.getBoundingClientRect(); return { topo: a.getBoundingClientRect().top, q: r.width / r.height }; });
  chk(Math.abs(f.topo) < 160 && Math.abs(f.q - 1) < 0.02, 'telemovel: loja.html#print chega ao print, e a fotografia nao esta esticada', `${f.q.toFixed(2)}`);
  await pg.fecha();
}

/* ============================================================ 7. o resto */
async function resto() {
  tit('7. Tema, movimento, 404, disco');
  for (const pag of [...PAGINAS, 'nao/existe/aqui']) {
    const pg = await pagina(pag + (pag === 'projeto.html' ? '?p=sok' : ''), { esquema: 'light' });
    const r = await pg.evaluate(() => [getComputedStyle(document.body).backgroundColor, document.fonts.check('700 20px "Shippori Mincho B1"'), document.title]);
    chk(r[0] === 'rgb(3, 4, 7)' && r[1], `${pag === 'nao/existe/aqui' ? '404 (num endereco qualquer)' : pag}: abre no escuro mesmo com o sistema em claro, com as letras da casa`, r[2]);
    if (pag === 'nao/existe/aqui') {
      const q = await pg.evaluate(() => ({ t: document.body.innerText, href: document.querySelector('a').getAttribute('href'), selo: (document.querySelector('aside img') || {}).naturalWidth > 0 }));
      chk(q.t.includes('404') && q.t.includes('Esta página não existe.') && q.t.includes("This page doesn't exist.") && q.href === '/' && q.selo, '404: nas duas linguas, com o caminho para o inicio e o selo');
    }
    await pg.fecha();
  }
  /* o botao do tema: claro e de volta */
  const pt = await pagina('index.html?lang=en');
  await pt.click('#theme'); const claro = await pt.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await pt.click('#theme'); const escuro = await pt.evaluate(() => getComputedStyle(document.body).backgroundColor);
  chk(claro === 'rgb(243, 244, 246)' && escuro === 'rgb(3, 4, 7)', 'o botao ◐ passa a claro e volta');
  await pt.fecha();

  /* prefers-reduced-motion: nenhuma transicao com duracao, nenhuma animacao a correr */
  for (const [url, vp, prep] of [['trabalho.html', { width: 1440, height: 900 }, 'visor'], ['index.html', { width: 390, height: 844 }, 'menu'], ['index.html', { width: 1440, height: 900 }, null],
    ['loja.html', { width: 1440, height: 900 }, null], ['comissoes.html', { width: 1440, height: 900 }, null], ['sobre.html', { width: 1440, height: 900 }, null], ['projeto.html?p=tr', { width: 1440, height: 900 }, null]]) {
    const pg = await pagina(url, { vp, reduz: true, toque: vp.width < 700 });
    if (prep === 'visor') { await pg.evaluate(() => document.querySelector('#wall .fr').click()); await pg.evaluate(() => document.querySelector('#wall .fr').click()); await espera(pg, 200); }
    if (prep === 'menu') { await pg.tap('#menuBtn'); await espera(pg, 200); }
    const r = await pg.evaluate(() => {
      const maus = [];
      const dura = cs => cs.transitionDuration.split(',').some(d => parseFloat(d) > 0) || cs.animationName !== 'none';
      for (const e of document.querySelectorAll('*')) {
        if (dura(getComputedStyle(e))) maus.push(e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0]);
        for (const ps of ['::before', '::after']) if (dura(getComputedStyle(e, ps))) maus.push(e.tagName.toLowerCase() + ps);
      }
      return { maus: [...new Set(maus)], anim: document.getAnimations().length };
    });
    chk(!r.maus.length && r.anim === 0, `movimento reduzido: ${url.split('?')[0]} ${vp.width}px${prep ? ' com o ' + prep + ' aberto' : ''}`, r.maus.slice(0, 4).join(', ') || 'tudo parado');
    await pg.fecha();
  }

  /* aberto do disco (file://), como o Frede o abre no computador */
  for (const [f, sel, n] of [['index.html', '#flip .fr', 6], ['trabalho.html', '#wall .fr', CONFIG.artworks.length], ['projetos.html', '#projs .proj', CONFIG.projects.length],
    ['loja.html', '#prods .prod', VISIVEIS.length], ['comissoes.html', '#tiers .tier', CONFIG.tiers.length], ['sobre.html', '#tl li', CONFIG.timeline.length], ['projeto.html', '#series .fr', 4]]) {
    const pg = await pagina(pathToFileURL(join(PASTA, f)).href + (f === 'projeto.html' ? '?p=tr' : ''));
    await espera(pg, 300);
    const r = await pg.evaluate(s => ({ n: document.querySelectorAll(s).length, img: [...document.images].some(i => i.naturalWidth > 0), bar: document.querySelectorAll('#nav a').length, links: [...document.querySelectorAll('a[data-go]')].every(a => a.getAttribute('href').includes('lang=')) }), sel);
    const erros = pg.erros.filter(e => !/woff2|ERR_FAILED/.test(e));
    chk(r.n === n && r.img && r.bar === 6 && r.links && !erros.length, `file://: ${f} abre do disco e desenha-se`, erros.slice(0, 2).join(' | ') || `${r.n} pecas`);
    await pg.fecha();
  }

  /* leitores de ecra: cada etiqueta segue a lingua */
  for (const [url] of SITIO) {
    const et = {};
    for (const l of ['en', 'pt']) {
      const pg = await pagina(url + (url.includes('?') ? '&' : '?') + 'lang=' + l);
      await pg.evaluate(() => { const b = document.querySelector('.fr'); if (b) { b.click(); b.click(); } });      // abre o visualizador, para as etiquetas dele contarem
      await espera(pg, 150);
      et[l] = await pg.evaluate(() => [...document.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')));
      await pg.fecha();
    }
    const nomes = new Set([CONFIG.artistName, CONFIG.realName, ...CONFIG.artworks.map(a => a.label), 'Instagram',
      ...['en', 'pt'].flatMap(l => [...Object.values(CONFIG.i18n[l].projects).map(p => p.title), ...Object.values(CONFIG.i18n[l].merchItems).map(m => m.name)])]);
    const iguais = et.en.filter((x, i) => x === et.pt[i] && !nomes.has(x) && /[a-z]{3}/i.test(x));
    chk(et.en.length === et.pt.length && et.en.length >= 5 && !iguais.length, `leitores de ecra: ${url.split('?')[0]}, cada etiqueta le-se na lingua da pagina`, iguais.slice(0, 3).join(' | ') || `${et.en.length} etiquetas`);
  }

  /* nada salta ao carregar (CLS) */
  const medidas = [['index.html?lang=en', { width: 1440, height: 900 }], ['trabalho.html?lang=pt', { width: 1440, height: 900 }], ['trabalho.html?lang=en', { width: 390, height: 844 }],
    ['loja.html?lang=pt', { width: 1440, height: 900 }], ['index.html?lang=pt', { width: 390, height: 844 }], ['loja.html?lang=en', { width: 390, height: 844 }],
    ['projetos.html?lang=en', { width: 1440, height: 900 }], ['comissoes.html?lang=pt', { width: 390, height: 844 }], ['sobre.html?lang=en', { width: 1440, height: 900 }],
    ['projeto.html?p=deck&lang=en', { width: 1440, height: 900 }], ['projeto.html?p=sok&lang=pt', { width: 390, height: 844 }]];
  for (const [url, vp] of medidas) {
    const v = await cls(url, vp, false);
    chk(v < 0.01, `CLS ${url.split('?')[0]} ${vp.width}px`, v.toFixed(4));
  }
  if (RAPIDO) { console.log('  (--rapido: o CLS em linha lenta ficou por medir)'); return; }
  for (const [url, vp] of medidas.slice(0, 4)) {
    const vs = [];
    for (let i = 0; i < 3; i++) vs.push(await cls(url, vp, true));      // tres vezes: um salto destes nem sempre aparece
    chk(Math.max(...vs) < 0.02, `CLS em linha lenta (400 kbps) ${url.split('?')[0]} ${vp.width}px`, vs.map(v => v.toFixed(4)).join(' / '));
  }
}

/* ============================================================ corre */
if (corre(1)) estatico();
await new Promise(f => srv.listen(0, '127.0.0.1', f));
base = `http://127.0.0.1:${srv.address().port}/`;
browser = await chromium.launch();
try {
  if (corre(2)) await mesmaInformacao();
  if (corre(3)) await inicial();
  if (corre(4)) await ecras();
  if (corre(5)) await projetos();
  if (corre(6)) await loja();
  if (corre(7)) await resto();
} catch (e) {
  mau('o teste parou a meio', e.stack.split('\n').slice(0, 4).join(' '));
}
await browser.close(); srv.close();
console.log(`\n${falhas ? '\x1b[31m' : '\x1b[32m'}${testes - falhas} de ${testes} testes passaram\x1b[0m${falhas ? `, ${falhas} falharam` : ''}`);
process.exit(falhas ? 1 : 0);

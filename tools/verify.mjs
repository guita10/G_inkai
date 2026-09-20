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
 *     node tools/verify.mjs --shop-aberto # testa tambem com shopOpen:true
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
  for (const pag of ['index.html', 'projeto.html', '404.html']) {
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
  for (const pag of ['index.html', 'projeto.html', '404.html']) {
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

  // projeto.html so guarda a fatia que le, e essa tem de bater certo
  const fatia = ['artistName', 'realName', 'projects', 'i18n'];
  const extra = Object.keys(B).filter(k => !fatia.includes(k));
  chk(extra.length === 0, 'projeto.html nao guarda mais do que a sua fatia', extra.join(' '));
  chk(eq(A.projects, B.projects) && A.artistName === B.artistName && A.realName === B.realName
      && eq(A.i18n.en.projects, B.i18n.en.projects) && eq(A.i18n.pt.projects, B.i18n.pt.projects),
      'a fatia de projeto.html esta sincronizada com o index');

  // §9.9 — nada de em-dashes na copia visivel
  const emdash = [];
  const anda = (o, p) => { for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') { if (v.includes('—')) emdash.push(`${p}.${k}`); }
    else if (v && typeof v === 'object') anda(v, `${p}.${k}`); } };
  anda(A.i18n, 'index'); anda(B.i18n, 'projeto');
  chk(emdash.length === 0, '§9.9 nenhum em-dash na copia visivel', emdash.join(' '));

  // §9.4 — nenhum preco de comissao no CONFIG nem no JSON-LD
  const comiss = JSON.stringify({ tiers: A.tiers, i18n: { en: A.i18n.en.tiers, pt: A.i18n.pt.tiers } })
    + JSON.stringify(B);
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

  /* --- CLS sem travao --- */
  {
    const p = await nova(1440);
    await p.addInitScript(() => { window.__cls = 0;
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const cls = await p.evaluate(() => window.__cls);
    chk(cls < 0.01, 'CLS sem travao abaixo de 0,01', cls.toFixed(4));
    await p.close();
  }

  /* --- CLS travado a 400 kbps, tres voltas ---
     Tres e nao uma de proposito: o salto de 0,33 que o order:-1 causava so
     aparecia em cerca de uma carga em tres, consoante o momento do primeiro
     desenho. Uma volta so nao prova nada. */
  if (!RAPIDO) {
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
      await p.goto(base + 'index.html', { waitUntil: 'load' });
      await p.waitForTimeout(4000);
      vals.push(await p.evaluate(() => window.__cls));
      await p.close();
    }
    chk(Math.max(...vals) < 0.05, 'CLS travado a 400 kbps, tres voltas',
      vals.map(v => v.toFixed(4)).join(' / '));
  }

  /* --- overflow horizontal: varrer, nao espreitar ---
     A banda dos 621-743px esteve partida durante meses e 390/768/1440
     pareciam todos bem. Por isso e de 4 em 4 pixeis. */
  {
    const p = await nova(1280);
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    const maus = [];
    for (let w = 320; w <= 1600; w += 4) {
      await p.setViewportSize({ width: w, height: 900 });
      await p.waitForTimeout(40);
      const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (o > 0) maus.push(`${w}px:+${o}`);
    }
    chk(maus.length === 0, 'zero overflow horizontal de 320 a 1600px (de 4 em 4)',
      maus.slice(0, 6).join(' '));
    await p.close();
  }

  /* --- nenhuma peca cortada ---
     As lazy TEM de ser forcadas a carregar: sem isso reportam naturalWidth 0
     e passam todas por engano. */
  {
    const p = await nova(1440);
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => { for (const i of document.querySelectorAll('img')) i.loading = 'eager';
      window.scrollTo(0, document.body.scrollHeight); });
    await p.waitForTimeout(3000);
    const cort = await p.evaluate(() => {
      const o = [];
      for (const i of document.querySelectorAll('.wall img')) {
        if (!i.naturalWidth) { o.push(i.getAttribute('src') + ':nao carregou'); continue; }
        const r = i.getBoundingClientRect();
        if (Math.abs(i.naturalWidth / i.naturalHeight - r.width / r.height) > 0.02) o.push(i.getAttribute('src'));
      }
      return o;
    });
    chk(cort.length === 0, 'nenhuma peca da parede esta cortada', cort.join(' '));
    await p.close();
  }

  /* --- reduced-motion: pela DURACAO, nunca pela propriedade --- */
  {
    const fugas = {};
    for (const pag of ['index.html', 'projeto.html?p=sok', '404.html']) {
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
    chk(total.length === 0, '§9.8 zero efeitos sob prefers-reduced-motion, nas tres paginas',
      total.join(' '));
  }

  /* --- contraste, nos dois temas, DEPOIS de a transicao assentar ---
     Elementos com background-image (gradiente) ficam de fora: a cor de fundo
     computada nao diz nada sobre eles e o resultado seria um falso positivo.
     Esses medem-se nos pixeis, nao no DOM. */
  {
    const p = await nova(1280);
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
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
      chk(f.length === 0, `contraste no tema ${tema}`, f.slice(0, 5).join('  '));
    }
    await p.close();
  }

  /* --- seletores sem alvo e afordancias falsas --- */
  {
    const p = await nova(1280);
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
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
    chk(r.mortos.length === 0, 'nenhum seletor CSS sem alvo', r.mortos.slice(0, 5).join(' '));
    chk(r.falsos.length === 0, 'nenhum cursor:pointer sem destino clicavel', r.falsos.join(' '));
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
      .map(h => ({ t: h.textContent.trim(), abre: getComputedStyle(h).clipPath === 'inset(0px)' })));
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
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    const fechou = await p.evaluate(() => ({
      fechada: !document.getElementById('lb').classList.contains('open'),
      scroll: document.body.style.overflow }));
    chk(abriu && /28/.test(volta) && fechou.fechada && fechou.scroll === '',
      'lightbox abre, da a volta, fecha e solta o scroll', `${volta}`);
    await p.close();
  }

  /* --- filtros: as partes somam o todo --- */
  {
    const p = await nova(1440);
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => {
      const chips = [...document.querySelectorAll('#filters .chip')];
      const conta = () => [...document.querySelectorAll('.wall .frame')].filter(f => getComputedStyle(f).display !== 'none').length;
      const o = [];
      for (const c of chips) { c.click(); o.push({ n: c.textContent.trim(), v: conta() }); }
      chips[0].click();
      return o;
    });
    const todos = r[0].v, soma = r.slice(1).reduce((a, x) => a + x.v, 0);
    chk(todos === soma, 'os filtros somam o total da parede',
      `${r.slice(1).map(x => x.v).join('+')} = ${soma} de ${todos}`);
    await p.close();
  }

  /* --- projeto.html: todas as chaves, as duas linguas --- */
  {
    const maus = [];
    for (const loc of ['en-US', 'pt-PT']) {
      const p = await nova(1100, { locale: loc });
      for (const k of ['sok', 'tr', 'pamp', 'naoexiste', '']) {
        await p.goto(`${base}projeto.html?p=${k}`, { waitUntil: 'networkidle' });
        const r = await p.evaluate(() => {
          const i = document.querySelector('.wrap img');
          return { h1: document.querySelector('h1').textContent.trim(),
                   img: i ? i.naturalWidth > 0 : null,
                   robots: document.querySelector('meta[name="robots"]').content };
        });
        const real = ['sok', 'tr', 'pamp'].includes(k);
        if (!r.h1) maus.push(`${loc} ${k}: sem titulo`);
        if (real && r.img === false) maus.push(`${loc} ${k}: imagem partida`);
        if (!real && !r.robots.includes('noindex')) maus.push(`${loc} ${k}: devia ser noindex`);
      }
      await p.close();
    }
    chk(maus.length === 0, 'projeto.html nas 3 chaves + invalida + vazia, EN e PT', maus.join(' '));
  }

  /* --- file:// ainda funciona --- */
  {
    const p = await nova(1280);
    await p.goto('file://' + join(ROOT, 'index.html'), { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => ({
      molduras: document.querySelectorAll('.wall .frame').length,
      h1: document.querySelector('.hero h1').textContent.trim().length }));
    chk(r.molduras > 0 && r.h1 > 0, 'o site abre por file://', `${r.molduras} molduras`);
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
  for (const f of ['index.html', 'projeto.html', '404.html'])
    writeFileSync(join(tmp, f), readFileSync(join(ROOT, f), 'utf8')
      .replace('  shopOpen: false,', '  shopOpen: true,'));
  execFileSync('cp', ['-r', join(ROOT, 'images'), tmp]);
  await navegador(tmp, 'com a loja ABERTA (copia temporaria)');
}

console.log(`\n${falhas ? '\x1b[31m' : '\x1b[32m'}${testes - falhas}/${testes} testes passaram\x1b[0m`);
process.exit(falhas ? 1 : 0);

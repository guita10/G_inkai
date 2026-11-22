/* site.js — o comportamento do site novo, partilhado por todas as paginas.

   COMO SE DESENHA A PAGINA: cada seccao desenha-se a si propria assim que o
   browser acaba de a ler (um <script>GI.r('nome')</script> logo a seguir ao
   seu HTML). Quando a pagina se pinta pela primeira vez o texto ja la esta:
   nao ha esqueleto vazio a encher depois, por isso nada salta (CLS).

   O PALCO: metade do ecra onde esta sempre uma peca, inteira. Apontar para
   uma moldura (140 ms de pausa, a licao do Flip), foca-la ou toca-la poe-na
   no palco; clicar na que ja la esta abre o visualizador.

   Tudo o que aqui aparece escrito vem do dados.js (CONFIG). */
(function () {
  'use strict';
  const C = window.CONFIG, DIMS = window.DIMS || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wideMq = matchMedia('(min-width:1060px)');
  const wide = () => wideMq.matches;

  /* um elemento em poucas letras: h('a', {class:'x', href:'#', text:'ola'}, [filhos]) */
  function h(tag, a, kids) {
    const e = document.createElement(tag);
    for (const k in (a || {})) {
      const v = a[k];
      if (v == null || v === false) continue;
      if (k === 'text') e.textContent = v;
      else if (k === 'class') e.className = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(c => c != null && e.append(c));
    return e;
  }
  const seta = g => h('span', { 'aria-hidden': 'true', text: ' ' + g });   // → dentro do site, ↗ para fora

  /* ================= A LINGUA =================
     Primeiro a do link (?lang=pt), senao a do browser: a regra do site atual. */
  const qs = new URLSearchParams(location.search);
  /* em que pagina estamos: o <html data-page="..."> de cada uma */
  const PAG = document.documentElement.dataset.page || 'home';
  /* OS ENDERECOS ANTIGOS. Ate 17 Nov 2026 isto era uma pagina comprida, e o site
     atual ainda e: os links para as suas partes (guitaink.com/#work,
     loja.html#comissoes) podem estar guardados em algum lado. Cada um leva a
     pagina nova dessa parte, com a lingua que trazia. */
  (function () {
    const antigos = {
      home: { work: 'trabalho.html', projects: 'projetos.html', shop: 'loja.html', comm: 'comissoes.html',
        about: 'sobre.html', timeline: 'sobre.html#timeline', contact: 'sobre.html#contact' },
      loja: { comissoes: 'comissoes.html' },
    }[PAG] || {};
    const alvo = antigos[location.hash.slice(1)];
    if (alvo) { const [f, a] = alvo.split('#'); location.replace(f + location.search + (a ? '#' + a : '')); }
  })();
  const pedida = qs.get('lang');
  let LANG = (pedida === 'pt' || pedida === 'en') ? pedida
    : ((navigator.language || 'en').toLowerCase().startsWith('pt') ? 'pt' : 'en');
  document.documentElement.lang = LANG;
  const T = () => C.i18n[LANG];
  const tx = k => k.split('.').reduce((o, p) => (o == null ? o : o[p]), T());

  /* os links entre paginas levam a lingua escolhida */
  function go(alvo) {
    const [resto, ancora] = alvo.split('#');
    const [pagina, q] = resto.split('?');
    const p = new URLSearchParams(q || '');
    p.set('lang', LANG);
    return pagina + '?' + p.toString() + (ancora ? '#' + ancora : '');
  }
  /* escreve os textos de um bloco: data-t = texto, data-ta = aria-label, data-go = link interno */
  function fill(root) {
    if (!root) return;
    const todos = s => (root.matches && root.matches(s) ? [root] : []).concat($$(s, root));
    todos('[data-t]').forEach(e => { const v = tx(e.dataset.t); if (typeof v === 'string') e.textContent = v; });
    todos('[data-ta]').forEach(e => { const v = tx(e.dataset.ta); if (typeof v === 'string') e.setAttribute('aria-label', v); });
    todos('[data-go]').forEach(e => e.setAttribute('href', go(e.dataset.go)));
  }

  /* ================= AS IMAGENS ================= */
  const WEBP = (() => {
    try { return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0; }
    catch (e) { return false; }
  })();
  const SIZES = '(min-width:1060px) 52vw, 92vw';
  /* tudo o que e preciso saber de uma obra de images/: os tres tamanhos e a proporcao */
  function pic(src) {
    const k = src.split('/').pop().replace(/\.\w+$/, ''), d = DIMS[k] || {};
    return {
      k, w: d.w, h: d.h, tw: d.tw, th: d.th, ar: d.w && d.h ? d.w / d.h : 0.8,
      full: WEBP && d.f ? `images/${k}.webp` : `images/${k}.jpg`,
      thumb: WEBP && d.t ? `images/thumb/${k}.webp` : `images/thumb/${k}.jpg`,
      mini: WEBP ? `mini/${k}.webp` : `images/thumb/${k}.jpg`,
      jpg: `images/${k}.jpg`, thumbJpg: `images/thumb/${k}.jpg`,
    };
  }
  /* uma peca que pode ir ao palco e ao visualizador */
  function obra(src, label, extra) {
    const p = pic(src);
    return Object.assign({
      label, p, url: p.full, back: p.jpg,
      srcset: p.tw && p.w ? `${p.thumb} ${p.tw}w, ${p.full} ${p.w}w` : '',
    }, extra || {});
  }
  /* a imagem falhou: tenta o .jpg; se tambem falhar, a chapa tipografica (nada se inventa) */
  function guarda(img, jpg, texto) {
    img.addEventListener('error', function falhou() {
      if (jpg && !img.dataset.jpg) { img.dataset.jpg = '1'; img.removeAttribute('srcset'); img.src = jpg; return; }
      img.removeEventListener('error', falhou);
      const c = h('span', { class: 'plate' }, [document.createTextNode(texto || ''), h('small', { text: tx('placeholderNote') })]);
      img.replaceWith(c);
    });
  }

  /* ================= O PALCO ================= */
  const stage = { el: null, cur: null, tok: 0 };
  let marcada = null;
  const ultima = {};                      // a ultima peca escolhida em cada seccao
  function stageInit() {
    stage.el = $('#stage');
    if (!stage.el) return;
    stage.el.setAttribute('data-ta', 'stageLabel');
    stage.art = h('button', { class: 'stage-art', id: 'stageArt', type: 'button' });
    stage.cap = h('p', { class: 'stage-cap', id: 'stageCap' });
    stage.n = h('p', { class: 'stage-n num', id: 'stageN' });
    stage.el.append(stage.art, h('div', { class: 'stage-foot' }, [stage.cap, stage.n]));
    stage.imgs = [];                       // as duas camadas nascem quando ha uma imagem para lhes dar
    stage.art.addEventListener('click', () => { const c = stage.cur; if (c && c.open) c.open(stage.art); });
    wideMq.addEventListener('change', () => { if (stage.cur) show(stage.cur, 'now'); });
    if (stage.cur) show(stage.cur, 'now');
  }
  function legenda(it) {
    if (!stage.el) return;
    stage.cap.textContent = it.cap || it.label || '';          // cap: o que se le; label: o nome para quem ouve
    stage.n.textContent = it.note ? it.note() : '';
    stage.art.disabled = !it.open;
    stage.art.setAttribute('aria-label', it.open ? `${tx('stageOpen')}: ${it.label}` : (it.label || ''));
  }
  /* como: 'now' = um gesto (sem animacao, repete-se muitas vezes);
           'fade' = a pagina passou a outra seccao (uma passagem lenta) */
  function show(it, como) {
    if (!it) return;
    stage.cur = it;
    if (it.hero) heroM(it);
    if (!stage.el || !wide()) return;
    legenda(it);
    const meu = ++stage.tok;
    const pre = new Image();
    if (it.srcset) { pre.sizes = SIZES; pre.srcset = it.srcset; }
    pre.src = it.url;
    const troca = url => {
      if (meu !== stage.tok) return;
      const sai = stage.imgs.find(i => i.classList.contains('on'));
      let entra = stage.imgs.find(i => i !== sai);
      if (!entra) { entra = h('img', { alt: '' }); stage.art.append(entra); stage.imgs.push(entra); }
      stage.el.classList.toggle('now', como !== 'fade' || reduce);
      entra.removeAttribute('srcset');
      if (it.srcset && url === it.url) { entra.sizes = SIZES; entra.srcset = it.srcset; }
      entra.src = url; entra.alt = it.label || '';
      entra.className = 'on' + (it.kind ? ' ' + it.kind : '');
      if (sai) sai.classList.remove('on');
      stage.art.querySelectorAll('.plate').forEach(x => x.remove());
    };
    const espera = (im, sim, nao) => (im.decode ? im.decode() : new Promise((ok, ko) => { im.onload = ok; im.onerror = ko; })).then(sim, nao);
    espera(pre, () => troca(it.url), () => {
      if (!it.back) return chapa(it, meu);
      const b = new Image(); b.src = it.back;
      espera(b, () => troca(it.back), () => chapa(it, meu));
    });
  }
  function chapa(it, meu) {
    if (meu !== stage.tok) return;
    stage.imgs.forEach(i => i.classList.remove('on'));
    stage.art.querySelectorAll('.plate').forEach(x => x.remove());
    stage.art.append(h('span', { class: 'plate' }, [document.createTextNode(it.plate || it.label || ''), h('small', { text: tx('placeholderNote') })]));
  }
  function mark(it) {
    if (marcada && marcada.btn) marcada.btn.setAttribute('aria-pressed', 'false');
    marcada = it;
    if (it && it.btn) {
      it.btn.setAttribute('aria-pressed', 'true');
      const barra = it.btn.closest('[role="toolbar"]');
      if (barra) $$('.fr', barra).forEach(x => { x.tabIndex = x === it.btn ? 0 : -1; });
    }
  }
  function pick(it, como) {
    show(it, como || 'now'); mark(it);
    if (!it) return;
    if (it.hero) { const i = seis.indexOf(it); if (i >= 0) S.heroi = i; }
    const sec = it.btn && it.btn.closest('[data-sec]');
    if (sec) ultima[sec.dataset.sec] = it.p.k;
  }
  const lembrada = (sec, lista) => lista.find(it => it.p.k === ultima[sec]);

  /* APONTAR A SERIO. O palco troca quando o rato pousa 140 ms numa coisa (a licao
     do Flip: sem a pausa, o caminho ate a peca grande trocava-a pelo meio). E so
     conta o rato a MEXER-SE (pointermove), nunca a pagina a passar por baixo de
     um rato parado (pointerover): a rolar a pagina, ou ao fechar o visualizador,
     as molduras passam debaixo do rato e o palco nao pode ir atras delas.
     alvoDe(elemento) diz sobre o que se esta; faz(alvo) e o que acontece. */
  function aponta(el, alvoDe, faz) {
    let t = 0, sobre = null;
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const a = alvoDe(e.target);
      if (a === sobre) return;
      sobre = a; clearTimeout(t);
      if (a) t = setTimeout(() => faz(a), 140);
    });
    el.addEventListener('pointerleave', () => { sobre = null; clearTimeout(t); });
    return () => clearTimeout(t);
  }

  /* ================= UMA FOLHA DE MOLDURAS =================
     o = { label, list() (as que contam para o visualizador), eager, grupos,
           titulos (o nome por baixo de cada peca; o CSS so o mostra numa coluna) } */
  function sheet(box, itens, o) {
    o = o || {};
    box.textContent = '';
    box.setAttribute('role', 'toolbar');
    box.setAttribute('aria-label', o.label || '');
    const lista = () => (o.list ? o.list() : itens);
    const faz = (it, i) => {
      const b = h('button', {
        class: 'fr', type: 'button', 'aria-pressed': 'false', tabindex: i ? '-1' : '0',
        'aria-label': `${tx('heroShow')} ${it.label}`, style: `--ar:${it.p.ar.toFixed(4)}`,
      });
      const img = h('img', { alt: '', decoding: 'async', loading: o.eager ? 'eager' : 'lazy', width: it.p.tw, height: it.p.th, src: it.p.mini });
      guarda(img, it.p.thumbJpg, it.label);
      b.append(img); b._it = it; it.btn = b;
      if (o.titulos) b.append(h('span', { class: 'fr-t', 'aria-hidden': 'true', text: it.cap || it.label }));   // o nome ja esta no aria-label
      it.open = quem => { const L = lista(); openViewer(L, Math.max(0, L.indexOf(it)), quem || b); };
      it.note = () => { const L = lista(), n = L.indexOf(it); return n < 0 ? '' : `${n + 1} / ${L.length}`; };
      return b;
    };
    if (o.grupos) {
      let k = 0;
      o.grupos.forEach(g => {
        const fila = h('div', { class: 'sheet cards' });
        itens.slice(k, k + g.n).forEach((it, j) => fila.append(faz(it, k + j)));
        k += g.n;
        box.append(h('div', { class: 'sheet-group' }, [h('p', { text: g.label }), fila]));
      });
    } else itens.forEach((it, i) => box.append(faz(it, i)));

    if (box._folha) return;              // os ouvintes ja la estao: leem a moldura (b._it), nao a lista
    box._folha = true;
    const cancela = aponta(box, x => x.closest('.fr'), b => pick(b._it));
    box.addEventListener('focusin', e => {
      const b = e.target.closest('.fr');
      if (b && b.matches(':focus-visible')) pick(b._it);
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('.fr'); if (!b) return;
      const it = b._it; cancela();
      /* ja esta no palco (ou nao ha palco: telemovel) → abre grande; senao, vai ao palco */
      if (stage.cur === it || (!wide() && !it.hero)) it.open(b); else pick(it);
    });
    box.addEventListener('keydown', e => {
      const vis = $$('.fr', box).filter(b => !b.hidden && b.offsetParent !== null);
      const i = vis.indexOf(document.activeElement); if (i < 0) return;
      let j;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = Math.min(i + 1, vis.length - 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = Math.max(i - 1, 0);
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = vis.length - 1;
      else return;
      e.preventDefault(); vis[j].focus();
    });
  }

  /* ================= O VISUALIZADOR ================= */
  const V = { el: null, lista: [], i: 0, quem: null };
  const tres = n => String(n).padStart(3, '0');
  function viewerInit() {
    if (V.el) return;
    const b = (id, ta, g) => h('button', { class: 'v-btn', id, type: 'button', 'data-ta': ta, text: g });
    V.el = h('dialog', { class: 'viewer', id: 'viewer', 'data-ta': 'a11yViewer' }, [
      h('div', { class: 'v-top' }, [h('p', { class: 'v-title', id: 'vTitle' }), h('p', { class: 'v-n num', id: 'vN' }), b('vClose', 'a11yClose', '×')]),
      h('div', { class: 'v-mid' }, [b('vPrev', 'a11yPrev', '‹'), h('div', { class: 'v-pic', id: 'vPic' }), b('vNext', 'a11yNext', '›')]),
      h('div', { class: 'v-bot' }, [h('p', { class: 'v-hint', id: 'vHint' }), h('div', { class: 'v-touch' }, [b('vPrevT', 'a11yPrev', '‹'), b('vNextT', 'a11yNext', '›')])]),
      h('p', { class: 'sr', 'aria-live': 'polite', id: 'vLive' }),
    ]);
    document.body.append(V.el);
    $('#vClose').onclick = () => V.el.close();
    $('#vPrev').onclick = $('#vPrevT').onclick = () => passo(-1);
    $('#vNext').onclick = $('#vNextT').onclick = () => passo(1);
    V.el.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); passo(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); passo(1); }
    });
    V.el.addEventListener('click', e => { if (e.target === V.el) V.el.close(); });
    let x0 = null;
    V.el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    V.el.addEventListener('touchend', e => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 44) passo(dx < 0 ? 1 : -1);
    });
    V.el.addEventListener('close', () => {
      const it = V.lista[V.i];
      if (it && it.btn && (wide() || it.hero)) pick(it);          // o palco fica onde o visualizador acabou
      /* o foco volta a moldura da peca onde se parou (quem usa o teclado continua dai);
         se essa moldura nao esta a vista, ou se se abriu pelo palco, volta a quem abriu */
      const veio = V.quem && V.quem.classList.contains('fr');
      const alvo = veio && it && it.btn && it.btn.getClientRects().length ? it.btn : V.quem;
      if (alvo && alvo.isConnected) alvo.focus({ preventScroll: alvo === V.quem });
    });
  }
  function desenhaV() {
    const it = V.lista[V.i], n = V.lista.length;
    const img = h('img', { alt: it.label || '' });
    if (it.srcset) { img.sizes = '100vw'; img.srcset = it.srcset; }      // srcset antes do src
    img.src = it.url;
    guarda(img, it.back, it.plate || it.label);
    const caixa = $('#vPic'); caixa.textContent = ''; caixa.append(img);
    $('#vTitle').textContent = it.cap || it.label || '';
    $('#vN').textContent = n > 1 ? `${tres(V.i + 1)} / ${tres(n)}` : '';
    $('#vLive').textContent = n > 1 ? `${it.cap || it.label}, ${V.i + 1} ${tx('lbOf')} ${n}` : (it.label || '');
    const um = n < 2;
    ['#vPrev', '#vNext', '#vPrevT', '#vNextT'].forEach(s => { $(s).hidden = um; });
    [-1, 1].forEach(d => { const v = V.lista[(V.i + d + n) % n]; if (v && v !== it) { const p = new Image(); p.src = v.url; } });
  }
  function passo(d) { const n = V.lista.length; if (n < 2) return; V.i = (V.i + d + n) % n; desenhaV(); }
  function openViewer(lista, i, quem) {
    viewerInit(); fill(V.el);
    V.lista = lista; V.i = i; V.quem = quem;
    $('#vHint').textContent = tx(matchMedia('(hover:none)').matches ? 'lightboxHintTouch' : 'lightboxHint');
    desenhaV();
    if (!V.el.open) V.el.showModal();
  }

  /* ================= A BARRA ================= lingua, tema, menu do telemovel */
  function setLang(l) {
    LANG = l;
    document.documentElement.lang = l;
    try { const u = new URL(location.href); u.searchParams.set('lang', l); history.replaceState(null, '', u); } catch (e) {}
    const k = stage.cur && stage.cur.p ? stage.cur.p.k : null;      // a peca que estava no palco
    feitas.forEach(n => desenha(n));
    const sec = seccaoAtual ? $('[data-sec="' + seccaoAtual + '"]') : null;
    const mesma = r => (k && r ? $$('.fr', r).find(b => b._it && b._it.p.k === k) : null);
    const b = mesma(sec) || mesma(document);
    const it = b ? b._it : (seccaoAtual && palcos[seccaoAtual] ? palcos[seccaoAtual]() : null);
    if (it) pick(it);
  }
  /* Os mesmos seis caminhos em todas as paginas, cada um para a sua pagina. Um
     caminho para a pagina onde ja se esta e so uma ancora (nao recarrega). */
  const AQUI = { home: 'index.html', trabalho: 'trabalho.html', projetos: 'projetos.html', loja: 'loja.html',
    comissoes: 'comissoes.html', sobre: 'sobre.html' }[PAG] || '';
  const NAV = [
    ['work', 'navWork', 'trabalho.html'], ['projects', 'navProjects', 'projetos.html'],
    ['shop', 'navShop', 'loja.html'], ['comm', 'navComm', 'comissoes.html'],
    ['about', 'navAbout', 'sobre.html'], ['contact', 'navContact', 'sobre.html#contact'],
  ];
  /* o caminho marcado na barra: o da pagina (na pagina de um projeto, Projetos);
     na pagina Sobre, Contacto quando se desce ate ao contacto. Na barra de baixo
     do telemovel nao ha Contacto (cabem cinco): la fica marcado o Sobre. */
  const NAVPAG = { trabalho: 'work', projetos: 'projects', projeto: 'projects', loja: 'shop', comissoes: 'comm', sobre: 'about' };
  const baixoMq = matchMedia('(max-width:820px)');
  const caminhoDe = sec => (PAG === 'sobre' && !baixoMq.matches && (sec === 'contact' || sec === 'foot') ? 'contact' : (NAVPAG[PAG] || ''));
  const marcaCaminho = c => $$('#nav a').forEach(a => a.setAttribute('aria-current', String(a.dataset.nav === c)));
  function liga(a, alvo) {
    const [pg, ancora] = alvo.split('#');
    if (pg === AQUI) a.setAttribute('href', '#' + (ancora || 'main')); else a.setAttribute('data-go', alvo);
    return a;
  }
  function barra() {
    const bar = $('#bar');
    if (!bar.firstChild) {
      const nav = h('nav', { class: 'nav', id: 'nav', 'data-ta': 'a11yNav' });
      NAV.forEach(([id, t, alvo]) => nav.append(liga(h('a', { 'data-nav': id }, [h('span', { 'data-t': t })]), alvo)));
      const lg = h('button', { class: 'tool', id: 'lang', type: 'button' });
      const tm = h('button', { class: 'tool', id: 'theme', type: 'button', 'data-ta': 'a11yTheme', text: '◐' });
      bar.append(
        h('div', { class: 'bar-a' }, [h('a', { class: 'brand', 'data-go': 'index.html' }, [
          h('img', { src: 'images/logo.svg', alt: '', width: 30, height: 30 }), h('span', { text: C.artistName })])]),
        h('div', { class: 'bar-b' }, [nav, lg, tm]));
      lg.addEventListener('click', () => setLang(LANG === 'pt' ? 'en' : 'pt'));
      tm.addEventListener('click', () => {
        const r = document.documentElement;
        r.dataset.theme = r.dataset.theme === 'light' ? 'dark' : 'light';
        /* a barra de estado do telemovel (e a do browser) com a cor do cimo da pagina */
        const m = $('meta[name="theme-color"]');
        if (m) m.setAttribute('content', getComputedStyle(r).getPropertyValue('--void').trim());
      });
      marcaCaminho(caminhoDe(''));
      baixoMq.addEventListener('change', () => marcaCaminho(caminhoDe(seccaoAtual)));
    }
    fill(bar);
    /* o titulo do separador, na lingua escolhida (<html data-titulo="chave">) */
    const tt = document.documentElement.dataset.titulo;
    if (tt && typeof tx(tt) === 'string') document.title = `${tx(tt)} · ${C.artistName}`;
    /* o nome do botao comeca pelas letras que mostra (quem dita "EN" ao telemovel acerta-lhe) */
    const lg = $('#lang');
    lg.textContent = LANG === 'pt' ? 'EN' : 'PT';
    lg.setAttribute('aria-label', lg.textContent + ', ' + tx('a11yLang'));
  }

  /* ================= QUE SECCAO ESTA A VISTA =================
     marca o caminho na barra e, no ecra largo, poe no palco a peca dessa seccao */
  const palcos = {};
  let seccaoAtual = '';
  /* A seccao "atual" e a que atravessa uma linha a 150px do cimo do ecra (logo
     abaixo da barra): e onde fica o titulo de uma seccao quando se chega a ela
     por um link. Com a linha a meio do ecra, uma seccao curta (as comissoes)
     aberta por um link ja contava como a seguinte.
     O fundo da pagina e um caso a parte: o rodape nunca chega a linha, por isso
     um ponto invisivel no seu fim diz quando o fundo esta a vista.
     Nenhum ouvinte de scroll: dois IntersectionObserver. */
  const LINHA = 150;
  function vigia() {
    const foot = $('#foot');
    const secs = $$('[data-sec]').filter(s => s !== foot);
    if (!secs.length || !('IntersectionObserver' in window)) return;
    let naLinha = '', fundo = false, io = null;
    const aplica = () => {
      const id = fundo && foot ? 'foot' : naLinha;
      if (!id || id === seccaoAtual) return;
      seccaoAtual = id;
      marcaCaminho(caminhoDe(id));
      const it = palcos[id] && palcos[id]();
      if (it && it !== stage.cur) { show(it, 'fade'); mark(it); }
    };
    const monta = () => {
      if (io) io.disconnect();
      const baixo = Math.max(0, window.innerHeight - LINHA - 2);
      io = new IntersectionObserver(es => {
        es.forEach(e => { if (e.isIntersecting) naLinha = e.target.dataset.sec; });
        aplica();
      }, { rootMargin: `-${LINHA}px 0px -${baixo}px 0px` });
      secs.forEach(s => io.observe(s));
    };
    monta();
    let espera = 0;
    window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(monta, 150); });
    if (foot) {
      const ponto = h('span', { class: 'fim', 'aria-hidden': 'true' });
      foot.append(ponto);
      new IntersectionObserver(es => { fundo = es[0].isIntersecting; aplica(); }).observe(ponto);
    }
  }

  /* ================= OS DESENHADORES ================= um por seccao */
  const R = {}, feitas = [];
  function desenha(n) { fill(document.getElementById(n)); if (R[n]) R[n](); }
  const S = { heroi: null, filtro: 'all', tudo: false };       // o que sobrevive a uma troca de lingua
  const preco = m => h('span', { class: 'price num' }, [document.createTextNode((m.from ? tx('fromPrefix') + ' ' : '') + m.price + ' '), h('small', { text: m.unit })]);
  const elenco = () => ({
    label: '', kind: 'deco', url: WEBP ? 'images/bg/cast-cut-1920.webp' : 'images/bg/cast-cut-1000.png',
    srcset: WEBP ? 'images/bg/cast-cut-1000.webp 1000w, images/bg/cast-cut-1920.webp 1920w' : '', back: 'images/bg/cast-cut-1000.png',
  });
  const selo = () => ({ label: '', kind: 'seal', url: 'images/logo.svg' });
  const merchVisivel = () => (C.shopOpen ? C.merch.filter(m => !m.hold && m.src) : []);
  /* a foto do merch segue a escolha (22 Nov 2026): o campo `foto` do CONFIG
     ("tshirt-{design}-{colour}") da o nome da foto de cada desenho e cor,
     em images/merch/ (e a miniatura dos botoes em images/merch/mini/). Sem
     `foto`, fica a foto unica, `src`. As escolhas por defeito sao as que o
     cartao ja traz marcadas: o primeiro valor de cada opcao sem `pick`. */
  const esc0 = m => { const e = {}; (m.opts || []).forEach(o => { e[o.k] = o.v.length === 1 || !o.pick ? o.v[0] : null; }); return e; };
  const fotoUrl = (m, e, mini) => !m.foto ? m.src
    : 'images/merch/' + (mini ? 'mini/' : '') + m.foto.replace(/\{(\w+)\}/g, (_, k) => String(e[k] || '').toLowerCase().replace(/\s+/g, '-')) + '.jpg';
  const rotulo = (m, e) => [tx('merchItems.' + m.key + '.name')].concat(
    !m.foto ? [] : (m.foto.match(/\{(\w+)\}/g) || []).map(x => x.slice(1, -1)).filter(k => (m.opts.find(o => o.k === k) || { v: [] }).v.length > 1).map(k => nomeValor(e[k]))).join(' · ');
  const foto = (m, e) => { e = e || esc0(m); return { label: rotulo(m, e), kind: 'photo', url: fotoUrl(m, e), plate: m.plate }; };

  R.bar = barra;

  /* ---- a abertura: o nome, o que faz, e as seis pecas do Flip ---- */
  let seis = [];
  function heroM(it) {
    const f = $('#heroM'); if (!f) return;
    let b = $('button', f);
    if (!b) { b = h('button', { type: 'button' }); f.append(b); b.addEventListener('click', () => { if (stage.cur && stage.cur.open) stage.cur.open(b); }); }
    b.setAttribute('aria-label', `${tx('stageOpen')}: ${it.label}`);
    const img = h('img', { alt: it.label, width: it.p.tw, height: it.p.th });
    img.sizes = '92vw'; img.srcset = it.srcset; img.src = it.p.thumb;
    guarda(img, it.p.thumbJpg, it.label);
    b.textContent = ''; b.append(img);
    const c = $('#heroCap'); if (c) { c.textContent = ''; c.append(h('span', { text: it.label }), h('span', { class: 'num dim', text: it.note ? it.note() : '' })); }
  }
  R.intro = () => {
    const nm = $('#heroName'); nm.textContent = ''; nm.setAttribute('aria-label', C.realName);
    C.realName.split(' ').forEach(w => nm.append(h('span', { text: w })));
    seis = C.heroArt.map(src => obra(src, (C.artworks.find(a => a.src === src) || {}).label || '', { hero: true }));
    if (S.heroi == null) {                 // a cada visita abre com a seguinte
      let i = 0;
      try { i = (parseInt(localStorage.getItem('gi-capa') || '-1', 10) + 1) % seis.length; localStorage.setItem('gi-capa', String(i)); } catch (e) {}
      S.heroi = i;
    }
    sheet($('#flip'), seis, { label: tx('heroPick'), eager: true });
    if (!R.intro.feito) {
      R.intro.feito = true;
      /* o browser comeca a descarregar a peca grande agora, enquanto ainda le o resto da pagina */
      const a = seis[S.heroi], pre = new Image();
      if (wide()) { pre.sizes = SIZES; pre.srcset = a.srcset; pre.src = a.url; } else { pre.src = a.p.thumb; }
    }
    pick(seis[S.heroi]);
    palcos.intro = () => seis[S.heroi];
  };

  /* ---- a parede: todas as obras, pela ordem do Frede ---- */
  R.work = () => {
    const todas = C.artworks.map(a => obra(a.src, a.label, { a }));
    const cats = Array.from(new Set(C.artworks.map(a => a.cat)));
    if (C.artworks.some(a => a.collab)) cats.push('collab');
    const cabe = it => S.filtro === 'all' || (S.filtro === 'collab' ? !!it.a.collab : it.a.cat === S.filtro);
    const box = $('#wall'), chips = $('#filters'), mais = $('#more'), conta = $('#count'), vazio = $('#wallEmpty');
    sheet(box, todas, { label: tx('galleryTitle'), list: () => todas.filter(cabe), titulos: true });
    const aplica = () => {
      const n = todas.filter(cabe).length;
      todas.forEach((it, i) => { it.btn.hidden = !cabe(it); it.btn.classList.toggle('extra', S.filtro === 'all' && i >= C.wallPreview); });
      box.classList.toggle('all', S.tudo || S.filtro !== 'all' || todas.length <= C.wallPreview);
      conta.textContent = S.filtro === 'all' ? String(todas.length) : `${n} / ${todas.length}`;
      vazio.hidden = n > 0;
      $$('.chip', chips).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.f === S.filtro)));
      const vis = todas.filter(cabe);
      if (vis.length && !vis.includes(marcada)) { const prim = vis[0]; $$('.fr', box).forEach(x => { x.tabIndex = x === prim.btn ? 0 : -1; }); }
    };
    chips.textContent = '';
    ['all'].concat(cats).forEach(f => chips.append(h('button', {
      class: 'chip', type: 'button', 'data-f': f, text: tx('filters.' + f),
      onclick: () => { S.filtro = f; aplica(); const v = todas.filter(cabe); if (v.length && wide()) pick(v[0]); },
    })));
    mais.textContent = tx('wallMore').replace('{n}', todas.length);
    mais.onclick = () => { S.tudo = true; aplica(); const p = todas[C.wallPreview]; if (p) p.btn.focus(); };
    aplica();
    palcos.work = () => { const v = todas.filter(cabe); return lembrada('work', v) || v[0]; };
  };

  /* ---- os projetos: o destacado primeiro; cada um com a sua serie ---- */
  const serie = (p, tp) => {
    const fontes = p.rows ? p.gallery : [p.src].concat(p.gallery || []);
    return fontes.map((src, i) => obra(src, fontes.length > 1 ? `${tp.title}, ${i + 1} ${tx('lbOf')} ${fontes.length}` : tp.title, { plate: p.plate, cap: tp.title }));
  };
  R.projects = () => {
    const box = $('#projs'); box.textContent = '';
    const ordem = C.projects.slice().sort((a, b) => (b.key === C.featured) - (a.key === C.featured));
    let primeira = null;
    ordem.forEach(p => {
      const tp = tx('projects.' + p.key); if (!tp) return;
      const itens = serie(p, tp);
      const capa = itens.find(it => it.p.k === pic(p.src).k) || itens[0];
      primeira = primeira || capa;
      const tira = h('div', { class: 'sheet strip' });
      const cm = h('img', { alt: '', loading: 'lazy', decoding: 'async', width: capa.p.tw, height: capa.p.th, src: capa.p.thumb });
      guarda(cm, capa.p.thumbJpg, p.plate);
      const art = h('article', { class: 'proj' + (p.key === C.featured ? ' feat' : ''), id: 'p-' + p.key }, [
        h('a', { class: 'proj-cover', href: go('projeto.html?p=' + p.key), 'aria-label': tp.title, tabindex: '-1' }, [cm]),
        h('p', { class: 'kicker', text: tp.kicker }),
        h('h3', { class: 'sub' }, [h('a', { href: go('projeto.html?p=' + p.key), text: tp.title })]),
        h('p', { class: 'proj-desc', text: tp.desc }),
        tira,
        h('p', { class: 'links' }, [
          h('a', { class: 'tl', href: go('projeto.html?p=' + p.key) }, [document.createTextNode(tx('openProject')), seta('→')]),
          p.link && tp.link ? h('a', { class: 'tl', href: p.link, target: '_blank', rel: 'noopener' }, [document.createTextNode(tp.link), seta('↗')]) : null,
        ]),
      ]);
      box.append(art);
      sheet(tira, itens, { label: `${tp.title}: ${tx('seriesOf')}` });
      /* apontar para o bloco de um projeto poe a capa dele no palco (se ja la esta uma peca dele, fica) */
      aponta(art, () => art, () => { if (!itens.includes(stage.cur)) pick(capa); });
    });
    palcos.projects = () => primeira;
  };


  /* ---- sobre: a carta e o percurso ---- */
  R.about = () => {
    /* no palco, a mesma peca que a pagina inicial mostrou nesta visita (so se le,
       nao avanca a vez: a seguinte e escolhida pela pagina inicial) */
    let i = 0;
    try { i = Math.max(0, parseInt(localStorage.getItem('gi-capa') || '0', 10) || 0) % C.heroArt.length; } catch (e) {}
    const peca = obra(C.heroArt[i], (C.artworks.find(a => a.src === C.heroArt[i]) || {}).label || '');
    peca.open = quem => openViewer([peca], 0, quem);
    palcos.about = () => peca;
    const c = $('#letter'); c.textContent = '';
    tx('aboutBody').forEach(p => c.append(h('p', { text: p })));
    const l = $('#tl'); l.textContent = '';
    const meses = tx('months');
    let proximo = true;
    C.timeline.forEach(e => {
      const te = tx('timeline.' + e.key); if (!te) return;
      const fut = e.status === 'upcoming';
      const quando = (e.month ? meses[e.month - 1] + ' ' : '') + e.year;
      l.append(h('li', { class: 'tl-row' + (fut ? ' up' : '') }, [
        h('div', {}, [
          h('p', { class: 'tl-title' }, [document.createTextNode(te.title + ' '), fut ? h('span', { class: 'badge', text: tx(proximo ? 'tlNext' : 'tlUpcoming') }) : null]),
          h('p', { class: 'tl-where', text: te.where }),
          h('p', { class: 'tl-desc', text: te.desc }),
        ]),
        h('p', { class: 'tl-date num', text: quando }),
      ]));
      if (fut) proximo = false;
    });
  };

  /* ---- contacto ---- */
  R.contact = () => {
    palcos.contact = selo;                 // o contacto e o rodape partilham o selo
    const m = $('#mail'); m.textContent = C.email; m.href = 'mailto:' + C.email;
    const cp = $('#copy');
    cp.onclick = () => {
      const feito = () => { cp.textContent = tx('copied'); setTimeout(() => { cp.textContent = tx('copyEmail'); }, 1600); };
      const mao = () => { const r = document.createRange(); r.selectNodeContents(m); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(C.email).then(feito, mao); else mao();
    };
    const cs = $('#cells'); cs.textContent = '';
    [{ label: 'Instagram', url: C.instagram }].concat(C.otherLinks).forEach(l => {
      if (!l.url || l.url === '#') return;
      cs.append(h('a', { class: 'cell', href: l.url, target: '_blank', rel: 'noopener me' }, [document.createTextNode(l.label), seta('↗')]));
    });
  };

  /* ---- o rodape ---- */
  R.foot = () => {
    const f = $('#foot');
    if (!f.firstChild) {
      const menu = h('nav', { class: 'foot-menu', 'aria-label': C.artistName });
      NAV.forEach(([id, t, alvo]) => menu.append(liga(h('a', { 'data-t': t }), alvo)));
      const fora = (id, filhos) => h('a', { id, target: '_blank', rel: 'noopener' }, filhos.concat(seta('↗')));
      const nota = h('p', { class: 'foot-note' }, [h('span', { id: 'footY' }), h('span', { 'data-t': 'footerNote' })]);
      f.append(menu);
      if (PAG !== 'sobre') f.append(h('p', { class: 'foot-mail' }, [h('span', { 'data-t': 'contactTitle' }), document.createTextNode(' · '),
        h('a', { id: 'footMail', href: 'mailto:' + C.email, text: C.email })]));
      /* as paginas onde se vende levam o Livro de Reclamacoes (obrigatorio por lei) e o Instagram */
      if (PAG === 'loja' || PAG === 'comissoes') f.append(h('p', { class: 'foot-note foot-links' }, [
        fora('footLR', [h('span', { 'data-t': 'footComplaints' })]), fora('footIg', [document.createTextNode('Instagram')])]));
      f.append(nota);
    }
    fill(f);
    $('#footY').textContent = `© ${new Date().getFullYear()} ${C.artistName} · ${C.realName}`;
    const lr = $('#footLR'); if (lr) lr.href = C.livroReclamacoes;
    const ig = $('#footIg'); if (ig) ig.href = C.instagram;
    palcos.foot = selo;
  };

  /* ---- dados estruturados (Google): os formatos sem preco; a galeria sem ofertas ---- */
  R.ld = () => {
    const el = $('#ldPerson');
    if (el) {
      let d = null; try { d = JSON.parse(el.textContent); } catch (e) {}
      if (d) {
        const nomes = C.i18n.en.tiers;                                // o schema fica sempre em EN
        d.makesOffer = C.tiers.map(x => ({
          '@type': 'Offer', name: `${nomes[x.key] ? nomes[x.key].name : x.key} commission`,
          availability: C.commissionsOpen ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        }));
        el.textContent = JSON.stringify(d, null, 2);
      }
    }
    if (PAG !== 'trabalho') return;                                 // a galeria vive na pagina das obras
    const can = $('link[rel="canonical"]');
    const base = (can ? can.href : location.href).replace(/[^/]*$/, '');
    const abs = p => (/^https?:\/\//i.test(p) ? p : base + p.replace(/^\//, ''));
    const eu = { '@type': 'Person', name: C.realName, alternateName: C.artistName };
    const g = {
      '@context': 'https://schema.org', '@type': 'ImageGallery', name: `${C.artistName} · ${C.i18n.en.galleryTitle}`,
      url: can ? can.href : location.href, author: eu,
      associatedMedia: C.artworks.map(a => {
        const p = pic(a.src);
        const o = { '@type': 'ImageObject', name: a.label, contentUrl: abs(p.jpg), thumbnailUrl: abs(p.thumbJpg), creator: eu };
        if (p.w) { o.width = p.w; o.height = p.h; }
        return o;
      }),
    };
    let s = $('#ldGallery');
    if (!s) { s = h('script', { type: 'application/ld+json', id: 'ldGallery' }); document.head.append(s); }
    s.textContent = JSON.stringify(g);
  };

  /* ================= A PAGINA DE UM PROJETO ================= */
  R.proj = () => {
    const key = qs.get('p');
    const p = C.projects.find(x => x.key === key), tp = p && tx('projects.' + key);
    const box = $('#series'); box.textContent = '';
    $('#projLinks').textContent = '';
    if (!p || !tp) {
      $('#projKicker').textContent = ''; $('#projDesc').textContent = '';
      $('#projTitle').textContent = tx('projNotFound');
      $('#projCover').hidden = true; $('#seriesBlock').hidden = true;
      R.others(null);
      stage.cur = null; show(selo(), 'now');
      return;
    }
    $('#projKicker').textContent = tp.kicker;
    $('#projTitle').textContent = tp.title;
    $('#projDesc').textContent = tp.desc;
    if (p.link && tp.link) $('#projLinks').append(h('a', { class: 'btn fill', href: p.link, target: '_blank', rel: 'noopener' }, [document.createTextNode(tp.link), seta('↗')]));
    const itens = serie(p, tp);
    const capa = itens.find(it => it.p.k === pic(p.src).k) || itens[0];
    sheet(box, itens, {
      label: `${tp.title}: ${tx('seriesOf')}`,
      grupos: p.rows ? p.rows.map(r => ({ label: tx('deckRows.' + r[0]), n: r[1] })) : null,
    });
    box.className = p.rows ? 'groups' : 'sheet big';
    /* no telemovel nao ha palco: a capa vai inteira no cimo da pagina. So no
       baralho, que tem a serie em filas (o As de Copas volta a aparecer na fila
       de Copas, de proposito); nos outros a capa ja e a primeira da serie, em
       grande, e por cima seria a mesma imagem duas vezes seguidas. */
    const cf = $('#projCover'); cf.hidden = !p.rows; cf.textContent = '';
    const ci = h('img', { alt: capa.label, width: capa.p.tw, height: capa.p.th });
    ci.sizes = '92vw'; ci.srcset = capa.srcset; ci.src = capa.p.thumb;
    guarda(ci, capa.p.thumbJpg, p.plate);
    cf.append(h('button', { type: 'button', 'aria-label': `${tx('stageOpen')}: ${capa.label}`, onclick: e => capa.open(e.currentTarget) }, [ci]));
    R.others(key);
    /* o titulo e o cartao de partilha desta pagina */
    document.title = `${tp.title} · ${C.artistName}`;
    const meta = (s, v) => { const m = $(s); if (m) m.setAttribute('content', v); };
    const can = $('link[rel="canonical"]');
    const url = (can ? can.href.replace(/\?.*$/, '') : location.href.replace(/\?.*$/, '')) + '?p=' + key;
    meta('meta[name="description"]', tp.desc);
    meta('meta[property="og:title"]', `${tp.title} · ${C.artistName}`);
    meta('meta[property="og:description"]', tp.desc);
    meta('meta[property="og:url"]', url);
    meta('meta[property="og:image"]', url.replace(/[^/]*$/, '') + pic(p.src).jpg);
    if (can) can.href = url;
    pick(lembrada('proj', itens) || capa);
    palcos.proj = () => lembrada('proj', itens) || capa;
  };
  R.others = key => {
    const box = $('#others'); if (!box) return; box.textContent = '';
    C.projects.filter(x => x.key !== key).forEach(x => {
      const t = tx('projects.' + x.key); if (!t) return;
      const c = pic(x.src);
      const im = h('img', { alt: '', loading: 'lazy', decoding: 'async', width: 40, height: 40, src: c.mini, style: 'object-fit:contain' });
      guarda(im, c.thumbJpg, x.plate);
      box.append(h('a', { class: 'row', href: go('projeto.html?p=' + x.key) }, [
        h('span', { class: 'row-a' }, [im, h('span', { text: t.title })]), h('span', { class: 'row-b', text: t.kicker }),
      ]));
    });
  };

  /* ================= A LOJA ================= o cesto e o checkout: a mesma logica do site atual */
  const VARIANTES = {};
  C.merch.forEach(m => {
    if (!m.variants || m.hold) return;
    m.variants.forEach((id, i) => {
      const valores = [];
      for (let o = m.opts.length - 1, r = i; o >= 0; o--) { const n = m.opts[o].v.length; valores[o] = m.opts[o].v[r % n]; r = Math.floor(r / n); }
      VARIANTES[id] = { m, valores };
    });
  });
  function idDe(m, escolhas) {
    let i = 0;
    m.opts.forEach((o, k) => { i = i * o.v.length + o.v.indexOf(escolhas[k]); });
    return m.variants[i];
  }
  /* fica no browser de quem visita dois dias; tudo em try/catch (janela privada) */
  const CHAVE = 'gi-cesto', VALIDADE = 2 * 864e5;
  let cesto = (() => {
    try {
      const g = JSON.parse(localStorage.getItem(CHAVE) || 'null');
      if (!g || Date.now() - g.t > VALIDADE) return [];
      return g.itens.filter(x => VARIANTES[x.id] && x.q > 0).map(x => ({ id: x.id, q: Math.min(x.q, 10) }));
    } catch (e) { return []; }
  })();
  const guardaCesto = () => { try { localStorage.setItem(CHAVE, JSON.stringify({ t: Date.now(), itens: cesto })); } catch (e) {} };
  function junta(id) {
    const l = cesto.find(x => x.id === id);
    if (l) l.q = Math.min(l.q + 1, 10); else cesto.push({ id, q: 1 });
    guardaCesto(); R.cesto();
  }
  function muda(id, d) {
    const l = cesto.find(x => x.id === id); if (!l) return;
    l.q = Math.min(l.q + d, 10);
    if (l.q < 1) cesto = cesto.filter(x => x !== l);
    guardaCesto(); R.cesto();
  }
  const linkCheckout = () => `${C.shop}/cart/` + cesto.map(x => `${x.id}:${x.q}`).join(',');
  const nomeValor = v => tx('optValues')[v] || v;

  R.lojaHead = () => {
    $('#shopDrop').textContent = C.shopDrop;
    $('#shopDrop').hidden = !C.shopOpen;
  };
  R.merch = () => {
    const box = $('#prods'); box.textContent = '';
    const io = ('IntersectionObserver' in window) ? new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && e.target._foto && e.target._foto.label !== (stage.cur || {}).label) show(e.target._foto, 'fade');
    }), { rootMargin: '-45% 0px -50% 0px' }) : null;
    merchVisivel().forEach(m => {
      const t = tx('merchItems.' + m.key), e0 = esc0(m), f = foto(m, e0);
      const msg = h('p', { class: 'msg', role: 'status' });
      const minis = [];                       // [img, desenho]: as miniaturas dos botoes do desenho
      const campos = m.opts.filter(o => o.v.length > 1).map(o => {
        const fs = h('fieldset', { class: 'opt', 'data-k': o.k }, [h('legend', { text: tx('optNames.' + o.k) + (o.pick ? ` (${tx('pickOne').toLowerCase()})` : '') })]);
        const comFoto = m.foto && o.k === 'design';
        const linha = h('div', { class: 'chips' + (comFoto ? ' with-img' : '') });
        o.v.forEach((v, i) => {
          let mi = null;
          if (comFoto) {
            mi = h('img', { class: 'chip-img', alt: '', width: 40, height: 40, loading: 'lazy', decoding: 'async', src: fotoUrl(m, { ...e0, design: v }, true) });
            mi.addEventListener('error', () => mi.remove());
            minis.push([mi, v]);
          }
          linha.append(h('label', { class: 'chip' + (comFoto ? ' chip-pic' : '') }, [
            h('input', { type: 'radio', name: `${m.key}-${o.k}`, value: v, checked: !o.pick && i === 0 }), mi, document.createTextNode(nomeValor(v)),
          ]));
        });
        fs.append(linha); return fs;
      });
      const bt = h('button', { class: 'btn fill', type: 'button', text: tx('addToBag') });
      const fotoM = h('img', { class: 'prod-photo', alt: f.label, loading: 'lazy', decoding: 'async', width: m.foto ? 1000 : m.w, height: m.foto ? 1000 : m.h, src: f.url });
      guarda(fotoM, null, m.plate);
      const art = h('article', { class: 'prod', id: m.key }, [
        h('div', { class: 'prod-head' }, [
          h('h2', { class: 'sub' }, [document.createTextNode(t.name + ' '), m.preorder ? h('span', { class: 'badge', text: tx('shopPreorder') }) : null]), preco(m)]),
        fotoM, h('p', { class: 'prod-desc', text: t.desc }),
      ].concat(campos, [h('div', { class: 'buy' }, [bt, msg])]));
      bt.addEventListener('click', () => {
        let falta = null;
        const escolhas = m.opts.map(o => {
          if (o.v.length === 1) return o.v[0];
          const c = $(`input[name="${m.key}-${o.k}"]:checked`, art);
          if (!c && !falta) falta = $(`input[name="${m.key}-${o.k}"]`, art);
          return c ? c.value : null;
        });
        if (falta) { msg.className = 'msg bad'; msg.textContent = tx('pickMissing'); falta.focus(); return; }
        junta(idDe(m, escolhas));
        msg.className = 'msg'; msg.textContent = `${t.name} ${tx('addedLive')}`;
        bt.textContent = tx('added'); setTimeout(() => { bt.textContent = tx('addToBag'); }, 1400);
      });
      art._foto = f;
      /* escolher o desenho ou a cor troca a foto do cartao, as miniaturas (que
         seguem a cor) e, no computador, o palco. Sem animacao: e um gesto que
         se repete. A foto nova so entra depois de descodificada, para o cartao
         nunca ficar vazio; o `vez` deita fora uma resposta que chegue tarde. */
      let vez = 0;
      art.addEventListener('change', () => {
        if (!m.foto) return;
        const e = esc0(m);
        m.opts.forEach(o => { const c = $(`input[name="${m.key}-${o.k}"]:checked`, art); if (c) e[o.k] = c.value; });
        const nova = foto(m, e);
        minis.forEach(([mi, v]) => { const u = fotoUrl(m, { ...e, design: v }, true); if (mi.getAttribute('src') !== u) mi.src = u; });
        if (nova.url !== art._foto.url) {       // so uma foto nova cancela a anterior: escolher o tamanho nao muda a foto
          const minha = ++vez, pre = new Image(); pre.src = nova.url;
          const poe = () => { if (minha === vez) { fotoM.src = nova.url; fotoM.alt = nova.label; } };
          (pre.decode ? pre.decode() : Promise.resolve()).then(poe, poe);
        }
        art._foto = nova;
        if (wide() && (stage.cur || {}).url !== nova.url) show(nova);
      });
      aponta(art, () => art, () => show(art._foto));
      art.addEventListener('focusin', () => show(art._foto));
      box.append(art);
      if (io) io.observe(art);
    });
    const todo = $('#shopAll'); if (todo) todo.href = C.shop + '/collections/' + C.merchCollection;
    $('#merch').hidden = !merchVisivel().length;
    palcos.loja = () => { const m = merchVisivel()[0]; return m ? foto(m) : elenco(); };
  };
  R.cesto = () => {
    const box = $('#bagLines'); if (!box) return; box.textContent = '';
    let total = 0, pecas = 0;
    cesto.forEach(x => {
      const v = VARIANTES[x.id], t = tx('merchItems.' + v.m.key);
      const desc = v.valores.map(nomeValor).join(' / ');
      total += Number(v.m.price) * x.q; pecas += x.q;
      const q = (d, ta, g) => h('button', { type: 'button', 'aria-label': `${tx(ta)}: ${t.name}, ${desc}`, text: g, onclick: () => muda(x.id, d) });
      box.append(h('li', { class: 'bag-line' }, [
        h('p', {}, [document.createTextNode(t.name), h('small', { text: desc })]),
        h('span', { class: 'qty' }, [q(-1, x.q > 1 ? 'qtyLess' : 'remove', '−'), h('span', { class: 'num', text: String(x.q) }), q(1, 'qtyMore', '+')]),
        h('span', { class: 'price num' }, [document.createTextNode(Number(v.m.price) * x.q + ' '), h('small', { text: v.m.unit })]),
      ]));
    });
    const tem = cesto.length > 0;
    $('#bagEmpty').hidden = tem; $('#bagSum').hidden = !tem;
    $('#bagTotal').textContent = total + ' €';
    $('#checkout').href = tem ? linkCheckout() : '#cesto';
    const fab = $('#fab');
    fab.textContent = `${tx('bagShort')} · ${pecas}`;
    fab.dataset.n = pecas;
    fab.classList.toggle('on', tem && !R.cesto.aVista);
  };
  R.comissoes = () => {
    const b = $('#commBadge');
    b.textContent = tx(C.commissionsOpen ? 'commOpen' : 'commClosed');
    b.classList.toggle('off', !C.commissionsOpen);
    const l = $('#tiers'); l.textContent = '';
    C.tiers.forEach(x => { const t = tx('tiers.' + x.key); if (t) l.append(h('li', { class: 'tier' }, [h('h3', { text: t.name }), h('p', { text: t.desc })])); });
    const a = $('#commCta');
    a.href = `mailto:${C.email}?subject=${encodeURIComponent(tx('mailSubject'))}&body=${encodeURIComponent(tx('mailBody'))}`;
    a.hidden = !C.commissionsOpen;
    const m = $('#commMail'); m.textContent = C.email; m.href = 'mailto:' + C.email;
    palcos.comissoes = elenco;
  };
  function lojaVigia() {
    const bag = $('#cesto'); if (!bag || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(es => { R.cesto.aVista = es[0].isIntersecting; $('#fab').classList.toggle('on', cesto.length > 0 && !R.cesto.aVista); }).observe(bag);
  }

  /* ================= AS IMAGENS NAO SE GUARDAM COM UM CLIQUE =================
     (17 Nov 2026, pedido do Frede.) Impossivel de todo nao e: o que aparece no
     ecra ja esta no computador de quem visita, e uma captura de ecra funciona
     sempre. Isto tira os caminhos faceis: o "Guardar imagem como" do botao
     direito e arrastar a imagem para fora da pagina (o "Guardar" do toque longo
     sai no site.css). So nas imagens: no resto da pagina o botao direito
     continua normal (copiar o email, abrir um link noutro separador). */
  const eImagem = e => e.target instanceof HTMLImageElement;
  document.addEventListener('contextmenu', e => { if (eImagem(e)) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (eImagem(e)) e.preventDefault(); });

  /* ================= PARA AS PAGINAS ================= */
  window.GI = {
    /* desenha uma seccao acabada de ler */
    r(n) { if (!feitas.includes(n)) feitas.push(n); desenha(n); },
    /* o fim da pagina: o palco, o vigia das seccoes */
    fim() {
      stageInit(); if (stage.el) this.r('stage');
      /* se nenhuma seccao pos nada no palco, fica a peca da primeira seccao que tiver uma */
      if (!stage.cur) { const p = $$('[data-sec]').map(x => palcos[x.dataset.sec]).find(Boolean); const it = p && p(); if (it) show(it, 'now'); }
      vigia(); lojaVigia(); R.ld();
    },
    /* a vista, para o verify.mjs */
    lang: () => LANG, linkCheckout, cesto: () => cesto.slice(), palco: () => stage.cur, pick, openViewer,
  };
})();

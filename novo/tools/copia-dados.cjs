#!/usr/bin/env node
/* copia-dados.cjs — volta a escrever o novo/dados.js a partir do site atual.

   PARA QUE SERVE
     Enquanto os dois sites existirem lado a lado, o site ATUAL e quem manda no
     conteudo (index.html e loja.html, o CONFIG de cada um). Este script le os
     dois, junta-os num so ficheiro e escreve o novo/dados.js, sem tocar numa
     palavra. Corre-o sempre que o conteudo do site atual mudar (arte nova,
     um texto, um preco do merch), e a seguir o novo/tools/imagens.py:

         node novo/tools/copia-dados.cjs
         python3 novo/tools/imagens.py

     O que o site novo tem A MAIS (sete textos e as filas do baralho) vive aqui
     em baixo, em `novo` e em `rows`. No fim o script prova que o ficheiro
     escrito diz o mesmo que as paginas atuais; se nao disser, para com erro.

     Se um dia o site novo substituir o atual, este script deixa de fazer
     sentido: apaga-se, e o dados.js passa a ser o unico sitio do conteudo. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const NOVO = path.dirname(__dirname), RAIZ = path.dirname(NOVO);
/* le o objeto `const CONFIG = {...}` de dentro de uma pagina do site atual */
function tira(file, name) {
  const s = fs.readFileSync(file, 'utf8');
  const i = s.indexOf('const ' + name + ' =') >= 0 ? s.indexOf('const ' + name + ' =') : s.indexOf('const ' + name + '=');
  if (i < 0) throw new Error('nao encontrei ' + name + ' em ' + file);
  let j = s.indexOf('{', i), d = 0, k = j, str = null;
  for (; k < s.length; k++) {
    const c = s[k];
    if (str) { if (c === '\\') { k++; continue; } if (c === str) str = null; continue; }
    if (c === '"' || c === "'" || c === '`') { str = c; continue; }
    if (c === '/' && s[k + 1] === '/') { k = s.indexOf('\n', k); continue; }
    if (c === '/' && s[k + 1] === '*') { k = s.indexOf('*/', k) + 1; continue; }
    if (c === '{') d++;
    if (c === '}') { d--; if (d === 0) break; }
  }
  return vm.runInNewContext('(' + s.slice(j, k + 1) + ')');
}
const I = tira(path.join(RAIZ, 'index.html'), 'CONFIG'), L = tira(path.join(RAIZ, 'loja.html'), 'CONFIG');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// os campos que as duas paginas partilham tem de ser iguais antes de os juntar
for (const k of ['artistName', 'realName', 'email', 'instagram', 'commissionsOpen', 'tiers', 'shopOpen']) if (!eq(I[k], L[k])) throw new Error('difere: ' + k);
const i18n = {};
for (const lang of ['en', 'pt']) {
  const a = I.i18n[lang], b = L.i18n[lang];
  for (const k in b) if (k in a && !eq(a[k], b[k])) throw new Error(`i18n difere (${lang}): ${k}`);
  i18n[lang] = { ...a, ...b };
}
const novo = {
  en: { stageLabel: 'Selected piece', stageOpen: 'View larger', projNotFound: 'Project not found',
        otherProjects: 'Other projects', seriesOf: 'Pieces in this project', a11ySkipContent: 'Skip to content',
        deckRows: { back: 'Card back', spades: 'Spades', hearts: 'Hearts', diamonds: 'Diamonds', clubs: 'Clubs', jokers: 'Jokers' } },
  pt: { stageLabel: 'Peça escolhida', stageOpen: 'Ver maior', projNotFound: 'Projeto não encontrado',
        otherProjects: 'Outros projetos', seriesOf: 'Peças deste projeto', a11ySkipContent: 'Saltar para o conteúdo',
        deckRows: { back: 'Verso', spades: 'Espadas', hearts: 'Copas', diamonds: 'Ouros', clubs: 'Paus', jokers: 'Jokers' } },
};
for (const lang of ['en', 'pt']) for (const k in novo[lang]) { if (k in i18n[lang]) throw new Error('chave nova ja existe: ' + k); i18n[lang][k] = novo[lang][k]; }
const projects = JSON.parse(JSON.stringify(I.projects));
projects.find(p => p.key === 'deck').rows = [['back', 1], ['spades', 5], ['hearts', 5], ['diamonds', 5], ['clubs', 5], ['jokers', 2]];

const id = k => /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
function js(v, ind = 0, width = 104) {
  const pad = '  '.repeat(ind);
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  const one = Array.isArray(v) ? '[' + v.map(x => js(x, 0, 1e9)).join(', ') + ']'
    : '{ ' + Object.entries(v).map(([k, x]) => id(k) + ': ' + js(x, 0, 1e9)).join(', ') + ' }';
  if (one.length + pad.length <= width) return Array.isArray(v) && !v.length ? '[]' : (Object.keys(v).length ? one : '{}');
  if (Array.isArray(v)) return '[\n' + v.map(x => pad + '  ' + js(x, ind + 1, width)).join(',\n') + '\n' + pad + ']';
  return '{\n' + Object.entries(v).map(([k, x]) => pad + '  ' + id(k) + ': ' + js(x, ind + 1, width)).join(',\n') + '\n' + pad + '}';
}
const lines = (arr, ind) => '[\n' + arr.map(x => '  '.repeat(ind + 1) + js(x, 0, 1e9)).join(',\n') + '\n' + '  '.repeat(ind) + ']';
const merch = L.merch.map(m => { const { variants, ...r } = m; return { r, variants }; });
const out = `/* dados.js — o CONTRATO do site novo. Tudo o que o site diz e mostra vive aqui:
   textos (EN e PT), a lista de obras, os projetos, o percurso, os formatos de
   comissao e o merch. As tres paginas leem este ficheiro; ja nao ha copias
   para manter iguais.

   Copiado a 15 Nov 2026 do CONFIG do index.html e do loja.html do site atual,
   por script, sem tocar numa palavra. O que e novo esta marcado com "NOVO".

   As regras do CLAUDE.md, seccao 9, valem aqui tal e qual: fan art nunca se
   vende, nenhuma localizacao, nenhum preco de comissao, nada inventado, EN e
   PT sempre a par, nenhum travessao longo no texto. */
window.CONFIG = {
  artistName: ${js(I.artistName)},
  realName: ${js(I.realName)},
  email: ${js(I.email)},
  instagram: ${js(I.instagram)},
  /* os links do fundo da pagina, alem do Instagram */
  otherLinks: ${lines(I.otherLinks, 1)},

  /* ---------- COMISSOES ---------- sem precos, nunca (CLAUDE.md 9.4) */
  commissionsOpen: ${js(I.commissionsOpen)},
  tiers: ${lines(I.tiers, 1)},

  /* ---------- A LOJA ---------- */
  shopOpen: ${js(I.shopOpen)},
  shop: ${js(L.shop)},
  shopDrop: ${js(L.shopDrop)},
  merchCollection: ${js(L.merchCollection)},
  livroReclamacoes: ${js(L.livroReclamacoes)},
  /* hold:true = existe no Shopify mas nao esta publicado: nao aparece.
     variants = os IDs do Shopify por ordem cartesiana das opts (a ultima opcao
     muda mais depressa). Sao copias: se a Printful voltar a sincronizar um
     produto, e preciso ir busca-los outra vez. */
  merch: [
${merch.map(({ r, variants }) => '    { ' + Object.entries(r).map(([k, x]) => id(k) + ': ' + js(x, 0, 1e9)).join(', ') +
  (variants ? ',\n      variants: [' + variants.map((v, i) => (i && i % 6 === 0 ? '\n        ' : '') + JSON.stringify(v)).join(', ').replace(/, \n/g, ',\n') + '] }' : ' }')).join(',\n')}
  ],

  /* ---------- AS OBRAS ---------- a ordem e a da parede, escolhida pelo Frede.
     cat: character | fanart | sketches. collab:true soma-se a categoria. */
  wallPreview: ${js(I.wallPreview)},
  heroArt: ${js(I.heroArt, 1, 80)},
  artworks: ${lines(I.artworks, 1)},

  /* ---------- OS PROJETOS ---------- src = a capa; gallery = o resto da serie.
     NOVO: rows (so no baralho) diz como a serie se arruma em filas: o verso,
     os quatro naipes (As, 2, Valete, Dama, Rei) e os dois Jokers. */
  featured: ${js(I.featured)},
  projects: [
${projects.map(p => { const { gallery, rows, ...r } = p; return '    { ' + Object.entries(r).map(([k, x]) => id(k) + ': ' + js(x, 0, 1e9)).join(', ') + ',\n      gallery: ' + js(gallery, 3, 100) + (rows ? ',\n      rows: ' + js(rows, 0, 1e9) : '') + ' }'; }).join(',\n')}
  ],

  /* ---------- O PERCURSO ---------- */
  timeline: ${lines(I.timeline, 1)},

  /* ---------- OS TEXTOS ---------- cada chave existe nas duas linguas */
  i18n: {
    en: ${js(i18n.en, 2, 118)},
    pt: ${js(i18n.pt, 2, 118)}
  }
};
`;
fs.writeFileSync(path.join(NOVO, 'dados.js'), out);
// prova: o ficheiro escrito diz o mesmo que as paginas atuais
const w = {}; vm.runInNewContext(out, { window: w }); const N = w.CONFIG;
const chk = (n, c) => { if (!c) throw new Error('nao bate: ' + n); };
for (const k of ['artistName', 'realName', 'email', 'instagram', 'otherLinks', 'commissionsOpen', 'tiers', 'shopOpen', 'wallPreview', 'heroArt', 'artworks', 'featured', 'timeline']) chk(k, eq(N[k], I[k]));
for (const k of ['shop', 'shopDrop', 'merchCollection', 'livroReclamacoes', 'merch']) chk(k, eq(N[k], L[k]));
chk('projects', eq(N.projects.map(({ rows, ...p }) => p), I.projects));
for (const lang of ['en', 'pt']) { for (const k in I.i18n[lang]) chk(lang + '.' + k, eq(N.i18n[lang][k], I.i18n[lang][k])); for (const k in L.i18n[lang]) chk(lang + '.' + k, eq(N.i18n[lang][k], L.i18n[lang][k])); }
console.log('dados.js:', out.split('\n').length, 'linhas;', Object.keys(N.i18n.en).length, 'chaves EN,', Object.keys(N.i18n.pt).length, 'PT; tudo igual ao site atual');

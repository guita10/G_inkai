# Mapa do site

O site desenhado como um mapa de partes e das ligações entre elas, feito
com [graphify](https://github.com/safishamsi/graphify) (versão 0.9.108) a
13 Nov 2026, a pedido do Frede ("graphify", e depois "i would like the map
yes"). 230 partes, 453 ligações, 11 grupos. Nada aqui é servido: `docs/`
não entra no zip do Netlify.

| Ficheiro | O que é |
| --- | --- |
| `mapa-do-site.html` | O mapa. Abre-se em qualquer browser, sem internet: a biblioteca que o desenha (vis-network 9.1.6, Apache-2.0 / MIT) vai dentro do ficheiro, conferida contra o hash que o graphify pedia. À direita: pesquisa, as ligações da parte em que se clica, e os grupos para ligar e desligar |
| `relatorio.md` | O resumo do graphify: os grupos, as partes mais ligadas, as que fazem de ponte entre grupos |
| `graph.json` | Os dados do mapa. Com o graphify instalado, respondem a perguntas sem reler o site: `graphify explain "artEl()" --graph docs/mapa/graph.json`, `graphify path "CONFIG, the contract" "renderWall()" --graph …`, `graphify query "…" --graph …` |
| `fonte/` | Os passos usados para o fazer (abaixo) |

## Como foi feito

- **O código** foi lido pelo próprio graphify, sem modelo: `tools/*.py`,
  `tools/verify.mjs` e o JavaScript das três páginas. Esse JavaScript vive
  dentro do HTML, que o graphify só lê como documento, por isso foi
  copiado para `index.inline.js`, `loja.inline.js` e `projeto.inline.js`
  (`fonte/extrai-scripts.py`). Esses ficheiros só existem na cópia de
  trabalho; no mapa aparecem com esses nomes.
- **As regras e os serviços** (as nove regras da secção 9, Shopify,
  Printful, Netlify, o Drive, o Notion, os quadros do Miro, as ideias
  guardadas) foram escritos pelo Claude a partir do `CLAUDE.md` e do
  `comissoes/README.md`, no formato do graphify (`fonte/semantica.py`).
  Cada ligação diz se está escrita na fonte (`EXTRACTED`) ou se foi
  deduzida (`INFERRED`).
- **Ficou de fora:** as imagens e as fontes; `DESIGN.md`, as críticas do
  Impeccable, as políticas e os emails (lê-los todos dobrava o custo para
  pouco ganho); as skills de terceiros em `.claude/`.
- O aviso de saúde do graphify (77 ligações a pontas que não existem) vem
  das bibliotecas de fora que os scripts usam (`hashlib`, `PIL`, `numpy`…):
  não fazem parte do site, e o graphify desenha-as como partes soltas.

## Fica desatualizado

O mapa não se atualiza sozinho: é uma fotografia do site a 13 Nov 2026.
Quando o site mudar muito, pede a uma sessão do Claude que o refaça. Os
passos, numa cópia de trabalho fora do repositório:

1. Instalar o graphify num ambiente à parte (`pip install graphifyy`).
2. Copiar os ficheiros do site sem imagens, fontes nem `.claude/`
   (`git ls-files` filtrado) para uma pasta de trabalho.
3. `fonte/extrai-scripts.py <pasta>`, a deteção e a leitura do código do
   graphify (`graphify.detect.detect`, `graphify.extract.extract`).
4. `fonte/semantica.py <pasta> graphify-out/.graphify_semantic.json`
   (rever primeiro se o `CLAUDE.md` mudou).
5. `fonte/constroi.py`, depois `fonte/nomeia.py` (os nomes dos grupos estão
   presos aos números dos grupos, que mudam a cada construção: escolher de
   novo), e `graphify export html`.
6. Pôr a biblioteca vis-network dentro do `graph.html` (vem do npm,
   `npm pack vis-network@9.1.6`), porque a rede da sessão não chega ao
   unpkg.com.

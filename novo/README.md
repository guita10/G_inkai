# O site novo

Uma versão nova do site, feita de raiz ao lado da atual, a pedido do Frede
(15 Nov 2026: "Review and create a new entire site from scratch and inspired
by the current one but do this separately. Use all the tool at your disposal
and be creative but maintain the same information").

**O site atual não foi tocado.** Continua na raiz do repositório e é ele que
está em `guitaink.com`. Esta pasta só vai para o ar se o Frede decidir.

## Uma página por parte (17 Nov 2026)

A primeira versão era uma página comprida, como o site atual. O Frede pediu
"different pages instead of an infinite scroll", e agora cada parte tem a
sua página, com o seu endereço:

| Página | O que tem | No palco |
| --- | --- | --- |
| `index.html`, o início | o nome, o que faz, os dois botões e as seis peças; por baixo, o rodapé com as seis páginas | a peça escolhida das seis |
| `trabalho.html` | a parede: as 37 obras e os filtros | a obra escolhida |
| `projetos.html` | os quatro projetos, o destacado primeiro, cada um com a sua série | a capa |
| `projeto.html?p=...` | um projeto (como antes; o "voltar" leva aos projetos) | a peça escolhida da série |
| `loja.html` | o merch e o cesto, e no fim o caminho para as comissões | a fotografia do produto |
| `comissoes.html` | os quatro formatos e o pedido por email | o elenco do Survival of Kings |
| `sobre.html` | a carta, o percurso e o contacto | uma das seis peças do início |

A barra é a mesma em todas, com as seis páginas, e marca aquela onde se
está. A informação é a mesma de antes, só mudou de sítio: nenhum texto saiu.

**Os endereços antigos continuam a funcionar.** `index.html#work`,
`#projects`, `#comm`, `#about`, `#timeline`, `#contact` e
`loja.html#comissoes` (que são também os do site atual) levam à página nova
dessa parte, com a língua que traziam.

## Como ver

Abre `novo/index.html` no browser, com dois cliques (do disco funciona tudo,
menos as letras da casa: o Chromium recusa-as fora de um servidor, e o site
atual tem o mesmo limite). Para ver com as letras certas, a partir da raiz:

    python3 -m http.server 8000

e abre `http://localhost:8000/novo/`.

## A ideia: o palco dividido

Em ecrã largo a página tem duas metades. À esquerda, a coluna que se lê; à
direita, **o palco**: um passe-partout com a altura do ecrã onde está sempre
uma peça, inteira. É o Flip que o Frede escolheu a 1 Nov 2026 (molduras
pequenas que põem uma peça no quadro grande), levado ao site todo:

- pousar o rato numa moldura (140 ms), focá-la com o teclado ou tocar nela
  põe essa peça no palco; clicar na que já lá está abre o visualizador;
- cada página põe no palco a sua peça (a tabela acima), e ao fundo de cada
  uma, no rodapé, fica o selo;
- a parede mostra as 37 obras de uma vez, em filas justificadas: cada moldura
  tem a proporção da sua imagem e nenhuma é cortada.

Abaixo de 1060px não há palco: é uma coluna só, com a peça da abertura num
quadro e as molduras a abrir o visualizador com um toque.

A direção veio do taste-skill (`draw.mjs --keep palette,type`, que deu três
composições; ficou a "split-stage"). Cinco coisas da folha dele foram
redesenhadas, porque chocavam com as regras da casa:

| O que a folha pedia | O que ficou | Porquê |
| --- | --- | --- |
| fotografias de arquivo ou de exemplo | só imagens do Frede | nada inventado (CLAUDE.md, 9.5) |
| imagens a encher a caixa (`cover`) | sempre inteiras (`contain`) | a arte nunca se corta |
| texto por cima de imagens | nenhum | a arte não é fundo |
| uma faixa de obras a correr | nenhuma | a arte não é decoração |
| um formulário de contacto | o email, como hoje | o site é estático, não envia nada |

## O que é igual ao site atual

- **Toda a informação.** Cada texto (EN e PT), as 37 obras e a sua ordem, os
  quatro projetos e as suas séries, o percurso, os quatro formatos de
  comissão, os quatro produtos com as suas opções, preços e IDs do Shopify, o
  email das comissões, o Livro de Reclamações. O `verify.mjs` compara campo a
  campo com o site atual e falha se alguma coisa diferir.
- **Os endereços**: `index.html`, `projeto.html?p=sok|tr|pamp|deck`,
  `loja.html`, `404.html` e `?lang=pt|en` são os mesmos; as âncoras antigas
  (`#work`, `#comissoes`…) levam às páginas novas. Há quatro páginas a mais:
  `trabalho.html`, `projetos.html`, `comissoes.html`, `sobre.html`.
- **A marca**: Midnight Black, Electric Cobalt e Acid Lime com os mesmos
  papéis, as duas letras japonesas, o selo 墨, os sete tamanhos de letra, os
  dois raios, nenhuma sombra. Abre escuro para toda a gente; o ◐ passa a claro.
- **As regras do Frede** (CLAUDE.md, secção 9): a fan art nunca se vende,
  nenhuma localização, ilustrador primeiro, nenhum preço nem condição de
  comissão, nada inventado, EN e PT a par, tudo parado com movimento
  reduzido, nenhum travessão.
- **Sem dependências**: nenhum framework, nenhum npm, nenhum passo de
  construção, nenhum pedido a outro servidor.
- **A loja**: o cesto vive na página, guarda-se dois dias, e só o pagamento
  sai para o checkout do Shopify. A lógica foi copiada tal e qual.

## O que mudou

| Antes | Agora |
| --- | --- |
| Uma página comprida com quase tudo, e mais duas | Uma página por parte (sete, mais o 404) |
| Quatro páginas, cada uma com a sua cópia das cores e do conteúdo; o `verify.mjs` vigia se as cópias ainda batem | Um `dados.js`, um `site.css`, um `site.js`, usados por todas as páginas. Não há cópias |
| O texto é escrito por um script no fim de uma página grande; reserva-se a altura de cada bloco no CSS para a página não saltar | Cada secção desenha-se no momento em que o browser a lê. Não há alturas reservadas e o salto medido é 0 |
| As obras em passe-partouts iguais (4:5), três por fila, doze à vista | Filas justificadas, cada moldura na proporção da obra, as 37 à vista (no telemóvel doze e um botão, como hoje) |
| A peça grande só existe na abertura | O palco acompanha a página toda |
| As miniaturas de 760px servem para tudo | Miniaturas de 360px para as folhas (`mini/`, 0,9 MB as 70); as de 760px e as grandes vão para o palco e o visualizador |
| O baralho de One Piece numa grelha corrida | O baralho em filas: o verso, os quatro naipes, os Jokers |
| As opções de um produto em caixas de escolha | Botões (um toque em vez de dois), o tamanho continua sem vir escolhido |
| O visualizador feito à mão | O `<dialog>` do browser: prende o foco e fecha com Esc sem código próprio |

## Duas coisas que são decisão do Frede

1. **O foco depois do visualizador.** Ao fechar, o foco e o palco ficam na
   peça onde se parou, não na que se abriu.
2. **O menu do telemóvel** aparece abaixo de 821px (hoje 620px): com seis
   caminhos, em português, a barra não cabia mais cedo.

(Havia uma terceira, a prateleira da loja com preços na página inicial.
Com as páginas separadas saiu: a página inicial é só a abertura, e o merch
está na página da loja, como no site atual.)

## Os ficheiros

    index.html      o início: a abertura e as seis peças
    trabalho.html   a parede das obras
    projetos.html   os projetos
    projeto.html    a página de um projeto (?p=...)
    loja.html       o merch e o cesto
    comissoes.html  os quatro formatos e o pedido
    sobre.html      a carta, o percurso e o contacto
    404.html        sozinha (tem as suas próprias cores; não usa mais nada)
                    (cada página é só a ordem das suas secções)
    dados.js        o CONTEÚDO: textos, obras, projetos, percurso, merch
    dims.js         as medidas de cada imagem (gerado, não se edita à mão)
    site.css        o ASPETO: cores, letras, as duas metades, os ecrãs pequenos
    site.js         o COMPORTAMENTO: o palco, as folhas, o visualizador, o cesto
    mini/           as miniaturas de 360px (geradas)
    images, fonts   atalhos para as pastas do site atual (não há cópias)
    tools/
      copia-dados.cjs  volta a escrever o dados.js a partir do site atual
      imagens.py       faz as miniaturas e o dims.js
      verify.mjs       os testes
      bugs-plantados.py  estraga uma cópia de propósito, para provar que os testes apanham

## Enquanto os dois sites existirem

O site atual é quem manda no conteúdo. Depois de qualquer mudança nele (arte
nova pelo `tools/add-artwork.py`, um texto, um preço do merch), a partir da
raiz:

    node novo/tools/copia-dados.cjs     # o conteúdo
    python3 novo/tools/imagens.py       # as miniaturas e as medidas
    node novo/tools/verify.mjs          # os testes

Os sete textos que só o site novo tem (o nome do palco, "Ver maior", "Outros
projetos", os nomes dos naipes…) vivem no `copia-dados.cjs`.

## Os testes

`node novo/tools/verify.mjs` abre o site num browser a sério e corre 192
verificações; sai com erro se alguma falhar. `--rapido` salta as medições em
linha lenta, `--so 3,6` corre só essas partes.

1. Ficheiros: o JavaScript, as imagens nos três tamanhos, as medidas contra
   os píxeis reais, EN e PT com as mesmas chaves, as regras da secção 9.
2. **A mesma informação**: campo a campo contra o site atual, e cada texto
   do site atual lido na página.
3. As páginas: em cada uma, a barra com as seis páginas (com a língua) e a
   sua marcada, o título do separador na língua escolhida, nenhum erro; o
   início curto; os endereços antigos a levar às páginas novas; o nome em
   duas linhas, o Flip (com rato, com teclado, e o caminho da moldura até à
   peça grande), a parede, os filtros, o visualizador, os projetos, o sobre,
   a troca de língua.
4. Telemóvel e larguras, em todas as páginas: de 320 a 1600px sem nada sair
   do ecrã, o menu, os botões com 44px, o contraste nos dois temas.
5. As páginas de projeto, nas duas línguas, e um endereço que não existe.
6. A loja e as comissões: o cesto, o checkout (T-shirt Monk / White / M =
   `60968526905678`), as comissões sem preços e com o Livro de Reclamações.
7. O tema, o movimento reduzido, o 404, a abertura do disco, os leitores de
   ecrã, e o salto de layout (CLS), também numa linha de 400 kbps.

Foram testados contra 21 bugs plantados de propósito (um preço numa
comissão, uma moldura a cortar a obra, um ID do Shopify trocado, um texto
diferente do site atual…) e apanharam os 21. Repete-se com
`python3 novo/tools/bugs-plantados.py . /tmp/plantado` (trabalha numa cópia
fora do repositório; uns 15 minutos).

Três coisas a sério apareceram a fazer os testes, e ficaram com teste próprio:

- com a folga da barra posta na página (`scroll-padding`), focar um botão da
  barra com o Tab puxava a página para cima; a folga passou para cada alvo;
- com o rato parado, as molduras que passavam por baixo dele ao rolar a
  página trocavam a peça do palco; agora só conta o rato a mexer-se;
- ao separar as páginas, os botões das opções da loja tinham 38px num ecrã
  de toque (o mínimo é 44px): o teste dos 44px passou a correr em todas as
  páginas, e encontrou-os.

## Se for para o ar

Não é automático, e pede uma conversa primeiro: o `novo/` usa atalhos para
`images/` e `fonts/`, por isso o zip faz-se a segui-los
(`cd novo && zip -r ../site-novo.zip . -x 'tools/*' README.md`); o Netlify
serve as páginas novas sem configuração nenhuma. Nesse dia o
`CLAUDE.md`, o `DESIGN.md` e o `tools/verify.mjs` do site atual têm de ser
reescritos para a forma nova. Até lá, os dois ficam lado a lado.

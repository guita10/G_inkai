# O site novo

Uma versão nova do site, feita de raiz ao lado da atual, a pedido do Frede
(15 Nov 2026: "Review and create a new entire site from scratch and inspired
by the current one but do this separately. Use all the tool at your disposal
and be creative but maintain the same information").

**Está no ar desde 18 Nov 2026.** O Frede arrastou o zip desta pasta para o
Netlify, e é ela que está em `guitaink.com`. O site antigo continua na raiz
do repositório e é de lá que vem o conteúdo (os textos, as obras); um zip
da raiz poria o site antigo de volta.

## Uma página por parte (17 Nov 2026)

A primeira versão era uma página comprida, como o site atual. O Frede pediu
"different pages instead of an infinite scroll", e agora cada parte tem a
sua página, com o seu endereço:

| Página | O que tem | No palco |
| --- | --- | --- |
| `index.html`, o início | o nome, o que faz, os dois botões e as seis peças; por baixo, o rodapé (no ecrã largo, com as seis páginas) | a peça escolhida das seis |
| `trabalho.html` | a parede: as 37 obras e os filtros | a obra escolhida |
| `projetos.html` | os quatro projetos, o destacado primeiro, cada um com a sua série | a capa |
| `projeto.html?p=...` | um projeto (como antes; o "voltar" leva aos projetos) | a peça escolhida da série |
| `loja.html` | o merch e o cesto, e no fim o caminho para as comissões | a fotografia do produto |
| `comissoes.html` | os quatro formatos e o pedido por email | o elenco do Survival of Kings |
| `sobre.html` | a carta, o percurso e o contacto | uma das seis peças do início |

A barra é a mesma em todas, com as seis páginas, e marca aquela onde se
está (no telemóvel vai para o fundo do ecrã: a secção a seguir). A informação é a mesma de antes, só mudou de sítio: nenhum texto saiu.

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

## No telemóvel (19 Nov 2026)

O Frede: "Gosto de como o site está no computador mas no telemóvel parece
confuso a nível de organização." Vi as sete páginas num ecrã de 390px como
quem visita, e eram quatro coisas. O ecrã largo não mudou.

| O que confundia | O que ficou |
| --- | --- |
| Não se via onde se estava. As seis páginas estavam atrás de um botão "Menu", e no fim de cada página vinha outra vez a mesma lista em letra grande (meio ecrã, igual em todas) | **Uma barra no fundo do ecrã** com as cinco páginas (Trabalho, Projetos, Loja, Comissões, Sobre), sempre à vista, ao alcance do polegar, com a página aberta marcada por uma linha. O botão "Menu" saiu. O rodapé deixou de repetir a lista e traz o email; o Contacto é o fim da página Sobre |
| A parede: com duas peças por fila, cada fila tinha a sua altura e a última ficava a meio; lia-se como uma pilha, e sem nomes | **Uma grelha certa**: molduras todas iguais (4:5), duas colunas, cada peça inteira dentro da sua e **o nome por baixo**. Lê-se da esquerda para a direita, de cima para baixo |
| Na página de um projeto a capa aparecia duas vezes seguidas (em cima, e outra vez a abrir a série) | A capa é a primeira da série, **em grande**, e as outras em grelha por baixo. (No baralho fica como estava: o Ás de Copas volta na fila de Copas de propósito) |
| Em "Outros projetos", o título partia-se em quatro linhas ("Tokyo / Revengers, / capas / reinterpretadas") por causa do texto ao lado | O título por cima, numa linha, e o que é por baixo |
| Na página dos projetos, o destacado trazia uma fila de nove miniaturas | Sai no telemóvel: a série inteira está na página do projeto |

E as coisas pequenas que fazem um site parecer feito para o telemóvel (a
skill mobile-native, de Emil Kowalski):

- um toque já não pinta um quadrado cinzento por cima do que se toca, e o
  clique sai logo, sem os 300 ms que o browser espera por um duplo toque;
- um botão ou um filtro já não fica "aceso" depois de tocado (o efeito do
  rato só existe onde há rato);
- carregar sem largar num botão não lhe seleciona o texto (o email continua
  a copiar-se);
- a barra de baixo fica acima da barrinha do iPhone, e com o telemóvel
  deitado nada fica debaixo do entalhe da câmara;
- com o visualizador aberto, a página por trás já não rola (um deslizar
  torto levava-a, e ao fechar estava-se noutro sítio);
- a barra de estado do telemóvel muda de cor com o ◐;
- ampliar com os dedos continua a funcionar.

**O que só se confirma num telemóvel a sério** (os testes correm num
Chromium a fingir de telemóvel, que não reproduz estas coisas): a barra de
baixo acima da barrinha do iPhone, o entalhe com o telemóvel deitado, o
clique sem espera, a página parada atrás do visualizador e a cor da barra de
estado. Abre o link de pré-visualização no iPhone e num Android, com o
telemóvel ao alto e deitado.

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

## A loja: a foto segue a escolha (22 Nov 2026)

O Frede: "fazer com que consigas ter um preview dos produtos com os design
diferentes… as imagens parecem muito básicas e pouco cativantes".

- Escolher o desenho ou a cor troca a foto do cartão e, no computador, a do
  palco, sem animação (é um gesto que se repete). A foto nova só entra depois
  de carregada, para o cartão nunca ficar vazio.
- Os botões do desenho levam uma miniatura da zona da estampa, na cor
  escolhida, com o nome por baixo.
- As fotos são as de `merch/` (as mesmas do Shopify), recortadas para a peça
  encher o quadro: o desenho aparece cerca de 1,3 vezes maior. Faz-as o
  `tools/merch-fotos.py`, para `images/merch/` (1000 px) e
  `images/merch/mini/` (160 px). O campo `foto` de cada produto, no CONFIG
  do `loja.html` da raiz, diz como se monta o nome a partir das escolhas.
- Continuam a ser desenhos. As fotografias realistas (a peça vestida,
  dobrada) vêm da Printful: o Frede gera-as lá e põe-as no Drive, em
  `Site [Imagens]/Loja (mockups da Printful)`; entram em `merch/` com os
  mesmos nomes e corre-se o `merch-fotos.py` outra vez.

## Duas coisas que são decisão do Frede

1. **O foco depois do visualizador.** Ao fechar, o foco e o palco ficam na
   peça onde se parou, não na que se abriu.
2. **A barra de baixo** aparece abaixo de 821px (o menu do site atual,
   abaixo de 620px): com seis caminhos, em português, a barra de cima não
   cabia mais cedo. Num tablet ao alto também há barra de baixo.

(Havia uma terceira, a prateleira da loja com preços na página inicial.
Com as páginas separadas saiu: a página inicial é só a abertura, e o merch
está na página da loja, como no site atual.)

## As imagens: guardá-las fica mais difícil (17 Nov 2026)

O Frede perguntou se era possível impedir quem visita de descarregar as
imagens. **Impossível de todo não é**: o que aparece no ecrã já está no
computador de quem visita, e uma captura de ecrã funciona sempre (no
Instagram e no ArtStation também). O que se fez, só no site novo:

1. **Sem "Guardar" com um gesto.** Nas imagens, o botão direito não abre o
   "Guardar imagem como", não se arrastam para fora da página, e no
   telemóvel carregar sem largar não oferece "Guardar" (`site.js` e
   `site.css`). No resto da página o botão direito fica normal: copiar o
   email, abrir um link noutro separador.
2. **O nome do Frede dentro de cada imagem.** O zip do site novo leva, em
   cada uma das 364 imagens, o autor e o copyright, nos campos que o Google
   Imagens e os programas de fotografia leem (EXIF e XMP): "Frederico Guita
   (Guita_Ink)" e "© Frederico Guita (Guita_Ink)". Sem mexer num píxel: a
   imagem não é comprimida outra vez, e o `tools/faz-zip.py` confirma-o
   imagem a imagem. Os ficheiros do repositório não mudam (são os mesmos do
   site atual); só as cópias que vão no zip levam o nome.
3. **Os robôs de IA mandados embora.** O `robots.txt` pede aos robôs que
   recolhem imagens para treinar inteligência artificial (OpenAI, Anthropic,
   Common Crawl, Google-Extended, Apple, ByteDance, Meta e outros) que não
   entrem, e cada página pede "noai, noimageai". Os conhecidos respeitam;
   nem todos o fazem. O Google e os outros motores de busca continuam a
   entrar, e o site aparece nas pesquisas como antes.

O que não se fez, de propósito: uma marca de água por cima das obras (a
regra da casa é que nada tapa a arte), camadas invisíveis por cima das
imagens, ou bloquear o botão direito na página toda (estragam o site e
contornam-se na mesma). A proteção a sério é o direito de autor, que é
automático: com a assinatura nas obras e o nome nos ficheiros, o Instagram,
a Etsy e sites parecidos tiram cópias roubadas quando se denunciam.

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
      faz-zip.py       o zip para o Netlify, com o nome do Frede dentro de cada imagem
      merch-fotos.py   as fotos da loja, uma por desenho e cor, e as miniaturas dos botões

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

`node novo/tools/verify.mjs` abre o site num browser a sério e corre 220
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
   do ecrã, a barra de baixo (cinco caminhos, cada palavra inteira, a página
   marcada, o fim da página livre), a parede em grelha com os nomes, o
   rodapé com o email, os botões com 44px, o contraste nos dois temas.
5. As páginas de projeto, nas duas línguas, e um endereço que não existe.
6. A loja e as comissões: o cesto, o checkout (T-shirt Monk / White / M =
   `60968526905678`), as comissões sem preços e com o Livro de Reclamações.
7. O tema, o movimento reduzido, o 404, a abertura do disco, os leitores de
   ecrã, e o salto de layout (CLS), também numa linha de 400 kbps.

Foram testados contra 33 bugs plantados de propósito (um preço numa
comissão, uma moldura a cortar a obra, um ID do Shopify trocado, um texto
diferente do site atual, o botão direito a guardar imagens outra vez, a
barra de baixo a tapar o fim da página, a capa de um projeto duas vezes…) e
apanharam os 33. Repete-se com
`python3 novo/tools/bugs-plantados.py . /tmp/plantado` (trabalha numa cópia
fora do repositório; uns 15 minutos).

Três coisas a sério apareceram a fazer os testes, e ficaram com teste próprio:

- com a folga da barra posta na página (`scroll-padding`), focar um botão da
  barra com o Tab puxava a página para cima; a folga passou para cada alvo;
- com o rato parado, as molduras que passavam por baixo dele ao rolar a
  página trocavam a peça do palco; agora só conta o rato a mexer-se;
- ao separar as páginas, os botões das opções da loja tinham 38px num ecrã
  de toque (o mínimo é 44px): o teste dos 44px passou a correr em todas as
  páginas, e encontrou-os;
- na barra de baixo, com cinco colunas iguais, "Commissions" (80px) não
  cabia na sua (78px, num ecrã de 390px): cada caminho passou a ter a
  largura da sua palavra, com o mesmo espaço a mais para todos.

## Pôr uma versão nova no ar

O zip faz-se com
`python3 novo/tools/faz-zip.py <pasta>`: segue os atalhos para `images/` e
`fonts/`, deixa de fora `tools/` e este README, e escreve o nome do Frede
em cada imagem. Para o testar, descompacta-o numa pasta vazia e corre
`node novo/tools/verify.mjs --pasta <essa pasta>`. O Netlify serve as
páginas novas sem configuração nenhuma: o Frede arrasta o zip para o
projeto `guita-ink` no Netlify (Deploys, a zona de largar ficheiros). Enviar
a partir de uma sessão do Claude pelo Netlify foi recusado pela verificação
de permissões da sessão (20 Nov 2026), por isso o zip vai para o Frede.

Para confirmar o que está no ar, compara os ficheiros do guitaink.com com
os do zip: o `site.css`, o `site.js` e o `dados.js` têm de ser iguais. Nas
páginas o Netlify reescreve os links escritos no HTML (`trabalho.html` passa
a `/trabalho`); é normal, e os dois endereços abrem a mesma página.

Falta ainda: o `CLAUDE.md`, o `DESIGN.md` e o `tools/verify.mjs` da raiz
descrevem o site antigo; um dia, se o Frede quiser, o site novo passa para a
raiz e eles são reescritos para a forma nova.

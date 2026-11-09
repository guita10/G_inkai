# Sistema de comissões

Três peças que trabalham juntas. Nenhuma delas vive no site: o site é estático
no Netlify, não tem servidor, e por isso não envia emails nem escreve no
Notion. O site só faz uma coisa — recolher o pedido.

```
   SITE                     NOTION                         GMAIL + DRIVE
   guitaink.com             Comissões — Guita_Ink
   ────────────             ─────────────────────          ─────────────
   Pedir uma comissão  ──►  📥 Pedido novo
   (mailto com as                  │
    perguntas certas)              │  arrastas o cartão = aceitaste
                                   ▼
                          Draft 0 — Esboço & Refs  ──►  partilha o PDF com
                                   │                     o email do cliente
                                   │                     e envia o email
                                   ▼
                          Onboarding enviado: hoje
```

## 1. O site

A secção de comissões (no `loja.html`, a página onde se vende; a página
inicial só tem uma faixa com o caminho para lá) mostra os **quatro formatos
e mais nada**. Sem preços,
sem fases, sem prazos, sem links para a loja. O botão abre um email já
preenchido com as perguntas de que preciso para dar um valor: formato,
personagem, referências, pose, cores, data e uso comercial.

Os preços saíram do site por completo, incluindo do JSON-LD que o Google lê.
Vivem em dois sítios, e só dois: o produto no Shopify e o PDF de onboarding.

## 2. O Notion

Base de dados **Comissões — Guita_Ink**. Quando chega um email, crias o cartão
na fase `📥 Pedido novo` e preenches o Email do cliente. As duas propriedades
que o sistema usa e que foram acrescentadas para isto:

| Propriedade | Tipo | Para quê |
| --- | --- | --- |
| `Onboarding enviado` | Data | Fica com a data do envio. Vazio = ainda não foi. É isto que impede o email de sair duas vezes. |
| `Idioma` | PT / EN | Escolhe a versão do email. Vazio = PT. |

## 3. O envio

Arrastar o cartão de `📥 Pedido novo` para `Draft 0 — Esboço & Refs` é o gesto
de aceitar o trabalho. É esse gesto que dispara o envio. Não há nada a
carregar: o sistema verifica de hora a hora e, quando encontra um cartão
aceite e ainda sem email enviado, faz três coisas pela ordem:

1. Partilha o `Guita_Ink_Comissoes_PT.pdf` com o email do cliente (só leitura)
2. Envia o email de aceitação (ver `email-onboarding.md`)
3. Escreve a data em `Onboarding enviado`

O PDF **nunca fica público**. Cada cliente recebe acesso individual, e podes
ver e retirar esse acesso a qualquer momento no Drive.

### Se alguma coisa faltar

O sistema não inventa. Sem Email no cartão, não envia e avisa-te. Sem Preço ou
sem Prazo, a linha sai do email em vez de ir vazia ou com um número adivinhado.

### ⚠️ Falta um passo para isto correr

A Routine está criada e com o prompt todo escrito, mas **desligada**, porque
foi criada sem acesso aos conectores. As sessões que ela dispara correriam sem
Notion, sem Gmail e sem Drive, ou seja, não fariam nada e falhavam de hora a
hora.

Para a pôr a funcionar, tem de ser ligada a partir da interface de Routines do
claude.ai, que é onde os conectores se podem conceder:

1. claude.ai → Routines → **Comissões: enviar onboarding (por ligar conectores)**
2. Dar-lhe acesso a **Notion**, **Gmail** e **Google Drive**
3. Ligar

O prompt não precisa de ser reescrito: já lá está, com as regras todas.

### Para desligar

A Routine chama-se **Comissões: enviar onboarding**. Desligá-la pára o envio
automático sem apagar nada. Enquanto estiver desligada, os cartões acumulam-se
em Draft 0 com `Onboarding enviado` vazio, e voltam a ser apanhados quando a
religares.

## O que continua a ser teu

- Aceitar ou não aceitar (arrastar o cartão)
- O valor de cada peça, que só existe no Shopify e no PDF
- Responder ao primeiro email do cliente e criar o cartão

O sistema trata só do passo repetitivo: o mesmo email, com o mesmo documento,
sempre que aceitas um trabalho.

## Os quadros do Miro

Dois quadros desenham o mesmo processo, Draft 0 a Final, com as aprovações
e os pagamentos: **Guita_Ink — Processo de Comissões** (o fluxo, com um
guia rápido ao lado) e **Guita_Ink — Fluxo de Comissões** (o fluxo, com o
guia de onboarding ao lado).

**Vivem na conta Miro `frederico@guitaink.com`** desde 9 Nov 2026 (pedido
do Frede: "adapt this miro boards to the miro account for
frederico@guitaink.com"):

| Quadro | Endereço |
| --- | --- |
| Guita_Ink — Processo de Comissões | https://miro.com/app/board/uXjVEQQWN9Q=/ |
| Guita_Ink — Fluxo de Comissões | https://miro.com/app/board/uXjVEQX-DnU=/ |

Foram feitos primeiro na conta Miro da LOA-D (`frederico.guita@loa-d.com`,
quadros `uXjVH3hIfwM=` e `uXjVH3hiiVY=`), que era a do conector do Miro, e
recriados na conta guitaink pelo Claude a partir de uma cópia lida dos
originais. O que mudou ao recriar:

- O endereço do site: `guita-ink.netlify.app` → `guitaink.com`.
- **Ajustar o esboço no Draft 0 não conta como revisão** (Frede, 9 Nov
  2026). Os dois quadros discordavam: "sem custo" no Processo, "conta como
  revisão" no Fluxo. No Fluxo, a caixa do ajuste recebe as três respostas
  "NÃO" (esboço, lineart e cor), e nos dois quadros as do lineart e da cor
  contam como revisão; por isso a caixa passou a dizer "Ajuste (no esboço
  não conta como revisão; no lineart e na cor, conta)".
- **O PDF de onboarding é `Guita_Ink_Comissoes_PT.pdf`** (Frede, 9 Nov
  2026). O Fluxo dizia `Guia_Comissao_GuitaInk.pdf`.
- O fluxograma é feito de formas simples do Miro (losango para as
  decisões, retângulo arredondado para o início e o fim, paralelogramo para
  os pagamentos, retângulos tracejados para os grupos), nas mesmas posições,
  cores e textos. Os originais usavam as formas de fluxograma do Miro, que
  a conta guitaink não tem: o Miro recusou-as.
- Na tabela do guia rápido (Processo), "Draft 0", "Draft 1"… perderam o
  negrito: as células de uma tabela do Miro só levam texto simples.

Os quadros têm os preços: por isso nada deles está neste repositório. A
cópia de onde foram recriados ficou no Drive da conta guitaink, na pasta
**Miro — cópia dos quadros de comissões**
(`1OXHb5wVQ0ZCjCcsRgVoS5P4Ncoq-zQuC`); com os quadros feitos, já não é
precisa (a do Fluxo ainda tem o nome antigo do PDF). Essa pasta e os
originais na LOA-D são do Frede para apagar; o Claude não apaga nenhum sem
ele dizer.

Uma coisa em que os quadros ainda não batem certo, por decidir pelo Frede
(está como estava): onde vivem os preços. O guia rápido diz quatro sítios
(o quadro, o PDF, os Termos no Notion, o Shopify); a secção 1 acima diz
dois.

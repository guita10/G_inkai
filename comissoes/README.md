# Sistema de comissões

> **Arrumado a 22 Nov 2026.** O guia para o Frede, em linguagem simples, está
> agora no Notion, na página **Guita_Ink — Website & Comissões**
> (https://app.notion.com/p/3a954b9bb07981f4bccceaea00aab3af), com a base de
> dados de comissões lá dentro. Este ficheiro é a versão técnica.

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

Uma tarefa agendada, **Guita_Ink — comissões: registo e onboarding**
(`trig_01BBdBkE8JCT7KHHp7JHWq1T`, claude.ai, de hora a hora ao minuto 43,
com os conectores Notion, Gmail e Drive), faz duas coisas por esta ordem:

1. **Regista os pedidos.** Procura no Gmail `in:inbox
   -label:"Comissões/Registado" subject:(comissão OR comissao OR commission)`,
   lê o corpo que o site pré-preenche ("Pedido de comissão" / "Commission
   request", `comissoes.html` do site novo), cria o cartão em `📥 Pedido novo`
   (sem Preço nem Prazo, que são do Frede) e só depois põe a etiqueta
   `Comissões/Registado` (`Label_2`). As opções entre parênteses nas
   etiquetas do formulário ("busto / meio corpo / ...") não são a resposta:
   a resposta vem depois dos dois pontos (corrigido no prompt a 22 Nov 2026,
   quando o formulário do site novo passou a listar as quatro opções).
2. **Envia o email de aceitação.** Arrastar o cartão de `📥 Pedido novo` para
   `Draft 0 — Esboço & Refs` é o gesto de aceitar o trabalho. Para cada cartão
   aceite e ainda sem email enviado: partilha o PDF da língua do cartão com o
   email do cliente (só leitura), envia o email de aceitação (ver
   `email-onboarding.md`; o texto em vigor é o do prompt, com a validação e,
   desde 22 Nov 2026, o pagamento como o PDF o descreve: o Headshot paga-se
   todo antes de começar, os outros metade quando o esboço é aprovado e metade
   antes do ficheiro final) e só depois escreve a data em `Onboarding enviado`.

Os PDFs partilhados são `Guita_Ink_Comissoes_PT.pdf`
(`1q7ltmHMeM4704pkY7ObIm0aY-XpzWVhy`) e `Guita_Ink_Commissions_EN.pdf`
(`1wWZaU6wksdHxYZndvuPuAmABkmE6M8BN`), cópias feitas pelo conector do Drive (o
conector só partilha ficheiros que ele criou), na pasta do Drive **Comissões —
guias para clientes** (`1p3ZBE31Gi7gj6lvTpZHj2BY1tfqJAmsA`) desde 22 Nov 2026.
Para atualizar um PDF: Gerir versões no próprio ficheiro, para o id não mudar.

O PDF **nunca fica público**. Cada cliente recebe acesso individual, e podes
ver e retirar esse acesso a qualquer momento no Drive.

### Se alguma coisa faltar

O sistema não inventa. Sem Email no cartão, não envia e avisa-te. Sem Preço ou
sem Prazo, a linha sai do email em vez de ir vazia ou com um número adivinhado.

### Ligada desde 22 Nov 2026

O Frede pediu para a ligar ("Liga já"). Antes disso confirmou-se: a etiqueta
`Comissões/Registado` existe (`Label_2`), não havia nenhum pedido por registar,
e nenhum cartão em Draft 0 (o primeiro envio só acontece quando ele arrastar um).

Há uma tarefa mais antiga, de setembro, só com a parte do envio e sem
conectores: chama-se agora **(antiga, substituída — não ligar) Comissões:
enviar onboarding** e está desligada. Ligar as duas mandaria dois emails.

### Para desligar

Desligar a tarefa **Guita_Ink — comissões: registo e onboarding** pára tudo sem
apagar nada. Enquanto estiver desligada, os pedidos ficam no Gmail sem
etiqueta e os cartões acumulam-se em Draft 0 com `Onboarding enviado` vazio;
voltam a ser apanhados quando for religada.

## 4. O pagamento

Desde 22 Nov 2026 (Frede: "esconde as comissões") os quatro produtos das
comissões no Shopify (`commission-headshot-bust`, `commission-half-body`,
`commission-full-body`, `commission-character-sheet`) **saem da Loja online**.
Estavam publicados com o preço; quando a palavra-passe da loja saísse,
qualquer pessoa os via, e a regra "o cliente escreve primeiro e o número vem
por email" deixava de valer. Continuam ativos no Shopify.

Tirar um produto da loja é um gesto do Frede, no admin (ficha do produto →
Publicação → tirar o visto de Loja online): o conector do Shopify recusa
`publishableUnpublish` por política de segurança, e não se contorna com outra
mutação. **Não os pôr em Rascunho**: um produto em rascunho já não se cobra.
Feito pelo Frede a 22 Nov 2026 e confirmado pela API: os quatro com
`publishedOnPublication: false` na Loja online e estado `ACTIVE`; o merch
publicado ficou como estava.

Cobra-se por uma **encomenda em rascunho com fatura** (Encomendas → Rascunhos
→ Criar encomenda → Enviar fatura): o produto inteiro para o Headshot, que o
PDF diz que se paga de uma vez; um item personalizado com metade do valor
("Sinal 50% · Meio corpo") para cada metade dos outros. O cliente paga no
checkout do Shopify, por isso precisa do Shopify Payments ativo.

Impostos (testado a 22 Nov 2026 com `draftOrderCalculate`, sem criar nada):
uma comissão com morada de faturação em Portugal e uma t-shirt enviada para
Portugal e para Espanha dão 0 € de imposto. O Shopify não está a cobrar IVA,
como deve ser com a isenção do artigo 53.º.

## O que continua a ser teu

- Aceitar ou não aceitar (arrastar o cartão)
- O valor de cada peça, que só existe no Shopify e no PDF
- Pôr o Preço e o Prazo no cartão antes de o arrastar (sem eles, essas linhas saem do email)

O sistema trata só do passo repetitivo: o mesmo email, com o mesmo documento,
sempre que aceitas um trabalho.

## Os quadros do Miro

**Desde 22 Nov 2026 o quadro em uso é o Processo**; o Fluxo chama-se
**Arquivo — Fluxo de Comissões (não usar)** e fica guardado (Frede: "um
principal, outro arquivo").

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
- **Os quadros não têm preços** (Frede, 9 Nov 2026: "Prices are only in
  Shopify and the PDF"). No Processo, a lista "Produtos e preços" passou a
  "Formatos" (os quatro nomes) e a nota da sincronização diz dois sítios em
  vez de quatro; no Fluxo, a tabela de formatos perdeu a coluna "Preço".
  Cada um tem a linha "Os preços estão no Shopify e no
  `Guita_Ink_Comissoes_PT.pdf`, e só aí."

A cópia de onde foram recriados ficou no Drive da conta guitaink, na pasta
**Miro — cópia dos quadros de comissões**
(`1OXHb5wVQ0ZCjCcsRgVoS5P4Ncoq-zQuC`, dentro de **Arquivo (não usar)** desde
22 Nov 2026); com os quadros feitos, já não é
precisa, e ainda tem os preços e o nome antigo do PDF. Essa pasta e os
originais na LOA-D (também com os preços) são do Frede para apagar; o
Claude não apaga nenhum sem ele dizer.

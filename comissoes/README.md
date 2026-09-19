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

A secção de comissões mostra os **quatro formatos e mais nada**. Sem preços,
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

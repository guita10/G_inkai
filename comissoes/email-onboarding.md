# Email de aceitação — comissões

O email que sai quando um pedido passa de **📥 Pedido novo** para
**Draft 0 — Esboço & Refs** na base de dados *Comissões — Guita_Ink*.
Arrastar o cartão para Draft 0 É o gesto de aceitar: é ele que dispara tudo.

Os campos entre `{}` vêm do cartão do Notion. O `{link_pdf}` é o link do
Guita_Ink_Comissoes_PT.pdf no Drive, partilhado com o email do cliente no
momento do envio — o documento nunca fica público.

Escolhe-se PT ou EN pela propriedade **Idioma** do cartão. Sem ela, PT.

---

## PT

**Assunto:** A tua comissão está aceite · Guita_Ink

```
Olá {nome},

Obrigado pela confiança. A tua comissão está aceite e já tem lugar na fila.

O que ficou combinado
  Formato: {produto}
  Valor: {preco} €
  Prazo estimado: {prazo}

Deixo-te aqui um guia curto com o processo todo: as quatro etapas, o que
acontece em cada uma, como funcionam os pagamentos e as alterações.

  {link_pdf}

Partilhei-o com este endereço, por isso abre com a conta que estás a usar.

O próximo passo é meu. Começo pelo esboço e envio-to para aprovares. Daí em
diante só avanço depois do teu OK em cada etapa, para podermos corrigir cedo
se algo não for como imaginavas.

Se entretanto te lembrares de mais alguma referência, manda. Nunca é demais.

Até já,
Frede

Guita_Ink · frederico@guitaink.com · @guita_ink
```

---

## EN

**Subject:** Your commission is confirmed · Guita_Ink

```
Hi {nome},

Thank you for trusting me with this. Your commission is confirmed and has a
place in the queue.

What we agreed
  Format: {produto}
  Price: {preco} €
  Estimated timeline: {prazo}

Here is a short guide to the whole process: the four stages, what happens at
each one, and how payments and revisions work.

  {link_pdf}

I shared it with this address, so open it with the account you are using.

The next step is mine. I start with the sketch and send it over for your
approval. From there I only move on once you have said yes to each stage, so
we can fix things early if anything is off.

If you remember any more references in the meantime, send them over. There is
no such thing as too many.

Talk soon,
Frede

Guita_Ink · frederico@guitaink.com · @guita_ink
```

---

## Regras do envio

O sistema só envia quando **todas** estas condições se verificam:

1. A fase é exactamente `Draft 0 — Esboço & Refs`
2. O campo **Email** está preenchido
3. **Onboarding enviado** está vazio

Depois de enviar, escreve a data em **Onboarding enviado**. É isso que impede
o mesmo cliente de receber o email duas vezes se o cartão voltar atrás e
avançar outra vez.

Se faltar o Email, o cartão fica de fora e é reportado, não se inventa nada.
Se faltar o Preço ou o Prazo, a linha correspondente sai do email em vez de
ir vazia ou com um valor adivinhado.

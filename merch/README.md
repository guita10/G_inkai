# merch/

Fotos das fichas de produto no Shopify. **Nao e servido pelo site** (o zip do
deploy so leva `images/`); o Shopify vai busca-las aqui ao GitHub, pelo
endereco raw, e guarda a sua propria copia.

`drop-01/`: mockups planos do Drop 01 (Rainha, Monge, Sumo), 2000x2000,
desenhados por `tools/merch-mockups.py` a partir dos ficheiros de impressao.
A arte e a do Frede, nunca redesenhada: so a peca a volta e desenhada.

- `tshirt-<desenho>-<black|white>.jpg`, `hoodie-...`: uma por opcao de cor
- `print-*`, `limited-*`: o print emoldurado (papel preto)
- `sticker-*`, `keychain-*`: um por desenho; `stickers-drop01.jpg` e
  `prints-drop01.jpg` sao as fotos de grupo

Quando a Printful gerar os mockups dela (ao ligar os produtos), esses sao
melhores para a roupa: mostram a peca real. Estes ficam como fallback.

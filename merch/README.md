# merch/

Fotos das fichas de produto no Shopify. **Nao e servido pelo site** (o zip do
deploy so leva `images/`); o Shopify vai busca-las aqui ao GitHub, pelo
endereco raw, e guarda a sua propria copia.

`drop-01/`: mockups planos do Drop 01 (Rainha, Monge, Sumo), 2000x2000,
desenhados por `tools/merch-mockups.py` a partir dos ficheiros de impressao.
A arte e a do Frede, nunca redesenhada: so a peca a volta e desenhada.

- `tshirt-<desenho>-<black|white>.jpg`, `hoodie-...`: uma por opcao de cor
- `limited-*`: a edicao limitada A3, o print emoldurado (papel preto)
- `sticker-*`, `keychain-*`: um por desenho; `stickers-drop01.jpg` e a foto
  de grupo

`oc-prints/`: o Art Print passou a ser OC 01, OC 02 e OC 03 (pedido do Frede,
Set 2026), os tres retratos que ja estao na parede. Ficheiros dele a 2363x3542,
~286 DPI em A4: postos inteiros em papel branco, nunca cortados.

Quando a Printful gerar os mockups dela (ao ligar os produtos), esses sao
melhores para a roupa: mostram a peca real. Estes ficam como fallback.

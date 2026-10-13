# incoming/ — a caixa de entrada da arte

Esta pasta e um sitio de passagem. Nada aqui e servido no site: as imagens que
o site mostra vivem em `images/`, ja encolhidas e com miniatura, e sao postas
la pelo `tools/add-artwork.py`.

## Para que serve

Quando ha muitos ficheiros para meter de uma vez, arrasta-los para aqui e o
caminho mais curto. Nao ha nada de especial na pasta: e so um sitio combinado,
para que os originais nao andem espalhados pelo Desktop e para que se saiba o
que ainda nao foi tratado.

## Como se usa

1. Poe aqui os originais, com o nome que tiverem. Acentos e espacos nao sao
   problema, o script trata do nome.
2. Ve primeiro o que ia acontecer, sem escrever nada:

       python3 tools/add-artwork.py incoming/ --dry-run

   Isto diz-te quantos ficheiros vai tratar, que nome vai dar a cada um, e
   avisa-te de repetidos e de nomes que chocam.
3. Quando estiver como queres:

       python3 tools/add-artwork.py incoming/

   Faz o JPEG de 1600px, a miniatura de 760px, os .webp, o mapa DIMS e a
   altura reservada da parede. No fim escreve-te as linhas para o CONFIG.
4. Junta essas linhas ao `artworks` do `index.html` **e** ao do `projeto.html`
   (os dois tem de ficar iguais), com o titulo e a categoria preenchidos.
5. Corre `python3 tools/dims.py` outra vez, para a parede contar as obras
   novas.
6. **Esvazia a pasta.** Os originais ja estao guardados onde estavam antes;
   aqui so ocupavam espaco no repositorio.

## Duas coisas que o script nao faz por ti, de proposito

**O titulo e a categoria.** O script nao sabe o que esta na imagem e nao ha de
inventar. A categoria nao e decoracao: `fanart` nunca e vendida, e so
`character` e `sketches` aparecem onde houver qualquer coisa a ver com vender.
Escolher mal tem consequencias a serio.

**Escolher o que entra.** Ter um ficheiro nesta pasta nao e o mesmo que querer
a obra na galeria. So aparece no site o que fores tu a juntar ao CONFIG.

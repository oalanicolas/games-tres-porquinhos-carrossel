# AGENTS.md · Os Três Porquinhos, livro-carrossel

Herda as regras de `../../AGENTS.md`. Este arquivo lista só o que é próprio do livro.

## Antes de entregar

- `npm test` e `npm run build`.
- Servidor local: `npm start`, porta 4291.
- Sons novos entram por `tools/sons.py`, nunca à mão. Só o acervo licenciado de `shared/sfx`; o acervo `universal` é extraído de jogos e serve apenas para estudo.

## Desvios da referência

Pedidos por Alan:

- A história é uma sequência: nada antes da primeira cena, nada depois da última (06/11/2026). O livro físico e o vídeo de referência fecham o círculo; este não mostra isso.
- Música contínua que muda com a história; a referência toca só notas curtas (06/11/2026).

Decididos na construção, ainda sem aprovação de Alan:

- Oito cenas com cunha de 45°; a referência tem seis.

## Recusado por Alan

- A última cena ou a contracapa aparecendo ao lado da primeira cena. Checagem: `tests/sequencia.test.mjs`.

## Regras do conteúdo

- Versão infantil: nenhum porquinho é comido e o Lobo foge.
- Personagens: Pipo (palha), Tico (madeira), Bento (tijolos) e Mamãe Porca.
- A música é CC BY 4.0: o crédito visível na capa e na cena final não pode sair.

# AGENTS.md · Os Três Porquinhos, livro-carrossel

Herda as regras de `../../AGENTS.md`. Este arquivo lista só o que é próprio do livro.

## Antes de entregar

- `npm test` e `npm run build`.
- Servidor local: `npm start`, porta 4291.
- Narração: `python3 tools/narracao.py --estimar` conta o texto e `python3 tools/narracao.py` grava. Sem as 8 cenas gravadas, o manifesto fica vazio e o botão não aparece. Mudou o texto de `src/story.js`? Rode de novo: só a cena alterada é regravada. Depois de gravar, confira a fala com `whisper-cli` em português.
- Sons novos entram por `tools/sons.py`, nunca à mão. Só o acervo licenciado de `shared/sfx`; o acervo `universal` é extraído de jogos e serve apenas para estudo.

## Desvios da referência

Pedidos por Alan:

- A história é uma sequência: nada antes da primeira cena, nada depois da última (06/11/2026). O livro físico e o vídeo de referência fecham o círculo; este não mostra isso.
- Música contínua que muda com a história; a referência toca só notas curtas (06/11/2026).
- A cena em foco abre mais que as outras, para o texto ficar de frente (06/11/2026). A largura de 90° em paisagem e 64° em retrato foi decidida na construção. Checagem: `tests/telas.test.mjs`.
- Narração por voz feminina calma da ElevenLabs (06/11/2026). O código está pronto e a voz ainda não foi gravada: a conta está sem créditos.

Decididos na construção, ainda sem aprovação de Alan:

- Oito cenas com cunha de 45°; a referência tem seis.
- Voz Yasmin Alves e modelo `eleven_multilingual_v2`, escolhidos pelos metadados, sem ouvir.
- A narração vem ligada, não dispara a ação e não vira a página: ao terminar, só destaca o botão da ação.

## Recusado por Alan

- A última cena ou a contracapa aparecendo ao lado da primeira cena. Checagem: `tests/sequencia.test.mjs`.

## Regras do conteúdo

- Versão infantil: nenhum porquinho é comido e o Lobo foge.
- Personagens: Pipo (palha), Tico (madeira), Bento (tijolos) e Mamãe Porca.
- A música é CC BY 4.0: o crédito visível na capa e na cena final não pode sair.

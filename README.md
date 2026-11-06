# Os Três Porquinhos, livro-carrossel

Livro pop-up em 3D que abre em estrela e conta o conto inteiro em oito cenas. Cada cena tem uma ação de papel e a música muda conforme a história avança. Por [Alan Nicolas](https://x.com/oalanicolas).

Referência de forma: o vídeo de Techartist sobre um livro-carrossel (<https://x.com/techartist_/status/2116407421065482362>). A arte, o texto e o código daqui são originais.

## Rodar

```sh
npm install
npm start        # http://127.0.0.1:4291/
npm test         # sobe o próprio Vite e abre o Chrome sem tomar o foco
npm run build
```

## Como funciona

- `src/book.js`: paredes radiais, abertura e quais cenas ficam visíveis.
- `src/cenas.js`, `src/personagens.js`, `src/objetos.js`, `src/palco.js`, `src/paper.js`: recortes de papel e ações das oito cenas.
- `src/story.js`: o texto.
- `src/audio.js`: música com fusão, ambientes em laço e efeitos. `src/sons.json` é gerado.
- `tools/sons.py`: monta `public/sfx`, `public/musica`, `src/sons.json` e `docs/creditos-sons.md` a partir de `shared/sfx` do hub.

## Narração

O código da narração está pronto, mas a voz ainda não foi gravada: a conta da ElevenLabs está sem créditos. Enquanto faltar alguma das 8 cenas, o botão não aparece.

```sh
python3 tools/narracao.py --estimar   # só conta os caracteres
python3 tools/narracao.py             # grava o que falta e continua de onde parou
```

Depois de gravar, faça o build, o commit, o push e o deploy. A chave vem do ambiente ou do `.env` do hub.

## Testes

| Arquivo | O que prova |
|---|---|
| `tests/sequencia.test.mjs` | o fim nunca aparece junto do começo, em 8 de 8 cenas e na abertura |
| `tests/musica.test.mjs` | faixa certa nas 8 cenas, som na saída, troca no tchibum, botão de som e 5 laços sem salto |
| `tests/telas.test.mjs` | livro nítido e textos sem sobreposição em 4 tamanhos de tela |
| `tests/livro.test.mjs` | nenhuma peça fora da cunha e percurso real pela interface |

## Pesquisa e créditos

- Decisões técnicas: `docs/pesquisas/Livro pop-up em carrossel no navegador — papel recortado, sombra e trilha por cena em Three.js.md`, no vault do hub.
- Identidade visual: [docs/design-system.md](docs/design-system.md).
- Créditos: [docs/creditos.md](docs/creditos.md) e [docs/creditos-sons.md](docs/creditos-sons.md).

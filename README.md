# Os Três Porquinhos, livro-carrossel

Livro pop-up em 3D que abre em estrela e conta o conto inteiro em onze cenas. Cada cena tem uma ação de papel e a música muda conforme a história avança. No modo narrado, a voz conta e o livro vira sozinho. Por [Alan Nicolas](https://x.com/oalanicolas).

João constrói a casa de palha, Lulu a de madeira e Kael a de tijolos. Texto e narração usam os mesmos nomes.

O enquadramento é fixo: não há lupa do texto nem zoom por gestos. Arrastar continua virando as páginas.

O Lobo de papel é inspirado nas fotos da pelúcia enviadas por Alan: cinza, focinho e nariz grandes, barriga clara e lenço azul.

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
- `src/cenas.js`, `src/personagens.js`, `src/objetos.js`, `src/palco.js`, `src/paper.js`: recortes de papel e ações das onze cenas.
- `src/story.js`: o texto.
- `src/audio.js`: música com fusão, ambientes em laço e efeitos. `src/sons.json` é gerado.
- `tools/sons.py`: monta `public/sfx`, `public/musica`, `src/sons.json` e `docs/creditos-sons.md` a partir de `shared/sfx` do hub.

## Modo narrado e trilha

No modo narrado, ligado por padrão, a voz conduz. O relógio da cena é o da fala: cada gesto está preso a uma palavra do texto, e a boca do personagem acompanha o volume da voz. Cada personagem que fala ganha um balão com a própria fala, e a página vira sozinha quando voz e gestos terminam. Depois da última cena, o livro se fecha e volta à capa, pronto para ser lido de novo.

As palavras e as falas estão em `src/roteiro.json`. `python3 tools/narracao.py` acha o segundo de cada uma nas pausas reais da gravação, com o texto conhecido da história, e grava `marcos` e `falas` em `src/narracao.json`. O reconhecimento de fala ficou de fora: errou até cerca de 1 s dentro das frases. Os gestos marcados `soVoz` em `src/cenas.js` só existem com narração; sem voz, as cenas têm os mesmos tempos de antes (`tests/sincronia.test.mjs`). Percurso completo com as faixas reais, cerca de 4 min: `LIVRO_URL=<url> node tests/narrado-real.mjs`.

A trilha é original, gerada com Google Lyria 3 Pro pela API da Magnific, com o mesmo conjunto de câmara em todas as cenas: `python3 tools/trilha.py`. Prompts e medições em `docs/trilha-recibo.json`.

## Narração

Voz sintética Yasmin Alves, da ElevenLabs, gravada pela API da Magnific com o modelo Turbo v2.5. Os arquivos ficam em `public/narracao/` e o recibo em `docs/narracao-recibo.json`.

```sh
python3 tools/narracao.py --estimar   # só conta os caracteres
python3 tools/narracao.py --cena 3    # grava uma cena, para ouvir antes das outras
python3 tools/narracao.py             # grava o que mudou no texto
```

Sem as 11 cenas gravadas, o botão não aparece. `--servico elevenlabs` usa a conta direta, com o modelo Multilingual v2.

## Testes

| Arquivo | O que prova |
|---|---|
| `tests/sequencia.test.mjs` | o fim nunca aparece junto do começo, em 11 de 11 cenas e na abertura |
| `tests/musica.test.mjs` | faixa certa nas 11 cenas, som na saída, troca no tchibum, botão de som e 5 laços sem salto |
| `tests/telas.test.mjs` | livro nítido e textos sem sobreposição em 4 tamanhos de tela |
| `tests/livro.test.mjs` | nenhuma peça fora da cunha e percurso real pela interface |
| `tests/texto-livre.test.mjs` | nada da cena tapa o texto da página, em 11 de 11 cenas |
| `tests/furos.test.mjs` | a história se sustenta em cena: Kael entra por último antes do Lobo chegar, três janelas, Lobo alcança a porta, chaminé e caldeirão à vista, ninguém reaparece |
| `tests/continuidade.test.mjs` | balões mantêm a ordem durante gestos; voz terminada durante a abertura ou antes do primeiro quadro e toque cancelado não prendem o avanço |

## Pesquisa

- Decisões técnicas: `docs/pesquisas/Livro pop-up em carrossel no navegador — papel recortado, sombra e trilha por cena em Three.js.md`, no vault do hub.
- Identidade visual: [docs/design-system.md](docs/design-system.md).

## Créditos

A página não mostra créditos sobre a mesa, a pedido de Alan: eles ficam só aqui.

- Criação: [Alan Nicolas](https://x.com/oalanicolas).
- Conto: *Os Três Porquinhos*, conto popular em domínio público, recontado aqui em português.
- Arte, texto e código: originais deste projeto, feitos por código.
- Referência de forma: vídeo de Techartist, <https://x.com/techartist_/status/2116407421065482362>. Nenhuma arte foi copiada dele.
- Voz: sintética, Yasmin Alves, da ElevenLabs, gravada pela API da Magnific. Recibo em `docs/narracao-recibo.json`.
- Música: original, gerada com [Google Lyria 3](https://deepmind.google/models/lyria/) Pro pela API da Magnific. Recibo em `docs/trilha-recibo.json`.
- Efeitos e ambientes: acervo CC0 do estúdio, lista completa em [docs/creditos-sons.md](docs/creditos-sons.md).
- Fontes (licença SIL OFL): Fraunces, Inter e Libre Caslon Text, pelo Fontsource.
- Bibliotecas: Three.js e Vite (licença MIT).

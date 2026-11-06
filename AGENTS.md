# AGENTS.md · Os Três Porquinhos, livro-carrossel

Herda as regras de `../../AGENTS.md`. Este arquivo lista só o que é próprio do livro.

## Antes de entregar

- `npm test` e `npm run build`. Os arquivos de teste rodam um por vez (cerca de 8 min): em paralelo, cinco Chromes com GPU na máquina ocupada derrubam navegador e carga, sem ser defeito do livro.
- Servidor local: `npm start`, porta 4291.
- Narração: `python3 tools/narracao.py --estimar` conta o texto e `python3 tools/narracao.py` grava pela Magnific. Sem as 8 cenas gravadas, o manifesto fica vazio e o botão não aparece. Mudou o texto de `src/story.js`? Rode de novo: só a cena alterada é regravada. Depois de gravar, confira a fala com `whisper-cli` em português.
- Sons novos entram por `tools/sons.py`, nunca à mão. Só o acervo licenciado de `shared/sfx`; o acervo `universal` é extraído de jogos e serve apenas para estudo.

## Desvios da referência

Pedidos por Alan:

- A história é uma sequência: nada antes da primeira cena, nada depois da última (06/11/2026). O livro físico e o vídeo de referência fecham o círculo; este não mostra isso.
- Música contínua que muda com a história; a referência toca só notas curtas (06/11/2026).
- A cena em foco abre mais que as outras, para o texto ficar de frente (06/11/2026). A largura de 90° em paisagem e 64° em retrato foi decidida na construção. Checagem: `tests/telas.test.mjs`.
- Animação sincronizada com a fala e um balão em cada personagem que fala (06/11/2026). Checagens: `tests/sincronia.test.mjs`, `tests/narrado-real.mjs`.
- O modo narrado fecha o livro ao concluir (06/11/2026). Checagem: `tests/narracao.test.mjs`.
- Narração por voz feminina calma da ElevenLabs (06/11/2026). A conta direta ficou sem créditos e Alan mandou tentar outro serviço, como a Magnific: as 8 cenas foram gravadas por ela, que usa vozes da ElevenLabs.

Decididos na construção, ainda sem aprovação de Alan:

- Oito cenas com cunha de 45°; a referência tem seis.
- Voz Yasmin Alves, escolhida pelos metadados, sem ouvir. A rota da Magnific só oferece o modelo Turbo v2.5 e não aceita `previous_text`, `next_text` nem `style`.
- Modo narrado (pedido de Alan, 06/11/2026: "no modo narrado o livro deve ir sozinho folhando"): vem ligado; a voz conduz e a página vira sozinha quando voz e gestos terminam. Mexer à mão continua valendo e desligar o botão devolve o ritmo a quem lê.
- Quem gesticula em cada palavra (`src/roteiro.json`), a boca dos porquinhos, que não existia, e os gestos só de narração (`soVoz` em `src/cenas.js`): entrada do Lobo, batida na porta com som de martelo, porque o acervo não tem batida, e o "Fuuuu!" do Lobo em balão.
- A respiração dos personagens agora soma ao que a linha do tempo escreve. Antes, ela apagava pulos e gestos de cabeça, inclusive sem voz: esses gestos autorais passam a aparecer.

## Recusado por Alan

- A trilha anterior, de Kevin MacLeod no acervo (06/11/2026): "as musicas de fundo nao fazem sentido algum" com a história. Música de ação de jogo e gênero trocando a cada cena não voltam.
- A última cena ou a contracapa aparecendo ao lado da primeira cena. Checagem: `tests/sequencia.test.mjs`.

## Regras do conteúdo

- Versão infantil: nenhum porquinho é comido e o Lobo foge.
- Personagens: Pipo (palha), Tico (madeira), Bento (tijolos) e Mamãe Porca.
- A música é original, gerada com Google Lyria 3 Pro pela Magnific (`tools/trilha.py`): o crédito visível na capa e na cena final não sai, e a licença de uso público ainda não foi confirmada.

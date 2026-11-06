# AGENTS.md · Os Três Porquinhos, livro-carrossel

Herda as regras de `../../AGENTS.md`. Este arquivo lista só o que é próprio do livro.

## Antes de entregar

- `npm test` e `npm run build`. Os arquivos de teste rodam um por vez (cerca de 10 min): em paralelo, cinco Chromes com GPU na máquina ocupada derrubam navegador e carga, sem ser defeito do livro.
- Servidor local: `npm start`, porta 4291.
- Narração: `python3 tools/narracao.py --estimar` conta o texto e `python3 tools/narracao.py` grava pela Magnific. Sem as 11 cenas gravadas, o manifesto fica vazio e o botão não aparece. Mudou o texto de `src/story.js`? Rode de novo: só a cena alterada é regravada. Depois de gravar, confira a fala com `whisper-cli` em português.
- Sons novos entram por `tools/sons.py`, nunca à mão. Só o acervo licenciado de `shared/sfx`; o acervo `universal` é extraído de jogos e serve apenas para estudo.

## Desvios da referência

Pedidos por Alan:

- A história é uma sequência: nada antes da primeira cena, nada depois da última (06/11/2026). O livro físico e o vídeo de referência fecham o círculo; este não mostra isso.
- Música contínua que muda com a história; a referência toca só notas curtas (06/11/2026).
- A cena em foco abre mais que as outras, para o texto ficar de frente (06/11/2026). A largura de 90° em paisagem e 64° em retrato foi decidida na construção. Checagem: `tests/telas.test.mjs`.
- Animação sincronizada com a fala e um balão em cada personagem que fala (06/11/2026). Checagens: `tests/sincronia.test.mjs`, `tests/narrado-real.mjs`.
- O modo narrado fecha o livro ao concluir (06/11/2026). Checagem: `tests/narracao.test.mjs`.
- Terceira janela para Bento e entrada Pipo → Tico → Bento antes de o Lobo chegar (06/11/2026): "bento ta fora de casa, o logo iria pegar ele". Checagem: `tests/furos.test.mjs`.
- Página a mais sempre que a história precisar, para não ter furo (06/11/2026): "nem que precise adicionar mais páginas". Checagem: `tests/furos.test.mjs`.
- Narração por voz feminina calma da ElevenLabs (06/11/2026). A conta direta ficou sem créditos e Alan mandou tentar outro serviço, como a Magnific: as 11 cenas foram gravadas por ela, que usa vozes da ElevenLabs.
- Lobo inspirado nas duas fotos de pelúcia enviadas por Alan em 06/11/2026: cinza, barriga e patas claras, nariz grande carvão, orelhas altas e lenço azul; continua feito de papel e usa o mesmo rig de fala, sopro, subida e fuga.

Decididos na construção, ainda sem aprovação de Alan:

- Onze cenas com cunha fixa de 45° (`CUNHA` em `src/book.js`, desacoplada do número de cenas); a referência tem seis. Só as páginas próximas ficam visíveis, então a estrela não precisa fechar 360° com 8 paredes.
- Os textos novos das cenas VI a XI (telhado, chaminé, rabo em brasa, fuga, festa, os três juntos) e a posição da terceira janela, na empena.
- O Lobo menor em cena, para caber na cunha sem atravessar as paredes do livro. Checagem: `tests/paredes.mjs`.
- Voz Yasmin Alves, escolhida pelos metadados, sem ouvir. A rota da Magnific só oferece o modelo Turbo v2.5 e não aceita `previous_text`, `next_text` nem `style`.
- Modo narrado (pedido de Alan, 06/11/2026: "no modo narrado o livro deve ir sozinho folhando"): vem ligado; a voz conduz e a página vira sozinha quando voz e gestos terminam. Mexer à mão continua valendo e desligar o botão devolve o ritmo a quem lê.
- Quem gesticula em cada palavra (`src/roteiro.json`), a boca dos porquinhos, que não existia, e os gestos só de narração (`soVoz` em `src/cenas.js`): entrada do Lobo, batida na porta com som de martelo, porque o acervo não tem batida, e o "Fuuuu!" do Lobo em balão.
- A respiração dos personagens agora soma ao que a linha do tempo escreve. Antes, ela apagava pulos e gestos de cabeça, inclusive sem voz: esses gestos autorais passam a aparecer.

## Recusado por Alan

- A primeira adaptação geométrica do Lobo às fotos de pelúcia (06/11/2026): "Esse lobo ficou muito feio". Não é arte aprovada. Alan pediu concluir e conferir o deploy atual antes de uma nova adaptação às quatro fotos adicionais.
- A trilha anterior, de Kevin MacLeod no acervo (06/11/2026): "as musicas de fundo nao fazem sentido algum" com a história. Música de ação de jogo e gênero trocando a cada cena não voltam.
- A última cena ou a contracapa aparecendo ao lado da primeira cena. Checagem: `tests/sequencia.test.mjs`.

## Regras do conteúdo

- Zoom desativado por pedido de Alan em 06/11/2026: sem lupa/cartão de texto e sem ampliação por gestos. Checagem: `tests/jornada.mjs`, passar sobre o texto não abre sobreposição; pinça e roda com Ctrl não mudam a escala nem prendem a navegação.
- Créditos só no `README.md`, nunca sobre a mesa (pedido de Alan, 06/11/2026). `tests/telas.test.mjs` confere.
- Versão infantil: nenhum porquinho é comido e o Lobo foge.
- Personagens: João (palha), Lulu (madeira), Kael (tijolos) e Mamãe Porca. Nomes pedidos por Alan em 06/11/2026; os identificadores internos `pipo`, `tico` e `bento` continuam ligando os mesmos rigs e marcos.
- Regressões devolvidas por Alan em 06/11/2026: balões disputando posição e história presa ao virar. `tests/continuidade.test.mjs` cobre ordem estável das falas, toque cancelado e fim da voz durante a abertura ou antes do primeiro quadro.
- A música é original, gerada com Google Lyria 3 Pro pela Magnific (`tools/trilha.py`): a licença de uso público ainda não foi confirmada.

## Interação por sopro

- Pedido de Alan (06/11/2026): modo opcional que capta microfone e usa níveis de sopro nas casas. Palha cede antes da madeira; tijolos nunca caem. Reusar as animações e a cronologia existentes.
- Decisões sem Alan: calibração local de 1,2 s, energia acumulada preservada entre sopros, botão de segurar como alternativa, saída do jogo silenciosa durante captura, nenhuma gravação/envio. A captura exige gesto explícito e termina ao sair, ocultar aba ou completar tentativa.
- `tests/sopro.test.mjs`: silêncio/tom/estalo, energia das três casas, pausa/retomada, recusa, autorização tardia e captura PCM. Teste de microfone físico com criança continua pendente; não declarar distinção perfeita entre sopro e fala.
- Correção visual de Alan (06/11/2026): “não tem que ter nada escrito”, “UI BEM GAMIFICADA E bonita”. A interface do sopro usa só ícones, casas e medidores; textos apenas em nomes acessíveis e status fora da tela. Preservar o texto do conto no livro.

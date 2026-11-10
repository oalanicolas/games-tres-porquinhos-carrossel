# AGENTS.md · Os Três Porquinhos, livro-carrossel

Herda as regras de `../../AGENTS.md`. Este arquivo lista só o que é próprio do livro.

## Antes de entregar

- Queda no Chrome do iPhone, devolvida por Alan em 07/11/2026. Manter texturas de páginas próximas, descartar CPU e GPU das distantes antes de alocar novas e preservar sua resolução ao recriar. Perda do contexto gráfico pausa a voz e o sopro sem apagar progresso. Checagens em `tests/memoria.test.mjs`.
- `npm test` e `npm run build`. Os arquivos de teste rodam um por vez (cerca de 10 min): em paralelo, cinco Chromes com GPU na máquina ocupada derrubam navegador e carga, sem ser defeito do livro.
- Servidor local: `npm start`, porta 4291.
- Narração: `python3 tools/narracao.py --estimar` conta o texto e `python3 tools/narracao.py` grava pela Magnific. Sem as 17 cenas gravadas, o manifesto fica vazio e o botão não aparece. Mudou o texto de `src/story.js`? Rode de novo: só a cena alterada é regravada. Depois de gravar, confira a fala com `whisper-cli` em português.
- Sons novos entram por `tools/sons.py`, nunca à mão. Só o acervo licenciado de `shared/sfx`; o acervo `universal` é extraído de jogos e serve apenas para estudo. Antes de aceitar um corte curto do acervo (`foley-*`), procure a gravação de origem no campo `sources`: o uivo de 1,6 s vinha de uma tomada de 23 s. Checagem: `tests/sonoplastia.test.mjs`.

## Desvios da referência

Pedidos por Alan:

- A história é uma sequência: nada antes da primeira cena, nada depois da última (06/11/2026). O livro físico e o vídeo de referência fecham o círculo; este não mostra isso.
- Música contínua que muda com a história; a referência toca só notas curtas (06/11/2026).
- A cena em foco abre mais que as outras, para o texto ficar de frente (06/11/2026). A largura de 90° em paisagem e 64° em retrato foi decidida na construção. Checagem: `tests/telas.test.mjs`.
- Animação sincronizada com a fala e um balão em cada personagem que fala (06/11/2026). Checagens: `tests/sincronia.test.mjs`, `tests/narrado-real.mjs`.
- O modo narrado fecha o livro ao concluir (06/11/2026). Checagem: `tests/narracao.test.mjs`.
- Terceira janela para Bento e entrada Pipo → Tico → Bento antes de o Lobo chegar (06/11/2026): "bento ta fora de casa, o logo iria pegar ele". Checagem: `tests/furos.test.mjs`.
- Dezessete cenas (06/11/2026): "mais cenas"; "poderia ter uma cena para cada casa sendo construida"; Lobo espiando e corridas, escolhidos por Alan. Casa nasce no lugar em que será soprada; quem sai pela direita entra pela esquerda. Checagem: `tests/coerencia-17.test.mjs`.
- O Lobo voa e cai do lado da casa (06/11/2026): "ele precisa voar e cair do lado da casa". Em Rabo em brasa ele sobe e sai por cima; em Cataplof! sobe, para, despenca e cai; a fuga começa onde ele caiu. Checagem: `tests/coerencia-17.test.mjs`.
- Página a mais sempre que a história precisar, para não ter furo (06/11/2026): "nem que precise adicionar mais páginas". Checagem: `tests/furos.test.mjs`.
- Narração por voz feminina calma da ElevenLabs (06/11/2026). A conta direta ficou sem créditos e Alan mandou tentar outro serviço, como a Magnific: as cenas foram gravadas por ela, que usa vozes da ElevenLabs.
- Lobo recortado da referência que Alan mandou (`arte/lobo-referencia.png`, 06/11/2026): "bem longe de ficar parecido com a referencia". Peças articuladas tiradas da própria imagem (`tools/lobo_pecas.py`, `src/lobo-recorte.js`), com o rig de fala, sopro, subida e fuga de antes. Ainda sem aprovação de Alan. Checagem: `tests/lobo-referencia.test.mjs`.

Decididos na construção, ainda sem aprovação de Alan:

- Dezessete cenas com cunha fixa de 45° (`CUNHA` em `src/book.js`, desacoplada do número de cenas); a referência tem seis. Só as páginas próximas ficam visíveis, então a estrela não precisa fechar 360° com 8 paredes.
- Os textos das cenas que não vêm da referência (obras, Lobo espiando, corridas, telhado, chaminé, rabo em brasa, tombo, fuga, festa, os três juntos) e a posição da terceira janela, na empena.
- O Lobo menor em cena, para caber na cunha sem atravessar as paredes do livro. Checagem: `tests/paredes.mjs`.
- Voz Yasmin Alves, escolhida pelos metadados, sem ouvir. A rota da Magnific só oferece o modelo Turbo v2.5 e não aceita `previous_text`, `next_text` nem `style`.
- Modo narrado (pedido de Alan, 06/11/2026: "no modo narrado o livro deve ir sozinho folhando"): vem ligado; a voz conduz e a página vira sozinha quando voz e gestos terminam. Mexer à mão continua valendo e desligar o botão devolve o ritmo a quem lê.
- Quem gesticula em cada palavra (`src/roteiro.json`), a boca dos porquinhos, que não existia, e os gestos só de narração (`soVoz` em `src/cenas.js`): entrada do Lobo, batida na porta e o "Fuuuu!" do Lobo em balão.
- Piloto de qualidade em três cenas (pedido de Alan, 09/11/2026: "elevar a qualidade da animação, detalhes dos cenários e personagens", com "não acarrete em muito mais peso ou perda de performance"): Hora de partir, A casa de palha e Cataplof!. Tudo entra por opção (`vivo: true`), e as outras 14 cenas não mudam até Alan aprovar o piloto. Porquinhos ganham sobrancelhas e pupilas que olham; expressões, antecipação e tremor vêm de `src/atuar.js`; vento, borboletas, passarinho, vagalumes, folhas e poeira vêm de `src/vida.js` e `src/objetos.js`; a cena pode guiar a câmera de leve (`camera` no retorno do montador, desligada para quem pede menos movimento). O Lobo usa as mesmas peças recortadas. Sem imagem nem áudio novos. Orçamento: no máximo 10% a mais de chamadas de desenho por cena e câmera de volta ao zero. Checagem: `tests/orcamento.test.mjs`.
- A respiração dos personagens agora soma ao que a linha do tempo escreve. Antes, ela apagava pulos e gestos de cabeça, inclusive sem voz: esses gestos autorais passam a aparecer.

## Recusado por Alan

- As adaptações geométricas do Lobo às fotos de pelúcia (06/11/2026): "Esse lobo ficou muito feio" e "bem longe de ficar parecido com a referencia". Não refazer o Lobo em formas desenhadas à mão.
- A trilha anterior, de Kevin MacLeod no acervo (06/11/2026): "as musicas de fundo nao fazem sentido algum" com a história. Música de ação de jogo e gênero trocando a cada cena não voltam.
- A última cena ou a contracapa aparecendo ao lado da primeira cena. Checagem: `tests/sequencia.test.mjs`.

## Sonoplastia

Auditoria pedida por Alan em 06/11/2026. Nada aqui foi ouvido por quem fez: é escolha por catálogo e medição, e Alan decide de ouvido.

- Efeitos passam por `busEfeitos`: cedem 4 dB enquanto a voz soa e voltam nas pausas. Voz fica seca, efeitos ganham espaço leve, e o limitador está na saída.
- Todo `tocar` varia altura e volume; `passo()` nunca repete a gravação. `pan` usa a posição na página, ou `[de, até]` quando o som atravessa a cena.
- A queda do Lobo em Cataplof! e o tropeço na corrida usam o som `tombo` (`impact-thud-2`).
- Sem gravação no acervo, ainda hoje: palha (usa papel amassado), rajada de sopro de boca (usa ar em movimento), barriga roncando e torcida infantil (`viva` são adolescentes).

## Regras do conteúdo

- Narração contínua, pedido de Alan em 07/11/2026: só o botão de narração desliga a preferência. Leitura textual, virada manual, sopro e falha temporária preservam a narração; ao voltar de interrupções ela retoma automaticamente. O mesmo player atravessa as páginas. Checagem: `tests/narracao-continua.test.mjs`.
- Zoom desativado por pedido de Alan em 06/11/2026: sem lupa/cartão de texto e sem ampliação por gestos. Checagem: `tests/jornada.mjs`, passar sobre o texto não abre sobreposição; pinça e roda com Ctrl não mudam a escala nem prendem a navegação.
- Créditos só no `README.md`, nunca sobre a mesa (pedido de Alan, 06/11/2026). `tests/telas.test.mjs` confere.
- Versão infantil: nenhum porquinho é comido e o Lobo foge.
- Personagens: João (palha), Lulu (madeira), Kael (tijolos) e Mamãe Porca. Nomes pedidos por Alan em 06/11/2026; os identificadores internos `pipo`, `tico` e `bento` continuam ligando os mesmos rigs e marcos.
- Regressões devolvidas por Alan em 06/11/2026: balões disputando posição e história presa ao virar. `tests/continuidade.test.mjs` cobre ordem estável das falas, toque cancelado e fim da voz durante a abertura ou antes do primeiro quadro.
- A música é original, gerada com Google Lyria 3 Pro pela Magnific (`tools/trilha.py`): a licença de uso público ainda não foi confirmada.

## Interação por sopro

- Alan pediu níveis de sopro nas casas: palha cede antes da madeira; tijolos nunca caem. Reusar animações e cronologia existentes.
- Recusado: painel pop-up, mesmo sem textos. A interação deve ser clean e integrada ao livro: vento real na cena e autorização discreta presa ao Lobo, sem miniaturas ou barra.
- O botão de ligar/desligar o modo sopro é importante e permanece discreto na barra do livro. Não restaurar botão de segurar ou simular sopro.
- O público é criança, e criança não sabe assoprar (Alan, 06/11/2026): "deixar bem claro que a criança tem que gritar fuuuuuuuu!". A voz da narração pede o grito (`tools/convites_sopro.py`), um balão enorme "Fuuuu!" sai do Lobo e cresce com o grito. Vale qualquer "fuuu" forte, com voz ou sopradinhas curtas somadas; grito, fala alta ou TV também derrubam, escolha de Alan. Só apito ou bipe puro fica de fora.
- A criança sopra junto com o Lobo: ele para de peito cheio, olha para ela, mostra o gesto enquanto a voz convida, e o grito dela sai da boca dele. A casa balança e inclina conforme ela grita.
- Quem não conseguir nunca fica preso (escolha de Alan, 06/11/2026): sem microfone, de imediato; tentando, depois de cerca de 8 s; o Lobo termina sozinho e a história segue. Isso substitui "somente o microfone faz a ação".
- O microfone é pedido quando o adulto liga o modo, não no meio da história. Captura local, calibração de 0,5 s com ruído limitado (a criança pode já estar gritando), energia preservada entre sopros, sem gravação ou envio. Compartilhar o AudioContext existente do livro; parar tracks ao concluir/sair/ocultar sem encerrar o áudio da história.
- `tests/sopro.test.mjs`: silêncio/apito/estalo, "fuuu" com voz, convite claro, Lobo termina sozinho, três casas por PCM, ausência de controle manual, contexto compartilhado, retomada, permissão tardia, projeção sem HUD e segunda leitura. Microfone físico e criança de verdade ainda precisam de teste: níveis e tempos saíram de sinal simulado.

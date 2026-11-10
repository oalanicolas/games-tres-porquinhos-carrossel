# Devlog e decisões — Os Três Porquinhos

Projeto: `prototypes/tres-porquinhos-carrossel`
Status: 17 cenas revisadas pela sessão e por um auditor; aprovação em movimento ainda com Alan.
Estado das rodadas: `docs/gauntlet-17-cenas.json`. Logs técnicos ficam nas evidências (`output/`, ignorado pelo Git).
O histórico anterior a esta entrada está em `AGENTS.md`, `README.md` e nos commits.

## Entrada — DEC-001: de 11 para 17 cenas

- **Data e tarefa:** 07/11/2026, gauntlet de 17 cenas (R0 a R8).
- **Direção de Alan:** "eu gostaria que a história tivesse mais cenas e na hora dele voar fosse amis coerente, pq ele
  voa para longe e no proximo aparece do lado da casa, ele precisa voar e cair do lado da casa entao". Na escolha de
  cenas, "Corridas" e "Lobo espiando"; recusou "Truques do Lobo" e "Barril na feira". Depois: "poderia ter uma cena
  para cada casa sendo construida nao? e nao as 3 juntas".
- **Estado anterior:** 11 cenas, com as três obras na mesma página e o Lobo sumindo no voo para reaparecer ao lado da
  casa na página seguinte.
- **Decisão (ADAPT):** ordem final em 17 cenas: partida, obra da palha, obra da madeira, obra do tijolo, espia, palha,
  corrida de Lulu, madeira, corrida de Kael, tijolo, telhado, chaminé, rabo, tombo, fuga, festa e juntos. Os
  montadores continuam em `src/cenas.js`, a voz em `src/roteiro.json` e `src/narracao.json`.
- **Rejeitadas por Alan:** "Truques do Lobo" e "Barril na feira".
- **Voo e queda:** na cena "rabo" o Lobo sobe reto e sai por cima; em "tombo" sai da chaminé, sobe, despenca e cai ao
  lado da casa em x -0,36, no mesmo cenário da fuga. `tests/coerencia-17.test.mjs` confere o percurso.
- **Escolhas sem Alan, reversíveis:**
  - árvore extra da flauta nas cenas de obra da madeira e madeira;
  - raias das corridas mais para trás, longe da barra de controles;
  - Lobo sai até a borda nas cenas da palha e da madeira;
  - casa de Lulu movida na corrida para x 0,41 (em x 0,44 atravessava a parede, `tests/paredes.mjs`);
  - empena fechada na casa de madeira, com as tábuas voando no sopro;
  - bolo na frente da barriga da Mamãe na festa;
  - Lobo recua no susto em fuga;
  - textos das cenas novas.
- **Mudanças de teste, com motivo:**
  - `DURACOES_MANUAIS[6]` de 4,8 para 9,3 s, porque a corrida foi reescrita;
  - listas por cena de música e sonoplastia migradas de 11 para 17 sem mudar as asserções;
  - skip por cena em `tests/coerencia-17.test.mjs` enquanto o montador não existia, sem efeito nas 17 atuais;
  - `tests/captura.mjs` passou a tratar `t` como segundo da narração nas cenas com voz.
- **Verificação:** percurso real pela interface 3 vezes na árvore final, todos exit 0, 17 cenas e sem erro de página
  (`output/revisao/percursos-finais.txt`); suíte completa no `fechar` da RF. Os recibos das rodadas estão no livro.
- **Reprodução real:** o modo narrado foi capturado inteiro em tempo real, sem posicionar a linha do tempo, e lido em 17
  folhas (`output/revisao/movimento.txt`). Achou um defeito que nenhum gate pegava: na cena da palha, a voz segura a fuga
  até "correu" e o fundo escuro da casa ficava cerca de 3,5 s sozinho. Corrigido; checagem nomeada em
  `tests/coerencia-17.test.mjs` ("palha: com a voz, o fundo escuro…"), que falha com o defeito de volta.
  A reprodução inteira foi repetida com o conserto (`output/revisao/movimento-final.txt`).
- **Mixagem medida nas 17 cenas** depois do recibo da RF (`node tests/mix-medida.mjs`, resultado em
  `output/revisao/mix-17.json`): de -14,9 a -13,5 LUFS, mediana -14, e o limitador reduz no máximo 0,86 dB. O pico mais
  alto é 0,2 dBFS na cena 7 (índice 7, madeira), medido sobre a gravação em Opus, que pode passar do sinal original; não
  dá para dizer se há corte sem ouvir ou medir antes do codificador.
- **Balão em branco da cena VI:** medido quadro a quadro na reprodução com voz. A bolha entra inteira e o texto sobe de
  0 a 1 em cerca de 85 ms, com opacidade 0 só nos dois primeiros quadros; o balão fica cerca de 0,75 s na tela. É a
  animação de entrada de `.balao span` (`src/style.css:136`), comum a todos os balões, e não um balão vazio. Nada mudou.
- **Não verificado:** ninguém ouviu a mixagem, os convites nem as narrações novas nesta rodada; o grito só foi testado
  com sinal simulado; celular só emulado, portanto **não testado em aparelho**.
- **Próxima ação:** a de `Continuidade`.

## Trabalho de outra sessão no mesmo período

O commit `218c1f7` ("melhora leitura e bloqueia zoom acidental do livro") não é deste gauntlet: revisão de interface
e acessibilidade (`docs/auditoria-interface-2026-11-07.md`). Ele entrou no `main` durante a R8. Os gates e o percurso
final rodaram com esse commit.

O reflog registra pushes de `origin/main` às 02:31:53 (`1cba9d1`), 03:14:49 (`218c1f7`) e 03:42:10 (`ff49a06`), que
não saíram desta sessão, cujo goal proíbe push. Por isso as rodadas R1 a R8 já estão no GitHub. Às 03:50 o site público
já servia o texto novo das 17 cenas (`last-modified` de 07/11/2026 03:14:56 GMT) e um deploy do módulo, iniciado às
03:42 por um processo do Codex (`output/deploy-20261107-r8/deploy.py`), ainda rodava seus testes. Nesta conversa não há
registro de quem pediu essa publicação.

## Continuidade

- **Onde estamos:** 17 cenas prontas, revisadas em captura e em movimento pela sessão, auditadas à parte (85 itens: 72
  passam, 2 falham, 11 dúvidas; cada apontamento respondido em `output/agentes/porquinhos-auditoria-17.md`). Esta sessão
  não enviou nem publicou nada, mas outra sessão enviou e publicou (seção acima), antes da aprovação de Alan nesta
  conversa.
- **Próximo passo:** Alan abre `http://127.0.0.1:4291/` e aprova ou devolve as 17 cenas em movimento (R9).
- **Por que agora:** só Alan aprova visual, e a versão de 17 cenas já está no ar sem essa aprovação registrada aqui.
- **Pronto quando:** há mensagem de Alan aprovando as cenas, ou cada defeito devolvido vira checagem nomeada.
- **Retomar por:** `python3 squads/goal-gauntlet/scripts/gauntlet.py placar prototypes/tres-porquinhos-carrossel/docs/gauntlet-17-cenas.json`.

### Decisões pendentes de Alan

1. Aprovar as 17 cenas em movimento (R9) e o Lobo diante da referência.
2. Ouvir mixagem, convites, sons novos e narrações novas, em especial "Lulu! Lulu!" na cena VII e "plaft" e "resmungou"
   na cena IX, onde a transcrição automática ouviu outra coisa.
3. Testar o grito com criança, microfone real, iPhone e Android.
4. Confirmar a licença de uso público da voz gerada na Magnific.
5. Confirmar se a publicação de 03:42 foi pedida por ele. O conserto da placa escura da cena VI já está no GitHub
   (conferido em 09/11/2026); o que está no ar depende de novo deploy, que não foi feito nem verificado.
6. Balão da Mamãe em "partida" (dúvida 11 da auditoria) e quartos em "juntos" (dúvida 14).
7. Lacunas do acervo de sons: palha, torcida infantil e barriga roncando.

### Prompt da próxima sessão

> Abri o livro dos Três Porquinhos (`prototypes/tres-porquinhos-carrossel`) e estas são as minhas observações das 17
> cenas em movimento: [aprovado, ou a lista do que mudar, cena por cena]. Corrija o que eu devolver, transforme cada
> defeito numa checagem e me mostre de novo. Se eu aprovar, envie ao GitHub e confira ou refaça a publicação em
> porquinhos.rabisco.net.

## Índice retomável

| Decisão | Afeta | Mudança | Evidência | Próximo passo |
|---|---|---|---|---|
| DEC-001 | `src/cenas.js`, `src/roteiro.json`, `src/narracao.json`, `src/objetos.js`, `src/audio.js` | 17 cenas, uma obra por casa, voo e queda coerentes | Livro `docs/gauntlet-17-cenas.json` (recibos R0 a R8), `tests/coerencia-17.test.mjs`, `tests/paredes.mjs` | Aprovação de Alan (R9) |

## Narração contínua — 7 de novembro de 2026

Alan relatou paradas depois de algumas páginas e pediu que apenas o botão de narração desligue a leitura automática. Dois casos foram reproduzidos antes da correção em `output/narracao-continua/antes.log`, autorização restrita ao primeiro player e pausa inesperada. Ambos deixavam o livro sem recuperação.

A voz agora reutiliza um elemento autorizado no gesto inicial. Falhas transitórias preservam a posição e são tentadas novamente. Pausa inesperada e suspensão de áudio são monitoradas; respostas atrasadas de páginas anteriores são descartadas. O modo de leitura mantém a narração e oferece o botão para desligá-la, substituindo a pausa automática escolhida na auditoria anterior.

A regressão está em `tests/narracao-continua.test.mjs`. O teste de acessibilidade foi atualizado para o pedido novo, de narração mantida durante a leitura. A validação completa e o percurso narrado real são registrados em `output/narracao-continua/`.

Verificado em Chrome headless com GPU Metal. O percurso real leu 17 de 17 cenas em 393.547 s, sem interação depois de abrir, e fechou o livro mantendo a preferência ligada. A suíte completa passou em 77 de 77 testes, com 0 falhas. Celular físico e Safari real continuam pendentes.

## Queda no Chrome do iPhone — 7 de novembro de 2026

Alan descreveu a página quebrando como se faltasse processamento. O levantamento encontrou 36 imagens de faces de papel sempre retidas. A cena completa referenciava 367931904 bytes estimados em imagens de textura, além da cópia de GPU e das geometrias. A estimativa não mede a RAM física do iPhone.

As páginas agora são carregadas por proximidade e liberadas antes de carregar outras. A abertura caiu para 124981504 bytes estimados nas imagens. As 36 faces recriadas coincidiram com os hashes anteriores. As cenas abertas comparadas tiveram zero pixels diferentes; há diferenças pequenas nas bordas internas durante o começo da abertura. A geometria temporária da ilustração da capa também é descartada após a captura.

A perda de contexto gráfico é tratada como pausa temporária. A cena e a preferência da narração são preservadas, assim como a energia de um sopro em andamento. As regressões estão em `tests/memoria.test.mjs`. Medições e comparações ficam em `output/memoria-iphone/`.

A validação completa passou em 80 de 80 testes. O percurso no WebKit emulado narrou 17 de 17 cenas, incluindo perda e restauração forçada do contexto gráfico, e terminou em 402.891 s. O iPhone físico ainda depende de validação de Alan.

## Piloto de qualidade em três cenas — 9 de novembro de 2026

Alan pediu mais qualidade de animação e mais detalhe em cenários e personagens, começando por um piloto em Hora de partir, A casa de palha e Cataplof!, sem ganhar muito peso nem perder desempenho. As outras 14 cenas ficam como estavam até ele aprovar.

Os porquinhos ganharam sobrancelhas e pupilas que olham para quem fala ou para onde vão. `src/atuar.js` reúne olhar, expressão, antecipação, assentar e tremor; o Lobo usa as mesmas peças recortadas. `src/vida.js` move o cenário sem alocar por quadro: copas, arbusto e nuvens ao vento, borboletas, passarinho na cerca, folhas, vagalumes e poeira na queda da casa de palha. Pedras, tufos, florzinhas e a colina distante são fundidos ao cenário. A cena pode guiar a câmera de leve, e isso fica desligado para quem pede menos movimento.

Medido em três rodadas intercaladas, Chrome headless com GPU Metal (Apple M3 Ultra), 1280×800, contra o commit `331d0b6`:

| Cena | Chamadas antes → depois | Malhas antes → depois | p95 por quadro antes (ms) | p95 depois (ms) |
|---|---|---|---|---|
| Hora de partir | 1257 → 1306 | 270 → 305 | 3,4 / 3,4 / 3,5 | 3,4 / 3,4 / 3,4 |
| A casa de palha | 2784 → 2827 | 286 → 320 | 5,1 / 5,6 / 5,5 | 5,6 / 5,7 / 5,5 |
| Cataplof! | 2861 → 2893 | 304 → 326 | 5,2 / 5,7 / 5,7 | 5,8 / 5,9 / 5,6 |

O JavaScript do build passou de 208166 para 216442 bytes comprimidos. Nenhuma imagem ou áudio novo. As 17 durações sem voz não mudaram. O teto de 10% de chamadas por cena e a volta da câmera ao zero estão em `tests/orcamento.test.mjs`. Não testado em dispositivo móvel.

## Melhorias nas 17 cenas e narração com a página escondida — 10 de novembro de 2026

Alan aprovou o piloto ("aprovado, pode continuar as melhorias") e as outras 14 cenas receberam o mesmo tratamento. Todo personagem nasce com sobrancelhas e pupilas; a atuação entra pelos gestos que as cenas já compartilham em `src/cenas.js` (o Lobo chega e enche o peito de cara fechada, quem foge leva medo no rosto, quem surge na janela olha para o Lobo). Árvores, arbustos e nuvens balançam, uma colina distante fecha o fundo, as cenas de dia têm uma borboleta e as de noite, vagalumes. A casa de madeira ganhou poeira e câmera no segundo sopro. As 17 durações sem voz não mudaram e nenhuma peça sai da cunha.

Mediana de cinco rodadas intercaladas contra o commit `d24aad7`, Chrome headless com GPU Metal (Apple M3 Ultra), 1280×800. O tempo é o custo de desenhar um quadro, em milissegundos.

| Cena | Chamadas | Malhas | p50 | p95 |
|---|---|---|---|---|
| 1 | 1306 → 1348 | 305 → 305 | 2,9 → 3,2 | 3,5 → 4,0 |
| 2 | 1770 → 1835 | 158 → 170 | 3,7 → 3,9 | 4,2 → 4,8 |
| 3 | 2495 → 2583 | 196 → 210 | 4,7 → 5,0 | 5,5 → 5,9 |
| 4 | 2449 → 2543 | 232 → 248 | 4,6 → 4,9 | 5,3 → 5,7 |
| 5 | 2533 → 2627 | 365 → 381 | 4,6 → 5,0 | 5,3 → 6,1 |
| 6 | 2827 → 2941 | 320 → 323 | 4,9 → 5,4 | 6,1 → 6,5 |
| 7 | 2939 → 3057 | 208 → 220 | 5,0 → 5,7 | 5,9 → 6,8 |
| 8 | 3049 → 3180 | 401 → 433 | 5,2 → 5,8 | 6,1 → 6,8 |
| 9 | 2969 → 3122 | 292 → 311 | 5,4 → 5,9 | 6,3 → 7,0 |
| 10 | 3130 → 3286 | 504 → 528 | 5,4 → 6,2 | 6,0 → 7,6 |
| 11 | 3006 → 3141 | 264 → 283 | 5,2 → 5,9 | 5,9 → 7,0 |
| 12 | 3015 → 3126 | 302 → 318 | 5,2 → 5,8 | 5,8 → 6,7 |
| 13 | 2723 → 2833 | 329 → 345 | 4,8 → 5,3 | 5,4 → 6,5 |
| 14 | 2844 → 2946 | 326 → 329 | 5,1 → 5,6 | 6,1 → 6,6 |
| 15 | 2859 → 2964 | 284 → 309 | 5,1 → 5,8 | 6,5 → 6,7 |
| 16 | 2295 → 2378 | 307 → 321 | 4,4 → 5,1 | 5,4 → 5,9 |
| 17 | 1725 → 1805 | 306 → 324 | 3,5 → 3,8 | 4,0 → 4,5 |

O custo existe e é pequeno: de 0,2 a 0,8 ms a mais por quadro na mediana, contra 16,7 ms de um quadro a 60 Hz. As cenas do piloto também subiram um pouco porque as páginas vizinhas, que aparecem junto, ficaram mais ricas. O JavaScript comprimido do build foi de 216442 para 217147 bytes. `tests/orcamento.test.mjs` passou a cobrar das 17 cenas o teto de 10% de chamadas sobre o que eram antes das melhorias. Não testado em dispositivo móvel.

No mesmo dia Alan devolveu: "a narração às vezes para, ela não pode parar a não ser que seja desligada". O percurso narrado real leu 17 de 17 cenas sem parar, e a pergunta sobre a situação ficou sem resposta. O código pausava a voz de propósito quando a página ficava escondida, o que no macOS inclui o Chrome inteiro atrás de outra janela. Com a narração ligada, a página escondida agora não pausa nada, a cena vai ao fim sem esperar quadros de animação e a página vira sozinha; no modo sopro, o Lobo sopra sozinho. A checagem é o sétimo teste de `tests/narracao-continua.test.mjs`, que esconde a página e corta os quadros. Se a parada que Alan viu for de outra origem, este registro não a cobre.

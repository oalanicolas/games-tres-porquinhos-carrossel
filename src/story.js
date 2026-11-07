// O texto do conto. Cada `linhas` vira parágrafo na parede e no cartão de leitura; `fala: true` recua a linha.
export const CAPA = {
  titulo: 'Os Três Porquinhos',
  sub: 'Conto popular · um livro-carrossel em dezessete cenas',
  acao: 'Abrir o livro',
};

export const CENAS = [
  {
    id: 'partida', titulo: 'Hora de partir', sub: 'Acene para os três irmãos na estrada.', acao: 'Dar tchau', legenda: 'Hora de partir', dica: 'Acene para os três irmãos, que já vão pegando a estrada.', fase: 0.08, parte: 'Manhã',
    linhas: [
      { t: 'Era uma vez três porquinhos que moravam com a mãe numa casinha pequena demais para tanto focinho.' },
      { t: 'Um dia, a Mamãe Porca disse:' },
      { t: '— Chegou a hora, meus filhos. Cada um vai construir a sua casa. Façam casas bem fortes, porque o Lobo anda por aí.', fala: true },
      { t: 'E lá se foram João, Lulu e Kael, de trouxa nas costas, estrada afora.' },
    ],
  },
  {
    id: 'obra-palha', titulo: 'A casa de João', sub: 'Junte a palha e veja a casa subir.', acao: 'Juntar palha', legenda: 'A casa de João', dica: 'João amarra a palha de qualquer jeito e sai dando cambalhotas.', fase: 0.14, parte: 'Fim da manhã',
    linhas: [
      { t: 'João só queria brincar.' },
      { t: 'Juntou um monte de palha, amarrou de qualquer jeito e, em cinco minutos, a casa estava pronta.' },
      { t: '— Pronto! Agora é só brincar! — disse João.', fala: true },
      { t: 'E saiu dando cambalhotas pelo campo.' },
    ],
  },
  {
    id: 'obra-madeira', titulo: 'A casa de Lulu', sub: 'Pregue as tábuas, mesmo tortas.', acao: 'Pregar', legenda: 'A casa de Lulu', dica: 'Lulu prega as tábuas às pressas e vai tocar flauta.', fase: 0.2, parte: 'Meio-dia',
    linhas: [
      { t: 'Um pouco adiante, Lulu catou umas tábuas e pregou tudo às pressas.' },
      { t: 'Uma tábua ficou torta, outra ficou sobrando.' },
      { t: '— Está ótimo assim! — disse Lulu.', fala: true },
      { t: 'E foi tocar flauta debaixo de uma árvore.' },
    ],
  },
  {
    id: 'obra-tijolo', titulo: 'A casa de Kael', sub: 'Tijolo por tijolo, sem pressa.', acao: 'Assentar', legenda: 'A casa de Kael', dica: 'Kael sobe a casa tijolo por tijolo, e os irmãos passam rindo.', fase: 0.25, parte: 'Começo da tarde',
    linhas: [
      { t: 'Kael carregou tijolo por tijolo, o dia inteiro.' },
      { t: 'João e Lulu passaram por ali e riram:' },
      { t: '— Para que tanto trabalho?', fala: true },
      { t: '— Vocês vão ver — disse Kael, e passou mais massa.', fala: true },
    ],
  },
  {
    id: 'espia', titulo: 'Alguém espiando', sub: 'Tem alguém atrás da moita.', acao: 'Espiar', legenda: 'Alguém espiando', dica: 'Atrás da moita, o Lobo fareja o ar e escolhe por onde começar.', fase: 0.3, parte: 'Tarde',
    linhas: [
      { t: 'O que ninguém viu foi que, atrás de uma moita, dois olhos espiavam tudo.' },
      { t: 'Era o Lobo, de focinho no vento, farejando o cheiro de porquinho.' },
      { t: '— Palha, madeira e tijolo — sussurrou, lambendo os beiços. — Vou começar pela mais fácil.', fala: true },
    ],
  },
  {
    id: 'palha', titulo: 'A casa de palha', sub: 'Encha o peito do Lobo e sopre.', acao: 'Soprar', legenda: 'A casa de palha', dica: 'Encha o peito do Lobo e sopre a palha para longe.', fase: 0.34, parte: 'Tarde',
    linhas: [
      { t: 'Não demorou e o Lobo chegou, de barriga roncando. Bateu na porta de palha:' },
      { t: '— Porquinho, porquinho, deixe eu entrar!', fala: true },
      { t: '— Não, não e não! — gritou João.', fala: true },
      { t: '— Então eu vou soprar, e soprar, e a sua casa derrubar!', fala: true },
      { t: 'Encheu o peito e… fuuuu! A palha voou para todo lado, e João correu para a casa do irmão.' },
    ],
  },
  {
    id: 'corrida-lulu', titulo: 'Corre, João!', sub: 'João corre, e o Lobo vem atrás.', acao: 'Correr', legenda: 'Corre, João!', dica: 'João pula a pedra e atravessa a ponte. O Lobo vem farejando o rastro.', fase: 0.38, parte: 'Tarde',
    linhas: [
      { t: 'João correu o mais rápido que suas perninhas deixavam.' },
      { t: 'Pulou uma pedra, atravessou a ponte do riacho e nem olhou para trás.' },
      { t: 'Atrás dele vinha o Lobo, farejando o rastro de palha.' },
      { t: '— Lulu! Lulu! Abra a porta! — gritava João.', fala: true },
    ],
  },
  {
    id: 'madeira', titulo: 'A casa de madeira', sub: 'João chega correndo. Lá vem o Lobo atrás.', acao: 'Soprar forte', legenda: 'A casa de madeira', dica: 'João entra correndo. Depois, duas sopradas: as tábuas rangem e a casa vem abaixo.', fase: 0.42, parte: 'Fim da tarde',
    linhas: [
      { t: 'João chegou sem fôlego à casa de Lulu, e os dois trancaram a porta.' },
      { t: 'O Lobo foi atrás e bateu na porta de tábuas:' },
      { t: '— Porquinhos, porquinhos, deixem eu entrar!', fala: true },
      { t: '— Não, não e não! — gritaram os dois.', fala: true },
      { t: '— Então eu vou soprar, e soprar, e a sua casa derrubar!', fala: true },
      { t: 'Soprou uma vez, e as tábuas rangeram. Soprou outra, e a casa despencou inteirinha. João e Lulu dispararam para a casa de Kael.' },
    ],
  },
  {
    id: 'corrida-kael', titulo: 'Corram, corram!', sub: 'Morro acima, e o Lobo tropeça.', acao: 'Correr morro acima', legenda: 'Corram, corram!', dica: 'João e Lulu pulam o tronco. O Lobo não tem a mesma sorte.', fase: 0.46, parte: 'Fim da tarde',
    linhas: [
      { t: 'João e Lulu correram morro acima, tropeçando nos próprios pés.' },
      { t: 'O Lobo vinha logo atrás, mas, pulando um tronco caído… plaft! Foi de focinho no chão.' },
      { t: '— Ai! — resmungou, e levantou bufando.', fala: true },
      { t: 'Lá no alto, a chaminé de Kael soltava fumaça. Estavam quase lá.' },
    ],
  },
  {
    id: 'tijolo', titulo: 'A casa de tijolos', sub: 'Todos para dentro. Agora sopre até ficar roxo.', acao: 'Entrem, entrem!', legenda: 'A casa de tijolos', dica: 'Kael abre a porta e entra por último. Depois, o Lobo sopra com tudo o que tem.', fase: 0.5, parte: 'Pôr do sol',
    linhas: [
      { t: 'João e Lulu chegaram sem ar à casa de Kael.' },
      { t: '— Entrem, entrem! — gritou Kael.', fala: true },
      { t: 'João entrou, Lulu entrou, e Kael entrou por último e trancou a porta.' },
      { t: 'O Lobo chegou bufando:' },
      { t: '— Porquinhos, porquinhos, deixem eu entrar!', fala: true },
      { t: '— Não, não e não!', fala: true },
      { t: '— Então eu vou soprar, e soprar, e a sua casa derrubar!', fala: true },
      { t: 'Soprou, soprou e soprou, até ficar roxo. A casa nem tremeu. Lá dentro, os três tomavam sopa.' },
    ],
  },
  {
    id: 'telhado', titulo: 'A chaminé!', sub: 'O Lobo olha para cima. Suba com ele, de mansinho.', acao: 'Subir no telhado', legenda: 'A chaminé!', dica: 'O Lobo sobe pelo barril até as telhas. Lá dentro, Kael ouve.', fase: 0.6, parte: 'Anoitecer',
    linhas: [
      { t: 'Sem fôlego, o Lobo olhou para cima e sorriu:' },
      { t: '— A chaminé!', fala: true },
      { t: 'Subiu no telhado, de mansinho. Mas Kael ouviu os passos nas telhas.' },
    ],
  },
  {
    id: 'chamine', titulo: 'Depressa!', sub: 'O Lobo está lá em cima. Lenha no fogo!', acao: 'Atiçar o fogo', legenda: 'Depressa!', dica: 'Lenha, brasas e o caldeirão empurrado para debaixo da chaminé.', fase: 0.7, parte: 'Noitinha',
    linhas: [
      { t: '— Depressa, lenha no fogo! — gritou Kael.', fala: true },
      { t: 'João soprou as brasas, Lulu empurrou o caldeirão, e a água começou a ferver bem debaixo da chaminé.' },
      { t: 'Lá em cima, o Lobo já espiava pela boca da chaminé.' },
    ],
  },
  {
    id: 'rabo', titulo: 'Rabo em brasa', sub: 'Lá vem ele chaminé abaixo.', acao: 'Tchibum!', legenda: 'Rabo em brasa', dica: 'Solte o Lobo chaminé abaixo e veja por onde ele sai.', fase: 0.8, parte: 'Noite',
    linhas: [
      { t: 'O Lobo desceu pela chaminé, escorregou e… tchibum! Caiu direto no caldeirão.' },
      { t: 'Deu um uivo que se ouviu em sete montanhas e saiu pela chaminé como um foguete, com o rabo soltando fumaça.' },
    ],
  },
  {
    id: 'tombo', titulo: 'Cataplof!', sub: 'Tudo o que sobe, desce.', acao: 'Olhar para cima', legenda: 'Cataplof!', dica: 'O Lobo sobe até o meio do céu, olha para baixo e despenca ao lado da casa.', fase: 0.84, parte: 'Noite',
    linhas: [
      { t: 'O Lobo subiu, subiu, subiu… até parar lá no alto, no meio do céu.' },
      { t: 'Olhou para baixo e engoliu em seco.' },
      { t: '— Ih… — disse o Lobo.', fala: true },
      { t: 'E despencou lá de cima, rodopiando. Cataplof! Caiu bem do lado da casa, no meio de uma nuvem de poeira.' },
      { t: 'Os três porquinhos abriram a porta e vieram ver.' },
    ],
  },
  {
    id: 'fuga', titulo: 'Correu, correu', sub: 'Lá vai ele, morro acima.', acao: 'Espantar o Lobo', legenda: 'Correu, correu', dica: 'Da porta, os três espantam o Lobo até ele sumir atrás do morro.', fase: 0.88, parte: 'Noite alta',
    linhas: [
      { t: '— E não volte nunca mais! — gritaram os três, da porta.', fala: true },
      { t: 'O Lobo correu, correu, correu, e nunca mais voltou àquele lugar.' },
    ],
  },
  {
    id: 'festa', titulo: 'A festa', sub: 'Acenda os fogos e dance com a família.', acao: 'Festejar', legenda: 'A festa', dica: 'Acenda os fogos e dance com a família inteira.', fase: 0.94, parte: 'Madrugada',
    linhas: [
      { t: 'Naquela noite, ninguém dormiu cedo. A Mamãe Porca chegou com um bolo, e os três dançaram em volta da fogueira.' },
    ],
  },
  {
    id: 'juntos', titulo: 'A casa que o vento não leva', sub: 'Erga os quartos novos. É o fim da história.', acao: 'Erguer os quartos', legenda: 'A casa que o vento não leva', dica: 'João e Lulu assentam os tijolos, e Kael aprende a tocar flauta.', fase: 1, parte: 'Fim',
    linhas: [
      { t: 'Depois disso, João e Lulu aprenderam a assentar tijolo, e juntos ergueram mais dois quartos.' },
      { t: 'Kael aprendeu a tocar flauta.' },
      { t: 'E viveram felizes na casa que o vento não leva.' },
      { t: 'Fim.' },
    ],
  },
];

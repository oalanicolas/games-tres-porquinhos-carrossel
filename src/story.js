// O texto do conto. Cada `linhas` vira parágrafo na parede e no cartão de leitura; `fala: true` recua a linha.
export const CAPA = {
  titulo: 'Os Três Porquinhos',
  sub: 'Conto popular · um livro-carrossel em oito cenas',
  acao: 'Abrir o livro',
};

export const CENAS = [
  {
    id: 'partida', titulo: 'Hora de partir', sub: 'Acene para os três irmãos na estrada.', acao: 'Dar tchau', legenda: 'Hora de partir', dica: 'Acene para os três irmãos, que já vão pegando a estrada.', fase: 0.08, parte: 'Manhã',
    linhas: [
      { t: 'Era uma vez três porquinhos que moravam com a mãe numa casinha pequena demais para tanto focinho.' },
      { t: 'Um dia, a Mamãe Porca disse:' },
      { t: '— Chegou a hora, meus filhos. Cada um vai construir a sua casa. Façam casas bem fortes, porque o Lobo anda por aí.', fala: true },
      { t: 'E lá se foram Pipo, Tico e Bento, de trouxa nas costas, estrada afora.' },
    ],
  },
  {
    id: 'obra', titulo: 'Três casas', sub: 'Levante a palha, a madeira e o tijolo.', acao: 'Construir', legenda: 'Três casas', dica: 'Levante as três casas: uma de palha, uma de madeira e uma de tijolo.', fase: 0.2, parte: 'Meio-dia',
    linhas: [
      { t: 'Pipo só queria brincar. Juntou um monte de palha e, em cinco minutos, a casa estava pronta.' },
      { t: 'Tico pregou umas tábuas às pressas e foi tocar flauta.' },
      { t: 'Bento carregou tijolo por tijolo, o dia inteiro.' },
      { t: '— Para que tanto trabalho? — riram os irmãos.', fala: true },
      { t: '— Vocês vão ver — disse Bento, e passou mais massa.', fala: true },
    ],
  },
  {
    id: 'palha', titulo: 'A casa de palha', sub: 'Encha o peito do Lobo e sopre.', acao: 'Soprar', legenda: 'A casa de palha', dica: 'Encha o peito do Lobo e sopre a palha para longe.', fase: 0.34, parte: 'Tarde',
    linhas: [
      { t: 'Não demorou e o Lobo chegou, de barriga roncando. Bateu na porta de palha:' },
      { t: '— Porquinho, porquinho, deixe eu entrar!', fala: true },
      { t: '— Não, não e não! — gritou Pipo.', fala: true },
      { t: '— Então eu vou soprar, e soprar, e a sua casa derrubar!', fala: true },
      { t: 'Encheu o peito e… fuuuu! A palha voou para todo lado, e Pipo correu para a casa do irmão.' },
    ],
  },
  {
    id: 'madeira', titulo: 'A casa de madeira', sub: 'Duas sopradas e as tábuas vão ao chão.', acao: 'Soprar forte', legenda: 'A casa de madeira', dica: 'Sopre duas vezes: as tábuas rangem e a casa vem abaixo.', fase: 0.46, parte: 'Fim da tarde',
    linhas: [
      { t: 'O Lobo foi atrás e bateu na porta de tábuas:' },
      { t: '— Porquinhos, porquinhos, deixem eu entrar!', fala: true },
      { t: '— Não, não e não! — gritaram os dois.', fala: true },
      { t: '— Então eu vou soprar, e soprar, e a sua casa derrubar!', fala: true },
      { t: 'Soprou uma vez, e as tábuas rangeram. Soprou outra, e a casa despencou inteirinha. Pipo e Tico dispararam para a casa de Bento.' },
    ],
  },
  {
    id: 'tijolo', titulo: 'A casa de tijolos', sub: 'Sopre até ficar roxo. Ela não cai.', acao: 'Soprar com tudo', legenda: 'A casa de tijolos', dica: 'Sopre com tudo o que o Lobo tem. Veja o que acontece.', fase: 0.58, parte: 'Pôr do sol',
    linhas: [
      { t: '— Entrem, entrem! — disse Bento, e trancou a porta.', fala: true },
      { t: 'O Lobo chegou bufando:' },
      { t: '— Porquinhos, porquinhos, deixem eu entrar!', fala: true },
      { t: '— Não, não e não!', fala: true },
      { t: '— Então eu vou soprar, e soprar, e a sua casa derrubar!', fala: true },
      { t: 'Soprou, soprou e soprou, até ficar roxo. A casa nem tremeu. Lá dentro, os três tomavam sopa.' },
    ],
  },
  {
    id: 'chamine', titulo: 'Pela chaminé', sub: 'O Lobo está no telhado. Depressa, lenha no fogo!', acao: 'Atiçar o fogo', legenda: 'Pela chaminé', dica: 'O Lobo está no telhado. Atice o fogo debaixo do caldeirão.', fase: 0.72, parte: 'Anoitecer',
    linhas: [
      { t: 'Sem fôlego, o Lobo olhou para cima e sorriu:' },
      { t: '— A chaminé!', fala: true },
      { t: 'Subiu no telhado, de mansinho. Mas Bento ouviu os passos nas telhas.' },
      { t: '— Depressa, lenha no fogo!', fala: true },
      { t: 'Pipo soprou as brasas, Tico empurrou o caldeirão, e a água começou a ferver bem debaixo da chaminé.' },
    ],
  },
  {
    id: 'rabo', titulo: 'Rabo em brasa', sub: 'Lá vem ele chaminé abaixo.', acao: 'Tchibum!', legenda: 'Rabo em brasa', dica: 'Solte o Lobo chaminé abaixo e veja por onde ele sai.', fase: 0.86, parte: 'Noite',
    linhas: [
      { t: 'O Lobo desceu pela chaminé, escorregou e… tchibum! Caiu direto no caldeirão.' },
      { t: 'Deu um uivo que se ouviu em sete montanhas e saiu pela chaminé como um foguete, com o rabo soltando fumaça.' },
      { t: 'Correu, correu, correu, e nunca mais voltou àquele lugar.' },
    ],
  },
  {
    id: 'festa', titulo: 'A festa', sub: 'Acenda os fogos. É o fim da história.', acao: 'Festejar', legenda: 'A festa', dica: 'Acenda os fogos e dance com a família inteira.', fase: 1, parte: 'Fim',
    linhas: [
      { t: 'Naquela noite, ninguém dormiu cedo. A Mamãe Porca chegou com um bolo, e os três dançaram em volta da fogueira.' },
      { t: 'Pipo e Tico aprenderam a assentar tijolo, e juntos ergueram mais dois quartos. Bento aprendeu a tocar flauta.' },
      { t: 'E viveram felizes na casa que o vento não leva.' },
      { t: 'Fim.' },
    ],
  },
];

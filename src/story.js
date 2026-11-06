// O texto do conto. Cada `linhas` vira parágrafo na parede e no cartão de leitura; `fala: true` recua a linha.
export const CAPA = {
  titulo: 'Os Três Porquinhos',
  sub: 'Conto popular · um livro-carrossel em onze cenas',
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
    id: 'obra', titulo: 'Três casas', sub: 'Levante a palha, a madeira e o tijolo.', acao: 'Construir', legenda: 'Três casas', dica: 'Levante as três casas: uma de palha, uma de madeira e uma de tijolo.', fase: 0.2, parte: 'Meio-dia',
    linhas: [
      { t: 'João só queria brincar. Juntou um monte de palha e, em cinco minutos, a casa estava pronta.' },
      { t: 'Lulu pregou umas tábuas às pressas e foi tocar flauta.' },
      { t: 'Kael carregou tijolo por tijolo, o dia inteiro.' },
      { t: '— Para que tanto trabalho? — riram os irmãos.', fala: true },
      { t: '— Vocês vão ver — disse Kael, e passou mais massa.', fala: true },
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

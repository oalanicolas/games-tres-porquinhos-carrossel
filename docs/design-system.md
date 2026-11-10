# Design system

## Materiais

Tudo é papel: recortes extrudados com estampa (listras, bolinhas, chevron, madeira), material fosco e sombra macia. Sem textura pronta e sem brilho.

## Cores

| Uso | Cor |
|---|---|
| Mesa e neblina | `#71472a` |
| Capa | teal, com fios dourados |
| Miolo do livro | coral |
| Fitas | palha |
| Papel das paredes | creme |
| Luz ambiente | `#fffaf4` e `#efe3d6` |
| Luz principal | `#fff8ef` |

O céu percorre o dia ao longo do livro: manhã, meio-dia, tarde, fim da tarde, anoitecer, noite e festa com estrelas.

## Tipografia

- Títulos: Fraunces Variable.
- Corpo do conto: Libre Caslon Text.
- Interface: Inter Variable.

## Interface

Pílulas translúcidas sobre a mesa: título à esquerda, momento do dia à direita, navegação embaixo. Em celular deitado, a barra vira uma única linha para não cobrir o livro.

Os controles têm área mínima de 44 × 44 px. Em retrato, navegação e opções formam grupos separados. O cabeçalho quebra em linhas quando o título e o momento do dia precisam de mais espaço. As cores da interface vêm dos tokens em `src/style.css`, com uma superfície de papel suficientemente opaca para manter o contraste sobre qualquer cena.

## Leitura e acessibilidade

O ícone de livro abre a leitura em uma página de papel integrada à tela. Títulos, parágrafos e falas vêm da mesma lista `CENAS` usada pelas ilustrações. O texto também fica disponível para tecnologia assistiva durante a apresentação ilustrada.

Os botões A− e A+ ajustam a leitura de 100% a 200%. A página aceita rolagem vertical e seleção de texto. Pinça e dois toques mantêm o enquadramento fixo, inclusive durante a leitura. A narração continua no modo de leitura e leva o texto para a próxima página. Seu botão permanece acessível para desligá-la manualmente. O desenho 3D pausa durante a leitura, enquanto o relógio da história continua.

O modo “Só olhar” transfere o foco para “Mostrar controles” e torna a navegação oculta inerte. Escape recupera a navegação e seu foco. As abas de cenas usam uma única parada de Tab e permitem navegação pelas setas, Home e End.

O alto contraste do sistema usa cores semânticas do navegador. A redução de movimento preserva a mudança de estado, com abertura e giro imediatos e animações decorativas suprimidas.

## Som

- A trilha é uma peça só: pizzicato, flauta, clarinete, fagote, harpa e glockenspiel, com um tema de fagote para o Lobo. Cada momento tem a sua faixa, com fusão de 1,6 s. O mapa está em `src/audio.js`.
- A música abaixa enquanto a cena age.
- Efeitos e ambientes são gravações reais do acervo do estúdio.

## Abertura da página

A cena em foco abre 90° em paisagem e 64° em retrato; as vizinhas mantêm 45°. A largura muda de forma contínua durante o giro. As paredes, o chão e as peças coladas nelas acompanham a abertura; a arte central mantém o tamanho.

## Balões

Papel `#fffdf4`, borda `#e8d9c4`, sombra de papel e a fonte de títulos, com cauda apontando para a cabeça de quem fala. Um balão por personagem, em HTML, para continuar legível no celular. Fica sobre a cabeça, não sai da tela e não cobre o vizinho. Aparece 0,1 s antes da fala e sai 0,35 s depois, sem animação de entrada em `prefers-reduced-motion`.

## Voz

Enquanto a voz fala, a música cai para 0,3 e o ambiente para 0,75.

## Lobo

Recortado da imagem de referência enviada por Alan em 06/11/2026 (`arte/lobo-referencia.png`): as peças articuladas saem da própria imagem (`tools/lobo_pecas.py`, `src/lobo-recorte.js`) e levam o rig de fala, sopro, subida e fuga. Traços: cinza, focinho e nariz grandes, barriga clara e lenço azul. A adaptação anterior, em formas desenhadas a partir das fotos de pelúcia, foi recusada por Alan e não volta. O Lobo atual ainda aguarda a aprovação dele.

## Memória das páginas

As faces de papel próximas da câmera mantêm as texturas originais em 1400 × 1276. Páginas distantes liberam a textura da GPU e seu canvas; os mesmos pintores as recriam ao voltar. Uma página adicional antecipa o giro. A medição dos textos continua cobrindo todas as cenas antes da montagem para preservar as posições dos objetos.

A perda temporária do contexto gráfico conserva a cena, o ponto da voz e a energia do sopro. A reprodução retoma quando o contexto é restaurado.

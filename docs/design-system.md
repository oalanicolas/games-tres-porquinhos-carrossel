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

## Som

- A trilha é uma peça só: pizzicato, flauta, clarinete, fagote, harpa e glockenspiel, com um tema de fagote para o Lobo. Cada momento tem a sua faixa, com fusão de 1,6 s. O mapa está em `src/audio.js`.
- A música abaixa enquanto a cena age.
- Efeitos e ambientes são gravações reais do acervo do estúdio.

## Abertura da página

A cena em foco abre 90° em paisagem e 64° em retrato; as vizinhas mantêm 45°. A largura muda de forma contínua durante o giro. As paredes, o chão e as peças coladas nelas acompanham a abertura; a arte central mantém o tamanho.

## Balões

Papel `#fffdf4`, borda `#e8d9c4`, sombra de papel e a fonte de títulos, com cauda apontando para a cabeça de quem fala. Um balão por personagem, em HTML, para continuar legível no celular. Fica sobre a cabeça, não sai da tela e não cobre o vizinho. Aparece 0,1 s antes da fala e sai 0,35 s depois, sem animação de entrada em `prefers-reduced-motion`.

## Voz

Enquanto a voz fala, a música cai para 0,3 e o ambiente para 0,5.

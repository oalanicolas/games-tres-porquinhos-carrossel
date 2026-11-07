# Revisão da interface — 7 de novembro de 2026

A auditoria inicial encontrou seis defeitos e atribuiu 13/20 à interface. Os seis foram corrigidos. A revisão usa vinte verificações observáveis, descritas abaixo. A contagem de verificações não substitui a nota qualitativa inicial nem certifica conformidade integral com WCAG.

## Correções

- Contraste secundário reforçado, com superfície de papel mais opaca e tinta escura. A combinação medida passou de 3,80 para 9,24.
- Texto integral das 17 cenas exposto em HTML, usando os mesmos dados que desenham o livro.
- Estados ocultos removidos da navegação por teclado. “Só olhar” leva o foco ao botão de retorno e o restaura ao sair.
- Cabeçalho reorganizado em telas estreitas, sem sobreposição em 320 px.
- Controles com área acionável mínima de 44 × 44 px. Em retrato, os grupos ocupam linhas separadas.
- Leitura ampliada até 200%, com rolagem vertical dentro da página e sem ampliar a cena.

Pinça, dois toques e gestos de zoom continuam bloqueados por pedido de Alan. O ajuste A−/A+ altera apenas o texto no modo de leitura. Ao entrar nesse modo, a narração e a renderização da cena pausam. Ao voltar, a preferência anterior da narração é restaurada na página escolhida.

## Vinte verificações

1. Texto completo das 17 cenas corresponde à fonte `CENAS`.
2. Cabeçalho e parágrafos têm estrutura HTML acessível.
3. Abertura e carregamento ocultos saem da árvore acessível.
4. “Só olhar” remove controles invisíveis da ordem de foco.
5. Retorno de “Só olhar” restaura foco visível.
6. Abas de cenas usam foco móvel e setas sem avanço duplicado.
7. Nenhuma violação detectada pelo axe-core 4.14.0 nos sete estados inspecionados.
8. Contraste medido da abertura atende ao mínimo para título e corpo.
9. Contraste secundário atende ao mínimo, inclusive sobre fundo preto conservador.
10. Cabeçalho sem colisão entre 320 e 1440 px.
11. Controles visíveis têm no mínimo 44 × 44 px.
12. Interface sem transbordamento horizontal nas seis dimensões testadas.
13. Texto ampliado a 200% cabe horizontalmente.
14. Rolagem de leitura funciona com roda e toque sintetizado.
15. Preferência de narração é restaurada ao sair da leitura.
16. Entrada na leitura durante a abertura mantém navegação funcional.
17. Pinça e dois toques mantêm escala 1 e permitem continuar a história.
18. Cancelamento de gesto e perda de foco liberam o arrasto.
19. Cores forçadas e movimento reduzido preservam acesso ao conteúdo.
20. Leitura suspende os quadros WebGL, e três rodadas intercaladas de animação mantêm p95 de 16,7–16,8 ms no M3 Ultra.

## Método e limites

As vinte verificações acima passaram na revisão local. O gate completo executou 70 testes, todos aprovados, e o build de produção terminou sem falha. A suíte inclui narração até o encerramento do livro, gestos, sopro por sinal simulado e conteúdo das 17 cenas.

Capturas finais de 320 × 568, 390 × 844, 844 × 390, 1440 × 870 e leitura ampliada foram inspecionadas. Chrome headless com GPU real, ANGLE Metal em Apple M3 Ultra. O axe não resolve automaticamente o contraste sobre canvas, por isso as combinações foram medidas separadamente. Os registros ficam em `output/audit-impeccable-20261107/`.

O detector Impeccable manteve dois apontamentos sobre sombras marrons e um sobre a curva de entrada dos balões. Foram conferidos como características intencionais do papel animado. As regras do detector foram preservadas.

O teste de layout passou a conferir a linha de cada grupo e alvos de 44 px, acompanhando a organização responsiva em duas linhas. A exigência anterior de todos os controles na mesma linha foi substituída deliberadamente. O limite de altura em paisagem permanece.

Celular físico, Safari, leitor de tela real e microfone físico não foram testados nesta rodada. A comparação visual mantém o livro e seus personagens atuais. A aprovação estética do novo Lobo continua sendo de Alan.

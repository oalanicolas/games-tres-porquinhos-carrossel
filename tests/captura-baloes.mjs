// Capturas de QA dos balões: `LIVRO_URL=<url> SAIDA=<pasta> node tests/captura-baloes.mjs`. Temporárias: apague depois de olhar.
import { mkdirSync, readFileSync } from 'node:fs';
import { abrir } from './_apoio.mjs';
const { faixas } = JSON.parse(readFileSync(new URL('../src/narracao.json', import.meta.url)));
const saida = process.env.SAIDA || 'output/qa'; mkdirSync(saida, { recursive: true });
const escolhas = Object.keys(faixas).flatMap((i) => faixas[i].falas.map((_, k) => [+i, k]));
for (const [largura, altura] of (process.env.TELAS ? JSON.parse(process.env.TELAS) : [[1440, 870], [390, 844], [360, 640], [844, 390]])) {
  const { page, fechar } = await abrir({ largura, altura, url: process.env.LIVRO_URL });
  for (const [i, k] of escolhas) {
    const fala = faixas[i].falas[k]; const t = (fala.de + fala.ate) / 2;
    await page.evaluate(([i, t, marcos, base]) => {
      const L = window.__livro; L.abrirNaHora(i); const c = L.cenas[i]; const a = L.audio;
      c.linha.desancorar().ancorar(marcos, base); c.linha.seek(t); a.tempoVoz = (j) => (j === i ? t : null); a.nivelVoz = () => 0.7;
    }, [i, t, faixas[i].marcos, faixas[i].acao_em]);
    await page.waitForTimeout(320);
    await page.screenshot({ path: `${saida}/${largura}x${altura}-c${i + 1}-f${k + 1}.png` });
    await page.evaluate((i) => { const c = window.__livro.cenas[i]; c.linha.desancorar(); c.linha.reset(); }, i);
  }
  await fechar();
}

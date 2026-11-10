// Folha de contato de cada página nos segundos da voz: uma captura logo depois de cada marco do roteiro.
// Uso: node tests/folha-voz.mjs <pasta> [cenas] [segundos] . Lê LIVRO_URL (padrão: servidor local) e escreve um PNG por marco.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync } from 'node:fs';
const { faixas } = JSON.parse(readFileSync(new URL('../src/narracao.json', import.meta.url)));
const [pasta = 'output/qa/folha', lista, instantes] = process.argv.slice(2); mkdirSync(pasta, { recursive: true });
const cenas = lista ? lista.split(',').map(Number) : Object.keys(faixas).map(Number);
const b = await chromium.launch({ channel: 'chrome', headless: !process.env.QA_HEADED, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const page = await b.newPage({ viewport: { width: Number(process.env.W || 960), height: Number(process.env.H || 580) } });
const erros = []; page.on('pageerror', (e) => erros.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
await page.goto(`${process.env.LIVRO_URL || 'http://127.0.0.1:4291/'}?qa=1`); await page.waitForFunction(() => window.__livro, null, { timeout: 90000 });
await page.waitForTimeout(500);
for (const i of cenas) {
  const f = faixas[i]; const tempos = [...new Set(Object.values(f.marcos).map((m) => m.em))].sort((a, b) => a - b);
  const pontos = tempos.map((t, k) => (Math.min(t + 0.9, tempos[k + 1] ?? f.duracao))); pontos.push(f.duracao - 0.05); if (instantes) { pontos.length = 0; pontos.push(...instantes.split(',').map(Number)); }
  await page.evaluate(([i, f]) => { const c = window.__livro.cenas[i]; c.linha.desancorar(); c.linha.ancorar(f.marcos, f.acao_em); window.__livro.cenaEm(i, 0); }, [i, f]);
  for (let k = 0; k < pontos.length; k++) {
    const t = pontos[k];
    await page.evaluate(([i, t]) => { const L = window.__livro; L.audio.tempoVoz = () => t; L.audio.nivelVoz = () => 0.8; L.cenas[i].linha.seek(t); L.cenaEm(i, t); L.atuacao?.desfazer?.(); L.atuacao?.quadro?.(i, 1); }, [i, t]);
    await page.waitForTimeout(160);
    await page.screenshot({ path: `${pasta}/c${String(i).padStart(2, '0')}-${String(k).padStart(2, '0')}-${t.toFixed(1)}.png` });
  }
  await page.evaluate((i) => { const c = window.__livro.cenas[i]; c.linha.desancorar(); c.linha.reset(); }, i);
}
console.log('erros', JSON.stringify(erros.slice(0, 6)));
await b.close();

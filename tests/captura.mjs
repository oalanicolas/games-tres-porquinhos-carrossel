// Captura o livro no navegador real (GPU), sem roubar foco. Uso: node tests/captura.mjs <saida> <cena|capa> [t]
// Numa cena com voz, t é o segundo da narração: a linha é ancorada na fala, como nas folhas de revisão.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
const { faixas } = JSON.parse(readFileSync(new URL('../src/narracao.json', import.meta.url)));
const [saida, alvo = '0', t] = process.argv.slice(2);
const base = process.env.LIVRO_URL || 'http://127.0.0.1:4291/';
const browser = await chromium.launch({ channel: 'chrome', headless: !process.env.QA_HEADED, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
const page = await browser.newPage({ viewport: { width: Number(process.env.W || 1600), height: Number(process.env.H || 968) }, deviceScaleFactor: Number(process.env.DPR || 1) });
const erros = [];
page.on('pageerror', (e) => erros.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
await page.goto(`${base}?qa=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__livro, null, { timeout: 90000 });
const r = await page.evaluate(async ({ alvo, t, faixa }) => {
  const L = window.__livro;
  if (alvo.startsWith('seq')) L.sequencia(Number(alvo.slice(3)));
  else if (alvo !== 'capa' && faixa && t !== undefined) {
    const i = Number(alvo); L.abrirNaHora(i); const l = L.cenas[i].linha; l.desancorar(); l.reset(); l.ancorar(faixa.marcos, faixa.acao_em); l.seek(Number(t));
    L.audio.tempoVoz = () => Number(t); L.audio.nivelVoz = () => 0.4;
  } else if (alvo !== 'capa') L.cenaEm(Number(alvo), t === undefined ? 0 : Number(t));
  await new Promise((f) => requestAnimationFrame(() => requestAnimationFrame(f)));
  return L.medidas();
}, { alvo, t, faixa: faixas[alvo] });
await page.waitForTimeout(alvo === 'capa' ? 500 : 900);
await page.screenshot({ path: saida });
console.log(JSON.stringify({ ...r, erros: erros.slice(0, 6) }));
await browser.close();

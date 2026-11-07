// Folha de contato das cenas em repouso e no fim da ação.
import { chromium } from 'playwright-core';
const [saida = 'output/qa/f', modo = 'inicio', lista = '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16'] = process.argv.slice(2);
const base = process.env.LIVRO_URL || 'http://127.0.0.1:4291/';
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const page = await b.newPage({ viewport: { width: 1200, height: 726 } });
const erros = []; page.on('pageerror', (e) => erros.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
await page.goto(`${base}?qa=1`); await page.waitForFunction(() => window.__livro, null, { timeout: 90000 });
await page.waitForTimeout(600);
for (const i of lista.split(',').map(Number)) {
  const d = await page.evaluate(([i, modo]) => { const L = window.__livro; const c = L.cenas[i]; const t = modo === 'inicio' ? 0 : modo === 'fim' ? c.linha.duration : c.linha.duration * Number(modo); L.cenaEm(i, t); return c.linha.duration; }, [i, modo]);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${saida}${i}-${modo}.png` });
  console.log(i, 'duração', d.toFixed(2));
}
console.log(JSON.stringify(erros.slice(0, 5)));
await b.close();

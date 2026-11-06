// Percurso real pela interface: abre pelo botão, percorre as oito cenas com a ação de cada uma, mede quadros, lupa e erros.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.env.LIVRO_URL || 'http://127.0.0.1:4291/';
const saida = process.env.SAIDA || 'output/qa/jornada'; mkdirSync(saida, { recursive: true });
const W = Number(process.env.W || 1440), H = Number(process.env.H || 870);
const b = await chromium.launch({ channel: 'chrome', headless: !process.env.QA_HEADED, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await b.newPage({ viewport: { width: W, height: H } });
const erros = []; page.on('pageerror', (e) => erros.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
page.on('requestfailed', (r) => erros.push('falhou ' + r.url()));
const t0 = Date.now(); await page.goto(base); await page.waitForFunction(() => window.__livro, null, { timeout: 90000 });
const carga = Date.now() - t0;
const renderer = await page.evaluate(() => { const g = window.__livro.renderer.getContext(); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'desconhecido'; });
const fps = (ms) => page.evaluate((ms) => new Promise((ok) => { const ts = []; const f = (t) => { ts.push(t); if (t - ts[0] < ms) requestAnimationFrame(f); else { const d = ts.slice(1).map((x, i) => x - ts[i]).sort((a, b) => a - b); ok({ fps: +((ts.length - 1) / ((t - ts[0]) / 1000)).toFixed(1), p95: +d[Math.floor(d.length * 0.95)].toFixed(1) }); } }; requestAnimationFrame(f); }), ms);
const rel = { carga, renderer, cenas: [] };
await page.waitForTimeout(800);
await page.screenshot({ path: `${saida}/capa.png` });
await page.click('#acao');
const abertura = await fps(2600); rel.abertura = abertura;
await page.waitForFunction(() => window.__livro.estado.modo === 'aberto', null, { timeout: 8000 });
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(700);
  const antes = await page.evaluate(() => ({ i: window.__livro.estado.indice, acao: document.querySelector('#acao').textContent, titulo: document.querySelector('#cena-titulo').textContent }));
  await page.screenshot({ path: `${saida}/c${i}-a.png` });
  await page.click('#acao');
  const dur = await page.evaluate((i) => window.__livro.cenas[i].linha.duration, i);
  const f = await fps(Math.min(dur * 1000 * 0.6, 3000));
  await page.screenshot({ path: `${saida}/c${i}-b.png` });
  await page.waitForTimeout(Math.max(0, dur * 1000 * 0.4 + 200));
  const depois = await page.evaluate((i) => ({ fim: window.__livro.cenas[i].linha.t >= window.__livro.cenas[i].linha.duration - 0.01, acao: document.querySelector('#acao').textContent }), i);
  await page.screenshot({ path: `${saida}/c${i}-c.png` });
  rel.cenas.push({ ...antes, duracao: +dur.toFixed(2), ...f, terminou: depois.fim, acaoDepois: depois.acao });
  if (i === 2) { // lupa sobre o texto
    const box = await page.evaluate(() => { const L = window.__livro; return { w: innerWidth, h: innerHeight }; });
    await page.mouse.move(box.w * 0.385, box.h * 0.4); await page.waitForTimeout(350);
    rel.lupa = await page.evaluate(() => ({ lupa: getComputedStyle(document.querySelector('#lupa')).display !== 'none' && document.querySelector('#lupa').classList.length, cartao: document.querySelector('#cartao').textContent.slice(0, 40) }));
    await page.screenshot({ path: `${saida}/lupa.png` }); await page.mouse.move(5, 5);
  }
  if (i < 7) { await page.click('#proxima'); await page.waitForTimeout(800); }
}
rel.erros = erros;
writeFileSync(`${saida}/relatorio.json`, JSON.stringify(rel, null, 1));
console.log(JSON.stringify(rel, null, 0));
await b.close();

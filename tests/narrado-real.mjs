// Percurso do modo narrado com as faixas reais: `LIVRO_URL=<url> node tests/narrado-real.mjs`. Leva cerca de 4 min e grava output/narrado-real.json.
import { writeFileSync, mkdirSync } from 'node:fs';
import { abrir } from './_apoio.mjs';

const { page, fechar, erros } = await abrir({ narrado: true, url: process.env.LIVRO_URL });
try {
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const L = window.__livro; const a = L.audio; window.__marcas = [];
    const marca = (tipo, i, extra) => window.__marcas.push({ tipo, i, t: performance.now() / 1000, voz: a.estado().voz?.tempo ?? null, musica: a.estado().trilha, ...extra });
    let ultimo = L.estado.indice; const vistos = new Set();
    setInterval(() => {
      if (L.estado.indice !== ultimo) { ultimo = L.estado.indice; marca('virou', ultimo); }
      for (const i of L.estado.tocouAcao) if (!vistos.has(i)) { vistos.add(i); marca('acao', i); }
      const v = a.estado().voz; if (v && !vistos.has(`v${v.cena}`)) { vistos.add(`v${v.cena}`); marca('voz', v.cena); }
    }, 50);
  });
  await page.click('#acao');
  await page.waitForFunction(() => { const L = window.__livro; return L.estado.indice === 7 && !L.audio.estado().voz && L.estado.tocouAcao.has(7); }, null, { timeout: 420000, polling: 500 });
  await page.waitForTimeout(4000);
  const r = await page.evaluate(() => ({ marcas: window.__marcas, indice: window.__livro.estado.indice, faixas: window.__livro.audio.faixasVoz }));
  const linhas = [];
  for (let i = 0; i < 8; i++) {
    const acao = r.marcas.find((m) => m.tipo === 'acao' && m.i === i); const voz = r.marcas.find((m) => m.tipo === 'voz' && m.i === i); const virou = r.marcas.find((m) => m.tipo === 'virou' && m.i === i + 1);
    linhas.push({ cena: i + 1, previsto: r.faixas[i].acao_em, acao_na_fala: acao?.voz ?? null, musica: acao?.musica, s_ate_virar: virou && voz ? +(virou.t - voz.t).toFixed(1) : null, fala_s: r.faixas[i].duracao });
  }
  const rel = { linhas, indice_final: r.indice, erros };
  mkdirSync('output', { recursive: true }); writeFileSync('output/narrado-real.json', JSON.stringify(rel, null, 1));
  console.table(linhas); console.log('índice final', r.indice, 'erros', erros.length);
  const ruins = linhas.filter((l) => l.acao_na_fala == null || Math.abs(l.acao_na_fala - l.previsto) > 0.6);
  if (r.indice !== 7 || erros.length || ruins.length) { console.error('falhou', ruins); process.exitCode = 1; }
} finally { await fechar(); }

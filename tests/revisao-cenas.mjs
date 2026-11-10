// Folha de revisão: cada cena em 8 momentos, para ler uma a uma. Grava em output/revisao/ e imprime N/M.
// `--conferir` conta as cenas lidas em output/revisao/lidas.json, sem abrir navegador. As folhas .jpg são capturas de QA,
// apagadas depois de lidas (regra do estúdio): o recibo que fica é o JSON.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { CENAS } from '../src/story.js';

const PASTA = 'output/revisao'; mkdirSync(PASTA, { recursive: true });
const N = CENAS.length;
if (process.argv.includes('--conferir')) {
  const lidas = existsSync(`${PASTA}/lidas.json`) ? JSON.parse(readFileSync(`${PASTA}/lidas.json`, 'utf8')) : {};
  const ok = CENAS.filter((c) => lidas[c.id] === true);
  console.log(`${ok.length}/${N} cenas lidas`);
  for (const c of CENAS) if (!ok.includes(c)) console.log('falta:', c.id);
  process.exit(ok.length === N ? 0 : 1);
}
const { abrir } = await import('./_apoio.mjs');
const { faixas } = JSON.parse(readFileSync(new URL('../src/narracao.json', import.meta.url)));
const pedidas = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const { page, fechar } = await abrir({ largura: 1280, altura: 800 });
try {
  await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 60000 });
  for (const [i, c] of CENAS.entries()) {
    if (pedidas.length && !pedidas.includes(c.id)) continue;
    const f = faixas[i]; const dur = await page.evaluate(([i, f]) => { const L = window.__livro; L.abrirNaHora(i); const l = L.cenas[i].linha; l.desancorar(); l.reset(); if (f) l.ancorar(f.marcos, f.acao_em); return f ? f.duracao : l.duration; }, [i, f]);
    const quadros = [];
    for (let k = 0; k < 8; k++) {
      const t = dur * (k + (k === 7 ? 0.95 : 0.2)) / 8;
      await page.evaluate(([i, t, voz]) => { const L = window.__livro; L.cenas[i].linha.seek(t); if (voz) { L.audio.tempoVoz = () => t; L.audio.nivelVoz = () => 0.4; } }, [i, t, !!f]);
      await page.waitForTimeout(280);
      const q = `${PASTA}/_q${k}.jpg`; await page.screenshot({ path: q, type: 'jpeg', quality: 70 }); quadros.push(q);
    }
    const r = spawnSync('magick', ['montage', ...quadros, '-tile', '4x2', '-geometry', '780x+4+4', '-depth', '8', '-quality', '78', `${PASTA}/${c.id}.jpg`]);
    if (r.status) throw new Error(String(r.stderr));
    await page.evaluate((i) => { const L = window.__livro; L.cenas[i].linha.desancorar(); L.cenas[i].linha.reset(); delete L.audio.tempoVoz; delete L.audio.nivelVoz; }, i);
    console.log(`${i + 1}/${N} ${c.id}`);
  }
  spawnSync('sh', ['-c', `rm -f ${PASTA}/_q*.jpg`]);
} finally { await fechar(); }

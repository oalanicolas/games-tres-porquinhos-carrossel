// Auditoria de sonoplastia (Alan, 06/17/2026: "se tem algo que nao estamos descuidando"). Cada item é um defeito achado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { abrir } from './_apoio.mjs';

const sons = JSON.parse(readFileSync(new URL('../src/sons.json', import.meta.url)));
const cenas = readFileSync(new URL('../src/cenas.js', import.meta.url), 'utf8');
const script = readFileSync(new URL('../tools/sons.py', import.meta.url), 'utf8');
const duracao = (n) => Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `public/sfx/${n}.mp3`], { encoding: 'utf8' }).stdout);

test('o uivo do Lobo é a gravação longa, não o corte de 1,6 s', () => {
  assert.ok(!script.includes("'foley-howl-"), 'voltou o corte de 96 kbps');
  for (const n of ['uivo1', 'uivo2', 'uivo3', 'uivo4']) assert.ok(duracao(n) > 3.5, `${n}: ${duracao(n)} s`);
});

test('batida na porta é madeira, e porta fechando não é martelo', () => {
  const bate = cenas.slice(cenas.indexOf('function loboBate'), cenas.indexOf('function loboVaiAtras'));
  assert.ok(!bate.includes('martelo') && bate.includes('bate1'));
  for (const n of ['porta', 'tranca']) assert.ok(sons.efeitos.includes(n));
  assert.ok(!/fechaPorta\(tl, casa\.porta, [^;]*; tl\.call\(\(\) => audio\.tocar\('martelo/.test(cenas));
});

test('todo efeito baixado é usado, e nada é chamado sem existir', () => {
  const codigo = cenas + readFileSync(new URL('../src/main.js', import.meta.url), 'utf8') + readFileSync(new URL('../src/audio.js', import.meta.url), 'utf8');
  const sobra = sons.efeitos.filter((n) => !(codigo.includes(`'${n}'`) || (/^passo\d$/.test(n) && codigo.includes('`passo$'))));
  assert.deepEqual(sobra, []);
  const chamados = [...codigo.matchAll(/tocar\('([a-z0-9]+)'/g)].map((m) => m[1]);
  assert.deepEqual(chamados.filter((n) => !sons.efeitos.includes(n)), []);
});

test('nas dezessete cenas: passos soam, com variação e posição; o primeiro clique abre com som; mix não estoura', async () => {
  // rede lenta de propósito: o som de abrir o livro precisa tocar mesmo chegando depois do clique
  const { page, erros, fechar } = await abrir({ antes: (p) => p.route('**/sfx/*.mp3', async (r) => { await new Promise((ok) => setTimeout(ok, 300)); await r.continue(); }) });
  try {
    await page.evaluate(() => new Promise((ok) => setTimeout(ok, 800)));
    await page.mouse.click(640, 400);
    await page.waitForFunction(() => window.__livro.audio.registro.some((r) => r.nome === 'abrir'), null, { timeout: 8000 });
    await page.waitForFunction(() => { const a = window.__livro.audio; return a.buffers.size === 58 && a.camas.size === 5; }, null, { timeout: 60000 });
    await page.evaluate(() => window.__livro.abrirNaHora(0));
    const por = {};
    let pico = -Infinity;
    for (let i = 0; i < 17; i++) {
      await page.evaluate((i) => { window.__livro.audio.registro.length = 0; window.__livro.irPara(i); }, i);
      const dur = await page.evaluate((i) => { const c = window.__livro.cenas[i]; c.linha.play(); return c.linha.duration; }, i);
      const fim = Date.now() + Math.min(dur * 1000 + 400, 14000);
      while (Date.now() < fim) {
        const d = await page.evaluate(() => window.__livro.audio.estado().dbfs);
        if (d > pico) pico = d;
        await page.evaluate(() => new Promise((ok) => setTimeout(ok, 180)));
      }
      por[i] = await page.evaluate(() => window.__livro.audio.registro.map((r) => ({ nome: r.nome, taxa: r.taxa, pan: r.pan })));
    }
    const nomes = (i) => por[i].map((r) => r.nome);
    const comPassos = Object.keys(por).filter((i) => nomes(i).some((n) => n.startsWith('passo')));
    assert.ok(comPassos.length >= 8, `passos em ${comPassos.length} de 17 cenas`);
    const todos = Object.values(por).flat().filter((r) => r.nome.startsWith('passo'));
    assert.ok(new Set(todos.map((r) => r.taxa)).size > 5, 'passos sem variação de altura');
    assert.ok(new Set(todos.map((r) => r.pan)).size > 3, 'passos sem posição no estéreo');
    assert.ok(nomes(2).some((n) => n.startsWith('bate')), 'cena 2 sem batida');
    assert.ok(nomes(2).includes('sopro') && nomes(2).includes('puxa'), 'cena 2 sem sopro de verdade');
    assert.ok(nomes(7).includes('uivo1') || nomes(8).includes('uivo1'), 'o uivo do rabo em brasa não tocou');
    assert.ok(Object.values(por).flat().some((r) => r.nome === 'foguete'), 'sem o foguete');
    assert.ok(Object.values(por).flat().some((r) => r.nome.startsWith('choro')), 'o Lobo foge sem choramingar');
    assert.ok(pico < -1, `saída chegou a ${pico} dBFS de RMS`);
    console.log(JSON.stringify({ passos_por_cena: Object.fromEntries(Object.entries(por).map(([i, l]) => [i, l.filter((r) => r.nome.startsWith('passo')).length])), efeitos_por_cena: Object.fromEntries(Object.entries(por).map(([i, l]) => [i, l.length])), pico_rms_dbfs: pico }));
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

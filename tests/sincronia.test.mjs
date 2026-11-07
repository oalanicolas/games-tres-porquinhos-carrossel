// Pedido de Alan: "As animacoes precisam estar sincronizadas com a fala, e na fala deles ia ser bom ter um balao em cada um
// aparecendo que estao falando". Cada defeito vira um teste com nome; o percurso com a voz real está em narrado-real.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { abrir } from './_apoio.mjs';

const { faixas } = JSON.parse(readFileSync(new URL('../src/narracao.json', import.meta.url)));
const TELAS = [[1440, 870], [390, 844], [360, 640], [844, 390]];
// Recontado ao ganhar páginas e entradas de personagens, a pedido de Alan (06/11/2026): a chegada do Lobo e as entradas passaram a valer sem voz.
// Recontado de novo com as 17 cenas (R6 do gauntlet): as 6 novas e o voo e a fuga refeitos mudaram as durações.
const DURACOES_MANUAIS = [4.2944, 4.2, 5.9, 7.22, 6.5, 6.7, 4.8, 10.34, 6.86, 11.97, 4.5, 5.39, 6.0319, 7.37, 5.51, 7.4, 6.52];

/** A cena `i` num segundo da fala, sem depender do áudio tocar. */
const naFala = (page, i, t, nivel = 0.8) => page.evaluate(([i, t, nivel]) => {
  const L = window.__livro; const a = L.audio;
  a.tempoVoz = () => t; a.nivelVoz = () => nivel;
  L.atuacao.desfazer(); L.atuacao.quadro(i, 1);
  return L.atuacao.medir();
}, [i, t, nivel]);

test('sem voz, cada cena dura o combinado', async () => {
  const { page, fechar, erros } = await abrir();
  try {
    const d = await page.evaluate(() => window.__livro.cenas.map((c) => +c.linha.duration.toFixed(4)));
    assert.deepEqual(d, DURACOES_MANUAIS); assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('todo grupo de gestos tem a sua palavra na fala, e todo marco tem gestos', async () => {
  const { page, fechar } = await abrir();
  try {
    const grupos = await page.evaluate(() => window.__livro.cenas.map((c) => [...new Set([...c.linha.tracks, ...c.linha.calls].map((x) => x.g))]));
    grupos.forEach((g, i) => {
      const marcos = Object.keys(faixas[i].marcos);
      assert.deepEqual(g.filter((x) => x !== 'base' && !marcos.includes(x)), [], `cena ${i + 1}: grupo sem palavra`);
      assert.deepEqual(marcos.filter((x) => !g.includes(x)), [], `cena ${i + 1}: palavra sem gestos`);
    });
  } finally { await fechar(); }
});

test('nenhum gesto ficou fora de um grupo com palavra', async () => {
  const { page, fechar } = await abrir();
  try {
    const soltos = await page.evaluate(() => window.__livro.cenas.map((c) => [...c.linha.tracks, ...c.linha.calls].filter((x) => !x.g || x.g === 'base').length));
    assert.deepEqual(soltos, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  } finally { await fechar(); }
});

test('cada grupo começa no segundo exato da sua palavra, e nada acontece antes', async () => {
  const { page, fechar } = await abrir();
  try {
    const r = await page.evaluate((faixas) => window.__livro.cenas.map((c, i) => {
      const l = c.linha; const f = faixas[i]; l.ancorar(f.marcos, f.acao_em);
      const inicio = {};
      for (const tr of l.ativas) if (!tr.fixo) inicio[tr.g] = Math.min(inicio[tr.g] ?? 1e9, tr.start);
      for (const k of l.chamadas) inicio[k.g] = Math.min(inicio[k.g] ?? 1e9, k.at);
      l.desancorar();
      return inicio;
    }), faixas);
    r.forEach((inicio, i) => { for (const [g, m] of Object.entries(faixas[i].marcos)) assert.ok(Math.abs(inicio[g] - m.em) < 0.001, `cena ${i + 1}, ${g}: ${inicio[g]} em vez de ${m.em}`); });
  } finally { await fechar(); }
});

test('sem voz, os gestos só de narração não existem', async () => {
  const { page, fechar } = await abrir();
  try {
    const r = await page.evaluate(() => window.__livro.cenas.map((c) => { const l = c.linha; return [...l._trilhas(), ...l._chamadas()].filter((x) => x.soVoz).length; }));
    assert.deepEqual(r, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  } finally { await fechar(); }
});

test('toda fala tem personagem na cena', async () => {
  const { page, fechar } = await abrir();
  try {
    const atores = await page.evaluate(() => window.__livro.cenas.map((c) => Object.keys(c.atores ?? {})));
    for (const [i, f] of Object.entries(faixas)) for (const fala of f.falas) for (const q of fala.quem) assert.ok(atores[i].includes(q), `cena ${+i + 1}: ${q} não existe`);
  } finally { await fechar(); }
});

test('o começo de cada fala cai numa pausa real da gravação', () => {
  for (const [i, f] of Object.entries(faixas)) {
    const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', new URL(`../public/narracao/cena-${i}.mp3`, import.meta.url).pathname, '-af', 'silencedetect=noise=-38dB:d=0.16', '-f', 'null', '-'], { encoding: 'utf8' });
    const fins = [0, ...[...r.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1])];
    for (const fala of f.falas) assert.ok(fins.some((x) => Math.abs(x - fala.de) < 0.1), `cena ${+i + 1}, "${fala.texto}" começa em ${fala.de}, longe de qualquer pausa`);
  }
});

for (const [largura, altura] of TELAS) {
  test(`em ${largura}x${altura}, cada fala mostra um balão por personagem, certo e dentro da tela`, async () => {
    const { page, fechar, erros } = await abrir({ largura, altura });
    try {
      for (const [i, f] of Object.entries(faixas)) {
        if (!f.falas.length) continue;
        await page.evaluate((i) => window.__livro.abrirNaHora(i), +i);
        await page.waitForTimeout(60);
        for (const fala of f.falas) {
          const b = await naFala(page, +i, (fala.de + fala.ate) / 2);
          assert.equal(b.length, fala.quem.length, `cena ${+i + 1}, "${fala.texto}"`);
          for (const x of b) {
            assert.equal(x.texto, fala.texto); assert.ok(fala.quem.includes(x.quem));
            assert.ok(x.x >= 0 && x.y >= 0 && x.x + x.w <= largura && x.y + x.h <= altura, `cena ${+i + 1}, ${x.quem} fora da tela: ${JSON.stringify(x)}`);
          }
          for (let a = 0; a < b.length; a++) for (let c = a + 1; c < b.length; c++) {
            const [p, q] = [b[a], b[c]];
            assert.ok(p.x + p.w <= q.x || q.x + q.w <= p.x || p.y + p.h <= q.y || q.y + q.h <= p.y, `cena ${+i + 1}: balões sobrepostos em "${fala.texto}"`);
          }
        }
      }
      assert.deepEqual(erros, []);
    } finally { await fechar(); }
  });
}

test('o balão só existe durante a fala, e a boca só abre com ela', async () => {
  const { page, fechar, erros } = await abrir();
  try {
    await page.evaluate(() => window.__livro.abrirNaHora(5));
    await page.waitForTimeout(60);
    const fala = faixas[5].falas[1]; // "Não, não e não!", de João
    const antes = faixas[5].falas[0].de - 0.11;
    assert.ok(antes < fala.de - 0.1);
    assert.equal((await naFala(page, 5, antes)).length, 0, 'antes da fala');
    const boca = () => page.evaluate(() => window.__livro.cenas[5].atores.pipo.boca.scale.y);
    assert.ok(await boca() < 0.01, 'boca fechada antes');
    const preparando = await naFala(page, 5, fala.de - 0.11);
    assert.equal(preparando.filter((b) => b.quem === 'pipo').length, 0, 'João ainda não fala durante a saída do balão do Lobo');
    assert.ok(await boca() < 0.01, 'boca fechada imediatamente antes da própria fala');
    for (let k = 0; k < 8; k++) await naFala(page, 5, fala.de + 0.2);
    assert.equal((await naFala(page, 5, fala.de + 0.2)).length, 1, 'durante a fala');
    assert.ok(await boca() > 0.4, 'boca aberta na fala');
    await naFala(page, 5, fala.ate + 0.5);
    assert.equal((await naFala(page, 5, fala.ate + 0.5)).length, 0, 'depois da fala');
    assert.ok(await boca() < 0.01, 'boca fechada depois');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('sem narração, nenhum balão aparece', async () => {
  const { page, fechar } = await abrir();
  try {
    await page.evaluate(() => window.__livro.abrirNaHora(5));
    await page.click('#acao');
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => document.querySelectorAll('.balao').length), 0);
  } finally { await fechar(); }
});

test('durante a fala, o relógio da cena é o relógio da voz', async () => {
  const { page, fechar, erros } = await abrir({ narrado: true });
  try {
    await page.waitForTimeout(400);
    const r = await page.evaluate(async () => {
      const L = window.__livro; const a = L.audio; const faixa = a.faixasVoz[1]; const atos = [];
      const orig = a.tempoVoz.bind(a); let t = 3; a.tempoVoz = (i) => (i === 1 ? t : orig(i));
      L.abrirNaHora(1); await new Promise((f) => setTimeout(f, 250));
      for (const seg of [3, 5, 9]) { t = seg; await new Promise((f) => setTimeout(f, 120)); atos.push({ seg, cena: L.cenas[1].linha.t, seguindo: L.leitura.i }); }
      a.tempoVoz = orig;
      return { atos, dur: faixa.duracao };
    });
    for (const x of r.atos) { assert.equal(x.seguindo, 1); assert.ok(Math.abs(x.cena - x.seg) < 0.01, JSON.stringify(x)); }
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

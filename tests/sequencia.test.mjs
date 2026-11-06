// Defeito devolvido por Alan: "pq aparece a capa final no começo?". A história é uma sequência: o fim nunca encosta no começo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';

const visiveis = (page) => page.evaluate(() => {
  const { livro } = window.__livro;
  return { cenas: livro.cunhas.filter((c) => c.g.visible).map((c) => c.j), paredes: livro.paredes.filter((p) => p.pivo.visible && p.m.visible).map((p) => p.k) };
});

test('nada antes da primeira cena nem depois da última, em 11 de 11 cenas', async () => {
  const { page, erros, fechar } = await abrir();
  try {
    let conferidas = 0;
    for (let i = 0; i < 11; i++) {
      await page.evaluate((i) => window.__livro.cenaEm(i, 0), i);
      const v = await visiveis(page);
      assert.ok(v.cenas.includes(i), `cena ${i} não está visível`);
      for (const j of v.cenas) assert.ok(Math.abs(j - i) <= 2, `na cena ${i} aparece a cena ${j}`);
      for (const k of v.paredes) assert.ok(k >= i - 2 && k <= i + 3, `na cena ${i} aparece a parede ${k}`);
      conferidas++;
    }
    assert.equal(conferidas, 11);
    await page.evaluate(() => window.__livro.cenaEm(0, 0));
    const inicio = await visiveis(page);
    assert.ok(!inicio.cenas.includes(10) && !inicio.paredes.includes(10) && !inicio.paredes.includes(11), 'a última cena aparece ao lado da primeira cena');
    await page.evaluate(() => window.__livro.cenaEm(10, 0));
    const fim = await visiveis(page);
    assert.ok(!fim.cenas.includes(0) && !fim.paredes.includes(0) && !fim.paredes.includes(1), 'a primeira cena aparece ao lado da última');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('a abertura não revela o fim do livro', async () => {
  const { page, erros, fechar } = await abrir();
  try {
    for (let t = 0; t <= 0.97; t += 0.03) {
      await page.evaluate((t) => window.__livro.sequencia(t), t);
      const v = await visiveis(page);
      for (const j of v.cenas) assert.ok(j <= 2, `abertura ${t.toFixed(2)} mostra a cena ${j}`);
      const pra_tras = await page.evaluate(() => window.__livro.livro.paredes.filter((p) => p.k > 3 && p.pivo.visible && p.angulo <= -1.75).map((p) => p.k));
      assert.deepEqual(pra_tras, [], `abertura ${t.toFixed(2)}`);
    }
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

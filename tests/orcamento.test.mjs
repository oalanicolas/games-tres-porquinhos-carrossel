// Orçamento do piloto de qualidade (pedido de Alan, 09/11/2026: mais animação e detalhe "sem muito mais peso ou perda de performance").
// As três cenas do piloto podem desenhar no máximo 10% a mais do que antes dele, e a câmera guiada sempre volta ao zero.
import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';

// Chamadas de desenho antes do piloto (commit 331d0b6, 1280×800, meio da ação): partida, palha, tombo.
const BASE = { 0: 1257, 5: 2784, 13: 2861 };
const TETO = 1.1;

test('as cenas do piloto ficam dentro do orçamento de desenho', async () => {
  const { page, fechar, erros } = await abrir({ largura: 1280, altura: 800 });
  try {
    for (const [i, base] of Object.entries(BASE)) {
      const m = await page.evaluate((i) => { const L = window.__livro; L.abrirNaHora(i); L.cenaEm(i, L.cenas[i].linha.duration / 2); return L.medidas(); }, +i);
      assert.ok(m.chamadas <= Math.round(base * TETO), `cena ${i}: ${m.chamadas} chamadas, teto ${Math.round(base * TETO)}`);
    }
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('a câmera guiada parte do zero e volta ao zero', async () => {
  const { page, fechar } = await abrir();
  try {
    const fora = await page.evaluate(() => {
      const L = window.__livro; const ruim = [];
      L.cenas.forEach((c, i) => {
        if (!c.camera) return;
        for (const t of [0, c.linha.duration]) {
          c.linha.seek(t); const { position: p, scale: s } = c.camera;
          if (Math.abs(p.x) > 1e-6 || Math.abs(p.y) > 1e-6 || Math.abs(s.x - 1) > 1e-6) ruim.push([i, t, p.x, p.y, s.x]);
        }
        c.linha.seek(0);
      });
      return { ruim, guiadas: L.cenas.filter((c) => c.camera).length };
    });
    assert.deepEqual(fora.ruim, []); assert.ok(fora.guiadas >= 3, 'as três cenas do piloto guiam a câmera');
  } finally { await fechar(); }
});

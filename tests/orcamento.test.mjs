// Orçamento do piloto de qualidade (pedido de Alan, 09/11/2026: mais animação e detalhe "sem muito mais peso ou perda de performance").
// Cada cena pode desenhar no máximo 10% a mais do que antes das melhorias, e a câmera guiada sempre volta ao zero.
// O piloto (cenas 1, 6 e 14) foi aprovado por Alan em 10/11/2026 e replicado nas outras 14.
import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';

// Chamadas de desenho antes das melhorias, a 1280×800 e no meio da ação: as do piloto no commit 331d0b6, as outras no d24aad7.
const BASE = [1257, 1770, 2495, 2449, 2533, 2784, 2939, 3049, 2969, 3130, 3006, 3015, 2723, 2861, 2861, 2295, 1725];
const TETO = 1.1;

test('as 17 cenas ficam dentro do orçamento de desenho', async () => {
  const { page, fechar, erros } = await abrir({ largura: 1280, altura: 800 });
  try {
    const medidas = [];
    for (const [i, base] of BASE.entries()) {
      const m = await page.evaluate((i) => { const L = window.__livro; L.abrirNaHora(i); L.cenaEm(i, L.cenas[i].linha.duration / 2); return L.medidas(); }, i);
      medidas.push(`${m.chamadas}/${Math.round(base * TETO)}`);
      assert.ok(m.chamadas <= Math.round(base * TETO), `cena ${i}: ${m.chamadas} chamadas, teto ${Math.round(base * TETO)}`);
    }
    console.log(JSON.stringify({ chamadas_por_teto: medidas }));
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
    assert.deepEqual(fora.ruim, []); assert.ok(fora.guiadas >= 4, 'as cenas com ação-chave guiam a câmera');
  } finally { await fechar(); }
});

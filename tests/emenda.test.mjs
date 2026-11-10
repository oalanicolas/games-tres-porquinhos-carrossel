// Devolvido por Alan em 10/11/2026: "páginas se desencontrando". As duas folhas de cada cena têm o mesmo tamanho e a mesma
// altura, capa inclusive, para o céu pintado casar na dobra; e o título nunca passa do papel para o céu.
import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';

test('as duas folhas de cada cena casam na dobra e o título cabe no papel, 17 de 17', async () => {
  const { page, erros, fechar } = await abrir();
  try {
    await page.waitForFunction(() => document.fonts.status === 'loaded');
    const r = await page.evaluate(() => {
      const L = window.__livro; L.abrirNaHora(0);
      L.livro.raiz.updateMatrixWorld(true);
      const inv = L.livro.raiz.matrixWorld.clone().invert();
      const folha = (k, indice) => {
        const m = L.livro.paredes[k].m; const geo = m.geometry; const pos = geo.attributes.position; const idx = geo.index;
        const mat = inv.clone().multiply(m.matrixWorld); const e = mat.elements;
        let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
        for (const g of geo.groups) {
          if (g.materialIndex !== indice) continue;
          for (let i = g.start; i < g.start + g.count; i++) {
            const v = idx.getX(i); const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
            const wx = e[0] * x + e[4] * y + e[8] * z + e[12]; const wy = e[1] * x + e[5] * y + e[9] * z + e[13]; const wz = e[2] * x + e[6] * y + e[10] * z + e[14];
            y0 = Math.min(y0, wy); y1 = Math.max(y1, wy); x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); z0 = Math.min(z0, wz); z1 = Math.max(z1, wz);
          }
        }
        return [y0, y1, Math.hypot(x1 - x0, z1 - z0)].map((n) => Math.round(n * 1000) / 1000);
      };
      const cenas = [];
      for (let j = 0; j < L.N; j++) cenas.push({ j, esquerda: folha(j, 5), direita: folha(j + 1, 4) });
      return { cenas, sobra: L.livro.sobraTitulo.map((n) => Math.round(n)) };
    });
    const desencontradas = r.cenas.filter((c) => c.esquerda.some((v, i) => Math.abs(v - c.direita[i]) > 0.002));
    console.log(`dobra: ${r.cenas.length - desencontradas.length} de ${r.cenas.length} cenas com as duas folhas iguais; sobra do título (px): ${r.sobra.join(' ')}`);
    assert.equal(r.cenas.length, 17);
    assert.deepEqual(desencontradas, []);
    // e todas as cenas usam a mesma folha, para a dobra não pular de uma página para a outra
    assert.equal(new Set(r.cenas.map((c) => c.esquerda.join())).size, 1, JSON.stringify(r.cenas.map((c) => c.esquerda)));
    assert.deepEqual(r.sobra.map((s, k) => (s >= 0 ? null : k)).filter((k) => k !== null), [], 'título passando do papel');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

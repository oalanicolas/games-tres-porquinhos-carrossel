// Defeito achado na revisão de 06/17/2026: com as histórias mais longas, poste e flor passavam na frente do fim do texto.
// Para cada cena, no início e no fim da ação, um raio por ponto do bloco de texto: nada da cena pode tapar a parede ali.
import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';

test('nada da cena fica na frente do texto da página, em 17 de 17 cenas', async () => {
  const { page, fechar, erros } = await abrir({ largura: 1440, altura: 870 });
  try {
    const r = await page.evaluate(async () => {
      const THREE = await import('/node_modules/three/build/three.module.js');
      const L = window.__livro; const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2(); const tapados = [];
      const visivel = (o) => { for (let a = o; a; a = a.parent) if (!a.visible) return false; return true; };
      let pontos = 0;
      for (let i = 0; i < L.N; i++) {
        const c = L.cenas[i]; const parede = L.livro.paredes[i].m; const pecas = L.livro.cunhas[i].conteudo;
        for (const t of [0, c.linha.duration]) {
          L.cenaEm(i, t); L.scene.updateMatrixWorld(true);
          const limite = (L.livro.fimTexto[i] - 30) / 1276; const nomes = {};
          for (let px = 0; px < innerWidth; px += 7) for (let py = 0; py < innerHeight; py += 7) {
            ptr.set((px / innerWidth) * 2 - 1, -(py / innerHeight) * 2 + 1); ray.setFromCamera(ptr, L.camera);
            const h = ray.intersectObject(parede, false)[0];
            if (!h?.uv || h.uv.x < 74 / 1400 || h.uv.x > 0.57 || 1 - h.uv.y < 240 / 1276 || 1 - h.uv.y > limite) continue;
            pontos++;
            const f = ray.intersectObject(pecas, true).find((x) => visivel(x.object) && x.distance < h.distance - 1e-3 && (x.object.material?.opacity ?? 1) > 0.05);
            if (f) { let d = f.object; while (d.parent && d.parent !== pecas && !d.name) d = d.parent; const n = d.name || d.parent?.name || 'peça'; nomes[n] = (nomes[n] ?? 0) + 1; }
          }
          if (Object.keys(nomes).length) tapados.push({ cena: i + 1, t: +t.toFixed(2), nomes });
        }
      }
      return { pontos, tapados, fim: L.livro.fimTexto };
    });
    console.log(JSON.stringify(r));
    assert.ok(r.pontos > 2000, `poucos pontos medidos: ${r.pontos}`);
    assert.deepEqual(r.tapados, []);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

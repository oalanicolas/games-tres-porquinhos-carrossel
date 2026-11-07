// Checagem nomeada da devolução de Alan (06/11/2026): "bem longe de ficar parecido com a referencia".
// O Lobo em cena sai da imagem de referência: atlas, peças e rigs que as cenas animam, sem textura faltando.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { abrir } from './_apoio.mjs';

const dados = JSON.parse(readFileSync(new URL('../src/lobo-pecas.json', import.meta.url)));
const PECAS = ['rabo', 'pernaT', 'pernaF', 'pescoco', 'tronco', 'bracoT', 'bracoF', 'lenco', 'orelhaT', 'orelhaF', 'queixo', 'cabeca', 'olho', 'olhoLonge', 'conta', 'contaLonge', 'sobr', 'sobrLonge', 'bochecha', 'roxo'];

test('a referência e todas as peças recortadas existem', () => {
  assert.ok(existsSync(new URL('../arte/lobo-referencia.png', import.meta.url)));
  for (const p of PECAS) assert.ok(dados.pecas[p]?.contorno.length >= 8, `peça ${p}`);
});

test('nas cenas, o Lobo usa o atlas carregado, nas cores da referência', async () => {
  const { page, erros, fechar } = await abrir({ largura: 1000, altura: 640 });
  try {
    const r = await page.evaluate(() => {
      const L = window.__livro; const saida = [];
      L.cenas.forEach((c, i) => {
        const w = c.atores?.lobo || c.provas?.lobo; if (!w?.root) return;
        let atlas = 0, img = null, velhos = 0;
        w.root.traverse((o) => {
          if (!o.isMesh) return;
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of ms) { if (m.name === 'lobo-atlas') { atlas++; img = m.map?.image; } else if (/chevron/.test(m.name)) velhos++; }
        });
        saida.push({ i, atlas, largura: img?.naturalWidth ?? 0, velhos });
      });
      return saida;
    });
    assert.ok(r.length >= 6, `cenas com Lobo: ${r.length}`);
    for (const c of r) {
      assert.ok(c.atlas >= 10, `cena ${c.i}: ${c.atlas} malhas com o atlas`);
      assert.equal(c.largura, dados.atlas, `cena ${c.i}: atlas decodificado`);
      assert.equal(c.velhos, 0, `cena ${c.i}: sobrou estampa do Lobo geométrico`);
    }
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('os gestos das cenas continuam ligados: boca abre, bochecha enche, roxo tinge e braços não somem atrás da cabeça', async () => {
  const { page, erros, fechar } = await abrir({ largura: 1000, altura: 640 });
  try {
    const r = await page.evaluate(() => {
      const L = window.__livro; const c = L.cenas.find((x) => x.atores?.lobo); const w = c.atores.lobo;
      w.queixo.rotation.z = -0.22; w.fundoBoca.scale.y = 1; w.bochecha.scale.setScalar(1); w.roxo.scale.setScalar(0.8); w.bracoF.rotation.z = 2.9; w.bracoT.rotation.z = -2.9;
      w.idle(0);
      let tinta = null; w.root.traverse((o) => { if (o.name === 'roxo' && o.isMesh) tinta = o; });
      return { queixo: w.queixo.rotation.z, f: w.bracoF.rotation.z, t: w.bracoT.rotation.z, opacidade: tinta?.material.opacity, visivel: tinta?.visible };
    });
    assert.equal(r.queixo, -0.22);
    assert.ok(r.f <= 1.35 && r.t >= -1.35, `braços ${r.f} ${r.t}`);
    assert.ok(r.visivel && r.opacidade > 0.7, `roxo ${r.opacidade}`);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

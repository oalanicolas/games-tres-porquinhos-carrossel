// Checagem nomeada "nenhuma peça fura a parede": caixa de cada peça, no início e no fim da ação, contra a largura da cunha.
import { chromium } from 'playwright-core';
const base = process.env.LIVRO_URL || 'http://127.0.0.1:4291/';
const b = await chromium.launch({ channel: 'chrome', headless: !process.env.QA_HEADED, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const page = await b.newPage({ viewport: { width: 800, height: 500 } });
await page.goto(`${base}?qa=1`); await page.waitForFunction(() => window.__livro, null, { timeout: 90000 });
const r = await page.evaluate(async () => {
  const L = window.__livro; const T = Math.tan(Math.PI / 8); const fora = []; let total = 0;
    for (let i = 0; i < L.N; i++) {
    const cun = L.livro.cunhas[i]; const c = L.cenas[i];
    for (const quando of ['inicio']) {
      c.linha.seek(0); L.cenaEm(i, 0);
      cun.conteudo.updateWorldMatrix(true, true);
      const inv = cun.conteudo.matrixWorld.clone().invert();
      cun.conteudo.traverse((o) => {
        if (!o.isMesh || !o.visible || o.name === 'disco') return;
        let dono = o; while (dono.parent && dono.parent !== cun.conteudo) dono = dono.parent; if (dono.userData.naParede) return;
        const pos = o.geometry.attributes.position; if (!pos) return; total++;
        let pior = 0, px = 0, pz = 0;
        const m = inv.clone().multiply(o.matrixWorld); const e = m.elements;
        for (let k = 0; k < pos.count; k += 3) {
          const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
          const X = e[0] * x + e[4] * y + e[8] * z + e[12]; const Z = e[2] * x + e[6] * y + e[10] * z + e[14];
          const lim = Math.max(Z, 0) * T; const d = Math.max(Math.abs(X) - lim, Math.hypot(X, Z) - 3.1);
          if (d > pior) { pior = d; px = X; pz = Z; }
        }
        if (pior > 0.012) fora.push({ cena: i, nome: dono.name || o.parent?.name || o.name, excesso: +pior.toFixed(3), x: +px.toFixed(2), z: +pz.toFixed(2) });
      });
    }
  }
  return { total, fora };
});
const porCena = {}; for (const f of r.fora) { (porCena[f.cena] ||= []).push(f); }
console.log(`pecas ${r.total} fora ${r.fora.length}`);
for (const k of Object.keys(porCena)) console.log('cena', k, JSON.stringify(porCena[k].sort((a, b) => b.excesso - a.excesso).slice(0, 7)));
await b.close();
process.exitCode = r.fora.length ? 1 : 0;

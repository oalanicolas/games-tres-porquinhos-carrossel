// Pedidos de Alan (06/11/2026): "ele voa para longe e no proximo aparece do lado da casa, ele precisa voar e cair do lado da casa"
// e "poderia ter uma cena para cada casa sendo construida". Cada um vira uma checagem sobre as posições reais da cena.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';
import { CENAS } from '../src/story.js';

const ORDEM = ['partida', 'obra-palha', 'obra-madeira', 'obra-tijolo', 'espia', 'palha', 'corrida-lulu', 'madeira', 'corrida-kael', 'tijolo', 'telhado', 'chamine', 'rabo', 'tombo', 'fuga', 'festa', 'juntos'];
const i = (id) => ORDEM.indexOf(id);
const VISIVEL = 0.02;
// Valem assim que o livro tem as 17 cenas. Enquanto a estrutura não existe, aparecem como puladas, nunca como aprovadas.
const pendente = CENAS.length === 17 ? false : 'o livro ainda não tem as 17 cenas';

/** Percorre a linha da cena do começo ao fim e devolve a trajetória de um ator: [{t, x, y, z, s}]. */
async function rota(page, cena, ator, passos = 80) {
  return page.evaluate(([cena, ator, passos]) => {
    const c = window.__livro.cenas[cena]; const q = c.atores?.[ator] ?? c.provas?.[ator]; const l = c.linha; l.desancorar(); l.reset(); const saida = [];
    for (let k = 0; k <= passos; k++) { const t = l.duration * k / passos; l.seek(t); const r = q.root; saida.push({ t, x: r.position.x, y: r.position.y, z: r.position.z, s: Math.abs(r.scale.y), rz: r.rotation.z }); }
    l.reset(); return saida;
  }, [cena, ator, passos]);
}
const vistos = (r) => r.filter((p) => p.s > VISIVEL);

test('estrutura: 17 cenas na ordem pedida, e as 17 montadas no livro', { skip: process.env.GAUNTLET_ESTRUTURA ? false : pendente }, async () => {
  assert.deepEqual(CENAS.map((c) => c.id), ORDEM);
  const { page, fechar } = await abrir();
  try { assert.equal(await page.evaluate(() => window.__livro.cenas.length), 17); } finally { await fechar(); }
});

test('construção: cada casa nasce no mesmo lugar em que depois será soprada', { skip: pendente }, async () => {
  const { page, fechar } = await abrir();
  try {
    for (const [obra, sopro] of [['obra-palha', 'palha'], ['obra-madeira', 'madeira'], ['obra-tijolo', 'tijolo']]) {
      const r = await page.evaluate(([a, b]) => {
        const L = window.__livro; const A = L.cenas[a]; const B = L.cenas[b]; const f = (c) => { const r = c.provas.casa.position; return [r.x, r.z, c.provas.casa.scale.x]; };
        A.linha.desancorar(); A.linha.reset(); const inicio = A.provas.casa.scale.y; A.linha.seek(A.linha.duration); const fim = A.provas.casa.scale.y; const lugar = f(A); A.linha.reset();
        B.linha.desancorar(); B.linha.reset(); return { inicio, fim, lugar, final: f(B), alturaFinal: B.provas.casa.scale.y };
      }, [i(obra), i(sopro)]);
      assert.ok(r.inicio < 0.02, `${obra}: a casa começa sem existir (${r.inicio})`);
      assert.ok(Math.abs(r.fim - r.alturaFinal) < 0.01, `${obra}: a casa termina inteira (${r.fim} e ${r.alturaFinal})`);
      assert.deepEqual(r.lugar.map((v) => v.toFixed(2)), r.final.map((v) => v.toFixed(2)), `${obra}: lugar diferente de ${sopro}`);
    }
  } finally { await fechar(); }
});

test('espia: o Lobo começa escondido atrás da moita e sai pela direita', { skip: pendente }, async () => {
  const { page, fechar } = await abrir();
  try {
    const r = await rota(page, i('espia'), 'lobo'); const v = vistos(r);
    assert.ok(r[0].y < 0, `escondido abaixo da moita (${r[0].y})`);
    assert.ok(v.at(-1).x > 0.55, `sai pela direita (${v.at(-1).x})`);
    const palha = await rota(page, i('palha'), 'lobo'); assert.ok(vistos(palha)[0].x < -0.5, 'na página seguinte ele chega pela esquerda');
  } finally { await fechar(); }
});

test('corridas: quem sai pela direita entra pela esquerda, porquinho na frente e Lobo atrás', { skip: pendente }, async () => {
  const { page, fechar } = await abrir();
  try {
    for (const [cena, porcos, antes, depois] of [['corrida-lulu', ['pipo'], 'palha', 'madeira'], ['corrida-kael', ['pipo', 'tico'], 'madeira', 'tijolo']]) {
      const lobo = vistos(await rota(page, i(cena), 'lobo'));
      assert.ok(lobo[0].x < -0.45, `${cena}: Lobo entra pela esquerda (${lobo[0].x})`);
      assert.ok(lobo.at(-1).x > 0.55, `${cena}: Lobo sai pela direita (${lobo.at(-1).x})`);
      for (const nome of porcos) {
        const q = vistos(await rota(page, i(cena), nome));
        assert.ok(q[0].x < -0.45, `${cena}: ${nome} entra pela esquerda (${q[0].x})`);
        assert.ok(q.at(-1).x > 0.55, `${cena}: ${nome} sai pela direita (${q.at(-1).x})`);
        assert.ok(q[0].t < lobo[0].t, `${cena}: ${nome} vem antes do Lobo`);
        // o Lobo nunca alcança: em cada instante com os dois em cena, o porquinho está à frente
        for (const p of lobo) { const o = q.find((u) => Math.abs(u.t - p.t) < 0.2); if (o) assert.ok(o.x > p.x, `${cena}: Lobo passou de ${nome} em ${p.t}`); }
      }
      assert.ok(vistos(await rota(page, i(antes), 'lobo')).at(-1).x > 0.4, `${antes}: o Lobo sai pela direita`);
    }
  } finally { await fechar(); }
});

test('voo: em Rabo em brasa ele sobe reto, sem encolher ao longe, e sai por cima', { skip: pendente }, async () => {
  const { page, fechar } = await abrir();
  try {
    const r = await rota(page, i('rabo'), 'lobo', 160); const voo = vistos(r).slice(-12);
    const altura = voo.at(-1).y; assert.ok(altura > 2.3, `sai por cima da página (${altura})`);
    assert.ok(Math.abs(voo[0].x - voo.at(-1).x) < 0.03, `sobe reto (${voo[0].x} e ${voo.at(-1).x})`);
    assert.ok(voo.at(-1).s > voo[0].s * 0.9, `não encolhe ao longe (${voo[0].s} e ${voo.at(-1).s})`);
  } finally { await fechar(); }
});

test('tombo: sai da chaminé, sobe, despenca e cai do lado da casa, no lugar em que a página seguinte o mostra', { skip: pendente }, async () => {
  const { page, fechar } = await abrir();
  try {
    const r = vistos(await rota(page, i('tombo'), 'lobo', 160));
    const topo = r.reduce((a, p) => (p.y > a.y ? p : a), r[0]); const fim = r.at(-1);
    const casa = await page.evaluate((c) => { const k = window.__livro.cenas[c].provas.casa; return { x: k.position.x, z: k.position.z, s: k.scale.x }; }, i('tombo'));
    const chamine = await page.evaluate((c) => window.__livro.cenas[c].provas.chamine, i('tombo'));
    assert.ok(Math.abs(r[0].x - chamine.x) < 0.06 && Math.abs(r[0].y - chamine.y) < 0.15, `nasce na boca da chaminé (${r[0].x}, ${r[0].y})`);
    assert.ok(topo.y > 2.1, `sobe ao céu (${topo.y})`);
    const metade = r.filter((p) => p.t > topo.t).map((p) => p.y);
    for (let k = 1; k < metade.length; k++) assert.ok(metade[k] <= metade[k - 1] + 0.02, 'depois do topo, só desce');
    assert.ok(Math.abs(fim.y - 0.05) < 0.01, `termina no chão (${fim.y})`);
    assert.ok(fim.x < casa.x - 0.65 * casa.s - 0.1, `ao lado da casa, sem entrar nela (${fim.x}, casa em ${casa.x})`);
    const fuga = await rota(page, i('fuga'), 'lobo');
    assert.ok(fuga[0].s > 0.1, 'na página seguinte ele já está à vista, sem cair de novo');
    assert.deepEqual([fuga[0].x, fuga[0].y, fuga[0].z].map((v) => v.toFixed(2)), [fim.x, fim.y, fim.z].map((v) => v.toFixed(2)), 'a página seguinte começa exatamente onde ele caiu');
    assert.ok(Math.abs(fuga[0].s - fim.s) < 0.01, 'e do mesmo tamanho');
    assert.ok(!fuga.some((p) => p.y > 1.2), 'em Correu, correu ele não vem mais do céu');
    for (const nome of ['pipo', 'bento', 'tico']) {
      const a = (await rota(page, i('tombo'), nome)).at(-1); const b = (await rota(page, i('fuga'), nome))[0];
      assert.deepEqual([a.x, a.z].map((v) => v.toFixed(2)), [b.x, b.z].map((v) => v.toFixed(2)), `${nome}: a posição no fim de um é a do começo do outro`);
    }
  } finally { await fechar(); }
});

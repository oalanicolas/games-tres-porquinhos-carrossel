// Pedido de Alan (06/11/2026): "bento ta fora de casa, o logo iria pegar ele, deveria ter uma terceira janela para ele aparecer,
// e ele entrar depois que os 2 irmaos entrassem, tem outros furos como essa na animacao". Cada furo vira uma checagem, com e sem voz.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { abrir } from './_apoio.mjs';

const { faixas } = JSON.parse(readFileSync(new URL('../src/narracao.json', import.meta.url)));
const FORA = 0.01; // abaixo disso a escala é um personagem escondido
const MODOS = [['sem voz', false], ['com voz', true]];

/** Coloca a cena `i` no segundo `t` e devolve o que `ler` extrair dela. Em `voz`, a linha do tempo fica ancorada à gravação. */
const emCena = (page, i, t, voz, ler) => page.evaluate(([i, t, voz, f, ler]) => {
  const L = window.__livro; const c = L.cenas[i]; c.linha.desancorar(); c.linha.reset();
  if (voz) c.linha.ancorar(f.marcos, f.acao_em);
  L.cenaEm(i, t); const r = (0, eval)(`(${ler})`)(c, L);
  c.linha.desancorar(); c.linha.reset(); return r;
}, [i, t, voz, faixas[i], ler.toString()]);
const inicioGrupo = (page, i, g, voz) => page.evaluate(([i, g, voz, f]) => {
  const l = window.__livro.cenas[i].linha; l.desancorar(); if (voz) l.ancorar(f.marcos, f.acao_em);
  const t = Math.min(...[...l._trilhas(), ...(l.chamadas ?? l.calls)].filter((x) => x.g === g).map((x) => x.start ?? x.at)); l.desancorar(); return t;
}, [i, g, voz, faixas[i]]);

test('Bento não fica fora de casa: casa de tijolos, entram Pipo, Tico e Bento por último, e só então chega o Lobo', async () => {
  const { page, erros, fechar } = await abrir();
  try {
    for (const [nome, voz] of MODOS) {
      const ordem = [];
      for (const g of ['entra-pipo', 'entra-tico', 'entra-bento', 'tranca', 'chega']) ordem.push(await inicioGrupo(page, 9, g, voz));
      assert.deepEqual([...ordem].sort((a, b) => a - b), ordem, `${nome}: ordem das entradas ${ordem}`);
      const le = (c) => ({ lobo: c.atores.lobo.root.scale.y, fora: Object.values(c.provas.deFora).map((q) => q.root.scale.y), janelas: c.provas.janelas.map((q) => q.root.scale.y) });
      const antes = await emCena(page, 9, ordem[4] - 0.02, voz, le);
      assert.ok(antes.lobo < FORA, `${nome}: o Lobo já está em cena`);
      assert.ok(antes.fora.every((v) => v < FORA), `${nome}: porquinho do lado de fora ${antes.fora}`);
      assert.ok(antes.janelas.every((v) => v > 0.05), `${nome}: rosto faltando nas 3 janelas ${antes.janelas}`);
      const fim = await emCena(page, 9, 1e4, voz, le);
      assert.ok(fim.fora.every((v) => v < FORA) && fim.janelas.every((v) => v > 0.05), `${nome}: ao fim, os três dentro`);
    }
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('casa de madeira: Pipo chega e entra antes de o Lobo aparecer', async () => {
  const { page, fechar } = await abrir();
  try {
    for (const [nome, voz] of MODOS) {
      const t = await inicioGrupo(page, 7, 'chega', voz);
      const r = await emCena(page, 7, t - 0.02, voz, (c) => ({ lobo: c.atores.lobo.root.scale.y, fora: c.provas.corredor.root.scale.y, janela: c.atores.pipo.root.scale.y }));
      assert.ok(r.lobo < FORA && r.fora < FORA && r.janela > 0.05, `${nome}: ${JSON.stringify(r)}`);
    }
  } finally { await fechar(); }
});

test('o Lobo vai até a porta para bater, nas casas de palha e de madeira', async () => {
  const { page, fechar } = await abrir();
  try {
    for (const i of [5, 7]) for (const [nome, voz] of MODOS) {
      const t = await inicioGrupo(page, i, 'bate', voz); const f = await page.evaluate(([i, t, voz, ff]) => { const l = window.__livro.cenas[i].linha; l.desancorar(); if (voz) l.ancorar(ff.marcos, ff.acao_em); const fim = Math.max(...l._trilhas().filter((x) => x.g === 'bate').map((x) => x.start + x.dur)); l.desancorar(); return fim; }, [i, t, voz, faixas[i]]);
      let perto = 9;
      for (let k = 0; k <= 12; k++) perto = Math.min(perto, await emCena(page, i, t + (f - t) * (k / 12), voz, (c) => Math.abs(c.atores.lobo.root.position.x - c.provas.porta)));
      assert.ok(perto < 0.42, `cena ${i + 1}, ${nome}: o Lobo não chega à porta (${perto.toFixed(2)})`);
    }
  } finally { await fechar(); }
});

test('o Lobo não cobre nenhuma janela enquanto sopra a casa de tijolos', async () => {
  const { page, fechar } = await abrir();
  try {
    const f = faixas[9]; const r = await page.evaluate(async ([f, de, ate]) => {
      const T = await import('/node_modules/three/build/three.module.js');
      const L = window.__livro; const c = L.cenas[9]; c.linha.ancorar(f.marcos, f.acao_em); const cobertas = [];
      for (let k = 0; k <= 30; k++) {
        const t = de + (ate - de) * (k / 30); L.cenaEm(9, t); L.scene.updateMatrixWorld(true);
        const caixa = new T.Box3().setFromObject(c.atores.lobo.cabeca); const a = caixa.min.clone().project(L.camera); const b = caixa.max.clone().project(L.camera);
        const [x0, x1] = [Math.min(a.x, b.x), Math.max(a.x, b.x)]; const [y0, y1] = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
        for (const j of c.provas.janelas) { const p = j.root.getWorldPosition(new T.Vector3()); p.y += 0.04; p.project(L.camera); if (p.x > x0 && p.x < x1 && p.y > y0 && p.y < y1) cobertas.push(t); }
      }
      c.linha.desancorar(); c.linha.reset(); return cobertas;
    }, [f, f.marcos.chega.em + 1, f.duracao]);
    assert.deepEqual(r, [], 'o focinho tapa o centro de uma janela');
  } finally { await fechar(); }
});

test('a chaminé é a mesma por fora e no corte, e o Lobo cai dentro do caldeirão que ficou debaixo dela', async () => {
  const { page, fechar } = await abrir();
  try {
    for (const [nome, voz] of MODOS) {
      const fim = await emCena(page, 11, 1e4, voz, (c) => ({ x: c.provas.caldeirao.position.x, duto: c.provas.duto }));
      assert.ok(Math.abs(fim.x - fim.duto) < 0.001, `${nome}: o caldeirão não chegou à chaminé`);
      const t = await inicioGrupo(page, 12, 'tchibum', voz);
      const queda = await emCena(page, 12, t - 0.02, voz, (c) => ({ x: c.atores.lobo.root.position.x, duto: c.provas.duto }));
      assert.ok(Math.abs(queda.x - queda.duto) < 0.001, `${nome}: o Lobo cai fora do duto`);
    }
    const u = faixas[12].marcos.uivo.em + 0.6;
    const r = await emCena(page, 12, u, true, (c, L) => { L.scene.updateMatrixWorld(true); const y = (o) => o.matrixWorld.elements[13]; return { cabeca: y(c.atores.lobo.cabeca), aro: y(c.provas.caldeirao) + 0.4, escala: c.atores.lobo.root.scale.y }; });
    assert.ok(r.cabeca > r.aro, `o Lobo some dentro do caldeirão: cabeça ${r.cabeca.toFixed(2)}, aro ${r.aro.toFixed(2)}`);
    assert.ok(r.escala > 0.15, 'o Lobo está à vista no uivo');
  } finally { await fechar(); }
});

test('ninguém fica para trás nem aparece de novo: irmãos saem na página 1 e o Lobo some atrás do morro na página 9', async () => {
  const { page, fechar } = await abrir();
  try {
    for (const [nome, voz] of MODOS) {
      const a = await emCena(page, 0, 1e4, voz, (c) => c.provas.irmaos.map((q) => q.root.scale.y));
      assert.ok(a.every((v) => v < FORA), `${nome}: irmão parado na página 1 ${a}`);
      const b = await emCena(page, 14, 1e4, voz, (c) => c.provas.lobo.root.scale.y);
      assert.ok(b < FORA, `${nome}: o Lobo continua à vista no fim da página 9`);
    }
  } finally { await fechar(); }
});

test('as capas não furam a dobra das páginas, e toda página tem numeral', async () => {
  const { page, fechar } = await abrir({ largura: 1800, altura: 1088 });
  try {
    const r = await page.evaluate(async () => {
      const T = await import('/node_modules/three/build/three.module.js'); const L = window.__livro; const ray = new T.Raycaster(); const ruins = []; const textos = [];
      for (let i = 0; i < L.N; i++) {
        L.cenaEm(i, 0); await new Promise((f) => requestAnimationFrame(() => requestAnimationFrame(f))); textos.push(document.body.innerText.includes('undefined'));
        // varre a dobra, de cima a baixo, no meio da tela
        for (let y = 0.2; y < 0.6; y += 0.05) for (const x of [-0.008, -0.004, 0, 0.004, 0.008]) {
          ray.setFromCamera(new T.Vector2(x, 1 - y * 2), L.camera);
          const p = ray.intersectObjects(L.scene.children, true).find((h) => { let v = true; for (let o = h.object; o; o = o.parent) v = v && o.visible; return v && /^parede-/.test(h.object.name); });
          if (p) { const k = +p.object.name.slice(7); if (k !== i && k !== i + 1) ruins.push({ i, k, x, y }); }
        }
      }
      return { ruins: ruins.slice(0, 5), textos };
    });
    assert.deepEqual(r.ruins, [], 'parede de outra página aparece na dobra');
    assert.ok(r.textos.every((v) => !v), 'há "undefined" na tela');
  } finally { await fechar(); }
});

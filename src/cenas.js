// As oito cenas e a capa. Cada cena devolve { linha, idle }: a linha é a ação do papel; idle é a vida em repouso.
import * as THREE from 'three';
import { piece, rig, group, ellipse, rect, rrect, blob, stroke, poly, pat, star, cloud, hill, wave, flame, heart, shade, sector, scallop, spiral, bake } from './paper.js';
import { Timeline } from './tween.js';
import { palco, sopro, revoada, ease, SOLO, meiaLargura } from './palco.js';
import { porco as porcoBase, porcoNaJanela, lobo as loboBase } from './personagens.js';
import * as O from './objetos.js';

// Personagens menores e um pouco recuados: a cena respira e o cenário fica à vista.
const ESC_P = 0.74, ESC_L = 0.76;
const recua = (z = 0) => (z > 2.3 ? 2.3 + (z - 2.3) * 0.5 : z);
const porco = (pai, tipo, o = {}) => porcoBase(pai, tipo, { ...o, s: (o.s ?? 1) * ESC_P, z: recua(o.z) });
const lobo = (pai, o = {}) => loboBase(pai, { ...o, s: (o.s ?? 1) * ESC_L, z: recua(o.z) });
const montadores = {};
export function montarCenas(livro, audio) {
  return livro.cunhas.map((c) => {
    const cena = montadores[c.j](palco(c.conteudo), audio);
    encaixar(c.conteudo);
    return cena;
  });
}

/** O cenário fixo não atravessa as paredes: encosta na cunha, e o que for largo demais estreita. Rigs animados são compostos à mão. */
function encaixar(conteudo) {
  const T = Math.tan(Math.PI / 8); const folga = 0.012;
  conteudo.updateWorldMatrix(true, true);
  const inv = conteudo.matrixWorld.clone().invert(); const m = new THREE.Matrix4(); const v = new THREE.Vector3();
  for (const filho of conteudo.children) {
    if (filho.userData.rig || filho.userData.naParede || filho.name === 'disco') continue;
    let foraE = 0, foraD = 0, fator = 1;
    filho.traverse((o) => {
      const pos = o.isMesh ? o.geometry.attributes.position : null; if (!pos) return;
      m.multiplyMatrices(inv, o.matrixWorld);
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m);
        const lim = Math.max(v.z * T - folga, 0.001); const d = Math.abs(v.x) - lim;
        if (d <= 0) continue;
        if (v.x < 0) foraE = Math.max(foraE, d); else foraD = Math.max(foraD, d);
        fator = Math.min(fator, lim / Math.abs(v.x));
      }
    });
    if (foraE > 0 && foraD > 0) { filho.scale.x *= fator; filho.position.x *= fator; } else if (foraE > 0) filho.position.x += foraE; else if (foraD > 0) filho.position.x -= foraD;
    filho.updateWorldMatrix(false, true);
  }
}

// ---- pedaços reaproveitados ------------------------------------------------------------------------
const PALHA = [
  { pts: rrect(0.11, 0.018, 0.004), paint: '#f2cf63' }, { pts: rrect(0.08, 0.016, 0.004), paint: '#d9a93f' }, { pts: rrect(0.14, 0.02, 0.004), paint: '#e9bd4d' },
];
const LASCA = [
  { pts: rrect(0.2, 0.05, 0.004), paint: '#c98a4b', edge: '#f4d4a6' }, { pts: rrect(0.14, 0.04, 0.004), paint: '#b97a3e', edge: '#f4d4a6' }, { pts: rrect(0.1, 0.045, 0.004), paint: '#d39757', edge: '#f4d4a6' },
];
function colinas(p, { atras = ['#7fc96c', '#6cba5c'], meio = ['#9ddc6f', '#88cc5c'], z1 = 0.92, z2 = 1.24 } = {}) {
  const a = p.pe(0, z1); piece(a, hill(meiaLargura(z1) * 2, 0.62, 0.04), pat('stripes', atras[0], atras[1], 0.28), { t: 0.012 });
  const b = p.pe(0, z2); piece(b, hill(meiaLargura(z2) * 2, 0.44, -0.05), pat('chevron', meio[0], meio[1], 0.34), { t: 0.012 });
}


/** Faixa de capim na frente, com flores. */
function primeiroPlano(p, cores = ['#6cc05a', '#57ab4b'], flores = ['#ffd24f', '#ff7fa8', '#ffffff', '#ff7fa8', '#ffd24f']) {
  const fe = p.pe(0, 2.72); piece(fe, wave(2.2, 0.15, 0.035, 4, 1), pat('grass', cores[0], cores[1], 0.28), { t: 0.012 });
  [-0.95, -0.58, 0.28, 0.7, 0.98].forEach((x, i) => O.flor(p.pe(x, 2.76), { cor: flores[i % flores.length], altura: 0.18 + (i % 2) * 0.05 }));
}
function trepadeira(p, lado, r, cor = '#ff8fb1', { y = 0.05, alto = 1.5 } = {}) {
  const g = p.parede(lado, r, y);
  piece(g, stroke([[0, 0], [0.02, alto * 0.35], [-0.02, alto * 0.7], [0.01, alto]], 0.032), '#3f9f55', { t: 0.008 });
  const n = Math.round(alto / 0.2);
  for (let i = 0; i < n; i++) { const yy = 0.2 + i * 0.19, sg = i % 2 ? 1 : -1; piece(g, blob([[0, yy], [sg * 0.12, yy + 0.07], [sg * 0.16, yy + 0.02], [sg * 0.07, yy - 0.04]], 4), '#5cc06a', { t: 0.006, z: 0.003 }); }
  for (const [px, py] of [[0, alto + 0.05], [0.1, alto * 0.76], [-0.1, alto * 0.54]]) { piece(g, star(6, 0.085, 0.052, px, py), cor, { t: 0.008, z: 0.008 }); piece(g, ellipse(0.028, 0.028, px, py, 10), '#ffd24f', { t: 0.004, z: 0.014, jitter: 0 }); }
}
function poste(p, lado, r, { alto = 1.1, cor = '#ffb02e' } = {}) {
  const g = p.parede(lado, r, 0.05);
  piece(g, rrect(0.045, alto, 0.008, 0, alto / 2), pat('wood', '#7a4a26', '#663c1c', 0.16), { t: 0.01 });
  piece(g, stroke([[0, alto - 0.02], [lado * -0.16, alto], [lado * -0.18, alto - 0.06]], 0.024), '#3d2c55', { t: 0.006, z: 0.006, jitter: 0 });
  O.lanterna(g, { x: lado * -0.18, y: alto - 0.26, z: 0.012, s: 1, cor, fio: 0.2 });
}
/** Encher o peito e soprar: serve às três casas. */
function encherESoprar(tl, w, t0, enche, audio, x0, { gola = 1 } = {}) {
  const S = t0 + enche;
  tl.to(w.peito, { sx: 1 + 0.26 * gola, sy: 1 + 0.2 * gola }, t0, enche, ease.inOut);
  tl.to(w.cabeca, { rz: 0.2, y: 0.91 }, t0, enche, ease.inOut);
  tl.to(w.bochecha, { s: 1 }, t0 + enche * 0.35, enche * 0.65, ease.back);
  tl.to(w.bracoF, { rz: 1.0 }, t0, enche, ease.inOut); tl.to(w.bracoT, { rz: -1.0 }, t0, enche, ease.inOut);
  tl.call(() => audio.tocar('inspira', { vol: 1, taxa: 0.72 }), t0 + 0.08);
  tl.call(() => { audio.tocar('vento', { vol: 1, dur: 1.5 }); audio.tocar('ar', { vol: 0.9, taxa: 0.42 }); }, S);
  tl.to(w.peito, { sx: 0.92, sy: 0.92 }, S, 0.55, ease.out);
  tl.to(w.cabeca, { rz: -0.1, y: 0.87 }, S, 0.3, ease.out);
  tl.to(w.bochecha, { s: 0.55 }, S, 0.5, ease.out);
  tl.to(w.fundoBoca, { sy: 0.9 }, S, 0.08, ease.out); tl.to(w.queixo, { rz: -0.14 }, S, 0.08, ease.out);
  tl.to(w.bracoF, { rz: 0.4 }, S, 0.25, ease.out); tl.to(w.bracoT, { rz: -0.4 }, S, 0.25, ease.out);
  tl.to(w.root, { x: x0 - 0.06 }, S, 0.4, ease.out);
  return S;
}
function acalmar(tl, w, t, x0) {
  tl.to(w.fundoBoca, { sy: 0.35 }, t, 0.2, ease.out); tl.to(w.queixo, { rz: 0 }, t, 0.2, ease.out); tl.to(w.bochecha, { s: 0.001 }, t, 0.2, ease.in);
  tl.to(w.root, { x: x0 }, t, 0.3, ease.out);
}
/** Porquinho da janela: pula para o chão e dispara até a borda da página. */
function fugir(tl, q, t) {
  tl.run((f) => { const v = f > 0; for (const o of [q.pernaE, q.pernaD, q.bracoE, q.bracoD, q.rabo]) o.visible = v; }, t, 0.01);
  tl.to(q.root, { y: SOLO }, t, 0.2, ease.in);
  tl.to(q.root, { x: 0.98, z: 2.72 }, t + 0.12, 0.72, ease.in);
  for (let k = 0; k < 3; k++) tl.pulse(q.corpo, { y: 0.08 }, t + 0.16 + k * 0.2, 0.2);
  tl.to(q.root, { s: 0.001 }, t + 0.74, 0.14, ease.in);
}
function voar(tl, g, i, t, alcance = 1.15) {
  const dest = 1 + alcance * (0.3 + (0.7 * ((i * 37) % 10)) / 10);
  tl.to(g, { x: g.position.x + dest * 0.36, y: g.position.y + 0.5 + (i % 4) * 0.24, z: g.position.z + dest * 0.85 }, t, 0.75, ease.out);
  tl.to(g, { s: 0.42 }, t, 0.42, ease.out);
  tl.to(g, { rz: (i % 2 ? -1 : 1) * (1.2 + (i % 3) * 0.9) }, t, 1, ease.out);
  tl.to(g, { s: 0.001 }, t + 0.55, 0.5, ease.in);
}

// ---- 1. Hora de partir ------------------------------------------------------------------------------
montadores[0] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.05, 1.1], [0.05, 1.1], [0.28, 1.7], [0.1, 2.3], [0.42, 3.02], [-0.3, 3.02], [-0.34, 2.3], [-0.1, 1.7]]), pat('stripes', '#f7e3b4', '#f0d69b', 0.2), { edge: '#d9c18a' });
  colinas(p, { atras: ['#8ed27a', '#7bc369'], meio: ['#b2e476', '#9dd662'] });
  const so = O.solDePapel(c, { x: -0.03, y: 1.42, z: 0.742, s: 0.62 });
  O.nuvem(c, { x: 0.13, y: 2.38, z: 0.68, s: 0.46 }); O.nuvem(c, { x: -0.14, y: 2.06, z: 0.72, s: 0.38 });
  // casinha da família
  const zc = 1.5;
  const casa = O.casaTijolo(c, { x: 0.16, y: SOLO, z: zc, s: 0.68, largura: 1.15, altura: 0.86 });
  O.chamine(casa.raiz, { x: 0.3, y: 1.12, z: 0.0, s: 0.8 });
  const fum = O.fumaca(c, 5, { x: 0.37, y: 1.28, z: zc + 0.02, altura: 0.6, s: 0.8 });
  O.arvore(p.pe(-0.5, 1.46), { s: 0.80, altura: 1.5, copa: '#ff8fb1', listra: '#f4769d', frutas: '#fff4dc', estampa: 'dots' });
  O.arvore(p.pe(0.5, 1.62), { s: 0.66, altura: 1.05, copa: '#74cc58', listra: '#5fb949', flip: -1 });
  // Mamãe Porca à porta
  const mae = porco(c, 'mae', { x: -0.3, y: SOLO, z: 1.92, s: 1 });
  mae.bracoD.rotation.z = 2.2; mae.bracoE.rotation.z = -0.5;
  O.cerca(p.pe(-0.52, 2.08), { largura: 0.5 }); O.cerca(p.pe(0.6, 2.12), { largura: 0.46 });
  const pl = O.placa(c, { x: 0.76, y: SOLO, z: 2.32, s: 1.05 });
  O.arbusto(p.pe(-0.82, 2.46), { s: 0.9 }); O.arbusto(p.pe(0.88, 2.56), { s: 0.85, cor: '#6cc05a', listra: '#57ab4b', flor: '#ffd24f' });
  // os três na estrada, de trouxa no ombro
  const trouxa = (q, cor) => { const b = rig(q.bracoD, 'trouxa', { y: -0.26, z: 0.012 }); piece(b, stroke([[-0.16, -0.03], [0.26, 0.2]], 0.024), pat('wood', '#a0623a', '#8a5230', 0.12), { t: 0.006, jitter: 0 }); piece(b, blob([[0.14, 0.2], [0.22, 0.05], [0.34, 0.04], [0.42, 0.18], [0.3, 0.27]], 4), pat('gingham', cor, shade(cor, -0.14), 0.12), { t: 0.01, z: 0.004 }); };
  const pipo = porco(c, 'pipo', { x: -0.62, y: SOLO, z: 2.58, s: 0.8 }); const tico = porco(c, 'tico', { x: -0.12, y: SOLO, z: 2.66, s: 0.88 }); const bento = porco(c, 'bento', { x: 0.42, y: SOLO, z: 2.6, s: 0.98 });
  [pipo, tico, bento].forEach((q, i) => { q.bracoD.rotation.z = 1.15; trouxa(q, ['#e0446a', '#3fb8c9', '#ffd24f'][i]); });
  primeiroPlano(p);
  poste(p, -1, 2.3); trepadeira(p, 1, 2.35, '#ffd24f', { alto: 1.3 });
  // ação
  tl.call(() => audio.tocar('grunhido', { vol: 0.8 }), 0.05); tl.call(() => audio.tocar('melro', { vol: 0.55 }), 0.35);
  for (let k = 0; k < 4; k++) tl.pulse(mae.bracoD, { rz: 0.5 }, k * 0.42, 0.42);
  tl.pulse(mae.cabeca, { rz: 0.12 }, 0, 1.68, ease.wiggle);
  [pipo, tico, bento].forEach((q, i) => {
    tl.to(q.bracoE, { rz: -2.3 }, 0.1 + i * 0.1, 0.25, ease.back);
    for (let k = 0; k < 3; k++) { tl.pulse(q.bracoE, { rz: 0.5 }, 0.35 + i * 0.1 + k * 0.32, 0.32); tl.pulse(q.corpo, { y: 0.13 }, 0.2 + i * 0.12 + k * 0.34, 0.34); }
    tl.to(q.bracoE, { rz: -0.2 }, 1.55 + i * 0.1, 0.25);
    tl.to(q.root, { x: q.root.position.x + 0.5, z: q.root.position.z + 0.02 }, 1.7 + i * 0.1, 1.3, ease.inOut);
    for (let k = 0; k < 5; k++) tl.pulse(q.corpo, { y: 0.05, rz: 0.04 }, 1.7 + i * 0.1 + k * 0.26, 0.26);
  });
  tl.call(() => audio.tocar('sino', { vol: 0.45, dur: 2.4 }), 1.4);
  tl.pulse(pl.t, { rz: 0.16 }, 1.7, 1.2, ease.wiggle);
  tl.to(so.g, { y: 2.42 }, 0, 3.0, ease.out);
  return { linha: tl, idle(t) { mae.idle(t); pipo.idle(t); tico.idle(t); bento.idle(t); fum.idle(t); so.raios.rotation.z = t * 0.1; } };
};

// ---- 2. Três casas ----------------------------------------------------------------------------------
montadores[1] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.34, 1.68], [0.34, 1.68], [0.84, 2.3], [1.0, 2.82], [0, 3.02], [-1.0, 2.82], [-0.84, 2.3]]), pat('dots', '#f7e3b4', '#fcefcd', 0.18), { edge: '#d9c18a' });
  colinas(p, { atras: ['#79c7a4', '#68b793'], meio: ['#a6dd80', '#90cd6c'] });
  const so = O.solDePapel(c, { x: 0.02, y: 2.34, z: 0.74, s: 0.68 });
  O.nuvem(c, { x: -0.14, y: 2.5, z: 0.7, s: 0.42 }); O.nuvem(c, { x: 0.17, y: 2.0, z: 0.75, s: 0.4 });
  O.arvore(p.pe(-0.56, 1.5), { s: 0.72, altura: 1.05, copa: '#74cc58', listra: '#5fb949' });
  O.arvore(p.pe(0.56, 1.52), { s: 0.76, altura: 1.25, copa: '#f4c04f', listra: '#e4ad3d', frutas: '#e84a5f', flip: -1 });
  // tijolo ao fundo, no centro
  const bz = 1.68;
  const tij = O.casaTijolo(c, { x: 0, y: SOLO, z: bz, s: 0.82 });
  const chTij = O.chamine(tij.raiz, { x: 0.32, y: 1.16, z: 0.0 });
  tij.raiz.scale.y = 0.001;
  const monteT = p.rig(0.02, bz + 0.1, 'monte');
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4 - j; i++) piece(monteT, rect(0.17, 0.075, -0.27 + i * 0.18 + j * 0.09, 0.04 + j * 0.08), pat('brick', '#d9583f', '#f6dcc0', 0.3), { t: 0.012, z: j * 0.003, edge: '#f6dcc0' });
  // madeira à direita
  const mz = 2.14;
  const mad = O.casaMadeira(c, { x: 0.47, y: SOLO, z: mz, s: 0.56 }); mad.raiz.scale.y = 0.001;
  const monteM = p.rig(0.47, mz + 0.06, 'monte');
  for (let j = 0; j < 4; j++) piece(monteM, stroke([[-0.3, 0.03 + j * 0.05], [0.3, 0.05 + j * 0.05]], 0.05), pat('wood', j % 2 ? '#c98a4b' : '#b97a3e', '#9d6833', 0.2), { t: 0.012, z: j * 0.003, jitter: 0.004 });
  // palha à esquerda
  const pz = 2.28;
  const pal = O.casaPalha(c, { x: -0.54, y: SOLO, z: pz, s: 0.52 }); pal.raiz.scale.y = 0.001;
  const monteP = p.rig(-0.54, pz + 0.05, 'monte');
  piece(monteP, blob([[-0.34, 0], [-0.22, 0.2], [0, 0.34], [0.22, 0.22], [0.34, 0]], 7), pat('straw', '#f2cf63', '#c7972f', 0.26), { t: 0.014, edge: '#fff2c0' });
  // os irmãos
  const pipo = porco(c, 'pipo', { x: -0.84, y: SOLO, z: 2.66, s: 0.72 }); pipo.bracoD.rotation.z = 0.6;
  const tico = porco(c, 'tico', { x: 0.04, y: SOLO, z: 2.7, s: 0.76 });
  // flauta do Tico
  const flauta = rig(tico.cabeca, 'flauta', { x: 0.12, y: -0.05, z: 0.2 }); piece(flauta, rrect(0.38, 0.032, 0.012, 0.12, -0.03), pat('stripes', '#f4cd5e', '#d9a93f', 0.06), { t: 0.008, jitter: 0 }); flauta.visible = false;
  const bento = porco(c, 'bento', { x: 0.76, y: SOLO, z: 2.62, s: 0.86, virado: true });
  const colher = rig(bento.bracoD, 'colher', { y: -0.28, z: 0.012, rot: 0.8 }); piece(colher, rrect(0.03, 0.16, 0.008, 0, 0.06), '#7a4a26', { t: 0.006, jitter: 0 }); piece(colher, poly([-0.07, 0.14], [0.07, 0.14], [0, 0.3]), '#c7cbd9', { t: 0.006, z: 0.002, edge: '#fff', jitter: 0 });
  primeiroPlano(p, ['#8fcf4e', '#7bbd42'], ['#ffffff', '#ffd24f', '#ff7fa8']);
  trepadeira(p, -1, 2.28, '#ffd24f', { alto: 1.15 }); poste(p, 1, 2.36, { alto: 1.25, cor: '#ff8fb1' });
  // ação: palha num piscar, madeira às pressas, tijolo a dia inteiro
  tl.call(() => audio.tocar('palha', { vol: 1 }), 0.05);
  tl.to(monteP, { sy: 0.001 }, 0.05, 0.16, ease.in);
  tl.to(pal.raiz, { sy: 0.52 }, 0.12, 0.42, ease.back);
  tl.pulse(pipo.corpo, { y: 0.16 }, 0.5, 0.35); tl.pulse(pipo.corpo, { y: 0.16 }, 0.85, 0.35); tl.pulse(pipo.bracoD, { rz: 1.6 }, 0.5, 0.7);
  tl.call(() => audio.tocar('martelo', { vol: 0.8 }), 0.9); tl.call(() => audio.tocar('martelo2', { vol: 0.8 }), 1.15); tl.call(() => audio.tocar('range', { vol: 0.9 }), 1.4);
  tl.to(monteM, { sy: 0.001 }, 0.85, 0.2, ease.in);
  tl.to(mad.raiz, { sy: 0.56 }, 0.9, 0.7, ease.back);
  tl.call(() => { flauta.visible = true; }, 1.55);
  tl.to(tico.bracoD, { rz: 2.2 }, 1.55, 0.25, ease.out); tl.to(tico.bracoE, { rz: -2.2 }, 1.55, 0.25, ease.out);
  tl.run((q) => { flauta.visible = q > 0; tico.cabeca.rotation.z = q > 0 && q < 1 ? Math.sin(q * 30) * 0.06 : 0; }, 1.55, 3.2);
  tl.call(() => audio.tocar('sino', { vol: 0.4, dur: 2.6 }), 1.8);
  const fases = [0.16, 0.32, 0.48, 0.64, 0.8, 1];
  fases.forEach((alt, k) => {
    const t = 1.7 + k * 0.42;
    tl.to(tij.raiz, { sy: alt * 0.82 }, t, 0.2, ease.back); tl.to(monteT, { sy: 1 - (k + 1) / 6 + 0.001 }, t, 0.2, ease.out);
    tl.pulse(bento.bracoD, { rz: 1.3 }, t - 0.05, 0.3);
    tl.call(() => audio.tocar(k % 2 ? 'tijolo2' : 'tijolo', { vol: 1 }), t);
  });
  tl.pulse(bento.corpo, { y: 0.14 }, 4.3, 0.4);
  return { linha: tl, idle(t) { pipo.idle(t); tico.idle(t); bento.idle(t); so.raios.rotation.z = t * 0.1; } };
};

// ---- 3. A casa de palha ----------------------------------------------------------------------------
montadores[2] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[0.02, 1.8], [0.34, 1.8], [0.5, 2.2], [0.1, 2.6], [0.1, 3.02], [-0.5, 3.02], [-0.16, 2.5], [0.1, 2.15]]), pat('stripes', '#f5dfa7', '#efd492', 0.2), { edge: '#d9c18a' });
  colinas(p);
  const so = O.solDePapel(c, { x: -0.08, y: 2.36, z: 0.74, s: 0.7 });
  O.nuvem(c, { x: 0.14, y: 2.6, z: 0.76, s: 0.42 }); O.nuvem(c, { x: -0.2, y: 1.92, z: 0.76, s: 0.42 }); O.nuvem(c, { x: 0.16, y: 1.76, z: 0.78, s: 0.36 });
  O.arvore(p.pe(-0.52, 1.42), { s: 0.80, altura: 1.5, copa: '#79c95a', listra: '#65b64a' });
  O.arvore(p.pe(0.54, 1.46), { s: 0.84, altura: 1.5, copa: '#f49d3f', listra: '#e4892e', frutas: '#e84a5f', flip: -1 });
  const zc = 1.78; const xc = 0.02;
  const casa = O.casaPalha(c, { x: xc, y: SOLO, z: zc, s: 0.9 });
  const zj = zc + 0.1; const jx = xc + 0.3, jy = 0.56;
  const pipo = porcoNaJanela(c, 'pipo', { x: jx, y: jy - 0.03, z: zj + 0.008, s: 0.5 });
  const mj = O.molduraJanela(c, { x: jx, y: jy, z: zj + 0.07, r: 0.15, cor: '#a8702f', sombra: '#70401f' }); mj.userData.rig = true;
  O.flor(p.pe(0.78, 2.26), { cor: '#ff7fa8', altura: 0.3 }); O.flor(p.pe(0.66, 2.34), { cor: '#ffffff', altura: 0.22 }); O.cogumelo(p.pe(0.86, 2.46), {});
  O.arbusto(p.pe(0.74, 2.66), { s: 1.05 });
  O.cerca(p.pe(0.56, 2.06), { largura: 0.34 });
  primeiroPlano(p);
  const x0 = -0.58; const w = lobo(c, { x: x0, y: SOLO, z: 2.6, s: 0.76 }); w.rabo.rotation.z = 0.8;
  const pl = p.parede(-1, 2.2, 0.05); piece(pl, rrect(0.06, 0.9, 0.01, 0, 0.45), pat('wood', '#a0623a', '#8a5230', 0.18), { t: 0.01 }); piece(pl, poly([-0.28, 0.72], [0.24, 0.72], [0.36, 0.82], [0.24, 0.92], [-0.28, 0.92]), pat('wood', '#e7a95c', '#cf9147', 0.18), { t: 0.01, z: 0.01 });
  trepadeira(p, 1, 2.42, '#ff8fb1', { alto: 1.35 });
  // ação
  tl.call(() => audio.tocar('uivo2', { vol: 0.35, taxa: 1.3 }), 0.05);
  const S = encherESoprar(tl, w, 0.1, 0.95, audio, x0);
  const mx = x0 + 0.54 * 0.76 * ESC_L, my = SOLO + 0.92 * 0.76 * ESC_L;
  sopro(c, tl, S, 1.25, { x: mx, y: my, z: 2.5, alvoX: 0.8, alvoY: my + 0.22, alvoZ: 2.12, n: 13 });
  casa.telhado.forEach((g, i) => voar(tl, g, i + 3, S + 0.1 + (casa.telhado.length - i) * 0.04));
  casa.partes.forEach((g, i) => voar(tl, g, i, S + 0.32 + i * 0.05));
  tl.call(() => { audio.tocar('palha', { vol: 1 }); audio.tocar('pano', { vol: 0.8 }); }, S + 0.15); tl.call(() => audio.tocar('palha2', { vol: 1 }), S + 0.55);
  revoada(c, tl, S + 0.15, 26, PALHA, { x: xc, y: 0.9, z: 2.14, dx: 0.8, alto: 0.9, espalha: 0.7, seed: 8 });
  tl.call(() => audio.tocar('guincho', { vol: 0.85 }), S + 0.35);
  voar(tl, mj, 2, S + 0.3); tl.to(casa.vao, { sy: 0.001 }, S + 0.42, 0.28, ease.in);
  fugir(tl, pipo, S + 0.38);
  acalmar(tl, w, S + 1.55, x0);
  tl.call(() => audio.tocar('uivo1', { vol: 0.35 }), S + 1.6);
  return { linha: tl, idle(t) { w.idle(t); w.rabo.rotation.z = 0.8 + Math.sin(t * 2.2) * 0.06; pipo.idle(t); so.raios.rotation.z = t * 0.1; } };
};

// ---- 4. A casa de madeira ---------------------------------------------------------------------------
montadores[3] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.34, 1.75], [0.06, 1.75], [0.24, 2.3], [0.34, 3.02], [-0.44, 3.02], [-0.2, 2.3]]), pat('stripes', '#f0cd8b', '#e8c076', 0.2), { edge: '#c9a764' });
  colinas(p, { atras: ['#b69a5a', '#a48a4d'], meio: ['#cdbb5a', '#bcaa4a'] });
  const so = O.solDePapel(c, { x: 0.06, y: 2.28, z: 0.74, s: 0.72, cor: '#ffbe3c', raio: '#f58a2e' });
  O.nuvem(c, { x: -0.16, y: 2.48, z: 0.7, s: 0.46, listra: '#ffdcc4' }); O.nuvem(c, { x: 0.2, y: 1.8, z: 0.78, s: 0.38, listra: '#ffdcc4' });
  O.arvore(p.pe(-0.54, 1.46), { s: 0.84, altura: 1.5, copa: '#d9702e', listra: '#c46024', frutas: '#ffd24f' });
  O.arvore(p.pe(0.54, 1.5), { s: 0.77, altura: 1.35, copa: '#e8a93a', listra: '#d59729', frutas: '#e84a5f', flip: -1 });
  const xc = 0.05, zc = 1.8;
  const casa = O.casaMadeira(c, { x: xc, y: SOLO, z: zc, s: 0.95 });
  const zj = zc + 0.08;
  const pipo = porcoNaJanela(c, 'pipo', { x: xc + 0.31, y: 0.58, z: zj, s: 0.44 });
  const tico = porcoNaJanela(c, 'tico', { x: xc - 0.33, y: 0.58, z: zj, s: 0.44 });
  const mj1 = O.molduraJanela(c, { x: xc + 0.31, y: 0.61, z: zj + 0.065, r: 0.135, cor: '#7a4a26', sombra: '#54301a' });
  const mj2 = O.molduraJanela(c, { x: xc - 0.33, y: 0.61, z: zj + 0.065, r: 0.135, cor: '#7a4a26', sombra: '#54301a' });
  O.arbusto(p.pe(0.8, 2.34), { s: 0.95, cor: '#8aa83f', listra: '#7a9733', flor: '#ffd24f' });
  O.cogumelo(p.pe(0.6, 2.42), { cor: '#8f5fd8' }); O.flor(p.pe(0.92, 2.6), { cor: '#fff', altura: 0.22 });
  primeiroPlano(p, ['#a9b84a', '#98a83d'], ['#ffd24f', '#f58a2e', '#fff']);
  const x0 = -0.58; const w = lobo(c, { x: x0, y: SOLO, z: 2.6, s: 0.76 }); w.rabo.rotation.z = 0.8;
  poste(p, -1, 2.26, { cor: '#ffb02e' }); trepadeira(p, 1, 2.42, '#ffb02e', { alto: 1.2 });
  const mx = x0 + 0.54 * 0.76 * ESC_L, my = SOLO + 0.92 * 0.76 * ESC_L;
  // primeira soprada: range
  const S1 = encherESoprar(tl, w, 0.1, 0.72, audio, x0);
  sopro(c, tl, S1, 0.75, { x: mx, y: my, z: 2.5, alvoX: 0.8, alvoY: my + 0.2, alvoZ: 2.12, n: 8, seed: 11 });
  tl.call(() => audio.tocar('range', { vol: 1 }), S1 + 0.1); tl.call(() => audio.tocar('range2', { vol: 1 }), S1 + 0.3); tl.call(() => audio.tocar('range', { vol: 1, taxa: 0.65 }), S1 + 0.55);
  casa.tabuas.forEach((g, i) => tl.pulse(g, { rz: -0.1 - (i % 3) * 0.04 }, S1 + 0.04 * i, 0.55));
  casa.ripas.forEach((g, i) => tl.pulse(g, { y: 0.05 }, S1 + 0.03 * i, 0.45));
  acalmar(tl, w, S1 + 0.85, x0);
  // segunda: desaba
  const T2 = S1 + 1.05;
  tl.to(w.fundoBoca, { sy: 0.35 }, T2 - 0.05, 0.01);
  const S2 = encherESoprar(tl, w, T2, 0.62, audio, x0);
  sopro(c, tl, S2, 1.0, { x: mx, y: my, z: 2.5, alvoX: 0.8, alvoY: my + 0.22, alvoZ: 2.12, n: 13, seed: 12 });
  casa.ripas.forEach((g, i) => voar(tl, g, i, S2 + 0.08 + i * 0.03, 0.9));
  casa.tabuas.forEach((g, i) => {
    const q = S2 + 0.2 + i * 0.045; const sentido = i % 2 ? -1 : -0.75;
    tl.to(g, { rz: sentido * 1.5 }, q, 0.55, ease.bounce); tl.to(g, { x: g.position.x + 0.32 + i * 0.015, y: 0.0 }, q, 0.55, ease.in); tl.to(g, { z: g.position.z + 0.04 + i * 0.008 }, q, 0.55, ease.linear);
  });
  tl.to(casa.vao, { sy: 0.001 }, S2 + 0.34, 0.3, ease.in);
  tl.call(() => audio.tocar('desaba', { vol: 1 }), S2 + 0.3); tl.call(() => audio.tocar('tabuas', { vol: 1 }), S2 + 0.5);
  revoada(c, tl, S2 + 0.25, 16, LASCA, { x: xc, y: 0.7, z: 2.14, dx: 0.72, alto: 0.72, espalha: 0.7, seed: 18 });
  // molduras e porquinhos saem correndo
  tl.call(() => audio.tocar('guincho', { vol: 0.9 }), S2 + 0.35); tl.call(() => audio.tocar('guincho', { vol: 0.8, taxa: 1.12 }), S2 + 0.6);
  [mj1, mj2].forEach((m, i) => { m.userData.rig = true; tl.to(m, { x: m.position.x + 0.7 + i * 0.22, y: 0.15 }, S2 + 0.2, 0.55, ease.in); tl.to(m, { rz: -2 }, S2 + 0.2, 0.55, ease.linear); tl.to(m, { s: 0.001 }, S2 + 0.65, 0.15, ease.in); });
  [pipo, tico].forEach((q, i) => fugir(tl, q, S2 + 0.34 + i * 0.1));
  acalmar(tl, w, S2 + 1.35, x0);
  tl.call(() => audio.tocar('uivo2', { vol: 0.35 }), S2 + 1.45);
  return { linha: tl, idle(t) { w.idle(t); w.rabo.rotation.z = 0.8 + Math.sin(t * 2.2) * 0.06; pipo.idle(t); tico.idle(t); so.raios.rotation.z = t * 0.08; } };
};

// ---- 5. A casa de tijolos ---------------------------------------------------------------------------
montadores[4] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.2, 1.8], [0.3, 1.8], [0.34, 2.3], [0.36, 2.92], [-0.56, 2.92], [-0.3, 2.3]]), pat('stripes', '#f6d7c2', '#f0c9ad', 0.2), { edge: '#cda38a' });
  colinas(p, { atras: ['#8c70b8', '#7c60aa'], meio: ['#b986ad', '#a9769d'] });
  const so = O.solDePapel(c, { x: 0.02, y: 1.72, z: 0.742, s: 0.84, cor: '#ffcf52', raio: '#ff7e5c' });
  O.nuvem(c, { x: -0.18, y: 2.42, z: 0.72, s: 0.44, cor: '#ffe3ea', listra: '#ffc7d6' }); O.nuvem(c, { x: 0.16, y: 2.58, z: 0.72, s: 0.38, cor: '#ffe3ea', listra: '#ffc7d6' });
  O.arvore(p.pe(-0.54, 1.44), { s: 0.84, altura: 1.55, copa: '#8c4fc0', listra: '#7c40b0', frutas: '#ffd24f', estampa: 'dots' });
  O.arvore(p.pe(0.56, 1.48), { s: 0.74, altura: 1.28, copa: '#e0568e', listra: '#d0467e', frutas: '#fff4dc', flip: -1 });
  const xc = 0, zc = 1.74, sc = 0.9;
  const casa = O.casaTijolo(c, { x: xc, y: SOLO, z: zc, s: sc });
  O.chamine(casa.raiz, { x: 0.3, y: 1.3, z: 0.0 });
  const fum = O.fumaca(c, 6, { x: xc + 0.27, y: 1.6, z: zc + 0.01, altura: 0.8 });
  const zj = zc + 0.075; const jan = [[xc - 0.385, 0.68], [xc + 0.385, 0.68]];
  const j1 = porcoNaJanela(c, 'pipo', { x: jan[0][0], y: jan[0][1] - 0.03, z: zj, s: 0.42 });
  const j2 = porcoNaJanela(c, 'tico', { x: jan[1][0], y: jan[1][1] - 0.03, z: zj, s: 0.42 });
  jan.forEach(([x, y]) => O.molduraJanela(c, { x, y, z: zj + 0.065, r: 0.135, cor: '#e9c79c', sombra: '#a0623a' }));
  for (const [x] of jan) { const g = p.alto(x, 0.5, zj + 0.08); piece(g, rrect(0.36, 0.07, 0.01), pat('wood', '#a0623a', '#8a5230', 0.14), { t: 0.012 }); for (let i = 0; i < 3; i++) piece(g, star(5, 0.04, 0.024, -0.1 + i * 0.1, 0.05), ['#ff7fa8', '#ffd24f', '#fff'][i], { t: 0.005, z: 0.008, jitter: 0 }); }
  const bento = porco(c, 'bento', { x: xc + 0.56, y: SOLO, z: 2.5, s: 0.82, virado: true });
  O.arbusto(p.pe(0.92, 2.34), { s: 0.78, cor: '#5e9c70', listra: '#4e8c60', flor: '#ff7fa8' });
  const flores = []; for (const [x, cor] of [[-0.3, '#fff'], [-0.12, '#ffd24f'], [0.06, '#ff7fa8']]) { const r = p.rig(x, 2.42, 'flor'); O.flor(r, { cor, altura: 0.26 }); flores.push(r); }
  primeiroPlano(p, ['#7fae6a', '#6f9e5a'], ['#ffd24f', '#ff7fa8', '#fff']);
  const x0 = -0.58; const w = lobo(c, { x: x0, y: SOLO, z: 2.6, s: 0.76 }); w.rabo.rotation.z = 0.8;
  poste(p, -1, 2.26, { cor: '#ff8fb1' }); trepadeira(p, 1, 2.46, '#ff8fb1', { alto: 1.15 });
  const mx = x0 + 0.54 * 0.76 * ESC_L, my = SOLO + 0.92 * 0.76 * ESC_L;
  let t = 0.1;
  [0.72, 0.62, 0.62].forEach((enche, k) => {
    const S = encherESoprar(tl, w, t, enche, audio, x0, { gola: 1 + k * 0.2 });
    sopro(c, tl, S, 0.85, { x: mx, y: my, z: 2.5, alvoX: 0.5, alvoY: my + 0.2, alvoZ: 2.16, n: 9 + k * 2, seed: 20 + k });
    flores.forEach((r, i) => tl.pulse(r, { rz: -0.42 }, S + 0.05 + i * 0.05, 0.6));
    tl.to(w.roxo, { s: 0.45 + k * 0.33 }, S, 0.7, ease.out);
    tl.pulse(j1.cabeca, { rz: 0.12 }, S, 0.9, ease.wiggle); tl.pulse(j2.cabeca, { rz: -0.12 }, S, 0.9, ease.wiggle);
    tl.pulse(bento.corpo, { y: 0.09 }, S + 0.15, 0.32);
    acalmar(tl, w, S + 0.82, x0);
    t = S + 0.98;
    tl.to(w.fundoBoca, { sy: 0.35 }, t - 0.05, 0.01);
  });
  // cansado: arria e os três riem
  tl.call(() => audio.tocar('uivo1', { vol: 0.28, taxa: 0.72 }), t);
  tl.to(w.corpo, { rz: 0.12 }, t, 0.5, ease.bounce); tl.to(w.cabeca, { rz: -0.42, y: 0.77 }, t, 0.5, ease.bounce); tl.to(w.bracoF, { rz: -0.16 }, t, 0.4); tl.to(w.bracoT, { rz: 0.1 }, t, 0.4); tl.to(w.queixo, { rz: -0.22 }, t, 0.3); tl.to(w.fundoBoca, { sy: 1 }, t, 0.3);
  tl.call(() => { audio.tocar('risos', { vol: 0.5, dur: 1.8 }); audio.tocar('grunhido', { vol: 0.5 }); }, t + 0.25);
  [j1, j2, bento].forEach((q, i) => { for (let k = 0; k < 3; k++) tl.pulse(q.corpo, { y: 0.1 }, t + 0.25 + k * 0.3 + i * 0.05, 0.3); });
  return { linha: tl, idle(tt) { w.idle(tt); w.rabo.rotation.z = 0.8 + Math.sin(tt * 2.2) * 0.06; j1.idle(tt); j2.idle(tt); bento.idle(tt); fum.idle(tt); so.raios.rotation.z = tt * 0.08; } };
};

/** Corte da casa: parede de dentro, duto da chaminé, lareira e telhado. Para as cenas 6 e 7. */
function casaEmCorte(p, zc = 1.62) {
  const c = p.conteudo;
  const g = p.pe(0, zc);
  const L = 1.32, A = 1.12;
  piece(g, rect(L, A, 0, A / 2), pat('gingham', '#ffd9a0', '#f5c37f', 0.26), { t: 0.014, edge: '#e6a96b' });
  // moldura de tijolo
  piece(g, rect(0.08, A, -L / 2 + 0.04, A / 2), pat('brick', '#d9583f', '#f6dcc0', 0.24), { t: 0.016, z: 0.012, edge: '#f6dcc0' }); piece(g, rect(0.08, A, L / 2 - 0.04, A / 2), pat('brick', '#d9583f', '#f6dcc0', 0.24), { t: 0.016, z: 0.012, edge: '#f6dcc0' });
  piece(g, rect(L, 0.07, 0, 0.035), pat('wood', '#8c4f2a', '#7b4323', 0.2), { t: 0.016, z: 0.012 });
  // quadros e prateleira
  const q = group(g, { x: 0.42, y: 0.72, z: 0.02 }); piece(q, rrect(0.24, 0.3, 0.01), '#a0623a', { t: 0.008 }); piece(q, rrect(0.17, 0.23, 0.005), '#bfe6ef', { t: 0.006, z: 0.006 }); piece(q, heart(0.05), '#e0446a', { t: 0.004, z: 0.012 });
  const e = group(g, { x: -0.42, y: 0.72, z: 0.02 }); piece(e, rrect(0.34, 0.04, 0.008), pat('wood', '#a0623a', '#8a5230', 0.15), { t: 0.01 });
  for (const [x, h, cor] of [[-0.1, 0.12, '#e84a5f'], [0, 0.17, '#3fb8c9'], [0.1, 0.1, '#ffd24f']]) piece(e, rrect(0.07, h, 0.02, x, 0.02 + h / 2), cor, { t: 0.008, z: 0.004 });
  // lareira e duto
  piece(g, blob([[-0.3, 0.07], [-0.3, 0.5], [-0.18, 0.66], [0.18, 0.66], [0.3, 0.5], [0.3, 0.07]], 4), pat('brick', '#8c3c2c', '#b67559', 0.2), { t: 0.016, z: 0.012, edge: '#c69276' });
  piece(g, blob([[-0.2, 0.07], [-0.2, 0.42], [-0.1, 0.54], [0.1, 0.54], [0.2, 0.42], [0.2, 0.07]], 4), '#241726', { t: 0.006, z: 0.03, edge: '#241726' });
  piece(g, rect(0.22, 1.0, 0, 1.1), '#2a1a2c', { t: 0.006, z: 0.012, edge: '#2a1a2c', jitter: 0 });
  piece(g, rect(0.04, 1.0, -0.13, 1.1), pat('brick', '#c64e38', '#f6dcc0', 0.16), { t: 0.01, z: 0.018, edge: '#f6dcc0' }); piece(g, rect(0.04, 1.0, 0.13, 1.1), pat('brick', '#c64e38', '#f6dcc0', 0.16), { t: 0.01, z: 0.018, edge: '#f6dcc0' });
  // telhado por cima, com abertura do duto visível
  const tz = 0.016; const lado = (sinal) => { const q2 = poly([sinal * 0.15, A + 0.65], [sinal * 0.72, A - 0.02], [sinal * 0.15, A - 0.02]); piece(g, q2, pat('shingle', '#5a4fb0', '#463c96', 0.3), { t: 0.016, z: tz + 0.014, edge: '#d7d2f5' }); };
  lado(-1); lado(1);
  piece(g, rrect(0.36, 0.06, 0.012, 0, 1.62), '#e9c79c', { t: 0.012, z: 0.03, edge: '#f8e5c8' });
  return { g, zc, L, A, topoY: SOLO + 1.62 };
}

// ---- 6. Pela chaminé --------------------------------------------------------------------------------
montadores[5] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.68, 1.68], [0.68, 1.68], [1.12, 2.78], [0.6, 2.96], [0, 3.02], [-0.6, 2.96], [-1.12, 2.78]]), pat('wood', '#a06a42', '#8c5a36', 0.34), { edge: '#7c4d2e' });
  colinas(p, { atras: ['#3e3a7e', '#34306e'], meio: ['#55509a', '#48448c'] });
  O.lua(c, { x: -0.09, y: 2.42, z: 0.76, s: 0.72 });
  O.nuvem(c, { x: 0.16, y: 2.2, z: 0.74, s: 0.36, cor: '#d9c9f2', listra: '#c3afe8' });
  O.arvore(p.pe(-0.6, 1.48), { s: 0.72, altura: 1.3, copa: '#3f7f7f', listra: '#347070', frutas: null });
  O.arvore(p.pe(0.62, 1.5), { s: 0.64, altura: 1.25, copa: '#6452a8', listra: '#564498', frutas: null, flip: -1 });
  const corte = casaEmCorte(p, 1.62);
  // Lobo pé ante pé no telhado
  const w = lobo(c, { x: -0.46, y: SOLO + 1.34, z: 1.72, s: 0.5 }); w.root.rotation.z = -0.42; w.rabo.rotation.z = 0.6;
  // fogo e caldeirão
  const fogo = O.fogueira(c, { x: 0, y: SOLO + 0.04, z: 2.02, s: 0.92 });
  const cal = O.caldeirao(c, { x: 0, y: SOLO + 0.13, z: 2.08, s: 0.92 });
  const fum = O.fumaca(c, 6, { x: 0.02, y: SOLO + 0.62, z: 2.11, altura: 0.72, cor: '#fff4f8', s: 0.92 });
  fum.raiz.scale.setScalar(0.001);
  const bolhas = []; for (let i = 0; i < 6; i++) { const b = rig(c, 'bolha', { x: -0.26 + i * 0.1, y: SOLO + 0.62, z: 2.11, s: 0.001 }); piece(b, ellipse(0.026, 0.026, 0, 0, 10), '#d2f6f7', { t: 0.005, edge: '#fff', jitter: 0, noShadow: true }); bolhas.push(b); }
  // os três
  const bento = porco(c, 'bento', { x: -0.68, y: SOLO, z: 2.5, s: 0.78 }); bento.bracoD.rotation.z = 2.3;
  const pipo = porco(c, 'pipo', { x: 0.62, y: SOLO, z: 2.38, s: 0.7, virado: true }); pipo.bracoD.rotation.z = 1.15; pipo.bracoE.rotation.z = -1.15;
  const tico = porco(c, 'tico', { x: 0.34, y: SOLO, z: 2.62, s: 0.74, virado: true }); tico.bracoD.rotation.z = 1.15;
  // lenha
  const lenha = rig(c, 'lenha', { x: -0.46, y: 0.42, z: 2.26, s: 0.001 }); piece(lenha, stroke([[-0.16, 0], [0.16, 0.02]], 0.07), pat('wood', '#8a5230', '#70401f', 0.14), { t: 0.014 });
  const tp = p.pe(0, 2.72); piece(tp, rect(2.2, 0.09, 0, 0.045), pat('wood', '#7a4a26', '#663c1c', 0.22), { t: 0.014 });
  poste(p, -1, 2.3, { cor: '#ffb02e' }); poste(p, 1, 2.3, { cor: '#ffb02e', alto: 1.0 });
  // ação
  let forca = { v: 1 }; let ferve = 0;
  tl.to(forca, { v: 2 }, 0.3, 1.6, ease.inOut);
  tl.call(() => audio.tocar('grunhido', { vol: 0.8 }), 0.02);
  tl.pulse(bento.bracoD, { rz: 0.5 }, 0, 0.3); tl.pulse(bento.bracoD, { rz: 0.5 }, 0.3, 0.3); tl.pulse(bento.corpo, { y: 0.1 }, 0, 0.3); tl.pulse(bento.corpo, { y: 0.1 }, 0.3, 0.3);
  // lenha no fogo
  tl.to(lenha, { s: 1 }, 0.25, 0.12); tl.to(lenha, { x: -0.05, y: 0.16, rz: 3 }, 0.3, 0.45, ease.in); tl.to(lenha, { s: 0.001 }, 0.72, 0.08);
  tl.call(() => { audio.tocar('lenha', { vol: 0.9 }); audio.tocar('chama', { vol: 1 }); }, 0.72); tl.call(() => audio.tocar('chama', { vol: 0.9, taxa: 0.85 }), 1.12);
  // Pipo sopra as brasas, Tico empurra o caldeirão
  tl.to(pipo.root, { x: 0.46 }, 0.7, 0.35, ease.inOut); tl.to(pipo.corpo, { rz: 0.32 }, 0.7, 0.35, ease.out); tl.pulse(pipo.corpo, { y: 0.05 }, 1.05, 0.25); tl.pulse(pipo.corpo, { y: 0.05 }, 1.3, 0.25);
  tl.to(tico.root, { x: 0.28 }, 0.9, 0.5, ease.inOut); tl.to(cal.g, { x: -0.03 }, 1.1, 0.3, ease.out);
  tl.call(() => audio.tocar('caldeirao', { vol: 0.95 }), 1.0);
  tl.to(fum.raiz, { s: 0.92 }, 1.2, 0.5, ease.out);
  bolhas.forEach((b, i) => { for (let k = 0; k < 4; k++) { const t0 = 1.25 + i * 0.11 + k * 0.55; tl.to(b, { s: 1 }, t0, 0.1); tl.pulse(b, { y: 0.1 }, t0, 0.42, ease.linear); tl.to(b, { s: 0.001 }, t0 + 0.36, 0.08); } });
  // o Lobo chega à boca da chaminé
  const passos = [[-0.38, 1.46], [-0.3, 1.56], [-0.23, 1.64], [-0.17, 1.72]];
  passos.forEach(([x, y], i) => { tl.to(w.root, { x, y: SOLO + y - 0.02 }, 1.0 + i * 0.42, 0.32, ease.inOut); tl.pulse(w.pernaF, { rz: 0.45 }, 1.0 + i * 0.42, 0.32); tl.pulse(w.pernaT, { rz: -0.45 }, 1.0 + i * 0.42, 0.32); tl.call(() => audio.tocar(i % 2 ? 'range' : 'range2', { vol: 0.65, taxa: 1 + i * 0.05 }), 1.15 + i * 0.42); });
  tl.to(w.root, { rz: 0 }, 2.5, 0.3); tl.to(w.pupila, { x: 0.0, y: -0.03 }, 2.5, 0.2); tl.to(w.sobr, { rz: 0.1 }, 2.6, 0.2);
  return { linha: tl, idle(t) { w.idle(t); w.rabo.rotation.z = 0.6 + Math.sin(t * 2.2) * 0.05; bento.idle(t); pipo.idle(t); tico.idle(t); fogo.idle(t, forca.v); fum.idle(t); } };
};

// ---- 7. Rabo em brasa -------------------------------------------------------------------------------
montadores[6] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.68, 1.68], [0.68, 1.68], [1.12, 2.78], [0.6, 2.96], [0, 3.02], [-0.6, 2.96], [-1.12, 2.78]]), pat('wood', '#8c5a3e', '#7a4d33', 0.34), { edge: '#6c4229' });
  colinas(p, { atras: ['#26245e', '#201e52'], meio: ['#37347a', '#2d2b6c'] });
  O.lua(c, { x: 0.05, y: 2.26, z: 0.76, s: 0.84 });
  for (const [x, y, s] of [[-0.14, 2.5, 0.09], [-0.2, 2.0, 0.06], [0.28, 2.64, 0.07]]) piece(p.alto(x, y, 0.76), star(5, s, s * 0.45), '#fff0a6', { t: 0.006, edge: '#fff9d6' });
  O.arvore(p.pe(-0.6, 1.48), { s: 0.68, altura: 1.22, copa: '#2c6a72', listra: '#245c64', frutas: null });
  O.arvore(p.pe(0.62, 1.5), { s: 0.64, altura: 1.25, copa: '#493a92', listra: '#3d3082', frutas: null, flip: -1 });
  casaEmCorte(p, 1.62);
  const fogo = O.fogueira(c, { x: 0, y: SOLO + 0.04, z: 2.02, s: 1 });
  const cal = O.caldeirao(c, { x: 0, y: SOLO + 0.14, z: 2.08, s: 0.95 });
  const fum = O.fumaca(c, 5, { x: 0.02, y: SOLO + 0.64, z: 2.11, altura: 0.5, cor: '#fff4f8', s: 0.9 });
  const bento = porco(c, 'bento', { x: -0.68, y: SOLO, z: 2.5, s: 0.78 });
  const pipo = porco(c, 'pipo', { x: 0.7, y: SOLO, z: 2.42, s: 0.7, virado: true });
  const tico = porco(c, 'tico', { x: 0.3, y: SOLO, z: 2.66, s: 0.74, virado: true });
  const tp = p.pe(0, 2.72); piece(tp, rect(2.2, 0.09, 0, 0.045), pat('wood', '#7a4a26', '#663c1c', 0.22), { t: 0.014 });
  poste(p, -1, 2.3, { cor: '#ffb02e' }); poste(p, 1, 2.3, { cor: '#ffb02e', alto: 1.0 });
  // Lobo de cabeça para baixo na boca da chaminé
  const topo = SOLO + 1.72;
  const w = lobo(c, { x: 0.0, y: topo + 0.82, z: 1.7, s: 0.42 }); w.root.rotation.z = Math.PI; w.queixo.rotation.z = -0.14; w.fundoBoca.scale.y = 0.9; w.bracoF.rotation.z = 2.4; w.bracoT.rotation.z = -2.4; w.olho.scale.set(1.1, 1.15, 1);
  // respingos
  const respingos = []; for (let i = 0; i < 12; i++) { const a = -0.45 + i * 0.08; const g = rig(c, 'pingo', { x: a, y: SOLO + 0.68, z: 2.15, s: 0.001 }); piece(g, blob([[0, -0.035], [0.03, 0], [0, 0.05], [-0.03, 0]], 4), '#8ae2e6', { t: 0.006, edge: '#d2f6f7', jitter: 0 }); respingos.push([g, a]); }
  const fumas = []; for (let i = 0; i < 16; i++) { const g = rig(c, 'puf', { x: 0, y: topo + 0.1, z: 1.0 + i * 0.002, s: 0.001 }); piece(g, scallop(0.07, 0.06, 6, 0.16, 0, 0, 5), pat('stripes', '#dcd5ea', '#c6bedb', 0.08), { t: 0.006, edge: '#ffffff', jitter: 0, noShadow: true }); fumas.push(g); }
  const curva = (q) => [ -0.02 + q * q * 0.44 + Math.sin(q * 4) * 0.02, topo + 0.14 + q * 0.88 - q * q * 0.18 ];
  // ação: queda, tchibum, uivo, foguete, e foge pelo céu
  tl.call(() => audio.trilha('moonlight'), 0.01); tl.call(() => audio.tocar('ar', { vol: 1, taxa: 0.55 }), 0.1);
  tl.to(w.root, { y: SOLO + 1.24 }, 0.08, 0.5, ease.in);
  tl.to(w.root, { z: 1.92 }, 0.5, 0.38, ease.linear); tl.to(w.root, { y: SOLO + 0.92 }, 0.56, 0.32, ease.in);
  const CAI = 0.86;
  tl.to(w.root, { s: 0.001 }, CAI, 0.06);
  tl.call(() => { audio.tocar('tchibum', { vol: 1 }); audio.tocar('tchibum2', { vol: 1, taxa: 0.8 }); audio.tocar('caldeirao', { vol: 0.8, dur: 1.4 }); }, CAI);
  tl.pulse(cal.g, { sy: -0.14, rz: 0.04 }, CAI, 0.4); tl.pulse(cal.agua, { sy: 3 }, CAI, 0.4);
  respingos.forEach(([g, a], i) => { const r = 0.32 + (i % 4) * 0.12; tl.to(g, { s: 1 + (i % 3) * 0.3 }, CAI, 0.05); tl.to(g, { x: a * 1.75, rz: a * 3 }, CAI, 0.68, ease.out); tl.to(g, { y: SOLO + 0.68 + r }, CAI, 0.3, ease.out); tl.to(g, { y: SOLO + 0.16 }, CAI + 0.3, 0.4, ease.in); tl.to(g, { s: 0.001 }, CAI + 0.62, 0.1); });
  [pipo, tico, bento].forEach((q, i) => { tl.pulse(q.corpo, { y: 0.19 }, CAI + 0.03 + i * 0.05, 0.42); tl.to(q.bracoD, { rz: 2.5 }, CAI, 0.15, ease.out); tl.to(q.bracoE, { rz: -2.5 }, CAI, 0.15, ease.out); });
  tl.call(() => audio.tocar('uivo1', { vol: 1, taxa: 1.25 }), CAI + 0.62);
  tl.call(() => audio.tocar('uivo2', { vol: 0.9, taxa: 1.5, depois: 0.7 }), CAI + 0.62);
  tl.call(() => { audio.trilha('hyperfun'); audio.tocar('chama', { vol: 1, taxa: 0.8 }); audio.tocar('ar', { vol: 1, taxa: 0.5 }); }, CAI + 0.72); tl.call(() => audio.tocar('chama', { vol: 0.8 }), CAI + 1.02); tl.call(() => audio.tocar('ar', { vol: 0.8, taxa: 0.65 }), CAI + 1.3);
  // sai pelo duto
  const SAI = CAI + 0.72;
  tl.to(w.root, { x: 0, y: topo - 0.15, z: 1.7, rz: 0.2 }, SAI - 0.02, 0.01);
  tl.to(w.root, { s: 0.3 }, SAI, 0.04);
  tl.to(w.chama, { s: 1 }, SAI, 0.12, ease.back);
  tl.to(w.queixo, { rz: -0.3 }, SAI, 0.05); tl.to(w.fundoBoca, { sy: 1 }, SAI, 0.05); tl.to(w.olho, { sx: 1.25, sy: 1.3 }, SAI, 0.05);
  tl.to(w.bracoF, { rz: 2.9 }, SAI, 0.08); tl.to(w.bracoT, { rz: -2.9 }, SAI, 0.08);
  tl.to(w.root, { z: 0.82 }, SAI + 0.3, 0.38, ease.in);
  tl.run((q) => { const [x, y] = curva(q); w.root.position.x = x; w.root.position.y = y; w.root.rotation.z = 0.2 - q * 0.9; w.root.scale.x = w.root.scale.y = q > 0 ? 0.3 * (1 - q * 0.62) : w.root.scale.x; }, SAI + 0.02, 1.25);
  fumas.forEach((g, i) => { const q = i / fumas.length; const [x, y] = curva(q); const t0 = SAI + 0.02 + q * 1.25; tl.to(g, { x: x - 0.04, y, s: 0.9 - q * 0.45 }, t0, 0.03); tl.to(g, { s: 0.001 }, t0 + 0.7, 0.5, ease.in); });
  const FUGA = SAI + 1.3;
  tl.to(w.root, { s: 0.001 }, FUGA, 0.15, ease.in);
  tl.call(() => { audio.tocar('viva', { vol: 0.55, dur: 2.2 }); audio.tocar('risos', { vol: 0.5, dur: 2 }); }, FUGA - 0.3);
  [pipo, tico, bento].forEach((q, i) => { for (let k = 0; k < 4; k++) tl.pulse(q.corpo, { y: 0.15 }, FUGA - 0.25 + k * 0.32 + i * 0.05, 0.32); tl.pulse(q.cabeca, { rz: 0.1 }, FUGA, 1.1, ease.wiggle); });
  return { linha: tl, idle(t) { w.idle(t); bento.idle(t); pipo.idle(t); tico.idle(t); fogo.idle(t, 1.5); fum.idle(t); w.rabo.rotation.z = 0.32 + Math.sin(t * 12) * 0.14; } };
};

// ---- 8. A festa -------------------------------------------------------------------------------------
montadores[7] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.5, 1.7], [0.5, 1.7], [1.1, 2.78], [0.6, 2.96], [0, 3.02], [-0.6, 2.96], [-1.1, 2.78]]), pat('dots', '#f2c88f', '#f7d9ac', 0.2), { edge: '#c79a67' });
  colinas(p, { atras: ['#4a3a92', '#3f3082'], meio: ['#6f4ea8', '#603f98'] });
  const luaP = O.lua(c, { x: -0.09, y: 2.44, z: 0.762, s: 0.62 });
  // casa ampliada, com os dois quartos novos
  const xc = 0, zc = 1.6;
  const casa = O.casaTijolo(c, { x: xc, y: SOLO, z: zc, s: 0.72 }); O.chamine(casa.raiz, { x: 0.32, y: 1.3, z: 0 });
  for (const sx of [-1, 1]) { const g = p.pe(sx * 0.52, zc - 0.04, 0.6); piece(g, rect(0.42, 0.7, 0, 0.35), pat('brick', '#e06a4e', '#f6dcc0', 0.3), { t: 0.012, edge: '#f6dcc0' }); piece(g, poly([-0.3, 0.68], [0.3, 0.68], [0, 1.0]), pat('shingle', '#7a4fc0', '#6a40ae', 0.24), { t: 0.014, z: 0.012, edge: '#d7d2f5' }); piece(g, ellipse(0.09, 0.09, 0, 0.42, 20), '#ffd77a', { t: 0.006, z: 0.012, glow: true }); }
  const zj = zc + 0.05; for (const sx of [-1, 1]) piece(p.alto(xc + sx * 0.3, 0.56, zj + 0.01), ellipse(0.09, 0.09, 0, 0, 22), '#ffd77a', { t: 0.006, glow: true });
  // bandeirinhas e lanternas de parede a parede
  O.bandeirinhas(c, { x: 0, y: 1.92, z: 1.94, largura: 1.56, queda: 0.13 });
  O.bandeirinhas(c, { x: 0, y: 2.08, z: 1.44, largura: 1.14, queda: 0.1, n: 9 });
  const lant = [[-0.4, 1.62, 2.04, '#ff8fb1'], [0, 1.58, 2.06, '#ffd24f'], [0.4, 1.62, 2.04, '#7ad7e0']].map(([x, y, z, cor]) => O.lanterna(c, { x, y, z, cor, fio: 0.12 }));
  // fogueira ao centro, família em roda
  const fogo = O.fogueira(c, { x: 0.02, y: SOLO + 0.02, z: 2.24, s: 0.8 });
  const mae = porco(c, 'mae', { x: 0.7, y: SOLO, z: 2.3, s: 0.84, virado: true });
  // bolo
  const bolo = rig(mae.bracoD, 'bolo', { x: 0.0, y: -0.3, z: 0.02 });
  piece(bolo, rrect(0.34, 0.03, 0.01), '#fff4dc', { t: 0.008 }); piece(bolo, rrect(0.27, 0.11, 0.02, 0, 0.07), pat('stripes', '#ff8fb1', '#ffb3c9', 0.08), { t: 0.01, z: 0.002 }); piece(bolo, rrect(0.19, 0.09, 0.02, 0, 0.17), pat('dots', '#fff4dc', '#ff8fb1', 0.08), { t: 0.01, z: 0.004 }); piece(bolo, flame(0.04, 0.08), '#ffb02e', { t: 0.004, y: 0.22, z: 0.006, glow: true });
  mae.bracoD.rotation.z = 1.2;
  const pipo = porco(c, 'pipo', { x: -0.74, y: SOLO, z: 2.42, s: 0.72 }); const tico = porco(c, 'tico', { x: -0.26, y: SOLO, z: 2.68, s: 0.78 }); const bento = porco(c, 'bento', { x: 0.32, y: SOLO, z: 2.68, s: 0.84, virado: true });
  const flauta = rig(bento.cabeca, 'flauta', { x: 0.12, y: -0.05, z: 0.2 }); piece(flauta, rrect(0.38, 0.032, 0.012, 0.12, -0.03), pat('stripes', '#f4cd5e', '#d9a93f', 0.06), { t: 0.008, jitter: 0 }); bento.bracoD.rotation.z = 2.2; bento.bracoE.rotation.z = -2.2;
  const tp = p.pe(0, 2.72); piece(tp, wave(2.2, 0.12, 0.03, 4, 2), pat('grass', '#7fb56a', '#6fa65c', 0.28), { t: 0.012 });
  poste(p, -1, 2.3, { cor: '#ff8fb1' }); poste(p, 1, 2.3, { cor: '#ffd24f', alto: 1.05 }); trepadeira(p, -1, 1.84, '#ffd24f', { alto: 0.95 }); trepadeira(p, 1, 1.86, '#ff8fb1', { alto: 0.9 });
  // fogos
  const fogos = [];
  [[-0.1, 1.9, 0.7, '#ff7fa8'], [0.16, 2.32, 0.72, '#ffd24f'], [-0.15, 2.5, 0.72, '#7ad7e0'], [0.06, 1.66, 0.62, '#b98cf0']].forEach(([x, y, z, cor], i) => {
    const g = rig(c, 'fogos', { x, y, z, s: 0.001 });
    for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.283; piece(g, poly([Math.cos(a) * 0.03, Math.sin(a) * 0.03], [Math.cos(a + 0.2) * 0.1, Math.sin(a + 0.2) * 0.1], [Math.cos(a) * 0.2, Math.sin(a) * 0.2], [Math.cos(a - 0.2) * 0.1, Math.sin(a - 0.2) * 0.1]), cor, { t: 0.004, glow: true, jitter: 0, z: k * 0.0005 }); }
    piece(g, star(8, 0.05, 0.022), '#fffbe0', { t: 0.004, z: 0.008, glow: true, jitter: 0 });
    fogos.push(g);
  });
  // ação
  tl.call(() => audio.tocar('viva', { vol: 0.75, dur: 3.6 }), 0.05); tl.call(() => audio.tocar('sino', { vol: 0.55 }), 0.1);
  fogos.forEach((g, i) => { for (let k = 0; k < 3; k++) { const t0 = 0.15 + i * 0.42 + k * 1.72; tl.call(() => audio.tocar(i % 2 ? 'fogos' : 'fogos2', { vol: 0.5, taxa: 1.12 - (k % 3) * 0.08 }), t0); tl.to(g, { s: 1.15 + (i % 2) * 0.3 }, t0, 0.32, ease.back); tl.to(g, { rz: g.rotation.z + 0.4 }, t0, 0.8, ease.out); tl.to(g, { s: 0.001 }, t0 + 0.55, 0.3, ease.in); } });
  [pipo, tico, bento, mae].forEach((q, i) => {
    for (let k = 0; k < 11; k++) { const t0 = 0.05 + k * 0.42 + i * 0.05; tl.pulse(q.corpo, { y: 0.13 + (k % 2) * 0.05 }, t0, 0.42); tl.pulse(q.corpo, { rz: (k % 2 ? 1 : -1) * 0.14 }, t0, 0.42); }
  });
  [pipo, tico].forEach((q, i) => { tl.to(q.bracoE, { rz: -2.4 }, 0.1 + i * 0.1, 0.2, ease.back); tl.to(q.bracoD, { rz: 2.4 }, 0.1 + i * 0.1, 0.2, ease.back); for (let k = 0; k < 5; k++) tl.pulse(q.bracoE, { rz: 0.5 }, 0.35 + k * 0.84, 0.84); });
  lant.forEach((g, i) => tl.pulse(g, { rz: 0.26 }, 0.2 + i * 0.1, 4.2, ease.wiggle));
  tl.to(luaP, { y: 2.56 }, 0, 4.6, ease.out);
  return { linha: tl, idle(t) { pipo.idle(t); tico.idle(t); bento.idle(t); mae.idle(t); fogo.idle(t, 1.15); lant.forEach((g, i) => { g.rotation.z = Math.sin(t * 1.3 + i) * 0.05; }); } };
};

// ---- capa: arte renderizada de recortes reais ------------------------------------------------------------
export function arteDaCapa(renderer) {
  const W = 1200, A = 1140; const rt = new THREE.WebGLRenderTarget(W, A, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Scene(); s.background = new THREE.Color('#ffc4c9');
  s.add(new THREE.HemisphereLight('#fff8ee', '#e6c7a6', 2.5));
  const d = new THREE.DirectionalLight('#fff3df', 1.5); d.position.set(-2.2, 3, 5); d.castShadow = true; d.shadow.mapSize.set(2048, 2048); Object.assign(d.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 12 }); d.shadow.bias = -0.0006; d.shadow.radius = 5; s.add(d);
  const g = new THREE.Group(); s.add(g);
  const cor = [['#5fc6e8', '#79d0ec', 1.9], ['#a7e6ea', '#bcedef', 1.42], ['#ffe6c0', '#fff0d6', 0.98], ['#ffc2c6', '#ffd3d5', 0.6]];
  cor.forEach(([a, b, y], i) => piece(g, wave(5, y + 1.1, 0.05, 2, i * 1.8), pat('stripes', a, b, 0.28), { y: -1.2, z: i * 0.02, t: 0.012, edge: '#ffffff' }));
  O.solDePapel(g, { x: -0.82, y: 1.28, z: 0.12, s: 0.95 }); O.nuvem(g, { x: 0.74, y: 1.42, z: 0.12, s: 0.92 }); O.nuvem(g, { x: -0.1, y: 0.92, z: 0.13, s: 0.6 });
  piece(g, hill(4.6, 1.1, 0.2), pat('stripes', '#8ed27a', '#7bc369', 0.32), { x: 0.2, y: -1.0, z: 0.15, t: 0.012 });
  const casa = O.casaTijolo(g, { x: 0.46, y: -0.82, z: 0.2, s: 0.95 }); O.chamine(casa.raiz, { x: 0.3, y: 1.3, z: 0 });
  const zj = 0.27; for (const [t, x] of [['pipo', 0.04], ['tico', 0.88]]) { porcoNaJanela(g, t, { x, y: -0.08 - 0.02, z: zj, s: 0.42 }); O.molduraJanela(g, { x, y: -0.08, z: zj + 0.065, r: 0.135, cor: '#e9c79c', sombra: '#a0623a' }); }
  O.arvore(g, { x: 1.5, y: -1.0, z: 0.21, s: 1.1, altura: 1.3, copa: '#ff8fb1', listra: '#f4769d', frutas: '#fff4dc', estampa: 'dots', flip: -1 });
  piece(g, wave(5, 0.5, 0.05, 3, 1), pat('grass', '#a8dc62', '#92cb50', 0.4), { y: -1.42, z: 0.34, t: 0.012 });
  const w = loboBase(g, { x: -0.86, y: -1.14, z: 0.4, s: 1.32 }); w.rabo.rotation.z = 0.7; w.peito.scale.set(1.18, 1.13, 1); w.bochecha.scale.setScalar(1); w.cabeca.rotation.z = 0.08; w.bracoF.rotation.z = 0.9;
  for (const [x, st] of [[-0.05, 0], [0.14, 2], [0.32, 4]]) { const a = group(g, { x, y: 0.1 + st * 0.03, z: 0.42 }); piece(a, stroke([[-0.16, 0], [0, 0.03], [0.16, 0]], 0.028, { taper: 0.75 }), '#fff8ee', { t: 0.004, edge: '#fff', jitter: 0 }); }
  piece(g, wave(5, 0.27, 0.03, 4, 0.5), pat('grass', '#6cc05a', '#57ab4b', 0.28), { y: -1.42, z: 0.48, t: 0.012 });
  for (const [x, c2] of [[-1.5, '#ffd24f'], [0.22, '#ffffff'], [0.82, '#ff7fa8'], [1.5, '#ffd24f']]) O.flor(g, { x, y: -1.28, z: 0.5, cor: c2, altura: 0.2, s: 1.1 });
  g.traverse((o) => { if (o.isMesh) { o.castShadow = o.castShadow; o.receiveShadow = true; } });
  const cam = new THREE.OrthographicCamera(-1.75, 1.75, 1.66, -1.66, 0.1, 20); cam.position.set(0, 0, 8); cam.lookAt(0, 0, 0);
  const antes = renderer.getRenderTarget(); renderer.setRenderTarget(rt); renderer.render(s, cam);
  const px = new Uint8Array(W * A * 4); renderer.readRenderTargetPixels(rt, 0, 0, W, A, px); renderer.setRenderTarget(antes);
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = A; const ctx = canvas.getContext('2d'); const img = ctx.createImageData(W, A);
  for (let y = 0; y < A; y++) { const a = y * W * 4, b = (A - 1 - y) * W * 4; img.data.set(px.subarray(a, a + W * 4), b); }
  ctx.putImageData(img, 0, 0);
  rt.dispose(); d.shadow.map?.dispose();
  return canvas;
}

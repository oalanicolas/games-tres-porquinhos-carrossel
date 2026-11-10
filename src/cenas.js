// As cenas e a capa. Cada cena devolve { linha, idle }: a linha é a ação do papel; idle é a vida em repouso.
import * as THREE from 'three';
import { piece, rig, group, ellipse, rect, rrect, blob, stroke, poly, pat, star, hill, wave, flame, heart, shade, scallop } from './paper.js';
import { Timeline } from './tween.js';
import { H } from './book.js';
import { palco, sopro, revoada, ease, SOLO, meiaLargura, ventoInterativo } from './palco.js';
import { porco as porcoBase, porcoNaJanela, lobo as loboBase } from './personagens.js';
import * as O from './objetos.js';
import { CENAS } from './story.js';

// Personagens menores e um pouco recuados: a cena respira e o cenário fica à vista.
const ESC_P = 0.74, ESC_L = 0.76;
const recua = (z = 0) => (z > 2.3 ? 2.3 + (z - 2.3) * 0.5 : z);
const porco = (pai, tipo, o = {}) => porcoBase(pai, tipo, { ...o, s: (o.s ?? 1) * ESC_P, z: recua(o.z) });
const lobo = (pai, o = {}) => loboBase(pai, { ...o, s: (o.s ?? 1) * ESC_L, z: recua(o.z) });
const montadores = {};
// Altura livre sob o texto da página esquerda: o cenário colado nessa parede não passa na frente da história.
let livreEsq = Infinity;
export function montarCenas(livro, audio) {
  somDaCena = audio;
  return livro.cunhas.map((c) => {
    livreEsq = (1 - livro.fimTexto[c.j] / 1276) * H - 0.09;
    const cena = montadores[CENAS[c.j].id](palco(c.conteudo), audio);
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
  if (lado === -1) alto = Math.min(alto, livreEsq - 0.14);
  const g = p.parede(lado, r, y);
  piece(g, stroke([[0, 0], [0.02, alto * 0.35], [-0.02, alto * 0.7], [0.01, alto]], 0.032), '#3f9f55', { t: 0.008 });
  const n = Math.round(alto / 0.2);
  for (let i = 0; i < n; i++) { const yy = 0.2 + i * 0.19, sg = i % 2 ? 1 : -1; piece(g, blob([[0, yy], [sg * 0.12, yy + 0.07], [sg * 0.16, yy + 0.02], [sg * 0.07, yy - 0.04]], 4), '#5cc06a', { t: 0.006, z: 0.003 }); }
  for (const [px, py] of [[0, alto + 0.05], [0.1, alto * 0.76], [-0.1, alto * 0.54]]) { piece(g, star(6, 0.085, 0.052, px, py), cor, { t: 0.008, z: 0.008 }); piece(g, ellipse(0.028, 0.028, px, py, 10), '#ffd24f', { t: 0.004, z: 0.014, jitter: 0 }); }
}
function poste(p, lado, r, { alto = 1.1, cor = '#ffb02e' } = {}) {
  if (lado === -1) alto = Math.min(alto, livreEsq);
  const g = p.parede(lado, r, 0.05);
  piece(g, rrect(0.045, alto, 0.008, 0, alto / 2), pat('wood', '#7a4a26', '#663c1c', 0.16), { t: 0.01 });
  piece(g, stroke([[0, alto - 0.02], [lado * -0.16, alto], [lado * -0.18, alto - 0.06]], 0.024), '#3d2c55', { t: 0.006, z: 0.006, jitter: 0 });
  O.lanterna(g, { x: lado * -0.18, y: alto - 0.26, z: 0.012, s: 1, cor, fio: 0.2 });
}
/** Escala de um rig preservando o lado para onde ele olha. */
const tam = (q, v) => ({ sx: Math.sign(q.root.scale.x) * v, sy: v, sz: v });
/** Escondido até a história chamar. Devolve a escala que ele terá em cena. */
function escondido(q) { const v = q.root.scale.y; q.root.scale.set(Math.sign(q.root.scale.x) * 0.001, 0.001, 0.001); return v; }
// Os gestos de andar valem para todos os atores e em todas as cenas: o som deles vem daqui, sem passar o áudio em cada chamada.
let somDaCena = null;
/** Passos: pernas e corpo. Serve a porquinhos (pernaE/pernaD) e ao Lobo (pernaF/pernaT). */
function passos(tl, q, t, dur, { n = Math.max(2, Math.round(dur / 0.2)), salto = 0.05, perna = 0.42 } = {}) {
  const [a, b] = q.pernaF ? [q.pernaF, q.pernaT] : [q.pernaE, q.pernaD];
  const d = dur / n; const peso = q.pernaF ? 1 : 0.15;
  for (let k = 0; k < n; k++) {
    tl.pulse(a, { rz: perna }, t + k * d, d); tl.pulse(b, { rz: -perna }, t + k * d + d * 0.15, d * 0.85); tl.pulse(q.corpo, { y: salto }, t + k * d, d);
    tl.call(() => somDaCena?.passo({ peso, x: q.root.position.x }), t + k * d + d * 0.1);
  }
}
/** Entra em cena pela borda da página, já andando até (x, z). */
function entra(tl, q, v, { x, z, de = 0.24 }, t, dur, sinal = 1) {
  q.root.position.x = x - sinal * de;
  tl.to(q.root, tam(q, v), t, dur * 0.4, ease.out);
  tl.to(q.root, z == null ? { x } : { x, z }, t, dur, ease.out);
  passos(tl, q, t, dur);
}
/** Porquinho anda até a porta e some no vão escuro. */
function entraNaPorta(tl, q, porta, t, dur = 0.5) {
  tl.to(q.root, { x: porta.x, z: porta.z }, t, dur * 0.7, ease.inOut);
  passos(tl, q, t, dur * 0.7, { n: 3 });
  tl.to(q.root, tam(q, 0.001), t + dur * 0.6, dur * 0.4, ease.in);
}
function abrePorta(tl, porta, largura, t, dur = 0.24) { tl.to(porta, { sx: 0.1, x: -largura * 0.92 }, t, dur, ease.out); }
function fechaPorta(tl, porta, t, dur = 0.2) { tl.to(porta, { sx: 1, x: 0 }, t, dur, ease.in); }
/** Cabeça que sobe na janela, de dentro. */
function surgeNaJanela(tl, q, t, v) { tl.to(q.root, { s: v }, t, 0.26, ease.back); tl.pulse(q.cabeca, { rz: 0.12 }, t + 0.1, 0.5, ease.wiggle); tl.call(() => somDaCena?.tocar('porco', { vol: 0.32, taxa: 1.1 + Math.random() * 0.3 }), t + 0.08); }
/** O Lobo chega pela borda e fica de pé em x0. */
function loboChega(tl, w, x0, v, audio, t = 0) {
  tl.grupo('chega');
  entra(tl, w, v, { x: x0, de: 0.22 }, t, 1.0);
  tl.call(() => audio.tocar('uivo2', { vol: 0.35, taxa: 1.3, dur: 2.4, pan: -0.5 }), t + 0.2);
}
/** Vai até a porta, bate três vezes e volta para o seu lugar. */
function loboBate(tl, w, x0, alvo, audio, somTaxa = 1.25, t = 0) {
  tl.grupo('bate');
  const z0 = w.root.position.z;
  tl.to(w.root, { x: alvo.x, z: alvo.z }, t, 0.42, ease.inOut); passos(tl, w, t, 0.42, { n: 3 });
  for (let k = 0; k < 3; k++) {
    tl.pulse(w.bracoF, { rz: 0.8 }, t + 0.44 + k * 0.25, 0.25);
    tl.call(() => audio.tocar(k % 2 ? 'bate2' : 'bate1', { vol: 0.62, taxa: somTaxa, dur: 0.3, pan: alvo.x * 0.9 }), t + 0.54 + k * 0.25);
  }
  tl.to(w.root, { x: x0, z: z0 }, t + 1.3, 0.4, ease.inOut); passos(tl, w, t + 1.3, 0.4, { n: 3 });
}
/** Depois de derrubar a casa, o Lobo sai atrás do porquinho, pela mesma borda. */
function loboVaiAtras(tl, w, v, t) {
  tl.to(w.fundoBoca, { sy: 0.35 }, t, 0.1); tl.to(w.queixo, { rz: 0 }, t, 0.1);
  tl.to(w.root, { x: 0.95 }, t, 0.9, ease.inOut); passos(tl, w, t, 0.9, { n: 5, salto: 0.04 }); // até a borda, para não sumir no meio da página
  tl.to(w.root, tam(w, 0.001), t + 0.74, 0.16, ease.in);
}
/** Três janelas de Bento: duas na parede e a terceira no alto, na empena. Tudo em coordenadas de mundo. */
function janelasDeBento(c, { x, zc, s, casa, surgem = false }) {
  const k = s / 0.9; const cor = '#e9c79c'; const sombra = '#a0623a';
  const z0 = zc + 0.08 * k; const zEmpena = frenteZ(c, casa.telhado) + 0.008; // a da empena fica à frente das telhas, senão o fundo aceso some atrás delas
  const pontos = [[x - 0.4 * s, SOLO + 0.68 * s, z0], [x + 0.4 * s, SOLO + 0.68 * s, z0], [x, SOLO + 1.27 * s, zEmpena]];
  const grupos = [];
  for (const [px, py, z] of pontos) {
    const j = surgem ? rig(c, 'janela', { x: px, y: py, z }) : group(c, { x: px, y: py, z }); grupos.push(j);
    piece(group(j, { z: -0.006, s: k }), ellipse(0.135, 0.135, 0, 0, 30), '#ffcf7a', { t: 0.004, glow: true, edge: '#f2b65e', jitter: 0 });
    O.molduraJanela(j, { z: 0.065 * k, r: 0.135 * k, cor, sombra });
    const fl = group(j, { y: -0.18 * k, z: 0.08 * k, s: k });
    piece(fl, rrect(0.36, 0.07, 0.01), pat('wood', '#a0623a', '#8a5230', 0.14), { t: 0.012 });
    for (let i = 0; i < 3; i++) piece(fl, star(5, 0.04, 0.024, -0.1 + i * 0.1, 0.05), ['#ff7fa8', '#ffd24f', '#fff'][i], { t: 0.005, z: 0.008, jitter: 0 });
    if (surgem) j.scale.setScalar(0.001);
  }
  const rosto = (tipo, i) => { const [px, py, z] = pontos[i]; return porcoNaJanela(c, tipo, { x: px, y: py - 0.03 * k, z, s: 0.42 * k }); };
  return { pontos, k, rosto, grupos };
}
/** O z mais à frente de um objeto, nas coordenadas do conteúdo da cena. */
function frenteZ(conteudo, obj) {
  conteudo.updateWorldMatrix(true, true);
  const inv = conteudo.matrixWorld.clone().invert(); const m = new THREE.Matrix4(); const v = new THREE.Vector3(); let z = -Infinity;
  obj.traverse((o) => {
    const pos = o.isMesh ? o.geometry.attributes.position : null; if (!pos) return;
    m.multiplyMatrices(inv, o.matrixWorld);
    for (let i = 0; i < pos.count; i++) z = Math.max(z, v.fromBufferAttribute(pos, i).applyMatrix4(m).z);
  });
  return z;
}
/** Encher o peito e soprar: serve às três casas. */
function encherESoprar(tl, w, t0, enche, audio, x0, { gola = 1, grupos = ['encher', 'sopro'] } = {}) {
  const S = t0 + enche;
  tl.grupo(grupos[0]);
  tl.to(w.peito, { sx: 1 + 0.26 * gola, sy: 1 + 0.2 * gola }, t0, enche, ease.inOut);
  tl.to(w.cabeca, { rz: 0.2, y: 0.91 }, t0, enche, ease.inOut);
  tl.to(w.bochecha, { s: 1 }, t0 + enche * 0.35, enche * 0.65, ease.back);
  tl.to(w.bracoF, { rz: 1.0 }, t0, enche, ease.inOut); tl.to(w.bracoT, { rz: -1.0 }, t0, enche, ease.inOut);
  tl.call(() => { audio.tocar('inspira', { vol: 1, taxa: 0.72, pan: -0.45 }); audio.tocar('puxa', { vol: Math.min(1, enche * 0.8), taxa: 1.1 / Math.max(enche, 0.6), pan: -0.45 }); }, t0 + 0.08);
  tl.grupo(grupos[1]);
  tl.call(() => { audio.tocar('sopro', { vol: 1, dur: 1.9, pan: [-0.5, 0.5] }); audio.tocar('sopro2', { vol: 0.7, taxa: 0.8, pan: [-0.4, 0.4] }); audio.tocar('vento', { vol: 0.7, dur: 1.7, pan: [-0.3, 0.5] }); audio.tocar('ar', { vol: 0.8, taxa: 0.42, pan: -0.45 }); }, S);
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
montadores.partida = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.05, 1.1], [0.05, 1.1], [0.28, 1.7], [0.1, 2.3], [0.42, 2.98], [-0.3, 2.98], [-0.34, 2.3], [-0.1, 1.7]]), pat('stripes', '#f7e3b4', '#f0d69b', 0.2), { edge: '#d9c18a' });
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
  tl.grupo('tchau');
  tl.call(() => audio.tocar('grunhido', { vol: 0.8 }), 0.05); tl.call(() => audio.tocar('melro', { vol: 0.55 }), 0.35);
  for (let k = 0; k < 4; k++) tl.pulse(mae.bracoD, { rz: 0.5 }, k * 0.42, 0.42);
  tl.pulse(mae.cabeca, { rz: 0.12 }, 0, 1.68, ease.wiggle);
  [pipo, tico, bento].forEach((q, i) => {
    tl.to(q.bracoE, { rz: -2.3 }, 0.1 + i * 0.1, 0.25, ease.back);
    for (let k = 0; k < 3; k++) { tl.pulse(q.bracoE, { rz: 0.5 }, 0.35 + i * 0.1 + k * 0.32, 0.32); tl.pulse(q.corpo, { y: 0.13 }, 0.2 + i * 0.12 + k * 0.34, 0.34); }
    tl.to(q.bracoE, { rz: -0.2 }, 1.55 + i * 0.1, 0.25);
    // pegam a estrada e saem da página, Bento na frente: "lá se foram" não deixa ninguém para trás
    tl.grupo('estrada');
    const sai = 1.7 + (2 - i) * 0.3; const anda = 0.9 + (0.9 - q.root.position.x) * 0.72;
    tl.to(q.root, { x: 0.9, z: 2.7 }, sai, anda, ease.inOut); passos(tl, q, sai, anda, { n: Math.round(anda / 0.24), salto: 0.045, perna: 0.32 });
    tl.to(q.root, tam(q, 0.001), sai + anda - 0.18, 0.18, ease.in);
    tl.grupo('tchau');
  });
  tl.call(() => audio.tocar('sino', { vol: 0.45, dur: 2.4 }), 1.4);
  tl.grupo('estrada'); tl.pulse(pl.t, { rz: 0.16 }, 1.7, 1.2, ease.wiggle);
  tl.grupo('era'); tl.to(so.g, { y: 2.42 }, 0, 3.0, ease.out);
  tl.grupo('mae-diz', { soVoz: true }); tl.pulse(mae.corpo, { y: 0.1 }, 0, 0.4); tl.pulse(mae.bracoE, { rz: -0.5 }, 0, 0.7);
  [['pipo-nome', pipo, 1.2], ['tico-nome', tico, 1.38], ['bento-nome', bento, 1]].forEach(([g, q, altura]) => { tl.grupo(g, { soVoz: true }); tl.call(() => audio.tocar('porco', { vol: 0.42, taxa: altura, pan: q.root.position.x * 0.9, varia: 0 }), 0.04); tl.pulse(q.corpo, { y: 0.14 }, 0, 0.36); tl.pulse(q.cabeca, { rz: 0.16 }, 0, 0.36); });
  tl.grupo('base');
  return { linha: tl, atores: { mae, pipo, tico, bento }, provas: { irmaos: [pipo, tico, bento] }, idle(t) { mae.idle(t); pipo.idle(t); tico.idle(t); bento.idle(t); fum.idle(t); so.raios.rotation.z = t * 0.1; } };
};

// ---- 6. A casa de palha ----------------------------------------------------------------------------
montadores.palha = (p, audio) => {
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
  const x0 = -0.58; const w = lobo(c, { x: x0, y: SOLO, z: 2.6, s: 0.76 }); w.rabo.rotation.z = 0.8; const vL = escondido(w);
  const pl = p.parede(-1, 2.2, 0.05); piece(pl, rrect(0.06, 0.9, 0.01, 0, 0.45), pat('wood', '#a0623a', '#8a5230', 0.18), { t: 0.01 }); piece(pl, poly([-0.28, 0.72], [0.24, 0.72], [0.36, 0.82], [0.24, 0.92], [-0.28, 0.92]), pat('wood', '#e7a95c', '#cf9147', 0.18), { t: 0.01, z: 0.01 });
  trepadeira(p, 1, 2.42, '#ff8fb1', { alto: 1.35 });
  // ação: chega, vai até a porta, bate, volta e sopra
  loboChega(tl, w, x0, vL, audio, 0); tl.call(() => audio.tocar('corvo', { vol: 0.34, pan: 0.45 }), 0.02); loboBate(tl, w, x0, { x: xc - 0.34, z: zc + 0.26 }, audio, 1.25, 1.05);
  const S = encherESoprar(tl, w, 2.9, 0.95, audio, x0);
  const mx = x0 + 0.54 * 0.76 * ESC_L, my = SOLO + 0.92 * 0.76 * ESC_L;
  sopro(c, tl, S, 1.25, { x: mx, y: my, z: 2.5, alvoX: 0.8, alvoY: my + 0.22, alvoZ: 2.12, n: 13 });
  casa.telhado.forEach((g, i) => voar(tl, g, i + 3, S + 0.1 + (casa.telhado.length - i) * 0.04));
  casa.partes.forEach((g, i) => voar(tl, g, i, S + 0.32 + i * 0.05));
  tl.call(() => { audio.tocar('palha', { vol: 1 }); audio.tocar('pano', { vol: 0.8 }); }, S + 0.15); tl.call(() => audio.tocar('palha2', { vol: 1 }), S + 0.55);
  revoada(c, tl, S + 0.15, 26, PALHA, { x: xc, y: 0.9, z: 2.14, dx: 0.8, alto: 0.9, espalha: 0.7, seed: 8 });
  tl.to(casa.vao, { sy: 0.001 }, S + 0.42, 0.28, ease.in); // o fundo vai com a palha: a voz segura a fuga até "correu", e ele não pode ficar sozinho até lá
  tl.grupo('foge'); tl.call(() => audio.tocar('guincho', { vol: 0.85 }), S + 0.35);
  voar(tl, mj, 2, S + 0.3);
  fugir(tl, pipo, S + 0.38);
  tl.grupo('calma'); acalmar(tl, w, S + 1.55, x0);
  tl.call(() => audio.tocar('uivo1', { vol: 0.35, dur: 3.6, pan: -0.5 }), S + 1.6);
  tl.grupo('atras'); loboVaiAtras(tl, w, vL, S + 1.95); // "foi atrás", na página seguinte: ele sai pela mesma borda que Pipo
  tl.grupo('base');
  return { linha: tl, vento: ventoInterativo(c, w.fundoBoca, casa.raiz), atores: { lobo: w, pipo }, provas: { casa: casa.raiz, porta: xc, vao: casa.vao }, idle(t) { w.idle(t); w.rabo.rotation.z = 0.8 + Math.sin(t * 2.2) * 0.06; pipo.idle(t); so.raios.rotation.z = t * 0.1; } };
};

// ---- 8. A casa de madeira ---------------------------------------------------------------------------
montadores.madeira = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.34, 1.75], [0.06, 1.75], [0.24, 2.3], [0.34, 3.02], [-0.44, 3.02], [-0.2, 2.3]]), pat('stripes', '#f0cd8b', '#e8c076', 0.2), { edge: '#c9a764' });
  colinas(p, { atras: ['#b69a5a', '#a48a4d'], meio: ['#cdbb5a', '#bcaa4a'] });
  const so = O.solDePapel(c, { x: 0.06, y: 2.28, z: 0.74, s: 0.72, cor: '#ffbe3c', raio: '#f58a2e' });
  O.nuvem(c, { x: -0.16, y: 2.48, z: 0.7, s: 0.46, listra: '#ffdcc4' }); O.nuvem(c, { x: 0.2, y: 1.8, z: 0.78, s: 0.38, listra: '#ffdcc4' });
  O.arvore(p.pe(-0.54, 1.46), { s: 0.84, altura: 1.5, copa: '#d9702e', listra: '#c46024', frutas: '#ffd24f' });
  O.arvore(p.pe(0.54, 1.5), { s: 0.77, altura: 1.35, copa: '#e8a93a', listra: '#d59729', frutas: '#e84a5f', flip: -1 });
  O.arvore(p.pe(0.76, 2.3), { s: 0.6, altura: 1.5, copa: '#f4c04f', listra: '#e4ad3d', frutas: '#e84a5f', flip: -1 }); // a árvore da flauta de Lulu
  const xc = 0.05, zc = 1.8;
  const casa = O.casaMadeira(c, { x: xc, y: SOLO, z: zc, s: 0.95 });
  casa.ripas.push(...tabuasDeLulu(casa)); // a torta e a que sobrou, da página da obra: voam com o resto
  const zj = zc + 0.08;
  // a janela de Pipo fica vazia até ele chegar
  const fundo = rig(c, 'fundo-janela', { x: xc + 0.31, y: 0.61, z: zj - 0.006 }); piece(fundo, ellipse(0.135, 0.135, 0, 0, 28), '#452a22', { t: 0.004, edge: '#452a22', jitter: 0 });
  const pipo = porcoNaJanela(c, 'pipo', { x: xc + 0.31, y: 0.58, z: zj, s: 0.44 }); escondido(pipo);
  const tico = porcoNaJanela(c, 'tico', { x: xc - 0.33, y: 0.58, z: zj, s: 0.44 });
  const mj1 = O.molduraJanela(c, { x: xc + 0.31, y: 0.61, z: zj + 0.065, r: 0.135, cor: '#7a4a26', sombra: '#54301a' });
  const mj2 = O.molduraJanela(c, { x: xc - 0.33, y: 0.61, z: zj + 0.065, r: 0.135, cor: '#7a4a26', sombra: '#54301a' });
  O.arbusto(p.pe(0.8, 2.34), { s: 0.95, cor: '#8aa83f', listra: '#7a9733', flor: '#ffd24f' });
  O.cogumelo(p.pe(0.6, 2.42), { cor: '#8f5fd8' }); O.flor(p.pe(0.92, 2.6), { cor: '#fff', altura: 0.22 });
  primeiroPlano(p, ['#a9b84a', '#98a83d'], ['#ffd24f', '#f58a2e', '#fff']);
  const x0 = -0.58; const w = lobo(c, { x: x0, y: SOLO, z: 2.6, s: 0.76 }); w.rabo.rotation.z = 0.8; const vL = escondido(w);
  const corre = porco(c, 'pipo', { x: -0.22, y: SOLO, z: 2.3, s: 0.84 }); const vP = escondido(corre);
  poste(p, -1, 2.26, { cor: '#ffb02e' }); trepadeira(p, 1, 2.42, '#ffb02e', { alto: 1.2 });
  const mx = x0 + 0.54 * 0.76 * ESC_L, my = SOLO + 0.92 * 0.76 * ESC_L;
  // Pipo chega da borda por onde saiu da página anterior; Tico abre, e os dois se trancam
  tl.grupo('pipo-chega');
  entra(tl, corre, vP, { x: -0.22, de: 0.66 }, 0, 1.0);
  tl.call(() => audio.tocar('guincho', { vol: 0.6, taxa: 1.1 }), 0.1);
  tl.pulse(tico.cabeca, { rz: 0.16 }, 0.4, 0.6, ease.wiggle);
  tl.grupo('entra');
  abrePorta(tl, casa.porta, 0.16, 1.05); tl.call(() => audio.tocar('range', { vol: 0.7, taxa: 1.15 }), 1.05);
  entraNaPorta(tl, corre, { x: xc, z: zc + 0.1 }, 1.15, 0.5);
  fechaPorta(tl, casa.porta, 1.7); tl.call(() => audio.tocar('porta', { vol: 0.75 }), 1.88);
  surgeNaJanela(tl, pipo, 1.95, 0.44);
  loboChega(tl, w, x0, vL, audio, 2.4);
  loboBate(tl, w, x0, { x: xc - 0.36, z: zc + 0.24 }, audio, 1.25, 3.45);
  // primeira soprada: range
  const S1 = encherESoprar(tl, w, 5.3, 0.72, audio, x0, { grupos: ['encher1', 'sopro1'] });
  sopro(c, tl, S1, 0.75, { x: mx, y: my, z: 2.5, alvoX: 0.8, alvoY: my + 0.2, alvoZ: 2.12, n: 8, seed: 11 });
  tl.call(() => audio.tocar('range', { vol: 1 }), S1 + 0.1); tl.call(() => audio.tocar('range2', { vol: 1 }), S1 + 0.3); tl.call(() => audio.tocar('range', { vol: 1, taxa: 0.65 }), S1 + 0.55);
  casa.tabuas.forEach((g, i) => tl.pulse(g, { rz: -0.1 - (i % 3) * 0.04 }, S1 + 0.04 * i, 0.55));
  casa.ripas.forEach((g, i) => tl.pulse(g, { y: 0.05 }, S1 + 0.03 * i, 0.45));
  tl.grupo('calma1'); acalmar(tl, w, S1 + 0.85, x0);
  // segunda: desaba
  const T2 = S1 + 1.05;
  tl.grupo('encher2');
  tl.to(w.fundoBoca, { sy: 0.35 }, T2 - 0.05, 0.01);
  const S2 = encherESoprar(tl, w, T2, 0.62, audio, x0, { grupos: ['encher2', 'sopro2'] });
  sopro(c, tl, S2, 1.0, { x: mx, y: my, z: 2.5, alvoX: 0.8, alvoY: my + 0.22, alvoZ: 2.12, n: 13, seed: 12 });
  casa.ripas.forEach((g, i) => voar(tl, g, i, S2 + 0.08 + i * 0.03, 0.9));
  casa.tabuas.forEach((g, i) => {
    const q = S2 + 0.2 + i * 0.045; const sentido = i % 2 ? -1 : -0.75;
    tl.to(g, { rz: sentido * 1.5 }, q, 0.55, ease.bounce); tl.to(g, { x: g.position.x + 0.32 + i * 0.015, y: 0.0 }, q, 0.55, ease.in); tl.to(g, { z: g.position.z + 0.04 + i * 0.008 }, q, 0.55, ease.linear);
  });
  tl.to(casa.vao, { sy: 0.001 }, S2 + 0.34, 0.3, ease.in);
  tl.to(fundo, { s: 0.001 }, S2 + 0.2, 0.2, ease.in);
  tl.call(() => audio.tocar('desaba', { vol: 1 }), S2 + 0.3); tl.call(() => audio.tocar('tabuas', { vol: 1 }), S2 + 0.5);
  revoada(c, tl, S2 + 0.25, 16, LASCA, { x: xc, y: 0.7, z: 2.14, dx: 0.72, alto: 0.72, espalha: 0.7, seed: 18 });
  // molduras e porquinhos saem correndo
  tl.grupo('foge'); tl.call(() => audio.tocar('guincho', { vol: 0.9 }), S2 + 0.35); tl.call(() => audio.tocar('guincho', { vol: 0.8, taxa: 1.12 }), S2 + 0.6);
  [mj1, mj2].forEach((m, i) => { m.userData.rig = true; tl.to(m, { x: m.position.x + 0.7 + i * 0.22, y: 0.15 }, S2 + 0.2, 0.55, ease.in); tl.to(m, { rz: -2 }, S2 + 0.2, 0.55, ease.linear); tl.to(m, { s: 0.001 }, S2 + 0.65, 0.15, ease.in); });
  [pipo, tico].forEach((q, i) => fugir(tl, q, S2 + 0.34 + i * 0.1));
  tl.grupo('calma2'); acalmar(tl, w, S2 + 1.35, x0);
  tl.call(() => audio.tocar('uivo3', { vol: 0.35, dur: 3.2, pan: -0.5 }), S2 + 1.45);
  loboVaiAtras(tl, w, vL, S2 + 1.75);
  tl.grupo('base');
  return { linha: tl, vento: ventoInterativo(c, w.fundoBoca, casa.raiz), atores: { lobo: w, pipo, tico }, provas: { casa: casa.raiz, corredor: corre, porta: xc }, idle(t) { w.idle(t); w.rabo.rotation.z = 0.8 + Math.sin(t * 2.2) * 0.06; pipo.idle(t); tico.idle(t); corre.idle(t); so.raios.rotation.z = t * 0.08; } };
};

// ---- 10. A casa de tijolos ---------------------------------------------------------------------------
const CASA_BENTO = { x: 0.04, zc: 1.74, s: 0.9 };
/** A casa de Bento nas páginas 5 e 6: mesma posição, mesmas três janelas, mesma chaminé. */
function casaDeBento(c) {
  const { x, zc, s } = CASA_BENTO;
  const casa = O.casaTijolo(c, { x, y: SOLO, z: zc, s });
  O.chamine(casa.raiz, { x: 0.3, y: 1.3, z: 0.0 });
  const fum = O.fumaca(c, 6, { x: x + 0.27, y: 1.6, z: zc + 0.01, altura: 0.8 });
  return { casa, fum, jan: janelasDeBento(c, { x, zc, s, casa }) };
}
montadores.tijolo = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.2, 1.8], [0.3, 1.8], [0.34, 2.3], [0.36, 2.92], [-0.56, 2.92], [-0.3, 2.3]]), pat('stripes', '#f6d7c2', '#f0c9ad', 0.2), { edge: '#cda38a' });
  colinas(p, { atras: ['#8c70b8', '#7c60aa'], meio: ['#b986ad', '#a9769d'] });
  const so = O.solDePapel(c, { x: 0.02, y: 1.72, z: 0.742, s: 0.84, cor: '#ffcf52', raio: '#ff7e5c' });
  O.nuvem(c, { x: -0.18, y: 2.42, z: 0.72, s: 0.44, cor: '#ffe3ea', listra: '#ffc7d6' }); O.nuvem(c, { x: 0.16, y: 2.58, z: 0.72, s: 0.38, cor: '#ffe3ea', listra: '#ffc7d6' });
  O.arvore(p.pe(-0.54, 1.44), { s: 0.84, altura: 1.55, copa: '#8c4fc0', listra: '#7c40b0', frutas: '#ffd24f', estampa: 'dots' });
  O.arvore(p.pe(0.56, 1.48), { s: 0.74, altura: 1.28, copa: '#e0568e', listra: '#d0467e', frutas: '#fff4dc', flip: -1 });
  const { casa, fum, jan } = casaDeBento(c); const xc = CASA_BENTO.x, zc = CASA_BENTO.zc;
  const k = jan.k; const vJ = 0.42 * k;
  const j1 = jan.rosto('pipo', 0), j2 = jan.rosto('tico', 1), j3 = jan.rosto('bento', 2);
  [j1, j2, j3].forEach(escondido);
  // Bento à porta; os irmãos chegam correndo pela borda
  const porta = { x: xc, z: zc + 0.1 };
  const bento = porco(c, 'bento', { x: xc + 0.3, y: SOLO, z: 2.16, s: 0.82, virado: true });
  const pipo = porco(c, 'pipo', { x: -0.2, y: SOLO, z: 2.26, s: 0.8 }); const vP = escondido(pipo);
  const tico = porco(c, 'tico', { x: -0.5, y: SOLO, z: 2.4, s: 0.84 }); const vT = escondido(tico);
  O.arbusto(p.pe(0.92, 2.34), { s: 0.78, cor: '#5e9c70', listra: '#4e8c60', flor: '#ff7fa8' });
  const flores = []; for (const [x, cor] of [[-0.3, '#fff'], [-0.12, '#ffd24f'], [0.06, '#ff7fa8']]) { const r = p.rig(x, 2.42, 'flor'); O.flor(r, { cor, altura: 0.26 }); flores.push(r); }
  primeiroPlano(p, ['#7fae6a', '#6f9e5a'], ['#ffd24f', '#ff7fa8', '#fff']);
  const x0 = -0.68; const w = lobo(c, { x: x0, y: SOLO, z: 2.6, s: 0.76 }); w.rabo.rotation.z = 1.35; const vL = escondido(w);
  poste(p, -1, 2.26, { cor: '#ff8fb1' }); trepadeira(p, 1, 2.46, '#ff8fb1', { alto: 1.15 });
  const mx = x0 + 0.54 * 0.76 * ESC_L, my = SOLO + 0.92 * 0.76 * ESC_L;
  // sopa: tigela e colher em cada janela, para "lá dentro, os três tomavam sopa"
  const sopas = jan.pontos.map(([px, py, pz]) => {
    const g = rig(c, 'tigela', { x: px, y: py - 0.09 * k, z: pz + 0.09 * k, s: 0.001 });
    piece(g, blob([[-0.095, 0.02], [-0.07, -0.05], [0.07, -0.05], [0.095, 0.02]], 4), pat('stripes', '#fff4dc', '#ffe3b8', 0.06), { t: 0.006, edge: '#d9a56a', jitter: 0 });
    piece(g, ellipse(0.09, 0.016, 0, 0.02, 14), '#f2a93b', { t: 0.004, z: 0.004, jitter: 0 });
    const colher = rig(g, 'colher', { x: 0.075, y: 0.02, z: 0.006, rot: -0.35 }); piece(colher, rrect(0.016, 0.1, 0.004, 0, 0.05), '#c7cbd9', { t: 0.003, jitter: 0 });
    return { g, colher };
  });
  // ação: entram na ordem, Bento por último, a porta tranca e cada um vai para a sua janela
  tl.grupo('chegam');
  entra(tl, pipo, vP, { x: -0.2, de: 0.72 }, 0, 1.0); entra(tl, tico, vT, { x: -0.5, de: 0.44 }, 0.25, 1.0);
  tl.call(() => audio.tocar('guincho', { vol: 0.6 }), 0.1); tl.call(() => audio.tocar('guincho', { vol: 0.5, taxa: 1.12 }), 0.4);
  tl.grupo('abre');
  abrePorta(tl, casa.porta, 0.16, 1.3); tl.call(() => audio.tocar('range', { vol: 0.6, taxa: 1.2 }), 1.3);
  for (let i = 0; i < 2; i++) { tl.pulse(bento.bracoD, { rz: 0.9 }, 1.3 + i * 0.26, 0.26); tl.pulse(bento.corpo, { y: 0.08 }, 1.3 + i * 0.26, 0.26); }
  tl.grupo('entra-pipo'); entraNaPorta(tl, pipo, porta, 1.9);
  tl.grupo('entra-tico'); entraNaPorta(tl, tico, porta, 2.4);
  tl.grupo('entra-bento'); entraNaPorta(tl, bento, porta, 2.9);
  tl.grupo('tranca');
  fechaPorta(tl, casa.porta, 3.42); tl.call(() => audio.tocar('porta', { vol: 0.85, taxa: 0.9 }), 3.6); tl.call(() => audio.tocar('tranca', { vol: 0.7 }), 3.8);
  surgeNaJanela(tl, j1, 3.72, vJ); surgeNaJanela(tl, j2, 3.84, vJ); surgeNaJanela(tl, j3, 3.96, vJ);
  loboChega(tl, w, x0, vL, audio, 4.4);
  let t = 5.5;
  [0.72, 0.62, 0.62].forEach((enche, n) => {
    const S = encherESoprar(tl, w, t, enche, audio, x0, { gola: 1 + n * 0.2, grupos: [`sopro${n}`, `sopro${n}`] });
    sopro(c, tl, S, 0.85, { x: mx, y: my, z: 2.5, alvoX: 0.5, alvoY: my + 0.2, alvoZ: 2.16, n: 9 + n * 2, seed: 20 + n });
    flores.forEach((r, i) => tl.pulse(r, { rz: -0.42 }, S + 0.05 + i * 0.05, 0.6));
    tl.to(w.roxo, { s: 0.45 + n * 0.33 }, S, 0.7, ease.out);
    tl.pulse(j1.cabeca, { rz: 0.12 }, S, 0.9, ease.wiggle); tl.pulse(j2.cabeca, { rz: -0.12 }, S, 0.9, ease.wiggle); tl.pulse(j3.cabeca, { rz: 0.1 }, S + 0.1, 0.8, ease.wiggle);
    acalmar(tl, w, S + 0.82, x0);
    t = S + 0.98;
    tl.to(w.fundoBoca, { sy: 0.35 }, t - 0.05, 0.01);
  });
  // a casa nem tremeu; o Lobo arria e, lá dentro, os três tomam sopa
  tl.grupo('firme', { soVoz: true }); [j1, j2, j3].forEach((q, i) => tl.pulse(q.cabeca, { rz: i % 2 ? 0.14 : -0.14 }, i * 0.08, 0.8, ease.wiggle));
  tl.grupo('cansado');
  tl.call(() => audio.tocar('uivo4', { vol: 0.3, taxa: 0.8, dur: 3.4, pan: -0.5 }), t);
  tl.to(w.corpo, { rz: 0.12 }, t, 0.5, ease.bounce); tl.to(w.cabeca, { rz: -0.42, y: 0.77 }, t, 0.5, ease.bounce); tl.to(w.bracoF, { rz: -0.16 }, t, 0.4); tl.to(w.bracoT, { rz: 0.1 }, t, 0.4); tl.to(w.queixo, { rz: -0.22 }, t, 0.3); tl.to(w.fundoBoca, { sy: 1 }, t, 0.3);
  tl.grupo('sopa');
  tl.call(() => { audio.tocar('risos', { vol: 0.5, dur: 1.8 }); audio.tocar('grunhido', { vol: 0.5 }); }, t + 0.25);
  sopas.forEach(({ g, colher }, i) => { tl.to(g, { s: k }, t + 0.25 + i * 0.08, 0.2, ease.back); for (let n = 0; n < 3; n++) tl.pulse(colher, { y: 0.025, rz: 0.3 }, t + 0.45 + n * 0.34 + i * 0.05, 0.34); });
  [j1, j2, j3].forEach((q, i) => { for (let n = 0; n < 3; n++) tl.pulse(q.corpo, { y: 0.05 }, t + 0.45 + n * 0.34 + i * 0.05, 0.34); });
  tl.grupo('base');
  return { linha: tl, vento: ventoInterativo(c, w.fundoBoca, casa.raiz), atores: { lobo: w, pipo: j1, tico: j2, 'bento-janela': j3, bento }, provas: { casa: casa.raiz, deFora: { pipo, tico, bento }, janelas: [j1, j2, j3] }, idle(tt) { w.idle(tt); w.rabo.rotation.z = 1.35 + Math.sin(tt * 2.2) * 0.06; j1.idle(tt); j2.idle(tt); j3.idle(tt); bento.idle(tt); pipo.idle(tt); tico.idle(tt); fum.idle(tt); so.raios.rotation.z = tt * 0.08; } };
};

// ---- 11. A chaminé! ----------------------------------------------------------------------------------
montadores.telhado = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.2, 1.8], [0.3, 1.8], [0.34, 2.3], [0.36, 2.92], [-0.56, 2.92], [-0.3, 2.3]]), pat('stripes', '#dcb7c8', '#cfa7ba', 0.2), { edge: '#a98498' });
  colinas(p, { atras: ['#5f4c9c', '#53428e'], meio: ['#8a6aa6', '#7a5c98'] });
  const so = O.solDePapel(c, { x: 0.02, y: 1.46, z: 0.742, s: 0.8, cor: '#ffbe5c', raio: '#ff6f6a' });
  O.nuvem(c, { x: -0.18, y: 2.42, z: 0.72, s: 0.44, cor: '#e7c6e0', listra: '#d6aed2' }); O.nuvem(c, { x: 0.16, y: 2.58, z: 0.72, s: 0.38, cor: '#e7c6e0', listra: '#d6aed2' });
  for (const [x, y, s] of [[-0.24, 2.6, 0.05], [0.26, 2.3, 0.04]]) piece(p.alto(x, y, 0.76), star(5, s, s * 0.45), '#fff0a6', { t: 0.006, edge: '#fff9d6' });
  O.arvore(p.pe(-0.54, 1.44), { s: 0.84, altura: 1.55, copa: '#6c3fa8', listra: '#5e3498', frutas: '#ffd24f', estampa: 'dots' });
  O.arvore(p.pe(0.56, 1.48), { s: 0.74, altura: 1.28, copa: '#b74a86', listra: '#a53e76', frutas: '#fff4dc', flip: -1 });
  const { fum, jan } = casaDeBento(c); const xc = CASA_BENTO.x, zc = CASA_BENTO.zc;
  const j1 = jan.rosto('pipo', 0), j2 = jan.rosto('tico', 1), j3 = jan.rosto('bento', 2);
  // barril encostado na casa: é por ele que o Lobo sobe
  const bx = xc - 0.72, bz = zc + 0.2, bh = 0.34;
  const barril = p.pe(bx, bz); piece(barril, rrect(0.3, bh, 0.05, 0, bh / 2), pat('wood', '#a0623a', '#8a5230', 0.14), { t: 0.016, edge: '#c79a67' });
  for (const yy of [0.08, bh - 0.08]) piece(barril, rect(0.32, 0.03, 0, yy), '#4f3a5e', { t: 0.006, z: 0.014, jitter: 0 });
  O.arbusto(p.pe(0.92, 2.34), { s: 0.78, cor: '#4f8a66', listra: '#437c5a', flor: '#ff7fa8' });
  primeiroPlano(p, ['#6c9a6a', '#5f8c5e'], ['#ffd24f', '#ff7fa8', '#fff']);
  const x0 = -0.68;
  const w = lobo(c, { x: x0, y: SOLO, z: 2.6, s: 0.76 }); w.rabo.rotation.z = 1.35;
  const vL = w.root.scale.y;
  // de onde a página anterior o deixou: arriado, sem fôlego
  w.corpo.rotation.z = 0.12; w.cabeca.rotation.z = -0.42; w.cabeca.position.y = 0.77; w.bracoF.rotation.z = -0.16; w.bracoT.rotation.z = 0.1; w.queixo.rotation.z = -0.22; w.fundoBoca.scale.y = 1; w.roxo.scale.setScalar(0.5);
  poste(p, -1, 2.26, { cor: '#ff8fb1' }); trepadeira(p, 1, 2.46, '#ff8fb1', { alto: 1.15 });
  // ação
  tl.grupo('olha');
  tl.call(() => audio.tocar('inspira', { vol: 0.6, taxa: 0.8 }), 0.05);
  tl.to(w.roxo, { s: 0.001 }, 0, 0.5); tl.to(w.corpo, { rz: 0 }, 0, 0.4); tl.to(w.cabeca, { rz: 0.5, y: 0.87 }, 0, 0.5, ease.out); tl.to(w.queixo, { rz: 0 }, 0, 0.3); tl.to(w.fundoBoca, { sy: 0.35 }, 0, 0.3); tl.to(w.bracoF, { rz: 0.25 }, 0, 0.4); tl.to(w.bracoT, { rz: -0.35 }, 0, 0.4); tl.to(w.pupila, { x: 0.03, y: 0.03 }, 0.1, 0.2);
  tl.grupo('sorri'); tl.call(() => audio.tocar('engolir', { vol: 0.8 }), 0.1);
  tl.pulse(w.queixo, { rz: -0.16 }, 0.8, 0.7); tl.pulse(w.sobr, { rz: 0.22 }, 0.8, 0.7);
  // sobe: barril, beiral, telhas. A escala cai porque ele vai para o fundo da página
  tl.grupo('sobe');
  const T = 1.6;
  tl.to(w.cabeca, { rz: 0 }, T, 0.3); tl.to(w.pupila, { x: 0.024, y: -0.008 }, T, 0.2);
  tl.to(w.root, { x: bx - 0.26, z: bz + 0.04, ...tam(w, vL * 0.86) }, T, 0.5, ease.inOut); passos(tl, w, T, 0.5, { n: 3 });
  tl.to(w.root, { x: bx, y: SOLO + bh, z: bz + 0.02 }, T + 0.5, 0.3, ease.back); tl.call(() => audio.tocar('caldeirao', { vol: 0.25, taxa: 1.6, dur: 0.3 }), T + 0.78);
  const telha = (x) => SOLO + 0.9 * 1.74 - (xc - x) * (0.65 / 0.72);
  tl.to(w.root, { x: xc - 0.66, y: telha(xc - 0.66), z: zc + 0.16, rz: 0.3, ...tam(w, vL * 0.76) }, T + 0.84, 0.32, ease.back);
  [-0.5, -0.36].forEach((dx, i) => { const t0 = T + 1.2 + i * 0.3; tl.to(w.root, { x: xc + dx, y: telha(xc + dx) }, t0, 0.26, ease.inOut); passos(tl, w, t0, 0.26, { n: 1, salto: 0.03, perna: 0.32 }); });
  tl.grupo('ouve');
  tl.pulse(j3.corpo, { y: 0.04 }, 0, 0.3); tl.pulse(j3.cabeca, { rz: 0.2 }, 0, 0.9, ease.wiggle); tl.to(j3.olhos, { y: 0.19 }, 0, 0.2);
  tl.pulse(j1.cabeca, { rz: -0.16 }, 0.3, 0.7, ease.wiggle); tl.pulse(j2.cabeca, { rz: 0.16 }, 0.3, 0.7, ease.wiggle);
  tl.grupo('passos');
  [-0.22, -0.1, 0.0].forEach((dx, i) => { const t0 = 3.4 + i * 0.34; tl.to(w.root, { x: xc + dx, y: telha(xc + dx) }, t0, 0.3, ease.inOut); passos(tl, w, t0, 0.3, { n: 1, salto: 0.03, perna: 0.32 }); tl.call(() => audio.tocar(i % 2 ? 'range' : 'range2', { vol: 0.65, taxa: 1 + i * 0.05 }), t0 + 0.14); });
  tl.to(w.root, { rz: 0.04 }, 4.3, 0.2);
  tl.to(j3.root, { s: 0.001 }, 4.1, 0.2, ease.in); // Bento corre lá para baixo: já é a página seguinte
  tl.grupo('base');
  return { linha: tl, atores: { lobo: w, 'bento-janela': j3 }, idle(tt) { w.idle(tt); w.rabo.rotation.z = 1.35 + Math.sin(tt * 2.2) * 0.06; j1.idle(tt); j2.idle(tt); j3.idle(tt); fum.idle(tt); so.raios.rotation.z = tt * 0.06; } };
};

/** Corte da casa: a mesma chaminé de fora, à direita do telhado, com a lareira embaixo e a mesa da sopa. Para as páginas 7 e 8. */
const DUTO_X = 0.27;
function casaEmCorte(p, zc = 1.62) {
  const g = p.pe(0, zc);
  const L = 1.32, A = 1.12;
  piece(g, rect(L, A, 0, A / 2), pat('gingham', '#ffd9a0', '#f5c37f', 0.26), { t: 0.014, edge: '#e6a96b' });
  // moldura de tijolo
  piece(g, rect(0.08, A, -L / 2 + 0.04, A / 2), pat('brick', '#d9583f', '#f6dcc0', 0.24), { t: 0.016, z: 0.012, edge: '#f6dcc0' }); piece(g, rect(0.08, A, L / 2 - 0.04, A / 2), pat('brick', '#d9583f', '#f6dcc0', 0.24), { t: 0.016, z: 0.012, edge: '#f6dcc0' });
  piece(g, rect(L, 0.07, 0, 0.035), pat('wood', '#8c4f2a', '#7b4323', 0.2), { t: 0.016, z: 0.012 });
  // prateleira e quadro à esquerda
  const q = group(g, { x: -0.48, y: 0.84, z: 0.02 }); piece(q, rrect(0.2, 0.25, 0.01), '#a0623a', { t: 0.008 }); piece(q, rrect(0.14, 0.19, 0.005), '#bfe6ef', { t: 0.006, z: 0.006 }); piece(q, heart(0.04), '#e0446a', { t: 0.004, z: 0.012 });
  const e = group(g, { x: -0.2, y: 0.84, z: 0.02 }); piece(e, rrect(0.3, 0.04, 0.008), pat('wood', '#a0623a', '#8a5230', 0.15), { t: 0.01 });
  for (const [x, h, cor] of [[-0.09, 0.12, '#e84a5f'], [0, 0.17, '#3fb8c9'], [0.09, 0.1, '#ffd24f']]) piece(e, rrect(0.06, h, 0.02, x, 0.02 + h / 2), cor, { t: 0.008, z: 0.004 });
  // a mesa da sopa, com as três tigelas que ficaram para trás
  const m = group(g, { x: -0.36, y: 0.07, z: 0.024 }); piece(m, rrect(0.48, 0.035, 0.008, 0, 0.3), pat('wood', '#a0623a', '#8a5230', 0.15), { t: 0.012 }); for (const sx of [-0.19, 0.19]) piece(m, rrect(0.035, 0.3, 0.006, sx, 0.15), '#8a5230', { t: 0.01 });
  for (const sx of [-0.15, 0, 0.15]) { piece(m, blob([[-0.05, 0.335], [-0.035, 0.31], [0.035, 0.31], [0.05, 0.335]], 3), '#fff4dc', { t: 0.006, z: 0.006, edge: '#d9a56a', jitter: 0 }); piece(m, ellipse(0.046, 0.008, sx * 0, 0.335, 10), '#f2a93b', { t: 0.003, z: 0.01, jitter: 0 }); m.children[m.children.length - 1].position.x = sx; m.children[m.children.length - 2].position.x = sx; }
  // lareira e duto, sob a chaminé de fora
  const d = group(g, { x: DUTO_X });
  piece(d, blob([[-0.28, 0.07], [-0.28, 0.5], [-0.17, 0.66], [0.17, 0.66], [0.28, 0.5], [0.28, 0.07]], 4), pat('brick', '#8c3c2c', '#b67559', 0.2), { t: 0.016, z: 0.012, edge: '#c69276' });
  piece(d, blob([[-0.19, 0.07], [-0.19, 0.42], [-0.1, 0.54], [0.1, 0.54], [0.19, 0.42], [0.19, 0.07]], 4), '#241726', { t: 0.006, z: 0.03, edge: '#241726' });
  // telhado inteiro, de uma água à outra, e o duto passando por cima dele
  const apice = A + 0.65;
  piece(g, poly([-0.72, A - 0.02], [0.72, A - 0.02], [0, apice]), pat('shingle', '#5a4fb0', '#463c96', 0.3), { t: 0.016, z: 0.02, edge: '#d7d2f5' });
  const alto = apice + 0.13; const meio = (0.58 + alto) / 2; const alt = alto - 0.58;
  piece(d, rect(0.22, alt, 0, meio), '#2a1a2c', { t: 0.006, z: 0.046, edge: '#2a1a2c', jitter: 0 });
  piece(d, rect(0.04, alt, -0.13, meio), pat('brick', '#c64e38', '#f6dcc0', 0.16), { t: 0.01, z: 0.052, edge: '#f6dcc0' }); piece(d, rect(0.04, alt, 0.13, meio), pat('brick', '#c64e38', '#f6dcc0', 0.16), { t: 0.01, z: 0.052, edge: '#f6dcc0' });
  piece(d, rrect(0.36, 0.06, 0.012, 0, alto), '#e9c79c', { t: 0.012, z: 0.058, edge: '#f8e5c8' });
  return { g, zc, L, A, apiceY: SOLO + apice, topoY: SOLO + alto };
}

// ---- 12. Depressa! -----------------------------------------------------------------------------------
montadores.chamine = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.68, 1.68], [0.68, 1.68], [1.12, 2.78], [0.6, 2.96], [0, 3.02], [-0.6, 2.96], [-1.12, 2.78]]), pat('wood', '#a06a42', '#8c5a36', 0.34), { edge: '#7c4d2e' });
  colinas(p, { atras: ['#3e3a7e', '#34306e'], meio: ['#55509a', '#48448c'] });
  O.lua(c, { x: -0.09, y: 2.42, z: 0.76, s: 0.72 });
  O.nuvem(c, { x: 0.16, y: 2.2, z: 0.74, s: 0.36, cor: '#d9c9f2', listra: '#c3afe8' });
  O.arvore(p.pe(-0.6, 1.48), { s: 0.72, altura: 1.3, copa: '#3f7f7f', listra: '#347070', frutas: null });
  O.arvore(p.pe(0.62, 1.5), { s: 0.64, altura: 1.25, copa: '#6452a8', listra: '#564498', frutas: null, flip: -1 });
  const corte = casaEmCorte(p, 1.62); const DX = DUTO_X;
  // o Lobo já está no telhado, onde a página anterior o deixou
  const telha = (x) => corte.apiceY - Math.abs(x) * (0.67 / 0.72);
  const w = lobo(c, { x: -0.1, y: telha(-0.1), z: 1.72, s: 0.5 }); w.root.rotation.z = 0.2; w.rabo.rotation.z = 0.6;
  // fogo baixo, e o caldeirão ainda longe da chaminé
  const fogo = O.fogueira(c, { x: DX, y: SOLO + 0.04, z: 2.02, s: 0.86 });
  const cal = O.caldeirao(c, { x: -0.2, y: SOLO + 0.13, z: 2.14, s: 0.8 });
  const fum = O.fumaca(c, 6, { x: DX + 0.02, y: SOLO + 0.62, z: 2.16, altura: 0.72, cor: '#fff4f8', s: 0.92 });
  fum.raiz.scale.setScalar(0.001);
  const bolhas = []; for (let i = 0; i < 6; i++) { const b = rig(c, 'bolha', { x: DX - 0.24 + i * 0.09, y: SOLO + 0.56, z: 2.16, s: 0.001 }); piece(b, ellipse(0.026, 0.026, 0, 0, 10), '#d2f6f7', { t: 0.005, edge: '#fff', jitter: 0, noShadow: true }); bolhas.push(b); }
  // pilha de lenha ao lado de Bento
  const pilhaL = p.pe(-0.9, 2.46); for (let j = 0; j < 3; j++) for (let i = 0; i < 3 - j; i++) piece(pilhaL, ellipse(0.045, 0.045, i * 0.1 + j * 0.05, 0.05 + j * 0.08, 10), pat('wood', '#8a5230', '#70401f', 0.1), { t: 0.014, z: j * 0.002, edge: '#c79a67', jitter: 0 });
  // os três
  const bento = porco(c, 'bento', { x: -0.72, y: SOLO, z: 2.56, s: 0.78 }); bento.bracoD.rotation.z = 2.3;
  const tico = porco(c, 'tico', { x: -0.68, y: SOLO, z: 2.3, s: 0.72 }); tico.bracoD.rotation.z = 1.5; tico.bracoE.rotation.z = -0.4;
  const pipo = porco(c, 'pipo', { x: 0.7, y: SOLO, z: 2.44, s: 0.7, virado: true }); pipo.bracoD.rotation.z = 1.15; pipo.bracoE.rotation.z = -1.15;
  const lenha = rig(c, 'lenha', { x: -0.66, y: 0.5, z: 2.6, s: 0.001 }); piece(lenha, stroke([[-0.16, 0], [0.16, 0.02]], 0.07), pat('wood', '#8a5230', '#70401f', 0.14), { t: 0.014 });
  const tp = p.pe(0, 2.72); piece(tp, rect(2.2, 0.09, 0, 0.045), pat('wood', '#7a4a26', '#663c1c', 0.22), { t: 0.014 });
  poste(p, -1, 2.3, { cor: '#ffb02e' }); poste(p, 1, 2.3, { cor: '#ffb02e', alto: 1.0 });
  // ação
  const forca = { v: 0.35 };
  tl.grupo('lenha');
  tl.call(() => audio.tocar('grunhido', { vol: 0.8 }), 0.02);
  tl.pulse(bento.bracoD, { rz: 0.5 }, 0, 0.3); tl.pulse(bento.corpo, { y: 0.1 }, 0, 0.3); tl.pulse(bento.cabeca, { rz: 0.16 }, 0, 0.5, ease.wiggle);
  tl.to(lenha, { s: 1 }, 0.25, 0.1); tl.to(lenha, { x: DX - 0.1, z: 2.1, rz: 5 }, 0.28, 0.5, ease.linear); tl.pulse(lenha, { y: 0.34 }, 0.28, 0.5); tl.to(lenha, { s: 0.001 }, 0.74, 0.06);
  tl.to(forca, { v: 1.0 }, 0.78, 0.4, ease.out);
  tl.call(() => { audio.tocar('lenha', { vol: 0.9 }); audio.tocar('chama', { vol: 0.8 }); }, 0.76);
  tl.grupo('brasas');
  // Pipo se abaixa junto do fogo e sopra as brasas
  tl.to(pipo.root, { x: DX + 0.34 }, 0.9, 0.35, ease.inOut); passos(tl, pipo, 0.9, 0.35, { n: 2 }); tl.to(pipo.corpo, { rz: 0.34 }, 1.2, 0.2, ease.out);
  sopro(c, tl, 1.3, 0.6, { x: DX + 0.24, y: 0.42, z: 2.3, alvoX: DX + 0.05, alvoY: 0.26, alvoZ: 2.1, n: 6, largura: 0.1, seed: 31 });
  tl.call(() => audio.tocar('ar', { vol: 0.5, taxa: 0.8 }), 1.3);
  tl.to(forca, { v: 1.6 }, 1.35, 0.7, ease.out); tl.call(() => audio.tocar('chama', { vol: 0.9, taxa: 0.85 }), 1.5);
  tl.grupo('empurra');
  // Tico empurra o caldeirão até debaixo da chaminé
  tl.to(tico.root, { x: DX - 0.64 }, 1.9, 0.75, ease.inOut); passos(tl, tico, 1.9, 0.75, { n: 4, salto: 0.03 }); tl.to(tico.corpo, { rz: -0.14 }, 1.85, 0.12);
  tl.to(cal.g, { x: DX }, 1.9, 0.75, ease.inOut); tl.pulse(cal.g, { rz: 0.03 }, 1.9, 0.75, ease.wiggle);
  tl.call(() => { audio.tocar('caldeirao', { vol: 0.95 }); audio.tocar('bolhas', { vol: 0.7 }); }, 1.95);
  tl.to(tico.corpo, { rz: 0 }, 2.7, 0.15);
  tl.grupo('ferve');
  tl.to(fum.raiz, { s: 0.92 }, 2.7, 0.5, ease.out);
  bolhas.forEach((b, i) => { for (let k = 0; k < 4; k++) { const t0 = 2.75 + i * 0.11 + k * 0.55; tl.to(b, { s: 1 }, t0, 0.1); tl.pulse(b, { y: 0.1 }, t0, 0.42, ease.linear); tl.to(b, { s: 0.001 }, t0 + 0.36, 0.08); } });
  // o Lobo chega à boca da chaminé e espia
  tl.grupo('espia');
  [0.0, 0.08].forEach((x, i) => { const t0 = 4.0 + i * 0.32; tl.to(w.root, { x, y: telha(x) }, t0, 0.28, ease.inOut); passos(tl, w, t0, 0.28, { n: 1, salto: 0.03, perna: 0.32 }); tl.call(() => audio.tocar('range', { vol: 0.5, taxa: 1.1 }), t0 + 0.14); });
  tl.to(w.root, { rz: -0.3 }, 4.6, 0.3); tl.to(w.pupila, { x: 0.02, y: -0.03 }, 4.6, 0.2); tl.to(w.sobr, { rz: 0.1 }, 4.7, 0.2);
  tl.grupo('base');
  return { linha: tl, atores: { lobo: w, bento, pipo, tico }, provas: { caldeirao: cal.g, duto: DX }, idle(t) { w.idle(t); w.rabo.rotation.z = 0.6 + Math.sin(t * 2.2) * 0.05; bento.idle(t); pipo.idle(t); tico.idle(t); fogo.idle(t, forca.v); fum.idle(t); } };
};

// ---- 13. Rabo em brasa -------------------------------------------------------------------------------
montadores.rabo = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.68, 1.68], [0.68, 1.68], [1.12, 2.78], [0.6, 2.96], [0, 3.02], [-0.6, 2.96], [-1.12, 2.78]]), pat('wood', '#8c5a3e', '#7a4d33', 0.34), { edge: '#6c4229' });
  colinas(p, { atras: ['#26245e', '#201e52'], meio: ['#37347a', '#2d2b6c'] });
  O.lua(c, { x: 0.05, y: 2.26, z: 0.76, s: 0.84 });
  for (const [x, y, s] of [[-0.14, 2.5, 0.09], [-0.2, 2.0, 0.06], [0.28, 2.64, 0.07]]) piece(p.alto(x, y, 0.76), star(5, s, s * 0.45), '#fff0a6', { t: 0.006, edge: '#fff9d6' });
  O.arvore(p.pe(-0.6, 1.48), { s: 0.68, altura: 1.22, copa: '#2c6a72', listra: '#245c64', frutas: null });
  O.arvore(p.pe(0.62, 1.5), { s: 0.64, altura: 1.25, copa: '#493a92', listra: '#3d3082', frutas: null, flip: -1 });
  const corte = casaEmCorte(p, 1.62); const DX = DUTO_X; const topo = corte.topoY;
  const fogo = O.fogueira(c, { x: DX, y: SOLO + 0.04, z: 2.02, s: 0.86 });
  const cal = O.caldeirao(c, { x: DX, y: SOLO + 0.13, z: 2.14, s: 0.8 });
  const fum = O.fumaca(c, 5, { x: DX + 0.02, y: SOLO + 0.62, z: 2.16, altura: 0.5, cor: '#fff4f8', s: 0.9 });
  const pilhaL = p.pe(-0.9, 2.46); for (let j = 0; j < 3; j++) for (let i = 0; i < 3 - j; i++) piece(pilhaL, ellipse(0.045, 0.045, i * 0.1 + j * 0.05, 0.05 + j * 0.08, 10), pat('wood', '#8a5230', '#70401f', 0.1), { t: 0.014, z: j * 0.002, edge: '#c79a67', jitter: 0 });
  const bento = porco(c, 'bento', { x: -0.72, y: SOLO, z: 2.56, s: 0.78 });
  const pipo = porco(c, 'pipo', { x: DX + 0.34, y: SOLO, z: 2.44, s: 0.7, virado: true });
  const tico = porco(c, 'tico', { x: DX - 0.64, y: SOLO, z: 2.3, s: 0.72 });
  const tp = p.pe(0, 2.72); piece(tp, rect(2.2, 0.09, 0, 0.045), pat('wood', '#7a4a26', '#663c1c', 0.22), { t: 0.014 });
  poste(p, -1, 2.3, { cor: '#ffb02e' }); poste(p, 1, 2.3, { cor: '#ffb02e', alto: 1.0 });
  // Lobo de cabeça para baixo, entrando pela boca da chaminé
  const vQ = 0.42 * ESC_L; const altura = 1.3 * vQ;
  const w = lobo(c, { x: DX, y: topo + altura, z: 1.74, s: 0.42 }); w.root.rotation.z = Math.PI; w.queixo.rotation.z = -0.14; w.fundoBoca.scale.y = 0.9; w.bracoF.rotation.z = 2.4; w.bracoT.rotation.z = -2.4; w.olho.scale.set(1.1, 1.15, 1);
  // respingos
  const respingos = []; for (let i = 0; i < 12; i++) { const a = DX - 0.45 + i * 0.08; const g = rig(c, 'pingo', { x: a, y: SOLO + 0.6, z: 2.2, s: 0.001 }); piece(g, blob([[0, -0.035], [0.03, 0], [0, 0.05], [-0.03, 0]], 4), '#8ae2e6', { t: 0.006, edge: '#d2f6f7', jitter: 0 }); respingos.push([g, a]); }
  const fumas = []; for (let i = 0; i < 16; i++) { const g = rig(c, 'puf', { x: DX, y: topo + 0.1, z: 1.0 + i * 0.002, s: 0.001 }); piece(g, scallop(0.07, 0.06, 6, 0.16, 0, 0, 5), pat('stripes', '#dcd5ea', '#c6bedb', 0.08), { t: 0.006, edge: '#ffffff', jitter: 0, noShadow: true }); fumas.push(g); }
  // o voo sobe reto e sai por cima do livro: a página seguinte o mostra lá no alto, e é de lá que ele cai
  const curva = (q) => [DX, topo + 0.14 + q * (H + 0.8 - topo)];
  // queda dentro do duto
  tl.grupo('queda');
  tl.call(() => audio.trilha('noite'), 0.01); tl.call(() => audio.tocar('ar', { vol: 1, taxa: 0.55 }), 0.1);
  tl.to(w.root, { y: SOLO + 0.62 + altura }, 0.08, 0.78, ease.in);
  tl.to(w.root, { z: 2.0 }, 0.6, 0.26, ease.linear);
  // tchibum: vira dentro do caldeirão, e fica com a cabeça de fora
  tl.grupo('tchibum');
  const CAI = 0.86; const yDentro = SOLO + 0.33; // o aro está em SOLO + 0.53: da cintura para cima ele fica à vista
  tl.to(w.root, { rz: 0, y: yDentro - 0.14, z: 2.09, s: vQ * 0.92 }, CAI, 0.01); tl.to(w.queixo, { rz: -0.2 }, CAI, 0.01); tl.to(w.bracoF, { rz: 0.25 }, CAI, 0.01); tl.to(w.bracoT, { rz: -0.35 }, CAI, 0.01);
  tl.to(w.root, { y: yDentro }, CAI + 0.03, 0.26, ease.back);
  tl.call(() => { audio.tocar('tchibum', { vol: 1 }); audio.tocar('tchibum2', { vol: 1, taxa: 0.8 }); audio.tocar('caldeirao', { vol: 0.8, dur: 1.4 }); }, CAI);
  tl.pulse(cal.g, { sy: -0.14, rz: 0.04 }, CAI, 0.4); tl.pulse(cal.agua, { sy: 3 }, CAI, 0.4);
  respingos.forEach(([g, a], i) => { const r = 0.32 + (i % 4) * 0.12; tl.to(g, { s: 1 + (i % 3) * 0.3 }, CAI, 0.05); tl.to(g, { x: DX + (a - DX) * 1.25, rz: (a - DX) * 3 }, CAI, 0.68, ease.out); tl.to(g, { y: SOLO + 0.6 + r }, CAI, 0.3, ease.out); tl.to(g, { y: SOLO + 0.16 }, CAI + 0.3, 0.4, ease.in); tl.to(g, { s: 0.001 }, CAI + 0.62, 0.1); });
  [pipo, tico, bento].forEach((q, i) => { tl.pulse(q.corpo, { y: 0.19 }, CAI + 0.03 + i * 0.05, 0.42); tl.to(q.bracoD, { rz: 2.5 }, CAI, 0.15, ease.out); tl.to(q.bracoE, { rz: -2.5 }, CAI, 0.15, ease.out); });
  // uivo: a água está quente
  tl.grupo('uivo');
  tl.call(() => audio.tocar('uivo1', { vol: 1, taxa: 1.2, dur: 3 }), CAI + 0.5);
  tl.call(() => audio.tocar('uivo3', { vol: 0.8, taxa: 1.45, depois: 0.7, dur: 2.2 }), CAI + 0.5);
  tl.to(w.cabeca, { rz: 0.4 }, CAI + 0.5, 0.12, ease.out); tl.to(w.queixo, { rz: -0.3 }, CAI + 0.5, 0.05); tl.to(w.fundoBoca, { sy: 1 }, CAI + 0.5, 0.05); tl.to(w.olho, { sx: 1.25, sy: 1.3 }, CAI + 0.5, 0.05); tl.to(w.roxo, { s: 0.7 }, CAI + 0.5, 0.2);
  tl.pulse(w.root, { y: 0.03 }, CAI + 0.55, 0.6, ease.wiggle);
  // foguete: sobe pelo mesmo duto, com o rabo em chamas
  const SAI = CAI + 1.3;
  tl.grupo('foguete');
  tl.call(() => { audio.trilha('fuga'); audio.tocar('foguete', { vol: 1 }); audio.tocar('chama', { vol: 1, taxa: 0.8 }); audio.tocar('ar', { vol: 1, taxa: 0.5 }); }, SAI); tl.call(() => audio.tocar('chama', { vol: 0.8 }), SAI + 0.3);
  tl.to(w.chama, { s: 1 }, SAI, 0.12, ease.back);
  tl.to(w.cabeca, { rz: 0 }, SAI, 0.1); tl.to(w.roxo, { s: 0.001 }, SAI, 0.2);
  tl.to(w.bracoF, { rz: 2.9 }, SAI, 0.08); tl.to(w.bracoT, { rz: -2.9 }, SAI, 0.08);
  tl.to(w.root, { z: 1.74 }, SAI + 0.08, 0.1, ease.linear);
  tl.to(w.root, { s: 0.3 * ESC_L * 1.1, y: topo - 0.05 }, SAI + 0.05, 1.4, ease.in);
  tl.grupo('voo');
  tl.call(() => audio.tocar('ar', { vol: 0.8, taxa: 0.65 }), SAI + 1.5);
  const sVoo = 0.3 * ESC_L * 1.1;
  tl.run((q) => { const [x, y] = curva(q); if (q > 0) { w.root.position.x = x; w.root.position.y = y; w.root.rotation.z = Math.sin(q * 7) * 0.08; w.root.scale.set(sVoo, sVoo, sVoo); } }, SAI + 1.5, 1.25);
  fumas.forEach((g, i) => { const q = i / fumas.length; const [x, y] = curva(q); const t0 = SAI + 1.5 + q * 1.25; tl.to(g, { x: x + 0.04, y, s: 0.9 - q * 0.45 }, t0, 0.03); tl.to(g, { s: 0.001 }, t0 + 0.7, 0.5, ease.in); });
  const FUGA = SAI + 2.75;
  tl.to(w.root, tam(w, 0.001), FUGA, 0.01);
  tl.grupo('viva');
  tl.call(() => { audio.tocar('viva', { vol: 0.55, dur: 2.2 }); audio.tocar('risos', { vol: 0.5, dur: 2 }); }, SAI + 1.6);
  [pipo, tico, bento].forEach((q, i) => { for (let k = 0; k < 4; k++) tl.pulse(q.corpo, { y: 0.15 }, SAI + 1.65 + k * 0.32 + i * 0.05, 0.32); tl.pulse(q.cabeca, { rz: 0.1 }, SAI + 1.9, 1.1, ease.wiggle); });
  tl.grupo('base');
  return { linha: tl, atores: { lobo: w }, provas: { caldeirao: cal.g, duto: DX }, idle(t) { w.idle(t); bento.idle(t); pipo.idle(t); tico.idle(t); fogo.idle(t, 1.6); fum.idle(t); w.rabo.rotation.z = 0.32 + Math.sin(t * 12) * 0.14; } };
};

// ---- 15. Correu, correu ------------------------------------------------------------------------------
montadores.fuga = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  // o mesmo lugar da página anterior: a estrada, a casa, a porta aberta e os três onde pararam
  const { xc, casa, fum } = cenarioDaFuga(p); casa.porta.scale.x = 0.1; casa.porta.position.x = -0.147;
  const [pipo, bento, tico] = POSICOES_NA_PORTA.map(([tipo, x, z, s]) => porco(c, tipo, { x, y: SOLO, z, s, virado: true }));
  primeiroPlano(p, ['#4a7f74', '#3f7268'], ['#ffd24f', '#ff7fa8', '#fff']);
  poste(p, -1, 2.3, { cor: '#ffd24f' }); trepadeira(p, 1, 2.42, '#ffb02e', { alto: 1.1 });
  // o Lobo já está no chão, tonto, exatamente onde caiu
  const { w, estrelas, gira } = loboCaido(c); const vL = w.root.scale.y;
  const fumas = []; for (let i = 0; i < 12; i++) { const g = rig(c, 'puf', { x: 0, y: 0.3, z: 2, s: 0.001 }); piece(g, scallop(0.07, 0.06, 6, 0.16, 0, 0, 5), pat('stripes', '#c9c6dc', '#b6b2ce', 0.08), { t: 0.006, edge: '#ffffff', jitter: 0, noShadow: true }); fumas.push(g); }
  tl.grupo('gritam');
  tl.call(() => audio.tocar('grunhido', { vol: 0.8 }), 0.05);
  // o grito dos três o acorda: um pulo de susto para trás, para longe deles, e as estrelinhas somem
  tl.to(w.root, { x: -0.5 }, 0.3, 0.34, ease.out); tl.pulse(w.root, { y: 0.2 }, 0.3, 0.34); tl.to(w.olho, { sx: 1.35, sy: 1.4 }, 0.3, 0.1); tl.pulse(w.cabeca, { rz: 0.14 }, 0.3, 0.7, ease.wiggle);
  estrelas.forEach((g) => tl.to(g, { s: 0.001 }, 0.3, 0.2, ease.in)); tl.call(() => audio.tocar('ar', { vol: 0.5, taxa: 1.3, pan: -0.25 }), 0.32);
  [pipo, tico, bento].forEach((q, i) => { tl.to(q.bracoD, { rz: 2.3 }, 0.1 + i * 0.05, 0.18, ease.back); for (let k = 0; k < 3; k++) { tl.pulse(q.bracoD, { rz: 0.5 }, 0.28 + k * 0.32 + i * 0.05, 0.32); tl.pulse(q.corpo, { y: 0.1 }, 0.28 + k * 0.32 + i * 0.05, 0.32); } });
  // três "correu": até o pé do morro, depois estrada acima, cada arrancada mais longe e menor
  const trecho = [[-0.38, SOLO, 1.72, 0.6], [-0.18, SOLO, 1.2, 0.34], [-0.22, SOLO + 0.32, 1.17, 0.24]];
  let ax = -0.5, ay = SOLO, az = 2.3;
  trecho.forEach(([x, y, z, f], n) => {
    const t0 = 1.5 + n * 0.62; tl.grupo(`foge${n + 1}`);
    tl.to(w.root, { x, y, z, ...tam(w, vL * f) }, t0, 0.56, ease.inOut); passos(tl, w, t0, 0.56, { n: 4, salto: 0.09 * f + 0.02, perna: 0.7 });
    tl.call(() => audio.tocar(n % 2 ? 'choro2' : 'choro1', { vol: 0.75 - n * 0.2, pan: x * 0.9 }), t0);
    const [bx, by, bz] = [ax, ay, az];
    fumas.slice(n * 4, n * 4 + 4).forEach((g, i) => { const q = (i + 0.5) / 4; tl.to(g, { x: bx + (x - bx) * q + 0.06 * f, y: by + (y - by) * q + 0.26 * f, z: bz + (z - bz) * q - 0.01, s: 0.9 * f }, t0 + q * 0.5, 0.04); tl.to(g, { s: 0.001 }, t0 + q * 0.5 + 0.8, 0.5, ease.in); });
    ax = x; ay = y; az = z;
  });
  // some atrás do topo: passa para trás do morro, descendo do outro lado
  tl.grupo('some');
  tl.to(w.root, { x: -0.12, y: SOLO + 0.5, ...tam(w, vL * 0.19) }, 3.4, 0.4, ease.inOut); passos(tl, w, 3.4, 0.4, { n: 3, salto: 0.03, perna: 0.7 });
  tl.to(w.root, { x: -0.19, y: SOLO + 0.7, ...tam(w, vL * 0.14) }, 3.8, 0.35, ease.inOut); passos(tl, w, 3.8, 0.35, { n: 2, salto: 0.02, perna: 0.7 });
  tl.to(w.root, { z: 1.08 }, 4.14, 0.02, ease.linear); tl.to(w.root, { y: SOLO + 0.42 }, 4.16, 0.22, ease.in); tl.to(w.root, tam(w, 0.001), 4.38, 0.02);
  tl.grupo('acena');
  tl.call(() => { audio.tocar('viva', { vol: 0.55, dur: 2.2 }); audio.tocar('risos', { vol: 0.45, dur: 2 }); }, 4.4);
  [pipo, tico, bento].forEach((q, i) => { for (let k = 0; k < 3; k++) tl.pulse(q.corpo, { y: 0.16 }, 4.45 + k * 0.32 + i * 0.05, 0.32); });
  tl.grupo('base');
  return { linha: tl, atores: { pipo, tico, bento }, provas: { lobo: w, casa: casa.raiz, porta: xc }, idle(t) { w.idle(t); w.rabo.rotation.z = 0.32 + Math.sin(t * 12) * 0.14; pipo.idle(t); tico.idle(t); bento.idle(t); fum.idle(t); gira(t); } };
};

// ---- 16. A festa ------------------------------------------------------------------------------------
montadores.festa = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.5, 1.7], [0.5, 1.7], [1.1, 2.78], [0.6, 2.96], [0, 3.02], [-0.6, 2.96], [-1.1, 2.78]]), pat('dots', '#f2c88f', '#f7d9ac', 0.2), { edge: '#c79a67' });
  colinas(p, { atras: ['#4a3a92', '#3f3082'], meio: ['#6f4ea8', '#603f98'] });
  const luaP = O.lua(c, { x: -0.09, y: 2.44, z: 0.762, s: 0.62 });
  const xc = 0, zc = 1.6;
  const casa = O.casaTijolo(c, { x: xc, y: SOLO, z: zc, s: 0.72 }); O.chamine(casa.raiz, { x: 0.3, y: 1.3, z: 0 });
  janelasDeBento(c, { x: xc, zc, s: 0.72, casa });
  // bandeirinhas e lanternas de parede a parede
  O.bandeirinhas(c, { x: 0, y: 1.92, z: 1.94, largura: 1.56, queda: 0.13 });
  O.bandeirinhas(c, { x: 0, y: 2.08, z: 1.44, largura: 1.14, queda: 0.1, n: 9 });
  const lant = [[-0.4, 1.62, 2.04, '#ff8fb1'], [0, 1.58, 2.06, '#ffd24f'], [0.4, 1.62, 2.04, '#7ad7e0']].map(([x, y, z, cor]) => O.lanterna(c, { x, y, z, cor, fio: 0.12 }));
  // fogueira ao centro, família em roda
  const fogo = O.fogueira(c, { x: 0.02, y: SOLO + 0.02, z: 2.24, s: 0.8 });
  const mae = porco(c, 'mae', { x: 0.7, y: SOLO, z: 2.3, s: 0.84, virado: true }); const vM = escondido(mae);
  // bolo
  const bolo = rig(mae.corpo, 'bolo', { x: 0, y: 0.3, z: 0.16 }); // na frente da barriga: na mão de dentro, Kael o escondia
  piece(bolo, rrect(0.34, 0.03, 0.01), '#fff4dc', { t: 0.008 }); piece(bolo, rrect(0.27, 0.11, 0.02, 0, 0.07), pat('stripes', '#ff8fb1', '#ffb3c9', 0.08), { t: 0.01, z: 0.002 }); piece(bolo, rrect(0.19, 0.09, 0.02, 0, 0.17), pat('dots', '#fff4dc', '#ff8fb1', 0.08), { t: 0.01, z: 0.004 }); piece(bolo, flame(0.04, 0.08), '#ffb02e', { t: 0.004, y: 0.22, z: 0.006, glow: true });
  mae.bracoD.rotation.z = 0.5; mae.bracoE.rotation.z = -0.5;
  const pipo = porco(c, 'pipo', { x: -0.74, y: SOLO, z: 2.42, s: 0.72 }); const tico = porco(c, 'tico', { x: -0.26, y: SOLO, z: 2.68, s: 0.78 }); const bento = porco(c, 'bento', { x: 0.32, y: SOLO, z: 2.68, s: 0.84, virado: true });
  // a flauta é de Tico, desde a página 2; Bento só aprende no fim
  const flauta = rig(tico.cabeca, 'flauta', { x: 0.12, y: -0.05, z: 0.2 }); piece(flauta, rrect(0.38, 0.032, 0.012, 0.12, -0.03), pat('stripes', '#f4cd5e', '#d9a93f', 0.06), { t: 0.008, jitter: 0 }); tico.bracoD.rotation.z = 2.2; tico.bracoE.rotation.z = -2.2;
  const tp = p.pe(0, 2.72); piece(tp, wave(2.2, 0.12, 0.03, 4, 2), pat('grass', '#7fb56a', '#6fa65c', 0.28), { t: 0.012 });
  poste(p, -1, 2.3, { cor: '#ff8fb1' }); poste(p, 1, 2.3, { cor: '#ffd24f', alto: 1.05 }); trepadeira(p, -1, 1.84, '#ffd24f', { alto: 0.95 }); trepadeira(p, 1, 1.86, '#ff8fb1', { alto: 0.9 });
  // fogos
  const fogos = [];
  [[-0.1, 1.9, 0.7, '#ff7fa8'], [0.16, 2.32, 0.72, '#ffd24f'], [-0.15, 2.5, 0.72, '#7ad7e0'], [0.06, 1.66, 0.62, '#b98cf0']].forEach(([x, y, z, cor], i) => {
    const g = rig(c, 'fogos', { x, y, z, s: 0.001 });
    for (let k = 0; k < 10; k++) { const a = (k / 10) * 6.283; piece(g, poly([Math.cos(a) * 0.03, Math.sin(a) * 0.03], [Math.cos(a + 0.2) * 0.1, Math.sin(a + 0.2) * 0.1], [Math.cos(a) * 0.2, Math.sin(a) * 0.2], [Math.cos(a - 0.2) * 0.1, Math.sin(a - 0.2) * 0.1]), cor, { t: 0.004, glow: true, jitter: 0 }); }
    piece(g, star(8, 0.05, 0.022), '#fffbe0', { t: 0.004, z: 0.008, glow: true, jitter: 0 });
    fogos.push(g);
  });
  // ação
  const D = 1.0;
  tl.grupo('noite'); tl.to(luaP, { y: 2.56 }, 0, 1, ease.out);
  // a mãe chega pela estrada, com o bolo
  tl.grupo('bolo');
  mae.root.position.x = 0.94; tl.to(mae.root, tam(mae, vM), 0, 0.3, ease.out); tl.to(mae.root, { x: 0.7 }, 0, 0.9, ease.out); passos(tl, mae, 0, 0.9, { n: 4 });
  tl.grupo('danca');
  tl.call(() => audio.tocar('viva', { vol: 0.75, dur: 3.6 }), D + 0.05); tl.call(() => audio.tocar('sino', { vol: 0.55 }), D + 0.1);
  [pipo, tico, bento, mae].forEach((q, i) => {
    for (let k = 0; k < 11; k++) { const t0 = D + 0.05 + k * 0.42 + i * 0.05; tl.pulse(q.corpo, { y: 0.13 + (k % 2) * 0.05 }, t0, 0.42); tl.pulse(q.corpo, { rz: (k % 2 ? 1 : -1) * 0.14 }, t0, 0.42); }
  });
  [pipo, bento].forEach((q, i) => { tl.to(q.bracoE, { rz: -2.4 }, D + 0.1 + i * 0.1, 0.2, ease.back); tl.to(q.bracoD, { rz: 2.4 }, D + 0.1 + i * 0.1, 0.2, ease.back); for (let k = 0; k < 5; k++) tl.pulse(q.bracoE, { rz: 0.5 }, D + 0.35 + k * 0.84, 0.84); });
  lant.forEach((g, i) => tl.pulse(g, { rz: 0.26 }, D + 0.2 + i * 0.1, 4.2, ease.wiggle));
  tl.grupo('fogos');
  fogos.forEach((g, i) => { for (let k = 0; k < 3; k++) { const t0 = D + 0.5 + i * 0.42 + k * 1.72; tl.call(() => audio.tocar(i % 2 ? 'fogos' : 'fogos2', { vol: 0.5, taxa: 1.12 - (k % 3) * 0.08 }), t0); tl.to(g, { s: 1.15 + (i % 2) * 0.3 }, t0, 0.32, ease.back); tl.to(g, { s: 0.001 }, t0 + 0.9, 0.3, ease.in); } });
  tl.grupo('base');
  return { linha: tl, atores: { mae, pipo, tico, bento }, idle(t) { pipo.idle(t); tico.idle(t); bento.idle(t); mae.idle(t); fogo.idle(t, 1.15); lant.forEach((g, i) => { g.rotation.z = Math.sin(t * 1.3 + i) * 0.05; }); } };
};

// ---- 17. A casa que o vento não leva ----------------------------------------------------------------
montadores.juntos = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.34, 1.68], [0.34, 1.68], [0.84, 2.3], [1.0, 2.82], [0, 3.02], [-1.0, 2.82], [-0.84, 2.3]]), pat('dots', '#f7e3b4', '#fcefcd', 0.18), { edge: '#d9c18a' });
  colinas(p, { atras: ['#8ed27a', '#7bc369'], meio: ['#b2e476', '#9dd662'] });
  const so = O.solDePapel(c, { x: 0.08, y: 2.1, z: 0.74, s: 0.66 });
  O.nuvem(c, { x: -0.16, y: 2.46, z: 0.7, s: 0.44 }); O.nuvem(c, { x: 0.16, y: 2.6, z: 0.72, s: 0.34 });
  O.arvore(p.pe(-0.62, 1.48), { s: 0.7, altura: 1.25, copa: '#ff8fb1', listra: '#f4769d', frutas: '#fff4dc', estampa: 'dots' });
  O.arvore(p.pe(0.64, 1.5), { s: 0.66, altura: 1.1, copa: '#74cc58', listra: '#5fb949', flip: -1 });
  const zc = 1.6; const casa = O.casaTijolo(c, { x: 0, y: SOLO, z: zc, s: 0.72 }); O.chamine(casa.raiz, { x: 0.3, y: 1.3, z: 0 });
  const fum = O.fumaca(c, 5, { x: 0.22, y: 1.3, z: zc + 0.01, altura: 0.6, s: 0.7 });
  janelasDeBento(c, { x: 0, zc, s: 0.72, casa });
  // os dois quartos novos, um de cada lado, e a pilha de tijolos de cada irmão
  const quartos = [-1, 1].map((sx) => { const g = p.rig(sx * 0.475, zc - 0.04, 'quarto', 0.6); piece(g, rect(0.42, 0.7, 0, 0.35), pat('brick', '#e06a4e', '#f6dcc0', 0.3), { t: 0.012, edge: '#f6dcc0' }); piece(g, poly([-0.3, 0.68], [0.3, 0.68], [0, 1.0]), pat('shingle', '#7a4fc0', '#6a40ae', 0.24), { t: 0.014, z: 0.012, edge: '#d7d2f5' }); piece(g, ellipse(0.09, 0.09, 0, 0.42, 20), '#ffd77a', { t: 0.006, z: 0.012 }); g.scale.y = 0.001; return g; });
  const pipo = porco(c, 'pipo', { x: -0.65, y: SOLO, z: 2.02, s: 0.62 }); const tico = porco(c, 'tico', { x: 0.65, y: SOLO, z: 2.02, s: 0.64, virado: true });
  const bento = porco(c, 'bento', { x: 0.34, y: SOLO, z: 2.62, s: 0.72, virado: true }); const mae = porco(c, 'mae', { x: -0.34, y: SOLO, z: 2.6, s: 0.72 });
  const flauta = rig(bento.cabeca, 'flauta', { x: 0.12, y: -0.05, z: 0.2 }); piece(flauta, rrect(0.38, 0.032, 0.012, 0.12, -0.03), pat('stripes', '#f4cd5e', '#d9a93f', 0.06), { t: 0.008, jitter: 0 }); flauta.visible = false;
  const flores = []; for (const [x, cor] of [[-0.6, '#fff'], [-0.04, '#ffd24f'], [0.56, '#ff7fa8']]) { const r = p.rig(x, 2.5, 'flor'); O.flor(r, { cor, altura: 0.26 }); flores.push(r); }
  primeiroPlano(p, ['#8fcf4e', '#7bbd42'], ['#ffffff', '#ffd24f', '#ff7fa8']);
  trepadeira(p, -1, 2.28, '#ffd24f', { alto: 1.15 }); poste(p, 1, 2.36, { alto: 1.25, cor: '#ff8fb1' });
  // ação
  tl.grupo('dias'); tl.call(() => audio.tocar('melro', { vol: 0.55 }), 0.05); tl.to(so.g, { y: 2.3 }, 0, 1, ease.out);
  // Pipo e Tico assentam tijolo, cada um o seu quarto
  tl.grupo('quartos');
  [[pipo, quartos[0]], [tico, quartos[1]]].forEach(([q, g], i) => {
    [0.2, 0.4, 0.6, 0.8, 1].forEach((alt, k) => { const t = 0.9 + i * 0.12 + k * 0.42; tl.pulse(q.bracoD, { rz: 1.3 }, t, 0.3); tl.pulse(q.corpo, { y: 0.05 }, t, 0.3); tl.to(g, { sy: 0.84 * alt }, t + 0.1, 0.2, ease.back); tl.call(() => audio.tocar(k % 2 ? 'tijolo2' : 'tijolo', { vol: 0.8 }), t + 0.12); });
  });
  // Bento aprende a tocar flauta
  tl.grupo('flauta');
  tl.call(() => { flauta.visible = true; audio.tocar('sino', { vol: 0.4, dur: 2.2 }); }, 3.2);
  tl.to(bento.bracoD, { rz: 2.2 }, 3.2, 0.25, ease.out); tl.to(bento.bracoE, { rz: -2.2 }, 3.2, 0.25, ease.out);
  tl.run((q) => { flauta.visible = q > 0; if (q > 0 && q < 1) bento.cabeca.rotation.z = Math.sin(q * 24) * 0.07; }, 3.2, 2.2);
  tl.pulse(mae.corpo, { y: 0.08 }, 3.3, 0.4);
  // o vento passa, e a casa nem liga
  tl.grupo('vento');
  tl.call(() => audio.tocar('vento', { vol: 0.5, dur: 1.5 }), 4.2);
  sopro(c, tl, 4.2, 1.1, { x: -0.8, y: 0.9, z: 2.2, alvoX: 0.86, alvoY: 1.0, alvoZ: 2.1, n: 12, largura: 0.5, seed: 41 });
  flores.forEach((r, i) => tl.pulse(r, { rz: -0.42 }, 4.25 + i * 0.1, 0.8));
  [pipo, tico, mae].forEach((q, i) => tl.pulse(q.cabeca, { rz: 0.14 }, 4.3 + i * 0.1, 0.8, ease.wiggle));
  tl.grupo('fim');
  tl.call(() => { audio.tocar('sino', { vol: 0.6 }); audio.tocar('risos', { vol: 0.4, dur: 1.6 }); }, 5.4);
  [pipo, tico, bento, mae].forEach((q, i) => { for (let k = 0; k < 2; k++) tl.pulse(q.corpo, { y: 0.2 }, 5.4 + i * 0.04 + k * 0.5, 0.5); });
  tl.grupo('base');
  return { linha: tl, atores: { mae, pipo, tico, bento }, idle(t) { pipo.idle(t); tico.idle(t); bento.idle(t); mae.idle(t); fum.idle(t); so.raios.rotation.z = t * 0.1; } };
};

// ---- As casas, uma por página. Cada uma nasce no mesmo lugar e no mesmo cenário em que depois será soprada. ----------
/** A tábua torta e a que ficou sobrando: são o capricho de Lulu, e continuam lá quando o Lobo chega. */
function tabuasDeLulu(casa) {
  const m = pat('wood', '#d39757', '#b97a3e', 0.18);
  const torta = rig(casa.raiz, 'tabua-torta', { x: 0, y: 0.74, z: 0.062, rot: 0.26 }); piece(torta, rrect(0.5, 0.075, 0.008), m, { t: 0.012, edge: '#f4d4a6' });
  const sobra = rig(casa.raiz, 'tabua-sobrando', { x: 0.46, y: 0.24, z: 0.062, rot: -0.12 }); piece(sobra, rrect(0.56, 0.07, 0.008), m, { t: 0.012, edge: '#f4d4a6' });
  return [torta, sobra];
}
/** Janela que só aparece com a casa pronta: nas páginas seguintes ela já está lá. */
function janelaQueSurge(c, { x, y, z, r, cor, sombra, fundo = '#452a22' }) {
  const g = rig(c, 'janela', { x, y, z }); piece(g, ellipse(r, r, 0, 0, 28), fundo, { t: 0.004, edge: fundo, jitter: 0 });
  O.molduraJanela(g, { x: 0, y: 0, z: 0.065, r, cor, sombra }); g.scale.setScalar(0.001);
  return g;
}
function notasMusicais(c, x, y, z) {
  return [0, 1, 2, 3].map((i) => { const g = rig(c, 'nota', { x: x + i * 0.04, y, z, s: 0.001 }); piece(g, ellipse(0.028, 0.022, 0, 0, 12), '#3b2a4f', { t: 0.004, jitter: 0, noShadow: true }); piece(g, rect(0.008, 0.08, 0.024, 0.04), '#3b2a4f', { t: 0.004, jitter: 0, noShadow: true }); return g; });
}

montadores['obra-palha'] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[0.02, 1.8], [0.34, 1.8], [0.5, 2.2], [0.1, 2.6], [0.1, 3.02], [-0.5, 3.02], [-0.16, 2.5], [0.1, 2.15]]), pat('stripes', '#f5dfa7', '#efd492', 0.2), { edge: '#d9c18a' });
  colinas(p);
  const so = O.solDePapel(c, { x: -0.08, y: 2.5, z: 0.74, s: 0.7 });
  O.nuvem(c, { x: 0.14, y: 2.6, z: 0.76, s: 0.42 }); O.nuvem(c, { x: -0.2, y: 1.92, z: 0.76, s: 0.42 }); O.nuvem(c, { x: 0.16, y: 1.76, z: 0.78, s: 0.36 });
  O.arvore(p.pe(-0.52, 1.42), { s: 0.80, altura: 1.5, copa: '#79c95a', listra: '#65b64a' });
  O.arvore(p.pe(0.54, 1.46), { s: 0.84, altura: 1.5, copa: '#f49d3f', listra: '#e4892e', frutas: '#e84a5f', flip: -1 });
  const xc = 0.02, zc = 1.78;
  const casa = O.casaPalha(c, { x: xc, y: SOLO, z: zc, s: 0.9 }); casa.raiz.scale.y = 0.001;
  const janela = janelaQueSurge(c, { x: xc + 0.3, y: 0.56, z: zc + 0.1, r: 0.15, cor: '#a8702f', sombra: '#70401f' });
  const monte = p.rig(xc, zc + 0.14, 'monte'); piece(monte, blob([[-0.56, 0], [-0.4, 0.3], [0, 0.56], [0.4, 0.34], [0.56, 0]], 7), pat('straw', '#f2cf63', '#c7972f', 0.26), { t: 0.014, edge: '#fff2c0' }); monte.scale.y = 0.14;
  O.flor(p.pe(0.78, 2.26), { cor: '#ff7fa8', altura: 0.3 }); O.flor(p.pe(0.66, 2.34), { cor: '#ffffff', altura: 0.22 }); O.cogumelo(p.pe(0.86, 2.46), {}); O.arbusto(p.pe(0.74, 2.66), { s: 1.05 }); O.cerca(p.pe(0.56, 2.06), { largura: 0.34 });
  primeiroPlano(p);
  poste(p, -1, 2.2, { cor: '#ffb02e' }); trepadeira(p, 1, 2.42, '#ff8fb1', { alto: 1.35 });
  const pipo = porco(c, 'pipo', { x: -0.68, y: SOLO, z: 2.62, s: 0.92 });
  // ação: dois pulos, três braçadas de palha, e a casa sobe num piscar
  tl.grupo('brincar', { soVoz: true }); tl.pulse(pipo.corpo, { y: 0.16 }, 0, 0.36); tl.pulse(pipo.corpo, { y: 0.16 }, 0.36, 0.36); tl.pulse(pipo.bracoD, { rz: 1.2 }, 0, 0.72);
  tl.grupo('junta');
  [[-0.42, 0.42], [-0.3, 0.72], [-0.36, 1]].forEach(([x, alto], k) => {
    const t = k * 0.46;
    tl.to(pipo.root, { x }, t, 0.2, ease.inOut); passos(tl, pipo, t, 0.2, { n: 2 });
    tl.pulse(pipo.bracoD, { rz: 1.1 }, t + 0.16, 0.26); tl.pulse(pipo.bracoE, { rz: -1.1 }, t + 0.16, 0.26);
    tl.to(monte, { sy: alto }, t + 0.18, 0.22, ease.back); tl.call(() => audio.tocar(k % 2 ? 'palha2' : 'palha', { vol: 0.8, dur: 0.8, pan: -0.2 }), t + 0.18);
  });
  tl.grupo('pronta');
  tl.to(monte, { sy: 0.001 }, 1.42, 0.16, ease.in); tl.to(casa.raiz, { sy: 0.9 }, 1.5, 0.42, ease.back);
  tl.call(() => { audio.tocar('palha2', { vol: 1 }); audio.tocar('pano', { vol: 0.7 }); }, 1.5);
  tl.to(janela, { s: 1 }, 1.86, 0.14, ease.back);
  tl.pulse(casa.raiz, { rz: 0.025 }, 1.9, 0.7, ease.wiggle); // de qualquer jeito: já nasce balançando
  tl.grupo('diz', { soVoz: true }); tl.pulse(pipo.corpo, { y: 0.18 }, 0, 0.36); tl.pulse(pipo.corpo, { y: 0.18 }, 0.36, 0.36); tl.pulse(pipo.bracoD, { rz: 1.6 }, 0, 0.72); tl.pulse(pipo.bracoE, { rz: -1.6 }, 0, 0.72); tl.call(() => audio.tocar('grunhido', { vol: 0.7 }), 0.1);
  tl.grupo('cambalhota');
  const T = 2.7; const passo = 0.42; const xs = [0.02, 0.42, 0.8];
  xs.forEach((x, k) => {
    const t = T + k * passo;
    tl.to(pipo.root, { x, z: 2.45 + k * 0.03 }, t, passo, ease.linear); tl.pulse(pipo.root, { y: 0.2 }, t, passo);
    tl.to(pipo.root, { rz: -(k + 1) * Math.PI * 2 }, t, passo, ease.linear);
    tl.call(() => audio.tocar('porco', { vol: 0.4, taxa: 1.1 + k * 0.08, pan: x * 0.9 }), t);
  });
  tl.to(pipo.root, { x: 1.0 }, T + 3 * passo, 0.24, ease.in); tl.to(pipo.root, tam(pipo, 0.001), T + 3 * passo + 0.1, 0.14, ease.in);
  tl.grupo('base');
  return { linha: tl, atores: { pipo }, provas: { casa: casa.raiz }, idle(t) { pipo.idle(t); so.raios.rotation.z = t * 0.1; } };
};

montadores['obra-madeira'] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.34, 1.75], [0.06, 1.75], [0.24, 2.3], [0.34, 3.02], [-0.44, 3.02], [-0.2, 2.3]]), pat('stripes', '#f0cd8b', '#e8c076', 0.2), { edge: '#c9a764' });
  colinas(p, { atras: ['#b69a5a', '#a48a4d'], meio: ['#cdbb5a', '#bcaa4a'] });
  const so = O.solDePapel(c, { x: 0.06, y: 2.52, z: 0.74, s: 0.72, cor: '#ffbe3c', raio: '#f58a2e' });
  O.nuvem(c, { x: -0.16, y: 2.48, z: 0.7, s: 0.46, listra: '#ffdcc4' }); O.nuvem(c, { x: 0.2, y: 1.8, z: 0.78, s: 0.38, listra: '#ffdcc4' });
  O.arvore(p.pe(-0.54, 1.46), { s: 0.84, altura: 1.5, copa: '#d9702e', listra: '#c46024', frutas: '#ffd24f' });
  O.arvore(p.pe(0.54, 1.5), { s: 0.77, altura: 1.35, copa: '#e8a93a', listra: '#d59729', frutas: '#e84a5f', flip: -1 });
  O.arvore(p.pe(0.76, 2.3), { s: 0.6, altura: 1.5, copa: '#f4c04f', listra: '#e4ad3d', frutas: '#e84a5f', flip: -1 }); // a árvore da flauta de Lulu
  const xc = 0.05, zc = 1.8; const s = 0.95;
  const casa = O.casaMadeira(c, { x: xc, y: SOLO, z: zc, s });
  const [torta, sobra] = tabuasDeLulu(casa); torta.scale.setScalar(0.001); sobra.scale.setScalar(0.001);
  const janelas = [xc + 0.31, xc - 0.33].map((x) => janelaQueSurge(c, { x, y: 0.61, z: zc + 0.08, r: 0.135, cor: '#7a4a26', sombra: '#54301a' }));
  casa.raiz.scale.y = 0.001;
  const monte = p.rig(xc - 0.3, zc + 0.3, 'monte');
  for (let j = 0; j < 5; j++) piece(monte, stroke([[-0.34, 0.03 + j * 0.05], [0.34, 0.05 + j * 0.05]], 0.05), pat('wood', j % 2 ? '#c98a4b' : '#b97a3e', '#9d6833', 0.2), { t: 0.012, z: j * 0.003, jitter: 0.004 });
  O.arbusto(p.pe(0.8, 2.34), { s: 0.95, cor: '#8aa83f', listra: '#7a9733', flor: '#ffd24f' }); O.cogumelo(p.pe(0.6, 2.42), { cor: '#8f5fd8' }); O.flor(p.pe(0.92, 2.6), { cor: '#fff', altura: 0.22 });
  primeiroPlano(p, ['#a9b84a', '#98a83d'], ['#ffd24f', '#f58a2e', '#fff']);
  trepadeira(p, 1, 2.42, '#ffb02e', { alto: 1.2 }); poste(p, -1, 2.26, { cor: '#ffb02e' });
  const tico = porco(c, 'tico', { x: -0.66, y: SOLO, z: 2.62, s: 0.92 });
  const martelo = rig(tico.bracoD, 'martelo', { y: -0.28, z: 0.012, rot: 0.9 }); piece(martelo, rrect(0.028, 0.2, 0.008, 0, 0.08), '#7a4a26', { t: 0.006, jitter: 0 }); piece(martelo, rrect(0.11, 0.05, 0.01, 0, 0.19), '#8f8aa0', { t: 0.008, z: 0.002, jitter: 0 });
  const flauta = rig(tico.cabeca, 'flauta', { x: 0.2, y: -0.02, z: 0.2, rot: -0.2 }); piece(flauta, rrect(0.42, 0.04, 0.014, 0, 0), pat('stripes', '#f4cd5e', '#d9a93f', 0.06), { t: 0.008, edge: '#fff4c0', jitter: 0 }); for (const x of [-0.08, 0, 0.08]) piece(flauta, ellipse(0.009, 0.009, x, 0, 8), '#7a4a26', { t: 0.002, z: 0.009, jitter: 0, noShadow: true }); flauta.visible = false;
  const notas = notasMusicais(c, 0.56, SOLO + 0.74, 2.42);
  // ação: três viagens às pressas, três marteladas e pronto
  tl.grupo('cata');
  tl.to(tico.root, { x: -0.5 }, 0, 0.26, ease.inOut); passos(tl, tico, 0, 0.26, { n: 2 });
  tl.grupo('prega');
  [0.34, 0.66, 0.95].forEach((alto, k) => {
    const t = 0.3 + k * 0.42;
    tl.pulse(tico.bracoD, { rz: 1.2 }, t, 0.2); tl.pulse(tico.bracoD, { rz: 1.2 }, t + 0.2, 0.2);
    tl.call(() => audio.tocar(k % 2 ? 'martelo2' : 'martelo', { vol: 0.8, pan: -0.2 }), t + 0.1); tl.call(() => audio.tocar(k % 2 ? 'martelo' : 'martelo2', { vol: 0.65, pan: -0.2 }), t + 0.3);
    tl.to(casa.raiz, { sy: alto }, t + 0.12, 0.28, ease.back); tl.to(monte, { sy: 1 - (k + 1) / 3 + 0.001 }, t + 0.12, 0.28, ease.out);
  });
  tl.call(() => audio.tocar('range', { vol: 0.8 }), 1.5);
  tl.grupo('tortas');
  janelas.forEach((g) => tl.to(g, { s: 1 }, 1.5, 0.14, ease.back));
  tl.to(torta, { s: 1 }, 1.62, 0.22, ease.back); tl.call(() => audio.tocar('tabuas', { vol: 0.6, dur: 0.5 }), 1.62);
  tl.to(sobra, { s: 1 }, 1.98, 0.22, ease.back); tl.pulse(sobra, { rz: 0.1 }, 2.1, 0.5, ease.wiggle); tl.call(() => audio.tocar('range2', { vol: 0.7 }), 2.0);
  tl.grupo('diz', { soVoz: true }); tl.pulse(tico.corpo, { y: 0.14 }, 0, 0.34); tl.pulse(tico.bracoE, { rz: -1.4 }, 0, 0.68); tl.call(() => audio.tocar('grunhido', { vol: 0.6, taxa: 1.15 }), 0.05);
  tl.grupo('flauta');
  const F = 2.5;
  tl.to(tico.root, { x: 0.6, z: 2.42 }, F, 0.8, ease.inOut); passos(tl, tico, F, 0.8, { n: 5, salto: 0.05 });
  tl.call(() => { martelo.visible = false; }, F + 0.8);
  tl.to(tico.bracoD, { rz: -1.45 }, F + 0.8, 0.25, ease.out); tl.to(tico.bracoE, { rz: -1.8 }, F + 0.8, 0.25, ease.out);
  tl.run((q) => { flauta.visible = q > 0; martelo.visible = q === 0; tico.cabeca.rotation.z = q > 0 && q < 1 ? Math.sin(q * 30) * 0.06 : 0; }, F + 0.8, 2.6);
  tl.call(() => audio.tocar('sino', { vol: 0.4, dur: 2.4 }), F + 0.9);
  notas.forEach((g, i) => { const t = F + 0.95 + i * 0.42; const y0 = g.position.y; tl.to(g, { s: 1 }, t, 0.14, ease.back); tl.to(g, { y: y0 + 0.5, x: g.position.x + 0.12 }, t, 1.1, ease.out); tl.to(g, { s: 0.001 }, t + 0.9, 0.2, ease.in); });
  tl.grupo('base');
  return { linha: tl, atores: { tico }, provas: { casa: casa.raiz }, idle(t) { tico.idle(t); so.raios.rotation.z = t * 0.1; } };
};

montadores['obra-tijolo'] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.2, 1.8], [0.3, 1.8], [0.34, 2.3], [0.36, 2.92], [-0.56, 2.92], [-0.3, 2.3]]), pat('stripes', '#f6d7c2', '#f0c9ad', 0.2), { edge: '#cda38a' });
  colinas(p, { atras: ['#8c70b8', '#7c60aa'], meio: ['#b986ad', '#a9769d'] });
  const so = O.solDePapel(c, { x: 0.02, y: 2.46, z: 0.742, s: 0.72, cor: '#ffcf52', raio: '#ff7e5c' });
  O.nuvem(c, { x: -0.18, y: 2.42, z: 0.72, s: 0.44, cor: '#ffe3ea', listra: '#ffc7d6' }); O.nuvem(c, { x: 0.16, y: 2.0, z: 0.72, s: 0.38, cor: '#ffe3ea', listra: '#ffc7d6' });
  O.arvore(p.pe(-0.54, 1.44), { s: 0.84, altura: 1.55, copa: '#8c4fc0', listra: '#7c40b0', frutas: '#ffd24f', estampa: 'dots' });
  O.arvore(p.pe(0.56, 1.48), { s: 0.74, altura: 1.28, copa: '#e0568e', listra: '#d0467e', frutas: '#fff4dc', flip: -1 });
  const { x: xc, zc, s } = CASA_BENTO;
  const casa = O.casaTijolo(c, { x: xc, y: SOLO, z: zc, s }); O.chamine(casa.raiz, { x: 0.3, y: 1.3, z: 0.0 });
  const jan = janelasDeBento(c, { x: xc, zc, s, casa, surgem: true }); casa.raiz.scale.y = 0.001;
  const mx = xc + 0.5; const monte = p.rig(mx, zc + 0.36, 'monte');
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4 - j; i++) piece(monte, rect(0.15, 0.07, -0.24 + i * 0.16 + j * 0.08, 0.04 + j * 0.075), pat('brick', '#d9583f', '#f6dcc0', 0.3), { t: 0.012, z: j * 0.003, edge: '#f6dcc0' });
  primeiroPlano(p, ['#7fae6a', '#6f9e5a'], ['#ffd24f', '#ff7fa8', '#fff']);
  poste(p, -1, 2.26, { cor: '#ff8fb1' }); trepadeira(p, 1, 2.46, '#ff8fb1', { alto: 1.15 });
  const xa = mx - 0.26, xb = xc + 0.18;
  const bento = porco(c, 'bento', { x: xa, y: SOLO, z: 2.5, s: 0.9, virado: true });
  const carga = rig(bento.corpo, 'carga', { x: 0, y: 0.5, z: 0.14, s: 0.001 }); piece(carga, rect(0.3, 0.13), pat('brick', '#d9583f', '#f6dcc0', 0.3), { t: 0.016, edge: '#f6dcc0' });
  const colher = rig(bento.bracoD, 'colher', { y: -0.28, z: 0.012, rot: 0.8 }); piece(colher, rrect(0.03, 0.16, 0.008, 0, 0.06), '#7a4a26', { t: 0.006, jitter: 0 }); piece(colher, poly([-0.07, 0.14], [0.07, 0.14], [0, 0.3]), '#c7cbd9', { t: 0.006, z: 0.002, edge: '#fff', jitter: 0 });
  const pipo = porco(c, 'pipo', { x: -0.42, y: SOLO, z: 2.5, s: 0.78 }); const vP = escondido(pipo);
  const tico = porco(c, 'tico', { x: -0.7, y: SOLO, z: 2.62, s: 0.82 }); const vT = escondido(tico);
  // Kael leva tijolo por tijolo, sete viagens: a casa sobe de verdade, sem pressa
  tl.grupo('tijolo');
  const fases = [0.14, 0.28, 0.42, 0.56, 0.7, 0.85, 1];
  fases.forEach((alt, k) => {
    const t = k * 0.62;
    tl.to(carga, { s: 1 }, t, 0.06, ease.out); tl.to(bento.root, { x: xb }, t, 0.28, ease.inOut); passos(tl, bento, t, 0.28, { n: 2, salto: 0.03 });
    tl.to(casa.raiz, { sy: alt * s }, t + 0.28, 0.14, ease.back); tl.to(monte, { sy: 1 - (k + 1) / fases.length + 0.001 }, t + 0.28, 0.14, ease.out);
    tl.to(carga, { s: 0.001 }, t + 0.3, 0.05, ease.in);
    tl.call(() => audio.tocar(k % 2 ? 'tijolo2' : 'tijolo', { vol: 1, pan: xb * 0.9 }), t + 0.28);
    tl.to(bento.root, { x: xa }, t + 0.34, 0.24, ease.inOut); passos(tl, bento, t + 0.34, 0.24, { n: 2, salto: 0.03 });
  });
  const FIM = fases.length * 0.62;
  jan.grupos.forEach((g, i) => tl.to(g, { s: 1 }, FIM - 0.1 + i * 0.08, 0.14, ease.back));
  tl.grupo('passam');
  entra(tl, pipo, vP, { x: -0.42, de: 0.5 }, FIM, 0.8); entra(tl, tico, vT, { x: -0.7, de: 0.25 }, FIM + 0.08, 0.8);
  tl.grupo('riem');
  tl.call(() => audio.tocar('risos', { vol: 0.5, dur: 1.4 }), FIM + 0.9);
  [pipo, tico].forEach((q, i) => { for (let k = 0; k < 3; k++) tl.pulse(q.corpo, { y: 0.1 }, FIM + 0.9 + i * 0.05 + k * 0.3, 0.3); tl.pulse(q.cabeca, { rz: 0.1 }, FIM + 0.9, 0.9, ease.wiggle); });
  tl.grupo('massa');
  tl.to(bento.root, { x: xb }, FIM + 1.9, 0.3, ease.inOut); passos(tl, bento, FIM + 1.9, 0.3, { n: 2, salto: 0.03 });
  tl.pulse(bento.bracoD, { rz: 1.3 }, FIM + 2.2, 0.34); tl.pulse(bento.bracoD, { rz: 1.3 }, FIM + 2.54, 0.34); tl.call(() => audio.tocar('tijolo', { vol: 0.5 }), FIM + 2.34); tl.call(() => audio.tocar('tijolo2', { vol: 0.5 }), FIM + 2.68);
  tl.grupo('base');
  return { linha: tl, atores: { pipo, tico, bento }, provas: { casa: casa.raiz }, idle(t) { pipo.idle(t); tico.idle(t); bento.idle(t); so.raios.rotation.z = t * 0.1; } };
};

// ---- O Lobo espiando -----------------------------------------------------------------------------------
montadores.espia = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.46, 1.2], [0.46, 1.2], [0.9, 2.3], [1.02, 2.86], [0, 3.02], [-1.02, 2.86], [-0.9, 2.3]]), pat('dots', '#cfe08f', '#dbe9a6', 0.18), { edge: '#a9c46c' });
  colinas(p, { atras: ['#79c7a4', '#68b793'], meio: ['#a6dd80', '#90cd6c'], z1: 0.86, z2: 1.06 });
  const so = O.solDePapel(c, { x: 0.1, y: 2.44, z: 0.74, s: 0.66 });
  O.nuvem(c, { x: -0.16, y: 2.5, z: 0.72, s: 0.42 }); O.nuvem(c, { x: 0.18, y: 1.96, z: 0.76, s: 0.36 });
  // lá longe, as três casas prontas, cada uma com o seu dono
  const zf = 1.24;
  const cp = O.casaPalha(c, { x: -0.34, y: SOLO, z: zf, s: 0.26 }); const cm = O.casaMadeira(c, { x: 0, y: SOLO, z: zf, s: 0.26 }); const ct = O.casaTijolo(c, { x: 0.34, y: SOLO, z: zf, s: 0.24 }); O.chamine(ct.raiz, { x: 0.3, y: 1.3, z: 0 });
  const fum = O.fumaca(c, 4, { x: 0.41, y: SOLO + 0.4, z: zf + 0.01, altura: 0.34, s: 0.4 });
  const pipo = porco(c, 'pipo', { x: -0.22, y: SOLO, z: zf + 0.16, s: 0.3 }); const tico = porco(c, 'tico', { x: 0.13, y: SOLO, z: zf + 0.16, s: 0.3 }); const bento = porco(c, 'bento', { x: 0.2, y: SOLO, z: zf + 0.18, s: 0.32, virado: true });
  O.arvore(p.pe(0.68, 1.8), { s: 0.76, altura: 1.3, copa: '#3f9a6a', listra: '#338a5c', flip: -1 }); O.arvore(p.pe(-0.74, 1.92), { s: 0.7, altura: 1.2, copa: '#4fa86e', listra: '#429860' });
  // a moita: o Lobo fica atrás dela, com os pés abaixo do chão, e só o focinho aparece
  const xm = -0.56; const zm = 2.46;
  const w = lobo(c, { x: xm, y: -0.5, z: 2.3, s: 0.76 }); w.rabo.rotation.z = 0.8;
  O.arbusto(p.pe(xm - 0.26, zm), { s: 1.9, cor: '#3f9a57', listra: '#338a4b', flor: null }); O.arbusto(p.pe(xm + 0.2, zm + 0.01), { s: 2.1, cor: '#4aa862', listra: '#3d9855', flor: '#ffd24f' }); O.arbusto(p.pe(xm - 0.04, zm + 0.02), { s: 1.7, cor: '#58b957', listra: '#47a549', flor: '#ff7fa8' });
  primeiroPlano(p, ['#6cc05a', '#57ab4b'], ['#ffd24f', '#fff', '#ff7fa8']);
  trepadeira(p, 1, 2.42, '#ffd24f', { alto: 1.15 });
  tl.grupo('moita');
  tl.call(() => audio.tocar('pano', { vol: 0.5, pan: xm }), 0.04);
  tl.to(w.root, { y: -0.3 }, 0.08, 0.4, ease.out); tl.to(w.olho, { sx: 1.15, sy: 1.15 }, 0.2, 0.2);
  tl.grupo('fareja');
  tl.to(w.root, { y: -0.2 }, 1.1, 0.28, ease.out); tl.to(w.cabeca, { rz: 0.2 }, 1.1, 0.3, ease.out);
  for (let k = 0; k < 3; k++) { tl.pulse(w.cabeca, { rz: 0.05 }, 1.4 + k * 0.42, 0.42); tl.call(() => audio.tocar('inspira', { vol: 0.8, taxa: 1.15, pan: xm }), 1.42 + k * 0.42); }
  tl.grupo('palha'); tl.to(w.cabeca, { rz: 0.1 }, 2.8, 0.18); tl.pulse(cp.raiz, { sy: 0.03 }, 2.8, 0.3);
  tl.grupo('madeira'); tl.to(w.cabeca, { rz: 0.05 }, 3.2, 0.18); tl.pulse(cm.raiz, { sy: 0.03 }, 3.2, 0.3);
  tl.grupo('tijolo'); tl.to(w.cabeca, { rz: 0 }, 3.6, 0.18); tl.pulse(ct.raiz, { sy: 0.03 }, 3.6, 0.3);
  tl.grupo('lambe');
  tl.to(w.queixo, { rz: -0.22 }, 4.0, 0.1); tl.to(w.fundoBoca, { sy: 0.8 }, 4.0, 0.1); tl.pulse(w.cabeca, { rz: 0.06 }, 4.0, 0.7, ease.wiggle); tl.call(() => audio.tocar('engolir', { vol: 0.6, pan: xm }), 4.2);
  tl.to(w.queixo, { rz: 0 }, 4.7, 0.1); tl.to(w.fundoBoca, { sy: 0.35 }, 4.7, 0.1);
  // sai da moita e vai, na ponta dos pés, pela direita: na página seguinte ele chega pela esquerda
  tl.grupo('vai');
  tl.to(w.root, { y: SOLO }, 4.9, 0.3, ease.out); tl.call(() => audio.tocar('pano', { vol: 0.5, pan: xm }), 4.9);
  tl.to(w.root, { x: 0.86 }, 5.2, 1.3, ease.inOut); passos(tl, w, 5.2, 1.3, { n: 7, salto: 0.05, perna: 0.32 });
  tl.to(w.root, tam(w, 0.001), 6.34, 0.16, ease.in);
  tl.grupo('base');
  return { linha: tl, atores: { lobo: w }, idle(t) { w.idle(t); w.rabo.rotation.z = 0.8 + Math.sin(t * 2.2) * 0.06; pipo.idle(t); tico.idle(t); bento.idle(t); fum.idle(t); so.raios.rotation.z = t * 0.1; } };
};

// ---- As corridas: quem sai pela direita de uma página entra pela esquerda da outra ------------------------
function corre(tl, q, x, t, dur, { salto = 0.06, perna = 0.62, passada = 0.15 } = {}) {
  tl.to(q.root, { x }, t, dur, ease.linear); passos(tl, q, t, dur, { n: Math.max(2, Math.round(dur / passada)), salto, perna });
}
function pedra(p, x, z, s = 1) { const g = p.pe(x, z, s); piece(g, blob([[-0.16, 0], [-0.13, 0.11], [0, 0.17], [0.13, 0.1], [0.16, 0]], 6), pat('stripes', '#9c98ad', '#8b879d', 0.1), { t: 0.012, edge: '#d8d5e3' }); return g; }

montadores['corrida-lulu'] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.46, 1.2], [0.46, 1.2], [0.9, 2.3], [1.02, 2.86], [0, 3.02], [-1.02, 2.86], [-0.9, 2.3]]), pat('dots', '#d8d97f', '#e4e396', 0.18), { edge: '#b5b65c' });
  p.chao(blob([[-0.03, 1.2], [0.1, 1.2], [0.16, 1.9], [0.08, 2.4], [0.2, 3.0], [-0.14, 3.0], [-0.1, 2.4], [-0.08, 1.9]]), pat('stripes', '#6fc6e6', '#8ad3ec', 0.1), { y: 0.012, edge: '#c8eefa' });
  colinas(p, { atras: ['#b0a95a', '#a0994c'], meio: ['#c6c35a', '#b6b34c'], z1: 0.86, z2: 1.06 });
  const so = O.solDePapel(c, { x: -0.1, y: 2.3, z: 0.74, s: 0.7, cor: '#ffc94a', raio: '#f79a33' });
  O.nuvem(c, { x: 0.16, y: 2.52, z: 0.72, s: 0.42 }); O.nuvem(c, { x: -0.2, y: 1.84, z: 0.76, s: 0.34 });
  // lá adiante, à direita, a casa de Lulu: é para lá que ele corre
  const destino = O.casaMadeira(c, { x: 0.41, y: SOLO, z: 1.55, s: 0.34 });
  O.arvore(p.pe(-0.42, 1.5), { s: 0.8, altura: 1.4, copa: '#c9a03a', listra: '#b78f2c' }); O.arvore(p.pe(-0.76, 2.0), { s: 0.66, altura: 1.15, copa: '#8fb04a', listra: '#7f9f3e' }); O.arvore(p.pe(0.74, 1.9), { s: 0.7, altura: 1.2, copa: '#e8a93a', listra: '#d59729', frutas: '#e84a5f', flip: -1 });
  const ZB = 2.08; // atrás de quem corre, e acima da barra de controles
  const ponte = p.pe(0.03, ZB); const arco = [[-0.34, 0], [-0.2, 0.09], [0, 0.13], [0.2, 0.09], [0.34, 0]];
  piece(ponte, stroke(arco, 0.05), pat('wood', '#a0623a', '#8a5230', 0.12), { t: 0.016, jitter: 0.003 }); piece(ponte, stroke(arco.map(([x, y]) => [x, y + 0.14]), 0.022), pat('wood', '#7a4a26', '#663c1c', 0.12), { t: 0.01, z: -0.008, jitter: 0.003 }); for (const x of [-0.3, -0.1, 0.1, 0.3]) piece(ponte, rect(0.02, 0.15, x, 0.1 * (1 - (x / 0.34) ** 2) + 0.07), '#7a4a26', { t: 0.008, z: -0.008, jitter: 0 });
  pedra(p, -0.56, ZB + 0.02, 0.9);
  primeiroPlano(p, ['#a9b84a', '#98a83d'], ['#ffd24f', '#fff', '#ff7fa8']);
  const pipo = porco(c, 'pipo', { x: -0.9, y: SOLO, z: 2.22, s: 0.84 }); const vP = escondido(pipo);
  const w = lobo(c, { x: -0.9, y: SOLO, z: 2.22, s: 0.74 }); w.rabo.rotation.z = 0.8; const vL = escondido(w);
  // o rastro: palhinhas que caem de João pelo caminho, e que o Lobo vai farejando
  const rastro = [-0.76, -0.4, -0.24, 0.3, 0.56].map((x, i) => { const g = rig(c, 'palhinha', { x, y: SOLO + 0.012, z: 2.16 + (i % 2) * 0.02, s: 0.001, rot: i * 0.7 }); piece(g, stroke([[-0.05, 0], [0.05, 0.012]], 0.012), '#f2cf63', { t: 0.003, jitter: 0, noShadow: true }); return g; });
  const solta = (i, t) => tl.to(rastro[i], { s: 1 }, t, 0.08, ease.out);
  // João não para em nenhum momento: a voz conta a corrida devagar, e ele atravessa a página inteira enquanto ela conta
  tl.grupo('corre');
  tl.to(pipo.root, tam(pipo, vP), 0, 0.14, ease.out); corre(tl, pipo, -0.6, 0, 1.6); solta(0, 0.7); tl.call(() => audio.tocar('guincho', { vol: 0.5, taxa: 1.1, pan: -0.8 }), 0.05);
  tl.grupo('pedra');
  corre(tl, pipo, -0.32, 1.6, 0.8); tl.pulse(pipo.root, { y: 0.24 }, 1.64, 0.5); tl.call(() => audio.tocar('ar', { vol: 0.45, taxa: 1.3, pan: -0.5 }), 1.66); solta(1, 2.3);
  tl.grupo('ponte');
  corre(tl, pipo, 0.37, 2.4, 1.0); tl.pulse(pipo.root, { y: 0.13 }, 2.42, 0.96); solta(2, 2.46);
  [0, 1, 2].forEach((k) => tl.call(() => audio.tocar(k % 2 ? 'tabuas' : 'bate1', { vol: 0.3, dur: 0.2, taxa: 1.2 }), 2.56 + k * 0.26));
  tl.grupo('olhar');
  corre(tl, pipo, 0.5, 3.4, 1.0); solta(3, 3.5);
  // o Lobo vem de focinho baixo, seguindo as palhinhas; João já cansado, mas sem parar
  tl.grupo('lobo');
  corre(tl, pipo, 0.62, 4.4, 2.8, { salto: 0.04, perna: 0.5, passada: 0.24 }); solta(4, 5.6);
  tl.to(w.root, tam(w, vL), 4.4, 0.16, ease.out); tl.to(w.cabeca, { rz: -0.22 }, 4.4, 0.2); corre(tl, w, -0.56, 4.4, 1.2, { perna: 0.5, passada: 0.2 }); tl.pulse(w.root, { y: 0.22 }, 5.2, 0.4); tl.call(() => audio.tocar('inspira', { vol: 0.8, taxa: 1.2, pan: -0.7 }), 4.5);
  corre(tl, w, -0.2, 5.6, 1.6, { perna: 0.5, passada: 0.2 }); tl.call(() => audio.tocar('inspira', { vol: 0.8, taxa: 1.3, pan: -0.3 }), 6.0);
  tl.grupo('grita');
  corre(tl, pipo, 1.0, 7.2, 1.0); tl.to(pipo.root, tam(pipo, 0.001), 8.04, 0.16, ease.in); tl.call(() => audio.tocar('guincho', { vol: 0.55, taxa: 1.2, pan: 0.6 }), 7.2);
  tl.pulse(pipo.bracoD, { rz: 1.5 }, 7.2, 0.5); tl.pulse(pipo.bracoE, { rz: -1.5 }, 7.2, 0.5);
  tl.grupo('lobo2');
  tl.to(w.cabeca, { rz: 0 }, 8.2, 0.2); corre(tl, w, 1.0, 8.2, 1.1, { perna: 0.62 }); tl.pulse(w.root, { y: 0.13 }, 8.22, 0.46); tl.to(w.root, tam(w, 0.001), 9.16, 0.14, ease.in);
  tl.grupo('base');
  return { linha: tl, atores: { pipo, lobo: w }, provas: { destino: destino.raiz }, idle(t) { pipo.idle(t); w.idle(t); w.rabo.rotation.z = 0.8 + Math.sin(t * 6) * 0.1; so.raios.rotation.z = t * 0.1; } };
};

montadores['corrida-kael'] = (p, audio) => {
  const tl = new Timeline(); const c = p.conteudo;
  p.chao(blob([[-0.46, 1.2], [0.46, 1.2], [0.9, 2.3], [1.02, 2.86], [0, 3.02], [-1.02, 2.86], [-0.9, 2.3]]), pat('dots', '#e6b477', '#efc48e', 0.18), { edge: '#c7945c' });
  colinas(p, { atras: ['#a06fa0', '#905f90'], meio: ['#c78a8a', '#b77a7a'], z1: 0.84, z2: 1.0 });
  const so = O.solDePapel(c, { x: -0.07, y: 1.9, z: 0.74, s: 0.7, cor: '#ffcf52', raio: '#ff8e5c' });
  O.nuvem(c, { x: 0.16, y: 2.52, z: 0.72, s: 0.4, cor: '#ffe3ea', listra: '#ffc7d6' });
  // o morro e, lá no alto, a casa de Kael com a chaminé soltando fumaça
  const morro = p.pe(0.04, 1.16);
  piece(morro, blob([[-0.46, 0], [-0.36, 0.3], [-0.12, 0.62], [0.14, 0.66], [0.38, 0.32], [0.48, 0]], 8), pat('chevron', '#b0795c', '#a06c50', 0.3), { t: 0.012, edge: '#d8a988' });
  piece(morro, stroke([[0.14, 0], [0.24, 0.14], [0.06, 0.3], [0.14, 0.46], [0.06, 0.62]], 0.05, { taper: 0.6 }), pat('stripes', '#f0cd8b', '#e8c076', 0.1), { t: 0.004, z: 0.012, jitter: 0 });
  const yt = SOLO + 0.62; const destino = O.casaTijolo(c, { x: 0.06, y: yt, z: 1.2, s: 0.22 }); O.chamine(destino.raiz, { x: 0.3, y: 1.3, z: 0 });
  const fum = O.fumaca(c, 5, { x: 0.126, y: yt + 0.36, z: 1.21, altura: 0.5, s: 0.5 });
  O.arvore(p.pe(-0.66, 1.76), { s: 0.84, altura: 1.5, copa: '#8c4fc0', listra: '#7c40b0', frutas: '#ffd24f', estampa: 'dots' }); O.arvore(p.pe(0.72, 1.84), { s: 0.74, altura: 1.25, copa: '#e0568e', listra: '#d0467e', frutas: '#fff4dc', flip: -1 });
  const ZT = 1.98; const xt = -0.12;
  const tronco = p.pe(xt, ZT); piece(tronco, rrect(0.56, 0.13, 0.05, 0, 0.065), pat('wood', '#8a5230', '#70401f', 0.14), { t: 0.02 }); piece(tronco, ellipse(0.06, 0.065, 0.26, 0.065, 12), pat('dots', '#e7a95c', '#cf9147', 0.08), { t: 0.006, z: 0.012, jitter: 0 });
  primeiroPlano(p, ['#c79a4a', '#b5883e'], ['#ffd24f', '#ff7fa8', '#fff']);
  const pipo = porco(c, 'pipo', { x: -0.86, y: SOLO, z: 2.14, s: 0.82 }); const vP = escondido(pipo);
  const tico = porco(c, 'tico', { x: -0.86, y: SOLO, z: 2.2, s: 0.86 }); const vT = escondido(tico);
  const w = lobo(c, { x: -0.86, y: SOLO, z: 2.14, s: 0.74 }); w.rabo.rotation.z = 0.8; const vL = escondido(w);
  // lá no alto, os dois já pequenininhos, quase na porta de Kael
  const longe = [['pipo', 0.3], ['tico', 0.38]].map(([tipo, x]) => { const q = porco(c, tipo, { x, y: SOLO + 0.28, z: 1.24, s: 0.2 }); const v = escondido(q); return { q, v }; });
  const estrelas = [0, 1, 2].map((i) => { const g = rig(c, 'estrela', { x: 0, y: SOLO + 0.2, z: 2.24, s: 0.001 }); piece(g, star(5, 0.05, 0.022), '#ffd24f', { t: 0.004, edge: '#fff4c0', jitter: 0, noShadow: true }); return g; });
  tl.grupo('correm');
  [[pipo, vP, 0], [tico, vT, 0.34]].forEach(([q, v, d]) => {
    tl.to(q.root, tam(q, v), d, 0.14, ease.out); corre(tl, q, -0.36, d, 0.56); tl.pulse(q.root, { y: 0.28 }, d + 0.42, 0.42); corre(tl, q, 0.3, d + 0.56, 0.66); corre(tl, q, 1.0, d + 1.22, 0.62); tl.to(q.root, tam(q, 0.001), d + 1.7, 0.14, ease.in);
    tl.pulse(q.cabeca, { rz: 0.12 }, d + 0.9, 0.5, ease.wiggle);
  });
  tl.call(() => audio.tocar('guincho', { vol: 0.5, pan: -0.7 }), 0.1); tl.call(() => audio.tocar('guincho', { vol: 0.45, taxa: 1.14, pan: -0.5 }), 0.46);
  tl.grupo('vem');
  tl.to(w.root, tam(w, vL), 2.2, 0.16, ease.out); corre(tl, w, -0.52, 2.2, 0.5, { salto: 0.05 });
  tl.grupo('pula');
  corre(tl, w, -0.34, 2.7, 0.2, { salto: 0.05 }); tl.pulse(w.root, { y: 0.1 }, 2.72, 0.24);
  tl.grupo('plaft');
  // o pé pega no tronco, e ele cai de focinho
  const P = 2.96;
  tl.call(() => { audio.tocar('tombo', { vol: 0.9, pan: -0.2 }); audio.tocar('ar', { vol: 0.5, taxa: 1.4 }); }, P + 0.2);
  tl.to(w.root, { x: 0.1 }, P, 0.22, ease.in); tl.to(w.root, { rz: -1.42 }, P, 0.22, ease.in);
  estrelas.forEach((g, i) => { tl.to(g, { x: 0.46 + i * 0.1, y: SOLO + 0.18 + (i % 2) * 0.1, s: 1 }, P + 0.24, 0.16, ease.back); tl.to(g, { s: 0.001 }, P + 1.3, 0.2, ease.in); tl.pulse(g, { rz: 1 }, P + 0.3, 0.9); });
  tl.pulse(w.pernaF, { rz: 0.4 }, P + 0.3, 0.3); tl.pulse(w.pernaT, { rz: -0.4 }, P + 0.6, 0.3);
  tl.grupo('ai'); tl.call(() => audio.tocar('choro1', { vol: 0.65, pan: 0.1, dur: 0.8 }), P + 0.6);
  tl.grupo('levanta');
  const L = P + 1.5;
  tl.to(w.root, { rz: 0 }, L, 0.3, ease.back); tl.pulse(w.root, { y: 0.1 }, L, 0.3); tl.call(() => audio.tocar('ar', { vol: 0.8, taxa: 0.6, pan: 0.1 }), L + 0.2); tl.pulse(w.corpo, { y: 0.06 }, L + 0.3, 0.3); tl.pulse(w.corpo, { y: 0.06 }, L + 0.6, 0.3);
  tl.grupo('fumaca');
  const F = L + 1;
  longe.forEach(({ q, v }, i) => { tl.to(q.root, tam(q, v), F + i * 0.1, 0.16, ease.out); tl.to(q.root, { x: 0.1 + i * 0.02, y: yt + 0.02 }, F + i * 0.1, 1.2, ease.inOut); passos(tl, q, F + i * 0.1, 1.2, { n: 6, salto: 0.02, perna: 0.5 }); });
  tl.grupo('sai');
  corre(tl, w, 1.0, F + 0.5, 0.9); tl.to(w.root, tam(w, 0.001), F + 1.26, 0.14, ease.in);
  tl.grupo('base');
  return { linha: tl, atores: { pipo, tico, lobo: w }, provas: { destino: destino.raiz }, idle(t) { pipo.idle(t); tico.idle(t); w.idle(t); w.rabo.rotation.z = 0.8 + Math.sin(t * 6) * 0.1; fum.idle(t); so.raios.rotation.z = t * 0.1; } };
};

// ---- Cataplof: mesmo cenário de "Correu, correu", para a virada de página não pular nada --------------------
function cenarioDaFuga(p) {
  const c = p.conteudo;
  p.chao(blob([[-0.3, 1.14], [-0.08, 1.14], [-0.02, 1.7], [0.14, 2.2], [0.4, 2.94], [-0.3, 2.96], [-0.32, 2.2], [-0.44, 1.7]]), pat('stripes', '#7f8fb8', '#7283ac', 0.2), { edge: '#5f7098' });
  colinas(p, { atras: ['#26406e', '#203860'], meio: ['#2c4f74', '#264668'], z1: 0.84, z2: 1.0 });
  O.lua(c, { x: 0.05, y: 2.34, z: 0.74, s: 0.8 });
  for (const [x, y, s] of [[-0.2, 2.5, 0.08], [-0.26, 2.0, 0.05], [0.28, 2.0, 0.05], [-0.04, 2.7, 0.06]]) piece(p.alto(x, y, 0.76), star(5, s, s * 0.45), '#fff0a6', { t: 0.006, edge: '#fff9d6' });
  const morro = p.pe(-0.14, 1.14);
  piece(morro, blob([[-0.3, 0], [-0.26, 0.36], [-0.08, 0.74], [0.1, 0.62], [0.3, 0.18], [0.42, 0]], 8), pat('chevron', '#2f5a78', '#28506c', 0.3), { t: 0.012, edge: '#3f6f8e' });
  piece(morro, stroke([[-0.04, 0], [0.08, 0.16], [-0.08, 0.32], [0.02, 0.5], [-0.05, 0.7]], 0.06, { taper: 0.6 }), pat('stripes', '#7f8fb8', '#7283ac', 0.1), { t: 0.004, z: 0.012, jitter: 0 });
  O.arvore(p.pe(0.46, 1.32), { s: 0.62, altura: 1.1, copa: '#2c6a72', listra: '#245c64', frutas: null });
  const xc = 0.32, zc = 1.86, sc = 0.58;
  const casa = O.casaTijolo(c, { x: xc, y: SOLO, z: zc, s: sc }); O.chamine(casa.raiz, { x: 0.3, y: 1.3, z: 0 });
  const luz = rig(casa.raiz, 'luz-porta', {}); piece(luz, rrect(0.3, 0.5, 0.1, 0, 0.26), '#ffcf7a', { t: 0.002, z: casa.porta.position.z - 0.003, glow: true, jitter: 0 });
  janelasDeBento(c, { x: xc, zc, s: sc, casa });
  const fum = O.fumaca(c, 5, { x: xc + 0.18, y: SOLO + 1.04, z: zc + 0.01, altura: 0.6, s: 0.7 });
  return { c, xc, zc, sc, casa, fum, luz };
}
const POSICOES_NA_PORTA = [['pipo', 0.04, 2.24, 0.62], ['bento', 0.32, 2.2, 0.66], ['tico', 0.62, 2.26, 0.64]];
/** O Lobo depois do tombo: do mesmo jeito no fim de uma página e no começo da outra. */
// onde o Lobo cai: longe o bastante para o rabo em chamas não encostar em João, que para na porta
const XQ = -0.36;
function loboCaido(c, { y = SOLO, escondido: esc = false } = {}) {
  const w = lobo(c, { x: XQ, y, z: 2.3, s: 0.76, virado: true });
  w.chama.scale.setScalar(1); w.fundoBoca.scale.y = 1; w.queixo.rotation.z = -0.28; w.olho.scale.set(1.2, 1.25, 1); w.bracoF.rotation.z = 2.6; w.bracoT.rotation.z = -2.6;
  const estrelas = [0, 1, 2].map((i) => { const g = rig(c, 'estrela', { x: XQ, y: SOLO + 0.8, z: 2.34, s: esc ? 0.001 : 1 }); piece(g, star(5, 0.055, 0.024), '#ffd24f', { t: 0.004, edge: '#fff4c0', jitter: 0, noShadow: true }); return g; });
  const gira = (t) => { estrelas.forEach((g, i) => { const a = t * 3 + i * 2.09; g.position.x = XQ - 0.05 + Math.cos(a) * 0.17; g.position.y = SOLO + 0.72 + Math.sin(a) * 0.05; g.rotation.z = t * 2; }); };
  gira(0);
  return { w, estrelas, gira };
}

montadores.tombo = (p, audio) => {
  const tl = new Timeline(); const { c, xc, zc, sc, casa, fum, luz } = cenarioDaFuga(p);
  luz.scale.setScalar(0.001);
  const ch = { x: xc + 0.3 * sc, y: SOLO + 1.3 * sc + 0.46 * sc * 0.72 };
  const { w, estrelas, gira } = loboCaido(c, { y: ch.y, escondido: true }); const vL = escondido(w); w.root.position.x = ch.x; w.root.position.z = zc + 0.02;
  w.root.rotation.z = 0;
  const atores = Object.fromEntries(POSICOES_NA_PORTA.map(([tipo, x, z, s]) => { const q = porco(c, tipo, { x, y: SOLO, z, s, virado: true }); const v = escondido(q); return [tipo, { q, v, x, z: q.root.position.z }]; }));
  primeiroPlano(p, ['#4a7f74', '#3f7268'], ['#ffd24f', '#ff7fa8', '#fff']);
  poste(p, -1, 2.3, { cor: '#ffd24f' }); trepadeira(p, 1, 2.42, '#ffb02e', { alto: 1.1 });
  const puf = (n, nome) => Array.from({ length: n }, () => { const g = rig(c, nome, { x: 0, y: 0.3, z: 2, s: 0.001 }); piece(g, scallop(0.07, 0.06, 6, 0.16, 0, 0, 5), pat('stripes', '#c9c6dc', '#b6b2ce', 0.08), { t: 0.006, edge: '#ffffff', jitter: 0, noShadow: true }); return g; });
  const fumas = puf(10, 'puf'); const poeira = puf(12, 'poeira');
  const TOPO = { x: 0.08, y: 2.12, z: 1.96 }; const vAlto = vL * 0.62;
  // sobe, sobe, sobe: é a saída do foguete da página anterior, agora vista de fora
  tl.grupo('sobe');
  tl.call(() => { audio.tocar('foguete', { vol: 0.8, pan: ch.x * 0.9 }); audio.tocar('chama', { vol: 0.7, taxa: 0.9 }); }, 0.02);
  tl.to(w.root, tam(w, vL * 0.3), 0, 0.08, ease.out);
  tl.to(w.root, { x: TOPO.x, y: TOPO.y, z: TOPO.z }, 0.02, 1.7, ease.out); tl.to(w.root, tam(w, vAlto), 0.02, 1.7, ease.out);
  tl.to(w.root, { rz: 0.2 }, 0.02, 0.5, ease.out);
  fumas.forEach((g, i) => { const q = (i + 0.5) / fumas.length; const e = 1 - (1 - q) ** 2; const t = 0.05 + q * 1.3; tl.to(g, { x: ch.x + (TOPO.x - ch.x) * e + 0.03, y: ch.y + (TOPO.y - ch.y) * e - 0.04, z: 1.92, s: 0.9 - q * 0.3 }, t, 0.04); tl.to(g, { s: 0.001 }, t + 0.8, 0.4, ease.in); });
  // para no ar: e só agora ele percebe
  tl.grupo('para');
  tl.to(w.root, { rz: 0 }, 1.72, 0.2, ease.out); tl.call(() => audio.tocar('ar', { vol: 0.45, taxa: 0.7 }), 1.74);
  tl.grupo('engole');
  tl.to(w.cabeca, { rz: -0.36 }, 2.1, 0.22, ease.out); tl.to(w.olho, { sx: 1.35, sy: 1.4 }, 2.1, 0.12); tl.to(w.queixo, { rz: -0.1 }, 2.1, 0.12); tl.to(w.fundoBoca, { sy: 0.4 }, 2.1, 0.12);
  tl.call(() => audio.tocar('engolir', { vol: 0.9 }), 2.3); tl.pulse(w.corpo, { y: -0.03 }, 2.3, 0.3);
  tl.grupo('ih');
  tl.pulse(w.cabeca, { rz: 0.05 }, 2.8, 0.5, ease.wiggle);
  // despenca: a altura acelera e o lado não, então a curva é de queda de verdade
  tl.grupo('despenca');
  const Q = 3.4; const DQ = 1.15;
  tl.call(() => { audio.tocar('ar', { vol: 1, taxa: 0.55, pan: [TOPO.x, XQ] }); audio.tocar('vento', { vol: 0.8, dur: DQ, pan: [TOPO.x, XQ] }); audio.tocar('choro2', { vol: 0.6, taxa: 0.9 }); }, Q);
  tl.to(w.cabeca, { rz: 0.1 }, Q, 0.1); tl.to(w.fundoBoca, { sy: 1 }, Q, 0.1); tl.to(w.queixo, { rz: -0.28 }, Q, 0.1); tl.to(w.olho, { sx: 1.2, sy: 1.25 }, Q, 0.1);
  tl.to(w.root, { x: XQ, z: 2.3 }, Q, DQ, ease.linear); tl.to(w.root, { y: SOLO }, Q, DQ, ease.in); tl.to(w.root, tam(w, vL), Q, DQ, ease.in);
  tl.to(w.root, { rz: 2 * Math.PI * 2 }, Q, DQ, ease.linear);
  tl.grupo('cataplof');
  const T = Q + DQ;
  tl.to(w.root, { rz: 0 }, T, 0.001); tl.to(w.cabeca, { rz: 0 }, T, 0.02);
  tl.call(() => { audio.tocar('tombo', { vol: 1, pan: -0.25 }); audio.tocar('tabuas', { vol: 0.5, dur: 0.5, pan: -0.25 }); }, T);
  const sg = Math.sign(w.root.scale.x);
  tl.to(w.root, { sx: sg * vL * 1.3, sy: vL * 0.55 }, T, 0.05, ease.out); tl.to(w.root, { sx: sg * vL, sy: vL }, T + 0.06, 0.4, ease.back);
  poeira.forEach((g, i) => { const a = (i / poeira.length) * Math.PI * 2; const dx = Math.cos(a) * (0.26 + (i % 3) * 0.09); tl.to(g, { x: XQ, y: SOLO + 0.04, z: 2.34, s: 0.5 }, T, 0.01); tl.to(g, { x: XQ + dx, y: SOLO + 0.08 + Math.abs(Math.sin(a)) * 0.22, s: 1.2 + (i % 3) * 0.3, rz: dx * 3 }, T + 0.01, 0.6, ease.out); tl.to(g, { s: 0.001 }, T + 0.75, 0.55, ease.in); });
  tl.pulse(casa.raiz, { rz: 0.012 }, T, 0.5, ease.wiggle);
  tl.grupo('poeira');
  estrelas.forEach((g) => tl.to(g, { s: 1 }, T + 0.45, 0.2, ease.back));
  tl.call(() => audio.tocar('sino', { vol: 0.25, taxa: 1.5, dur: 0.9 }), T + 0.5);
  tl.grupo('saem');
  const S = T + 1.6; const porta = casa.porta;
  tl.call(() => audio.tocar('porta', { vol: 0.8, pan: xc }), S); abrePorta(tl, porta, 0.16, S, 0.24); tl.to(luz, { s: 1 }, S, 0.2, ease.out);
  ['pipo', 'bento', 'tico'].forEach((tipo, i) => { const { q, v, x, z } = atores[tipo]; const t = S + 0.2 + i * 0.26; q.root.position.x = xc; tl.to(q.root, tam(q, v * 0.5), t, 0.1); tl.to(q.root, tam(q, v), t + 0.1, 0.3); tl.to(q.root, { x, z }, t, 0.5, ease.out); passos(tl, q, t, 0.5, { n: 3, salto: 0.04 }); });
  tl.call(() => audio.tocar('grunhido', { vol: 0.7 }), S + 0.3);
  tl.grupo('base');
  const q = (n) => atores[n].q;
  return { linha: tl, atores: { lobo: w, pipo: q('pipo'), tico: q('tico'), bento: q('bento') }, provas: { casa: casa.raiz, chamine: ch }, idle(t) { w.idle(t); w.rabo.rotation.z = 0.32 + Math.sin(t * 12) * 0.14; q('pipo').idle(t); q('tico').idle(t); q('bento').idle(t); fum.idle(t); gira(t); } };
};

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
  const zj = 0.27; for (const [t, x, y] of [['pipo', 0.04, -0.08], ['tico', 0.88, -0.08], ['bento', 0.46, 0.46]]) { porcoNaJanela(g, t, { x, y: y - 0.02, z: zj, s: 0.42 }); O.molduraJanela(g, { x, y, z: zj + 0.065, r: 0.135, cor: '#e9c79c', sombra: '#a0623a' }); }
  O.arvore(g, { x: 1.5, y: -1.0, z: 0.21, s: 1.1, altura: 1.3, copa: '#ff8fb1', listra: '#f4769d', frutas: '#fff4dc', estampa: 'dots', flip: -1 });
  piece(g, wave(5, 0.5, 0.05, 3, 1), pat('grass', '#a8dc62', '#92cb50', 0.4), { y: -1.42, z: 0.34, t: 0.012 });
  const w = loboBase(g, { x: -0.86, y: -1.14, z: 0.4, s: 1.32 }); w.rabo.rotation.z = 0.7; w.peito.scale.set(1.18, 1.13, 1); w.bochecha.scale.setScalar(1); w.cabeca.rotation.z = 0.08; w.bracoF.rotation.z = 0.9;
  for (const [x, st] of [[-0.05, 0], [0.14, 2], [0.32, 4]]) { const a = group(g, { x, y: 0.1 + st * 0.03, z: 0.42 }); piece(a, stroke([[-0.16, 0], [0, 0.03], [0.16, 0]], 0.028, { taper: 0.75 }), '#fff8ee', { t: 0.004, edge: '#fff', jitter: 0 }); }
  piece(g, wave(5, 0.27, 0.03, 4, 0.5), pat('grass', '#6cc05a', '#57ab4b', 0.28), { y: -1.42, z: 0.48, t: 0.012 });
  for (const [x, c2] of [[-1.5, '#ffd24f'], [0.22, '#ffffff'], [0.82, '#ff7fa8'], [1.5, '#ffd24f']]) O.flor(g, { x, y: -1.28, z: 0.5, cor: c2, altura: 0.2, s: 1.1 });
  g.traverse((o) => { if (o.isMesh) { o.receiveShadow = true; } });
  const cam = new THREE.OrthographicCamera(-1.75, 1.75, 1.66, -1.66, 0.1, 20); cam.position.set(0, 0, 8); cam.lookAt(0, 0, 0);
  const antes = renderer.getRenderTarget(); renderer.setRenderTarget(rt); renderer.render(s, cam);
  const px = new Uint8Array(W * A * 4); renderer.readRenderTargetPixels(rt, 0, 0, W, A, px); renderer.setRenderTarget(antes);
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = A; const ctx = canvas.getContext('2d'); const img = ctx.createImageData(W, A);
  for (let y = 0; y < A; y++) { const a = y * W * 4, b = (A - 1 - y) * W * 4; img.data.set(px.subarray(a, a + W * 4), b); }
  ctx.putImageData(img, 0, 0);
  const geometrias = new Set();
  g.traverse((o) => { if (o.geometry) geometrias.add(o.geometry); });
  geometrias.forEach((geometria) => geometria.dispose());
  renderer.renderLists.dispose();
  rt.dispose(); d.shadow.map?.dispose();
  return canvas;
}

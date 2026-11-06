// Personagens de recorte: cada parte móvel é um rig; o resto se funde em poucas chamadas de desenho.
import { piece, rig, ellipse, rrect, blob, stroke, spiral, flame, poly, pat, star, shade } from './paper.js';

const pilha = (parent, passo = 0.007, inicio = 0) => { let z = inicio; const f = (pts, paint, o = {}) => { z += passo; return piece(parent, pts, paint, { t: 0.008, z, ...o }); }; f.z = () => z; f.salto = (d) => { z += d; }; return f; };

const ROUPAS = {
  pipo: { pele: '#f7a7b5', pele2: '#ed8ea2', estampa: pat('dots', '#f7a7b5', '#f9b8c3', 0.22), roupa: pat('gingham', '#ffd24f', '#f39c2d', 0.2), alca: '#c9702a', botao: '#8a4a1c' },
  tico: { pele: '#f4a0a8', pele2: '#e68593', estampa: pat('stripes', '#f4a0a8', '#f7b1b6', 0.24), roupa: pat('diagonal', '#5fc276', '#46a862', 0.2), alca: '#2f7a48', botao: '#fff4d6' },
  bento: { pele: '#f29cb2', pele2: '#df7f9a', estampa: pat('chevron', '#f29cb2', '#f6afc0', 0.26), roupa: pat('vstripes', '#4f86e0', '#3f72c8', 0.22), alca: '#2a4f99', botao: '#ffd24f' },
  mae: { pele: '#f39cad', pele2: '#e37f96', estampa: pat('dots', '#f39cad', '#f7b5c1', 0.22), roupa: pat('dots', '#b66ae0', '#d59af0', 0.22), alca: '#7d3fb0', botao: '#fff' },
};

/** Porquinho: y=0 nos pés, altura ~1. tipo: pipo | tico | bento | mae. */
export function porco(parent, tipo, { x = 0, y = 0, z = 0, s = 1, virado = false } = {}) {
  const c = ROUPAS[tipo];
  const root = rig(parent, `porco-${tipo}`, { x, y, z, s, sx: virado ? -s : s });
  const corpo = rig(root, 'corpo');
  const f = pilha(corpo);
  // rabo e pernas atrás
  const rabo = rig(corpo, 'rabo', { x: 0.27, y: 0.34, z: 0.002 });
  piece(rabo, spiral(0.075, 1.5, 0.03), c.pele2, { t: 0.008 });
  const pernaE = rig(corpo, 'pernaE', { x: -0.125, y: 0.27, z: 0.006 });
  const pernaD = rig(corpo, 'pernaD', { x: 0.125, y: 0.27, z: 0.006 });
  for (const p of [pernaE, pernaD]) {
    piece(p, rrect(0.135, 0.27, 0.05, 0, -0.13), c.pele, { t: 0.008 });
    piece(p, rrect(0.16, 0.075, 0.03, 0, -0.245), '#6b3a4a', { t: 0.008, z: 0.006 });
  }
  f.salto(0.01);
  const bracoT = rig(corpo, 'bracoE', { x: -0.255, y: 0.56, z: f.z() + 0.001, rot: -0.2 });
  piece(bracoT, rrect(0.105, 0.3, 0.05, 0, -0.13), c.pele, { t: 0.008 });
  piece(bracoT, ellipse(0.065, 0.06, 0, -0.27, 14), c.pele2, { t: 0.008, z: 0.004 });
  f.salto(0.01);
  // tronco
  f(blob([[-0.28, 0.46], [-0.26, 0.64], [0, 0.73], [0.26, 0.64], [0.28, 0.46], [0.25, 0.27], [0, 0.2], [-0.25, 0.27]]), c.estampa, { name: 'tronco' });
  if (tipo === 'mae') {
    f(blob([[-0.25, 0.62], [0, 0.68], [0.25, 0.62], [0.31, 0.32], [0.36, 0.11], [0, 0.07], [-0.36, 0.11], [-0.31, 0.32]]), c.roupa);
    f(blob([[-0.16, 0.5], [0.16, 0.5], [0.21, 0.13], [0, 0.09], [-0.21, 0.13]]), pat('plain', '#fff7ea'), { edge: '#f2d7b0' });
    f(ellipse(0.058, 0.045, 0, 0.38, 14), '#ef7fa0');
    f(ellipse(0.058, 0.045, 0, 0.27, 14), '#ef7fa0');
  } else {
    // macacão
    f(blob([[-0.26, 0.42], [0, 0.44], [0.26, 0.42], [0.25, 0.27], [0, 0.17], [-0.25, 0.27]]), c.roupa);
    f(rrect(0.27, 0.2, 0.03, 0, 0.5), c.roupa);
    f(stroke([[-0.12, 0.58], [-0.17, 0.72]], 0.05), c.alca, { jitter: 0 });
    f(stroke([[0.12, 0.58], [0.17, 0.72]], 0.05), c.alca, { jitter: 0 });
    f(ellipse(0.024, 0.024, -0.11, 0.56, 10), c.botao, { jitter: 0 });
    f(ellipse(0.024, 0.024, 0.11, 0.56, 10), c.botao, { jitter: 0 });
    f(rrect(0.13, 0.085, 0.015, 0, 0.47), pat('plain', shade(c.alca, 0.08)));
  }
  f.salto(0.006);
  const bracoF = rig(corpo, 'bracoD', { x: 0.255, y: 0.56, z: f.z() + 0.001, rot: 0.2 });
  piece(bracoF, rrect(0.105, 0.3, 0.05, 0, -0.13), c.pele, { t: 0.008 });
  piece(bracoF, ellipse(0.065, 0.06, 0, -0.27, 14), c.pele2, { t: 0.008, z: 0.004 });
  f.salto(0.012);
  // cabeça
  const cabeca = rig(corpo, 'cabeca', { x: 0, y: 0.68, z: f.z() });
  const h = pilha(cabeca);
  const orelhaE = rig(cabeca, 'orelhaE', { x: -0.205, y: 0.28, z: 0.001, rot: 0.25 });
  const orelhaD = rig(cabeca, 'orelhaD', { x: 0.205, y: 0.28, z: 0.001, rot: -0.25 });
  for (const o of [orelhaE, orelhaD]) {
    piece(o, blob([[-0.085, -0.03], [0.085, -0.03], [0.065, 0.09], [0, 0.165], [-0.065, 0.09]], 5), c.pele, { t: 0.008 });
    piece(o, blob([[-0.045, -0.01], [0.045, -0.01], [0.03, 0.07], [0, 0.115], [-0.03, 0.07]], 4), c.pele2, { t: 0.008, z: 0.005 });
  }
  h.salto(0.008);
  h(ellipse(0.315, 0.275, 0, 0.14, 40), c.estampa, { name: 'rosto' });
  h(ellipse(0.075, 0.05, -0.215, 0.045, 18), '#f77f98', { jitter: 0.001 });
  h(ellipse(0.075, 0.05, 0.215, 0.045, 18), '#f77f98', { jitter: 0.001 });
  // olhos piscam
  const olhos = rig(cabeca, 'olhos', { y: 0.175, z: h.z() + 0.001 });
  for (const sx of [-1, 1]) {
    piece(olhos, ellipse(0.078, 0.092, sx * 0.118, 0, 24), '#fffdf4', { t: 0.006, edge: '#e8d9c4', jitter: 0.001 });
    piece(olhos, ellipse(0.054, 0.066, sx * 0.112, -0.008, 22), '#2d1c2f', { t: 0.006, z: 0.005, jitter: 0 });
    piece(olhos, ellipse(0.018, 0.021, sx * 0.112 + 0.02, 0.022, 10), '#ffffff', { t: 0.004, z: 0.01, jitter: 0 });
  }
  h.salto(0.012);
  // focinho
  h(ellipse(0.135, 0.098, 0, 0.03, 30), c.pele2, { edge: '#fbd0d6', jitter: 0.001 });
  h(ellipse(0.024, 0.036, -0.048, 0.035, 12), '#9c4560', { jitter: 0 });
  h(ellipse(0.024, 0.036, 0.048, 0.035, 12), '#9c4560', { jitter: 0 });
  h(stroke([[-0.09, -0.085], [-0.035, -0.112], [0.035, -0.112], [0.09, -0.085]], 0.018), '#7c2c49', { jitter: 0 });
  // boca: fechada, sobra o sorriso de sempre; aberta só enquanto o porquinho fala
  const boca = rig(cabeca, 'boca', { y: -0.098, z: h.z() + 0.002, sy: 0.001 });
  piece(boca, ellipse(0.062, 0.058, 0, -0.022, 18), '#7c2c49', { t: 0.004, jitter: 0 });
  piece(boca, ellipse(0.04, 0.026, 0, -0.05, 14), '#ef7fa0', { t: 0.002, z: 0.003, jitter: 0 });
  const refs = { root, corpo, cabeca, boca, bracoE: bracoT, bracoD: bracoF, olhos, orelhaE, orelhaD, rabo, pernaE, pernaD };
  // acessórios
  if (tipo === 'pipo') {
    const ch = rig(cabeca, 'chapeu', { y: 0.33, z: h.z() + 0.003, rot: -0.08 });
    piece(ch, ellipse(0.31, 0.055, 0, -0.01, 26), pat('straw', '#f2cf63', '#c7972f', 0.2), { t: 0.008, edge: '#c7972f' });
    piece(ch, blob([[-0.15, 0.0], [0.15, 0.0], [0.13, 0.12], [0, 0.15], [-0.13, 0.12]], 5), pat('straw', '#f6d873', '#c7972f', 0.2), { t: 0.008, z: 0.004, edge: '#c7972f' });
    piece(ch, rrect(0.3, 0.038, 0.01, 0, 0.022), '#e0446a', { t: 0.006, z: 0.009 });
    refs.chapeu = ch;
  } else if (tipo === 'tico') {
    const ch = rig(cabeca, 'chapeu', { y: 0.31, z: h.z() + 0.003, rot: 0.06 });
    piece(ch, blob([[-0.2, -0.02], [0.2, -0.02], [0.17, 0.1], [0, 0.15], [-0.17, 0.1]], 5), pat('stripes', '#e84a5f', '#c8384c', 0.14), { t: 0.008 });
    piece(ch, blob([[0.08, -0.05], [0.34, -0.06], [0.33, -0.015], [0.08, 0.01]], 3), '#a82c3e', { t: 0.008, z: 0.004 });
    refs.chapeu = ch;
  } else if (tipo === 'bento') {
    const ch = rig(cabeca, 'chapeu', { y: 0.31, z: h.z() + 0.003 });
    piece(ch, blob([[-0.23, -0.02], [0.23, -0.02], [0.2, 0.09], [0, 0.17], [-0.2, 0.09]], 5), pat('plain', '#ffc531'), { t: 0.008, edge: '#d19712' });
    piece(ch, rrect(0.5, 0.04, 0.015, 0, -0.02), '#f0ae1f', { t: 0.008, z: 0.004 });
    piece(ch, rrect(0.05, 0.13, 0.015, 0, 0.08), '#f0ae1f', { t: 0.006, z: 0.006 });
    refs.chapeu = ch;
  } else if (tipo === 'mae') {
    const flor = rig(cabeca, 'flor', { x: 0.17, y: 0.34, z: h.z() + 0.003 });
    piece(flor, star(7, 0.09, 0.055), '#ff7fa8', { t: 0.006 }); piece(flor, ellipse(0.032, 0.032, 0, 0, 12), '#ffd24f', { t: 0.006, z: 0.004 });
    h(stroke([[-0.09, 0.27], [-0.14, 0.255]], 0.012), '#2d1c2f', { jitter: 0 });
    h(stroke([[0.09, 0.27], [0.14, 0.255]], 0.012), '#2d1c2f', { jitter: 0 });
  }
  const fase = Math.abs(x * 7 + z * 3) % 6.28;
  // A respiração soma ao que a linha do tempo escreveu neste quadro: antes, ela apagava os pulos e os gestos de cabeça.
  const soma = { y: 0, yEscrito: corpo.position.y, yBase: corpo.position.y, z: 0, zEscrito: cabeca.rotation.z, zBase: cabeca.rotation.z };
  refs.idle = (t) => {
    if (corpo.position.y !== soma.yEscrito) soma.yBase = corpo.position.y;
    if (cabeca.rotation.z !== soma.zEscrito) soma.zBase = cabeca.rotation.z;
    soma.yEscrito = corpo.position.y = soma.yBase + Math.abs(Math.sin(t * 1.5 + fase)) * 0.011;
    soma.zEscrito = cabeca.rotation.z = soma.zBase + Math.sin(t * 0.9 + fase) * 0.035;
    const pisca = (t * 0.37 + fase) % 1; olhos.scale.y = pisca < 0.035 ? 0.12 : 1;
    orelhaE.rotation.z = 0.25 + Math.sin(t * 1.3 + fase) * 0.05; orelhaD.rotation.z = -0.25 - Math.sin(t * 1.4 + fase) * 0.05;
  };
  return refs;
}

/** Só a cabeça, para espiar da janela. */
export function porcoNaJanela(parent, tipo, { x = 0, y = 0, z = 0, s = 1 } = {}) {
  const p = porco(parent, tipo, { x, y: y - 0.7 * s, z, s });
  p.bracoE.visible = false; p.bracoD.visible = false; p.pernaE.visible = false; p.pernaD.visible = false; p.rabo.visible = false;
  return p;
}

/** Lobo olhando para +x. y=0 nos pés; altura ~1,4 com as orelhas. */
export function lobo(parent, { x = 0, y = 0, z = 0, s = 1, virado = false } = {}) {
  const pelo = pat('chevron', '#a9b0ad', '#9fa7a3', 0.16); const pelo2 = pat('chevron', '#929d99', '#89958f', 0.16); const creme = pat('plain', '#ece8d8');
  const root = rig(parent, 'lobo', { x, y, z, s, sx: virado ? -s : s });
  const corpo = rig(root, 'corpo');
  // rabo e chama
  const rabo = rig(corpo, 'rabo', { x: -0.22, y: 0.46, z: 0.001, rot: 0.32 });
  piece(rabo, blob([[0.03, -0.05], [0.04, 0.06], [-0.18, 0.15], [-0.4, 0.13], [-0.57, 0.17], [-0.52, 0.06], [-0.58, -0.02], [-0.42, -0.06], [-0.2, -0.08]]), pelo2, { t: 0.008, edge: '#d8ded5' });
  piece(rabo, blob([[-0.38, -0.06], [-0.4, 0.13], [-0.57, 0.17], [-0.52, 0.06], [-0.58, -0.02]]), creme, { t: 0.008, z: 0.005 });
  const chama = rig(rabo, 'chama', { x: -0.52, y: 0.08, z: 0.012, rot: 1.25, s: 0.001 });
  piece(chama, flame(0.3, 0.44), '#f35a30', { t: 0.006, glow: true }); piece(chama, flame(0.19, 0.29), '#ffb02e', { t: 0.006, z: 0.004, glow: true }); piece(chama, flame(0.09, 0.15), '#fff0a0', { t: 0.006, z: 0.008, glow: true });
  // perna e braço de trás
  const pernaT = rig(corpo, 'pernaT', { x: -0.09, y: 0.42, z: 0.008 });
  piece(pernaT, stroke([[0, 0], [-0.05, -0.2], [-0.03, -0.38]], 0.15), pelo2, { t: 0.008, jitter: 0.002 });
  piece(pernaT, blob([[-0.1, -0.42], [0.11, -0.43], [0.14, -0.37], [0, -0.32], [-0.1, -0.35]], 5), creme, { t: 0.008, z: 0.005, edge: '#d8ded5' });
  const bracoT = rig(corpo, 'bracoT', { x: -0.08, y: 0.8, z: 0.012, rot: -0.35 });
  piece(bracoT, stroke([[0, 0], [-0.04, -0.2], [0, -0.36]], 0.15), pelo2, { t: 0.008, jitter: 0.002 });
  piece(bracoT, ellipse(0.08, 0.075, 0, -0.39, 18), creme, { t: 0.008, z: 0.004 });
  // tronco que enche
  const peito = rig(corpo, 'peito', { x: 0, y: 0.62, z: 0.022 });
  const f = pilha(peito);
  f(blob([[-0.2, 0.2], [0.17, 0.25], [0.26, 0.04], [0.24, -0.19], [0.14, -0.31], [-0.14, -0.31], [-0.25, -0.15], [-0.25, 0.08]]), pelo, { edge: '#d8ded5', name: 'tronco' });
  f(blob([[-0.04, 0.19], [0.17, 0.16], [0.24, -0.07], [0.17, -0.24], [0, -0.29], [-0.16, -0.18], [-0.16, 0.04]]), creme, { edge: '#d9d6c7' });
  // perna da frente
  const pernaF = rig(corpo, 'pernaF', { x: 0.1, y: 0.42, z: 0.05 });
  piece(pernaF, stroke([[0, 0.02], [0.03, -0.2], [0.01, -0.38]], 0.16), pelo, { t: 0.008, jitter: 0.002, edge: '#d8ded5' });
  piece(pernaF, blob([[-0.08, -0.43], [0.2, -0.44], [0.21, -0.36], [0.06, -0.3], [-0.08, -0.35]], 5), creme, { t: 0.008, z: 0.005 });
  const lenco = rig(corpo, 'lenco', { x: -0.02, y: 0.85, z: 0.058 });
  piece(lenco, blob([[-0.23, 0.04], [0.17, 0.025], [0.22, -0.045], [0.02, -0.1], [-0.22, -0.05]], 5), '#249dcc', { t: 0.008, edge: '#85d2e7' });
  piece(lenco, blob([[-0.18, -0.03], [-0.03, -0.06], [-0.1, -0.23], [-0.2, -0.3], [-0.24, -0.12]], 4), '#279dca', { t: 0.008, z: 0.005, edge: '#77c8e2' });
  piece(lenco, blob([[-0.17, -0.04], [-0.25, -0.1], [-0.34, -0.15], [-0.29, -0.02]], 4), '#1684b5', { t: 0.008, z: 0.003 });
  // cabeça
  const cabeca = rig(corpo, 'cabeca', { x: 0.03, y: 0.87, z: 0.066 });
  const h = pilha(cabeca);
  const orelhaT = rig(cabeca, 'orelhaT', { x: -0.14, y: 0.27, z: 0.0005, rot: 0.2 });
  piece(orelhaT, blob([[-0.08, -0.02], [0.09, -0.02], [0.07, 0.18], [0.02, 0.29], [-0.03, 0.3], [-0.08, 0.19]], 5), pelo2, { t: 0.008 });
  piece(orelhaT, blob([[-0.04, 0.02], [0.04, 0.02], [0.03, 0.17], [-0.015, 0.24], [-0.04, 0.17]], 5), creme, { t: 0.006, z: 0.004 });
  const orelhaF = rig(cabeca, 'orelhaF', { x: 0.02, y: 0.28, z: 0.004, rot: -0.1 });
  piece(orelhaF, blob([[-0.09, -0.02], [0.09, -0.02], [0.085, 0.17], [0.04, 0.29], [-0.015, 0.3], [-0.07, 0.2]], 5), pelo, { t: 0.008, edge: '#d8ded5' });
  piece(orelhaF, blob([[-0.045, 0.015], [0.045, 0.015], [0.045, 0.15], [0.015, 0.24], [-0.025, 0.21], [-0.045, 0.12]], 5), creme, { t: 0.006, z: 0.006 });
  h.salto(0.012);
  // boca: fundo e queixo
  const queixo = rig(cabeca, 'queixo', { x: 0.17, y: -0.075, z: h.z() });
  piece(queixo, blob([[-0.08, 0.04], [0.3, 0.015], [0.31, -0.03], [0.14, -0.09], [-0.03, -0.1], [-0.11, -0.03]], 5), creme, { t: 0.008, edge: '#d9d6c7' });
  piece(queixo, poly([0.08, -0.002], [0.11, 0.05], [0.14, -0.006]), '#fffaf0', { t: 0.004, z: 0.006, jitter: 0, edge: '#fff' });
  piece(queixo, poly([0.19, -0.004], [0.22, 0.046], [0.25, -0.006]), '#fffaf0', { t: 0.004, z: 0.006, jitter: 0, edge: '#fff' });
  h.salto(0.012);
  const fundoBoca = rig(cabeca, 'fundoBoca', { x: 0.19, y: -0.03, z: h.z(), sy: 0.35 });
  piece(fundoBoca, blob([[-0.12, 0.02], [0.24, 0.01], [0.26, -0.07], [0.07, -0.11], [-0.12, -0.08]], 5), '#65494b', { t: 0.004, edge: '#65494b' });
  piece(fundoBoca, ellipse(0.1, 0.035, 0.06, -0.075, 14), '#ef6f8e', { t: 0.004, z: 0.003 });
  h.salto(0.01);
  h(blob([[-0.25, -0.02], [-0.27, 0.18], [-0.18, 0.32], [-0.02, 0.37], [0.15, 0.32], [0.28, 0.23], [0.43, 0.18], [0.52, 0.08], [0.49, -0.025], [0.3, -0.085], [0.08, -0.14], [-0.12, -0.14]]), pelo, { edge: '#d8ded5', name: 'rosto' });
  // tufos
  h(poly([-0.2, 0.12], [-0.32, 0.08], [-0.27, 0.03], [-0.34, -0.025], [-0.24, -0.045], [-0.28, -0.1], [-0.18, -0.11], [-0.2, -0.16], [-0.08, -0.12], [-0.02, 0.04]), creme, { edge: '#d9d6c7' });
  h(blob([[0.04, -0.1], [0.055, 0.07], [0.18, 0.16], [0.38, 0.175], [0.54, 0.11], [0.54, -0.015], [0.36, -0.085], [0.17, -0.12]], 6), pat('plain', '#cdd2c9'), { edge: '#e5e4d7' });
  // dentes de cima
  h(rrect(0.047, 0.055, 0.015, 0.245, -0.095), '#fffaf0', { jitter: 0, t: 0.004, edge: '#fff' });
  h(rrect(0.044, 0.05, 0.014, 0.35, -0.08), '#fffaf0', { jitter: 0, t: 0.004, edge: '#fff' });
  h(ellipse(0.112, 0.09, 0.5, 0.098, 30), '#454344', { jitter: 0, name: 'nariz' });
  h(ellipse(0.032, 0.017, 0.475, 0.139, 14), '#6d6b68', { jitter: 0, t: 0.003 });
  // bochecha cheia (sopro) e rubor
  const bochecha = rig(cabeca, 'bochecha', { x: 0.2, y: 0.015, z: h.z() + 0.003, s: 0.001 });
  piece(bochecha, ellipse(0.17, 0.15, 0, 0, 26), pat('dots', '#ece8d8', '#dfd9cd', 0.14), { t: 0.006, edge: '#d9d6c7' });
  piece(bochecha, ellipse(0.075, 0.05, 0.02, -0.02, 14), '#f49ab0', { t: 0.004, z: 0.005 });
  const roxo = rig(cabeca, 'roxo', { x: 0.1, y: 0.1, z: h.z() + 0.008, s: 0.001 });
  piece(roxo, ellipse(0.18, 0.13, 0, 0, 22), '#b13bb0', { t: 0.003, edge: '#b13bb0' });
  // olho
  const olhoLonge = rig(cabeca, 'olhoLonge', { x: -0.075, y: 0.215, z: h.z() + 0.009 });
  piece(olhoLonge, ellipse(0.06, 0.091, 0, 0, 24), '#fffdf4', { t: 0.006, edge: '#d8ded5', jitter: 0.001 });
  piece(olhoLonge, ellipse(0.033, 0.062, 0.017, -0.007, 22), '#252c2c', { t: 0.006, z: 0.005, jitter: 0 });
  piece(olhoLonge, ellipse(0.012, 0.017, 0.027, 0.015, 10), '#ffffff', { t: 0.004, z: 0.01, jitter: 0 });
  h(stroke([[-0.13, 0.315], [-0.09, 0.34], [-0.035, 0.323]], 0.027), '#8c7b67', { jitter: 0 });
  const olho = rig(cabeca, 'olho', { x: 0.075, y: 0.215, z: h.z() + 0.012 });
  piece(olho, ellipse(0.09, 0.11, 0, 0, 26), '#fffdf4', { t: 0.006, edge: '#d8ded5', jitter: 0.001 });
  const pupila = rig(olho, 'pupila', { x: 0.024, y: -0.008, z: 0.005 });
  piece(pupila, ellipse(0.05, 0.073, 0, 0, 24), '#252c2c', { t: 0.006, jitter: 0 });
  piece(pupila, ellipse(0.018, 0.018, 0.018, 0.022, 8), '#ffffff', { t: 0.004, z: 0.005, jitter: 0 });
  const sobr = rig(cabeca, 'sobrancelha', { x: 0.08, y: 0.35, z: h.z() + 0.022, rot: -0.08 });
  piece(sobr, stroke([[-0.1, -0.008], [-0.025, 0.025], [0.035, 0.02], [0.1, -0.015]], 0.034, { taper: 0.35 }), '#8c7b67', { t: 0.006, jitter: 0 });
  // braço da frente
  const bracoF = rig(corpo, 'bracoF', { x: 0.03, y: 0.78, z: 0.12, rot: 0.25 });
  piece(bracoF, stroke([[0, 0], [0.04, -0.2], [0.03, -0.35]], 0.15), pelo, { t: 0.008, jitter: 0.002, edge: '#d8ded5' });
  piece(bracoF, ellipse(0.085, 0.075, 0.03, -0.385, 20), creme, { t: 0.008, z: 0.004 });
  for (const dx of [-0.025, 0.02, 0.065]) piece(bracoF, ellipse(0.014, 0.021, dx, -0.44, 10), '#454344', { t: 0.004, z: 0.008, jitter: 0 });
  const fase = Math.abs(x * 5 + z * 2) % 6.28;
  const refs = { root, corpo, cabeca, queixo, fundoBoca, peito, bochecha, roxo, rabo, chama, olho, olhoLonge, pupila, sobr, lenco, bracoF, bracoT, pernaF, pernaT, orelhaF, orelhaT };
  refs.idle = (t) => {
    corpo.position.y = Math.sin(t * 1.5 + fase) * 0.006;
    rabo.rotation.z = 0.32 + Math.sin(t * 2.2 + fase) * 0.06;
    const pisca = (t * 0.27 + fase) % 1; olho.scale.y = pisca < 0.03 ? 0.15 : 1;
    olhoLonge.scale.y = olho.scale.y;
    orelhaF.rotation.z = -0.1 + Math.sin(t * 1.1 + fase) * 0.04;
  };
  return refs;
}

// Cenografia de recorte: casas, árvores, nuvens e miudezas.
import { piece, rig, group, ellipse, rect, rrect, blob, stroke, poly, pat, star, scallop, cloud, flame, heart, shade, rng } from './paper.js';

const pilha = (parent, passo = 0.008, inicio = 0) => { let z = inicio; const f = (pts, paint, o = {}) => { z += passo; return piece(parent, pts, paint, { t: 0.01, z, ...o }); }; f.z = () => z; f.salto = (d) => { z += d; }; return f; };

export function nuvem(parent, { x = 0, y = 0, z = 0, s = 1, cor = '#fff8f0', listra = '#ffe5e0' } = {}) {
  const g = rig(parent, 'nuvem', { x, y, z, s });
  piece(g, cloud(0.56, 0.24), pat('stripes', cor, listra, 0.15), { t: 0.012, edge: '#ffffff' });
  piece(g, cloud(0.34, 0.12), cor, { t: 0.006, z: 0.012, edge: '#ffffff', y: -0.02 });
  return g;
}
export function solDePapel(parent, { x = 0, y = 0, z = 0, s = 1, cor = '#ffd24f', raio = '#ffb02e', pontas = 14 } = {}) {
  const g = rig(parent, 'sol', { x, y, z, s });
  const raios = rig(g, 'raios');
  piece(raios, star(pontas, 0.3, 0.215, 0, 0, 0), pat('dots', raio, shade(raio, 0.1), 0.1), { t: 0.01 });
  piece(g, ellipse(0.205, 0.205, 0, 0, 36), pat('stripes', cor, shade(cor, 0.05), 0.12), { t: 0.01, z: 0.012, edge: '#fff4c4' });
  return { g, raios };
}
export function lua(parent, { x = 0, y = 0, z = 0, s = 1 } = {}) {
  const g = rig(parent, 'lua', { x, y, z, s });
  piece(g, ellipse(0.31, 0.31, 0, 0, 40), pat('scales', '#2f2b7e', '#3b3792', 0.2), { t: 0.008, edge: '#7670cf' });
  piece(g, ellipse(0.25, 0.25, 0, 0, 36), pat('dots', '#fff0a6', '#ffe27a', 0.16), { t: 0.01, z: 0.008, edge: '#fff9d6' });
  for (const [a, b, r] of [[-0.08, 0.05, 0.05], [0.09, 0.1, 0.03], [0.05, -0.09, 0.04]]) piece(g, ellipse(r, r, a, b, 14), '#f3d873', { t: 0.003, z: 0.018, jitter: 0.001 });
  return g;
}
export function arvore(parent, { x = 0, y = 0, z = 0, s = 1, copa = '#6fcb5c', listra = '#5eb94d', tronco = '#a0623a', altura = 1, frutas = '#e84a5f', estampa = 'scales', flip = 1 } = {}) {
  const g = group(parent, { x, y, z, s });
  const t = pilha(g);
  t(stroke([[0, 0], [0.012 * flip, 0.3 * altura], [-0.01 * flip, 0.62 * altura]], 0.09, { taper: 0.25 }), pat('wood', tronco, shade(tronco, -0.08), 0.2), { edge: '#f0d0ac' });
  t(stroke([[0, 0.34 * altura], [0.13 * flip, 0.5 * altura]], 0.038), tronco, { edge: '#f0d0ac' });
  const y0 = 0.62 * altura + 0.2;
  t(scallop(0.38, 0.34, 9, 0.11, 0, y0), pat(estampa, copa, listra, 0.28), { edge: '#fff8e0' });
  t(scallop(0.25, 0.22, 7, 0.13, -0.05, y0 + 0.05), pat('dots', shade(copa, 0.07), shade(copa, 0.14), 0.18), { edge: '#fff8e0' });
  if (frutas) { const r = rng(Math.abs(x * 100 + z * 37) | 0); for (let i = 0; i < 6; i++) { const a = r() * 6.28, d = 0.1 + r() * 0.2; t(ellipse(0.034, 0.034, Math.cos(a) * d * 1.2, y0 + Math.sin(a) * d, 12), frutas, { jitter: 0.001, t: 0.008 }); } }
  return g;
}
export function arbusto(parent, { x = 0, y = 0, z = 0, s = 1, cor = '#58b957', listra = '#47a549', flor = '#ff7fa8' } = {}) {
  const g = group(parent, { x, y, z, s });
  piece(g, blob([[-0.25, 0], [-0.27, 0.1], [-0.14, 0.2], [0, 0.17], [0.13, 0.24], [0.27, 0.11], [0.25, 0]], 5), pat('scales', cor, listra, 0.2), { t: 0.012 });
  if (flor) { const r = rng(Math.abs(x * 90 + z * 13) | 0); for (let i = 0; i < 4; i++) { const fx = -0.17 + r() * 0.34, fy = 0.05 + r() * 0.12; piece(g, star(5, 0.032, 0.018, fx, fy), flor, { t: 0.005, z: 0.012, jitter: 0 }); piece(g, ellipse(0.011, 0.011, fx, fy, 8), '#ffe27a', { t: 0.003, z: 0.017, jitter: 0 }); } }
  return g;
}
export function flor(parent, { x = 0, y = 0, z = 0, s = 1, cor = '#ff7fa8', altura = 0.26, miolo = '#ffd24f', caule = '#3f9f55' } = {}) {
  const g = group(parent, { x, y, z, s });
  piece(g, stroke([[0, 0], [0.012, altura * 0.55], [0, altura]], 0.02), caule, { t: 0.006, jitter: 0 });
  piece(g, blob([[0, altura * 0.3], [0.06, altura * 0.42], [0.09, altura * 0.33], [0.04, altura * 0.26]], 4), caule, { t: 0.006, z: 0.002 });
  piece(g, star(6, 0.062, 0.04, 0, altura), cor, { t: 0.008, z: 0.006 });
  piece(g, ellipse(0.022, 0.022, 0, altura, 10), miolo, { t: 0.005, z: 0.012, jitter: 0 });
  return g;
}
export function cogumelo(parent, { x = 0, y = 0, z = 0, s = 1, cor = '#e84a5f' } = {}) {
  const g = group(parent, { x, y, z, s });
  piece(g, rrect(0.05, 0.12, 0.015, 0, 0.06), '#fff3dc', { t: 0.008, edge: '#e7cfa8' });
  piece(g, blob([[-0.1, 0.1], [0.1, 0.1], [0.07, 0.18], [0, 0.21], [-0.07, 0.18]], 5), pat('dots', cor, '#fff4e4', 0.1), { t: 0.008, z: 0.006 });
  return g;
}
export function cerca(parent, { x = 0, y = 0, z = 0, largura = 0.9, altura = 0.24, cor = '#fbf0dc' } = {}) {
  const g = group(parent, { x, y, z });
  const n = Math.round(largura / 0.1); const f = pilha(g, 0.003);
  f(rrect(largura, 0.03, 0.004, 0, altura * 0.62), cor, { t: 0.006, edge: '#d9c6a6' });
  f(rrect(largura, 0.03, 0.004, 0, altura * 0.3), cor, { t: 0.006, edge: '#d9c6a6' });
  for (let i = 0; i <= n; i++) { const px = -largura / 2 + (i * largura) / n; f(poly([px - 0.028, 0], [px + 0.028, 0], [px + 0.028, altura * 0.85], [px, altura], [px - 0.028, altura * 0.85]), pat('wood', cor, shade(cor, -0.1), 0.15), { t: 0.006, edge: '#d9c6a6', jitter: 0.001 }); }
  return g;
}
export function placa(parent, { x = 0, y = 0, z = 0, s = 1, cor = '#e7a95c', rot = 0 } = {}) {
  const g = group(parent, { x, y, z, s });
  piece(g, rrect(0.05, 0.5, 0.01, 0, 0.25), pat('wood', '#a0623a', '#8a5230', 0.15), { t: 0.01 });
  const t = rig(g, 'tabua', { y: 0.42, z: 0.012, rot });
  piece(t, poly([-0.2, -0.06], [0.16, -0.06], [0.24, 0], [0.16, 0.06], [-0.2, 0.06]), pat('wood', cor, shade(cor, -0.09), 0.18), { t: 0.01 });
  return { g, t };
}
export function bandeirinhas(parent, { x = 0, y = 0, z = 0, largura = 1.2, queda = 0.14, cores = ['#e0446a', '#ffd24f', '#3fb8c9', '#8f5fd8', '#ff8a3c'], n = 11 } = {}) {
  const g = rig(parent, 'bandeirinhas', { x, y, z });
  const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([-largura / 2 + largura * t, -queda * 4 * t * (1 - t)]); }
  piece(g, stroke(pts, 0.012, { steps: 2 }), '#fff4dc', { t: 0.005, jitter: 0, edge: '#fff4dc' });
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n; const px = -largura / 2 + largura * t, py = -queda * 4 * t * (1 - t);
    const cor = cores[i % cores.length];
    piece(g, poly([px - 0.042, py], [px + 0.042, py], [px, py - 0.1]), pat(i % 2 ? 'dots' : 'stripes', cor, shade(cor, 0.1), 0.1), { t: 0.006, z: 0.004, jitter: 0.001 });
  }
  return g;
}
export function lanterna(parent, { x = 0, y = 0, z = 0, s = 1, cor = '#ff9c3c', fio = 0.2 } = {}) {
  const g = rig(parent, 'lanterna', { x, y, z, s });
  piece(g, rect(0.008, fio, 0, fio / 2), '#2f2b55', { t: 0.004, jitter: 0, edge: '#2f2b55' });
  piece(g, ellipse(0.08, 0.1, 0, -0.08, 20), pat('stripes', cor, shade(cor, 0.13), 0.08), { t: 0.01, glow: true });
  piece(g, rrect(0.1, 0.022, 0.005, 0, 0.012), '#3d2c55', { t: 0.012, z: 0.002 });
  piece(g, rrect(0.1, 0.022, 0.005, 0, -0.17), '#3d2c55', { t: 0.012, z: 0.002 });
  return g;
}
// ---- casas ----------------------------------------------------------------------------------------
/** Casa de palha: cada feixe é um rig que pode voar. y=0 no chão, ~1,3 de altura. */
export function casaPalha(parent, { x = 0, y = 0, z = 0, s = 1 } = {}) {
  const raiz = rig(parent, 'casa-palha', { x, y, z, s });
  const palha = pat('straw', '#f2cf63', '#c7972f', 0.26); const palha2 = pat('straw', '#e9bd4d', '#b5862a', 0.26);
  const esq = group(raiz, {});
  const f = pilha(esq, 0.006);
  // esteios que ficam em pé depois do sopro
  f(rrect(0.05, 0.86, 0.01, -0.46, 0.43), pat('wood', '#8a5230', '#70401f', 0.15));
  f(rrect(0.05, 0.86, 0.01, 0.46, 0.43), pat('wood', '#8a5230', '#70401f', 0.15));
  f(stroke([[-0.5, 0.82], [0.5, 0.82]], 0.05), pat('wood', '#8a5230', '#70401f', 0.15), { jitter: 0 });
  f(stroke([[-0.44, 0.03], [0.44, 0.74]], 0.035), pat('wood', '#8a5230', '#70401f', 0.15), { jitter: 0 });
  const vao = rig(raiz, 'vao'); piece(vao, rect(0.82, 0.75, 0, 0.42), '#3c2233', { t: 0.006, z: 0.03, edge: '#3c2233' });
  const partes = [];
  const n = 8; const wf = 1.04 / n;
  for (let i = 0; i < n; i++) {
    const px = -0.52 + (i + 0.5) * wf;
    if (i === 3 || i === 4) { // vão da porta: feixe só em cima
      const p = rig(raiz, 'feixe', { x: px, y: 0.62, z: 0.05 + (i % 2) * 0.004 });
      piece(p, blob([[-wf * 0.56, -0.13], [wf * 0.56, -0.13], [wf * 0.6, 0.12], [-wf * 0.6, 0.12]], 3), i % 2 ? palha : palha2, { t: 0.012, edge: '#fff2c0' });
      partes.push(p); continue;
    }
    const p = rig(raiz, 'feixe', { x: px, y: 0, z: 0.05 + (i % 2) * 0.004 });
    const alt = 0.76 - Math.abs(i - 3.5) * 0.012;
    piece(p, blob([[-wf * 0.5, 0], [-wf * 0.56, alt * 0.5], [-wf * 0.5, alt], [wf * 0.5, alt], [wf * 0.56, alt * 0.5], [wf * 0.5, 0]], 3), i % 2 ? palha : palha2, { t: 0.012, edge: '#fff2c0' });
    piece(p, rrect(wf * 1.06, 0.03, 0.005, 0, alt * 0.56), '#a8702f', { t: 0.006, z: 0.012, jitter: 0.001 });
    partes.push(p);
  }
  const porta = rig(raiz, 'porta', { x: 0, y: 0, z: 0.044 });
  piece(porta, rrect(0.26, 0.5, 0.05, 0, 0.25), pat('wood', '#b97d42', '#9d6833', 0.16), { t: 0.01 });
  piece(porta, ellipse(0.02, 0.02, 0.08, 0.23, 8), '#4f2e16', { t: 0.006, z: 0.01, jitter: 0 });
  partes.push(porta);
  // telhado: colmo contínuo em domo, com a barra de cada fileira desfiada
  const domo = (yy) => 0.76 * Math.sqrt(Math.max(0.001, 1 - ((yy - 0.68) / 0.8) ** 2));
  const telhado = []; const nFil = 6; const passo = 0.8 / nFil;
  for (let i = 0; i < nFil; i++) {
    const y0 = 0.68 + i * passo; const y1 = Math.min(1.475, y0 + passo * 1.5); const ym = y0 + passo * 0.5;
    const q = rig(raiz, 'telha-palha', { y: ym, z: 0.075 + i * 0.006 });
    const w0 = domo(y0), pts = []; const dentes = Math.max(5, Math.round((w0 * 2) / 0.085));
    for (let k = 0; k <= dentes; k++) { const tx = -w0 - 0.02 + (k * (w0 + 0.02) * 2) / dentes; pts.push([tx, y0 - ym + (k % 2 ? -0.05 : 0.012) + (((k * 7) % 3) - 1) * 0.008]); }
    for (let k = 1; k <= 5; k++) { const yy = y0 + ((y1 - y0) * k) / 5; pts.push([domo(yy), yy - ym]); }
    for (let k = 5; k >= 1; k--) { const yy = y0 + ((y1 - y0) * k) / 5; pts.push([-domo(yy), yy - ym]); }
    piece(q, pts, i % 2 ? palha : palha2, { t: 0.014, edge: '#fff2c0', jitter: 0 });
    telhado.push(q);
  }
  const amarra = rig(raiz, 'telha-palha', { y: 1.47, z: 0.115 }); piece(amarra, blob([[-0.1, -0.03], [0, -0.05], [0.1, -0.03], [0.05, 0.1], [-0.05, 0.1]], 4), palha2, { t: 0.012, edge: '#fff2c0' }); piece(amarra, rrect(0.17, 0.025, 0.006, 0, -0.03), '#a8702f', { t: 0.004, z: 0.012, jitter: 0 }); telhado.push(amarra);
  return { raiz, partes, telhado, porta, vao };
}

/** Casa de madeira: tábuas soltas. */
export function casaMadeira(parent, { x = 0, y = 0, z = 0, s = 1 } = {}) {
  const raiz = rig(parent, 'casa-madeira', { x, y, z, s });
  const cores = ['#c98a4b', '#b97a3e', '#d39757', '#bf8043'];
  const fundo = group(raiz, {});
  const f = pilha(fundo, 0.006);
  const vao = rig(raiz, 'vao'); piece(vao, rect(1.0, 0.86, 0, 0.43), '#452a22', { t: 0.006, z: 0.024, edge: '#452a22' });
  f(rrect(0.05, 0.9, 0.008, -0.5, 0.45), pat('wood', '#7a4a26', '#663c1c', 0.15));
  f(rrect(0.05, 0.9, 0.008, 0.5, 0.45), pat('wood', '#7a4a26', '#663c1c', 0.15));
  const tabuas = []; const n = 9; const wt = 1.06 / n;
  for (let i = 0; i < n; i++) {
    const px = -0.53 + (i + 0.5) * wt; const cor = cores[i % 4];
    if (i === 4 || i === 3 || i === 5) {
      // sobre a porta
      const t = rig(raiz, 'tabua', { x: px, y: 0.58, z: 0.04 + (i % 2) * 0.004 });
      piece(t, rect(wt * 1.02, 0.31, 0, 0.15), pat('wood', cor, shade(cor, -0.08), 0.22), { t: 0.012, edge: '#f4d4a6', jitter: 0.005 });
      tabuas.push(t); continue;
    }
    const t = rig(raiz, 'tabua', { x: px, y: 0, z: 0.04 + (i % 2) * 0.004 });
    piece(t, rect(wt * 1.02, 0.9 - (i % 3) * 0.012, 0, 0.445), pat('wood', cor, shade(cor, -0.08), 0.22), { t: 0.012, edge: '#f4d4a6', jitter: 0.005 });
    for (const py of [0.15, 0.68]) piece(t, ellipse(0.009, 0.009, 0, py, 6), '#4f2e16', { t: 0.003, z: 0.012, jitter: 0 });
    tabuas.push(t);
  }
  const porta = rig(raiz, 'porta', { x: 0, y: 0, z: 0.036 });
  piece(porta, rrect(0.32, 0.58, 0.02, 0, 0.29), pat('vstripes', '#8c4f2a', '#7b4323', 0.2), { t: 0.01 });
  piece(porta, ellipse(0.024, 0.024, 0.1, 0.27, 8), '#ffd24f', { t: 0.006, z: 0.01, jitter: 0 });
  tabuas.push(porta);
  // a empena fechada, em tábuas que acompanham o telhado: sem ela, via-se a copa das árvores por dentro da casa
  const ripas = [];
  const topoEmpena = (x) => 0.5 * (1 - Math.abs(x) / 0.68);
  for (let i = 0; i < 6; i++) {
    const w = 0.18; const px = -0.54 + (i + 0.5) * w; const a = px - w / 2; const b = px + w / 2;
    const cor = cores[i % 4];
    const r = rig(raiz, 'empena', { x: px, y: 0.88, z: 0.03 });
    const contorno = [[-w / 2, -0.02], [w / 2, -0.02], [w / 2, topoEmpena(b)]];
    if (a < 0 && b > 0) contorno.push([0, topoEmpena(0)]);
    contorno.push([-w / 2, topoEmpena(a)]);
    piece(r, poly(...contorno.map(([x, y]) => (a < 0 && b > 0 && x === 0 ? [-px, y] : [x, y]))), pat('wood', shade(cor, -0.12), shade(cor, -0.2), 0.2), { t: 0.01, edge: '#d9ab78', jitter: 0.004 });
    ripas.push(r);
  }
  // telhado: duas águas de ripas
  for (const lado of [-1, 1]) for (let i = 0; i < 5; i++) {
    const a = (i + 0.5) / 5; const r = rig(raiz, 'ripa', { x: lado * (0.68 - a * 0.68), y: 0.88 + a * 0.5, z: 0.075 + (lado > 0 ? 0.008 : 0) + i * 0.001, rot: lado * -0.63 });
    const cor = i % 2 ? '#9c5a32' : '#b06a3c';
    piece(r, rrect(0.2, 0.84 * 0.2 / 0.84, 0.01), pat('wood', cor, shade(cor, -0.08), 0.2), { t: 0.012, edge: '#efc695', jitter: 0.006 });
    ripas.push(r);
  }
  return { raiz, tabuas, ripas, porta, vao };
}

/** Casa de tijolos: inteira e teimosa. */
export function casaTijolo(parent, { x = 0, y = 0, z = 0, s = 1, largura = 1.3, altura = 1.02, porta: comPorta = true } = {}) {
  const raiz = rig(parent, 'casa-tijolo', { x, y, z, s });
  const parede = rig(raiz, 'parede');
  const f = pilha(parede, 0.007);
  f(rect(largura, altura, 0, altura / 2), pat('brick', '#d9583f', '#f6dcc0', 0.34), { edge: '#f6dcc0', jitter: 0.003 });
  // cantos em pedra
  for (const sx of [-1, 1]) for (let j = 0; j < 5; j++) f(rect(0.11, 0.1, sx * (largura / 2 - 0.04 + (j % 2 ? 0.012 : 0)), 0.09 + j * 0.2), '#e9c79c', { t: 0.008, edge: '#f8e5c8', jitter: 0.004 });
  f(rect(largura + 0.06, 0.09, 0, 0.045), pat('stripes', '#8f8aa0', '#7f7a92', 0.15), { edge: '#d8d5e3' });
  let portaR = null;
  if (comPorta) {
    f(blob([[-0.2, 0], [-0.2, 0.42], [-0.13, 0.57], [0, 0.63], [0.13, 0.57], [0.2, 0.42], [0.2, 0]], 5), '#e9c79c', { edge: '#f8e5c8' });
    piece(raiz, blob([[-0.16, 0], [-0.16, 0.4], [-0.1, 0.52], [0, 0.57], [0.1, 0.52], [0.16, 0.4], [0.16, 0]], 5), '#2a1a2c', { t: 0.002, z: f.z() + 0.014, edge: '#2a1a2c', jitter: 0 });
    portaR = rig(raiz, 'porta', { z: f.z() + 0.022 });
    piece(portaR, blob([[-0.16, 0], [-0.16, 0.4], [-0.1, 0.52], [0, 0.57], [0.1, 0.52], [0.16, 0.4], [0.16, 0]], 5), pat('vstripes', '#3c8a8e', '#317a7e', 0.2), { t: 0.01 });
    piece(portaR, ellipse(0.024, 0.024, 0.09, 0.26, 8), '#ffd24f', { t: 0.006, z: 0.01, jitter: 0 });
    piece(portaR, heart(0.04), '#e0446a', { t: 0.004, z: 0.01, y: 0.42, jitter: 0 });
  }
  const telhado = rig(raiz, 'telhado', { y: altura, z: f.z() + 0.02 });
  piece(telhado, poly([-largura / 2 - 0.15, -0.02], [largura / 2 + 0.15, -0.02], [0, 0.72]), pat('shingle', '#5a4fb0', '#463c96', 0.3), { t: 0.016, edge: '#d7d2f5', jitter: 0.004 });
  piece(telhado, rrect(largura + 0.34, 0.06, 0.01, 0, -0.01), '#463c96', { t: 0.012, z: 0.016 });
  return { raiz, parede, telhado, porta: portaR, topoZ: f.z() };
}
export function chamine(parent, { x = 0, y = 0, z = 0, s = 1, altura = 0.46 } = {}) {
  const g = rig(parent, 'chamine', { x, y, z, s });
  piece(g, rect(0.2, altura, 0, altura / 2), pat('brick', '#c64e38', '#f6dcc0', 0.22), { t: 0.016, edge: '#f6dcc0' });
  piece(g, rrect(0.27, 0.06, 0.012, 0, altura), '#e9c79c', { t: 0.012, z: 0.014, edge: '#f8e5c8' });
  return g;
}
/** Moldura colocada na frente do porquinho, cobrindo o pescoço. */
export function molduraJanela(parent, { x = 0, y = 0, z = 0, r = 0.15, cor = '#fff3dc', sombra = '#a0623a' } = {}) {
  const g = group(parent, { x, y, z });
  const fora = ellipse(r + 0.035, r + 0.035, 0, 0, 34);
  const dentro = ellipse(r, r, 0, 0, 34).reverse();
  piece(g, fora, cor, { t: 0.012, holes: [dentro], edge: sombra, jitter: 0 });
  // peitoril cobre o corpo
  piece(g, rrect(r * 2 + 0.12, 0.05, 0.01, 0, -r - 0.015), sombra, { t: 0.014, z: 0.004 });
  return g;
}
export function caldeirao(parent, { x = 0, y = 0, z = 0, s = 1 } = {}) {
  const g = rig(parent, 'caldeirao', { x, y, z, s });
  piece(g, rrect(0.05, 0.14, 0.012, -0.26, 0.05), '#2f2740', { t: 0.012 }); piece(g, rrect(0.05, 0.14, 0.012, 0.26, 0.05), '#2f2740', { t: 0.012 });
  piece(g, blob([[-0.38, 0.5], [-0.42, 0.28], [-0.26, 0.1], [0, 0.04], [0.26, 0.1], [0.42, 0.28], [0.38, 0.5]], 6), pat('scales', '#3b3350', '#4a4163', 0.2), { t: 0.016, z: 0.012, edge: '#7a7196' });
  const agua = rig(g, 'agua', { y: 0.5, z: 0.008 });
  piece(agua, ellipse(0.38, 0.05, 0, 0, 26), pat('dots', '#78dbe0', '#a7ecf0', 0.1), { t: 0.006, edge: '#d2f6f7' });
  piece(g, rrect(0.86, 0.07, 0.03, 0, 0.47), '#544a6e', { t: 0.012, z: 0.028, edge: '#8a81a8' });
  piece(g, stroke([[-0.44, 0.42], [-0.53, 0.37], [-0.44, 0.3]], 0.025), '#2f2740', { t: 0.008, z: 0.024, jitter: 0 });
  piece(g, stroke([[0.44, 0.42], [0.53, 0.37], [0.44, 0.3]], 0.025), '#2f2740', { t: 0.008, z: 0.024, jitter: 0 });
  return { g, agua };
}
export function fogueira(parent, { x = 0, y = 0, z = 0, s = 1 } = {}) {
  const g = rig(parent, 'fogo', { x, y, z, s });
  piece(g, stroke([[-0.26, 0.015], [0.24, 0.07]], 0.06), pat('wood', '#7a4a26', '#663c1c', 0.14), { t: 0.016, z: 0.024, jitter: 0.002 });
  piece(g, stroke([[0.26, 0.015], [-0.24, 0.07]], 0.06), pat('wood', '#8a5230', '#70401f', 0.14), { t: 0.016, z: 0.03, jitter: 0.002 });
  const chamas = [];
  [[-0.12, 0.18, 0.36, '#f35a30'], [0.13, 0.2, 0.42, '#f35a30'], [0, 0.26, 0.52, '#ff7d2e'], [-0.04, 0.17, 0.33, '#ffb02e'], [0.05, 0.13, 0.26, '#ffb02e'], [0, 0.08, 0.16, '#fff0a0']].forEach(([fx, w, h, cor], i) => {
    const q = rig(g, 'chama', { x: fx, y: 0.04, z: i * 0.004 + (i > 2 ? 0.034 : 0) });
    piece(q, flame(w, h), cor, { t: 0.005, glow: true, jitter: 0.002 }); chamas.push(q);
  });
  const idle = (t, forca = 1) => chamas.forEach((c, i) => { c.scale.y = forca * (1 + Math.sin(t * (7 + i) + i * 2) * 0.13); c.scale.x = 1 + Math.sin(t * (5 + i) + i) * 0.07; c.rotation.z = Math.sin(t * (4 + i * 0.7) + i) * 0.05; });
  return { g, chamas, idle };
}
export function fumaca(parent, n, { x = 0, y = 0, z = 0, cor = '#efe7f2', altura = 0.7, s = 1 } = {}) {
  const raiz = rig(parent, 'fumaca', { x, y, z, s });
  const bolas = [];
  for (let i = 0; i < n; i++) { const b = rig(raiz, 'puf', {}); piece(b, scallop(0.075, 0.065, 6, 0.14, 0, 0, 5), pat('stripes', cor, shade(cor, -0.05), 0.08), { t: 0.006, edge: '#ffffff', jitter: 0, noShadow: true }); bolas.push(b); }
  const idle = (t) => bolas.forEach((b, i) => {
    const p = (t * 0.22 + i / n) % 1; b.position.set(Math.sin(p * 6 + i) * 0.06 + p * 0.07, p * altura, 0); const q = Math.sin(Math.min(p * 3.2, 1) * Math.PI / 2) * (1 - p * 0.35) * (p > 0.86 ? (1 - p) / 0.14 : 1); b.scale.setScalar(Math.max(0.001, (0.4 + p * 1.1) * q));
  });
  return { raiz, bolas, idle };
}

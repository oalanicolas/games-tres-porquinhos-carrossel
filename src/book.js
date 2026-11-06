// O livro físico: mesa, capas, paredes pintadas e a mecânica que abre em estrela.
import * as THREE from 'three';
import { TAU, rng, piece, rig, sector, stroke, pat, bake, shade } from './paper.js';
import { CENAS, CAPA } from './story.js';

export const N = CENAS.length;
export const CUNHA = TAU / N;
export const R = 3.05;
export const H = 2.78;
export const ESPESSURA = 0.34;
const PX_L = 1400; const PX_A = 1276;
const CEU_FRACAO = 0.43;

// Céus: o dia passa de cena em cena. Cada faixa é [cor, cor da listra]; do alto para baixo.
export const CEUS = [
  { faixas: [['#7fd3ee', '#97ddf2'], ['#a9e4ee', '#bdebf2'], ['#ffe2c4', '#ffeeda'], ['#ffc4c9', '#ffd5d6'], ['#ffa9bb', '#ffbcc9']], estrelas: 0, aves: 3, borda: '#ef6f8e', chao: pat('grass', '#a8dc62', '#92cb50', 0.5), disco: '#8fd05a' },
  { faixas: [['#3fb8ee', '#5cc6f2'], ['#6dcdf2', '#87d8f5'], ['#a3e4f4', '#baecf7'], ['#d3f4ef', '#e3f8f2'], ['#fff3c9', '#fff8de']], estrelas: 0, aves: 4, borda: '#2fa3c9', chao: pat('grass', '#f2d57b', '#e6c566', 0.5), disco: '#e7c364' },
  { faixas: [['#58c4d9', '#73d0e0'], ['#a6e3d5', '#bcebdf'], ['#ffeeb0', '#fff4c9'], ['#ffd28f', '#ffdfaa'], ['#ffb077', '#ffc392']], estrelas: 0, aves: 3, borda: '#ee8a3e', chao: pat('grass', '#bfe06b', '#a9d154', 0.5), disco: '#a8cf52' },
  { faixas: [['#f7a24d', '#f9b265'], ['#fbbd5b', '#fccb76'], ['#ffd67a', '#ffe096'], ['#ffb46b', '#ffc586'], ['#f58a6a', '#f79d82']], estrelas: 0, aves: 2, borda: '#d9682f', chao: pat('grass', '#d8cf60', '#c8bf4d', 0.5), disco: '#c2b84a' },
  { faixas: [['#7c4fc0', '#8c62cb'], ['#c15cb4', '#cd71c0'], ['#f26f9c', '#f485ac'], ['#fb9a6f', '#fcac87'], ['#ffd27a', '#ffdd96']], estrelas: 6, aves: 2, borda: '#c23f87', chao: pat('grass', '#8cc27b', '#7cb36b', 0.5), disco: '#74ab66' },
  { faixas: [['#2a2570', '#352f80'], ['#4a2f96', '#5839a6'], ['#7a3fb4', '#8a4dc2'], ['#b153b5', '#bf66c2'], ['#ec7fa9', '#f093b7']], estrelas: 16, aves: 0, borda: '#7a3fb4', chao: pat('grass', '#5e8f86', '#50807a', 0.5), disco: '#4e7f78' },
  { faixas: [['#100e42', '#191650'], ['#1c1a5e', '#26246d'], ['#2c2a7c', '#37358b'], ['#3f3a97', '#4c47a3'], ['#5a54ad', '#6761b8']], estrelas: 34, aves: 0, borda: '#3f3a97', chao: pat('grass', '#3f6f76', '#35626a', 0.5), disco: '#355f69' },
  { faixas: [['#171650', '#211f60'], ['#30237a', '#3b2c88'], ['#5c2e93', '#6a39a1'], ['#a23e94', '#b04ea2'], ['#f2767f', '#f58b92']], estrelas: 28, aves: 0, borda: '#e0446a', chao: pat('grass', '#7fb56a', '#6fa65c', 0.5), disco: '#6da35a' },
];

// ---- pintura em canvas ---------------------------------------------------------------------------
function papelBase(ctx, w, h, seed) {
  ctx.fillStyle = '#fbf0e0'; ctx.fillRect(0, 0, w, h);
  const r = rng(seed);
  ctx.save();
  for (let i = 0; i < 170; i++) {
    const x = r() * w, y = r() * h, rad = 30 + r() * 150;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad); const cor = r() > 0.5 ? '255,250,238' : '226,204,170';
    g.addColorStop(0, `rgba(${cor},.07)`); g.addColorStop(1, `rgba(${cor},0)`); ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  ctx.globalAlpha = 0.14; ctx.strokeStyle = '#b89a72'; ctx.lineWidth = 1;
  for (let i = 0; i < 420; i++) { const x = r() * w, y = r() * h, a = r() * TAU, l = 6 + r() * 20; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
  ctx.restore();
}
/** Céu em tiras coladas. `dist` cresce a partir da lombada; `espelho` inverte o lado para casar na dobra. */
function pintaCeu(ctx, ceu, x0, x1, espelho, seed) {
  const w = x1 - x0; const r = rng(seed); const n = ceu.faixas.length; const alturas = [0, 0.2, 0.42, 0.62, 0.8, 1.02];
  ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, w, PX_A); ctx.clip();
  ceu.faixas.forEach(([cor, listra], i) => {
    const y0 = alturas[i] * PX_A;
    const curva = (d) => y0 + (i === 0 ? -80 : Math.sin(d * 0.012 + i * 1.9) * 26 + Math.sin(d * 0.031 + i) * 8);
    ctx.save();
    ctx.shadowColor = 'rgba(70,30,60,.22)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = -5;
    ctx.beginPath();
    for (let px = 0; px <= w; px += 8) { const d = px; const x = espelho ? x1 - px : x0 + px; const y = curva(d); if (px === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.lineTo(espelho ? x0 : x1, PX_A + 20); ctx.lineTo(espelho ? x1 : x0, PX_A + 20); ctx.closePath();
    ctx.fillStyle = cor; ctx.fill(); ctx.restore();
    ctx.save(); ctx.clip();
    ctx.fillStyle = listra; for (let y = y0 - 90; y < PX_A; y += 44) ctx.fillRect(x0, y, w, 22);
    ctx.restore();
    if (i + 1 < n) {
      // a próxima tira cobre o que sobrar da listra
    }
  });
  // estrelas
  ctx.fillStyle = '#fff3b0';
  for (let i = 0; i < ceu.estrelas; i++) {
    const x = x0 + r() * w, y = r() * PX_A * 0.62, s = 4 + r() * 11;
    ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 2); ctx.fillStyle = r() > 0.75 ? '#ffc9de' : '#fff0a6'; ctx.beginPath();
    for (let k = 0; k < 10; k++) { const rr = k % 2 ? s * 0.42 : s; ctx.lineTo(Math.cos((k / 10) * TAU) * rr, Math.sin((k / 10) * TAU) * rr); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // aves
  ctx.strokeStyle = ceu.estrelas ? '#ffe9f2' : '#40314e'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let i = 0; i < ceu.aves; i++) {
    const x = x0 + (0.18 + r() * 0.62) * w, y = (0.07 + r() * 0.26) * PX_A, s = 18 + r() * 14;
    ctx.beginPath(); ctx.moveTo(x - s, y); ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.7, x, y); ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.7, x + s, y); ctx.stroke();
  }
  ctx.restore();
  // sombra suave do céu sobre o papel
  ctx.save(); const gx = espelho ? x0 : x1; const g = ctx.createLinearGradient(gx, 0, gx + (espelho ? -26 : 26), 0);
  g.addColorStop(0, 'rgba(90,50,40,.20)'); g.addColorStop(1, 'rgba(90,50,40,0)'); ctx.fillStyle = g; ctx.fillRect(espelho ? gx - 26 : gx, 0, 26, PX_A); ctx.restore();
}
function quebraLinhas(ctx, texto, largura) {
  const out = []; let linha = '';
  for (const p of texto.split(/\s+/)) { const t = linha ? `${linha} ${p}` : p; if (ctx.measureText(t).width > largura && linha) { out.push(linha); linha = p; } else linha = t; }
  if (linha) out.push(linha); return out;
}
function novaFolha() { const c = document.createElement('canvas'); c.width = PX_L; c.height = PX_A; return c; }
function texturaDe(canvas, aniso) {
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t;
}
function algarismo(n) { return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][n]; }
export const romano = algarismo;

/** Parede esquerda de uma cena, como quem olha: papel com o texto à esquerda, céu junto à lombada à direita. */
function pintaTexto(i) {
  const c = novaFolha(); const ctx = c.getContext('2d'); const cena = CENAS[i]; const ceu = CEUS[i];
  papelBase(ctx, PX_L, PX_A, 100 + i);
  const limite = PX_L * (1 - CEU_FRACAO);
  pintaCeu(ctx, ceu, limite, PX_L, true, 300 + i);
  const m = 74; const larg = limite - m - 40;
  ctx.fillStyle = ceu.borda; ctx.font = '600 25px "Inter Variable"'; ctx.letterSpacing = '4px'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`CENA ${algarismo(i)}  ·  ${cena.parte.toUpperCase()}`, m, 96); ctx.letterSpacing = '0px';
  ctx.fillStyle = '#2a1c33'; ctx.font = 'italic 500 66px "Fraunces Variable"'; ctx.fillText(cena.titulo, m, 176);
  [ceu.borda, '#f2a93b', '#7a5fc4'].forEach((cor, k) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(m + 8 + k * 30, 216, 6, 0, TAU); ctx.fill(); });
  let y = 268; const fonte = 35; const lh = 46;
  cena.linhas.forEach((l, li) => {
    ctx.font = `400 ${fonte}px "Libre Caslon Text"`;
    const recuo = l.fala ? 26 : 0;
    if (li === 0) {
      // capitular
      const prim = l.t[0] === '—' ? '' : l.t[0];
      if (prim) {
        ctx.fillStyle = ceu.borda; ctx.font = '700 100px "Libre Caslon Text"'; const cw = ctx.measureText(prim).width + 10; ctx.fillText(prim, m, y + 56);
        ctx.font = `400 ${fonte}px "Libre Caslon Text"`; ctx.fillStyle = '#2f2336';
        const resto = l.t.slice(1); let linhas = quebraLinhas(ctx, resto, larg - cw);
        const primeiras = linhas.slice(0, 2); primeiras.forEach((ln, k) => { ctx.fillText(ln, m + cw, y + k * lh); });
        const r2 = quebraLinhas(ctx, linhas.slice(2).join(' '), larg);
        r2.forEach((ln, k) => ctx.fillText(ln, m, y + (k + 2) * lh));
        y += (Math.max(2, r2.length + 2)) * lh + 6;
        return;
      }
    }
    ctx.fillStyle = '#2f2336';
    quebraLinhas(ctx, l.t, larg - recuo).forEach((ln) => { ctx.fillText(ln, m + recuo, y); y += lh; });
    y += 6;
  });
  // fio de borda
  ctx.fillStyle = ceu.borda; ctx.fillRect(0, 0, 7, PX_A);
  return { canvas: c, fimTexto: y };
}
/** Parede direita, como quem olha: céu à esquerda junto à lombada, legenda à direita. */
function pintaLegenda(i) {
  const c = novaFolha(); const ctx = c.getContext('2d'); const cena = CENAS[i]; const ceu = CEUS[i];
  papelBase(ctx, PX_L, PX_A, 200 + i);
  const limite = PX_L * CEU_FRACAO;
  pintaCeu(ctx, ceu, 0, limite, false, 300 + i);
  const d = PX_L - 70;
  ctx.textAlign = 'right'; ctx.fillStyle = ceu.borda; ctx.font = '600 25px "Inter Variable"'; ctx.letterSpacing = '4px';
  ctx.fillText(cena.legenda.toUpperCase(), d, 98); ctx.letterSpacing = '0px';
  ctx.fillStyle = '#3a2b40'; ctx.font = 'italic 400 39px "Libre Caslon Text"';
  let y = 160; quebraLinhas(ctx, cena.dica, PX_L - limite - 170).forEach((ln) => { ctx.fillText(ln, d, y); y += 52; });
  ctx.textAlign = 'left';
  [ceu.borda, '#f2a93b', '#7a5fc4'].forEach((cor, k) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(d - 60 + k * 30, y + 2, 6, 0, TAU); ctx.fill(); });
  ctx.fillStyle = ceu.borda; ctx.fillRect(PX_L - 7, 0, 7, PX_A);
  return c;
}
const COR_CAPA = '#127f86';
const COR_OURO = '#f3c65a';
/** Face externa da capa. `arte` é um canvas com a ilustração do arco. */
function pintaCapa(arte) {
  const c = novaFolha(); const ctx = c.getContext('2d');
  ctx.fillStyle = COR_CAPA; ctx.fillRect(0, 0, PX_L, PX_A);
  const r = rng(77); ctx.globalAlpha = 0.06; for (let i = 0; i < 2600; i++) { ctx.fillStyle = r() > 0.5 ? '#fff' : '#002a2d'; ctx.fillRect(r() * PX_L, r() * PX_A, 1 + r() * 2.4, 1 + r() * 2.4); } ctx.globalAlpha = 1;
  ctx.strokeStyle = COR_OURO; ctx.lineWidth = 7; ctx.strokeRect(36, 36, PX_L - 72, PX_A - 72); ctx.lineWidth = 2.5; ctx.strokeRect(54, 54, PX_L - 108, PX_A - 108);
  ctx.textAlign = 'center'; ctx.fillStyle = COR_OURO;
  ctx.font = '600 31px "Inter Variable"'; ctx.letterSpacing = '12px'; ctx.fillText('CONTO POPULAR', PX_L / 2, 142); ctx.letterSpacing = '0px';
  ctx.font = '600 136px "Fraunces Variable"'; ctx.fillText(CAPA.titulo.replace(' Porquinhos', ''), PX_L / 2, 270);
  ctx.fillText('Porquinhos', PX_L / 2, 398);
  ctx.font = 'italic 500 42px "Fraunces Variable"'; ctx.fillText('e o Lobo que soprava demais', PX_L / 2, 474);
  // arco
  const ax = PX_L / 2, aw = 800, topo = 526, base = PX_A - 118, rad = aw / 2;
  const arco = (cx) => { cx.beginPath(); cx.moveTo(ax - rad, base); cx.lineTo(ax - rad, topo + rad); cx.arc(ax, topo + rad, rad, Math.PI, 0); cx.lineTo(ax + rad, base); cx.closePath(); };
  ctx.save(); arco(ctx); ctx.clip(); if (arte) ctx.drawImage(arte, ax - rad, topo, aw, base - topo); ctx.restore();
  arco(ctx); ctx.strokeStyle = COR_OURO; ctx.lineWidth = 9; ctx.stroke();
  ctx.save(); ctx.translate(ax, 0); ctx.scale(1.03, 1); ctx.translate(-ax, 0);
  ctx.restore();
  // pequenos enfeites
  ctx.fillStyle = COR_OURO; for (const [x, y] of [[170, 640], [1230, 640], [140, 880], [1260, 880], [190, 1080], [1210, 1080]]) { ctx.beginPath(); for (let k = 0; k < 8; k++) { const rr = k % 2 ? 5 : 15; ctx.lineTo(x + Math.cos((k / 8) * TAU) * rr, y + Math.sin((k / 8) * TAU) * rr); } ctx.closePath(); ctx.fill(); }
  ctx.font = '600 25px "Inter Variable"'; ctx.letterSpacing = '9px'; ctx.fillText('ABRA · GIRE · SOPRE', PX_L / 2, PX_A - 74); ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
  return c;
}
function pintaContracapa() {
  const c = novaFolha(); const ctx = c.getContext('2d'); ctx.fillStyle = COR_CAPA; ctx.fillRect(0, 0, PX_L, PX_A);
  const r = rng(78); ctx.globalAlpha = 0.06; for (let i = 0; i < 2600; i++) { ctx.fillStyle = r() > 0.5 ? '#fff' : '#002a2d'; ctx.fillRect(r() * PX_L, r() * PX_A, 1 + r() * 2.4, 1 + r() * 2.4); } ctx.globalAlpha = 1;
  ctx.strokeStyle = COR_OURO; ctx.lineWidth = 7; ctx.strokeRect(36, 36, PX_L - 72, PX_A - 72);
  ctx.textAlign = 'center'; ctx.fillStyle = COR_OURO; ctx.font = 'italic 500 62px "Fraunces Variable"'; ctx.fillText('A casa que o vento não leva.', PX_L / 2, PX_A / 2); ctx.textAlign = 'left';
  return c;
}
function madeira() {
  const s = 2048; const c = document.createElement('canvas'); c.width = c.height = s; const ctx = c.getContext('2d'); const r = rng(21);
  ctx.fillStyle = '#7a4522'; ctx.fillRect(0, 0, s, s);
  const tabuas = 5; const h = s / tabuas;
  for (let t = 0; t < tabuas; t++) {
    const y0 = t * h; ctx.fillStyle = shade('#7f4a26', (r() - 0.5) * 0.05); ctx.fillRect(0, y0, s, h);
    for (let i = 0; i < 90; i++) {
      const y = y0 + r() * h; ctx.strokeStyle = r() > 0.55 ? `rgba(50,22,6,${0.08 + r() * 0.24})` : `rgba(190,120,70,${0.04 + r() * 0.12})`; ctx.lineWidth = 0.8 + r() * 3.4;
      const f = 0.002 + r() * 0.004, a = 4 + r() * 12, ph = r() * 7;
      ctx.beginPath(); for (let x = 0; x <= s; x += 16) { const yy = y + Math.sin((x / s) * TAU * Math.round(f * 500) + ph) * a; if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.stroke();
    }
    ctx.fillStyle = 'rgba(30,12,2,.55)'; ctx.fillRect(0, y0, s, 3);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); t.anisotropy = 16; return t;
}

// ---- mesa ------------------------------------------------------------------------------------------
export function criaMesa(scene) {
  const mesa = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ map: madeira() }));
  mesa.rotation.x = -Math.PI / 2; mesa.receiveShadow = true; scene.add(mesa);
  return mesa;
}

// ---- livro ------------------------------------------------------------------------------------------
export class Livro {
  constructor(aniso) {
    this.raiz = new THREE.Group(); this.raiz.rotation.order = 'YXZ';
    this.anel = new THREE.Group(); this.raiz.add(this.anel);
    this.paredes = []; this.cunhas = []; this.aniso = aniso;
    this.abertura = 0; this.giro = 0; this.stats = { pieces: 0, draws: 0, triangles: 0 };
    this.anguloFinal = (k) => THREE.MathUtils.degToRad(90 + 180 / N) - k * CUNHA;
    this._construirParedes();
    this._construirCunhas();
    this._construirMiolo();
  }
  _construirParedes() {
    this.faces = [];
    const borda = new THREE.MeshLambertMaterial({ color: '#fff4dc' });
    const capa = new THREE.MeshLambertMaterial({ color: COR_CAPA });
    this.fimTexto = [];
    for (let k = 0; k <= N; k++) {
      const pivo = new THREE.Group(); this.anel.add(pivo);
      const ehCapa = k === 0 || k === N;
      const w = ehCapa ? R + 0.07 : R; const h = ehCapa ? H + 0.1 : H; const d = ehCapa ? 0.045 : 0.012;
      const lado = ehCapa ? capa : borda;
      let frente, tras;
      // +z: parede direita da cena k-1; -z: parede esquerda da cena k
      if (k === 0) { frente = null; } else frente = new THREE.MeshLambertMaterial({ map: texturaDe(pintaLegenda(k - 1), this.aniso) });
      if (k === N) { tras = new THREE.MeshLambertMaterial({ map: texturaDe(pintaContracapa(), this.aniso) }); } else {
        const pint = pintaTexto(k); this.fimTexto[k] = pint.fimTexto; tras = new THREE.MeshLambertMaterial({ map: texturaDe(pint.canvas, this.aniso) });
      }
      if (k === 0) { frente = new THREE.MeshLambertMaterial({ color: COR_CAPA }); this.materialCapa = frente; }
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [lado, lado, lado, lado, frente, tras]);
      m.position.set(w / 2, h / 2 + (ehCapa ? 0 : 0.05), 0); m.castShadow = true; m.receiveShadow = true; m.name = `parede-${k}`;
      m.userData.parede = k; pivo.add(m);
      this.paredes.push({ pivo, m, k });
    }
    // fitas nas capas: em pé ficam na emenda; deitado o livro as deixa saindo pela borda
    const fita = pat('stripes', '#f4cd5e', '#eebb45', 0.12);
    this.fitas = [rig(this.paredes[0].pivo, 'fitas'), rig(this.paredes[N].pivo, 'fitas')];
    for (const [k, hh] of [[0, 0.64], [0, 0.46], [N, 0.64], [N, 0.46]]) {
      const y = H * hh;
      const pts = k === 0
        ? [[R + 0.02, y], [R + 0.22, y + 0.01], [R + 0.38, y - 0.08], [R + 0.56, y - 0.05], [R + 0.92, y - 0.16]]
        : [[R + 0.02, y], [R + 0.12, y - 0.02], [R + 0.2, y - 0.06]];
      piece(this.fitas[k === 0 ? 0 : 1], stroke(pts, 0.075), fita, { z: k === 0 ? 0.03 : -0.03, t: 0.006, edge: '#e6b23c', jitter: 0 });
    }
    bake(this.paredes[0].pivo); bake(this.paredes[N].pivo);
    // lombada central
    this.eixo = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.05), new THREE.MeshLambertMaterial({ color: COR_CAPA }));
    this.eixo.position.y = H + 0.07; this.raiz.add(this.eixo);
  }
  _construirCunhas() {
    for (let j = 0; j < N; j++) {
      const g = new THREE.Group(); g.name = `cena-${j}`; this.anel.add(g);
      const conteudo = new THREE.Group(); g.add(conteudo);
      // disco do chão
      const disco = piece(conteudo, sector(R + 0.03, CUNHA / 2), CEUS[j].chao, { t: 0.04, edge: shade(CEUS[j].disco, -0.1), jitter: 0 });
      disco.rotation.x = Math.PI / 2; disco.position.y = 0.05; disco.name = 'disco';
      this.cunhas.push({ g, conteudo, j });
    }
  }
  _construirMiolo() {
    // bloco de páginas visível só com o livro fechado
    const m = new THREE.MeshLambertMaterial({ map: this._texturaMiolo() });
    this.miolo = new THREE.Mesh(new THREE.BoxGeometry(R - 0.02, H, ESPESSURA - 0.08), m);
    this.miolo.position.set((R - 0.02) / 2, H / 2 + 0.0, 0); this.miolo.castShadow = true; this.miolo.receiveShadow = true; this.anel.add(this.miolo);
    this.dorso = new THREE.Mesh(new THREE.BoxGeometry(0.045, H + 0.1, ESPESSURA + 0.03), new THREE.MeshLambertMaterial({ color: shade(COR_CAPA, -0.04) }));
    this.dorso.position.set(-0.012, H / 2 + 0.0, 0); this.dorso.castShadow = true; this.anel.add(this.dorso);
  }
  _texturaMiolo() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256; const ctx = c.getContext('2d'); ctx.fillStyle = '#f07f8b'; ctx.fillRect(0, 0, 64, 256);
    ctx.fillStyle = 'rgba(160,40,70,.28)'; for (let i = 0; i < 64; i += 4) ctx.fillRect(i, 0, 1, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  aplicarCapa(arte) {
    this.materialCapa.map = texturaDe(pintaCapa(arte), this.aniso); this.materialCapa.color.set('#ffffff'); this.materialCapa.needsUpdate = true;
  }
  /** o: 0 fechado, 1 aberto em estrela. */
  definirAbertura(o) {
    this.abertura = o;
    const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const angulos = [];
    for (const p of this.paredes) {
      const k = p.k;
      const atraso = k === 0 ? 0 : 0.14 + 0.32 * (k / N); const durac = k === 0 ? 0.75 : 0.54;
      const t = easeIO(THREE.MathUtils.clamp((o - atraso) / durac, 0, 1));
      const a = this.anguloFinal(k) * t + (k === N && o >= 0.999 ? -0.0 : 0);
      angulos.push(a);
      p.pivo.rotation.y = -a;
      const z0 = ((N / 2 - k) / N) * (ESPESSURA - 0.03);
      // abertas, as capas ficam costas com costas: cada miolo vira para a sua cena
      const fora = (k === 0 ? -1 : k === N ? 1 : 0) * 0.024 * t;
      p.pivo.position.set(Math.sin(-a) * fora, 0, z0 * (1 - t) + Math.cos(-a) * fora);
      p.m.castShadow = o < 0.85;
    }
    for (const c of this.cunhas) {
      const aE = angulos[c.j], aD = angulos[c.j + 1];
      const metade = (aE - aD) / 2; const centro = (aE + aD) / 2;
      const q = Math.tan(Math.max(metade, 0.0001)) / Math.tan(CUNHA / 2);
      c.g.rotation.y = Math.PI / 2 - centro;
      c.conteudo.scale.set(Math.min(q, 1), Math.min(1, Math.max(0.02, (metade / (CUNHA / 2)) ** 0.7)), 1);
      c.g.visible = metade > 0.05;
    }
    const fechado = o < 0.16;
    this.miolo.visible = fechado; this.dorso.visible = o < 0.5; this.eixo.visible = o >= 0.5;
    for (const f of this.fitas) f.visible = o < 0.6;
  }
  /** Só desenha o que pode aparecer: mantém o giro leve e as sombras limpas. */
  cullPorGiro(giro, aberto) {
    if (!aberto) return;
    for (const c of this.cunhas) {
      const d = Math.abs(((c.j * CUNHA - giro + Math.PI * 3) % TAU) - Math.PI);
      c.g.visible = c.g.visible && Math.PI - d > -1;
      c.g.visible = d < CUNHA * 2.7;
    }
  }
}

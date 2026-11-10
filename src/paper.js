// Kit de papel: cada peça é um recorte extrudado de verdade, com miolo claro no corte e estampa própria.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const TAU = Math.PI * 2;

// ---- aleatório determinístico ----------------------------------------------------------------
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---- formas (listas de pontos, y para cima) ----------------------------------------------------
export function ellipse(rx, ry = rx, cx = 0, cy = 0, n = 36) {
  const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p;
}
export function rect(w, h, cx = 0, cy = 0) { return [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]]; }
export function rrect(w, h, r = Math.min(w, h) * 0.25, cx = 0, cy = 0, n = 5) {
  const out = []; const hw = w / 2 - r, hh = h / 2 - r;
  [[hw, hh, 0], [-hw, hh, 1], [-hw, -hh, 2], [hw, -hh, 3]].forEach(([x, y, q]) => {
    for (let i = 0; i <= n; i++) { const a = (q + i / n) * (Math.PI / 2); out.push([cx + x + Math.cos(a) * r, cy + y + Math.sin(a) * r]); }
  });
  return out;
}
export function poly(...pts) { return pts; }
/** Curva fechada suave que passa pelos pontos (Catmull-Rom). */
export function blob(pts, steps = 8) {
  const out = []; const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
}
/** Curva aberta suave engrossada: traço recortado com largura que pode afinar. */
export function stroke(pts, width = 0.03, { taper = 0, steps = 8 } = {}) {
  const line = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      line.push([
        0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  line.push(pts[pts.length - 1]);
  const left = [], right = [];
  line.forEach((p, i) => {
    const a = line[Math.max(i - 1, 0)], b = line[Math.min(i + 1, line.length - 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const k = 1 - taper * (i / (line.length - 1));
    const w = (width / 2) * k;
    left.push([p[0] - (dy / l) * w, p[1] + (dx / l) * w]);
    right.push([p[0] + (dy / l) * w, p[1] - (dx / l) * w]);
  });
  return left.concat(right.reverse());
}
export function star(points = 5, r1 = 0.1, r2 = r1 * 0.45, cx = 0, cy = 0, rot = Math.PI / 2) {
  const p = []; for (let i = 0; i < points * 2; i++) { const r = i % 2 ? r2 : r1, a = rot + (i / (points * 2)) * TAU; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p;
}
/** Contorno de nuvem/copa: círculo com lóbulos. */
export function scallop(rx, ry, lobes = 9, depth = 0.12, cx = 0, cy = 0, n = 10) {
  const p = [];
  for (let i = 0; i < lobes; i++) for (let s = 0; s < n; s++) {
    const t = (i + s / n) / lobes, a = t * TAU, bump = Math.abs(Math.sin((s / n) * Math.PI));
    const k = 1 + depth * (bump - 0.5) * 2;
    p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return p;
}
export function cloud(w = 0.5, h = 0.22) {
  return blob([[-w * 0.5, -h * 0.35], [-w * 0.42, h * 0.08], [-w * 0.2, h * 0.14], [-w * 0.1, h * 0.5], [w * 0.14, h * 0.42], [w * 0.24, h * 0.14], [w * 0.44, h * 0.08], [w * 0.5, -h * 0.35], [0, -h * 0.5]]);
}
/** Faixa com topo ondulado e base reta. */
export function wave(w, h, amp = 0.05, waves = 2, phase = 0, n = 48) {
  const p = [[-w / 2, 0], [w / 2, 0]];
  for (let i = n; i >= 0; i--) { const t = i / n; p.push([-w / 2 + w * t, h + Math.sin(t * waves * TAU + phase) * amp]); }
  return p;
}
export function hill(w, h, skew = 0) {
  const n = 28, p = [[-w / 2, 0], [w / 2, 0]];
  for (let i = n; i >= 0; i--) { const t = i / n; const y = Math.sin(t * Math.PI) ** 0.75; p.push([-w / 2 + w * t + skew * y, h * y]); }
  return p;
}
/** Setor circular plano (chão do carrossel), no plano x/y com vértice na origem e centro para +y. */
export function sector(r, half, n = 24) {
  const p = [[0, 0]]; for (let i = 0; i <= n; i++) { const a = -half + (2 * half * i) / n; p.push([Math.sin(a) * r, Math.cos(a) * r]); } return p;
}
export function flame(w = 0.2, h = 0.35) {
  return blob([[0, 0], [w * 0.42, h * 0.1], [w * 0.5, h * 0.38], [w * 0.2, h * 0.58], [w * 0.28, h * 0.85], [0, h], [-w * 0.1, h * 0.72], [-w * 0.4, h * 0.6], [-w * 0.5, h * 0.3], [-w * 0.36, h * 0.06]]);
}
export function heart(s = 0.1) {
  return blob([[0, -s], [s * 0.85, -s * 0.05], [s * 0.72, s * 0.62], [s * 0.3, s * 0.72], [0, s * 0.35], [-s * 0.3, s * 0.72], [-s * 0.72, s * 0.62], [-s * 0.85, -s * 0.05]]);
}
export function spiral(r = 0.15, turns = 1.6, width = 0.028, n = 34) {
  const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * TAU, k = r * (1 - t * 0.85); pts.push([Math.cos(a) * k, Math.sin(a) * k]); }
  return stroke(pts, width, { taper: 0.6, steps: 2 });
}
/** Leve tremor de tesoura no contorno. */
export function cut(pts, amount = 0.004, seed = 7) {
  const r = rng(seed); return pts.map(([x, y]) => [x + (r() - 0.5) * amount, y + (r() - 0.5) * amount]);
}
function toShape(pts, holes = []) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  return shape;
}

// ---- estampas -----------------------------------------------------------------------------------
const TILE = 256;
let grainCanvas = null;
function grain() {
  if (grainCanvas) return grainCanvas;
  grainCanvas = document.createElement('canvas'); grainCanvas.width = grainCanvas.height = TILE;
  const ctx = grainCanvas.getContext('2d'); const img = ctx.createImageData(TILE, TILE); const r = rng(42);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - 0.5) * 80; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  // fibras
  ctx.globalAlpha = 0.09; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  for (let i = 0; i < 90; i++) { const x = r() * TILE, y = r() * TILE, a = r() * TAU, l = 8 + r() * 26; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
  return grainCanvas;
}
function shade(hex, amt) {
  const c = new THREE.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amt))); return `#${c.getHexString()}`;
}
const painters = {
  plain(ctx, s, [a]) { ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); },
  stripes(ctx, s, [a, b]) { ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); ctx.fillStyle = b || shade(a, -0.05); for (let y = 0; y < s; y += s / 4) ctx.fillRect(0, y, s, s / 8); },
  vstripes(ctx, s, [a, b]) { ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); ctx.fillStyle = b || shade(a, -0.05); for (let x = 0; x < s; x += s / 4) ctx.fillRect(x, 0, s / 8, s); },
  diagonal(ctx, s, [a, b]) {
    ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); ctx.strokeStyle = b || shade(a, -0.06); ctx.lineWidth = s / 9;
    for (let i = -s; i <= s * 2; i += s / 3) { ctx.beginPath(); ctx.moveTo(i, s); ctx.lineTo(i + s, 0); ctx.stroke(); }
  },
  chevron(ctx, s, [a, b]) {
    ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); ctx.strokeStyle = b || shade(a, -0.07); ctx.lineWidth = s / 12; ctx.lineJoin = 'miter';
    for (let y = -s / 4; y < s * 1.25; y += s / 4) { ctx.beginPath(); ctx.moveTo(0, y + s / 8); ctx.lineTo(s / 4, y); ctx.lineTo(s / 2, y + s / 8); ctx.lineTo((3 * s) / 4, y); ctx.lineTo(s, y + s / 8); ctx.stroke(); }
  },
  dots(ctx, s, [a, b]) {
    ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); ctx.fillStyle = b || shade(a, 0.1); const r = s / 14;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc((i + (j % 2) * 0.5) * (s / 4) + s / 8, j * (s / 4) + s / 8, r, 0, TAU); ctx.fill(); if (i === 0 && j % 2) { ctx.beginPath(); ctx.arc(0, j * (s / 4) + s / 8, r, 0, TAU); ctx.fill(); } }
  },
  weave(ctx, s, [a, b]) {
    ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); ctx.fillStyle = b || shade(a, -0.06); const c = s / 8;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) if ((i + j) % 2 === 0) ctx.fillRect(i * c + 1, j * c + c * 0.25, c - 2, c * 0.5);
    ctx.fillStyle = b ? shade(b, 0.05) : shade(a, 0.05);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) if ((i + j) % 2 === 1) ctx.fillRect(i * c + c * 0.25, j * c + 1, c * 0.5, c - 2);
  },
  gingham(ctx, s, [a, b]) {
    ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); ctx.fillStyle = b || shade(a, -0.1); ctx.globalAlpha = 0.5; const c = s / 4;
    for (let i = 0; i < 4; i += 2) ctx.fillRect(i * c, 0, c, s);
    for (let i = 0; i < 4; i += 2) ctx.fillRect(0, i * c, s, c);
    ctx.globalAlpha = 1;
  },
  scales(ctx, s, [a, b]) {
    ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); ctx.strokeStyle = b || shade(a, -0.08); ctx.lineWidth = s / 50; const c = s / 4;
    for (let j = -1; j < 9; j++) for (let i = -1; i < 5; i++) { ctx.beginPath(); ctx.arc(i * c + (j % 2 ? c / 2 : 0) + c / 2, (j * c) / 2, c / 2, 0, Math.PI); ctx.stroke(); }
  },
  straw(ctx, s, [a, b]) {
    ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); const r = rng(9); ctx.lineCap = 'round';
    for (let i = 0; i < 150; i++) {
      const x = r() * s, y = r() * s, l = 18 + r() * 34, an = Math.PI / 2 + (r() - 0.5) * 0.5;
      ctx.strokeStyle = r() > 0.5 ? (b || shade(a, -0.14)) : shade(a, 0.1); ctx.lineWidth = 1.5 + r() * 2.5;
      for (const [ox, oy] of [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s]]) { ctx.beginPath(); ctx.moveTo(x + ox, y + oy); ctx.lineTo(x + ox + Math.cos(an) * l, y + oy + Math.sin(an) * l); ctx.stroke(); }
    }
  },
  wood(ctx, s, [a, b]) {
    ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); const r = rng(5); ctx.strokeStyle = b || shade(a, -0.1);
    for (let i = 0; i < 18; i++) { const x = (i / 18) * s + r() * 5; ctx.lineWidth = 1 + r() * 2.2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 5, s / 3, x - 5, (2 * s) / 3, x, s); ctx.stroke(); }
  },
  brick(ctx, s, [a, b]) {
    ctx.fillStyle = b || '#f2ddc4'; ctx.fillRect(0, 0, s, s); const rows = 4, h = s / rows, w = s / 2, r = rng(3);
    for (let j = 0; j < rows; j++) for (let i = -1; i < 3; i++) {
      ctx.fillStyle = shade(a, (r() - 0.5) * 0.09); ctx.fillRect(i * w + (j % 2 ? w / 2 : 0) + 3, j * h + 3, w - 6, h - 6);
    }
  },
  shingle(ctx, s, [a, b]) {
    ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); const c = s / 4; ctx.strokeStyle = b || shade(a, -0.12); ctx.lineWidth = 3;
    for (let j = -1; j < 5; j++) for (let i = -1; i < 5; i++) { const x = i * c + (j % 2 ? c / 2 : 0), y = j * c; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + c * 0.7); ctx.arc(x + c / 2, y + c * 0.7, c / 2, Math.PI, 0, true); ctx.lineTo(x + c, y); ctx.stroke(); }
  },
  grass(ctx, s, [a, b]) {
    ctx.fillStyle = a; ctx.fillRect(0, 0, s, s); const r = rng(11); ctx.strokeStyle = b || shade(a, -0.07); ctx.lineCap = 'round';
    for (let i = 0; i < 60; i++) { const x = r() * s, y = r() * s; ctx.lineWidth = 2 + r() * 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 8, y - 8 - r() * 8); ctx.stroke(); }
  },
};
const textureCache = new Map();
function patternTexture(name, colors) {
  const key = `${name}:${colors.join(',')}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = TILE; const ctx = c.getContext('2d');
  painters[name](ctx, TILE, colors);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.34; ctx.drawImage(grain(), 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  textureCache.set(key, t); return t;
}
const materialCache = new Map();
/** pat('chevron', '#a', '#b', 0.3) ou uma cor. O último número é o lado do ladrilho em unidades do mundo. */
export function pat(name, a, b, scale = 0.32) { return { name, colors: b ? [a, b] : [a], scale }; }
function materialFor(paint, opts = {}) {
  const p = typeof paint === 'string' ? { name: 'plain', colors: [paint], scale: 0.4 } : paint;
  const key = `${p.name}:${p.colors.join(',')}:${opts.basic ? 'b' : 'l'}`;
  if (materialCache.has(key)) return { mat: materialCache.get(key), p };
  const params = { map: patternTexture(p.name, p.colors) };
  const mat = opts.basic ? new THREE.MeshBasicMaterial(params) : new THREE.MeshLambertMaterial(params);
  mat.name = key; materialCache.set(key, mat); return { mat, p };
}
function edgeMaterial(hex) {
  const key = `edge:${hex}`;
  if (!materialCache.has(key)) { const m = new THREE.MeshLambertMaterial({ color: hex }); m.name = key; materialCache.set(key, m); }
  return materialCache.get(key);
}

// ---- peças -----------------------------------------------------------------------------------
const THICK = 0.014;
let pieceSeed = 1;
/**
 * Recorta uma peça e a pendura em `parent`. opts: x,y,z,rot,s,sx,sy, t (espessura), edge (cor do corte),
 * holes, uvRot, name, glow (ignora luz e sombra), noShadow, jitter.
 */
export function piece(parent, pts, paint, opts = {}) {
  const { x = 0, y = 0, z = 0, rot = 0, s = 1, sx = s, sy = s, t = THICK, edge = '#fff6e6', holes = [], uvRot = 0, name = '', glow = false, noShadow = false, jitter = 0.0035 } = opts;
  pieceSeed = (pieceSeed * 1.0001 + 13) % 100000;
  const contour = jitter ? cut(pts, jitter, pieceSeed | 0) : pts;
  const geo = new THREE.ExtrudeGeometry(toShape(contour, holes), { depth: t, bevelEnabled: false, curveSegments: 1, steps: 1 });
  const { mat, p } = materialFor(paint, { basic: glow });
  // UV de estampa em unidades do mundo, com deslocamento próprio de cada folha
  const uv = geo.attributes.uv; const pos = geo.attributes.position; const offU = (pieceSeed * 0.137) % 1, offV = (pieceSeed * 0.291) % 1;
  const c = Math.cos(uvRot), n = Math.sin(uvRot);
  for (let i = 0; i < uv.count; i++) {
    const px = pos.getX(i), py = pos.getY(i);
    uv.setXY(i, (px * c - py * n) / p.scale + offU, (px * n + py * c) / p.scale + offV);
  }
  const mesh = new THREE.Mesh(geo, [mat, glow ? mat : edgeMaterial(edge)]);
  mesh.position.set(x, y, z); mesh.rotation.z = rot; mesh.scale.set(sx, sy, 1);
  mesh.castShadow = !noShadow && !glow; mesh.receiveShadow = !glow; mesh.name = name; mesh.userData.paper = true;
  parent.add(mesh);
  return mesh;
}
/** Grupo articulado: sobrevive à fusão e pode ser animado. */
export function rig(parent, name = '', { x = 0, y = 0, z = 0, rot = 0, s = 1, sx = s, sy = s } = {}) {
  const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); g.rotation.z = rot; g.scale.set(sx, sy, 1); g.userData.rig = true; parent.add(g); return g;
}
/** Grupo estático: serve só para agrupar transformações e é fundido no rig acima. */
export function group(parent, { x = 0, y = 0, z = 0, rot = 0, s = 1, sx = s, sy = s } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.z = rot; g.scale.set(sx, sy, 1); parent.add(g); return g;
}

// ---- fusão por material: reduz chamadas de desenho sem mudar a imagem ---------------------------------
function sliceGroup(geo, g) {
  const out = new THREE.BufferGeometry(); const a = g.start, n = g.count;
  for (const name of ['position', 'normal', 'uv']) {
    const attr = geo.attributes[name]; out.setAttribute(name, new THREE.BufferAttribute(attr.array.slice(a * attr.itemSize, (a + n) * attr.itemSize), attr.itemSize));
  }
  return out;
}
function flipWinding(geo) {
  for (const name of ['position', 'normal', 'uv']) {
    const attr = geo.attributes[name], k = attr.itemSize, arr = attr.array;
    for (let i = 0; i < attr.count; i += 3) for (let j = 0; j < k; j++) { const t = arr[(i + 1) * k + j]; arr[(i + 1) * k + j] = arr[(i + 2) * k + j]; arr[(i + 2) * k + j] = t; }
  }
}
export function bake(root) {
  root.updateMatrixWorld(true);
  const stats = { pieces: 0, draws: 0, triangles: 0 };
  const visit = (rigNode) => {
    const buckets = new Map(); const remove = []; const inv = rigNode.matrixWorld.clone().invert();
    const walk = (node) => {
      for (const child of [...node.children]) {
        if (child.userData.rig) { visit(child); continue; }
        if (child.isMesh && child.userData.paper) {
          const m = inv.clone().multiply(child.matrixWorld); const flip = m.determinant() < 0; stats.pieces++;
          const mats = child.material; const geo = child.geometry;
          geo.groups.forEach((g) => {
            const part = sliceGroup(geo, g); part.applyMatrix4(m); if (flip) flipWinding(part);
            const mat = mats[g.materialIndex]; const k = `${mat.name}|${child.castShadow}|${child.receiveShadow}`;
            if (!buckets.has(k)) buckets.set(k, { mat, cast: child.castShadow, recv: child.receiveShadow, geos: [] });
            buckets.get(k).geos.push(part);
          });
          geo.dispose(); remove.push(child); continue;
        }
        walk(child);
      }
    };
    walk(rigNode);
    remove.forEach((m) => m.removeFromParent());
    for (const b of buckets.values()) {
      const merged = mergeGeometries(b.geos, false); b.geos.forEach((g) => g.dispose());
      const mesh = new THREE.Mesh(merged, b.mat); mesh.castShadow = b.cast; mesh.receiveShadow = b.recv; mesh.userData.baked = true; rigNode.add(mesh);
      stats.draws++; stats.triangles += merged.attributes.position.count / 3;
    }
  };
  visit(root);
  return stats;
}
export { shade, TILE };

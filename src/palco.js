// Ajudantes para compor uma cunha do carrossel. x: lado a lado; z: raio, da lombada para a frente.
import * as THREE from 'three';
import { piece, rig, group, pat, star, ellipse, spiral, stroke, rng, shade } from './paper.js';
import { CUNHA } from './book.js';
import { ease } from './tween.js';

const T = Math.tan(CUNHA / 2);
export const SOLO = 0.05;
/** Meia largura útil da cunha nesse raio. */
export const meiaLargura = (z) => z * T - 0.025;

export function palco(conteudo) {
  const p = {
    conteudo,
    /** Peça deitada no chão: a forma usa (x, raio). */
    chao(pts, paint, { y = 0.006, t = 0.006, edge = '#fff6e6' } = {}) {
      const m = piece(conteudo, pts, paint, { t, edge, jitter: 0.002 }); m.rotation.x = Math.PI / 2; m.position.y = SOLO + y; return m;
    },
    /** Grupo em pé, plantado no chão. */
    pe(x, z, s = 1) { return group(conteudo, { x, y: SOLO, z, s }); },
    rig(x, z, name = '', s = 1) { return rig(conteudo, name, { x, y: SOLO, z, s }); },
    /** Grupo colado à parede interna. lado -1 esquerda, 1 direita; r: distância da lombada. */
    parede(lado, r, y, s = 1) {
      const a = CUNHA / 2; const nx = -lado * Math.cos(a), nz = Math.sin(a);
      const g = new THREE.Group(); g.position.set(lado * Math.sin(a) * r + nx * 0.012, y, Math.cos(a) * r + nz * 0.012);
      g.rotation.y = Math.atan2(nx, nz); g.scale.setScalar(s); g.userData.naParede = true; conteudo.add(g); return g;
    },
    /** Grupo livre, sem plantar. */
    alto(x, y, z, s = 1) { return group(conteudo, { x, y, z, s }); },
  };
  return p;
}

/** Sopro de papel: espirais e riscos saindo de (x,y) na direção do alvo. */
export function sopro(conteudo, tl, t0, dur, { x, y, z, alvoX, alvoY, alvoZ, cor = '#fff8ee', n = 9, largura = 0.26, seed = 3 }) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const g = rig(conteudo, 'sopro', { x, y, z, s: 0.001 });
    if (i % 3 === 0) piece(g, spiral(0.08 + r() * 0.05, 1.5, 0.018), cor, { t: 0.005, edge: '#ffffff', jitter: 0, noShadow: true });
    else piece(g, stroke([[-0.13, 0], [0, 0.018], [0.13, 0]], 0.02, { taper: 0.75 }), cor, { t: 0.005, edge: '#ffffff', jitter: 0, noShadow: true });
    const ini = t0 + r() * (dur - 0.42); const d = 0.42 + r() * 0.24;
    const off = (r() - 0.5) * largura;
    tl.to(g, { s: 1 }, ini, 0.08, ease.out);
    tl.to(g, { x: alvoX + r() * 0.05, y: alvoY + off, z: alvoZ }, ini, d, ease.linear);
    tl.to(g, { rz: (r() - 0.5) * 3 }, ini, d, ease.linear);
    tl.to(g, { s: 0.001 }, ini + d - 0.1, 0.1, ease.linear);
  }
}
/** Revoada: pedaços que saem de um ponto e caem longe. */
export function revoada(conteudo, tl, t0, n, formas, { x, y, z, dx = 1, alto = 1, espalha = 0.5, seed = 5, queda = 0.05, dur = 1.3 }) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const g = rig(conteudo, 'pedaco', { x: x + (r() - 0.5) * espalha, y: y + (r() - 0.5) * espalha * 0.8, z: z + r() * 0.04, s: 0.001 });
    const f = formas[i % formas.length]; piece(g, f.pts, f.paint, { t: 0.005, edge: f.edge || '#fff2c0', jitter: 0.001 });
    const ini = t0 + r() * 0.34; const d = dur + r() * 0.6;
    const destX = x + dx * (0.25 + r() * 0.75); const pico = y + alto * (0.25 + r() * 0.6);
    tl.to(g, { s: 0.7 + r() * 0.6 }, ini, 0.06, ease.out);
    tl.to(g, { x: destX }, ini, d, ease.out);
    tl.to(g, { y: pico }, ini, d * 0.42, ease.out);
    tl.to(g, { y: queda + r() * 0.05 }, ini + d * 0.42, d * 0.58, ease.in);
    tl.to(g, { rz: (r() - 0.5) * 11 }, ini, d, ease.out);
    if (i % 3 === 0) tl.to(g, { s: 0.001 }, ini + d + 0.1, 0.25, ease.linear);
  }
}
export { ease };

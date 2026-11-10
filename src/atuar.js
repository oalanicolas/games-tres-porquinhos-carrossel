// Atuação dos personagens: olhar, expressão, antecipação, pulo, chegada e tremor.
// Puro e sem estado global: cada helper recebe a Timeline e o ator (`porco(...)` ou `lobo(...)`) e escreve trilhas.
// Funciona com ou sem a opção `vivo`: uma peça que o ator não tem (sobrancelha de porco sem `vivo`, por exemplo) é ignorada.
// Nenhum helper chama `tl.grupo`: quem chama escolhe o grupo (e a palavra) a que o gesto pertence.
// Só usa o que `to` e `pulse` aceitam: x, y, z, rx, ry, rz, sx, sy, sz (e `s` em `to`).
import { ease } from './tween.js';

/** Duração da antecipação (s) e do assento da chegada: `pulo` termina em t + ANTECIPACAO + dur + ASSENTO. */
export const ANTECIPACAO = 0.14;
export const ASSENTO = 0.34;

const arco = (u) => 4 * u * (1 - u); // parábola do salto: 0 no chão, 1 no ápice
const rebote = (u) => Math.sin(u * Math.PI * 3) * (1 - u) ** 1.5; // 1,5 ciclo amortecido: amassa, estica, amassa de leve

/** Valores de repouso, lidos uma vez na primeira chamada (na montagem, antes de a linha do tempo mexer em qualquer peça). */
const rep = (o) => (o.userData.rep ??= { x: o.position.x, y: o.position.y, rz: o.rotation.z, sx: o.scale.x, sy: o.scale.y });
const lado = (q) => (q.root && q.root.scale.x < 0 ? -1 : 1); // personagem `virado`: a esquerda local é a direita da tela

// ---- olhar ------------------------------------------------------------------------------------------
// Alcance da pupila em cada direção, em unidades da própria pupila. O do Lobo é assimétrico: na pelúcia a pupila já mora perto do focinho.
const ALCANCE = {
  porco: { dir: 0.017, esq: 0.017, cima: 0.024, baixo: 0.013 },
  lobo: { dir: 0.022, esq: 0.07, cima: 0.045, baixo: 0.06 },
};

/**
 * Move as pupilas (porco: `pupilas`; Lobo: `pupila`). dx e dy vão de -1 a 1 e são da TELA: dx>0 olha para a direita, dy>0 para cima,
 * mesmo com o personagem `virado`. `olhar(tl, q, 0, 0, t)` volta ao centro (a posição de repouso da pupila).
 */
export function olhar(tl, q, dx = 0, dy = 0, t = 0, dur = 0.16) {
  const p = q.pupilas ?? q.pupila; if (!p) return tl;
  const a = q.pupilas ? ALCANCE.porco : ALCANCE.lobo; const r = rep(p);
  const x = Math.max(-1, Math.min(1, dx)) * lado(q); const y = Math.max(-1, Math.min(1, dy));
  tl.to(p, { x: r.x + x * (x > 0 ? a.dir : a.esq), y: r.y + y * (y > 0 ? a.cima : a.baixo) }, t, dur, ease.out);
  return tl;
}

// ---- expressão --------------------------------------------------------------------------------------
// sy: sobrancelha sobe (+) ou desce (-). inc (porco): ponta de dentro da sobrancelha sobe (+, medo) ou desce (-, bravo).
// sz (Lobo): rotação da sobrancelha, ponta da frente para cima (+). ol: escala [x, y] dos olhos. out: orelhas para trás/fora (+) ou em pé (-).
// pu: escala das pupilas (porco).
const PORCO = {
  neutro: { sy: 0, inc: 0, ol: [1, 1], out: 0, pu: 1 },
  alegre: { sy: 0.014, inc: 0.06, ol: [1, 0.84], out: -0.12, pu: 1 },
  susto: { sy: 0.04, inc: 0, ol: [1.16, 1.2], out: -0.2, pu: 0.8 },
  medo: { sy: 0.03, inc: 0.34, ol: [1.08, 1.12], out: 0.3, pu: 0.85 },
  bravo: { sy: -0.012, inc: -0.4, ol: [1, 0.8], out: 0.2, pu: 1.05 },
};
const LOBO = {
  neutro: { sy: 0, sz: 0, ol: [1, 1], out: 0 },
  alegre: { sy: 0.014, sz: 0.1, ol: [1, 0.88], out: -0.05 },
  susto: { sy: 0.035, sz: 0.14, ol: [1.22, 1.25], out: -0.1 },
  medo: { sy: 0.02, sz: 0.24, ol: [1.12, 1.16], out: 0.3 },
  bravo: { sy: -0.012, sz: -0.3, ol: [1, 0.84], out: 0.2 },
};

function aplicar(tl, q, e, t, dur, fn) {
  const lobo = !!q.pupila;
  if (q.sobrE && q.sobrD) {
    const a = rep(q.sobrE), b = rep(q.sobrD);
    tl.to(q.sobrE, { y: a.y + e.sy, rz: a.rz + e.inc }, t, dur, fn);
    tl.to(q.sobrD, { y: b.y + e.sy, rz: b.rz - e.inc }, t, dur, fn);
  }
  if (q.sobr) { const r = rep(q.sobr); tl.to(q.sobr, { y: r.y + e.sy, rz: r.rz + e.sz }, t, dur, fn); }
  for (const o of [q.olhos, q.olho, q.olhoLonge]) if (o) { const r = rep(o); tl.to(o, { sx: r.sx * e.ol[0], sy: r.sy * e.ol[1] }, t, dur, fn); }
  if (q.pupilas) { const r = rep(q.pupilas); tl.to(q.pupilas, { s: r.sx * e.pu }, t, dur, fn); }
  if (lobo) {
    if (q.orelhaF) tl.to(q.orelhaF, { rz: rep(q.orelhaF).rz + e.out }, t, dur, fn);
    if (q.orelhaT) tl.to(q.orelhaT, { rz: rep(q.orelhaT).rz + e.out * 0.8 }, t, dur, fn);
  } else {
    if (q.orelhaE) tl.to(q.orelhaE, { rz: rep(q.orelhaE).rz + e.out }, t, dur, fn);
    if (q.orelhaD) tl.to(q.orelhaD, { rz: rep(q.orelhaD).rz - e.out }, t, dur, fn);
  }
}

/**
 * Muda a expressão: 'alegre' | 'susto' | 'medo' | 'bravo' | 'neutro'. Entra em 0,14 s. Com `dur`, segura esse tempo e volta ao neutro
 * em 0,22 s; sem `dur`, fica até outra expressão. Sem `vivo`, o porco não tem sobrancelha e o olho não pisca por escala (o idle antigo o escreve).
 */
export function expressao(tl, q, nome, t = 0, dur) {
  const tabela = q.pupila ? LOBO : PORCO; const e = tabela[nome]; if (!e) return tl;
  aplicar(tl, q, e, t, 0.14, ease.back);
  if (dur != null && nome !== 'neutro') aplicar(tl, q, tabela.neutro, t + dur, 0.22, ease.inOut);
  return tl;
}

// ---- corpo ------------------------------------------------------------------------------------------
/** Agacha o `corpo` (sy<1, sx>1, pés no chão) antes de um movimento. Fica agachado até o próximo movimento: `pulo`, `assentar` ou um `to`. */
export function antecipar(tl, q, t = 0, dur = ANTECIPACAO) {
  const r = rep(q.corpo);
  tl.to(q.corpo, { sx: r.sx * 1.1, sy: r.sy * 0.86 }, t, dur, ease.out);
  return tl;
}

// Orelhas e rabo atrasam em relação ao corpo: oscilam e assentam. Pulso relativo, então não desfaz expressão nem pose.
function secundario(tl, q, t, k) {
  if (q.pupila) {
    if (q.orelhaF) tl.pulse(q.orelhaF, { rz: 0.14 * k }, t + 0.05, 0.4, rebote);
    if (q.orelhaT) tl.pulse(q.orelhaT, { rz: 0.11 * k }, t + 0.07, 0.4, rebote);
  } else {
    if (q.orelhaE) tl.pulse(q.orelhaE, { rz: 0.16 * k }, t + 0.05, 0.4, rebote);
    if (q.orelhaD) tl.pulse(q.orelhaD, { rz: -0.16 * k }, t + 0.05, 0.4, rebote);
  }
  if (q.rabo) tl.pulse(q.rabo, { rz: 0.2 * k }, t + 0.08, 0.45, rebote);
}

/**
 * Pulo com squash & stretch no `corpo`: antecipa (ANTECIPACAO s a partir de t), decola, estica na subida, relaxa no ápice, estica de novo
 * na descida, amassa ao tocar o chão e assenta (ASSENTO s). `altura` em unidades da cena; `dur` é o tempo no ar. Termina em
 * t + ANTECIPACAO + dur + ASSENTO. O sinal de scale.x é preservado. A altura é um pulso em `corpo.y`: o deslocamento horizontal fica com a cena.
 */
export function pulo(tl, q, t = 0, altura = 0.2, dur = 0.5) {
  const c = q.corpo; const r = rep(c); const sg = r.sx < 0 ? -1 : 1; const ax = Math.abs(r.sx);
  const xs = (k) => ({ sx: sg * ax * k[0], sy: r.sy * k[1] });
  const dec = t + ANTECIPACAO; const pouso = dec + dur;
  antecipar(tl, q, t, ANTECIPACAO);
  tl.pulse(c, { y: altura }, dec, dur, arco);
  tl.to(c, xs([0.92, 1.14]), dec, dur * 0.35, ease.out); // sobe esticando
  tl.to(c, xs([0.98, 1.04]), dec + dur * 0.35, dur * 0.3, ease.inOut); // no ápice relaxa
  tl.to(c, xs([0.92, 1.12]), dec + dur * 0.65, dur * 0.35, ease.in); // cai esticando
  tl.to(c, xs([1.16, 0.8]), pouso, 0.06, ease.out); // amassa ao tocar o chão
  tl.to(c, xs([1, 1]), pouso + 0.06, ASSENTO - 0.06, ease.back); // assenta
  secundario(tl, q, pouso, 1);
  return tl;
}

/** Pequeno rebote de chegada: o corpo amassa, estica e assenta, e orelhas e rabo balançam com atraso. Não deixa pose nem expressão para trás. */
export function assentar(tl, q, t = 0) {
  const sg = rep(q.corpo).sx < 0 ? -1 : 1;
  tl.pulse(q.corpo, { sx: 0.07 * sg, sy: -0.09 }, t, ASSENTO + 0.08, rebote);
  secundario(tl, q, t, 1);
  return tl;
}

/** Tremor de medo por `dur` s (cerca de 11 Hz, perdendo um pouco de força): corpo e cabeça vibram em contrafase. */
export function tremer(tl, q, t = 0, dur = 0.8) {
  const n = Math.min(80, Math.max(2, Math.round(dur / 0.045))); const h = dur / n;
  for (let i = 0; i < n; i++) {
    const s = (i % 2 ? -1 : 1) * (1 - 0.35 * (i / n));
    tl.pulse(q.corpo, { rz: s * 0.02, x: s * 0.006 }, t + i * h, h);
    if (q.cabeca) tl.pulse(q.cabeca, { rz: -s * 0.014 }, t + i * h, h);
  }
  return tl;
}

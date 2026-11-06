// Linha do tempo determinística: cada trilha guarda início, duração e valores; seek(t) recompõe tudo.
export const ease = {
  linear: (t) => t,
  out: (t) => 1 - (1 - t) ** 3,
  in: (t) => t * t * t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t) => { const c = 1.70158; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; },
  bounce: (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
  sine: (t) => Math.sin(t * Math.PI), // vai e volta
  wiggle: (t) => Math.sin(t * Math.PI * 6) * (1 - t),
};

const KEYS = {
  x: (o) => [o.position, 'x'], y: (o) => [o.position, 'y'], z: (o) => [o.position, 'z'],
  rx: (o) => [o.rotation, 'x'], ry: (o) => [o.rotation, 'y'], rz: (o) => [o.rotation, 'z'],
  sx: (o) => [o.scale, 'x'], sy: (o) => [o.scale, 'y'], sz: (o) => [o.scale, 'z'],
};

export class Timeline {
  constructor() { this.tracks = []; this.calls = []; this.duration = 0; this.t = 0; this.playing = false; this.last = new Map(); this.initial = []; }
  _slot(obj, key) {
    const [holder, prop] = KEYS[key] ? KEYS[key](obj) : [obj, key];
    let byProp = this.last.get(holder);
    if (!byProp) { byProp = new Map(); this.last.set(holder, byProp); }
    if (!byProp.has(prop)) { byProp.set(prop, holder[prop]); this.initial.push([holder, prop, holder[prop]]); }
    return { holder, prop, byProp };
  }
  /** Anima de onde a trilha anterior parou até os valores pedidos. Escala uniforme com a chave `s`. */
  to(obj, props, start, dur, fn = ease.inOut) {
    const expanded = { ...props };
    if ('s' in expanded) { expanded.sx = expanded.s; expanded.sy = expanded.s; expanded.sz = expanded.s; delete expanded.s; }
    for (const [key, value] of Object.entries(expanded)) {
      const { holder, prop, byProp } = this._slot(obj, key);
      this.tracks.push({ holder, prop, from: byProp.get(prop), to: value, start, dur: Math.max(dur, 1e-4), fn, pulse: false });
      byProp.set(prop, value);
    }
    this.duration = Math.max(this.duration, start + dur);
    return this;
  }
  /** Oscila em torno do valor corrente e volta a ele; não muda o valor de saída. */
  pulse(obj, props, start, dur, fn = ease.sine) {
    const expanded = { ...props };
    if ('s' in expanded) { expanded.sx = expanded.s; expanded.sy = expanded.s; delete expanded.s; }
    for (const [key, amount] of Object.entries(expanded)) {
      const { holder, prop, byProp } = this._slot(obj, key);
      const base = byProp.get(prop);
      this.tracks.push({ holder, prop, from: base, to: base + amount, start, dur, fn, pulse: true });
    }
    this.duration = Math.max(this.duration, start + dur);
    return this;
  }
  call(fn, at) { this.calls.push({ fn, at, done: false }); this.duration = Math.max(this.duration, at); return this; }
  /** Por quadro, durante o trecho: fn(progresso 0..1). */
  run(fn, start, dur) { this.tracks.push({ custom: fn, start, dur }); this.duration = Math.max(this.duration, start + dur); return this; }
  reset() {
    for (const [holder, prop, value] of this.initial) holder[prop] = value;
    for (const c of this.calls) c.done = false;
    this.t = 0; this.playing = false;
    for (const tr of this.tracks) if (tr.custom) tr.custom(0);
  }
  seek(t, { silent = true } = {}) {
    this.t = t;
    for (const [holder, prop, value] of this.initial) holder[prop] = value;
    for (const tr of this.tracks) {
      const raw = (t - tr.start) / tr.dur;
      if (tr.custom) { if (raw >= 0) tr.custom(Math.min(raw, 1)); else tr.custom(0); continue; }
      if (raw < 0) continue;
      const p = Math.min(raw, 1);
      if (tr.pulse) { if (p < 1) tr.holder[tr.prop] = tr.from + (tr.to - tr.from) * tr.fn(p); continue; }
      tr.holder[tr.prop] = tr.from + (tr.to - tr.from) * tr.fn(p);
    }
    for (const c of this.calls) {
      if (t >= c.at && !c.done) { c.done = true; if (!silent) c.fn(); }
    }
  }
  update(dt) {
    if (!this.playing) return false;
    const next = Math.min(this.t + dt, this.duration);
    this.seek(next, { silent: false });
    if (next >= this.duration) { this.playing = false; return true; }
    return false;
  }
  play() { this.reset(); this.playing = true; }
}

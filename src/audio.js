// Som do livro: efeitos e ambientes em WebAudio, música em streaming, com fusão entre os momentos da história.
// Tudo vem de shared/sfx, montado por tools/sons.py (créditos em docs/creditos-sons.md).
import SONS from './sons.json';

const base = import.meta.env.BASE_URL;
const db = (v) => 10 ** (v / 20);
const FUSAO = 1.6;
const NIVEL_MUSICA = 0.72; const NIVEL_ACAO = 0.42;

// -1 é a capa; depois, uma entrada por cena
export const TRILHA = ['shuffle', 'hyperfun', 'marty', 'umlaut', 'getaway', 'moonlight', 'moonlight', 'delrio'];
const AMBIENTE = [
  { passaros: 0.8 }, { passaros: 0.7 }, { passaros: 0.5, brisa: 0.35 }, { passaros: 0.25, brisa: 0.6 },
  { brisa: 0.75 }, { grilos: 0.6, fogo: 0.55, fervura: 0.3 }, { grilos: 0.6, fogo: 0.55, fervura: 0.45 }, { grilos: 0.5, fogo: 0.4 },
];

export class Audio {
  constructor() {
    this.ligado = true; this.ctx = null; this.buffers = new Map(); this.camas = new Map(); this.faixas = new Map();
    this.atual = null; this.pedida = 'caixinha'; this.ambPedido = {}; this.oculto = false; this.cenaAtual = null;
  }
  destravar() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain(); this.master.gain.value = this.ligado ? 1 : 0;
      this.medidor = ctx.createAnalyser(); this.medidor.fftSize = 2048;
      this.master.connect(this.medidor); this.medidor.connect(ctx.destination);
      this.busMusica = ctx.createGain(); this.busMusica.gain.value = NIVEL_MUSICA; this.busMusica.connect(this.master);
      this.busAmb = ctx.createGain(); this.busAmb.gain.value = 0.8; this.busAmb.connect(this.master);
      for (const n of SONS.efeitos) this._carregar(n);
      for (const n of SONS.ambientes) this._carregar(n).then(() => this._iniciarCama(n));
      document.addEventListener('visibilitychange', () => this._visibilidade());
      this._tocarTrilha(this.pedida);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.atual && this.atual.el.paused && !this.oculto) this.atual.el.play().catch(() => {});
  }
  async _carregar(n) {
    try { const r = await fetch(`${base}sfx/${n}.mp3`); this.buffers.set(n, await this.ctx.decodeAudioData(await r.arrayBuffer())); } catch (e) { console.warn('som', n, e); }
  }
  _iniciarCama(n) {
    const b = this.buffers.get(n); if (!b || this.camas.has(n)) return;
    const g = this.ctx.createGain(); g.gain.value = 0; g.connect(this.busAmb);
    // a gravação de fogo tem 3 s: duas camadas em velocidades diferentes nunca repetem juntas
    for (const taxa of n === 'fogo' ? [1, 0.83] : [1]) {
      const s = this.ctx.createBufferSource(); s.buffer = b; s.loop = true; s.playbackRate.value = taxa;
      s.loopStart = SONS.pad; s.loopEnd = SONS.pad + SONS.lacos[n];
      s.connect(g); s.start(0, SONS.pad);
    }
    this.camas.set(n, g); this._aplicarAmbiente();
  }
  _aplicarAmbiente() {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    for (const [n, g] of this.camas) { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(this.ambPedido[n] || 0, t, 0.5); }
  }
  _faixa(nome) {
    let f = this.faixas.get(nome);
    if (!f) {
      const el = new window.Audio(`${base}musica/${SONS.musicas[nome].arquivo}`); el.loop = true; el.preload = 'auto';
      f = { nome, el, g: null }; this.faixas.set(nome, f);
    }
    if (this.ctx && !f.g) { f.g = this.ctx.createGain(); f.g.gain.value = 0; this.ctx.createMediaElementSource(f.el).connect(f.g); f.g.connect(this.busMusica); }
    return f;
  }
  _tocarTrilha(nome) {
    const f = this._faixa(nome); const t = this.ctx.currentTime; const antiga = this.atual;
    if (antiga === f) return;
    if (antiga) {
      antiga.g.gain.cancelScheduledValues(t); antiga.g.gain.setValueAtTime(antiga.g.gain.value, t); antiga.g.gain.linearRampToValueAtTime(0, t + FUSAO);
      const el = antiga.el; clearTimeout(antiga.pausa); antiga.pausa = setTimeout(() => { if (this.atual !== antiga) el.pause(); }, (FUSAO + 0.2) * 1000);
    }
    clearTimeout(f.pausa);
    f.g.gain.cancelScheduledValues(t); f.g.gain.setValueAtTime(f.g.gain.value, t); f.g.gain.linearRampToValueAtTime(db(SONS.musicas[nome].ganho_db), t + FUSAO);
    this.atual = f;
    if (!this.oculto) f.el.play().catch((e) => console.warn('música', nome, e.name));
  }
  /** Troca de música numa virada da história. */
  trilha(nome) { this.pedida = nome; if (this.ctx) this._tocarTrilha(nome); }
  /** Música e ambiente do momento: -1 é a capa. */
  cena(i) {
    if (i === this.cenaAtual) return;
    this.cenaAtual = i;
    this.trilha(i < 0 ? 'caixinha' : TRILHA[i]);
    this.ambPedido = i < 0 ? {} : AMBIENTE[i]; this._aplicarAmbiente();
    const prox = TRILHA[i + 1]; if (prox) this._faixa(prox);
  }
  /** A música cede lugar enquanto a cena age. */
  abaixar(seg) {
    if (!this.ctx) return; const t = this.ctx.currentTime; const g = this.busMusica.gain;
    g.cancelScheduledValues(t); g.setTargetAtTime(NIVEL_ACAO, t, 0.12); g.setTargetAtTime(NIVEL_MUSICA, t + seg, 0.7);
  }
  _visibilidade() {
    this.oculto = document.hidden; if (!this.ctx) return;
    if (document.hidden) { this.ctx.suspend(); this.atual?.el.pause(); } else { this.ctx.resume(); if (this.ligado) this.atual?.el.play().catch(() => {}); }
  }
  alternar() { this.ligado = !this.ligado; if (this.master) this.master.gain.setTargetAtTime(this.ligado ? 1 : 0, this.ctx.currentTime, 0.04); return this.ligado; }
  tocar(nome, { vol = 1, taxa = 1, depois = 0, dur = 0 } = {}) {
    if (!this.ctx || !this.ligado) return;
    const b = this.buffers.get(nome); if (!b) return;
    const s = this.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = taxa;
    const g = this.ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(this.master);
    const t = this.ctx.currentTime + depois;
    s.start(t);
    if (dur) { g.gain.setValueAtTime(vol, t + Math.max(dur - 0.25, 0)); g.gain.linearRampToValueAtTime(0, t + dur); s.stop(t + dur + 0.02); }
  }
  /** Para os testes: o que está tocando e quanto sinal chega à saída. */
  estado() {
    let dbfs = -Infinity;
    if (this.medidor) { const v = new Float32Array(this.medidor.fftSize); this.medidor.getFloatTimeDomainData(v); dbfs = 10 * Math.log10(v.reduce((s, x) => s + x * x, 0) / v.length + 1e-12); }
    return { contexto: this.ctx?.state, trilha: this.atual?.nome, tempo: this.atual?.el.currentTime, pausada: this.atual?.el.paused, efeitos: this.buffers.size, camas: this.camas.size, dbfs: Number(dbfs.toFixed(1)) };
  }
}

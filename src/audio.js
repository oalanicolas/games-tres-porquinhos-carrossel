// Som do livro: efeitos e ambientes em WebAudio, música em streaming, com fusão entre os momentos da história.
// Tudo vem de shared/sfx, montado por tools/sons.py (créditos em docs/creditos-sons.md).
import SONS from './sons.json';
import NARRACAO from './narracao.json';

const base = import.meta.env.BASE_URL;
const db = (v) => 10 ** (v / 20);
const FUSAO = 1.6;
const NIVEL_MUSICA = 0.72; const NIVEL_ACAO = 0.42; const NIVEL_SOB_VOZ = 0.3;
const NIVEL_AMB = 0.8; const NIVEL_AMB_SOB_VOZ = 0.5;
// tempo até a voz entrar: da capa o livro ainda está abrindo; numa virada, só o giro
const ATRASO_DA_CAPA = 2.6; const ATRASO_VIRADA = 0.6;

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
    this.faixasVoz = NARRACAO.faixas; this.nomeVoz = NARRACAO.voz; this.narrando = true; this.voz = null; this.vozes = new Map(); this.vozAgenda = null; this.acaoAte = 0; this.aoFimDaVoz = null;
  }
  destravar() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain(); this.master.gain.value = this.ligado ? 1 : 0;
      this.medidor = ctx.createAnalyser(); this.medidor.fftSize = 2048;
      this.master.connect(this.medidor); this.medidor.connect(ctx.destination);
      this.busMusica = ctx.createGain(); this.busMusica.gain.value = NIVEL_MUSICA; this.busMusica.connect(this.master);
      this.busAmb = ctx.createGain(); this.busAmb.gain.value = NIVEL_AMB; this.busAmb.connect(this.master);
      this.busVoz = ctx.createGain(); this.busVoz.connect(this.master);
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
    const daCapa = this.cenaAtual === null || this.cenaAtual < 0;
    this.cenaAtual = i;
    this._narrar(i, daCapa ? ATRASO_DA_CAPA : ATRASO_VIRADA);
    this.trilha(i < 0 ? 'caixinha' : TRILHA[i]);
    this.ambPedido = i < 0 ? {} : AMBIENTE[i]; this._aplicarAmbiente();
    const prox = TRILHA[i + 1]; if (prox) this._faixa(prox);
  }
  /** A música cede lugar enquanto a cena age. */
  abaixar(seg) {
    if (!this.ctx) return;
    this.acaoAte = this.ctx.currentTime + seg; this._aplicarNiveis();
  }
  /** Quem cede lugar a quem: a voz vem antes da ação, e a ação antes da música cheia. */
  _aplicarNiveis() {
    const t = this.ctx.currentTime; const g = this.busMusica.gain; const a = this.busAmb.gain;
    const emAcao = t < this.acaoAte;
    g.cancelScheduledValues(t); a.cancelScheduledValues(t);
    if (this.voz) g.setTargetAtTime(NIVEL_SOB_VOZ, t, 0.25);
    else if (emAcao) { g.setTargetAtTime(NIVEL_ACAO, t, 0.12); g.setTargetAtTime(NIVEL_MUSICA, this.acaoAte, 0.7); } else g.setTargetAtTime(NIVEL_MUSICA, t, 0.7);
    a.setTargetAtTime(this.voz ? NIVEL_AMB_SOB_VOZ : NIVEL_AMB, t, 0.4);
  }
  /** Há narração gravada? Sem ela, o botão nem aparece. */
  temNarracao() { return Object.keys(this.faixasVoz).length > 0; }
  _elementoVoz(i) {
    let v = this.vozes.get(i);
    if (!v) {
      const el = new window.Audio(`${base}narracao/${this.faixasVoz[i].arquivo}`); el.preload = 'auto';
      v = { i, el, g: null }; this.vozes.set(i, v);
      el.addEventListener('ended', () => { if (this.voz === v) { this.voz = null; this._aplicarNiveis(); this.aoFimDaVoz?.(i); } });
    }
    if (this.ctx && !v.g) { v.g = this.ctx.createGain(); v.g.gain.value = 0; this.ctx.createMediaElementSource(v.el).connect(v.g); v.g.connect(this.busVoz); }
    return v;
  }
  _pararVoz() {
    clearTimeout(this.vozAgenda); this.vozAgenda = null;
    const v = this.voz; if (!v) return;
    this.voz = null;
    const t = this.ctx.currentTime;
    v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0, t, 0.12);
    clearTimeout(v.pausa); v.pausa = setTimeout(() => { if (this.voz !== v) v.el.pause(); }, 450);
    this._aplicarNiveis();
  }
  /** Lê a cena. A voz nunca dispara a ação nem vira a página: o ritmo continua com quem está lendo. */
  _narrar(i, atraso) {
    if (!this.ctx) return;
    this._pararVoz();
    if (!this.narrando || i < 0 || !this.faixasVoz[i]) return;
    const v = this._elementoVoz(i);
    if (this.faixasVoz[i + 1]) this._elementoVoz(i + 1); // a próxima página já vem baixando
    this.vozAgenda = setTimeout(() => {
      if (this.cenaAtual !== i || !this.narrando) return;
      const t = this.ctx.currentTime;
      clearTimeout(v.pausa);
      v.el.currentTime = 0;
      v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(db(this.faixasVoz[i].ganho_db || 0), t);
      this.voz = v; this._aplicarNiveis();
      if (!this.oculto) v.el.play().catch((e) => console.warn('voz', i, e.name));
    }, atraso * 1000);
  }
  /** Liga ou desliga a leitura; ao religar, recomeça a cena atual. */
  alternarNarracao() {
    this.narrando = !this.narrando;
    if (this.ctx) { if (this.narrando) this._narrar(this.cenaAtual, 0.2); else this._pararVoz(); }
    return this.narrando;
  }
  _visibilidade() {
    this.oculto = document.hidden; if (!this.ctx) return;
    if (document.hidden) { this.ctx.suspend(); this.atual?.el.pause(); this.voz?.el.pause(); } else { this.ctx.resume(); if (this.ligado) this.atual?.el.play().catch(() => {}); this.voz?.el.play().catch(() => {}); }
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
    return { contexto: this.ctx?.state, trilha: this.atual?.nome, tempo: this.atual?.el.currentTime, pausada: this.atual?.el.paused, efeitos: this.buffers.size, camas: this.camas.size, dbfs: Number(dbfs.toFixed(1)), narrando: this.narrando, voz: this.voz ? { cena: this.voz.i, tempo: this.voz.el.currentTime, pausada: this.voz.el.paused } : null, nivelMusica: this.busMusica?.gain.value, nivelAmbiente: this.busAmb?.gain.value };
  }
}

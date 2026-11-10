// Som do livro: efeitos e ambientes em WebAudio, música em streaming, com fusão entre os momentos da história.
// Tudo vem de shared/sfx, montado por tools/sons.py (créditos em docs/creditos-sons.md).
import SONS from './sons.json';
import NARRACAO from './narracao.json';

const base = import.meta.env.BASE_URL;
const db = (v) => 10 ** (v / 20);
const FUSAO = 1.6;
const NIVEL_MUSICA = 0.72; const NIVEL_ACAO = 0.42; const NIVEL_SOB_VOZ = 0.3;
const NIVEL_AMB = 1; const NIVEL_AMB_SOB_VOZ = 0.75;
// a voz vem primeiro: o efeito cede só enquanto ela está soando, e volta nas pausas da frase
const NIVEL_EFEITO_SOB_VOZ = 0.62; const LIMIAR_VOZ = 0.1;
const EMENDA_MUSICA = 4.5; // as faixas terminam em fade: a repetição funde antes dele, em vez de sumir e recomeçar
const IMEDIATOS = ['abrir', 'flap1', 'flap2']; // tocam no primeiro clique: já vêm baixando antes dele
// tempo até a voz entrar: da capa o livro ainda está abrindo; numa virada, só o giro
const ATRASO_DA_CAPA = 2.6; const ATRASO_VIRADA = 0.6;

// -1 é a capa; depois, uma entrada por cena
export const TRILHA = ['partida', 'obra', 'obra', 'obra', 'lobo-chega', 'lobo-chega', 'lobo-insiste', 'lobo-insiste', 'lobo-teima', 'lobo-teima', 'noite', 'noite', 'noite', 'fuga', 'fuga', 'festa', 'era-uma-vez'];
const AMBIENTE = [
  { passaros: 0.8 }, { passaros: 0.7 }, { passaros: 0.7 }, { passaros: 0.6, brisa: 0.15 }, { passaros: 0.5, brisa: 0.3 },
  { passaros: 0.5, brisa: 0.35 }, { passaros: 0.4, brisa: 0.5 }, { passaros: 0.25, brisa: 0.6 }, { passaros: 0.15, brisa: 0.7 }, { brisa: 0.75 },
  { grilos: 0.6, fogo: 0.3, fervura: 0.15 }, { grilos: 0.5, fogo: 0.55, fervura: 0.45 }, { grilos: 0.4, fogo: 0.55, fervura: 0.5 }, { grilos: 0.6, brisa: 0.3 },
  { grilos: 0.6, brisa: 0.35 }, { grilos: 0.5, fogo: 0.45 }, { passaros: 0.6, brisa: 0.2 },
];
// quanto de espaço cada cena dá aos efeitos: a noite é mais aberta
const ESPACO = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.11, 0.12, 0.2, 0.2, 0.2, 0.22, 0.22, 0.2, 0.1];

/** Resposta curta de espaço aberto: faz gravações de lugares diferentes soarem no mesmo livro. */
function respostaDeEspaco(ctx, seg = 1.1) {
  const n = Math.floor(ctx.sampleRate * seg); const b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let baixo = 0; for (let i = 0; i < n; i++) { const q = i / n; baixo += (Math.random() * 2 - 1 - baixo) * (0.5 - 0.42 * q); d[i] = baixo * (1 - q) ** 3.2; } }
  return b;
}

export class Audio {
  constructor() {
    this.ligado = true; this.ctx = null; this.buffers = new Map(); this.camas = new Map(); this.faixas = new Map();
    this.atual = null; this.pedida = 'era-uma-vez'; this.ambPedido = {}; this.oculto = false; this.graficoPausado = false; this.cenaAtual = null;
    this.bytes = new Map(IMEDIATOS.map((n) => [n, fetch(`${base}sfx/${n}.mp3`).then((r) => r.arrayBuffer()).catch(() => null)]));
    this.fila = []; this.registro = []; this.ultimoPasso = -1; this.nivelEfeitos = 1;
    this.faixasVoz = NARRACAO.faixas; this.nomeVoz = NARRACAO.voz; this.narrando = true; this.voz = null; this.playerVoz = null; this.preloadVoz = null; this.geracaoVoz = 0; this.vozAgenda = null; this.acaoAte = 0; this.aoComecarVoz = null; this.aoFimDaVoz = null;
  }
  destravar() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain(); this.master.gain.value = this.ligado ? 1 : 0;
      this.medidor = ctx.createAnalyser(); this.medidor.fftSize = 2048;
      // o limitador só age na soma dos picos, quando muita coisa acontece junto
      this.limitador = ctx.createDynamicsCompressor();
      this.limitador.threshold.value = -2; this.limitador.knee.value = 0; this.limitador.ratio.value = 20; this.limitador.attack.value = 0.002; this.limitador.release.value = 0.12;
      this.master.connect(this.limitador); this.limitador.connect(this.medidor); this.medidor.connect(ctx.destination);
      this.busEfeitos = ctx.createGain(); this.busEfeitos.connect(this.master);
      this.espaco = ctx.createConvolver(); this.espaco.buffer = respostaDeEspaco(ctx);
      this.envioEspaco = ctx.createGain(); this.envioEspaco.gain.value = ESPACO[0];
      this.busEfeitos.connect(this.envioEspaco); this.envioEspaco.connect(this.espaco); this.espaco.connect(this.master);
      this.busMusica = ctx.createGain(); this.busMusica.gain.value = NIVEL_MUSICA; this.busMusica.connect(this.master);
      this.busAmb = ctx.createGain(); this.busAmb.gain.value = NIVEL_AMB; this.busAmb.connect(this.master);
      this.busVoz = ctx.createGain(); this.busVoz.connect(this.master);
      this.medidorVoz = ctx.createAnalyser(); this.medidorVoz.fftSize = 512; this.busVoz.connect(this.medidorVoz);
      for (const n of SONS.efeitos) this._carregar(n);
      for (const n of SONS.ambientes) this._carregar(n).then(() => this._iniciarCama(n));
      document.addEventListener('visibilitychange', () => this._visibilidade());
      setInterval(() => this._vigiar(), 60);
      this._tocarTrilha(this.pedida);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (this.atual && this.atual.el.paused && !this.oculto) this.atual.el.play().catch(() => {});
    if (this.temNarracao() && navigator.userActivation?.isActive !== false) {
      if (this.voz) this._retomarVoz(true);
      else if (!this.playerVoz) {
        // A autorização do Safari pertence ao elemento. O mesmo player atravessa o livro inteiro.
        const v = this._elementoVoz(0); const geracao = this.geracaoVoz;
        v.el.play().then(() => { if (geracao === this.geracaoVoz && !this.voz) v.el.pause(); }).catch(() => {});
      }
    }
  }
  async _carregar(n) {
    try {
      const bytes = (await this.bytes.get(n)) ?? await (await fetch(`${base}sfx/${n}.mp3`)).arrayBuffer();
      this.buffers.set(n, await this.ctx.decodeAudioData(bytes));
      // o que foi pedido enquanto o som baixava ainda toca, se o momento não passou
      const agora = this.ctx.currentTime; const prontos = this.fila.filter((f) => f.nome === n);
      this.fila = this.fila.filter((f) => f.nome !== n);
      for (const f of prontos) if (agora - f.em < 1.5) this.tocar(n, f.op);
    } catch (e) { console.warn('som', n, e); }
  }
  /** A cada instante: o efeito cede à voz que está soando, e a música emenda antes do fim. */
  _vigiar() {
    this._vigiarVoz();
    if (this.ctx.state !== 'running') return;
    const alvo = this.nivelVoz() > LIMIAR_VOZ ? NIVEL_EFEITO_SOB_VOZ : 1;
    if (alvo !== this.nivelEfeitos) { this.nivelEfeitos = alvo; this.busEfeitos.gain.setTargetAtTime(alvo, this.ctx.currentTime, alvo < 1 ? 0.03 : 0.22); }
    const f = this.atual;
    if (f && !f.emendando && f.el.duration && !f.el.paused && f.el.duration - f.el.currentTime < EMENDA_MUSICA) this._emendar(f);
  }
  /** Repete a faixa fundindo uma cópia que recomeça. Se o navegador recusar, o laço do próprio elemento segue valendo. */
  _emendar(f) {
    f.emendando = true;
    const el = new window.Audio(f.el.src); el.loop = true; el.preload = 'auto';
    const g = this.ctx.createGain(); g.gain.value = 0; const fonte = this.ctx.createMediaElementSource(el); fonte.connect(g); g.connect(this.busMusica);
    el.play().then(() => {
      if (this.faixas.get(f.nome) !== f) return;
      const t = this.ctx.currentTime; const velho = { el: f.el, g: f.g }; const nivel = this.atual === f ? db(SONS.musicas[f.nome].ganho_db) : 0;
      velho.g.gain.cancelScheduledValues(t); velho.g.gain.setValueAtTime(velho.g.gain.value, t); velho.g.gain.linearRampToValueAtTime(0, t + 3);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(nivel, t + 3);
      f.el = el; f.g = g; f.emendando = false;
      if (this.atual !== f) el.pause();
      setTimeout(() => { velho.el.pause(); velho.g.disconnect(); }, 3300);
    }).catch(() => { fonte.disconnect(); g.disconnect(); });
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
    this.trilha(i < 0 ? 'era-uma-vez' : TRILHA[i]);
    this.ambPedido = i < 0 ? {} : AMBIENTE[i]; this._aplicarAmbiente();
    if (this.ctx) this.envioEspaco.gain.setTargetAtTime(ESPACO[Math.max(i, 0)], this.ctx.currentTime, 0.5);
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
    let v = this.playerVoz;
    if (!v) {
      const el = new window.Audio(`${base}narracao/${this.faixasVoz[i].arquivo}`); el.preload = 'auto';
      v = this.playerVoz = { i, el, g: null, arquivo: this.faixasVoz[i].arquivo, tentativa: false, tentarEm: 0 };
      el.addEventListener('ended', () => this._finalizarVoz(v));
      el.addEventListener('error', () => {
        if (this.voz === v && el.error) { v.recarregar = true; v.retomarEm = el.currentTime; }
      });
      el.addEventListener('loadedmetadata', () => {
        if (this.voz === v && v.retomarEm != null) { el.currentTime = v.retomarEm; v.retomarEm = null; }
      });
    }
    if (this.ctx && !v.g) { v.g = this.ctx.createGain(); v.g.gain.value = 0; this.ctx.createMediaElementSource(v.el).connect(v.g); v.g.connect(this.busVoz); }
    return v;
  }
  _finalizarVoz(v) {
    if (this.voz !== v || !v.el.ended) return;
    this.voz = null; this.geracaoVoz++;
    this._aplicarNiveis(); this.aoFimDaVoz?.(v.i);
  }
  _retomarVoz(forcar = false) {
    const v = this.voz;
    if (!v || !this.narrando || this.oculto || this.graficoPausado || this.interacao || v.tentativa || (!forcar && performance.now() < v.tentarEm)) return;
    const geracao = this.geracaoVoz;
    v.tentativa = true; v.tentarEm = performance.now() + 1000;
    if (v.recarregar) { v.recarregar = false; v.el.load(); }
    if (this.ctx.state !== 'running') v.el.pause();
    const tocar = () => { if (geracao === this.geracaoVoz && this.voz === v && !this.oculto && !this.graficoPausado && !this.interacao) return v.el.play(); };
    const tentativa = this.ctx.state === 'running' ? tocar() : this.ctx.resume().then(tocar);
    Promise.resolve(tentativa).catch(() => {
      if (geracao === this.geracaoVoz && this.voz === v && v.el.error) { v.recarregar = true; v.retomarEm = v.el.currentTime; }
    }).finally(() => { if (geracao === this.geracaoVoz) v.tentativa = false; });
  }
  _vigiarVoz() {
    const v = this.voz; if (!v || !this.narrando) return;
    const agora = performance.now();
    if (this.oculto || this.graficoPausado || this.interacao) { v.semProgressoDesde = agora; return; }
    if (v.el.ended) { this._finalizarVoz(v); return; }
    if (v.ultimoTempo !== v.el.currentTime) { v.ultimoTempo = v.el.currentTime; v.semProgressoDesde = agora; }
    if (agora - v.semProgressoDesde > 8000) {
      v.retomarEm = v.el.currentTime; v.recarregar = true; v.tentativa = false; v.semProgressoDesde = agora;
      this.geracaoVoz++;
    }
    if (v.el.paused || v.recarregar || this.ctx.state !== 'running') this._retomarVoz();
  }
  /** O relógio da animação é o da fala: aba em segundo plano ou rede lenta pausam os dois juntos. */
  tempoVoz(i) { return this.voz && this.voz.i === i ? this.voz.el.currentTime : null; }
  /** Volume da voz agora, de 0 a 1: é o que abre a boca de quem fala. */
  nivelVoz() {
    if (!this.medidorVoz || !this.voz) return 0;
    const v = this.bufVoz ??= new Float32Array(this.medidorVoz.fftSize); this.medidorVoz.getFloatTimeDomainData(v);
    let s = 0; for (let k = 0; k < v.length; k++) s += v[k] * v[k];
    return Math.min(1, Math.sqrt(s / v.length) * 7);
  }
  _pararVoz() {
    this.geracaoVoz++;
    clearTimeout(this.vozAgenda); this.vozAgenda = null;
    const v = this.voz; if (!v) return;
    this.voz = null; v.tentativa = false;
    const t = this.ctx.currentTime;
    v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0, t, 0.12);
    clearTimeout(v.pausa); v.pausa = setTimeout(() => { if (this.voz !== v) v.el.pause(); }, 450);
    this._aplicarNiveis();
  }
  /** Lê a cena. O livro segue o relógio de tempoVoz e decide a virada em aoFimDaVoz. */
  _narrar(i, atraso) {
    if (!this.ctx) return;
    this._pararVoz();
    if (!this.narrando || i < 0 || !this.faixasVoz[i]) return;
    const v = this._elementoVoz(i);
    const geracao = this.geracaoVoz;
    if (this.faixasVoz[i + 1]) {
      this.preloadVoz ??= new window.Audio(); this.preloadVoz.preload = 'auto';
      this.preloadVoz.src = `${base}narracao/${this.faixasVoz[i + 1].arquivo}`;
    }
    this.vozAgenda = setTimeout(() => {
      if (geracao !== this.geracaoVoz || this.cenaAtual !== i || !this.narrando) return;
      this.vozAgenda = null;
      const t = this.ctx.currentTime;
      clearTimeout(v.pausa);
      v.i = i; v.tentativa = false; v.tentarEm = 0; v.recarregar = false; v.retomarEm = null;
      if (v.arquivo !== this.faixasVoz[i].arquivo) {
        v.arquivo = this.faixasVoz[i].arquivo; v.el.src = `${base}narracao/${v.arquivo}`;
      }
      v.el.currentTime = 0;
      v.ultimoTempo = 0; v.semProgressoDesde = performance.now();
      v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(db(this.faixasVoz[i].ganho_db || 0), t);
      this.voz = v; this._aplicarNiveis();
      this.aoComecarVoz?.(i);
      this._retomarVoz();
    }, atraso * 1000);
  }
  /** Liga ou desliga a leitura; ao religar, recomeça a cena atual. */
  alternarNarracao() {
    this.narrando = !this.narrando;
    if (this.ctx) { if (this.narrando) this._narrar(this.cenaAtual, 0.2); else this._pararVoz(); }
    return this.narrando;
  }
  pausarInteracao(pausada) {
    if (this.interacao === pausada) return;
    this.interacao = pausada;
    if (!this.ctx) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setValueAtTime(pausada || this.graficoPausado || !this.ligado ? 0 : 1, this.ctx.currentTime);
    if (pausada) this.voz?.el.pause();
    else this._retomarVoz(true);
  }
  pausarGrafico(pausado) {
    this.graficoPausado = pausado;
    if (!this.ctx) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setValueAtTime(pausado || this.interacao || !this.ligado ? 0 : 1, this.ctx.currentTime);
    if (pausado) this.voz?.el.pause();
    else this._retomarVoz(true);
  }
  _visibilidade() {
    // A narração só para no botão (Alan, 10/11/2026): com ela ligada, a página escondida atrás de outra janela ou aba continua contando a história.
    this.oculto = document.hidden && !this.narrando; if (!this.ctx) return;
    if (this.oculto) { this.ctx.suspend(); this.atual?.el.pause(); this.voz?.el.pause(); } else { this.ctx.resume().catch(() => {}); if (this.ligado) this.atual?.el.play().catch(() => {}); this._retomarVoz(true); }
  }
  alternar() { this.ligado = !this.ligado; if (this.master) this.master.gain.setTargetAtTime(this.ligado && !this.interacao && !this.graficoPausado ? 1 : 0, this.ctx.currentTime, 0.04); return this.ligado; }
  /**
   * Um efeito. `pan` é a posição na página (-1 a 1), ou [de, até] quando o som atravessa a cena.
   * Toda repetição varia um pouco a altura e o volume: gravação igual repetida é o que mais denuncia o efeito.
   */
  tocar(nome, { vol = 1, taxa = 1, depois = 0, dur = 0, pan = 0, varia = 1 } = {}) {
    if (!this.ctx || !this.ligado) return;
    const b = this.buffers.get(nome);
    if (!b) { this.fila.push({ nome, em: this.ctx.currentTime, op: { vol, taxa, depois, dur, pan, varia } }); return; }
    const s = this.ctx.createBufferSource(); s.buffer = b;
    const rate = taxa * (1 + (Math.random() - 0.5) * 0.06 * varia); const nivel = vol * (1 + (Math.random() - 0.5) * 0.14 * varia);
    s.playbackRate.value = rate;
    const g = this.ctx.createGain(); g.gain.value = nivel; s.connect(g);
    const t = this.ctx.currentTime + depois;
    const [de, ate] = Array.isArray(pan) ? pan : [pan, pan];
    if ((de || ate) && this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner(); p.pan.setValueAtTime(de, t);
      if (ate !== de) p.pan.linearRampToValueAtTime(ate, t + (dur || b.duration / rate));
      g.connect(p); p.connect(this.busEfeitos);
    } else g.connect(this.busEfeitos);
    s.start(t);
    if (dur) { g.gain.setValueAtTime(nivel, t + Math.max(dur - 0.25, 0)); g.gain.linearRampToValueAtTime(0, t + dur); s.stop(t + dur + 0.02); }
    if (this.registro.length < 2000) this.registro.push({ nome, cena: this.cenaAtual, em: Number(t.toFixed(3)), vol: Number(nivel.toFixed(3)), taxa: Number(rate.toFixed(3)), pan: de });
  }
  /** Um passo no chão: nunca a mesma gravação duas vezes seguidas. */
  passo({ peso = 1, x = 0 } = {}) {
    let k; do { k = Math.floor(Math.random() * 4); } while (k === this.ultimoPasso); this.ultimoPasso = k;
    this.tocar(`passo${k + 1}`, { vol: 0.26 + 0.34 * peso, taxa: 1.42 - 0.62 * peso, pan: Math.max(-0.7, Math.min(0.7, x * 0.9)) });
  }
  /** Prepara as falas do modo sopro, que tocam com o resto do livro em silêncio. */
  prepararFalas(nomes) {
    this.falas ??= new Map();
    for (const n of nomes) if (!this.falas.has(n)) this.falas.set(n, fetch(`${base}narracao/${n}.mp3`).then((r) => r.arrayBuffer()).catch(() => null));
  }
  /** Diz uma fala e resolve quando ela termina. Nunca prende quem espera: sem som, sem contexto ou com a aba escondida, resolve assim mesmo. */
  async dizer(nome) {
    this.calar();
    if (!this.ctx || !this.ligado) return;
    this.prepararFalas([nome]);
    const senha = this.fala = {};
    let dados = await this.falas.get(nome);
    if (!dados || this.fala !== senha) return;
    if (dados instanceof ArrayBuffer) { dados = await this.ctx.decodeAudioData(dados).catch(() => null); this.falas.set(nome, Promise.resolve(dados)); }
    if (!dados || this.fala !== senha) return;
    const s = this.ctx.createBufferSource(); s.buffer = dados;
    s.connect(this.limitador); s.start(); senha.fonte = s;
    this.falasDitas = [...(this.falasDitas ?? []), nome];
    await new Promise((ok) => { s.onended = ok; setTimeout(ok, (dados.duration + 1) * 1000); });
    if (this.fala === senha) this.calar();
  }
  calar() { const f = this.fala; this.fala = null; try { f?.fonte?.stop(); } catch { /* já terminou */ } }
  /** Para os testes: o que está tocando e quanto sinal chega à saída. */
  estado() {
    let dbfs = -Infinity;
    if (this.medidor) { const v = new Float32Array(this.medidor.fftSize); this.medidor.getFloatTimeDomainData(v); dbfs = 10 * Math.log10(v.reduce((s, x) => s + x * x, 0) / v.length + 1e-12); }
    return { contexto: this.ctx?.state, trilha: this.atual?.nome, tempo: this.atual?.el.currentTime, pausada: this.atual?.el.paused, efeitos: this.buffers.size, camas: this.camas.size, dbfs: Number(dbfs.toFixed(1)), narrando: this.narrando, voz: this.voz ? { cena: this.voz.i, tempo: this.voz.el.currentTime, pausada: this.voz.el.paused } : null, nivelMusica: this.busMusica?.gain.value, nivelAmbiente: this.busAmb?.gain.value };
  }
}

export const CASAS_SOPRO = {
  2: { nome: 'Casa de palha do João', grupo: 'sopro', nivel: 0.16, energia: 0.55, resultado: 'A palha voou!' },
  3: { nome: 'Casa de madeira da Lulu', grupo: 'sopro1', nivel: 0.3, energia: 1.05, resultado: 'A madeira cedeu!' },
  4: { nome: 'Casa de tijolos do Kael', grupo: 'sopro0', nivel: 0.4, energia: 1.6, resultado: 'Os tijolos resistem ao vento!' },
};

export class MedidorSopro {
  constructor(limiar = 0.12) { this.limiar = limiar; this.ruido = 0.002; this.nivel = 0; this.energia = 0; this.sustentado = 0; }
  medir(amostras, espectro, dt, sampleRate = 48000) {
    const media = amostras.reduce((s, v) => s + v, 0) / amostras.length;
    const rms = Math.sqrt(amostras.reduce((s, v) => s + (v - media) ** 2, 0) / amostras.length);
    // Não penalizar microfones que cortam as frequências altas, comuns nos telefones.
    const bin = sampleRate / (espectro.length * 2);
    const banda = espectro.subarray(Math.ceil(250 / bin), Math.min(espectro.length, Math.ceil(3000 / bin)));
    let soma = 0; let log = 0;
    for (const db of banda) { const p = Math.max(1e-12, 10 ** (db / 10)); soma += p; log += Math.log(p); }
    const plano = Math.exp(log / banda.length) / Math.max(1e-12, soma / banda.length);
    const minimo = Math.max(0.008, this.ruido * 2.5);
    const bruto = plano > 0.12 ? Math.max(0, Math.min(1, (rms - minimo) / Math.max(0.04, minimo * 4))) : 0;
    return { rms, ...this.avancar(bruto, dt) };
  }
  avancar(bruto, dt) {
    dt = Math.max(0, Math.min(dt, 0.05));
    this.nivel += (bruto - this.nivel) * (1 - Math.exp(-dt * 18));
    this.sustentado = bruto >= this.limiar ? this.sustentado + dt : 0;
    if (this.sustentado >= 0.15) this.energia += this.nivel * dt;
    return { nivel: this.nivel, energia: this.energia };
  }
}

export class MicrofoneSopro {
  constructor() { this.geracao = 0; this.stream = null; this.ctx = null; }
  async abrir(aoInterromper) {
    this.parar();
    const geracao = this.geracao;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('indisponivel');
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('indisponivel');
    this.ctx = new AC();
    const ctx = this.ctx;
    const resume = ctx.resume();
    resume.catch(() => {}); // Sair enquanto a permissão está aberta pode encerrar o contexto antes da resposta.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false, channelCount: 1 } });
      if (geracao !== this.geracao) { stream.getTracks().forEach((t) => t.stop()); return false; }
      this.stream = stream;
      await resume;
      if (geracao !== this.geracao) return false;
      this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 2048; this.analyser.smoothingTimeConstant = 0;
      this.fonte = ctx.createMediaStreamSource(stream); this.fonte.connect(this.analyser);
      this.onda = new Float32Array(this.analyser.fftSize);
      this.espectro = new Float32Array(this.analyser.frequencyBinCount);
      stream.getTracks().forEach((t) => t.addEventListener('ended', aoInterromper, { once: true }));
      ctx.addEventListener('statechange', () => { if (this.ctx === ctx && ctx.state === 'suspended') aoInterromper(); });
      return true;
    } catch (e) { if (geracao === this.geracao) this.parar(); throw e; }
  }
  ler(medidor, dt) {
    if (!this.stream) return null;
    this.analyser.getFloatTimeDomainData(this.onda);
    this.analyser.getFloatFrequencyData(this.espectro);
    return medidor.medir(this.onda, this.espectro, dt, this.ctx.sampleRate);
  }
  parar() {
    this.geracao++;
    this.stream?.getTracks().forEach((t) => t.stop()); this.stream = null;
    this.fonte?.disconnect(); this.fonte = null;
    const ctx = this.ctx; this.ctx = null;
    if (ctx && ctx.state !== 'closed') ctx.close().catch(() => {});
  }
}

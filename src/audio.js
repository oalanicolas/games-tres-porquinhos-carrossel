// Só gravações reais CC0 de shared/sfx, recortadas em public/sfx (créditos em docs/creditos.md).
const NOMES = ['flap1', 'flap2', 'abrir', 'vento', 'range', 'desaba', 'martelo', 'porco', 'uivo1', 'uivo2', 'caldeirao', 'viva', 'risos', 'sino'];
const base = import.meta.env.BASE_URL;
export class Audio {
  constructor() { this.ligado = true; this.ctx = null; this.buffers = new Map(); this.carregando = null; }
  destravar() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.ligado ? 0.9 : 0; this.master.connect(this.ctx.destination);
      this.carregando = Promise.all(NOMES.map(async (n) => {
        try { const r = await fetch(`${base}sfx/${n}.mp3`); this.buffers.set(n, await this.ctx.decodeAudioData(await r.arrayBuffer())); } catch (e) { console.warn('som', n, e); }
      }));
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  alternar() { this.ligado = !this.ligado; if (this.master) this.master.gain.value = this.ligado ? 0.9 : 0; return this.ligado; }
  tocar(nome, { vol = 1, taxa = 1, depois = 0, dur = 0 } = {}) {
    if (!this.ctx || !this.ligado) return;
    const b = this.buffers.get(nome); if (!b) return;
    const s = this.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = taxa;
    const g = this.ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(this.master);
    const t = this.ctx.currentTime + depois;
    s.start(t);
    if (dur) { g.gain.setValueAtTime(vol, t + Math.max(dur - 0.25, 0)); g.gain.linearRampToValueAtTime(0, t + dur); s.stop(t + dur + 0.02); }
  }
}

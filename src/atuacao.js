// Quem fala, na hora em que fala: boca, gesto e balão seguem o relógio e o volume da narração.
import * as THREE from 'three';

const ponto = new THREE.Vector3();
const MARGEM = 10;
const ALTURA_CABECA = { porco: 0.56, lobo: 0.42 };

export class Atuacao {
  constructor({ raiz, camera, canvas, audio, cenas }) {
    Object.assign(this, { raiz, camera, canvas, audio, cenas });
    this.salvos = []; this.baloes = new Map(); this.bocas = new Set(); this.abertura = 0;
  }
  /** Devolve o que a fala mexeu: a linha do tempo e a respiração escrevem sobre o valor real. */
  desfazer() {
    for (const [obj, prop, valor] of this.salvos) obj[prop] = valor;
    this.salvos.length = 0;
  }
  _soma(obj, prop, delta) { this.salvos.push([obj, prop, obj[prop]]); obj[prop] += delta; }
  _falar(ator, ab, t) {
    if (ator.boca) { ator.boca.scale.y = Math.max(0.001, ab); this.bocas.add(ator); } else { this._soma(ator.queixo.rotation, 'z', -ab * 0.3); this._soma(ator.fundoBoca.scale, 'y', ab * 0.6); }
    this._soma(ator.cabeca.rotation, 'z', Math.sin(t * 9) * 0.05 * ab);
    this._soma(ator.corpo.position, 'y', ab * 0.018);
  }
  /** As falas da cena `i` neste segundo da narração. */
  ativas(i) {
    const t = i >= 0 ? this.audio.tempoVoz(i) : null;
    if (t == null) return { t: null, lista: [] };
    const falas = this.audio.faixasVoz[i]?.falas ?? [];
    const candidatas = falas.filter((f) => t >= f.de - 0.1 && t <= f.ate + 0.35);
    const lista = candidatas.map((f, k) => ({ ...f, quem: f.quem.filter((quem) => !candidatas.slice(k + 1).some((prox) => prox.quem.includes(quem))) })).filter((f) => f.quem.length);
    return { t, lista };
  }
  quadro(i, relogio) {
    const { t, lista } = this.ativas(i);
    const c = i >= 0 ? this.cenas()[i] : null;
    const alvo = lista.some((f) => t >= f.de - 0.04 && t <= f.ate + 0.04) ? this.audio.nivelVoz() : 0;
    this.abertura += (alvo - this.abertura) * 0.55;
    const falando = new Set();
    const pedidos = [];
    for (const f of lista) for (const quem of f.quem) {
      const ator = c?.atores?.[quem]; if (!ator) continue;
      falando.add(ator);
      if (t <= f.ate + 0.04) this._falar(ator, this.abertura, relogio);
      pedidos.push({ chave: `${i}-${f.de}-${quem}`, ator, texto: f.texto, quem });
    }
    for (const a of this.bocas) if (!falando.has(a)) { a.boca.scale.y = 0.001; this.bocas.delete(a); }
    this._desenhar(pedidos);
  }
  _desenhar(pedidos) {
    const vivos = new Set(pedidos.map((p) => p.chave));
    for (const [chave, b] of this.baloes) if (!vivos.has(chave)) { b.el.remove(); this.baloes.delete(chave); }
    if (!pedidos.length) return;
    const q = this.canvas.getBoundingClientRect();
    const itens = pedidos.map((p) => {
      let b = this.baloes.get(p.chave);
      if (!b) {
        const el = document.createElement('div'); el.className = 'balao'; el.dataset.quem = p.quem;
        const s = document.createElement('span'); s.textContent = p.texto; el.append(s);
        this.raiz.append(el); b = { el }; this.baloes.set(p.chave, b);
      }
      b.w = b.el.offsetWidth; b.h = b.el.offsetHeight;
      ponto.set(0, p.ator.boca ? ALTURA_CABECA.porco : ALTURA_CABECA.lobo, 0); p.ator.cabeca.localToWorld(ponto); ponto.project(this.camera);
      const ax = q.left + (ponto.x + 1) / 2 * q.width; const ay = q.top + (1 - ponto.y) / 2 * q.height;
      b.ordem ??= ax;
      return { b, ax, ay, x: ax - b.w / 2, y: ay - b.h - 12 };
    }).sort((u, v) => u.b.ordem - v.b.ordem);
    const filas = []; const restantes = itens.slice();
    while (restantes.length) {
      const fila = [restantes.shift()]; let largura = fila[0].b.w;
      while (restantes.length && largura + restantes.at(-1).b.w + 12 <= q.width - MARGEM * 2) {
        const it = restantes.pop(); fila.push(it); largura += it.b.w + 12;
      }
      fila.sort((u, v) => u.b.ordem - v.b.ordem); filas.push({ fila, largura });
    }
    let teto = q.height - MARGEM;
    for (const { fila, largura } of filas) {
      const centro = fila.reduce((s, it) => s + it.ax, 0) / fila.length;
      let x = Math.max(MARGEM, Math.min(centro - largura / 2, q.width - largura - MARGEM));
      for (const it of fila) { it.x = x; it.y = Math.min(it.y, teto - it.b.h); x += it.b.w + 12; }
      teto = Math.min(...fila.map((it) => it.y)) - 18;
    }
    const descer = Math.max(0, MARGEM - Math.min(...itens.map((it) => it.y)));
    for (const it of itens) {
      it.y = Math.max(MARGEM, Math.min(it.y + descer, q.height - it.b.h - MARGEM));
      it.b.el.style.transform = `translate(${it.x.toFixed(1)}px, ${it.y.toFixed(1)}px)`;
      const cauda = Math.min(Math.max(18, it.ax - it.x), it.b.w - 18);
      it.b.el.style.setProperty('--cauda', `${cauda.toFixed(1)}px`);
    }
  }
  /** Para os testes: o que está na tela agora. */
  medir() {
    return [...this.baloes.values()].map(({ el }) => { const r = el.getBoundingClientRect(); return { quem: el.dataset.quem, texto: el.textContent, x: r.left, y: r.top, w: r.width, h: r.height }; });
  }
}

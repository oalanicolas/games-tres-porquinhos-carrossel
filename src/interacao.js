import { CASAS_SOPRO, MedidorSopro, MicrofoneSopro } from './sopro.js';
import { Vector3 } from 'three';

export class InteracaoSopro {
  constructor(audio, cenas) {
    this.audio = audio; this.cenas = cenas; this.ativa = false; this.autorizado = false; this.indice = -1;
    this.ponto = new Vector3(); this.tempo = 0;
    this.concluidas = new Set(); this.pendente = false; this.fase = 'parado'; this.microfone = new MicrofoneSopro(); this.captura = 0;
    this.$ = (id) => document.getElementById(id);
    this.$('sopro-microfone').addEventListener('click', () => this.captar());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.interromper();
      else if (this.pendente && this.autorizado && this.fase === 'pronto') this.captar();
    });
    addEventListener('pagehide', () => this.cancelar());
  }
  alternar() {
    this.ativa = !this.ativa; this.cancelar(); this.concluidas.clear();
    this.$('interagir').setAttribute('aria-pressed', String(this.ativa));
    this.$('interagir').setAttribute('aria-label', this.ativa ? 'Desligar o modo sopro' : 'Ligar o modo sopro');
    return this.ativa;
  }
  entrar(i) { if (i === this.indice) return false; this.cancelar(); this.indice = i; return true; }
  repetir(i) { this.cancelar(); this.concluidas.delete(i); }
  limitar(i, t) {
    const casa = CASAS_SOPRO[i];
    if (!this.ativa || !casa || this.concluidas.has(i)) return t;
    const linha = this.cenas()[i].linha;
    const inicio = Math.min(...linha._trilhas().filter((tr) => tr.g === casa.grupo && !tr.fixo).map((tr) => tr.start));
    const limite = Math.max(0, inicio - 0.02);
    if (t < limite) return t;
    if (!this.pendente) {
      this.pendente = true; this.fase = 'pronto'; this.medidor = new MedidorSopro(casa.nivel); this.casa = casa;
      this.audio.pausarInteracao(true);
      this.$('sopro-painel').hidden = false;
      document.body.classList.add('soprando');
      this.$('sopro-painel').dataset.casa = i;
      delete this.$('sopro-painel').dataset.aviso;
      delete this.$('sopro-painel').dataset.resultado;
      this.$('sopro-titulo').textContent = casa.nome;
      this.$('sopro-meta').textContent = i === 4 ? 'Vento forte · será que ela cai?' : i === 3 ? 'Vento médio · a madeira resiste mais.' : 'Vento leve · a palha é levinha.';
      this.$('sopro-nivel').low = casa.nivel * 100;
      this.$('sopro-nivel').high = casa.nivel * 100;
      this.$('sopro-nivel').optimum = 100;
      this.mensagem('Sua vez de assoprar.');
      this.$('sopro-microfone').disabled = false;
      this.$('sopro-microfone').setAttribute('aria-label', 'Ativar microfone');
      this.desenhar(0);
      this.captar();
    }
    return limite;
  }
  mensagem(texto) { this.$('sopro-status').textContent = texto; this.$('sopro-painel').dataset.fase = this.fase; }
  async captar() {
    if (!this.pendente) return;
    const captura = ++this.captura;
    delete this.$('sopro-painel').dataset.aviso;
    this.fase = 'permissao';
    this.$('sopro-microfone').disabled = true;
    this.mensagem('Permita o microfone no navegador para assoprar.');
    try {
      const ok = await this.microfone.abrir(() => this.interromper(), this.audio.ctx);
      if (!ok || captura !== this.captura || !this.pendente || this.fase !== 'permissao') return;
      this.autorizado = true; this.fase = 'calibrando'; this.calibracao = []; this.tempoCalibracao = 0;
      this.mensagem('Um instante em silêncio para ouvir o ambiente…');
    } catch (e) {
      if (captura !== this.captura || !this.pendente || this.fase !== 'permissao') return;
      this.$('sopro-painel').dataset.aviso = 'microfone';
      this.fase = 'pronto'; this.$('sopro-microfone').disabled = false;
      this.mensagem(e.name === 'NotAllowedError' ? 'Permita o microfone para brincar de assoprar.' : 'O microfone não está disponível. Toque para tentar novamente.');
    }
  }
  interromper() {
    if (!this.pendente) return;
    this.captura++; this.microfone.parar(); this.fase = 'pronto';
    this.$('sopro-microfone').disabled = false;
    this.$('sopro-painel').hidden = false;
    this.mensagem('Pausa. Toque em ativar microfone para continuar.');
  }
  desenhar(nivel) {
    this.$('sopro-nivel').value = Math.round(nivel * 100);
    this.$('sopro-nivel-texto').textContent = `${Math.round(nivel * 100)}%`;
    this.$('sopro-progresso').value = Math.min(100, this.medidor.energia / this.casa.energia * 100);
    this.$('sopro-anel').style.strokeDashoffset = 100 - nivel * 100;
  }
  quadro(dt) {
    if (!this.pendente || document.hidden) return;
    this.tempo += dt;
    let medicao;
    if (this.fase === 'calibrando') {
      medicao = this.microfone.ler(this.medidor, 0);
      if (!medicao) return;
      this.calibracao.push(medicao.rms); this.tempoCalibracao += dt;
      if (this.tempoCalibracao >= 1.2) {
        this.calibracao.sort((a, b) => a - b);
        const energia = this.medidor.energia;
        this.medidor = new MedidorSopro(this.casa.nivel); this.medidor.energia = energia;
        this.medidor.ruido = this.calibracao[Math.floor(this.calibracao.length * 0.75)];
        this.fase = 'ouvindo';
        this.$('sopro-painel').hidden = true;
        this.mensagem('Sopre de leve perto do microfone. Pode pausar e respirar.');
      }
      return;
    }
    if (this.fase === 'ouvindo') medicao = this.microfone.ler(this.medidor, dt);
    if (!medicao) return;
    this.desenhar(medicao.nivel);
    if (this.medidor.energia >= this.casa.energia) this.concluir();
  }
  animar(camera) {
    if (!this.pendente) return;
    const cena = this.cenas()[this.indice]; const lobo = cena.atores.lobo;
    const nivel = this.medidor.nivel;
    lobo.bochecha.scale.setScalar(Math.max(0.001, nivel));
    lobo.peito.scale.set(1 + 0.26 * nivel, 1 + 0.2 * nivel, 1);
    lobo.queixo.rotation.z = -0.14 * nivel;
    lobo.fundoBoca.scale.y = 0.35 + 0.55 * nivel;
    cena.vento.quadro(nivel, this.tempo);
    lobo.root.updateWorldMatrix(true, false);
    lobo.root.localToWorld(this.ponto.set(-0.28, 0.2, 0.15)); this.ponto.project(camera);
    const alvo = this.$('sopro-painel');
    alvo.style.left = `${(this.ponto.x + 1) * innerWidth / 2}px`;
    alvo.style.top = `${(1 - this.ponto.y) * innerHeight / 2}px`;
  }
  concluir() {
    if (!this.pendente) return;
    this.concluidas.add(this.indice); this.pendente = false; this.fase = 'concluido';
    document.body.classList.remove('soprando');
    this.$('sopro-painel').dataset.resultado = 'venceu';
    this.captura++; this.microfone.parar(); this.audio.pausarInteracao(false);
    this.mensagem(this.casa.resultado);
    this.$('sopro-progresso').value = 100;
    this.$('sopro-microfone').disabled = true;
    this.$('sopro-painel').hidden = true;
    this.cenas()[this.indice].vento.raiz.visible = false;
  }
  cancelar() {
    this.captura++; this.microfone.parar();
    this.pendente = false; this.fase = 'parado'; this.audio.pausarInteracao(false);
    document.body.classList.remove('soprando');
    this.$('sopro-painel').hidden = true;
    for (const cena of this.cenas()) if (cena.vento) cena.vento.raiz.visible = false;
  }
}

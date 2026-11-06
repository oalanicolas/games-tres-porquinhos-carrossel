import { CASAS_SOPRO, MedidorSopro, MicrofoneSopro } from './sopro.js';

export class InteracaoSopro {
  constructor(audio, cenas) {
    this.audio = audio; this.cenas = cenas; this.ativa = false; this.indice = -1;
    this.concluidas = new Set(); this.pendente = false; this.fase = 'parado'; this.microfone = new MicrofoneSopro(); this.captura = 0;
    this.$ = (id) => document.getElementById(id);
    this.$('sopro-microfone').addEventListener('click', () => this.captar());
    this.$('sopro-pular').addEventListener('click', () => this.concluir('Vamos continuar a história.'));
    const botao = this.$('sopro-botao');
    botao.addEventListener('pointerdown', (e) => { if (!e.isPrimary) return; e.preventDefault(); botao.setPointerCapture(e.pointerId); this.usarBotao(); });
    for (const evento of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur']) botao.addEventListener(evento, () => { this.pressionado = false; });
    botao.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.usarBotao(); } });
    botao.addEventListener('keyup', () => { this.pressionado = false; });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.interromper(); });
    addEventListener('pagehide', () => this.cancelar());
    addEventListener('blur', () => { this.pressionado = false; });
  }
  alternar() {
    this.ativa = !this.ativa; this.cancelar(); this.concluidas.clear();
    this.$('interagir').setAttribute('aria-pressed', String(this.ativa));
    this.$('interagir').setAttribute('aria-label', this.ativa ? 'Desligar o modo de sopro' : 'Brincar de soprar');
    return this.ativa;
  }
  entrar(i) { if (i !== this.indice) { this.cancelar(); this.indice = i; } }
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
      this.mensagem('Sua vez! Ative o microfone ou segure o botão.');
      this.$('sopro-microfone').disabled = false;
      this.$('sopro-microfone').setAttribute('aria-label', 'Ativar microfone');
      this.desenhar(0);
    }
    return limite;
  }
  mensagem(texto) { this.$('sopro-status').textContent = texto; this.$('sopro-painel').dataset.fase = this.fase; }
  async captar() {
    if (!this.pendente) return;
    const captura = ++this.captura;
    delete this.$('sopro-painel').dataset.aviso;
    this.pressionado = false; this.fase = 'permissao';
    this.$('sopro-microfone').disabled = true;
    this.mensagem('Permita o microfone no navegador. O botão também funciona.');
    try {
      const ok = await this.microfone.abrir(() => this.interromper());
      if (!ok || captura !== this.captura || !this.pendente || this.fase !== 'permissao') return;
      this.fase = 'calibrando'; this.calibracao = []; this.tempoCalibracao = 0;
      this.mensagem('Um instante em silêncio para ouvir o ambiente…');
    } catch (e) {
      if (captura !== this.captura || !this.pendente || this.fase !== 'permissao') return;
      this.$('sopro-painel').dataset.aviso = 'microfone';
      this.fase = 'pronto'; this.$('sopro-microfone').disabled = false;
      this.mensagem(e.name === 'NotAllowedError' ? 'Microfone não autorizado. Segure o botão ou tente novamente.' : 'Microfone indisponível. Você pode usar o botão.');
    }
  }
  usarBotao() {
    if (!this.pendente) return;
    if (this.fase !== 'botao') { this.captura++; this.microfone.parar(); this.medidor.sustentado = 0; this.fase = 'botao'; this.$('sopro-microfone').disabled = false; }
    this.pressionado = true; this.mensagem('Segure para fazer vento. Solte quando quiser.');
  }
  interromper() {
    if (!this.pendente) return;
    this.captura++; this.microfone.parar(); this.pressionado = false; this.fase = 'pronto';
    this.$('sopro-microfone').disabled = false;
    this.mensagem('Pausa. Toque em ativar microfone para continuar.');
  }
  desenhar(nivel) {
    this.$('sopro-nivel').value = Math.round(nivel * 100);
    this.$('sopro-nivel-texto').textContent = `${Math.round(nivel * 100)}%`;
    this.$('sopro-progresso').value = Math.min(100, this.medidor.energia / this.casa.energia * 100);
    this.$('sopro-painel').style.setProperty('--forca', nivel);
    this.$('sopro-painel').style.setProperty('--progresso', `${this.$('sopro-progresso').value}%`);
    this.$('sopro-anel').style.strokeDashoffset = 100 - nivel * 100;
  }
  quadro(dt) {
    if (!this.pendente || document.hidden) return;
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
        this.$('sopro-microfone').disabled = false;
        this.$('sopro-microfone').setAttribute('aria-label', 'Recalibrar microfone');
        this.mensagem('Sopre de leve perto do microfone. Pode pausar e respirar.');
      }
      return;
    }
    if (this.fase === 'ouvindo') medicao = this.microfone.ler(this.medidor, dt);
    else if (this.fase === 'botao') medicao = this.medidor.avancar(this.pressionado ? 0.7 : 0, dt);
    if (!medicao) return;
    this.desenhar(medicao.nivel);
    if (this.medidor.energia >= this.casa.energia) this.concluir(this.casa.resultado);
  }
  animar() {
    if (!this.pendente) return;
    const lobo = this.cenas()[this.indice].atores.lobo;
    const nivel = this.medidor.nivel;
    lobo.bochecha.scale.setScalar(Math.max(0.001, nivel));
    lobo.peito.scale.set(1 + 0.26 * nivel, 1 + 0.2 * nivel, 1);
    lobo.queixo.rotation.z = -0.14 * nivel;
    lobo.fundoBoca.scale.y = 0.35 + 0.55 * nivel;
  }
  concluir(texto) {
    if (!this.pendente) return;
    this.concluidas.add(this.indice); this.pendente = false; this.fase = 'concluido';
    document.body.classList.remove('soprando');
    const venceu = this.medidor.energia >= this.casa.energia;
    this.$('sopro-painel').dataset.resultado = venceu ? 'venceu' : 'pulou';
    this.captura++; this.microfone.parar(); this.pressionado = false; this.audio.pausarInteracao(false);
    this.mensagem(texto);
    if (venceu) { this.$('sopro-progresso').value = 100; this.$('sopro-painel').style.setProperty('--progresso', '100%'); }
    this.$('sopro-microfone').disabled = true;
    clearTimeout(this.ocultar); this.ocultar = setTimeout(() => { this.$('sopro-painel').hidden = true; }, 1600);
  }
  cancelar() {
    this.captura++; clearTimeout(this.ocultar); this.microfone.parar(); this.pressionado = false;
    this.pendente = false; this.fase = 'parado'; this.audio.pausarInteracao(false);
    document.body.classList.remove('soprando');
    this.$('sopro-painel').hidden = true;
  }
}

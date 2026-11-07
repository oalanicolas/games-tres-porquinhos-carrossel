import { CASAS_SOPRO, FALAS_SOPRO, MedidorSopro, MicrofoneSopro } from './sopro.js';
import { Vector3 } from 'three';

// Sem conseguir, a criança nunca fica presa: o Lobo termina sozinho.
const PACIENCIA = 8; // segundos tentando
const PACIENCIA_MAXIMA = 14; // enquanto ela estiver gritando, espera mais
const REFORCO = 4; // sem nenhum grito até aqui, a voz pede de novo
const ESPERA_PERMISSAO = 15; // ninguém respondeu ao pedido do navegador
const CALIBRA = 0.5; // ela pode já estar gritando: não adianta ouvir o ambiente por muito tempo
const RUIDO_MAXIMO = 0.02; // grito na calibração não pode virar "ruído do ambiente"

export class InteracaoSopro {
  constructor(audio, cenas) {
    this.audio = audio; this.cenas = cenas; this.ativa = false; this.autorizado = false; this.indice = -1;
    this.ponto = new Vector3(); this.pontoCabeca = new Vector3(); this.tempo = 0;
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
    if (this.ativa) {
      this.audio.prepararFalas(FALAS_SOPRO);
      // quem liga o modo é um adulto: é a hora de pedir o microfone, não no meio da história, na frente da criança
      navigator.mediaDevices?.getUserMedia({ audio: true }).then((s) => s.getTracks().forEach((t) => t.stop())).catch(() => {});
    }
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
      this.sozinho = false; this.tempoEspera = 0; this.tempoOuvindo = 0; this.reforcou = false; this.energiaVista = 0; this.ultimoGrito = 0;
      this.audio.pausarInteracao(true);
      this.convidar(casa.convite);
      // só vira balão enquanto a criança é chamada: fora daqui, os balões da tela são os das falas
      this.$('sopro-grito').classList.add('balao'); this.$('sopro-grito').hidden = false;
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
      this.mensagem('Sua vez: grite Fuuuu!');
      this.$('sopro-microfone').disabled = false;
      this.$('sopro-microfone').setAttribute('aria-label', 'Ativar microfone');
      this.desenhar(0);
      this.captar();
    }
    return limite;
  }
  /** A voz diz o que fazer; enquanto ela fala, o microfone não conta, e o Lobo mostra como é. */
  convidar(nome) {
    const fala = this.convidando = this.audio.dizer(nome).then(() => { if (this.convidando === fala) this.convidando = null; });
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
      this.concluir({ sozinho: true }); // sem microfone, a história segue com o sopro do próprio Lobo
    }
  }
  interromper() {
    if (!this.pendente) return;
    if (!document.hidden) { this.concluir({ sozinho: true }); return; } // o microfone sumiu com a página na frente
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
    const parte = Math.min(1, this.medidor.energia / this.casa.energia);
    const grito = this.$('sopro-grito');
    grito.firstElementChild.textContent = `F${'u'.repeat(4 + Math.round(parte * 4))}!`;
    grito.dataset.gritando = String(nivel > 0.05);
  }
  quadro(dt) {
    if (!this.pendente || document.hidden) return;
    this.tempo += dt;
    if (this.fase === 'permissao' && (this.tempoEspera += dt) >= ESPERA_PERMISSAO) { this.concluir({ sozinho: true }); return; }
    if (this.convidando) { this.desenhar(0); return; }
    let medicao;
    if (this.fase === 'calibrando') {
      medicao = this.microfone.ler(this.medidor, 0);
      if (!medicao) return;
      this.calibracao.push(medicao.rms); this.tempoCalibracao += dt;
      if (this.tempoCalibracao >= CALIBRA) {
        this.calibracao.sort((a, b) => a - b);
        const energia = this.medidor.energia;
        this.medidor = new MedidorSopro(this.casa.nivel); this.medidor.energia = energia;
        this.medidor.ruido = Math.min(RUIDO_MAXIMO, this.calibracao[Math.floor(this.calibracao.length * 0.25)]);
        this.fase = 'ouvindo';
        this.$('sopro-painel').hidden = true;
        this.mensagem('Grite Fuuuu! Pode parar, respirar e gritar de novo.');
      }
      return;
    }
    if (this.fase === 'ouvindo') medicao = this.microfone.ler(this.medidor, dt);
    if (!medicao) return;
    this.desenhar(medicao.nivel);
    if (this.medidor.energia >= this.casa.energia) { this.concluir(); return; }
    this.tempoOuvindo += dt;
    if (this.medidor.energia > this.energiaVista) { this.energiaVista = this.medidor.energia; this.ultimoGrito = this.tempoOuvindo; }
    if (!this.reforcou && this.energiaVista === 0 && this.tempoOuvindo >= REFORCO) { this.reforcou = true; this.convidar('convite-de-novo'); }
    if (this.tempoOuvindo >= PACIENCIA_MAXIMA || (this.tempoOuvindo >= PACIENCIA && this.tempoOuvindo - this.ultimoGrito > 1.2)) this.concluir({ sozinho: true });
  }
  animar(camera) {
    if (!this.pendente) return;
    const cena = this.cenas()[this.indice]; const lobo = cena.atores.lobo;
    const casa = cena.vento.casa;
    this.pose ??= { peito: [lobo.peito.scale.x, lobo.peito.scale.y], pupila: [lobo.pupila.position.x, lobo.pupila.position.y], casaRz: casa.rotation.z, lobo, casa };
    // enquanto a voz convida, o Lobo mostra o gesto; depois, ele só sopra quando a criança grita
    const nivel = this.convidando ? Math.max(0, Math.sin(this.tempo * 2.6)) ** 2 * 0.35 : this.medidor.nivel;
    // de peito cheio, olhando para quem vai gritar com ele
    lobo.pupila.position.set(0.008, 0);
    lobo.bochecha.scale.setScalar(Math.max(0.001, 1 - 0.45 * nivel));
    lobo.peito.scale.set(this.pose.peito[0] + (0.92 - this.pose.peito[0]) * nivel * 0.7, this.pose.peito[1] + (0.92 - this.pose.peito[1]) * nivel * 0.7, 1);
    lobo.queixo.rotation.z = -0.14 * nivel;
    lobo.fundoBoca.scale.y = 0.35 + 0.55 * nivel;
    // a casa responde: é o que mostra à criança que o grito está funcionando
    const parte = Math.min(1, this.medidor.energia / this.casa.energia);
    casa.rotation.z = this.pose.casaRz - this.casa.inclina * parte + Math.sin(this.tempo * 34) * 0.004 * nivel;
    cena.vento.quadro(nivel, this.tempo);
    lobo.root.updateWorldMatrix(true, false);
    lobo.root.localToWorld(this.ponto.set(-0.28, 0.2, 0.15)); this.ponto.project(camera);
    const alvo = this.$('sopro-painel');
    alvo.style.left = `${(this.ponto.x + 1) * innerWidth / 2}px`;
    alvo.style.top = `${(1 - this.ponto.y) * innerHeight / 2}px`;
    lobo.cabeca.localToWorld(this.pontoCabeca.set(0, 0.42, 0)); this.pontoCabeca.project(camera);
    // o balão abre para o lado de fora da casa: a criança precisa ver a casa balançando, e nunca passa da tela
    const grito = this.$('sopro-grito'); const a = grito.offsetHeight;
    const forca = Math.min(1 + this.medidor.nivel * 0.2, (innerWidth - 20) / grito.offsetWidth);
    const l = grito.offsetWidth * forca; const px = (this.pontoCabeca.x + 1) * innerWidth / 2;
    const x = Math.max(10, Math.min(innerWidth - l - 10, px - l * 0.72));
    grito.style.setProperty('--forca', forca.toFixed(3));
    grito.style.setProperty('--cauda', `${Math.max(12, Math.min(88, (px - x) / l * 100)).toFixed(1)}%`);
    grito.style.left = `${x + (l - grito.offsetWidth) / 2}px`;
    grito.style.top = `${Math.max(10, (1 - this.pontoCabeca.y) * innerHeight / 2 - a - 16)}px`;
  }
  /** Devolve o Lobo e a casa à pose em que a linha do tempo os deixou. */
  soltarPose() {
    this.convidando = null; this.audio.calar();
    this.$('sopro-grito').hidden = true; this.$('sopro-grito').classList.remove('balao');
    const p = this.pose; if (!p) return;
    this.pose = null;
    p.lobo.pupila.position.set(p.pupila[0], p.pupila[1]); p.lobo.peito.scale.set(p.peito[0], p.peito[1], 1); p.casa.rotation.z = p.casaRz;
  }
  concluir({ sozinho = false } = {}) {
    if (!this.pendente) return;
    this.sozinho = sozinho; this.soltarPose();
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
    this.captura++; this.microfone.parar(); this.soltarPose();
    this.pendente = false; this.fase = 'parado'; this.audio.pausarInteracao(false);
    document.body.classList.remove('soprando');
    this.$('sopro-painel').hidden = true;
    for (const cena of this.cenas()) if (cena.vento) cena.vento.raiz.visible = false;
  }
}

import * as THREE from 'three';
import { Livro, criaMesa, N, CUNHA, R, H, ESPESSURA, romano } from './book.js';
import { CENAS, CAPA } from './story.js';
import { montarCenas, arteDaCapa } from './cenas.js';
import { Audio } from './audio.js';
import { Atuacao } from './atuacao.js';
import { bake } from './paper.js';

const qs = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;

// ---- palco ----------------------------------------------------------------------------------------
const canvas = $('palco');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: qs.has('qa') });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
const FUNDO = new THREE.Color('#71472a');
scene.background = FUNDO;
scene.fog = new THREE.Fog(FUNDO, 13, 26);
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

const hemi = new THREE.HemisphereLight('#fffaf4', '#efe3d6', 2.42);
scene.add(hemi);
const sol = new THREE.DirectionalLight('#fff8ef', 1.75);
sol.position.set(-4.2, 6.4, 7.2);
sol.target.position.set(0, 1.2, 0);
sol.castShadow = true;
sol.shadow.mapSize.set(4096, 4096);
Object.assign(sol.shadow.camera, { left: -5.4, right: 5.4, top: 5.4, bottom: -5.4, near: 1, far: 24 });
sol.shadow.bias = -0.0005;
sol.shadow.normalBias = 0.006;
sol.shadow.radius = 9;
scene.add(sol, sol.target);

criaMesa(scene);

// ---- estado ---------------------------------------------------------------------------------------
const estado = {
  modo: 'capa', // capa | abrindo | aberto | fechando
  tAbrir: 0, // 0..1 da sequência inteira
  indice: -1, // -1 capa; 0..N-1 cena
  giro: 0, giroAlvo: 0,
  arrastando: false, arrasto: 0, movido: 0, ultimoX: 0, velo: 0,
  olhar: false,
  mouse: new THREE.Vector2(0, 0), mouseS: new THREE.Vector2(0, 0),
  tocouAcao: new Set(),
};
const DUR_ABRIR = reduzido ? 0.01 : 2.55;

let livro; let cenas = [];
const audio = new Audio();

// ---- enquadramento -------------------------------------------------------------------------------
const camCapa = { pos: new THREE.Vector3(), alvo: new THREE.Vector3() };
const camAberto = { pos: new THREE.Vector3(), alvo: new THREE.Vector3() };
function enquadrar() {
  const w = innerWidth; const h = innerHeight; const asp = w / h;
  renderer.setSize(w, h, false); camera.aspect = asp;
  camera.fov = 30; camera.updateProjectionMatrix();
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  // aberto: cabe a altura das paredes e a largura da cunha com as vizinhas
  const paisagem = asp >= 1.05;
  // quanto a cena em foco abre: em pé a tela é estreita e as pontas das paredes precisam caber
  if (livro) livro.larguraFoco = THREE.MathUtils.degToRad(paisagem ? 90 : 64);
  const altNav = paisagem ? 0.12 : 0.2;
  const distAlt = (H * 1.29) / (2 * tanV * (1 - altNav * 0.4));
  const larguraUtil = paisagem ? R * 1.5 : R * 1.08;
  const distLar = R * 0.85 + larguraUtil / (2 * tanV * asp);
  const dist = Math.max(distAlt + R * 0.5, distLar);
  camAberto.pos.set(0, H * 0.8, dist);
  camAberto.alvo.set(0, H * (paisagem ? 0.47 : 0.45), R * 0.2);
  // capa: livro deitado, em 3/4; em retrato sobe para sobrar lugar ao texto
  const k = paisagem ? 1 : Math.max(1, 1.05 / asp);
  camCapa.pos.set(paisagem ? 0.1 : 0.02, 8.1 * k, 6.9 * k);
  camCapa.alvo.set(paisagem ? 0.25 : 0.0, 0.0, paisagem ? 1.3 : -0.25);
}
addEventListener('resize', enquadrar);
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => audio.destravar(), { once: true });

function posDeitado() {
  const asp = innerWidth / innerHeight; const paisagem = asp >= 1.05;
  return { x: paisagem ? 0.1 : -R * 0.5 + 0.02, z: paisagem ? H * 0.5 + 0.35 : H * 0.5 + 0.5, yaw: paisagem ? -0.3 : -0.12 };
}

function aplicarLivro() {
  const t = estado.tAbrir;
  const levantar = ease(clamp(t / 0.36, 0, 1));
  const abrir = clamp((t - 0.24) / 0.76, 0, 1);
  livro.focar(estado.giro / CUNHA);
  livro.definirAbertura(abrir);
  const d = posDeitado();
  const r = livro.raiz;
  r.rotation.x = lerp(-Math.PI / 2, 0, levantar);
  r.rotation.y = lerp(d.yaw, 0, levantar);
  const yDeitado = ESPESSURA / 2 + 0.03;
  const centra = ease(clamp((t - 0.18) / 0.62, 0, 1));
  r.position.set(
    lerp(d.x, lerp(-R * 0.45, 0, centra), levantar),
    lerp(yDeitado, 0, levantar),
    lerp(d.z, lerp(0.15, 0, centra), levantar),
  );
  const cam = ease(clamp(t / 0.46, 0, 1));
  camera.position.lerpVectors(camCapa.pos, camAberto.pos, cam);
  alvoAtual.lerpVectors(camCapa.alvo, camAberto.alvo, cam);
}
const alvoAtual = new THREE.Vector3();

// ---- interface ------------------------------------------------------------------------------------
const pontos = [];
for (let i = -1; i < N; i++) {
  const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
  b.setAttribute('aria-label', i < 0 ? 'Capa' : `Cena ${i + 1}: ${CENAS[i].titulo}`);
  b.addEventListener('click', () => irPara(i)); $('pontos').append(b); pontos.push(b);
}
function atualizarUI() {
  audio.cena(estado.indice);
  if (estado.indice < 0) soltarLeitura(); else if (audio.narrando && estado.modo !== 'capa') prepararLeitura(estado.indice);
  const i = estado.indice; const capa = i < 0;
  pontos.forEach((b, k) => b.setAttribute('aria-selected', k === i + 1 ? 'true' : 'false'));
  document.body.classList.toggle('aberto', !capa);
  document.body.classList.toggle('fechando', estado.modo === 'fechando'); // o título da capa só volta com o livro já fechado
  $('capitulo').hidden = capa;
  $('cena-titulo').textContent = capa ? CAPA.titulo : CENAS[i].titulo;
  $('cena-sub').textContent = capa ? CAPA.sub : CENAS[i].sub;
  const ac = $('acao');
  if (capa) ac.textContent = CAPA.acao;
  else ac.textContent = estado.tocouAcao.has(i) ? 'De novo' : CENAS[i].acao;
  ac.setAttribute('aria-label', ac.textContent);
  if (!capa) {
    $('capitulo-texto').textContent = `Cena ${romano(i)} · ${CENAS[i].parte}`;
    const f = CENAS[i].fase; // fase: de sol pleno a lua; desloca o disco escuro
    $('fase').setAttribute('cx', String(10 + 16 * (1 - Math.abs(f * 2 - 1)) + (f < 0.5 ? -16 : 0) * 0));
    $('fase').setAttribute('cx', String(f < 0.62 ? 30 : 10 + (1 - f) * 22));
  }
  $('anterior').disabled = capa; $('proxima').disabled = i === N - 1;
  $('anterior').style.opacity = capa ? 0.3 : 1; $('proxima').style.opacity = i === N - 1 ? 0.3 : 1;
}
function abrirLivro() {
  if (estado.modo !== 'capa') return;
  estado.modo = 'abrindo'; estado.indice = 0; estado.giro = estado.giroAlvo = 0; audio.tocar('abrir', { vol: 0.8 }); atualizarUI();
}
function fecharLivro() {
  if (estado.modo !== 'aberto') return;
  estado.modo = 'fechando'; estado.indice = -1; estado.giroAlvo = 0; audio.tocar('abrir', { vol: 0.7, taxa: 1.15 }); atualizarUI();
}
function irPara(i) {
  audio.destravar();
  if (i < 0) { fecharLivro(); return; }
  if (estado.modo === 'capa') { abrirLivro(); estado.indice = i; estado.giroAlvo = i * CUNHA; atualizarUI(); return; }
  if (estado.modo !== 'aberto' && estado.modo !== 'abrindo') return;
  if (i === estado.indice) return;
  estado.indice = i; estado.giroAlvo = i * CUNHA; estado.virando = true;
  audio.tocar(Math.random() > 0.5 ? 'flap1' : 'flap2', { vol: 0.9 }); atualizarUI();
}
function agir() {
  audio.destravar();
  const i = estado.indice;
  if (i < 0) { abrirLivro(); return; }
  if (estado.modo !== 'aberto') return;
  const c = cenas[i]; if (!c) return;
  if (leitura.i === i) soltarLeitura(); // quem aperta o botão assume a cena; a voz continua
  c.linha.play(); audio.abaixar(c.linha.duration); estado.tocouAcao.add(i); atualizarUI();
}
$('acao').addEventListener('click', agir);
$('anterior').addEventListener('click', () => irPara(estado.indice - 1));
$('proxima').addEventListener('click', () => irPara(estado.indice + 1));
$('som').addEventListener('click', () => { audio.destravar(); const l = audio.alternar(); $('som').setAttribute('aria-pressed', String(l)); $('som').setAttribute('aria-label', l ? 'Desligar o som' : 'Ligar o som'); });
// narração: só existe na tela quando há voz gravada; a escolha de quem lê fica guardada neste navegador
function prepararNarracao() {
  const tem = audio.temNarracao();
  $('narrar').hidden = !tem;
  let guardado = null;
  try { guardado = localStorage.getItem('porquinhos-narracao'); } catch { /* sem armazenamento: fica ligada */ }
  if (guardado === 'nao' && audio.narrando) audio.alternarNarracao();
  atualizarBotaoNarrar();
}
function atualizarBotaoNarrar() {
  const b = $('narrar'); b.setAttribute('aria-pressed', String(audio.narrando));
  b.setAttribute('aria-label', audio.narrando ? 'Desligar o modo narrado' : 'Ligar o modo narrado: a voz conta e o livro vira sozinho'); b.title = b.getAttribute('aria-label');
}
$('narrar').addEventListener('click', () => {
  audio.destravar(); audio.alternarNarracao(); if (!audio.narrando) { clearTimeout(viradaAuto); soltarLeitura(); } atualizarBotaoNarrar();
  try { localStorage.setItem('porquinhos-narracao', audio.narrando ? 'sim' : 'nao'); } catch { /* segue só nesta visita */ }
});
// modo narrado: a voz conduz. O relógio da cena é o da fala, e a página vira quando as duas terminam.
const PAUSA_ANTES_DE_VIRAR = 1.4;
const PAUSA_ANTES_DE_FECHAR = 2.4;
let recomecarAoFechar = false;
let viradaAuto = null;
const leitura = { i: -1, segue: false, relogio: 0, comecou: false };
function prepararLeitura(i) {
  if (leitura.i === i) return;
  soltarLeitura();
  const f = audio.faixasVoz[i]; if (!audio.narrando || !f || !cenas[i]) return;
  const c = cenas[i];
  estado.tocouAcao.delete(i); // cada leitura atua a cena desde o começo
  c.linha.desancorar().ancorar(f.marcos ?? {}, f.acao_em ?? f.duracao); c.linha.seek(-0.01);
  Object.assign(leitura, { i, segue: true, relogio: 0, comecou: false });
}
function soltarLeitura() {
  const i = leitura.i; if (i < 0) return;
  const c = cenas[i]; const agiu = estado.tocouAcao.has(i);
  leitura.i = -1; leitura.segue = false;
  c.linha.desancorar(); c.linha.reset(); if (agiu) c.linha.seek(c.linha.duration);
}
function seguirLeitura(dt) {
  if (!leitura.segue) return;
  const i = leitura.i; const c = cenas[i]; const f = audio.faixasVoz[i];
  const t = audio.tempoVoz(i);
  if (t != null) { leitura.comecou = true; leitura.relogio = t; } else if (leitura.comecou) leitura.relogio += dt; else return;
  c.linha.seek(leitura.relogio, { silent: false });
  if (!estado.tocouAcao.has(i) && leitura.relogio >= (f.acao_em ?? f.duracao)) { estado.tocouAcao.add(i); audio.abaixar(1.2); atualizarUI(); }
  if (leitura.relogio >= c.linha.duration) leitura.segue = false;
}
audio.aoComecarVoz = (i) => { clearTimeout(viradaAuto); prepararLeitura(i); };
audio.aoFalhaVoz = () => soltarLeitura();
audio.aoFimDaVoz = (i) => {
  if (i !== estado.indice || !audio.narrando || !['abrindo', 'aberto'].includes(estado.modo)) return;
  clearTimeout(viradaAuto);
  if (leitura.i === i) {
    leitura.comecou = true;
    leitura.relogio = Math.max(leitura.relogio, audio.faixasVoz[i].duracao);
  }
  const ultima = i >= N - 1; // fim da história: o livro se fecha sozinho e fica pronto para ser lido de novo
  const virar = () => {
    if (i !== estado.indice || !audio.narrando || !['abrindo', 'aberto'].includes(estado.modo)) return;
    if (audio.oculto || estado.modo === 'abrindo' || estado.arrastando || leitura.segue || cenas[i].linha.playing) { viradaAuto = setTimeout(virar, 300); return; }
    if (ultima) { recomecarAoFechar = true; fecharLivro(); } else irPara(i + 1);
  };
  viradaAuto = setTimeout(virar, (ultima ? PAUSA_ANTES_DE_FECHAR : PAUSA_ANTES_DE_VIRAR) * 1000);
};
function alternarOlhar(v = !estado.olhar) { estado.olhar = v; document.body.classList.toggle('so-olhar', v); $('olhar').setAttribute('aria-pressed', String(v)); $('voltar-olhar').hidden = !v; }
$('olhar').addEventListener('click', () => alternarOlhar());
$('voltar-olhar').addEventListener('click', () => alternarOlhar(false));
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { if (estado.indice < N - 1) irPara(estado.indice + 1); else e.preventDefault(); } else if (e.key === 'ArrowLeft') { irPara(estado.indice - 1); } else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); agir(); } else if (e.key === 'Escape') { if (estado.olhar) alternarOlhar(false); } else if (e.key.toLowerCase() === 'o') alternarOlhar();
});

// ---- ponteiro: arrastar gira, tocar na cena age -----------------------------------------------------
for (const evento of ['gesturestart', 'gesturechange', 'gestureend']) addEventListener(evento, (e) => e.preventDefault(), { passive: false });
addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false });
canvas.addEventListener('pointerdown', (ev) => {
  if (!ev.isPrimary) return;
  audio.destravar();
  estado.arrastando = true; estado.movido = 0; estado.ultimoX = ev.clientX; estado.velo = 0; canvas.setPointerCapture(ev.pointerId);
  if (estado.modo === 'aberto') canvas.classList.add('arrastando');
});
canvas.addEventListener('pointermove', (ev) => {
  if (!ev.isPrimary) return;
  estado.mouse.set((ev.clientX / innerWidth) * 2 - 1, (ev.clientY / innerHeight) * 2 - 1);
  if (estado.arrastando) {
    const dx = ev.clientX - estado.ultimoX; estado.ultimoX = ev.clientX; estado.movido += Math.abs(dx);
    if (estado.modo === 'aberto' && estado.movido > 6) {
      const k = (CUNHA / Math.min(innerWidth, 720)) * 1.5;
      estado.giro -= dx * k; estado.giro = clamp(estado.giro, -0.25, (N - 1) * CUNHA + 0.25); estado.giroAlvo = estado.giro; estado.velo = -dx * k;
    }
    return;
  }
  if (ev.pointerType === 'mouse') {
    canvas.classList.toggle('pega', estado.modo === 'capa');
  }
});
canvas.addEventListener('pointerup', (ev) => {
  if (!ev.isPrimary) return;
  const foiToque = estado.movido <= 6;
  estado.arrastando = false; canvas.classList.remove('arrastando');
  if (estado.modo === 'capa' && foiToque) { abrirLivro(); return; }
  if (estado.modo !== 'aberto') return;
  if (foiToque) {
    const py = ev.clientY / innerHeight; if (py > 0.2 && Math.abs((ev.clientX / innerWidth) - 0.5) < 0.2) agir();
    return;
  }
  // encaixa na cena mais próxima, com a inércia do gesto
  const destino = clamp(Math.round((estado.giro + estado.velo * 6) / CUNHA), 0, N - 1);
  if (destino !== estado.indice) { estado.indice = destino; audio.tocar('flap1', { vol: 0.7 }); atualizarUI(); }
  estado.giroAlvo = destino * CUNHA;
});
for (const evento of ['pointercancel', 'lostpointercapture']) canvas.addEventListener(evento, () => {
  if (!estado.arrastando) return;
  estado.arrastando = false; estado.velo = 0; estado.giroAlvo = Math.max(0, estado.indice) * CUNHA;
  canvas.classList.remove('arrastando');
});

// ---- laço -------------------------------------------------------------------------------------------
let ultimo = performance.now(); let relogio = 0;
const atuacao = new Atuacao({ raiz: $('baloes'), camera, canvas: renderer.domElement, audio, cenas: () => cenas });
const quadros = { n: 0, soma: 0, piores: [] };
function passo(dt) {
  relogio += dt;
  if (estado.modo === 'abrindo') { estado.tAbrir = Math.min(1, estado.tAbrir + dt / DUR_ABRIR); if (estado.tAbrir >= 1) { estado.modo = 'aberto'; } } else if (estado.modo === 'fechando') {
    if (Math.abs(estado.giro) < 0.01) { estado.tAbrir = Math.max(0, estado.tAbrir - dt / (DUR_ABRIR * 0.8)); if (estado.tAbrir <= 0) {
      estado.modo = 'capa';
      document.body.classList.remove('fechando');
      if (recomecarAoFechar) { recomecarAoFechar = false; estado.tocouAcao.clear(); cenas.forEach((c) => { c.linha.desancorar(); c.linha.reset(); }); atualizarUI(); }
    } }
  }
  // giro entre cenas: mola curta, como no original (cerca de 0,6 s)
  if (!estado.arrastando) { const d = estado.giroAlvo - estado.giro; const k = reduzido ? 1 : 1 - Math.exp(-dt * 7.5); estado.giro += d * k; if (Math.abs(d) < 0.0004) estado.giro = estado.giroAlvo; }
  estado.mouseS.lerp(estado.mouse, 1 - Math.exp(-dt * 4));
  aplicarLivro();
  const px = estado.modo === 'aberto' && !reduzido ? estado.mouseS.x : 0; const py = estado.modo === 'aberto' && !reduzido ? estado.mouseS.y : 0;
  livro.anel.rotation.y = -estado.giro * clamp(estado.tAbrir * 4 - 3, 0, 1) - estado.giro * (1 - clamp(estado.tAbrir * 4 - 3, 0, 1)) + px * 0.022;
  camera.position.x += px * 0.28; camera.position.y -= py * 0.12;
  camera.lookAt(alvoAtual);
  // no celular em pé a câmera recua: a névoa recua junto para não apagar o livro
  scene.fog.near = Math.max(13, camera.position.distanceTo(alvoAtual) + 2.4); scene.fog.far = scene.fog.near + 13;
  livro.cullPorGiro(estado.giro, estado.tAbrir > 0.98);
  // só a cena em foco e as vizinhas animam
  atuacao.desfazer();
  seguirLeitura(dt);
  cenas.forEach((c, j) => {
    const perto = Math.abs(j * CUNHA - estado.giro) < CUNHA * 2.2 && estado.tAbrir > 0.2;
    if (!perto) return;
    c.linha.update(dt);
    c.idle?.(relogio);
  });
  atuacao.quadro(estado.modo === 'aberto' ? estado.indice : -1, relogio);
}
function laco(agora) {
  requestAnimationFrame(laco);
  const dt = Math.min((agora - ultimo) / 1000, 0.05); ultimo = agora;
  if (qsPausado) return;
  passo(dt);
  renderer.render(scene, camera);
  quadros.n++; quadros.soma += dt;
}
let qsPausado = false;

// ---- início --------------------------------------------------------------------------------------
async function iniciar() {
  await Promise.all([
    document.fonts.load('500 60px "Fraunces Variable"'), document.fonts.load('italic 500 60px "Fraunces Variable"'),
    document.fonts.load('400 30px "Libre Caslon Text"'), document.fonts.load('italic 400 30px "Libre Caslon Text"'), document.fonts.load('700 30px "Libre Caslon Text"'),
    document.fonts.load('600 24px "Inter Variable"'),
  ]);
  livro = new Livro(Math.min(16, renderer.capabilities.getMaxAnisotropy()));
  scene.add(livro.raiz);
  cenas = montarCenas(livro, audio);
  for (const c of livro.cunhas) { const s = bake(c.conteudo); livro.stats.pieces += s.pieces; livro.stats.draws += s.draws; livro.stats.triangles += s.triangles; }
  livro.aplicarCapa(arteDaCapa(renderer));
  enquadrar();
  prepararNarracao();
  estado.tAbrir = 0; atualizarUI();
  // ponte de QA: sem depender de relógio ou clique
  window.__livro = {
    estado, livro, cenas, renderer, scene, camera, N, audio,
    abrirNaHora(i = 0) { estado.modo = 'aberto'; estado.tAbrir = 1; estado.indice = i; estado.giro = estado.giroAlvo = i * CUNHA; atualizarUI(); passo(0); renderer.render(scene, camera); },
    irPara,
    agir,
    atuacao,
    leitura,
    sequencia(t) { qsPausado = true; estado.modo = 'abrindo'; estado.tAbrir = t; estado.indice = 0; atualizarUI(); passo(0); estado.tAbrir = t; renderer.render(scene, camera); },
    cenaEm(i, t) { qsPausado = true; const c = cenas[i]; c.linha.seek(t ?? c.linha.duration); c.idle?.(0); estado.modo = 'aberto'; estado.tAbrir = 1; estado.indice = i; estado.giro = estado.giroAlvo = i * CUNHA; atualizarUI(); passo(0); renderer.render(scene, camera); },
    liberar() { qsPausado = false; },
    medidas() { return { ...livro.stats, chamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles, gpu: renderer.getContext().getParameter(renderer.getContext().VERSION) }; },
    quadros,
  };
  const pag = qs.get('cena');
  if (pag !== null) window.__livro.abrirNaHora(clamp(Number(pag), 0, N - 1));
  renderer.compile(scene, camera);
  $('carregando').classList.add('fora');
  ultimo = performance.now(); requestAnimationFrame(laco);
}
iniciar().catch((e) => { console.error(e); $('carregando').textContent = 'O papel não dobrou: este navegador precisa de WebGL 2.'; });

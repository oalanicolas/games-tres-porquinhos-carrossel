import test from 'node:test';
import assert from 'node:assert/strict';
import { MedidorSopro, CASAS_SOPRO } from '../src/sopro.js';
import { abrir } from './_apoio.mjs';

test('sopro: silêncio, tom de voz e estalo não acumulam; sopros curtos somam sem regredir', () => {
  const m = new MedidorSopro(); const silencio = new Float32Array(2048); const plano = new Float32Array(1024).fill(-35);
  for (let i = 0; i < 200; i++) m.medir(silencio, plano, 0.02);
  assert.equal(m.energia, 0);
  const tom = Float32Array.from({ length: 2048 }, (_, i) => Math.sin(i * 0.2) * 0.5);
  const harmonico = new Float32Array(1024).fill(-100); harmonico[20] = -10;
  for (let i = 0; i < 200; i++) m.medir(tom, harmonico, 0.02);
  assert.equal(m.energia, 0);
  m.avancar(1, 0.04); m.avancar(0, 0.02); assert.equal(m.energia, 0);
  for (let i = 0; i < 30; i++) m.avancar(0.7, 0.02);
  const energia = m.energia;
  for (let i = 0; i < 100; i++) m.avancar(0, 0.02);
  assert.equal(m.energia, energia);
  for (let i = 0; i < 30; i++) m.avancar(0.7, 0.02);
  assert.ok(m.energia > energia);
  assert.ok(CASAS_SOPRO[5].energia < CASAS_SOPRO[7].energia && CASAS_SOPRO[7].energia < CASAS_SOPRO[9].energia);
  // criança: o mesmo grito fraco derruba a palha antes da madeira, e nenhuma casa pede mais de 5 s de grito somado
  const segundos = (i, forca) => { const m = new MedidorSopro(CASAS_SOPRO[i].nivel); let t = 0; while (m.energia < CASAS_SOPRO[i].energia && t < 60) { m.avancar(forca, 0.02); t += 0.02; } return t; };
  assert.ok(segundos(5, 0.2) < segundos(7, 0.2) && segundos(7, 0.2) < segundos(9, 0.2));
  for (const i of [5, 7, 9]) assert.ok(segundos(i, 0.2) < 5, `casa ${i}: ${segundos(i, 0.2)} s de grito fraco`);
  const filtrado = new Float32Array(1024).fill(-100); filtrado.fill(-30, 10, 140);
  const telefone = new MedidorSopro();
  for (let i = 0; i < 100; i++) telefone.medir(tom, filtrado, 0.02);
  assert.ok(telefone.energia > 0, 'corte das frequências altas não elimina todo o sopro');
});

async function microfoneSimulado(page) {
  await page.click('#acao');
  await page.evaluate(async () => {
    const ctx = new AudioContext(); const gain = ctx.createGain(); gain.gain.value = 0;
    const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = b.getChannelData(0);
    let seed = 13; for (let i = 0; i < d.length; i++) { seed = (seed * 16807) % 2147483647; d[i] = seed / 1073741824 - 1; }
    const noise = ctx.createBufferSource(); noise.buffer = b; noise.loop = true; noise.connect(gain); noise.start();
    const ctxDoLivro = window.__livro.audio.ctx;
    // "Fuuuu!" gritado por criança: voz a 300 Hz, com harmônicos e um pouco de ar. Sinal simulado, não uma criança.
    const voz = ctx.createGain(); voz.gain.value = 0; const apito = ctx.createGain(); apito.gain.value = 0;
    const vogal = ctx.createOscillator(); vogal.type = 'sawtooth'; vogal.frequency.value = 300; const filtro = ctx.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.value = 900;
    vogal.connect(filtro); filtro.connect(voz); vogal.start();
    const puro = ctx.createOscillator(); puro.frequency.value = 2000; puro.connect(apito); puro.start();
    window.__micTeste = { ctx, gain, voz, apito, streams: [], chamadas: 0, ctxDoLivro };
    navigator.mediaDevices.getUserMedia = async () => {
      const destino = ctx.createMediaStreamDestination(); gain.connect(destino); voz.connect(destino); apito.connect(destino);
      window.__micTeste.chamadas++; window.__micTeste.streams.push(destino.stream);
      return destino.stream;
    };
    await ctx.resume();
  });
}

async function entrar(page, i) {
  await page.evaluate((i) => { const L = window.__livro; L.abrirNaHora(i); L.interacao.limitar(i, 100); }, i);
  await page.waitForFunction(() => window.__livro.interacao.fase === 'ouvindo');
}

async function assoprar(page) {
  await page.evaluate(() => { window.__micTeste.gain.gain.value = 0.5; });
  try {
    await page.waitForFunction(() => window.__livro.interacao.fase === 'concluido', null, { timeout: 6000 });
  } catch (e) {
    console.log('diagnostico-sopro', await page.evaluate(() => {
      const L = window.__livro, s = L.interacao;
      return { fase: s.fase, indice: L.estado.indice, energia: s.medidor.energia, ruido: s.medidor.ruido, nivel: s.medidor.nivel, audio: L.audio.ctx.state, fonte: window.__micTeste.ctx.state, medicao: s.microfone.ler(s.medidor, 0), leitura: L.leitura, streams: window.__micTeste.streams.map(s => s.getTracks()[0].readyState) };
    }));
    throw e;
  }
  await page.evaluate(() => { window.__micTeste.gain.gain.value = 0; });
}

test('sopro: três casas funcionam somente pelo microfone, com modo alternável e sem alternativa manual', async () => {
  const { page, erros, fechar } = await abrir({ largura: 390, altura: 844, interativo: true });
  try {
    assert.equal(await page.locator('#sopro-botao, #sopro-pular').count(), 0);
    await microfoneSimulado(page);
    for (const i of [5, 7, 9]) {
      await page.evaluate((i) => { window.__livro.irPara(i); }, i);
      await page.waitForFunction(() => window.__livro.interacao.fase === 'ouvindo', null, { timeout: 15000 });
      assert.equal(await page.locator('#acao').isVisible(), false, 'não exige botão de ação mesmo sem narração');
      assert.equal(await page.locator('#sopro-painel').isVisible(), false, 'nenhum painel durante o sopro');
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => window.__livro.interacao.medidor.energia), 0, 'silêncio não resolve a casa');
      await page.evaluate(() => { window.__micTeste.gain.gain.value = 0.5; });
      await page.waitForFunction(() => window.__livro.cenas[window.__livro.estado.indice].vento.raiz.visible);
      await page.waitForFunction(() => window.__livro.interacao.fase === 'concluido', null, { timeout: 6000 });
      await page.evaluate(() => { window.__micTeste.gain.gain.value = 0; });
      assert.ok(await page.evaluate((i) => window.__livro.interacao.concluidas.has(i), i));
      assert.equal(await page.evaluate(() => window.__micTeste.streams.at(-1).getTracks()[0].readyState), 'ended');
      assert.equal(await page.evaluate(() => window.__micTeste.ctxDoLivro.state), 'running', 'concluir não encerra o áudio do livro');
    }
    assert.match(await page.locator('#sopro-status').textContent(), /resistem/);
    assert.equal(await page.evaluate(() => window.__micTeste.chamadas), 3, 'captura retoma automaticamente a cada casa');
    await page.evaluate(() => { const L = window.__livro; L.abrirNaHora(0); L.irPara(-1); });
    await page.waitForFunction(() => window.__livro.estado.modo === 'capa'); await page.click('#acao');
    assert.equal(await page.evaluate(() => window.__livro.interacao.concluidas.size), 0);
    await page.evaluate(() => window.__micTeste.ctx.close());
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('sopro: microfone recusado não prende a criança, e permissão tardia não vaza captura', async () => {
  const { page, fechar } = await abrir({ interativo: true });
  try {
    await page.click('#acao');
    await page.evaluate(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('negado', 'NotAllowedError'); }; const L = window.__livro; L.abrirNaHora(5); L.interacao.limitar(5, 100); });
    await page.waitForFunction(() => window.__livro.interacao.fase === 'concluido');
    assert.ok(await page.evaluate(() => window.__livro.interacao.sozinho && window.__livro.interacao.concluidas.has(5)), 'o Lobo devia seguir sozinho');
    assert.equal(await page.locator('#sopro-grito').isVisible(), false);
    await page.evaluate(() => { navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => { window.__resolverMic = resolve; }); const L = window.__livro; L.abrirNaHora(7); L.interacao.limitar(7, 100); });
    await page.waitForFunction(() => window.__livro.interacao.fase === 'permissao');
    await page.evaluate(() => { window.__livro.irPara(9); window.__micParado = false; window.__resolverMic({ getTracks: () => [{ stop() { window.__micParado = true; } }] }); });
    await page.waitForFunction(() => window.__micParado);
  } finally { await fechar(); }
});

test('sopro: no celular, o balão inteiro cabe na tela mesmo no fim do grito', async () => {
  const { page, fechar } = await abrir({ largura: 390, altura: 844, interativo: true });
  try {
    await microfoneSimulado(page); await entrar(page, 9);
    await page.evaluate(() => { window.__micTeste.voz.gain.value = 0.35; });
    await page.waitForFunction(() => { const s = window.__livro.interacao; return s.medidor.energia > s.casa.energia * 0.8; }, null, { timeout: 6000 });
    const r = await page.locator('#sopro-grito').evaluate((b) => { const q = b.getBoundingClientRect(); return { dentro: q.left >= 0 && q.right <= innerWidth && q.top >= 0, texto: b.textContent }; });
    assert.ok(r.dentro, JSON.stringify(r));
    await page.evaluate(() => window.__micTeste.ctx.close());
  } finally { await fechar(); }
});

test('sopro: fica claro que é para gritar, "Fuuuu!" com voz conta e apito não', async () => {
  const { page, erros, fechar } = await abrir({ interativo: true });
  try {
    await microfoneSimulado(page); await entrar(page, 5);
    assert.deepEqual(await page.evaluate(() => window.__livro.audio.falasDitas), ['convite-palha'], 'a voz pede o grito');
    const balao = page.locator('#sopro-grito');
    assert.equal(await balao.isVisible(), true);
    assert.match(await balao.textContent(), /^Fu{4,}!$/);
    const noQuadro = await balao.evaluate((b) => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.width > 100; });
    assert.ok(noQuadro, 'balão grande e dentro da tela');
    await page.evaluate(() => { window.__micTeste.apito.gain.value = 0.5; });
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(() => window.__livro.interacao.medidor.energia), 0, 'apito puro não conta');
    await page.evaluate(() => { window.__micTeste.apito.gain.value = 0; window.__micTeste.voz.gain.value = 0.35; });
    await page.waitForFunction(() => { const m = window.__livro.interacao.medidor; return m.energia > 0.1; }, null, { timeout: 4000 });
    assert.ok((await balao.textContent()).length > 'Fuuuu!'.length || await page.evaluate(() => window.__livro.interacao.fase === 'concluido'), 'o balão cresce com o grito');
    const lado = await page.evaluate(() => { const L = window.__livro; const c = L.cenas[5]; return { lobo: c.atores.lobo.root.position.x, casa: c.vento.casa.position.x, rz: c.vento.casa.rotation.z }; });
    assert.ok(lado.lobo < lado.casa && lado.rz <= 0, 'o vento vem do lado do Lobo e a casa inclina para longe dele');
    await page.waitForFunction(() => window.__livro.interacao.fase === 'concluido', null, { timeout: 4000 });
    assert.equal(await page.evaluate(() => window.__livro.interacao.sozinho), false);
    assert.equal(await balao.isVisible(), false);
    await page.evaluate(() => window.__micTeste.ctx.close());
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('sopro: sem nenhum grito, a voz pede de novo e o Lobo termina sozinho', async () => {
  const { page, erros, fechar } = await abrir({ interativo: true });
  try {
    await microfoneSimulado(page); await entrar(page, 7);
    await page.waitForFunction(() => window.__livro.audio.falasDitas?.includes('convite-de-novo'), null, { timeout: 9000 });
    await page.waitForFunction(() => window.__livro.interacao.fase === 'concluido', null, { timeout: 15000 });
    const r = await page.evaluate(() => { const s = window.__livro.interacao; return { sozinho: s.sozinho, energia: s.medidor.energia, feita: s.concluidas.has(7), rz: window.__livro.cenas[7].vento.casa.rotation.z }; });
    assert.deepEqual(r, { sozinho: true, energia: 0, feita: true, rz: 0 });
    await page.evaluate(() => window.__micTeste.ctx.close());
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('sopro: botão discreto alterna o modo e encerra a captura sem parar o áudio do livro', async () => {
  const { page, erros, fechar } = await abrir({ interativo: true });
  try {
    await microfoneSimulado(page); await entrar(page, 9);
    assert.equal(await page.locator('#barra #interagir').count(), 1);
    await page.click('#interagir');
    assert.equal(await page.locator('#interagir').getAttribute('aria-pressed'), 'false');
    assert.equal(await page.evaluate(() => window.__livro.interacao.ativa), false);
    assert.equal(await page.evaluate(() => window.__micTeste.streams.at(-1).getTracks()[0].readyState), 'ended');
    assert.equal(await page.evaluate(() => window.__livro.audio.ctx.state), 'running');
    await page.evaluate(() => { const L = window.__livro; L.estado.modo = 'abrindo'; L.estado.tAbrir = 0.8; });
    await page.click('#interagir');
    assert.equal(await page.locator('#interagir').getAttribute('aria-pressed'), 'true');
    await page.waitForFunction(() => window.__livro.interacao.fase === 'ouvindo', null, { timeout: 15000 });
    await page.evaluate(() => window.__micTeste.ctx.close());
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('sopro: vento para no silêncio e captura termina ao ocultar a página, retomando sozinha', async () => {
  const { page, erros, fechar } = await abrir({ interativo: true });
  try {
    await microfoneSimulado(page); await entrar(page, 9);
    await page.evaluate(() => { window.__micTeste.gain.gain.value = 0.12; });
    await page.waitForFunction(() => window.__livro.interacao.medidor.energia > 0.05);
    await page.evaluate(() => { window.__micTeste.gain.gain.value = 0; });
    await page.waitForFunction(() => !window.__livro.cenas[9].vento.raiz.visible);
    const energia = await page.evaluate(() => window.__livro.interacao.medidor.energia);
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.__livro.interacao.medidor.energia), energia);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal(await page.evaluate(() => window.__micTeste.streams.at(-1).getTracks()[0].readyState), 'ended');
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForFunction(() => window.__livro.interacao.fase === 'ouvindo');
    await assoprar(page); await page.evaluate(() => window.__micTeste.ctx.close());
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('sopro: narração pausa e retoma automaticamente depois do sopro', async () => {
  const { page, erros, fechar } = await abrir({ narrado: true, interativo: true });
  try {
    await microfoneSimulado(page);
    await page.evaluate(() => window.__livro.abrirNaHora(5));
    await page.waitForFunction(() => window.__livro.audio.voz?.i === 5);
    await page.evaluate(() => { const L = window.__livro; L.audio.voz.el.currentTime = L.audio.faixasVoz[5].marcos.sopro.em + 0.05; });
    await page.waitForFunction(() => window.__livro.interacao.fase === 'ouvindo');
    assert.equal(await page.evaluate(() => window.__livro.audio.voz.el.paused), true);
    const t = await page.evaluate(() => window.__livro.audio.voz.el.currentTime);
    await assoprar(page);
    await page.waitForFunction((t) => window.__livro.audio.voz?.el.currentTime > t + 0.1, t);
    await page.evaluate(() => window.__micTeste.ctx.close());
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('sopro: pedido de permissão acompanha o Lobo no livro e não forma HUD', async () => {
  const { page, fechar } = await abrir({ interativo: true });
  try {
    await page.click('#acao');
    await page.evaluate(() => { navigator.mediaDevices.getUserMedia = () => new Promise(() => {}); });
    for (const [width, height] of [[390, 844], [844, 390], [360, 640]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => { const L = window.__livro; L.abrirNaHora(5); L.interacao.repetir(5); L.cenas[5].linha.seek(L.interacao.limitar(5, 100)); });
      await page.waitForTimeout(600);
      const r = await page.evaluate(() => {
        const L = window.__livro; const pane = document.getElementById('sopro-painel'); const b = pane.getBoundingClientRect(); const css = getComputedStyle(pane);
        const p = L.interacao.ponto;
        const clone = pane.cloneNode(true); clone.querySelector('.sopro-acessivel').remove(); clone.querySelectorAll('[aria-hidden=true]').forEach(n => n.remove());
        return { vazio: !clone.textContent.trim(), compacto: b.width <= 48 && b.height <= 48, transparente: css.backgroundColor === 'rgba(0, 0, 0, 0)' && css.boxShadow === 'none', noLivro: Math.abs(b.x + b.width / 2 - (p.x + 1) * innerWidth / 2) < 1, semManual: !document.querySelector('#sopro-botao, #sopro-pular') };
      });
      assert.deepEqual(r, { vazio: true, compacto: true, transparente: true, noLivro: true, semManual: true });
    }
  } finally { await fechar(); }
});

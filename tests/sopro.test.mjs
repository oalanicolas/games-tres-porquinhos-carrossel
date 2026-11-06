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
  assert.ok(CASAS_SOPRO[2].energia < CASAS_SOPRO[3].energia && CASAS_SOPRO[3].energia < CASAS_SOPRO[4].energia);
  const palha = new MedidorSopro(CASAS_SOPRO[2].nivel), madeira = new MedidorSopro(CASAS_SOPRO[3].nivel);
  for (let i = 0; i < 200; i++) { palha.avancar(0.2, 0.02); madeira.avancar(0.2, 0.02); }
  assert.ok(palha.energia > CASAS_SOPRO[2].energia);
  assert.equal(madeira.energia, 0);
  const filtrado = new Float32Array(1024).fill(-100); filtrado.fill(-30, 10, 140);
  const telefone = new MedidorSopro();
  for (let i = 0; i < 100; i++) telefone.medir(tom, filtrado, 0.02);
  assert.ok(telefone.energia > 0, 'corte das frequências altas não elimina todo o sopro');
});

test('sopro: três casas aguardam a criança, medem vento, liberam a história e permitem repetir', async () => {
  const { page, erros, fechar } = await abrir({ largura: 390, altura: 844 });
  try {
    await page.click('#interagir');
    for (const i of [2, 3, 4]) {
      await page.evaluate((i) => { const L = window.__livro; L.abrirNaHora(i); L.agir(); }, i);
      await page.waitForFunction(() => window.__livro.interacao.pendente, null, { timeout: 15000 });
      const antes = await page.evaluate(() => ({ t: window.__livro.cenas[window.__livro.estado.indice].linha.t, indice: window.__livro.estado.indice }));
      await page.waitForTimeout(350);
      assert.deepEqual(await page.evaluate(() => ({ t: window.__livro.cenas[window.__livro.estado.indice].linha.t, indice: window.__livro.estado.indice })), antes);
      assert.equal(await page.evaluate(() => window.__livro.audio.master.gain.value), 0);
      await page.locator('#sopro-botao').focus(); await page.keyboard.down('Space');
      await page.waitForFunction(() => Number(document.getElementById('sopro-nivel').value) > 40);
      await page.waitForFunction(() => !window.__livro.interacao.pendente, null, { timeout: 10000 }); await page.keyboard.up('Space');
      assert.equal(await page.evaluate(() => window.__livro.audio.interacao), false);
      assert.ok(await page.evaluate((i) => window.__livro.interacao.concluidas.has(i), i));
      if (i === 4) assert.match(await page.locator('#sopro-status').textContent(), /resistem/);
    }
    await page.evaluate(() => window.__livro.agir());
    assert.equal(await page.evaluate(() => window.__livro.interacao.concluidas.has(4)), false);
    await page.evaluate(() => { const L = window.__livro; L.abrirNaHora(0); L.irPara(-1); });
    await page.waitForFunction(() => window.__livro.estado.modo === 'capa');
    await page.click('#acao');
    assert.equal(await page.evaluate(() => window.__livro.interacao.concluidas.size), 0, 'nova leitura aceita novos sopros');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('sopro: recusa ou permissão pendente não prendem a navegação e microfone tardio é fechado', async () => {
  const { page, fechar } = await abrir();
  try {
    await page.click('#interagir');
    await page.evaluate(() => { const L = window.__livro; L.abrirNaHora(2); L.interacao.limitar(2, 100); navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('negado', 'NotAllowedError'); }; });
    await page.click('#sopro-microfone');
    await page.waitForFunction(() => document.getElementById('sopro-status').textContent.includes('não autorizado'));
    await page.evaluate(() => { navigator.mediaDevices.getUserMedia = () => new Promise((resolve, reject) => { window.__negarAntigo = reject; }); });
    await page.click('#sopro-microfone');
    await page.locator('#sopro-botao').focus(); await page.keyboard.press('Space');
    await page.evaluate(() => { navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => { window.__resolverMic = resolve; }); });
    await page.click('#sopro-microfone');
    await page.evaluate(() => window.__negarAntigo(new DOMException('antigo', 'NotAllowedError')));
    assert.equal(await page.evaluate(() => window.__livro.interacao.fase), 'permissao');
    await page.click('#sopro-pular');
    await page.evaluate(() => { window.__micParado = false; window.__resolverMic({ getTracks: () => [{ stop() { window.__micParado = true; } }] }); });
    await page.waitForFunction(() => window.__micParado);
    assert.equal(await page.evaluate(() => window.__livro.interacao.pendente), false);
    await page.evaluate(() => window.__livro.irPara(3));
    assert.equal(await page.evaluate(() => window.__livro.audio.interacao), false);
  } finally { await fechar(); }
});

test('sopro: captura PCM real, calibra silêncio, recusa tom e aceita vento; fecha trilha ao sair', async () => {
  const { page, erros, fechar } = await abrir({ narrado: true });
  try {
    await page.click('#interagir');
    await page.evaluate(() => {
      const L = window.__livro; L.abrirNaHora(2);
      L.interacao.limitar(2, 100);
      navigator.mediaDevices.getUserMedia = async () => {
        const ctx = new AudioContext(); const gain = ctx.createGain(); gain.gain.value = 0;
        const destino = ctx.createMediaStreamDestination(); gain.connect(destino);
        const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = b.getChannelData(0);
        let seed = 13; for (let i = 0; i < d.length; i++) { seed = (seed * 16807) % 2147483647; d[i] = seed / 1073741824 - 1; }
        const noise = ctx.createBufferSource(); noise.buffer = b; noise.loop = true;
        const ruido = ctx.createGain(); ruido.gain.value = 0; noise.connect(ruido); ruido.connect(gain); noise.start();
        const osc = ctx.createOscillator(); const voz = ctx.createGain(); voz.gain.value = 0; osc.connect(voz); voz.connect(gain); osc.start();
        await ctx.resume(); window.__micTeste = { ctx, gain, ruido, voz, stream: destino.stream };
        return destino.stream;
      };
    });
    await page.click('#sopro-microfone');
    await page.waitForFunction(() => window.__livro.interacao.fase === 'ouvindo');
    await page.evaluate(() => { window.__micTeste.gain.gain.value = 0.5; window.__micTeste.voz.gain.value = 1; });
    await page.waitForTimeout(800);
    assert.equal(await page.evaluate(() => window.__livro.interacao.medidor.energia), 0);
    await page.evaluate(() => { window.__micTeste.voz.gain.value = 0; window.__micTeste.ruido.gain.value = 1; });
    await page.waitForFunction(() => window.__livro.interacao.fase === 'concluido', null, { timeout: 6000 });
    assert.equal(await page.evaluate(() => window.__micTeste.stream.getTracks()[0].readyState), 'ended');
    await page.evaluate(() => window.__micTeste.ctx.close());
    assert.equal(await page.evaluate(() => window.__livro.audio.interacao), false);
    await page.evaluate(() => { const L = window.__livro; L.interacao.repetir(2); L.interacao.limitar(2, 100); });
    await page.click('#sopro-microfone');
    await page.waitForFunction(() => window.__livro.interacao.fase === 'ouvindo');
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal(await page.evaluate(() => window.__micTeste.stream.getTracks()[0].readyState), 'ended');
    assert.equal(await page.evaluate(() => window.__livro.interacao.fase), 'pronto');
    await page.evaluate(async () => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); await window.__micTeste.ctx.close(); });
    await page.click('#sopro-pular');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('sopro: narração pausa antes da queda nas três casas e retoma do mesmo ponto', async () => {
  const { page, erros, fechar } = await abrir({ narrado: true });
  try {
    await page.click('#interagir');
    for (const i of [2, 3, 4]) {
      await page.evaluate((i) => window.__livro.abrirNaHora(i), i);
      await page.waitForFunction((i) => window.__livro.audio.voz?.i === i, i);
      await page.evaluate((i) => {
        const L = window.__livro; const grupo = { 2: 'sopro', 3: 'sopro1', 4: 'sopro0' }[i];
        L.audio.voz.el.currentTime = L.audio.faixasVoz[i].marcos[grupo].em + 0.05;
      }, i);
      await page.waitForFunction(() => window.__livro.interacao.pendente);
      const t = await page.evaluate(() => window.__livro.audio.voz.el.currentTime);
      assert.equal(await page.evaluate(() => window.__livro.audio.voz.el.paused), true);
      await page.waitForTimeout(250);
      assert.ok(Math.abs(await page.evaluate(() => window.__livro.audio.voz.el.currentTime) - t) < 0.02);
      await page.click('#sopro-pular');
      await page.waitForFunction((t) => window.__livro.audio.voz?.el.currentTime > t + 0.1, t);
      assert.equal(await page.evaluate(() => window.__livro.estado.indice), i);
    }
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('sopro: painel cabe em três telas sem esconder o Lobo nem a navegação', async () => {
  const { page, fechar } = await abrir();
  try {
    for (const [width, height] of [[390, 844], [844, 390], [360, 640]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => {
        const L = window.__livro; L.abrirNaHora(2);
        if (!L.interacao.ativa) L.interacao.alternar();
        L.interacao.repetir(2); L.cenas[2].linha.seek(L.interacao.limitar(2, 100));
      });
      await page.waitForTimeout(600);
      const texto = await page.evaluate(() => {
        const painel = document.getElementById('sopro-painel').cloneNode(true);
        painel.querySelector('.sopro-acessivel').remove();
        painel.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
        const acessivel = getComputedStyle(document.querySelector('.sopro-acessivel'));
        return { visual: painel.textContent.trim(), botao: document.getElementById('interagir').textContent.trim(), oculto: acessivel.clipPath === 'inset(50%)' && acessivel.width === '1px' };
      });
      assert.deepEqual(texto, { visual: '', botao: '', oculto: true });
      const r = await page.evaluate(() => {
        const L = window.__livro; const head = L.cenas[2].atores.lobo.cabeca;
        head.updateWorldMatrix(true, false);
        const p = head.position.clone().setFromMatrixPosition(head.matrixWorld).project(L.camera);
        const painel = document.getElementById('sopro-painel').getBoundingClientRect();
        const nav = document.getElementById('barra').getBoundingClientRect();
        const x = (p.x + 1) * innerWidth / 2, y = (1 - p.y) * innerHeight / 2;
        return { cabe: painel.left >= 0 && painel.right <= innerWidth && painel.top >= 0 && painel.bottom <= nav.top, loboVisivel: x < painel.left || x > painel.right || y < painel.top || y > painel.bottom };
      });
      assert.deepEqual(r, { cabe: true, loboVisivel: true }, `${width}×${height}`);
    }
  } finally { await fechar(); }
});

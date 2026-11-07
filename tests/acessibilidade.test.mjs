import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';
import { CENAS } from '../src/story.js';

test('acessibilidade: o texto das 17 cenas está no HTML e os estados ocultos saem do foco', async () => {
  const { page, erros, fechar } = await abrir();
  try {
    await page.click('#acao');
    await page.waitForFunction(() => window.__livro.estado.modo === 'aberto');
    assert.equal(await page.locator('#abertura').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('#carregando').getAttribute('aria-hidden'), 'true');
    assert.ok((await page.locator('body').ariaSnapshot()).includes(CENAS[0].linhas[0].t));
    await page.locator('#olhar').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'voltar-olhar');
    assert.equal(await page.locator('#barra').evaluate((e) => e.inert), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#barra')), false);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'olhar');
    assert.equal(await page.locator('#barra').evaluate((e) => e.inert), false);
    await page.click('#ler');
    for (let i = 0; i < CENAS.length; i++) {
      assert.equal(await page.locator('#texto-titulo').textContent(), CENAS[i].titulo);
      assert.deepEqual(await page.locator('#texto-paragrafos p').allTextContents(), CENAS[i].linhas.map((linha) => linha.t));
      if (i < CENAS.length - 1) await page.click('#proxima');
    }
    await page.click('#ler');
    await page.setViewportSize({ width: 1440, height: 870 });
    await page.locator('#pontos [aria-selected=true]').focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.evaluate(() => window.__livro.estado.indice), CENAS.length - 2);
    await page.mouse.move(300, 180); await page.mouse.down();
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal(await page.evaluate(() => window.__livro.estado.arrastando), false);
    await page.mouse.up();
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('acessibilidade: leitura amplia até 200%, rola e mantém a narração na página escolhida', async () => {
  const { page, erros, fechar } = await abrir({ largura: 320, altura: 568, narrado: true });
  try {
    await page.click('#acao');
    await page.click('#ler');
    assert.equal(await page.evaluate(() => window.__livro.estado.modo), 'aberto');
    assert.equal(await page.evaluate(() => window.__livro.audio.narrando), true);
    const inicial = await page.locator('#pagina-texto').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    for (let i = 0; i < 4; i++) await page.click('#texto-maior');
    const ampliado = await page.locator('#pagina-texto').evaluate((e) => ({ fonte: parseFloat(getComputedStyle(e).fontSize), largura: e.clientWidth, conteudo: e.scrollWidth }));
    assert.equal(ampliado.fonte, inicial * 2);
    assert.ok(ampliado.conteudo <= ampliado.largura);
    await page.mouse.move(160, 240); await page.mouse.wheel(0, 300);
    await page.waitForFunction(() => document.querySelector('#pagina-texto').scrollTop > 0);
    await page.locator('#pagina-texto').evaluate((e) => { e.scrollTop = 0; });
    const toque = await page.context().newCDPSession(page);
    await toque.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
    const caixa = await page.locator('#pagina-texto').boundingBox();
    const inicio = caixa.y + caixa.height - 30;
    await toque.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 160, y: inicio }] });
    for (let passo = 1; passo <= 5; passo++) {
      await toque.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 160, y: inicio - passo * 30 }] });
      await page.waitForTimeout(20);
    }
    await toque.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForFunction(() => document.querySelector('#pagina-texto').scrollTop > 0);
    await page.click('#proxima');
    assert.equal(await page.locator('#texto-titulo').textContent(), CENAS[1].titulo);
    await page.click('#ler');
    assert.equal(await page.evaluate(() => window.__livro.estado.lendo), false);
    assert.equal(await page.evaluate(() => window.__livro.audio.narrando), true);
    await page.waitForFunction(() => window.__livro.audio.voz?.i === 1);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('gestos: pinça e dois toques não ampliam o livro nem a leitura, e a navegação continua', async () => {
  const { page, erros, fechar } = await abrir({ largura: 390, altura: 844 });
  try {
    await page.click('#acao');
    await page.waitForFunction(() => window.__livro.estado.modo === 'aberto');
    const toque = await page.context().newCDPSession(page);
    await toque.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
    for (const leitura of [false, true]) {
      if (leitura) await page.click('#ler');
      for (let i = 0; i < 2; i++) {
        await toque.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 300 }] });
        await toque.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(80);
      }
      await toque.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 0, x: 160, y: 300 }, { id: 1, x: 220, y: 300 }] });
      await toque.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 0, x: 80, y: 300 }, { id: 1, x: 300, y: 300 }] });
      await toque.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => visualViewport.scale), 1);
      assert.equal(await page.evaluate(() => window.__livro.estado.arrastando), false);
      const antes = await page.evaluate(() => window.__livro.estado.indice);
      await page.click('#proxima');
      assert.equal(await page.evaluate(() => window.__livro.estado.indice), antes + 1);
    }
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('acessibilidade: cabeçalho, alvos e contraste resistem à largura de 320 px e ao texto ampliado', async () => {
  const { page, erros, fechar } = await abrir();
  try {
    await page.click('#acao');
    await page.waitForFunction(() => window.__livro.estado.modo === 'aberto');
    for (const [width, height] of [[320,568],[360,640],[390,844],[768,1024],[844,390],[1440,870]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(100);
      const caixas = await page.evaluate(() => {
        const a = document.querySelector('#titulo').getBoundingClientRect();
        const b = document.querySelector('#capitulo').getBoundingClientRect();
        const botoes = [...document.querySelectorAll('#barra button')].filter((e) => e.offsetWidth).map((e) => e.getBoundingClientRect());
        return { colisao: a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom, pequenos: botoes.filter((r) => r.width < 44 || r.height < 44).length, overflow: document.documentElement.scrollWidth - innerWidth };
      });
      assert.deepEqual(caixas, { colisao: false, pequenos: 0, overflow: 0 }, `${width}x${height}`);
    }
    const contraste = await page.evaluate(() => {
      const canais = (texto) => texto.match(/[\d.]+/g).map(Number);
      const tinta = canais(getComputedStyle(document.querySelector('.legenda span')).color);
      const fundo = canais(getComputedStyle(document.querySelector('#barra')).backgroundColor);
      const luminancia = (rgb) => rgb.slice(0, 3).map((v) => v / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [0.2126,0.7152,0.0722][i], 0);
      return (luminancia(fundo.slice(0, 3).map((v) => v * fundo[3])) + 0.05) / (luminancia(tinta) + 0.05);
    });
    assert.ok(contraste >= 4.5, `contraste ${contraste}`);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.click('#ler');
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#pagina-texto').evaluate((e) => e.scrollWidth <= e.clientWidth), true);
    const barra = await page.locator('#barra').boundingBox();
    assert.ok(barra.x >= 0 && barra.x + barra.width <= 320);
    await page.emulateMedia({ forcedColors: 'active' });
    assert.equal(await page.locator('#pagina-texto').evaluate((e) => getComputedStyle(e).backgroundColor), 'rgb(255, 255, 255)');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

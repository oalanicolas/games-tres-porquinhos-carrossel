import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';

test('memória: páginas distantes liberam suas imagens e voltam idênticas ao retornar', async () => {
  const { page, fechar, erros } = await abrir();
  try {
    const inicial = await page.evaluate(() => {
      const L = window.__livro;
      L.abrirNaHora(0);
      return L.livro.paredes[0].m.material[5].map.image.toDataURL();
    });
    let maximo = 0;
    for (let i = 0; i < 17; i++) {
      const quantidade = await page.evaluate((i) => {
        const L = window.__livro;
        L.abrirNaHora(i);
        return L.livro.paredes.flatMap((p) => [p.m.material[4], p.m.material[5]]).filter((m) => m.map).length;
      }, i);
      maximo = Math.max(maximo, quantidade);
    }
    assert.ok(maximo <= 18, `${maximo} imagens de páginas residentes, limite de 18`);
    assert.equal(await page.evaluate(() => window.__livro.livro.paredes[0].m.material[5].map), null);
    const retorno = await page.evaluate(() => {
      const L = window.__livro;
      L.abrirNaHora(0);
      return L.livro.paredes[0].m.material[5].map.image.toDataURL();
    });
    assert.equal(retorno, inicial, 'a página recriada deve preservar todos os pixels');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('contexto gráfico: perda temporária pausa a voz e a restauração retoma a mesma cena', async () => {
  const { page, fechar } = await abrir({ narrado: true });
  try {
    await page.click('#acao');
    await page.waitForFunction(() => window.__livro.audio.tempoVoz(0) > 0.5);
    const tempo = await page.evaluate(async () => {
      const L = window.__livro;
      await new Promise((resolve) => {
        L.renderer.domElement.addEventListener('webglcontextlost', resolve, { once: true });
        L.renderer.forceContextLoss();
      });
      return L.audio.tempoVoz(0);
    });
    await page.waitForTimeout(500);
    const parado = await page.evaluate(() => ({ tempo: window.__livro.audio.tempoVoz(0), narrando: window.__livro.audio.narrando }));
    assert.ok(parado.tempo - tempo < 0.15, 'a voz avançou enquanto o livro estava sem imagem');
    assert.equal(parado.narrando, true);
    await page.evaluate(() => window.__livro.renderer.forceContextRestore());
    await page.waitForFunction((t) => window.__livro.audio.tempoVoz(0) > t + 0.2, tempo);
    assert.equal(await page.evaluate(() => window.__livro.estado.indice), 0);
  } finally { await fechar(); }
});

test('contexto gráfico: o sopro pendente conserva energia durante a perda da imagem', async () => {
  const { page, fechar } = await abrir({ antes: (p) => p.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => new Promise(() => {});
  }) });
  try {
    await page.click('#interagir');
    const energia = await page.evaluate(async () => {
      const L = window.__livro;
      L.abrirNaHora(5);
      L.interacao.autorizado = true;
      L.interacao.limitar(5, 100);
      L.interacao.medidor.energia = L.interacao.casa.energia * 0.25;
      const energia = L.interacao.medidor.energia;
      await new Promise((resolve) => {
        L.renderer.domElement.addEventListener('webglcontextlost', resolve, { once: true });
        L.renderer.forceContextLoss();
      });
      return energia;
    });
    const durante = await page.evaluate(() => ({
      pendente: window.__livro.interacao.pendente,
      energia: window.__livro.interacao.medidor.energia,
      concluida: window.__livro.interacao.concluidas.has(5),
    }));
    assert.deepEqual(durante, { pendente: true, energia, concluida: false });
    await page.evaluate(() => window.__livro.renderer.forceContextRestore());
    await page.waitForFunction(() => !window.__livro.renderer.getContext().isContextLost());
    assert.equal(await page.evaluate(() => window.__livro.interacao.medidor.energia), energia);
  } finally { await fechar(); }
});

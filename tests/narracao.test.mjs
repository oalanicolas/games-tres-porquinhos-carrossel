// A narração depende de crédito na ElevenLabs. Sem faixas o botão some; com faixas (aqui, um manifesto de teste com música no lugar da voz)
// a voz entra, a música abaixa, sair da cena cancela e a voz nunca dispara a ação nem vira a página.
import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';

test('sem voz gravada, o botão e o crédito não aparecem', async () => {
  const { page, fechar, erros } = await abrir();
  try {
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({ botao: getComputedStyle(document.querySelector('#narrar')).display, credito: document.querySelector('#credito-voz').hidden, tem: window.__livro.audio.temNarracao() }));
    assert.deepEqual(r, { botao: 'none', credito: true, tem: false });
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('com voz gravada: entra, abaixa a música, cancela ao sair e não age sozinha', async () => {
  const { page, fechar, erros } = await abrir();
  try {
    await page.waitForTimeout(500);
    const estado = () => page.evaluate(() => { const L = window.__livro; return { ...L.audio.estado(), indice: L.estado.indice, giro: L.estado.giroAlvo, tocou: [...L.estado.tocouAcao], chama: document.querySelector('#acao').classList.contains('chama') }; });
    // faixas curtas de ambiente fazem o papel da voz, para o teste não depender de crédito
    await page.evaluate(() => { const f = {}; for (let i = 0; i < 8; i++) f[i] = { arquivo: '../sfx/grilos.mp3', duracao: 5, ganho_db: 0 }; window.__livro.audio.faixasVoz = f; });
    await page.click('#acao');
    await page.waitForTimeout(600);
    assert.equal((await estado()).voz, null, 'a voz espera o livro abrir');
    await page.waitForFunction(() => window.__livro.audio.estado().voz?.tempo > 0.3, null, { timeout: 15000 });
    await page.waitForFunction(() => window.__livro.audio.estado().nivelMusica < 0.34, null, { timeout: 5000 });
    await page.waitForFunction(() => window.__livro.audio.estado().nivelAmbiente < 0.56, null, { timeout: 5000 });
    let e = await estado();
    assert.equal(e.voz.cena, 0); assert.equal(e.voz.pausada, false);
    const giroAntes = e.giro;
    await page.click('#proxima');
    await page.waitForTimeout(150);
    assert.equal((await estado()).voz, null, 'virar a página cala a voz');
    await page.waitForFunction(() => window.__livro.audio.estado().voz?.cena === 1, null, { timeout: 6000 });
    assert.equal((await estado()).narrando, true);
    // desligar pelo botão
    await page.evaluate(() => { document.querySelector('#narrar').hidden = false; });
    await page.click('#narrar');
    e = await estado();
    assert.equal(e.narrando, false); assert.equal(e.voz, null);
    await page.waitForFunction(() => window.__livro.audio.estado().nivelMusica > 0.6, null, { timeout: 8000 });
    assert.equal(await page.getAttribute('#narrar', 'aria-pressed'), 'false');
    await page.click('#narrar');
    await page.waitForFunction(() => window.__livro.audio.estado().voz?.cena === 1, null, { timeout: 6000 });
    // deixa acabar: convida, sem agir nem virar
    await page.waitForFunction(() => document.querySelector('#acao').classList.contains('chama'), null, { timeout: 90000 });
    e = await estado();
    assert.equal(e.voz, null); assert.equal(e.indice, 1); assert.deepEqual(e.tocou, []); assert.ok(Math.abs(e.giro - giroAntes - Math.PI / 4) < 0.001, 'só a virada pedida');
    await page.waitForFunction(() => window.__livro.audio.estado().nivelMusica > 0.6, null, { timeout: 8000 });
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

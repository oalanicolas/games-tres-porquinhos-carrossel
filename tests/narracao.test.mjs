// A voz real vem de tools/narracao.py. Sem manifesto o botão some; com ele, as 17 cenas tocam, a música abaixa,
// sair da cena cancela e a voz nunca dispara a ação nem vira a página.
import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';

test('sem voz gravada, o botão não aparece', async () => {
  const { page, fechar, erros } = await abrir({ antes: (p) => p.route('**/src/narracao.json*', (r) => r.fulfill({ contentType: 'text/javascript', body: 'export default { faixas: {} };' })) });
  try {
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({ botao: getComputedStyle(document.querySelector('#narrar')).display, tem: window.__livro.audio.temNarracao() }));
    assert.deepEqual(r, { botao: 'none', tem: false });
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('a voz real existe nas 17 cenas, com botão e o momento de cada ação', async () => {
  const { page, fechar, erros } = await abrir({ narrado: true });
  try {
    await page.waitForTimeout(500);
    const r = await page.evaluate(async () => {
      const a = window.__livro.audio; const f = a.faixasVoz; const cenas = Object.keys(f);
      const medidas = await Promise.all(cenas.map(async (i) => { const x = await fetch(`/narracao/${f[i].arquivo}`); const b = await x.arrayBuffer(); const seg = await new (window.AudioContext)().decodeAudioData(b); return { i, status: x.status, seg: seg.duration, previsto: f[i].duracao, acao: f[i].acao_em }; }));
      return { medidas, botao: getComputedStyle(document.querySelector('#narrar')).display };
    });
    assert.equal(r.medidas.length, 17);
    for (const m of r.medidas) { assert.equal(m.status, 200); assert.ok(Math.abs(m.seg - m.previsto) < 0.5, `cena ${m.i}: ${m.seg} s, previsto ${m.previsto} s`); assert.ok(m.acao > 0 && m.acao < m.seg, `cena ${m.i}: ação em ${m.acao} s`); }
    assert.notEqual(r.botao, 'none');
    await page.click('#acao');
    await page.waitForFunction(() => window.__livro.audio.estado().voz?.tempo > 1, null, { timeout: 15000 });
    const e = await page.evaluate(() => window.__livro.audio.estado());
    assert.equal(e.voz.cena, 0); assert.equal(e.voz.pausada, false); assert.ok(e.dbfs > -60, `saída em ${e.dbfs} dB`);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('a voz entra, a ação acontece na fala, a música abaixa e virar a página ou desligar cala a voz', async () => {
  const { page, fechar, erros } = await abrir({ narrado: true });
  try {
    await page.waitForTimeout(500);
    const estado = () => page.evaluate(() => { const L = window.__livro; return { ...L.audio.estado(), indice: L.estado.indice, tocou: [...L.estado.tocouAcao] }; });
    // o som longo do acervo faz o papel da voz: este percurso testa o player, sem depender da duração de cada cena
    await page.evaluate(() => { const f = {}; for (let i = 0; i < 17; i++) f[i] = { arquivo: '../sfx/grilos.mp3', duracao: 40, ganho_db: 0, acao_em: 1 }; window.__livro.audio.faixasVoz = f; });
    await page.click('#acao');
    await page.waitForTimeout(600);
    assert.equal((await estado()).voz, null, 'a voz espera o livro abrir');
    await page.waitForFunction(() => window.__livro.audio.estado().voz?.tempo > 0.2, null, { timeout: 15000 });
    await page.waitForFunction(() => window.__livro.audio.estado().nivelMusica < 0.34, null, { timeout: 5000 });
    await page.waitForFunction(() => window.__livro.audio.estado().nivelAmbiente < 0.8, null, { timeout: 5000 }); // sob a voz o ambiente cai de 1 para 0,75: ele ficava inaudível (cerca de -40 LUFS)
    await page.waitForFunction(() => window.__livro.estado.tocouAcao.has(0), null, { timeout: 6000 });
    assert.ok((await estado()).voz.tempo >= 1, 'a ação não pode vir antes do trecho da fala');
    await page.click('#proxima');
    await page.waitForTimeout(150);
    assert.equal((await estado()).voz, null, 'virar a página cala a voz');
    await page.waitForFunction(() => window.__livro.audio.estado().voz?.cena === 1, null, { timeout: 6000 });
    await page.click('#narrar');
    let e = await estado();
    assert.equal(e.narrando, false); assert.equal(e.voz, null);
    assert.equal(await page.getAttribute('#narrar', 'aria-pressed'), 'false');
    await page.waitForTimeout(2500);
    assert.equal((await estado()).indice, 1, 'sem o modo narrado, o livro não vira sozinho');
    await page.click('#narrar');
    await page.waitForFunction(() => window.__livro.audio.estado().voz?.cena === 1, null, { timeout: 6000 });
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

// Pedido de Alan: "no modo narrado o livro deve ir sozinho folhando".
// Pedido de Alan: "ao concluir o player automatico deveria fechar o livro".
test('no modo narrado, o livro faz as ações, vira sozinho até a última cena e se fecha ao concluir', async () => {
  const { page, fechar, erros } = await abrir({ narrado: true });
  try {
    await page.waitForTimeout(500);
    await page.evaluate(() => { const f = {}; for (let i = 0; i < 17; i++) f[i] = { arquivo: '../sfx/flap1.mp3', duracao: 1, ganho_db: 0, acao_em: null }; window.__livro.audio.faixasVoz = f; window.__visitas = []; setInterval(() => { const i = window.__livro.estado.indice; if (window.__visitas.at(-1) !== i) window.__visitas.push(i); }, 100); });
    await page.click('#acao');
    await page.waitForFunction(() => { const e = window.__livro.estado; window.__tocouTudo = (e.tocouAcao.size === 17) || window.__tocouTudo; if (e.modo === 'fechando') window.__tituloNoFechar = Math.max(window.__tituloNoFechar ?? 0, +getComputedStyle(document.getElementById('abertura')).opacity); return e.modo === 'capa'; }, null, { timeout: 240000, polling: 50 });
    const r = await page.evaluate(() => ({ visitas: window.__visitas, tocouTudo: window.__tocouTudo, depois: window.__livro.estado.tocouAcao.size, indice: window.__livro.estado.indice, aberto: window.__livro.estado.tAbrir, voz: window.__livro.audio.estado().voz }));
    assert.deepEqual(r.visitas, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, -1], 'as dezessete cenas em ordem e depois a capa');
    assert.equal(r.tocouTudo, true, 'as dezessete cenas atuaram');
    assert.equal(r.indice, -1, 'volta para a capa');
    assert.ok(await page.evaluate(() => window.__tituloNoFechar) < 0.05, 'o título da capa não cobre o livro enquanto ele fecha');
    assert.equal(r.aberto, 0, 'o livro está fechado');
    assert.equal(r.depois, 0, 'pronto para ser lido de novo');
    assert.ok(!r.voz, 'sem voz depois de fechar');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

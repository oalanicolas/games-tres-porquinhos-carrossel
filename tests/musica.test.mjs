// A música muda com a história: faixa certa por cena, som saindo de verdade, troca no tchibum e laços de ambiente sem emenda.
import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';

// Migrada das 11 cenas antigas para as 17, sem mudar a asserção: as antigas mantêm a faixa, e cada cena nova herda a da cena que ela prepara.
const ESPERADA = ['partida', 'obra', 'obra', 'obra', 'lobo-chega', 'lobo-chega', 'lobo-insiste', 'lobo-insiste', 'lobo-teima', 'lobo-teima', 'noite', 'noite', 'noite', 'fuga', 'fuga', 'festa', 'era-uma-vez'];
const som = (page) => page.evaluate(() => window.__livro.audio.estado());
const espera = (page, ms) => page.waitForTimeout(ms);

test('faixa certa em 17 de 17 cenas, avançando e com sinal na saída', async () => {
  const { page, erros, fechar } = await abrir();
  try {
    await page.keyboard.press('Shift');
    await page.waitForFunction(() => { const e = window.__livro.audio.estado(); return e.camas === 5 && e.efeitos === 58; }, null, { timeout: 30000 });
    await espera(page, 1800);
    const capa = await som(page);
    assert.equal(capa.trilha, 'era-uma-vez'); assert.equal(capa.contexto, 'running'); assert.ok(capa.tempo > 0, 'a música da capa não andou');
    await page.evaluate(() => window.__livro.abrirNaHora(0));
    let certas = 0;
    for (let i = 0; i < 17; i++) {
      await page.evaluate((i) => window.__livro.irPara(i), i);
      await espera(page, 2300);
      const a = await som(page); await espera(page, 500); const b = await som(page);
      assert.equal(b.trilha, ESPERADA[i], `cena ${i}`);
      assert.ok(b.tempo > a.tempo, `música parada na cena ${i}`);
      assert.ok(b.dbfs > -60, `silêncio na cena ${i}: ${b.dbfs} dBFS`);
      certas++;
    }
    assert.equal(certas, 17);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('o tchibum troca a música, repetir volta ao início e sair e voltar também', async () => {
  const { page, fechar } = await abrir();
  try {
    await page.keyboard.press('Shift');
    await page.evaluate(() => window.__livro.abrirNaHora(12));
    await espera(page, 400);
    assert.equal((await som(page)).trilha, 'noite');
    await page.evaluate(() => window.__livro.agir());
    await page.waitForFunction(() => window.__livro.audio.estado().trilha === 'fuga', null, { timeout: 15000 });
    await page.waitForFunction(() => { const l = window.__livro.cenas[12].linha; return l.t >= l.duration - 0.01; }, null, { timeout: 20000 });
    await espera(page, 300);
    assert.equal((await som(page)).trilha, 'fuga', 'o fim da ação não pode desfazer a troca');
    await page.evaluate(() => window.__livro.agir());
    await espera(page, 200);
    assert.equal((await som(page)).trilha, 'noite');
    await page.evaluate(() => window.__livro.irPara(15)); await espera(page, 200);
    assert.equal((await som(page)).trilha, 'festa');
    await page.evaluate(() => window.__livro.irPara(12)); await espera(page, 200);
    assert.equal((await som(page)).trilha, 'noite');
  } finally { await fechar(); }
});

test('o botão de som silencia tudo', async () => {
  const { page, fechar } = await abrir();
  try {
    await page.keyboard.press('Shift');
    await espera(page, 1500);
    assert.ok((await som(page)).dbfs > -60);
    await page.click('#som'); await espera(page, 500);
    assert.ok((await som(page)).dbfs < -80, 'ainda há som com o botão desligado');
    await page.click('#som'); await espera(page, 600);
    assert.ok((await som(page)).dbfs > -60);
  } finally { await fechar(); }
});

test('os 5 laços de ambiente emendam sem salto', async () => {
  const { page, fechar } = await abrir();
  try {
    const r = await page.evaluate(async () => {
      const sons = await (await fetch('/src/sons.json')).json();
      const ctx = new OfflineAudioContext(2, 44100, 44100); const saida = [];
      for (const n of sons.ambientes) {
        const b = await ctx.decodeAudioData(await (await fetch(`/sfx/${n}.mp3`)).arrayBuffer());
        const d = b.getChannelData(0); const sr = b.sampleRate;
        const ini = Math.round(sons.pad * sr); const fim = Math.round((sons.pad + sons.lacos[n]) * sr);
        const passos = []; for (let i = 1; i < d.length; i += 7) passos.push(Math.abs(d[i] - d[i - 1])); passos.sort((x, y) => x - y);
        const janela = Math.round(0.05 * sr);
        const rms = (a, z) => { let s = 0; for (let i = a; i < z; i++) s += d[i] * d[i]; return Math.sqrt(s / (z - a)) + 1e-9; };
        saida.push({ nome: n, duracao: b.duration, lacos: sons.lacos[n], salto: Math.abs(d[ini] - d[fim - 1]), p99: passos[Math.floor(passos.length * 0.99)], energiaDb: 20 * Math.log10(rms(fim - janela, fim) / rms(ini, ini + janela)) });
      }
      return saida;
    });
    console.log(JSON.stringify(r));
    assert.equal(r.length, 5);
    for (const a of r) {
      assert.ok(a.duracao >= a.lacos + 0.15, `${a.nome} sem sobra para o laço`);
      assert.ok(a.salto <= a.p99 * 4, `${a.nome}: salto ${a.salto} contra p99 ${a.p99}`);
      assert.ok(Math.abs(a.energiaDb) < 9, `${a.nome}: energia muda ${a.energiaDb} dB na emenda`);
    }
  } finally { await fechar(); }
});

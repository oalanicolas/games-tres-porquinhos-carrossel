import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { abrir } from './_apoio.mjs';

test('cada voz usa o hash do MP3 no endereço para não repetir nomes antigos do cache', () => {
  const { faixas } = JSON.parse(readFileSync(new URL('../src/narracao.json', import.meta.url)));
  for (const faixa of Object.values(faixas)) {
    const url = new URL(faixa.arquivo, 'https://livro.test/narracao/');
    const mp3 = readFileSync(new URL(`../public${url.pathname}`, import.meta.url));
    assert.equal(url.searchParams.get('v'), createHash('sha256').update(mp3).digest('hex').slice(0, 16), faixa.arquivo);
  }
});

test('a próxima frase substitui o balão anterior da mesma personagem', async () => {
  const { page, fechar } = await abrir();
  try {
    const baloes = await page.evaluate(() => {
      const L = window.__livro;
      L.cenaEm(0, 0);
      L.audio.faixasVoz[0].falas = [
        { quem: ['mae'], texto: 'Chegou a hora, meus filhos.', de: 0, ate: 1 },
        { quem: ['mae'], texto: 'Cada um vai construir a sua casa.', de: 1.2, ate: 3 },
      ];
      L.audio.tempoVoz = () => 1.25;
      L.audio.nivelVoz = () => 0.5;
      L.atuacao.quadro(0, 1.25);
      return L.atuacao.medir();
    });
    assert.equal(baloes.length, 1, 'um único balão por personagem na troca de frase');
    assert.equal(baloes[0].texto, 'Cada um vai construir a sua casa.');
  } finally { await fechar(); }
});

test('fim da voz durante a abertura não perde a virada automática', async () => {
  const { page, fechar } = await abrir({ narrado: true });
  try {
    await page.click('#acao');
    await page.evaluate(() => {
      const L = window.__livro;
      L.audio._pararVoz();
      L.sequencia(0.99);
      L.leitura.segue = false;
      L.audio.aoFimDaVoz(0);
      L.liberar();
    });
    await page.waitForFunction(() => window.__livro.estado.indice === 1, null, { timeout: 6000 });
  } finally { await fechar(); }
});

test('voz terminada antes do primeiro quadro não prende o relógio da história', async () => {
  const { page, fechar } = await abrir({ narrado: true });
  try {
    await page.click('#acao');
    await page.evaluate(() => {
      const L = window.__livro;
      L.audio._pararVoz();
      L.abrirNaHora(0);
      Object.assign(L.leitura, { comecou: false, relogio: 0, segue: true });
      L.audio.aoFimDaVoz(0);
    });
    await page.waitForFunction(() => window.__livro.estado.indice === 1, null, { timeout: 6000 });
  } finally { await fechar(); }
});

test('toque cancelado libera o livro e a próxima página automática', async () => {
  const { page, fechar } = await abrir({ narrado: true });
  try {
    await page.click('#acao');
    await page.evaluate(() => {
      const L = window.__livro;
      L.audio._pararVoz();
      L.abrirNaHora(0);
      L.leitura.segue = false;
    });
    await page.mouse.move(900, 200);
    await page.mouse.down();
    await page.dispatchEvent('#palco', 'pointercancel', { pointerId: 1 });
    assert.equal(await page.evaluate(() => window.__livro.estado.arrastando), false);
    await page.evaluate(() => window.__livro.audio.aoFimDaVoz(0));
    await page.waitForFunction(() => window.__livro.estado.indice === 1, null, { timeout: 6000 });
  } finally { await fechar(); }
});

test('três falas simultâneas não se sobrepõem nem trocam de altura ao gesticular', async () => {
  const { page, fechar } = await abrir({ largura: 844, altura: 390 });
  try {
    const r = await page.evaluate(async () => {
      const L = window.__livro;
      L.cenaEm(4, 0);
      const texto = 'Não, não e não!';
      const pedidos = ['pipo', 'tico', 'bento'].map((quem, k) => {
        const cabeca = L.cenas[4].atores[quem].cabeca.clone(false);
        const pos = L.camera.position.clone().set((k - 1) * 0.005, 0.5, 0).unproject(L.camera);
        cabeca.position.copy(pos); cabeca.position.y -= 0.56;
        return { chave: quem, quem, texto, ator: { cabeca, boca: {} } };
      });
      L.atuacao._desenhar(pedidos);
      const antes = L.atuacao.medir();
      pedidos[0].ator.cabeca.position.x += 0.1;
      pedidos[2].ator.cabeca.position.x -= 0.1;
      L.atuacao._desenhar(pedidos);
      return { antes, depois: L.atuacao.medir() };
    });
    for (const baloes of [r.antes, r.depois]) for (let i = 0; i < baloes.length; i++) {
      const a = baloes[i];
      assert.ok(a.y >= 10 && a.y + a.h <= 380, JSON.stringify(a));
      for (const b of baloes.slice(i + 1)) assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `balões sobrepostos: ${JSON.stringify([a, b])}`);
    }
    for (const a of r.antes) assert.ok(Math.abs(a.y - r.depois.find((b) => b.quem === a.quem).y) < 10, `balão de ${a.quem} trocou de altura`);
  } finally { await fechar(); }
});

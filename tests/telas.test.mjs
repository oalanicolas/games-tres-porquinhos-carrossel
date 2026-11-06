// Defeitos vistos no celular emulado: livro apagado pela névoa, crédito sobre o título, barra cobrindo o livro em paisagem.
import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';

const sobrepoe = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

for (const [nome, largura, altura] of [['celular em pé', 390, 844], ['celular pequeno', 360, 640], ['celular deitado', 844, 390], ['desktop', 1440, 870]]) {
  test(`${nome}: livro nítido e textos sem sobreposição`, async () => {
    const { page, fechar } = await abrir({ largura, altura });
    try {
      await page.waitForTimeout(900);
      const r = await page.evaluate(() => {
        const L = window.__livro; const caixa = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().toJSON() : null; };
        return {
          rolagem: document.documentElement.scrollWidth - innerWidth,
          distancia: L.camera.position.length(), neblina: L.scene.fog.near,
          h1: caixa('.abertura h1'), texto: caixa('.abertura p'), barra: caixa('#barra'), credito: caixa('.credito-musica'), assinatura: caixa('.assinatura:not(.credito-musica)'),
          titulo: document.querySelector('.abertura h1').innerText.replace(/\s+/g, ' ').trim(),
        };
      });
      assert.equal(r.rolagem, 0);
      assert.equal(r.titulo, 'Não, não e não!');
      assert.ok(r.neblina >= r.distancia - 1, `névoa em ${r.neblina} com a câmera a ${r.distancia}`);
      for (const [a, b] of [['credito', 'h1'], ['credito', 'texto'], ['credito', 'barra'], ['assinatura', 'barra'], ['assinatura', 'credito']]) assert.ok(!sobrepoe(r[a], r[b]), `${a} sobre ${b}`);
      if (altura < 500) assert.ok(r.barra.height <= 60, `barra com ${r.barra.height}px numa tela de ${altura}px`);
    } finally { await fechar(); }
  });
}

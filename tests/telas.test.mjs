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
      // Defeito devolvido por Alan: "a página deve abrir mais para ficar mais fácil de ler".
      const leitura = await page.evaluate(async () => {
        const L = window.__livro; L.cenaEm(2, 0);
        const espera = () => new Promise((f) => setTimeout(f, 250));
        const larguraTexto = () => {
          const p = L.livro.paredes[2]; const a = p.angulo + L.estado.giro; const v = L.camera.position.clone();
          const y = 2.0; const nx = (x, z) => v.set(x, y, z).project(L.camera).x;
          const ponta = nx(Math.cos(a) * 3.05, Math.sin(a) * 3.05);
          return { largura: Math.abs(ponta - nx(0, 0)) * innerWidth / 2, ponta };
        };
        await espera(); const aberta = larguraTexto();
        const alvo = L.livro.larguraFoco; L.livro.larguraFoco = Math.PI / 4;
        L.cenaEm(2, 0); await espera(); const antiga = larguraTexto();
        L.livro.larguraFoco = alvo; L.liberar();
        return { aberta, antiga };
      });
      const minimo = largura > altura ? 1.5 : 1.2;
      assert.ok(leitura.aberta.largura >= leitura.antiga.largura * minimo, `página com ${leitura.aberta.largura.toFixed(0)}px, antes ${leitura.antiga.largura.toFixed(0)}px`);
      assert.ok(Math.abs(leitura.aberta.ponta) <= 1.02, `a ponta da parede de texto sai da tela (${leitura.aberta.ponta.toFixed(3)})`);
      // A página mais aberta passou por trás do crédito: a licença CC BY precisa continuar legível na cena final.
      const credito = await page.evaluate(async () => {
        window.__livro.abrirNaHora(7); await new Promise((f) => setTimeout(f, 700));
        const e = document.querySelector('.credito-musica'); const c = getComputedStyle(e); const q = e.getBoundingClientRect();
        return { display: c.display, opacidade: +c.opacity, fundo: +(c.backgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') ?? 1), dentro: q.left >= 0 && q.right <= innerWidth && q.top >= 0 && q.bottom <= innerHeight, barra: document.querySelector('#barra').getBoundingClientRect().toJSON(), q: q.toJSON() };
      });
      assert.notEqual(credito.display, 'none');
      assert.ok(credito.opacidade === 1 && credito.fundo >= 0.6, `crédito com opacidade ${credito.opacidade} e fundo ${credito.fundo}`);
      assert.ok(credito.dentro, 'crédito fora da tela');
      assert.ok(!sobrepoe(credito.q, credito.barra), 'crédito sob a barra');
      console.log(`${nome}: página de texto ${leitura.antiga.largura.toFixed(0)}px -> ${leitura.aberta.largura.toFixed(0)}px`);
    } finally { await fechar(); }
  });
}

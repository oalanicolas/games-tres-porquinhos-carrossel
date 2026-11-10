import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir } from './_apoio.mjs';

test('narração contínua: a autorização do player vale para as páginas seguintes', async () => {
  const { page, fechar } = await abrir({ narrado: true, antes: (p) => p.addInitScript(() => {
    const tocar = HTMLMediaElement.prototype.play;
    let autorizado;
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes('/narracao/cena-')) {
        autorizado ??= this;
        if (this !== autorizado) return Promise.reject(new DOMException('Novo player sem gesto', 'NotAllowedError'));
      }
      return tocar.call(this);
    };
  }) });
  try {
    await page.click('#acao');
    await page.waitForFunction(() => window.__livro.audio.tempoVoz(0) > 0.1);
    for (let i = 1; i < 4; i++) {
      await page.click('#proxima');
      await page.waitForFunction((i) => window.__livro.audio.tempoVoz(i) > 0.1, i, { timeout: 7000 });
      assert.equal(await page.getAttribute('#narrar', 'aria-pressed'), 'true');
    }
  } finally { await fechar(); }
});

test('narração contínua: pausa inesperada retoma sem apertar iniciar', async () => {
  const { page, fechar } = await abrir({ narrado: true });
  try {
    await page.click('#acao');
    await page.waitForFunction(() => window.__livro.audio.tempoVoz(0) > 0.2);
    const tempo = await page.evaluate(() => {
      const v = window.__livro.audio.voz;
      v.el.pause();
      return v.el.currentTime;
    });
    await page.waitForFunction((t) => window.__livro.audio.tempoVoz(0) > t + 0.2, tempo, { timeout: 7000 });
    const antesDeOcultar = await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__oculto });
      window.__oculto = true;
      document.dispatchEvent(new Event('visibilitychange'));
      return window.__livro.audio.tempoVoz(0);
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => { window.__oculto = false; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForFunction((t) => window.__livro.audio.tempoVoz(0) > t + 0.2, antesDeOcultar);
    assert.equal(await page.getAttribute('#narrar', 'aria-pressed'), 'true');
  } finally { await fechar(); }
});

test('narração contínua: falha de rede na página seguinte recupera a voz', async () => {
  let pedidos = 0;
  const { page, fechar } = await abrir({ narrado: true, antes: (p) => p.route('**/narracao/cena-1.mp3*', (r) => {
    pedidos++;
    return pedidos <= 2 ? r.fulfill({ status: 503, body: 'Indisponível temporariamente' }) : r.continue();
  }) });
  try {
    await page.click('#acao');
    await page.waitForFunction(() => window.__livro.audio.tempoVoz(0) > 0.2);
    await page.click('#proxima');
    await page.waitForFunction(() => window.__livro.audio.tempoVoz(1) > 0.2, null, { timeout: 15000 });
    assert.ok(pedidos >= 3);
    assert.equal(await page.getAttribute('#narrar', 'aria-pressed'), 'true');
  } finally { await fechar(); }
});

test('narração contínua: falha transitória e áudio suspenso retomam; desligar manualmente prevalece', async () => {
  const { page, fechar } = await abrir({ narrado: true });
  try {
    await page.click('#acao');
    await page.waitForFunction(() => window.__livro.audio.tempoVoz(0) > 0.2);
    await page.evaluate(() => {
      const tocar = HTMLMediaElement.prototype.play;
      window.__falhouVoz = false;
      HTMLMediaElement.prototype.play = function () {
        if (this.src.includes('/narracao/cena-1.') && !window.__falhouVoz) {
          window.__falhouVoz = true;
          return Promise.reject(new DOMException('Interrupção transitória', 'AbortError'));
        }
        return tocar.call(this);
      };
    });
    await page.click('#proxima');
    await page.waitForFunction(() => window.__falhouVoz && window.__livro.audio.tempoVoz(1) > 0.2, null, { timeout: 7000 });
    const tempo = await page.evaluate(async () => {
      const a = window.__livro.audio;
      await a.ctx.suspend();
      return a.tempoVoz(1);
    });
    await page.waitForFunction((t) => window.__livro.audio.ctx.state === 'running' && window.__livro.audio.tempoVoz(1) > t + 0.2, tempo);
    await page.click('#narrar');
    await page.waitForTimeout(1800);
    assert.equal(await page.evaluate(() => window.__livro.audio.narrando), false);
    assert.equal(await page.evaluate(() => window.__livro.audio.voz), null);
  } finally { await fechar(); }
});

test('narração contínua: rejeição antiga na saída do sopro não cancela a página seguinte', async () => {
  const { page, fechar } = await abrir({ narrado: true });
  try {
    await page.click('#acao');
    await page.waitForFunction(() => window.__livro.audio.tempoVoz(0) > 0.2);
    await page.evaluate(() => {
      const a = window.__livro.audio;
      const el = a.voz.el;
      const tocar = el.play.bind(el);
      a.pausarInteracao(true);
      el.play = () => {
        el.play = tocar;
        return new Promise((_, reject) => { window.__rejeitarVozAntiga = () => reject(new DOMException('Cena anterior', 'AbortError')); });
      };
      a.pausarInteracao(false);
    });
    await page.click('#proxima');
    await page.waitForFunction(() => window.__livro.audio.tempoVoz(1) > 0.2);
    await page.evaluate(() => window.__rejeitarVozAntiga());
    await page.waitForFunction(() => window.__livro.audio.tempoVoz(1) > 0.5);
    assert.equal(await page.evaluate(() => window.__livro.audio.narrando), true);
  } finally { await fechar(); }
});

test('narração contínua: leitura mantém a voz e só o botão de narração a desliga', async () => {
  const { page, fechar } = await abrir({ narrado: true, largura: 320, altura: 568 });
  try {
    await page.click('#acao');
    await page.waitForFunction(() => window.__livro.audio.tempoVoz(0) > 0.2);
    await page.click('#ler');
    const tempo = await page.evaluate(() => window.__livro.audio.tempoVoz(0));
    assert.equal(await page.getAttribute('#narrar', 'aria-pressed'), 'true');
    await page.waitForFunction((t) => window.__livro.audio.tempoVoz(0) > t + 0.3, tempo);
    await page.click('#proxima');
    await page.waitForFunction(() => window.__livro.audio.tempoVoz(1) > 0.2);
    await page.click('#narrar');
    assert.equal(await page.getAttribute('#narrar', 'aria-pressed'), 'false');
    await page.click('#ler');
    await page.waitForTimeout(1800);
    assert.equal(await page.evaluate(() => window.__livro.audio.narrando), false);
  } finally { await fechar(); }
});

// Devolvido por Alan em 10/11/2026: "a narração às vezes para, ela não pode parar a não ser que seja desligada".
// Com o Chrome atrás de outra janela a página fica escondida e deixa de desenhar quadros; a voz tem de seguir e virar a página sozinha.
test('narração contínua: página escondida e sem quadros segue na voz e vira a página', async () => {
  const { page, fechar } = await abrir({ narrado: true });
  try {
    await page.click('#acao');
    await page.waitForFunction(() => window.__livro.audio.tempoVoz(0) > 0.2 && window.__livro.estado.modo === 'aberto', null, { timeout: 20000 });
    const antes = await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      window.requestAnimationFrame = () => 0; // página escondida: o navegador não chama mais o laço
      return window.__livro.audio.tempoVoz(0);
    });
    await page.waitForFunction((t) => window.__livro.audio.tempoVoz(0) > t + 0.8, antes, { timeout: 8000 });
    assert.equal(await page.evaluate(() => window.__livro.audio.voz.el.paused), false, 'a voz não pausa com a página escondida');
    await page.waitForFunction(() => window.__livro.estado.indice === 1 && window.__livro.audio.tempoVoz(1) > 0.2, null, { timeout: 90000, polling: 250 });
    assert.equal(await page.getAttribute('#narrar', 'aria-pressed'), 'true');
  } finally { await fechar(); }
});

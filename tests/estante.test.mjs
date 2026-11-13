// A estante liga os livros da coleção: na capa fechada aparecem os outros livros, nunca o próprio.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { abrir } from './_apoio.mjs';

const lista = JSON.parse(readFileSync(new URL('../public/livros.json', import.meta.url)));
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const eu = html.match(/id="estante" data-livro="([^"]+)"/)[1];

test('estante: a lista tem este livro e ao menos outro, com capa no pacote e endereço https', () => {
  assert.ok(lista.some((l) => l.id === eu), `${eu} fora da lista`);
  assert.ok(lista.length >= 2);
  for (const l of lista) {
    assert.match(l.url, /^https:\/\/[a-z0-9.-]+\/$/, l.id);
    assert.ok(existsSync(new URL(`../public/${l.capa}`, import.meta.url)), l.capa);
  }
});

for (const [largura, altura] of [[1280, 800], [390, 844], [844, 390]]) {
  test(`estante em ${largura}x${altura}: mostra os outros livros na capa, dentro da tela, com alvo de 44 px`, async () => {
    const { page, fechar, erros } = await abrir({ largura, altura });
    try {
      await page.waitForSelector('#estante a');
      const r = await page.evaluate(() => [...document.querySelectorAll('#estante a')].map((a) => { const q = a.getBoundingClientRect(); const b = document.getElementById('barra').getBoundingClientRect(); const img = a.querySelector('img');
        return { id: a.dataset.livro, href: a.href, titulo: a.querySelector('strong').textContent, x: q.left, y: q.top, d: q.right, b: q.bottom, barra: b.top, imagem: img.complete && img.naturalWidth > 0 }; }));
      const outros = lista.filter((l) => l.id !== eu);
      assert.deepEqual(r.map((x) => x.id), outros.map((l) => l.id), 'só os outros livros');
      for (const [k, x] of r.entries()) {
        assert.equal(x.href, outros[k].url); assert.equal(x.titulo, outros[k].titulo); assert.ok(x.imagem, 'capa carregada');
        assert.ok(x.b - x.y >= 44 && x.d - x.x >= 44, 'alvo de toque menor que 44 px');
        assert.ok(x.x >= 0 && x.y >= 0 && x.d <= largura && x.b <= x.barra, `cartão fora da tela ou sobre a barra: ${JSON.stringify(x)}`);
      }
      assert.equal(await page.locator('#estante-botao').isVisible(), true);
      assert.deepEqual(erros, []);
    } finally { await fechar(); }
  });
}

test('estante: o botão da barra fecha o livro, e o clique no cartão registra o evento', async () => {
  const { page, fechar, erros } = await abrir();
  try {
    await page.waitForSelector('#estante a');
    await page.evaluate(() => window.__livro.abrirNaHora(3));
    assert.equal(await page.evaluate(() => document.getElementById('abertura').inert), true, 'com o livro aberto a estante não recebe toque');
    await page.click('#estante-botao');
    await page.waitForFunction(() => window.__livro.estado.modo === 'capa', null, { timeout: 20000 });
    await page.waitForFunction(() => document.activeElement?.closest('#estante') !== null, null, { timeout: 5000 });
    const evento = await page.evaluate(() => {
      const a = document.querySelector('#estante a'); a.addEventListener('click', (e) => e.preventDefault()); a.click();
      return window.dataLayer.filter((d) => d && d.event === 'estante_clique').at(-1);
    });
    assert.equal(evento.livro_origem, eu); assert.equal(evento.livro_destino, lista.find((l) => l.id !== eu).id);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('estante: sem a lista, nem estante nem botão aparecem, e o livro abre do mesmo jeito', async () => {
  const { page, fechar } = await abrir({ antes: (p) => p.route('**/livros.json', (r) => r.fulfill({ status: 404, body: '' })) });
  try {
    await page.waitForTimeout(600);
    assert.equal(await page.locator('#estante').isVisible(), false);
    assert.equal(await page.locator('#estante-botao').isVisible(), false);
    await page.evaluate(() => window.__livro.abrirNaHora(0));
    assert.equal(await page.evaluate(() => window.__livro.estado.modo), 'aberto');
  } finally { await fechar(); }
});

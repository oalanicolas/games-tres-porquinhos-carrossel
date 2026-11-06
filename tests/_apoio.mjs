// Sobe o próprio Vite numa porta livre e abre o Chrome real sem tomar o foco. Nenhum teste depende de servidor de outra sessão.
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

// O modo narrado conduz o livro sozinho; os testes que dirigem as cenas à mão o desligam, e os da narração pedem `narrado`.
export async function abrir({ largura = 1280, altura = 800, url, antes, narrado = false } = {}) {
  let servidor = null; let endereco = url;
  if (!endereco) {
    servidor = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: false }, logLevel: 'silent' });
    await servidor.listen();
    endereco = `http://127.0.0.1:${servidor.httpServer.address().port}/`;
  }
  const navegador = await chromium.launch({ channel: 'chrome', headless: !process.env.QA_HEADED, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  const page = await navegador.newPage({ viewport: { width: largura, height: altura } });
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  if (!narrado) await page.addInitScript(() => localStorage.setItem('porquinhos-narracao', 'nao'));
  await antes?.(page);
  await page.goto(endereco);
  await page.waitForFunction(() => window.__livro, null, { timeout: 90000 });
  return { page, erros, endereco, fechar: async () => { await navegador.close(); await servidor?.close(); } };
}

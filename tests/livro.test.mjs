// Nenhuma peça fura a parede e o percurso real pela interface termina as 11 cenas sem erro.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'vite';
const roda = promisify(execFile);

test('nenhuma peça fora da cunha e 11 de 11 cenas pelo percurso real', async () => {
  const servidor = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: false }, logLevel: 'silent' });
  await servidor.listen();
  const endereco = `http://127.0.0.1:${servidor.httpServer.address().port}/`;
  const saida = (mkdirSync('output', { recursive: true }), mkdtempSync('output/teste-'));
  try {
    const p = await roda('node', ['tests/paredes.mjs'], { env: { ...process.env, LIVRO_URL: endereco } }).catch((e) => e);
    console.log(p.stdout.trim());
    assert.ok(/fora 0\b/.test(p.stdout), p.stdout);
    await roda('node', ['tests/jornada.mjs'], { env: { ...process.env, LIVRO_URL: endereco, SAIDA: saida }, maxBuffer: 1 << 24 });
    const r = JSON.parse(readFileSync(`${saida}/relatorio.json`));
    assert.equal(r.cenas.length, 11);
    assert.equal(r.cenas.filter((c) => c.terminou && c.acaoDepois === 'De novo').length, 11);
    assert.deepEqual(r.erros, []);
    assert.equal(r.somCapa.trilha, 'era-uma-vez');
  } finally { rmSync(saida, { recursive: true, force: true }); await servidor.close(); }
});

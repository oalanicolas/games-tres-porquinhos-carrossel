// Nenhuma peça fura a parede e o percurso real pela interface termina as 8 cenas sem erro.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { abrir } from './_apoio.mjs';
const roda = promisify(execFile);

test('nenhuma peça fora da cunha e 8 de 8 cenas pelo percurso real', async () => {
  const { endereco, fechar } = await abrir();
  const saida = (mkdirSync('output', { recursive: true }), mkdtempSync('output/teste-'));
  try {
    const p = await roda('node', ['tests/paredes.mjs'], { env: { ...process.env, LIVRO_URL: endereco } }).catch((e) => e);
    console.log(p.stdout.trim());
    assert.ok(/fora 0\b/.test(p.stdout), p.stdout);
    await roda('node', ['tests/jornada.mjs'], { env: { ...process.env, LIVRO_URL: endereco, SAIDA: saida }, maxBuffer: 1 << 24 });
    const r = JSON.parse(readFileSync(`${saida}/relatorio.json`));
    assert.equal(r.cenas.length, 8);
    assert.equal(r.cenas.filter((c) => c.terminou && c.acaoDepois === 'De novo').length, 8);
    assert.deepEqual(r.erros, []);
    assert.equal(r.somCapa.trilha, 'caixinha');
  } finally { rmSync(saida, { recursive: true, force: true }); await fechar(); }
});

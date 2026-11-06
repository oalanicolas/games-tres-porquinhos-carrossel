// Percurso do modo narrado com as faixas reais: `LIVRO_URL=<url> node tests/narrado-real.mjs`. Leva cerca de 4 min e grava output/narrado-real.json.
import { writeFileSync, mkdirSync } from 'node:fs';
import { abrir } from './_apoio.mjs';

const { page, fechar, erros } = await abrir({ narrado: true, url: process.env.LIVRO_URL });
page.on('crash', () => console.error('página travou', new Date().toISOString()));
page.on('close', () => console.error('página fechada', new Date().toISOString()));
try {
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const L = window.__livro; const a = L.audio; window.__marcas = [];
    const marca = (tipo, i, extra) => window.__marcas.push({ tipo, i, t: performance.now() / 1000, voz: a.estado().voz?.tempo ?? null, musica: a.estado().trilha, ...extra });
    let ultimo = L.estado.indice; const vistos = new Set();
    setInterval(() => {
      if (L.estado.indice !== ultimo) { ultimo = L.estado.indice; marca('virou', ultimo); }
      for (const i of L.estado.tocouAcao) if (!vistos.has(i)) { vistos.add(i); marca('acao', i); }
      const v = a.estado().voz; if (v && !vistos.has(`v${v.cena}`)) { vistos.add(`v${v.cena}`); marca('voz', v.cena); }
    }, 50);
    // A cada quadro, junto da tela: relógio da cena contra o da voz e o que os balões mostram naquele segundo da fala.
    window.__baloes = []; window.__relogio = {}; window.__fps = { quadros: 0, segundos: 0, pior: 0 };
    let antes = performance.now();
    const amostra = (agora) => {
      const dt = agora - antes; antes = agora; if (L.estado.modo === 'aberto') { window.__fps.quadros++; window.__fps.segundos += dt / 1000; window.__fps.pior = Math.max(window.__fps.pior, dt); }
      const i = L.estado.indice; const t = i >= 0 ? a.tempoVoz(i) : null;
      if (t != null) {
        for (const b of L.atuacao.medir()) window.__baloes.push({ i, t, quem: b.quem, texto: b.texto });
        if (L.leitura.i === i && L.leitura.segue) (window.__relogio[i] ??= []).push(Math.abs(L.cenas[i].linha.t - t));
      }
      requestAnimationFrame(amostra);
    };
    requestAnimationFrame(amostra);
  });
  await page.click('#acao');
  await page.waitForFunction(() => window.__livro.estado.modo === 'capa' && window.__marcas.some((m) => m.tipo === 'virou' && m.i === -1), null, { timeout: 420000, polling: 250 });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => ({ marcas: window.__marcas, baloes: window.__baloes, relogio: window.__relogio, modo: window.__livro.estado.modo, indice: window.__livro.estado.indice, voz: window.__livro.audio.estado().voz, faixas: window.__livro.audio.faixasVoz, restante: document.querySelectorAll('.balao').length, fps: window.__fps }));
  const linhas = []; const defeitos = [];
  const total = Object.keys(r.faixas).length;
  for (let i = 0; i < total; i++) {
    const f = r.faixas[i];
    const acao = r.marcas.find((m) => m.tipo === 'acao' && m.i === i); const voz = r.marcas.find((m) => m.tipo === 'voz' && m.i === i); const virou = r.marcas.find((m) => m.tipo === 'virou' && m.i === (i + 1 < total ? i + 1 : -1));
    const relogio = r.relogio[i] ?? [];
    const erroRelogio = relogio.length ? Math.max(...relogio) : null;
    const baloes = (f.falas ?? []).map((fala) => {
      const vistos = r.baloes.filter((b) => b.i === i && b.texto === fala.texto && b.t >= fala.de - 0.3 && b.t <= fala.ate + 0.6);
      const quem = [...new Set(vistos.map((b) => b.quem))].sort();
      const ok = fala.quem.slice().sort().join() === quem.join() && vistos.length > 0 && Math.abs(Math.min(...vistos.map((b) => b.t)) - fala.de) < 0.3 && Math.max(...vistos.map((b) => b.t)) > fala.ate - 0.3;
      if (!ok) defeitos.push(`cena ${i + 1}: "${fala.texto}" (${fala.de}-${fala.ate}) mostrou ${quem.join() || 'nada'} em ${vistos.length} amostras`);
      return ok;
    });
    if (acao?.voz == null || Math.abs(acao.voz - f.acao_em) > 0.25) defeitos.push(`cena ${i + 1}: ação aos ${acao?.voz} em vez de ${f.acao_em}`);
    if (erroRelogio == null || erroRelogio > 0.12) defeitos.push(`cena ${i + 1}: relógio da cena fora da voz em ${erroRelogio}`);
    linhas.push({ cena: i + 1, previsto: f.acao_em, acao_na_fala: acao?.voz ?? null, relogio_erro_max: erroRelogio == null ? null : +erroRelogio.toFixed(3), baloes: `${baloes.filter(Boolean).length} de ${baloes.length}`, s_ate_virar: virou && voz ? +(virou.t - voz.t).toFixed(1) : null, fala_s: f.duracao, musica: acao?.musica });
  }
  const rel = { linhas, modo_final: r.modo, indice_final: r.indice, voz_final: r.voz, baloes_restantes: r.restante, amostras_de_balao: r.baloes.length, fps: r.fps, defeitos, erros };
  mkdirSync('output', { recursive: true }); writeFileSync('output/narrado-real.json', JSON.stringify(rel, null, 1));
  console.table(linhas); console.log('fim', r.modo, r.indice, 'balões', r.restante, 'erros', erros.length, 'fps', JSON.stringify(r.fps)); console.log(defeitos.join('\n'));
  if (r.modo !== 'capa' || r.indice !== -1 || r.voz || r.restante || erros.length || defeitos.length) { console.error('falhou'); process.exitCode = 1; }
} finally { await fechar(); }

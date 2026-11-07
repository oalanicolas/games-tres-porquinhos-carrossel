// Mede a mixagem real: grava a saída do livro no modo narrado, cena por cena, e também mede o limitador isolado.
// Uso: node tests/mix-medida.mjs [cenas separadas por vírgula]. Grava em output/mix/ (ignorado pelo Git) e imprime JSON.
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { abrir } from './_apoio.mjs';

const lista = (process.argv[2] ?? '2,4,7').split(',').map(Number);
mkdirSync('output/mix', { recursive: true });
const { page, fechar } = await abrir({ narrado: true });

function lufs(arq) {
  const e = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', arq, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const fim = e.slice(e.lastIndexOf('Summary:'));
  return { lufs: Number(/I:\s+(-?[\d.]+) LUFS/.exec(fim)?.[1]), lra: Number(/LRA:\s+(-?[\d.]+) LU/.exec(fim)?.[1]), pico: Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(fim)?.[1]) };
}

try {
  await page.mouse.click(640, 400);
  await page.waitForFunction(() => { const a = window.__livro.audio; return a.ctx && a.buffers.size === 57 && a.camas.size === 5; }, null, { timeout: 90000 });
  // o que o limitador faz com um sinal abaixo do limiar: é só o ganho de compensação da especificação
  const limitador = await page.evaluate(async () => {
    const c = new OfflineAudioContext(1, 44100, 44100); const o = c.createOscillator(); const g = c.createGain(); g.gain.value = 0.1;
    const l = c.createDynamicsCompressor(); l.threshold.value = -2; l.knee.value = 0; l.ratio.value = 20; l.attack.value = 0.002; l.release.value = 0.12;
    o.connect(g); g.connect(l); l.connect(c.destination); o.start();
    const b = await c.startRendering(); const d = b.getChannelData(0).subarray(22050); let p = 0; for (const v of d) p = Math.max(p, Math.abs(v));
    return { entrada_dbfs: -20, saida_dbfs: Number((20 * Math.log10(p)).toFixed(2)) };
  });
  const cenas = {};
  await page.evaluate(() => window.__livro.abrirNaHora(0));
  for (const i of lista) {
    await page.evaluate((i) => { window.__livro.irPara(i); }, i);
    const dur = await page.evaluate((i) => window.__livro.audio.faixasVoz[i].duracao, i);
    const b64 = await page.evaluate(async (ms) => {
      const a = window.__livro.audio; const dest = a.ctx.createMediaStreamDestination(); a.medidor.connect(dest);
      const rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 256000 }); const pedacos = [];
      rec.ondataavailable = (e) => pedacos.push(e.data);
      const pronto = new Promise((ok) => { rec.onstop = ok; });
      rec.start(); await new Promise((ok) => setTimeout(ok, ms)); rec.stop(); await pronto; a.medidor.disconnect(dest);
      const buf = new Uint8Array(await new Blob(pedacos).arrayBuffer()); let s = ''; for (let k = 0; k < buf.length; k += 8192) s += String.fromCharCode(...buf.subarray(k, k + 8192));
      return btoa(s);
    }, Math.min((dur + 3) * 1000, 40000));
    const arq = `output/mix/cena-${i}.webm`; writeFileSync(arq, Buffer.from(b64, 'base64'));
    const efeitos = await page.evaluate((i) => window.__livro.audio.registro.filter((r) => r.cena === i).length, i);
    const redu = await page.evaluate(() => window.__livro.audio.limitador.reduction);
    cenas[i] = { ...lufs(arq), efeitos, reducao_limitador_db: Number(redu.toFixed(2)) };
  }
  console.log(JSON.stringify({ limitador, cenas }, null, 1));
} finally { await fechar(); }

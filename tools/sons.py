#!/usr/bin/env python3
"""Monta os sons do livro a partir de shared/sfx: músicas com os bytes originais, efeitos recortados e nivelados.
Gera public/sfx, os efeitos de src/sons.json (ganhos e licenças) e docs/creditos-sons.md. A música vem de tools/trilha.py. Rode na raiz do módulo."""
import hashlib, json, re, shutil, subprocess, sys
from pathlib import Path

MOD = Path(__file__).resolve().parent.parent
RAIZ = Path(subprocess.check_output(['git', '-C', str(MOD.parent.parent), 'rev-parse', '--show-toplevel'], text=True).strip())
ACERVO = RAIZ / 'shared' / 'sfx'
CAT = {i['id']: i for i in json.loads((ACERVO / 'catalog.json').read_text())['sounds']}

# nome: (id no catálogo, início, duração ou None, alvo em LUFS, filtro extra)
EFEITOS = {
  'flap1': ('paper-flap-1', 0, None, -18, ''), 'flap2': ('paper-flap-2', 0, None, -18, ''),
  'abrir': ('original-owlish-paper-sketchbook-page-flips-1', 0, 3.2, -19, ''),
  'vento': ('thimras-park-park-ambience-wind', 30, 3.2, -16, 'highpass=f=180'),
  'ar': ('original-swish-1', 0, None, -18, ''),
  'inspira': ('original-owlish-sniff', 0, None, -18, ''),
  'palha': ('original-owlish-crumples2', 0, None, -17, ''), 'palha2': ('original-owlish-crumples1', 0, None, -17, ''),
  'pano': ('owlish-more-cloth-01', 0, None, -20, ''),
  'range': ('rubberduck-material-wood-squeak-01', 0, None, -18, ''), 'range2': ('rubberduck-material-wood-squeak-02', 0, None, -18, ''),
  'desaba': ('bart-workshop-workshop-wood-clatter', 0, None, -15, ''), 'tabuas': ('bart-workshop-workshop-wood-on-wood-thuds', 0, 2.6, -18, ''),
  'martelo': ('rubberduck-material-wood-hammer-01', 0, None, -18, ''), 'martelo2': ('rubberduck-material-wood-hammer-02', 0, None, -18, ''),
  'tijolo': ('rubberduck-sfx2-sfx100v2-stones-02', 0, None, -17, ''), 'tijolo2': ('rubberduck-sfx2-sfx100v2-stones-01', 0, None, -17, ''),
  'porco': ('foley-pig-1', 0, None, -18, ''), 'grunhido': ('foley-grunt', 0, None, -18, ''), 'guincho': ('foley-squeal', 0, None, -17, ''),
  # a tomada integral de 23 s: foley-howl-1 e -2 são cortes de 1,6 s dela, em MP3 de 96 kbps
  'uivo1': ('usc-wolf-howls-reverb', 1.2, 5.1, -17, ''), 'uivo2': ('usc-wolf-howls-reverb', 7.2, 4.7, -17, ''),
  'uivo3': ('usc-wolf-howls-reverb', 12.6, 3.9, -17, ''), 'uivo4': ('usc-wolf-howls-reverb', 17.2, 4.0, -17, ''),
  'choro1': ('foley-cry-1', 0, None, -18, ''), 'choro2': ('foley-cry-2', 0, None, -18, ''),
  'engolir': ('foley-engolir', 0, None, -20, ''), 'corvo': ('zeroisnotnull-crow-crow-caw', 0, None, -20, ''),
  # passos: 19 caminhadas eram mudas
  'passo1': ('steps-dirt-1', 0, None, -20, ''), 'passo2': ('steps-dirt-2', 0, None, -20, ''),
  'passo3': ('steps-dirt-3', 0, None, -20, ''), 'passo4': ('steps-dirt-4', 0, None, -20, ''),
  # batida de nós de dedo na madeira, porta fechando e tranca: antes tudo era martelo
  'bate1': ('bart-workshop-workshop-wood-clap', 0, None, -17, ''), 'bate2': ('bart-workshop-workshop-wood-clap-2', 0, None, -17, ''),
  'porta': ('rubberduck-material-wood-close-02', 0, None, -18, ''), 'tranca': ('rubberduck-material-lock-open-01', 0, None, -19, ''),
  # o sopro: ar de verdade, com a inspiração feita do mesmo ar ao contrário
  'sopro': ('rubberduck-sfx2-sfx100v2-air-01', 0, None, -15, ''), 'sopro2': ('rubberduck-sfx2-sfx100v2-air-02', 0, None, -15, ''),
  'puxa': ('rubberduck-sfx2-sfx100v2-air-02', 0, None, -20, 'areverse'),
  'foguete': ('studio-rocket-ignite', 0, None, -17, ''), 'bolhas': ('rubberduck-water-loop-bubbles-02', 0, 3.0, -20, ''),
  'tchibum': ('rubberduck-water-splash-08', 0, None, -14, ''), 'tchibum2': ('rubberduck-water-splash-01', 0, None, -15, ''),
  'caldeirao': ('foley-cauldron', 0, 3.0, -20, ''),
  'chama': ('studio-boom-fuse-1', 0, None, -18, ''), 'lenha': ('bart-workshop-workshop-wood-clap', 0, None, -18, ''),
  'fogos': ('sardin-firecracker-1', 0, None, -22, ''), 'fogos2': ('nenad-distant-explosion', 0, 3.0, -22, ''),
  'viva': ('chardonnet-teens-cheer-2', 0, None, -18, ''), 'risos': ('sardin-children-laughter', 0, None, -18, ''),
  'sino': ('sardin-glockenspiel-slip', 0, 6.0, -22, ''), 'melro': ('tiroir-blackbird-23', 0, None, -22, ''),
}
# ambientes: laço sem emenda, fechado por fusão do fim sobre o começo
AMBIENTES = {
  'passaros': ('thimras-park-park-ambience-birds', 60, 40, -27, ''),
  'brisa': ('thimras-park-park-ambience-wind', 60, 40, -27, 'highpass=f=120'),
  'grilos': ('original-owlish-night-crickets-ambience-on-rural-property', 10, 40, -27, ''),
  'fogo': ('foley-fire', 0, 2.4, -25, ''),
  'fervura': ('original-owlish-kettle-boil', 20, 40, -27, ''),
}
# momento da história: música (bytes originais)
# A trilha vem de tools/trilha.py: Alan recusou as faixas do acervo, que não têm nada de conto infantil.
MUSICAS = {}
ALVO_MUSICA = -22.0
PAD = 0.1

def origem(sid):
    i = CAT[sid]; arq = ACERVO / i['file']
    if hashlib.sha256(arq.read_bytes()).hexdigest() != i['sha256']: sys.exit(f'hash não confere: {sid}')
    return i, arq

def lufs(arq, filtro=''):
    f = (filtro + ',' if filtro else '') + 'ebur128=peak=true'
    e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(arq), '-af', f, '-f', 'null', '-'], capture_output=True, text=True).stderr
    fim = e[e.rindex('Summary:'):]
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', fim).group(1)), float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', fim).group(1))

def efeito(nome, sid, ini, dur, alvo, extra, pasta, laco=False):
    i, arq = origem(sid); saida = pasta / f'{nome}.mp3'
    xf = (2.0 if dur and dur > 8 else 0.6) if laco else 0
    corte = ['-ss', str(ini)] + (['-t', str(dur + xf)] if dur else [])
    base = extra
    l, p = lufs_trecho(arq, ini, dur, base)
    ganho = min(alvo - l, -1.0 - p)
    fs = (base + ',' if base else '') + f'volume={ganho:.2f}dB'
    if laco:
        # Fim fundido sobre o começo; as sobras de PAD s nas pontas protegem o laço do atraso do codificador MP3.
        grafo = (f"[0:a]{fs},aformat=sample_rates=44100:channel_layouts=stereo,asplit[x][y];"
                 f"[x]atrim={xf}:{dur + xf},asetpts=PTS-STARTPTS[a];[y]atrim=0:{xf},asetpts=PTS-STARTPTS[b];"
                 f"[a][b]acrossfade=d={xf}:c1=tri:c2=tri,asplit=3[p][m][q];"
                 f"[p]atrim={dur - PAD}:{dur},asetpts=PTS-STARTPTS[pre];[q]atrim=0:{PAD},asetpts=PTS-STARTPTS[pos];"
                 f"[pre][m][pos]concat=n=3:v=0:a=1[s]")
        cmd = ['ffmpeg', '-y', '-v', 'error'] + corte + ['-i', str(arq), '-filter_complex', grafo, '-map', '[s]', '-c:a', 'libmp3lame', '-q:a', '1', str(saida)]
    else:
        fade = f',afade=t=out:st={max(dur - 0.08, 0)}:d=0.08' if dur else ''
        cmd = ['ffmpeg', '-y', '-v', 'error'] + corte + ['-i', str(arq), '-af', fs + fade, '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '1', str(saida)]
    subprocess.run(cmd, check=True)
    return {'nome': nome, 'id': sid, 'titulo': i['title'], 'autores': i.get('authors'), 'licenca': (i.get('licenses') or [s.get('license') for s in i.get('sources', [])])[0], 'url': (i.get('sources') or [{}])[0].get('url'), 'trecho': [ini, dur], 'lufs_origem': l, 'ganho_db': round(ganho, 2), 'bytes': saida.stat().st_size}

def lufs_trecho(arq, ini, dur, base):
    f = (base + ',' if base else '') + 'ebur128=peak=true'
    cmd = ['ffmpeg', '-hide_banner', '-nostats', '-ss', str(ini)] + (['-t', str(dur)] if dur else []) + ['-i', str(arq), '-af', f, '-f', 'null', '-']
    e = subprocess.run(cmd, capture_output=True, text=True).stderr; fim = e[e.rindex('Summary:'):]
    i = float(re.search(r'I:\s+(-?[\d.]+) LUFS', fim).group(1))
    if i < -69: # trecho curto demais para medir integrado: usa o RMS
        v = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-ss', str(ini)] + (['-t', str(dur)] if dur else []) + ['-i', str(arq), '-af', (base + ',' if base else '') + 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
        i = float(re.search(r'mean_volume:\s+(-?[\d.]+)', v).group(1))
    return i, float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', fim).group(1))

def main():
    sfx = MOD / 'public' / 'sfx'
    shutil.rmtree(sfx, ignore_errors=True); sfx.mkdir(parents=True)
    fx = [efeito(n, *v, sfx) for n, v in EFEITOS.items()]
    am = [efeito(n, *v, sfx, laco=True) for n, v in AMBIENTES.items()]
    # as músicas são de tools/trilha.py: aqui só se preservam, para este script não apagar nem desfazer a trilha
    arq_sons = MOD / 'src' / 'sons.json'
    musicas = json.loads(arq_sons.read_text()).get('musicas', {}) if arq_sons.exists() else {}
    (MOD / 'src' / 'sons.json').write_text(json.dumps({'efeitos': [f['nome'] for f in fx], 'ambientes': [a['nome'] for a in am], 'pad': PAD, 'lacos': {a['nome']: a['trecho'][1] for a in am}, 'musicas': musicas}, ensure_ascii=False, indent=1) + '\n')
    ln = ['# Créditos dos sons', '', 'Gerado por `tools/sons.py` a partir de `shared/sfx`. Não editar à mão.', '', '## Música', '', 'Trilha original gerada com Google Lyria 3 Pro, pela API da Magnific. Prompts, tarefas e medições em `docs/trilha-recibo.json`; composta por `tools/trilha.py`. As faixas trazem a marca-d\'água SynthID do Google, inaudível.', '', '## Efeitos e ambientes', '']
    for f in fx + am: ln.append(f"- `{f['nome']}`: {f['titulo']} (`{f['id']}`), {', '.join(f['autores'] or ['autor no catálogo'])}, {f['licenca']}, ganho {f['ganho_db']} dB.")
    (MOD / 'docs' / 'creditos-sons.md').write_text('\n'.join(ln) + '\n')
    print(f"efeitos {len(fx)} ambientes {len(am)} bytes_sfx {sum(x['bytes'] for x in fx + am)}")


main()

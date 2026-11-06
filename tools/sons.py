#!/usr/bin/env python3
"""Monta os sons do livro a partir de shared/sfx: músicas com os bytes originais, efeitos recortados e nivelados.
Gera public/sfx, public/musica, src/sons.json (ganhos e licenças) e docs/creditos-sons.md. Rode na raiz do módulo."""
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
  'uivo1': ('foley-howl-1', 0, None, -17, ''), 'uivo2': ('foley-howl-2', 0, None, -17, ''),
  'tchibum': ('rubberduck-water-splash-08', 0, None, -14, ''), 'tchibum2': ('rubberduck-water-splash-01', 0, None, -15, ''),
  'caldeirao': ('foley-cauldron', 0, 3.0, -20, ''),
  'chama': ('studio-boom-fuse-1', 0, None, -18, ''), 'lenha': ('bart-workshop-workshop-wood-clap', 0, None, -18, ''),
  'fogos': ('studio-boom-explosion-body-1', 0, None, -20, ''), 'fogos2': ('studio-boom-explosion-low-1', 0, None, -20, ''),
  'viva': ('chardonnet-teens-cheer-2', 0, None, -18, ''), 'risos': ('sardin-children-laughter', 0, None, -18, ''),
  'sino': ('sardin-glockenspiel-slip', 0, 6.0, -22, ''), 'melro': ('tiroir-blackbird-23', 0, None, -22, ''),
}
# ambientes: laço sem emenda, fechado por fusão do fim sobre o começo
AMBIENTES = {
  'passaros': ('thimras-park-park-ambience-birds', 60, 40, -30, ''),
  'brisa': ('thimras-park-park-ambience-wind', 60, 40, -30, 'highpass=f=120'),
  'grilos': ('original-owlish-night-crickets-ambience-on-rural-property', 10, 40, -30, ''),
  'fogo': ('foley-fire', 0, 2.4, -28, ''),
  'fervura': ('original-owlish-kettle-boil', 20, 40, -30, ''),
}
# momento da história: música (bytes originais)
MUSICAS = {
  'caixinha': ('music-industrial-music-box', 'capa'),
  'shuffle': ('music-george-street-shuffle', 'cena 1, a partida'),
  'hyperfun': ('music-hyperfun', 'cena 2, as casas; volta quando o Lobo foge'),
  'marty': ('music-marty-gots-a-plan', 'cena 3, o Lobo chega'),
  'umlaut': ('music-professor-umlaut', 'cena 4, a madeira'),
  'getaway': ('music-mistake-the-getaway', 'cena 5, o tijolo resiste'),
  'moonlight': ('music-moonlight-hall', 'cenas 6 e 7, a noite e a chaminé'),
  'delrio': ('music-del-rio-bravo', 'cena 8, a festa'),
}
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
    sfx = MOD / 'public' / 'sfx'; mus = MOD / 'public' / 'musica'
    for p in (sfx, mus):
        shutil.rmtree(p, ignore_errors=True); p.mkdir(parents=True)
    fx = [efeito(n, *v, sfx) for n, v in EFEITOS.items()]
    am = [efeito(n, *v, sfx, laco=True) for n, v in AMBIENTES.items()]
    trilha = []
    for nome, (sid, momento) in MUSICAS.items():
        i, arq = origem(sid); l, p = lufs(arq); shutil.copyfile(arq, mus / f'{nome}{arq.suffix}')
        ganho = ALVO_MUSICA - l
        trilha.append({'nome': nome, 'id': sid, 'titulo': i['title'], 'autor': i['sources'][0].get('author'), 'licenca': i['sources'][0].get('license'), 'url': i['sources'][0].get('url'), 'momento': momento, 'arquivo': f'{nome}{arq.suffix}', 'duracao': round(i['technical']['duration'], 1), 'bitrate': i['technical'].get('bit_rate'), 'lufs': l, 'pico': p, 'ganho_db': round(ganho, 2), 'bytes': arq.stat().st_size, 'instrumentos': (i.get('music') or {}).get('instruments'), 'clima': (i.get('music') or {}).get('mood')})
    (MOD / 'src' / 'sons.json').write_text(json.dumps({'efeitos': [f['nome'] for f in fx], 'ambientes': [a['nome'] for a in am], 'pad': PAD, 'lacos': {a['nome']: a['trecho'][1] for a in am}, 'musicas': {t['nome']: {'arquivo': t['arquivo'], 'ganho_db': t['ganho_db']} for t in trilha}}, ensure_ascii=False, indent=1) + '\n')
    ln = ['# Créditos dos sons', '', 'Gerado por `tools/sons.py` a partir de `shared/sfx`. Não editar à mão.', '', '## Música', '']
    for t in trilha: ln.append(f"- **{t['titulo']}**, {t['autor']} (incompetech.com), {t['licenca']}. {t['momento']}. {t['instrumentos'] or ''}. {t['url']}")
    ln += ['', 'Licença das músicas: Creative Commons Attribution 4.0, https://creativecommons.org/licenses/by/4.0/. Arquivos com os bytes originais do acervo, nivelados por ganho em tempo de execução.', '', '## Efeitos e ambientes', '']
    for f in fx + am: ln.append(f"- `{f['nome']}`: {f['titulo']} (`{f['id']}`), {', '.join(f['autores'] or ['autor no catálogo'])}, {f['licenca']}, ganho {f['ganho_db']} dB.")
    (MOD / 'docs' / 'creditos-sons.md').write_text('\n'.join(ln) + '\n')
    tot = sum(x['bytes'] for x in fx + am); mt = sum(t['bytes'] for t in trilha)
    print(f'efeitos {len(fx)} ambientes {len(am)} musicas {len(trilha)} bytes_sfx {tot} bytes_musica {mt}')
    for t in trilha: print(t['nome'], t['lufs'], 'LUFS pico', t['pico'], 'ganho', t['ganho_db'], t['duracao'], 's')
    print('licencas', sorted({x['licenca'] for x in fx + am}), sorted({t['licenca'] for t in trilha}))

main()

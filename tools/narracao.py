#!/usr/bin/env python3
"""Grava a narração do livro na ElevenLabs. Texto em src/story.js; a chave vem do ambiente ou do .env do hub e nunca é impressa.

  python3 tools/narracao.py --estimar     só conta os caracteres, sem rede
  python3 tools/narracao.py               grava o que falta (por hash do texto) e, com 8 de 8, liga o botão no site

Sem crédito, sai com código 3 e mantém o que já foi gravado: a próxima execução continua de onde parou.
O manifesto do site só recebe as faixas com a história inteira gravada, para o leitor nunca ouvir meio livro.
"""
import argparse, base64, hashlib, json, os, re, subprocess, sys, tempfile, urllib.error, urllib.request
from pathlib import Path

MOD = Path(__file__).resolve().parents[1]
HUB = MOD.parents[1]
PASTA = MOD / 'public' / 'narracao'
CACHE = MOD / 'output' / 'narracao'
MANIFESTO = MOD / 'src' / 'narracao.json'
RECIBO = MOD / 'docs' / 'narracao-recibo.json'
API = os.environ.get('ELEVENLABS_API', 'https://api.elevenlabs.io')
# Yasmin Alves: rótulos calm, narrative_story e pt-BR na biblioteca da ElevenLabs. Escolhida pelos metadados, sem ouvir.
VOZ = {'id': 'lWq4KDY8znfkV0DrK8Vb', 'nome': 'Yasmin Alves'}
MODELO = 'eleven_multilingual_v2'
AJUSTES = {'stability': 0.6, 'similarity_boost': 0.75, 'style': 0.15, 'speed': 0.92, 'use_speaker_boost': True}
ALVO_LUFS = -18.0
TOTAL = 8


def chave():
    if os.environ.get('ELEVENLABS_API_KEY'):
        return os.environ['ELEVENLABS_API_KEY']
    env = HUB / '.env'
    if env.exists():
        for linha in env.read_text().splitlines():
            if linha.startswith('ELEVENLABS_API_KEY='):
                return linha.split('=', 1)[1].strip().strip('"\'')
    sys.exit('ELEVENLABS_API_KEY não encontrada no ambiente nem no .env do hub.')


def textos():
    js = "import('./src/story.js').then((m) => console.log(JSON.stringify(m.CENAS.map((c) => c.linhas.map((l) => l.t)))))"
    cenas = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], cwd=MOD, text=True))
    if len(cenas) != TOTAL:
        sys.exit(f'esperava {TOTAL} cenas e li {len(cenas)}')
    # o travessão é marca de leitura na página; na voz, a própria entonação faz esse papel
    saida = ['\n\n'.join(re.sub(r'^—\s*', '', l) for l in linhas) for linhas in cenas]
    saida[0] = 'Os Três Porquinhos.\n\n' + saida[0]
    return saida


def assinatura(texto, voz):
    return hashlib.sha256(json.dumps([texto, voz, MODELO, AJUSTES], ensure_ascii=False).encode()).hexdigest()[:16]


def gravar(k, voz, texto, antes, depois):
    corpo = {'text': texto, 'model_id': MODELO, 'voice_settings': AJUSTES, 'previous_text': antes, 'next_text': depois}
    url = f'{API}/v1/text-to-speech/{voz}/with-timestamps?output_format=mp3_44100_128'
    req = urllib.request.Request(url, data=json.dumps(corpo).encode(), headers={'xi-api-key': k, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.load(r)


def duracao(arq):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(arq)], text=True).strip())


def lufs(arq):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(arq), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)[-1])


def salvar_json(arq, dados):
    arq.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', dir=arq.parent, delete=False, suffix='.tmp') as t:
        json.dump(dados, t, ensure_ascii=False, indent=2); t.write('\n')
    os.replace(t.name, arq)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--estimar', action='store_true')
    ap.add_argument('--voz', default=VOZ['id'])
    ap.add_argument('--nome-voz', default=None)
    a = ap.parse_args()
    nome_voz = a.nome_voz or (VOZ['nome'] if a.voz == VOZ['id'] else a.voz)
    tx = textos()
    recibo = json.loads(RECIBO.read_text()) if RECIBO.exists() else {'faixas': {}}
    falta = [i for i in range(TOTAL) if recibo['faixas'].get(str(i), {}).get('hash') != assinatura(tx[i], a.voz) or not (PASTA / f'cena-{i}.mp3').exists()]
    if a.estimar:
        for i, t in enumerate(tx):
            print(f'cena {i + 1}: {len(t)} caracteres' + (' (falta)' if i in falta else ''))
        print(f'total: {sum(map(len, tx))} caracteres; a gravar: {sum(len(tx[i]) for i in falta)}')
        return 0
    k = chave()
    PASTA.mkdir(parents=True, exist_ok=True); CACHE.mkdir(parents=True, exist_ok=True)
    for i in falta:
        try:
            d = gravar(k, a.voz, tx[i], tx[i - 1][-300:] if i else '', tx[i + 1][:300] if i + 1 < TOTAL else '')
        except urllib.error.HTTPError as e:
            info = {}
            try: info = json.load(e).get('detail', {})
            except Exception: pass
            status = info.get('status') if isinstance(info, dict) else None
            msg = info.get('message') if isinstance(info, dict) else str(info)
            print(f'cena {i + 1}: HTTP {e.code} {status or ""}: {msg or ""}', file=sys.stderr)
            print(f'gravadas {TOTAL - len(falta) + falta.index(i)} de {TOTAL}; o site segue sem narração até completar.', file=sys.stderr)
            return 3 if status == 'quota_exceeded' else 2
        destino = PASTA / f'cena-{i}.mp3'
        temp = destino.with_suffix('.tmp.mp3')
        temp.write_bytes(base64.b64decode(d['audio_base64']))
        os.replace(temp, destino)
        (CACHE / f'cena-{i}.alinhamento.json').write_text(json.dumps(d.get('alignment') or {}, ensure_ascii=False))
        recibo['voz'] = {'id': a.voz, 'nome': nome_voz}; recibo['modelo'] = MODELO; recibo['ajustes'] = AJUSTES
        recibo['faixas'][str(i)] = {'hash': assinatura(tx[i], a.voz), 'caracteres': len(tx[i]), 'duracao': round(duracao(destino), 2), 'lufs': round(lufs(destino), 1)}
        salvar_json(RECIBO, recibo)
        print(f'cena {i + 1}: {recibo["faixas"][str(i)]["duracao"]} s, {recibo["faixas"][str(i)]["lufs"]} LUFS')
    faixas = {str(i): {'arquivo': f'cena-{i}.mp3', 'duracao': recibo['faixas'][str(i)]['duracao'], 'ganho_db': round(ALVO_LUFS - recibo['faixas'][str(i)]['lufs'], 1)} for i in range(TOTAL)}
    salvar_json(MANIFESTO, {'voz': recibo['voz']['nome'], 'faixas': faixas})
    print(f'{TOTAL} de {TOTAL} cenas gravadas; manifesto em src/narracao.json. Falta build, commit, push e deploy.')
    return 0


if __name__ == '__main__':
    sys.exit(main())

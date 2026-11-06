#!/usr/bin/env python3
"""Grava a narração do livro com vozes da ElevenLabs, pela Magnific (padrão) ou direto. Texto em src/story.js; a chave vem do ambiente ou do .env do hub e nunca é impressa.

  python3 tools/narracao.py --estimar     só conta os caracteres, sem rede
  python3 tools/narracao.py               grava o que falta (por hash do texto) e, com 8 de 8, liga o botão no site
  python3 tools/narracao.py --cena 3      grava só essa cena, para ouvir antes de gastar nas outras

Sem crédito, sai com código 3 e mantém o que já foi gravado: a próxima execução continua de onde parou.
O manifesto do site só recebe as faixas com a história inteira gravada, para o leitor nunca ouvir meio livro.
"""
import argparse, base64, hashlib, json, os, re, subprocess, sys, tempfile, time, unicodedata, urllib.error, urllib.request
from pathlib import Path

MOD = Path(__file__).resolve().parents[1]
HUB = MOD.parents[1]
PASTA = MOD / 'public' / 'narracao'
CACHE = MOD / 'output' / 'narracao'
MANIFESTO = MOD / 'src' / 'narracao.json'
RECIBO = MOD / 'docs' / 'narracao-recibo.json'
API = os.environ.get('ELEVENLABS_API', 'https://api.elevenlabs.io')
API_MAGNIFIC = os.environ.get('MAGNIFIC_API', 'https://api.magnific.com')
ROTA_MAGNIFIC = '/v1/ai/voiceover/elevenlabs-turbo-v2-5'
# Yasmin Alves: rótulos calm, narrative_story e pt-BR na biblioteca da ElevenLabs. Escolhida pelos metadados, sem ouvir.
VOZ = {'id': 'lWq4KDY8znfkV0DrK8Vb', 'nome': 'Yasmin Alves'}
MODELOS = {'magnific': 'eleven_turbo_v2_5', 'elevenlabs': 'eleven_multilingual_v2'}
AJUSTES = {
    'magnific': {'stability': 0.6, 'similarity_boost': 0.75, 'speed': 0.92, 'use_speaker_boost': True},
    'elevenlabs': {'stability': 0.6, 'similarity_boost': 0.75, 'style': 0.15, 'speed': 0.92, 'use_speaker_boost': True},
}
ALVO_LUFS = -18.0
TOTAL = 8
# trecho da fala em que a ação da cena acontece no modo narrado
# (o tchibum da animação vem 0,86 s depois do início dela, e a voz diz "tchibum" no meio da frase; o reconhecedor escreve "tibum")
ANCORAS = [('e la se foram', 0), ('juntou um monte', 0), ('encheu o peito', 0), ('soprou uma vez', 0), ('soprou soprou', 0), ('soprou as brasas', 0), ('tibum', 0.86), ('os tres dancaram', 0)]
WHISPER = Path.home() / '.cache' / 'whisper-cpp' / 'ggml-large-v3-turbo.bin'


def chave(nome):
    if os.environ.get(nome):
        return os.environ[nome]
    env = HUB / '.env'
    if env.exists():
        for linha in env.read_text().splitlines():
            if linha.startswith(nome + '='):
                return linha.split('=', 1)[1].strip().strip('"\'')
    sys.exit(f'{nome} não encontrada no ambiente nem no .env do hub.')


def textos():
    js = "import('./src/story.js').then((m) => console.log(JSON.stringify(m.CENAS.map((c) => c.linhas.map((l) => l.t)))))"
    cenas = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], cwd=MOD, text=True))
    if len(cenas) != TOTAL:
        sys.exit(f'esperava {TOTAL} cenas e li {len(cenas)}')
    # o travessão é marca de leitura na página; na voz, a própria entonação faz esse papel
    saida = ['\n\n'.join(re.sub(r'^—\s*', '', l) for l in linhas) for linhas in cenas]
    saida[0] = 'Os Três Porquinhos.\n\n' + saida[0]
    return saida


def assinatura(texto, voz, servico):
    return hashlib.sha256(json.dumps([texto, voz, MODELOS[servico], AJUSTES[servico]], ensure_ascii=False).encode()).hexdigest()[:16]


def gravar_magnific(k, voz, texto):
    cab = {'x-magnific-api-key': k, 'Content-Type': 'application/json', 'User-Agent': 'tres-porquinhos-narracao'}
    corpo = {'text': texto, 'voice_id': voz, **AJUSTES['magnific']}
    req = urllib.request.Request(API_MAGNIFIC + ROTA_MAGNIFIC, data=json.dumps(corpo).encode(), headers=cab)
    with urllib.request.urlopen(req, timeout=120) as r:
        tarefa = json.load(r)['data']
    for _ in range(100):
        if tarefa['status'] == 'COMPLETED':
            with urllib.request.urlopen(urllib.request.Request(tarefa['generated'][0], headers={'User-Agent': cab['User-Agent']}), timeout=120) as r:
                return {'audio': r.read(), 'tarefa': tarefa['task_id']}
        if tarefa['status'] == 'FAILED':
            sys.exit(f'tarefa {tarefa["task_id"]} falhou na Magnific')
        time.sleep(3)
        with urllib.request.urlopen(urllib.request.Request(f'{API_MAGNIFIC}{ROTA_MAGNIFIC}/{tarefa["task_id"]}', headers=cab), timeout=60) as r:
            tarefa = json.load(r)['data']
    sys.exit(f'tarefa {tarefa["task_id"]} não terminou em 5 minutos')


def gravar_elevenlabs(k, voz, texto, antes, depois):
    corpo = {'text': texto, 'model_id': MODELOS['elevenlabs'], 'voice_settings': AJUSTES['elevenlabs'], 'previous_text': antes, 'next_text': depois}
    url = f'{API}/v1/text-to-speech/{voz}/with-timestamps?output_format=mp3_44100_128'
    req = urllib.request.Request(url, data=json.dumps(corpo).encode(), headers={'xi-api-key': k, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        d = json.load(r)
    return {'audio': base64.b64decode(d['audio_base64']), 'alinhamento': d.get('alignment')}


def duracao(arq):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(arq)], text=True).strip())


def lufs(arq):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(arq), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)[-1])


def nivelar(bruto, destino):
    """Deixa as cenas no mesmo volume, sem passar de -1,5 dBTP. O bruto fica em output/ para renivelar sem gastar crédito."""
    temp = destino.with_suffix('.tmp.mp3')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(bruto), '-af', f'loudnorm=I={ALVO_LUFS}:TP=-1.5:LRA=7', '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '128k', str(temp)], check=True)
    os.replace(temp, destino)


def so_letras(t):
    return re.findall(r'[a-z]+', ''.join(c for c in unicodedata.normalize('NFD', t.lower()) if not unicodedata.combining(c)))


def ancorar(i, ancora, adianto=0):
    """Acha pelo reconhecimento de fala o segundo em que a âncora é dita. A Magnific não devolve o alinhamento do texto."""
    base = CACHE / f'cena-{i}'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(PASTA / f'cena-{i}.mp3'), '-ar', '16000', '-ac', '1', f'{base}.wav'], check=True)
    subprocess.run(['whisper-cli', '-m', str(WHISPER), '-l', 'pt', '-ml', '1', '-sow', '-oj', '-of', str(base), '-f', f'{base}.wav'], capture_output=True, check=True)
    itens = [(so_letras(s['text']), s['offsets']['from'] / 1000) for s in json.loads(Path(f'{base}.json').read_text())['transcription']]
    alvo = so_letras(ancora); palavras = [(p, t) for ps, t in itens for p in ps]
    for k in range(len(palavras) - len(alvo) + 1):
        if [p for p, _ in palavras[k:k + len(alvo)]] == alvo:
            return round(max(0, palavras[k][1] - adianto), 2)
    return None


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
    ap.add_argument('--servico', choices=sorted(MODELOS), default='magnific')
    ap.add_argument('--cena', type=int, help='grava só esta cena (1 a 8)')
    a = ap.parse_args()
    nome_voz = a.nome_voz or (VOZ['nome'] if a.voz == VOZ['id'] else a.voz)
    tx = textos()
    recibo = json.loads(RECIBO.read_text()) if RECIBO.exists() else {'faixas': {}}
    falta = [i for i in range(TOTAL) if recibo['faixas'].get(str(i), {}).get('hash') != assinatura(tx[i], a.voz, a.servico) or not (PASTA / f'cena-{i}.mp3').exists()]
    if a.estimar:
        for i, t in enumerate(tx):
            print(f'cena {i + 1}: {len(t)} caracteres' + (' (falta)' if i in falta else ''))
        print(f'total: {sum(map(len, tx))} caracteres; a gravar: {sum(len(tx[i]) for i in falta)}')
        return 0
    if a.cena:
        falta = [i for i in falta if i == a.cena - 1]
    k = chave('MAGNIFIC_API_KEY' if a.servico == 'magnific' else 'ELEVENLABS_API_KEY')
    PASTA.mkdir(parents=True, exist_ok=True); CACHE.mkdir(parents=True, exist_ok=True)
    for i in falta:
        try:
            if a.servico == 'magnific':
                d = gravar_magnific(k, a.voz, tx[i])
            else:
                d = gravar_elevenlabs(k, a.voz, tx[i], tx[i - 1][-300:] if i else '', tx[i + 1][:300] if i + 1 < TOTAL else '')
        except urllib.error.HTTPError as e:
            info = {}
            try: info = json.load(e).get('detail', {})
            except Exception: pass
            status = info.get('status') if isinstance(info, dict) else None
            msg = info.get('message') if isinstance(info, dict) else str(info)
            print(f'cena {i + 1}: HTTP {e.code} {status or ""}: {msg or ""}', file=sys.stderr)
            print(f'parou na cena {i + 1}; o site segue sem narração até completar as {TOTAL}.', file=sys.stderr)
            return 3 if status == 'quota_exceeded' else 2
        destino = PASTA / f'cena-{i}.mp3'
        bruto = CACHE / f'cena-{i}.bruto.mp3'
        bruto.write_bytes(d['audio'])
        nivelar(bruto, destino)
        if d.get('alinhamento'):
            (CACHE / f'cena-{i}.alinhamento.json').write_text(json.dumps(d['alinhamento'], ensure_ascii=False))
        recibo['voz'] = {'id': a.voz, 'nome': nome_voz}; recibo['servico'] = a.servico; recibo['modelo'] = MODELOS[a.servico]; recibo['ajustes'] = AJUSTES[a.servico]
        recibo['faixas'][str(i)] = {'hash': assinatura(tx[i], a.voz, a.servico), 'tarefa': d.get('tarefa'), 'caracteres': len(tx[i]), 'duracao': round(duracao(destino), 2), 'lufs': round(lufs(destino), 1)}
        salvar_json(RECIBO, recibo)
        print(f'cena {i + 1}: {recibo["faixas"][str(i)]["duracao"]} s, {recibo["faixas"][str(i)]["lufs"]} LUFS')
    if a.cena or any(not (PASTA / f'cena-{i}.mp3').exists() or recibo['faixas'].get(str(i), {}).get('hash') != assinatura(tx[i], a.voz, a.servico) for i in range(TOTAL)):
        print('amostra gravada; o manifesto só muda com as 8 cenas.')
        return 0
    faixas = {str(i): {'arquivo': f'cena-{i}.mp3', 'duracao': recibo['faixas'][str(i)]['duracao'], 'ganho_db': round(ALVO_LUFS - recibo['faixas'][str(i)]['lufs'], 1), 'acao_em': ancorar(i, *ANCORAS[i])} for i in range(TOTAL)}
    for i, f in faixas.items():
        print(f'cena {int(i) + 1}: ação aos {f["acao_em"]} s de {f["duracao"]} s' if f['acao_em'] is not None else f'cena {int(i) + 1}: âncora não encontrada; a ação fica para o fim da fala')
    salvar_json(MANIFESTO, {'voz': recibo['voz']['nome'], 'faixas': faixas})
    print(f'{TOTAL} de {TOTAL} cenas gravadas; manifesto em src/narracao.json. Falta build, commit, push e deploy.')
    return 0


if __name__ == '__main__':
    sys.exit(main())

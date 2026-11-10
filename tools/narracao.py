#!/usr/bin/env python3
"""Grava a narração do livro com vozes da ElevenLabs, pela Magnific (padrão) ou direto. Texto em src/story.js; a chave vem do ambiente ou do .env do hub e nunca é impressa.

  python3 tools/narracao.py --estimar     só conta os caracteres, sem rede
  python3 tools/narracao.py               grava o que falta (por hash do texto) e, com todas, liga o botão no site
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
TOTAL = 17
ROTEIRO = MOD / 'src' / 'roteiro.json'


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


def trechos_de_fala(arq):
    """Os trechos com voz, medidos no áudio: o começo de cada frase é exato, porque vem depois de uma pausa real."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(arq), '-af', 'silencedetect=noise=-38dB:d=0.16', '-f', 'null', '-'], capture_output=True, text=True).stderr
    ini = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r)]; fim = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(arq)], text=True))
    if len(fim) < len(ini): fim.append(dur)
    bordas = sorted([(0.0, 0.0)] + list(zip(ini, fim)) + [(dur, dur)])
    return [(a[1], b[0]) for a, b in zip(bordas, bordas[1:]) if b[0] - a[1] > 0.12]


def alinhar(texto, trechos):
    """Reparte o texto conhecido pelos trechos, por programação dinâmica, e dá a cada palavra o seu tempo. A API não devolve alinhamento."""
    crus = texto.split(); palavras = [so_letras(c) for c in crus]; marcas = [c.rstrip()[-1] in ',.!?:…;' for c in crus]
    itens = []
    for p, m in zip(palavras, marcas):
        for k, q in enumerate(p): itens.append((q, m and k == len(p) - 1))
    n, m = len(itens), len(trechos); pesos = [len(q) + 1 for q, _ in itens]
    soma = [0]
    for w in pesos: soma.append(soma[-1] + w)
    ritmo = sum(b - a for a, b in trechos) / soma[-1]
    INF = float('inf'); melhor = [[INF] * (n + 1) for _ in range(m + 1)]; veio = [[0] * (n + 1) for _ in range(m + 1)]; melhor[0][0] = 0
    for j in range(1, m + 1):
        d = trechos[j - 1][1] - trechos[j - 1][0]
        for f in range(1, n + 1):
            for i in range(max(0, f - 40), f):
                if melhor[j - 1][i] == INF: continue
                c = melhor[j - 1][i] + ((d - ritmo * (soma[f] - soma[i])) / max(d, 0.4)) ** 2 + (0 if itens[f - 1][1] or j == m else 0.35)
                if c < melhor[j][f]: melhor[j][f] = c; veio[j][f] = i
    cortes = [n]
    for j in range(m, 0, -1): cortes.append(veio[j][cortes[-1]])
    cortes.reverse()
    tempos = []
    for j in range(m):
        i, f = cortes[j], cortes[j + 1]; a, b = trechos[j]; tot = (soma[f] - soma[i]) or 1
        for k in range(i, f):
            tempos.append((itens[k][0], a + (soma[k] - soma[i]) / tot * (b - a), a + (soma[k + 1] - soma[i]) / tot * (b - a)))
    return tempos


def achar(tempos, ancora, cena):
    alvo = so_letras(ancora); nomes = [t[0] for t in tempos]
    ach = [k for k in range(len(nomes) - len(alvo) + 1) if nomes[k:k + len(alvo)] == alvo]
    if len(ach) != 1:
        sys.exit(f'cena {cena + 1}: a âncora "{ancora}" aparece {len(ach)} vez(es) no texto; precisa aparecer uma.')
    return ach[0], len(alvo)


def resolver_roteiro(i, roteiro, texto):
    """Troca as âncoras do roteiro pelos segundos da gravação."""
    tempos = alinhar(texto, trechos_de_fala(PASTA / f'cena-{i}.mp3'))
    ini = lambda a, p=0: tempos[achar(tempos, a, i)[0] + p][1]
    def fim(a, palavras=None):
        k, n = achar(tempos, a, i); return tempos[k + (palavras or n) - 1][2]
    marcos = {}
    for g, m in roteiro['marcos'].items():
        d = {'em': round(max(0, ini(m['em'], m.get('palavra', 0)) + m.get('desloca', 0)), 2)}
        if 'ate' in m: d['ate'] = round(fim(m['ate']), 2)
        if 'ritmo' in m: d['ritmo'] = m['ritmo']
        marcos[g] = d
    falas = [{'quem': f['quem'], 'texto': f['texto'], 'de': round(ini(f['de']), 2), 'ate': round(fim(f['ate'], f.get('palavras')), 2)} for f in roteiro['falas']]
    return {'marcos': marcos, 'falas': falas, 'acao_em': marcos[roteiro['acao']]['em']}


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
    ap.add_argument('--cena', type=int, help='grava só esta cena (1 a 17)')
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
        print('amostra gravada; o manifesto só muda com todas as cenas.')
        return 0
    roteiro = json.loads(ROTEIRO.read_text())
    versoes = [hashlib.sha256((PASTA / f'cena-{i}.mp3').read_bytes()).hexdigest()[:16] for i in range(TOTAL)]
    faixas = {str(i): {'arquivo': f'cena-{i}.mp3?v={versoes[i]}', 'duracao': recibo['faixas'][str(i)]['duracao'], 'ganho_db': round(ALVO_LUFS - recibo['faixas'][str(i)]['lufs'], 1), **resolver_roteiro(i, roteiro[str(i)], tx[i])} for i in range(TOTAL)}
    for i, f in faixas.items():
        print(f'cena {int(i) + 1}: {len(f["marcos"])} marcos, {len(f["falas"])} falas, ação aos {f["acao_em"]} s de {f["duracao"]} s')
    salvar_json(MANIFESTO, {'voz': recibo['voz']['nome'], 'faixas': faixas})
    print(f'{TOTAL} de {TOTAL} cenas gravadas; manifesto em src/narracao.json. Falta build, commit, push e deploy.')
    return 0


if __name__ == '__main__':
    sys.exit(main())

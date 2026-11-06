#!/usr/bin/env python3
"""Compõe a trilha do livro com música gerada pela Magnific (motor Google Lyria 3 Pro). A chave vem do ambiente ou do .env do hub e nunca é impressa.

O acervo do estúdio tem música de ação para jogos e nada de conto infantil. Cada momento repete o mesmo conjunto de instrumentos,
para a história soar como uma peça só. Idempotente: só compõe o que mudou. Grava public/musica, docs/trilha-recibo.json e as músicas em src/sons.json.
"""
import hashlib, json, os, re, subprocess, sys, tempfile, time, urllib.error, urllib.request
from pathlib import Path

MOD = Path(__file__).resolve().parents[1]
HUB = MOD.parents[1]
PASTA = MOD / 'public' / 'musica'
RECIBO = MOD / 'docs' / 'trilha-recibo.json'
SONS = MOD / 'src' / 'sons.json'
API = os.environ.get('MAGNIFIC_API', 'https://api.magnific.com')
ROTA = '/v1/ai/music-generation/lyria-3'  # a rota antiga, do motor ElevenLabs, responde 410 desde 2026-11
ALVO_LUFS = -22.0
BASE = ("Instrumental underscore for a children's fairy tale storybook, in the style of a classic orchestral storybook ballet. "
        "Small acoustic chamber ensemble only: pizzicato strings, flute, clarinet, bassoon, harp, glockenspiel. Warm, gentle, recorded in a small hall. "
        "No vocals, no choir, no drums, no synths, no electric instruments. Leaves room for a narrator's voice. ")
MOMENTOS = {
    'era-uma-vez': (45, 'Once upon a time: a delicate, tender opening melody on glockenspiel and harp, then soft flute. Slow, curious, like opening an old book.'),
    'partida': (60, 'A warm morning at a small country home. A tender farewell from a mother to her children, then a light hopeful walking melody on flute and clarinet over pizzicato strings. Moderate tempo.'),
    'obra': (60, 'Three little brothers building their houses. Light, cheerful and busy: playful pizzicato strings, a carefree flute tune, a patient steady clarinet answering. Moderate tempo, innocent and happy.'),
    'lobo-chega': (60, 'A hungry wolf arrives. A sneaky, mischievous, comic low bassoon theme stepping over pizzicato basses, with nervous flute replies. Child friendly suspense, never scary. Moderately slow.'),
    'lobo-insiste': (60, 'The wolf chases on. The same sneaky low bassoon theme, now more insistent and a little faster, with tremolo strings and worried clarinet runs. Comic tension, child friendly.'),
    'lobo-teima': (60, 'A stubborn wolf huffs at a strong brick house and nothing moves. The sneaky bassoon theme grows tired and frustrated, while a calm, cozy clarinet melody stays steady and safe. Gently funny.'),
    'noite': (60, 'A quiet night. The wolf tiptoes across a rooftop while the brothers whisper and stoke the fire. Hushed harp and glockenspiel, soft muted strings, slow tiptoeing pizzicato, gentle suspense.'),
    'fuga': (45, 'Comic relief: a wolf bolts away howling. A fast, funny orchestral gallop with running flute and clarinet and scurrying pizzicato that gets smaller and fades into the distance, ending in a light, relieved melody.'),
    'festa': (60, 'A happy ending at night around a bonfire. A joyful country dance on flute and clarinet with bouncing pizzicato strings and bright glockenspiel. Warm, celebratory, a family dancing together.'),
}


def chave():
    if os.environ.get('MAGNIFIC_API_KEY'):
        return os.environ['MAGNIFIC_API_KEY']
    for linha in (HUB / '.env').read_text().splitlines():
        if linha.startswith('MAGNIFIC_API_KEY='):
            return linha.split('=', 1)[1].strip().strip('"\'')
    sys.exit('MAGNIFIC_API_KEY não encontrada')


def compor(k, prompt, seg):
    cab = {'x-magnific-api-key': k, 'Content-Type': 'application/json', 'User-Agent': 'tres-porquinhos-trilha'}
    req = urllib.request.Request(API + ROTA, data=json.dumps({'prompt': prompt, 'model': 'pro'}).encode(), headers=cab)
    with urllib.request.urlopen(req, timeout=120) as r:
        t = json.load(r)['data']
    for _ in range(200):
        if t['status'] == 'COMPLETED':
            with urllib.request.urlopen(urllib.request.Request(t['generated'][0], headers={'User-Agent': cab['User-Agent']}), timeout=180) as r:
                return r.read(), t['task_id']
        if t['status'] == 'FAILED':
            raise RuntimeError(f'tarefa {t["task_id"]} falhou')
        time.sleep(4)
        with urllib.request.urlopen(urllib.request.Request(f'{API}{ROTA}/{t["task_id"]}', headers=cab), timeout=60) as r:
            t = json.load(r)['data']
    raise RuntimeError(f'tarefa {t["task_id"]} não terminou')


def medir(arq):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(arq), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(arq)], text=True))
    return round(d, 2), float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])


def salvar(arq, dados):
    with tempfile.NamedTemporaryFile('w', dir=arq.parent, delete=False, suffix='.tmp') as t:
        json.dump(dados, t, ensure_ascii=False, indent=2); t.write('\n')
    os.replace(t.name, arq)


def main():
    PASTA.mkdir(parents=True, exist_ok=True)
    recibo = json.loads(RECIBO.read_text()) if RECIBO.exists() else {'motor': 'Google Lyria 3 Pro pela API da Magnific', 'faixas': {}}
    k = chave(); erro = 0
    for nome, (seg, cena) in MOMENTOS.items():
        prompt = f'{BASE}{cena} Instrumental only. About {seg} seconds long, ending with a soft natural close.'
        h = hashlib.sha256(f'{prompt}|{seg}'.encode()).hexdigest()[:16]
        arq = PASTA / f'{nome}.mp3'
        if recibo['faixas'].get(nome, {}).get('hash') == h and arq.exists():
            print(f'{nome}: já composta'); continue
        try:
            audio, tarefa = compor(k, prompt, seg)
        except (urllib.error.HTTPError, RuntimeError) as e:
            corpo = e.read()[:200].decode('utf-8', 'replace') if isinstance(e, urllib.error.HTTPError) else ''
            print(f'{nome}: falhou: {e} {corpo}', file=sys.stderr); erro = 2; continue
        arq.write_bytes(audio)
        d, l, p = medir(arq)
        recibo['faixas'][nome] = {'hash': h, 'tarefa': tarefa, 'prompt': prompt, 'pedido_s': seg, 'duracao': d, 'lufs': l, 'pico_dbfs': p}
        salvar(RECIBO, recibo)
        print(f'{nome}: {d} s, {l} LUFS, pico {p} dBFS')
    if all(n in recibo['faixas'] for n in MOMENTOS):
        sons = json.loads(SONS.read_text())
        sons['musicas'] = {n: {'arquivo': f'{n}.mp3', 'ganho_db': round(min(ALVO_LUFS - recibo['faixas'][n]['lufs'], -1 - recibo['faixas'][n]['pico_dbfs']), 1)} for n in MOMENTOS}
        salvar(SONS, sons)
        print(f'{len(MOMENTOS)} de {len(MOMENTOS)} momentos; src/sons.json atualizado')
    return erro


if __name__ == '__main__':
    sys.exit(main())

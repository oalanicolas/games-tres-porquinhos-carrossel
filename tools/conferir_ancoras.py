#!/usr/bin/env python3
"""Confere, de ouvido de máquina, se cada gesto está na sua palavra: corta a voz no segundo do marco e transcreve só aquele trecho.

Uso: python3 tools/conferir_ancoras.py   (precisa de ffmpeg e whisper-cli; grava output/ancoras.json)
"""
import json, os, subprocess, tempfile, unicodedata
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

MOD = Path(__file__).resolve().parent.parent
MODELO = Path.home() / '.cache/whisper-cpp/ggml-large-v3-turbo.bin'
JANELA = 1.7


def letras(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if c.isalpha() or c == ' ').split()


def ouvir(wav, de, ate, pasta):
    arq = Path(pasta) / f'{wav.stem}-{de:.2f}.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{max(de, 0):.3f}', '-t', f'{ate - de:.3f}', '-i', str(wav), '-af', 'adelay=250:all=1,apad=pad_dur=0.25', '-ar', '16000', '-ac', '1', str(arq)], check=True)
    r = subprocess.run(['whisper-cli', '-m', str(MODELO), '-l', 'pt', '-nt', '-np', '-t', '3', '-f', str(arq)], capture_output=True, text=True)
    return r.stdout.strip()


def conferir(item, pasta):
    i, g, ancora, em = item
    wav = MOD / 'output' / 'narracao' / f'cena-{i}.wav'
    ouvido = ouvir(wav, em - 0.12, em + JANELA, pasta)
    palavras = letras(ancora)
    achou = [p for p in palavras if any(q.startswith(p[:4]) for q in letras(ouvido)[:len(palavras) + 3])]
    return {'cena': i + 1, 'grupo': g, 'ancora': ancora, 'em': em, 'ouvido': ouvido, 'ok': len(achou) >= max(1, len(palavras) // 2)}


def main():
    roteiro = json.loads((MOD / 'src' / 'roteiro.json').read_text())
    faixas = json.loads((MOD / 'src' / 'narracao.json').read_text())['faixas']
    itens = []
    for i in range(len(faixas)):
        cena = roteiro[str(i)] if str(i) in roteiro else roteiro['cenas'][i]
        for g, v in cena['marcos'].items():
            if g not in faixas[str(i)]['marcos']: continue
            desloca = v.get('desloca', 0)
            itens.append((i, g, v['em'], round(faixas[str(i)]['marcos'][g]['em'] - desloca, 3)))
    with tempfile.TemporaryDirectory(dir=MOD / 'output') as pasta, ThreadPoolExecutor(4) as ex:
        res = list(ex.map(lambda x: conferir(x, pasta), itens))
    (MOD / 'output' / 'ancoras.json').write_text(json.dumps(res, ensure_ascii=False, indent=1))
    ok = sum(r['ok'] for r in res)
    print(f'{ok} de {len(res)} marcos: a palavra aparece no começo do trecho')
    for r in res:
        if not r['ok']: print(f"cena {r['cena']} {r['grupo']} em {r['em']}: esperava \"{r['ancora']}\", ouviu \"{r['ouvido']}\"")


if __name__ == '__main__':
    main()

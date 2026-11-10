#!/usr/bin/env python3
"""Grava os convites do modo sopro, na mesma voz da narração: a criança precisa ouvir que é para gritar "Fuuuu!".
Idempotente: só grava o texto que mudou. Grava em public/narracao, com recibo em docs/convites-sopro-recibo.json. Rode na raiz do módulo."""
import importlib.util, json, tempfile
from pathlib import Path

MOD = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('narracao', MOD / 'tools' / 'narracao.py')
N = importlib.util.module_from_spec(spec); spec.loader.exec_module(N)

CONVITES = {
    'convite-palha': 'Agora é com você! Ajude o Lobo! Grite bem forte: Fuuuuuuuu!',
    'convite-madeira': 'A madeira é mais forte! Grite de novo: Fuuuuuuuu!',
    'convite-tijolos': 'Agora, os tijolos! Grite com toda a força! Grite: Fuuuuuuuu!',
    'convite-de-novo': 'Mais forte! Grite: Fuuuuuuuu!',
}
RECIBO = MOD / 'docs' / 'convites-sopro-recibo.json'
recibo = json.loads(RECIBO.read_text()) if RECIBO.exists() else {}
k = N.chave('MAGNIFIC_API_KEY')
for nome, texto in CONVITES.items():
    ass = N.assinatura(texto, N.VOZ['id'], 'magnific')
    destino = MOD / 'public' / 'narracao' / f'{nome}.mp3'
    if recibo.get(nome, {}).get('assinatura') == ass and destino.exists():
        print('igual', nome); continue
    r = N.gravar_magnific(k, N.VOZ['id'], texto)
    with tempfile.TemporaryDirectory() as d:
        bruto = Path(d) / 'bruto.mp3'; bruto.write_bytes(r['audio']); N.nivelar(bruto, destino)
    recibo[nome] = {'texto': texto, 'voz': N.VOZ['nome'], 'servico': 'magnific', 'modelo': N.MODELOS['magnific'], 'ajustes': N.AJUSTES['magnific'], 'tarefa': r['tarefa'], 'assinatura': ass, 'duracao': N.duracao(destino)}
    print('gravado', nome, recibo[nome]['duracao'])
RECIBO.write_text(json.dumps(recibo, ensure_ascii=False, indent=1) + '\n')

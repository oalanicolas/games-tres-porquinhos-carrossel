#!/usr/bin/env python3
"""Corta a referência do Lobo (arte/lobo-referencia.png) em peças articuladas.

Saída: src/lobo-atlas.webp e src/lobo-pecas.json. Cada peça tem a parte visível (polígono na imagem,
cortado pela silhueta e pela cor) e a parte escondida (o que fica sob as peças de cima e só aparece
quando elas se mexem), preenchida com a cor mais próxima. Coordenadas em pixels da referência.

Uso (na raiz do módulo; precisa de numpy, scipy e magick):
  python3 tools/lobo_pecas.py              gera o atlas e o json
  python3 tools/lobo_pecas.py <diretório>  além disso grava cortes.jpg e rosto.jpg (vista explodida e rosto) no diretório, que já deve existir
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from scipy import ndimage as ndi

RAIZ = Path(__file__).resolve().parent.parent
REF = RAIZ / 'arte/lobo-referencia.png'
W, H = 1024, 1536
ATLAS = 2048

raw = subprocess.run(['magick', str(REF), '-depth', '8', 'rgba:-'], capture_output=True, check=True).stdout
img = np.frombuffer(raw, np.uint8).reshape(H, W, 4).astype(np.float32)
rgb0, alfa = img[..., :3], img[..., 3]

def maior(m):
    rot, n = ndi.label(m)
    if n < 2: return m
    t = ndi.sum(m, rot, range(1, n + 1)); return rot == (1 + int(np.argmax(t)))

sil = maior(ndi.binary_opening(alfa > 170, iterations=2))
sil = ndi.binary_erosion(ndi.binary_fill_holes(sil) & (alfa > 90), iterations=1)
# Tira a franja: a cor da borda vem de dentro do pelo.
ind = ndi.distance_transform_edt(~ndi.binary_erosion(sil, iterations=2), return_distances=False, return_indices=True)
rgb = rgb0[ind[0], ind[1]]
rgb[ndi.binary_erosion(sil, iterations=2)] = rgb0[ndi.binary_erosion(sil, iterations=2)]

suave = ndi.gaussian_filter(rgb, (2.2, 2.2, 0))
azul = (suave[..., 2] - suave[..., 0]) > 28
creme = (suave[..., 0] - suave[..., 2]) > 21

def poli(*pts):
    """Polígono preenchido, regra par-ímpar, varredura por linha."""
    m = np.zeros((H, W), bool); n = len(pts)
    for y in range(H):
        xs = []
        for i in range(n):
            (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % n]
            if (y1 <= y < y2) or (y2 <= y < y1): xs.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
        xs.sort()
        for a, b in zip(xs[::2], xs[1::2]): m[y, max(0, int(round(a))):min(W, int(round(b)))] = True
    return m

def elipse(cx, cy, rx, ry=None):
    ry = ry or rx; yy, xx = np.mgrid[:H, :W]; return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1

# ---- recortes ------------------------------------------------------------------------------------------
BOCA = [(808, 640), (806, 590), (722, 598), (702, 603), (700, 628), (672, 624), (668, 590), (645, 576), (626, 601), (604, 596), (600, 556), (545, 510)]
CABECA_P = poli((270, 300), (402, 298), (432, 242), (475, 178), (525, 172), (570, 177), (618, 192), (660, 240), (705, 300), (920, 300), (920, 640), *BOCA, (516, 542), (506, 625), (250, 640))
CABECA = sil & CABECA_P & ~azul
QUEIXO_P = poli(*BOCA[::-1], (720, 662), (650, 656), (610, 648), (510, 648), (516, 542))
QUEIXO = sil & QUEIXO_P & ~azul
LENCO_P = poli((235, 540), (560, 590), (680, 650), (640, 690), (400, 770), (270, 770))
LENCO = sil & LENCO_P & azul
TRONCO_P = poli((402, 742), (360, 820), (297, 935), (280, 1000), (320, 1090), (440, 1135), (560, 1125), (690, 1050), (712, 932), (706, 880), (714, 800), (662, 730), (640, 640), (400, 640))
TRONCO = sil & TRONCO_P & creme & ~azul & ~CABECA & ~QUEIXO
TRONCO = maior(ndi.binary_closing(TRONCO, iterations=3) & sil)
BRACO_E_P = poli((300, 712), (402, 742), (360, 820), (297, 935), (285, 942), (300, 1020), (140, 1030), (85, 1000), (85, 880), (220, 755))
BRACO_D_P = poli((662, 685), (770, 730), (930, 940), (910, 1040), (830, 1040), (760, 985), (712, 934), (706, 880), (714, 800), (662, 730))
# O ombro é pelo de verdade: o braço fica sobre o tronco, e o corte cai numa curva redonda em volta da articulação.
BRACO_E = sil & (BRACO_E_P | (elipse(345, 790, 62) & (poli((250, 720), (410, 720), (420, 860), (250, 860))))) & ~azul
BRACO_D = sil & (BRACO_D_P | elipse(690, 775, 58)) & ~azul & ~QUEIXO
RABO_P = poli((350, 985), (290, 985), (90, 1040), (60, 1255), (305, 1245), (305, 1205), (325, 1150), (338, 1080))
RABO = sil & RABO_P & ~TRONCO & ~BRACO_E
PERNA_F_P = poli((335, 1030), (470, 1030), (455, 1125), (400, 1125), (392, 1290), (497, 1370), (497, 1530), (140, 1530), (160, 1290), (300, 1235), (305, 1205), (325, 1150), (338, 1080))
PERNA_F = sil & PERNA_F_P & ~TRONCO
PERNA_T_P = poli((498, 1040), (690, 1040), (652, 1290), (850, 1370), (850, 1530), (497, 1530), (497, 1370), (518, 1280), (526, 1100))
PERNA_T = sil & PERNA_T_P & ~TRONCO & ~PERNA_F
ORELHA_F = sil & poli((280, 0), (482, 0), (475, 178), (432, 242), (402, 298), (330, 305), (285, 303))
ORELHA_T = sil & poli((490, 0), (650, 0), (650, 205), (618, 192), (570, 177), (525, 172), (500, 172))
# rosto
redondo = lambda m, s=6.0: ndi.gaussian_filter(m.astype(np.float32), s) > 0.5
OLHO_P = redondo(poli((506, 300), (514, 270), (545, 250), (580, 252), (596, 266), (606, 300), (596, 340), (556, 358), (524, 346), (508, 324)))
OLHOL_P = redondo(poli((612, 231), (646, 229), (668, 256), (686, 302), (642, 308), (618, 284), (608, 258)), 4.0)
BROW_P = poli((496, 282), (504, 255), (526, 226), (556, 223), (559, 236), (533, 247), (516, 267), (503, 285))
BROWL_P = poli((598, 199), (620, 200), (645, 225), (641, 233), (620, 217), (598, 211))
luma = suave.mean(axis=2)
def conta(cx, cy, rx, ry):
    return ndi.binary_dilation(elipse(cx, cy, rx, ry) & (luma < 92), iterations=2)
CONTA = conta(575, 295, 22, 22)
CONTAL = conta(651, 276, 18, 22)

OCO = {
    'rabo': poli((350, 985), (338, 1080), (305, 1205), (362, 1205), (385, 1130), (385, 1000)),
    'pernaF': elipse(398, 1045, 56, 58) & poli((345, 980), (470, 980), (470, 1110), (345, 1110)),
    'pernaT': elipse(585, 1035, 62, 52),
    'tronco': (poli((300, 640), (650, 640), (640, 690), (400, 760), (300, 760)) & (LENCO | CABECA | QUEIXO)) | (elipse(345, 790, 62) & BRACO_E) | (elipse(690, 775, 58) & BRACO_D),
    'lenco': poli((350, 572), (590, 618), (640, 648), (600, 660), (330, 690)) & (LENCO | CABECA | QUEIXO),
    'orelhaF': poli((340, 298), (402, 295), (440, 236), (478, 175), (492, 240), (445, 345), (350, 350)),
    'orelhaT': poli((505, 168), (625, 192), (628, 245), (510, 232)),
    'queixo': poli(*[(x, y - 14) for x, y in BOCA[1:][::-1]], *BOCA[1:]) | poli((510, 500), (560, 520), (560, 598), (505, 606)),
}
PARTES = {
    'rabo': RABO, 'pernaT': PERNA_T, 'pernaF': PERNA_F, 'tronco': TRONCO, 'bracoT': BRACO_E, 'bracoF': BRACO_D, 'lenco': LENCO,
    'orelhaT': ORELHA_T, 'orelhaF': ORELHA_F, 'queixo': QUEIXO, 'cabeca': CABECA,
}

# ---- preenchimentos do rosto: pelo clonado sob olhos e sobrancelhas ---------------------------------------
def clonar(base, m, dx, dy, pena=4.0):
    """Cobre m com o pelo deslocado de (dx, dy), com borda macia."""
    a = np.clip(ndi.gaussian_filter(ndi.binary_dilation(m, iterations=3).astype(np.float32), pena), 0, 1); a = np.clip(a * 1.6, 0, 1)[..., None]
    fonte = np.roll(np.roll(base, -dy, axis=0), -dx, axis=1)
    return base * (1 - a) + fonte * a

rosto = rgb.copy()
rosto = clonar(rosto, ndi.binary_dilation(BROW_P, iterations=5), 70, 190)
rosto = clonar(rosto, ndi.binary_dilation(BROWL_P, iterations=4), -20, 220)
# embaixo do olho: pálpebra fechada, do tom da pálpebra costurada, com a linha dos cílios
PALPEBRA = np.array([186, 163, 132], np.float32)
def pintar_palpebra(base, m, cil):
    tom = PALPEBRA + (ndi.gaussian_filter(np.random.default_rng(7).normal(0, 1, (H, W)), 1.1) * 26)[..., None]
    a = ndi.gaussian_filter(ndi.binary_erosion(m, iterations=2).astype(np.float32), 1.2)[..., None]
    base = base * (1 - a) + tom * a
    c = ndi.gaussian_filter(cil.astype(np.float32), 0.9)[..., None] * 0.85
    return base * (1 - c) + np.array([78, 62, 52], np.float32) * c
LINHA = poli((514, 322), (556, 346), (596, 318), (596, 323), (556, 352), (514, 328))
LINHAL = poli((624, 285), (645, 296), (678, 290), (678, 295), (645, 302), (624, 290))
rosto = pintar_palpebra(rosto, OLHO_P, LINHA)
rosto = pintar_palpebra(rosto, OLHOL_P, LINHAL)
# olho sem a conta: marfim contínuo por baixo, a conta anda sobre ele
ind = ndi.distance_transform_edt(ndi.binary_dilation(CONTA | CONTAL, iterations=2), return_distances=False, return_indices=True)
olhos = rgb[ind[0], ind[1]]

ruido = np.random.default_rng(3)

def montar(nome, visivel, oco, fonte):
    vis = maior(ndi.binary_opening(visivel, iterations=1))
    masc = vis | (oco if oco is not None else False)
    masc = maior(ndi.binary_fill_holes(ndi.gaussian_filter(masc.astype(np.float32), 1.1) > 0.5))
    idx = ndi.distance_transform_edt(~vis, return_distances=False, return_indices=True)
    cor = fonte[idx[0], idx[1]]
    # o trecho escondido não pode ser liso: leva a textura de pelo do que está mais perto
    fora = masc & ~vis
    if fora.any():
        grao = ndi.gaussian_filter(ruido.normal(0, 1, (H, W)), 1.0) * 22
        cor = cor.copy(); cor[fora] += grao[fora][:, None]
    return masc, np.clip(cor, 0, 255)

def contorno(m, tol=0.85):
    """Segue as arestas entre pixel dentro e fora; devolve o laço mais longo, simplificado (RDP)."""
    arestas = {}
    ys, xs = np.nonzero(m)
    def add(a, b): arestas.setdefault(a, []).append(b)
    for y, x in zip(ys.tolist(), xs.tolist()):
        if y == 0 or not m[y - 1, x]: add((x, y), (x + 1, y))
        if x == W - 1 or not m[y, x + 1]: add((x + 1, y), (x + 1, y + 1))
        if y == H - 1 or not m[y + 1, x]: add((x + 1, y + 1), (x, y + 1))
        if x == 0 or not m[y, x - 1]: add((x, y + 1), (x, y))
    melhor = []
    while arestas:
        ini = next(iter(arestas)); laco = [ini]; p = ini
        while True:
            prox = arestas[p].pop()
            if not arestas[p]: del arestas[p]
            if prox == ini: break
            laco.append(prox); p = prox
        if len(laco) > len(melhor): melhor = laco
    pts = np.array(melhor, np.float32)
    # suaviza a escada de pixels antes de simplificar
    k = 5; pts = np.stack([np.convolve(np.r_[pts[-k:, i], pts[:, i], pts[:k, i]], np.ones(2 * k + 1) / (2 * k + 1), 'valid') for i in (0, 1)], 1)
    def rdp(a):
        if len(a) < 3: return a
        ini, fim = a[0], a[-1]; v = fim - ini; n = np.hypot(*v) or 1
        d = np.abs(v[0] * (a[:, 1] - ini[1]) - v[1] * (a[:, 0] - ini[0])) / n
        i = int(np.argmax(d))
        if d[i] <= tol: return np.array([ini, fim])
        return np.vstack([rdp(a[:i + 1])[:-1], rdp(a[i:])])
    meio = len(pts) // 2
    out = np.vstack([rdp(pts[:meio + 1])[:-1], rdp(pts[meio:])[:-1]])
    return [[round(float(x), 1), round(float(y), 1)] for x, y in out]

fontes = {k: rgb for k in PARTES}; fontes['cabeca'] = rosto
pecas = []
def barriga(cor, m, dx, dy):
    if not m.any(): return cor
    ys, xs = np.nonzero(m); cor = cor.copy(); cor[ys, xs] = rgb[np.clip(ys + dy, 0, H - 1), np.clip(xs + dx, 0, W - 1)]; return cor
for nome, vis in PARTES.items():
    masc, cor = montar(nome, vis, OCO.get(nome), fontes[nome])
    if nome == 'tronco':
        fora = masc & ~ndi.binary_opening(vis, iterations=1)
        cor = barriga(cor, fora & (np.mgrid[:H, :W][1] < 450), 130, 190)
        cor = barriga(cor, fora & (np.mgrid[:H, :W][1] >= 450) & (np.mgrid[:H, :W][1] < 620), -10, 310)
        cor = barriga(cor, fora & (np.mgrid[:H, :W][1] >= 620), -190, 190)
        cor = cor.copy(); cor[fora] *= 0.84  # sob o lenço e os braços é sombra
    pecas.append((nome, masc, cor))

def extra(nome, m, fonte):
    masc = maior(ndi.gaussian_filter(m.astype(np.float32), 0.8) > 0.5)
    idx = ndi.distance_transform_edt(~masc, return_distances=False, return_indices=True)
    return nome, masc, np.clip(fonte[idx[0], idx[1]], 0, 255)
# pescoço: fica sob o tronco e não muda de tamanho, para o peito murchar sem abrir um vão sob o lenço
PESCOCO = poli((300, 640), (660, 640), (690, 760), (600, 830), (400, 830), (285, 770)) & (sil | LENCO)
pecas.append(extra('pescoco', PESCOCO, np.clip(np.roll(np.roll(rgb, -230, axis=0), 20, axis=1) * 0.74, 0, 255)))
pecas.append(extra('olho', OLHO_P, olhos)); pecas.append(extra('olhoLonge', OLHOL_P, olhos))
pecas.append(extra('conta', CONTA, rgb)); pecas.append(extra('contaLonge', CONTAL, rgb))
pecas.append(extra('sobr', BROW_P, rgb)); pecas.append(extra('sobrLonge', BROWL_P, rgb))

# bochecha cheia: o próprio focinho mais claro no alto e sombreado embaixo, com rubor; a borda se dissolve no pelo
CB = (612, 452); RB = 118
yy, xx = np.mgrid[:H, :W]; dist = np.hypot(xx - CB[0], (yy - CB[1]) * 1.04) / RB
disco = dist <= 1
idx = ndi.distance_transform_edt(~(sil & CABECA), return_distances=False, return_indices=True)
bo = rgb[idx[0], idx[1]].copy()
luz = (1.13 - 0.28 * np.clip((yy - CB[1] + RB * 0.35) / (RB * 1.35), 0, 1) ** 1.6)[..., None]
bo = bo * luz
ru = np.exp(-(((xx - CB[0] + 6) / 56) ** 2 + ((yy - CB[1] - 20) / 38) ** 2))[..., None] * 0.6
bo = bo * (1 - ru) + (bo * 0.45 + np.array([246, 130, 150], np.float32) * 0.55) * ru
bo_a = np.clip((1 - dist) / 0.32, 0, 1) ** 1.4
pecas.append(extra('bochecha', disco, np.clip(bo, 0, 255)))
# roxo de esforço: o rosto inteiro, no contorno exato da cabeça, para a tinta nunca vazar. O creme e o nariz quase não mudam.
roxo_m = maior(ndi.gaussian_filter(CABECA.astype(np.float32), 0.8) > 0.5)
roxo = rosto.mean(axis=2, keepdims=True) * np.array([0.9, 0.42, 1.0], np.float32) * 1.08
pelo_cinza = ndi.binary_opening(CABECA & ~creme & (luma > 80) & ~poli((250, 370), (510, 370), (510, 640), (250, 640)), iterations=3)
roxo_a = np.clip(ndi.gaussian_filter(pelo_cinza.astype(np.float32), 16.0) * 1.15, 0, 0.56) * np.clip(ndi.gaussian_filter(pelo_cinza.astype(np.float32), 5.0) * 2, 0, 1)
roxo_a *= 1 - np.clip(ndi.gaussian_filter((CABECA & (luma < 80)).astype(np.float32), 3.0) * 2.5, 0, 1)
pecas.append(('roxo', roxo_m, np.clip(roxo, 0, 255)))

# ---- atlas ----------------------------------------------------------------------------------------------
PAD = 10
caixas = []
for nome, masc, cor in pecas:
    ys, xs = np.nonzero(masc); caixas.append((nome, max(0, xs.min() - PAD), max(0, ys.min() - PAD), min(W, xs.max() + PAD + 1), min(H, ys.max() + PAD + 1), masc, cor))
caixas.sort(key=lambda c: -(c[4] - c[2]))
atlas = np.zeros((ATLAS, ATLAS, 4), np.uint8); atlas[..., 3] = 255
x = y = 4; alt = 0; sai = {}
for nome, x0, y0, x1, y1, masc, cor in caixas:
    w, h = x1 - x0, y1 - y0
    if x + w + 4 > ATLAS: x = 4; y += alt + 4; alt = 0
    if y + h + 4 > ATLAS: sys.exit('atlas pequeno')
    idx = ndi.distance_transform_edt(~masc, return_distances=False, return_indices=True)
    t = cor[idx[0], idx[1]]
    atlas[y:y + h, x:x + w, :3] = t[y0:y1, x0:x1].astype(np.uint8)
    if nome == 'roxo': atlas[y:y + h, x:x + w, 3] = (roxo_a[y0:y1, x0:x1] * 255).astype(np.uint8)
    if nome == 'bochecha': atlas[y:y + h, x:x + w, 3] = (bo_a[y0:y1, x0:x1] * 255).astype(np.uint8)
    sai[nome] = {'ox': int(x0 - x), 'oy': int(y0 - y), 'contorno': contorno(masc, 0.55 if nome in ('olho', 'olhoLonge', 'conta', 'contaLonge', 'sobr', 'sobrLonge') else 0.9)}
    x += w + 4; alt = max(alt, h)
base = int(np.nonzero(sil)[0].max() + 1); topo = int(np.nonzero(sil)[0].min())
(RAIZ / 'src/lobo-pecas.json').write_text(json.dumps({'atlas': ATLAS, 'topo': topo, 'base': base, 'pecas': sai}, separators=(',', ':')))
subprocess.run(['magick', '-size', f'{ATLAS}x{ATLAS}', '-depth', '8', 'rgba:-', '-define', 'webp:exact=true', '-define', 'webp:method=6', '-quality', '92', str(RAIZ / 'src/lobo-atlas.webp')], input=atlas.tobytes(), check=True)
print('peças', len(sai), 'vértices', sum(len(v['contorno']) for v in sai.values()), 'topo', topo, 'base', base, 'atlas até y', y + alt)
if len(sys.argv) > 1:
    # vista explodida para conferir os cortes
    fundo = np.tile(np.array([111, 168, 160], np.float32), (H, W, 1))
    pal = [(255,80,80),(80,255,80),(80,80,255),(255,255,80),(255,80,255),(80,255,255),(255,160,60),(160,255,60),(60,160,255),(255,255,255),(0,0,0)]
    ver = fundo.copy()
    for i, (nome, masc, cor) in enumerate(pecas[:11]):
        ver[masc] = cor[masc] * 0.72 + np.array(pal[i], np.float32) * 0.28
    subprocess.run(['magick', '-size', f'{W}x{H}', '-depth', '8', 'rgb:-', '-quality', '85', sys.argv[1] + '/cortes.jpg'], input=np.clip(ver, 0, 255).astype(np.uint8).tobytes(), check=True)
    v2 = fundo.copy(); v2[CABECA_P & sil] = rosto[CABECA_P & sil]
    subprocess.run(['magick', '-size', f'{W}x{H}', '-depth', '8', 'rgb:-', '-crop', '620x620+280+60', '-quality', '85', sys.argv[1] + '/rosto.jpg'], input=np.clip(v2, 0, 255).astype(np.uint8).tobytes(), check=True)

// Personagens de recorte: cada parte móvel é um rig; o resto se funde em poucas chamadas de desenho.
import { piece, rig, group, ellipse, rrect, blob, stroke, spiral, flame, poly, pat, star, shade } from './paper.js';
import { recorte, tinta, pxLobo, U_LOBO, BASE_LOBO } from './lobo-recorte.js';

const pilha = (parent, passo = 0.007, inicio = 0) => { let z = inicio; const f = (pts, paint, o = {}) => { z += passo; return piece(parent, pts, paint, { t: 0.008, z, ...o }); }; f.z = () => z; f.salto = (d) => { z += d; }; return f; };

const ROUPAS = {
  pipo: { pele: '#f7a7b5', pele2: '#ed8ea2', estampa: pat('dots', '#f7a7b5', '#f9b8c3', 0.22), roupa: pat('gingham', '#ffd24f', '#f39c2d', 0.2), alca: '#c9702a', botao: '#8a4a1c' },
  tico: { pele: '#f4a0a8', pele2: '#e68593', estampa: pat('stripes', '#f4a0a8', '#f7b1b6', 0.24), roupa: pat('diagonal', '#5fc276', '#46a862', 0.2), alca: '#2f7a48', botao: '#fff4d6' },
  bento: { pele: '#f29cb2', pele2: '#df7f9a', estampa: pat('chevron', '#f29cb2', '#f6afc0', 0.26), roupa: pat('vstripes', '#4f86e0', '#3f72c8', 0.22), alca: '#2a4f99', botao: '#ffd24f' },
  mae: { pele: '#f39cad', pele2: '#e37f96', estampa: pat('dots', '#f39cad', '#f7b5c1', 0.22), roupa: pat('dots', '#b66ae0', '#d59af0', 0.22), alca: '#7d3fb0', botao: '#fff' },
};

/** Porquinho: y=0 nos pés, altura ~1. tipo: pipo | tico | bento | mae. */
export function porco(parent, tipo, { x = 0, y = 0, z = 0, s = 1, virado = false } = {}) {
  const c = ROUPAS[tipo];
  const root = rig(parent, `porco-${tipo}`, { x, y, z, s, sx: virado ? -s : s });
  const corpo = rig(root, 'corpo');
  const f = pilha(corpo);
  // rabo e pernas atrás
  const rabo = rig(corpo, 'rabo', { x: 0.27, y: 0.34, z: 0.002 });
  piece(rabo, spiral(0.075, 1.5, 0.03), c.pele2, { t: 0.008 });
  const pernaE = rig(corpo, 'pernaE', { x: -0.125, y: 0.27, z: 0.006 });
  const pernaD = rig(corpo, 'pernaD', { x: 0.125, y: 0.27, z: 0.006 });
  for (const p of [pernaE, pernaD]) {
    piece(p, rrect(0.135, 0.27, 0.05, 0, -0.13), c.pele, { t: 0.008 });
    piece(p, rrect(0.16, 0.075, 0.03, 0, -0.245), '#6b3a4a', { t: 0.008, z: 0.006 });
  }
  f.salto(0.01);
  const bracoT = rig(corpo, 'bracoE', { x: -0.255, y: 0.56, z: f.z() + 0.001, rot: -0.2 });
  piece(bracoT, rrect(0.105, 0.3, 0.05, 0, -0.13), c.pele, { t: 0.008 });
  piece(bracoT, ellipse(0.065, 0.06, 0, -0.27, 14), c.pele2, { t: 0.008, z: 0.004 });
  f.salto(0.01);
  // tronco
  f(blob([[-0.28, 0.46], [-0.26, 0.64], [0, 0.73], [0.26, 0.64], [0.28, 0.46], [0.25, 0.27], [0, 0.2], [-0.25, 0.27]]), c.estampa, { name: 'tronco' });
  if (tipo === 'mae') {
    f(blob([[-0.25, 0.62], [0, 0.68], [0.25, 0.62], [0.31, 0.32], [0.36, 0.11], [0, 0.07], [-0.36, 0.11], [-0.31, 0.32]]), c.roupa);
    f(blob([[-0.16, 0.5], [0.16, 0.5], [0.21, 0.13], [0, 0.09], [-0.21, 0.13]]), pat('plain', '#fff7ea'), { edge: '#f2d7b0' });
    f(ellipse(0.058, 0.045, 0, 0.38, 14), '#ef7fa0');
    f(ellipse(0.058, 0.045, 0, 0.27, 14), '#ef7fa0');
  } else {
    // macacão
    f(blob([[-0.26, 0.42], [0, 0.44], [0.26, 0.42], [0.25, 0.27], [0, 0.17], [-0.25, 0.27]]), c.roupa);
    f(rrect(0.27, 0.2, 0.03, 0, 0.5), c.roupa);
    f(stroke([[-0.12, 0.58], [-0.17, 0.72]], 0.05), c.alca, { jitter: 0 });
    f(stroke([[0.12, 0.58], [0.17, 0.72]], 0.05), c.alca, { jitter: 0 });
    f(ellipse(0.024, 0.024, -0.11, 0.56, 10), c.botao, { jitter: 0 });
    f(ellipse(0.024, 0.024, 0.11, 0.56, 10), c.botao, { jitter: 0 });
    f(rrect(0.13, 0.085, 0.015, 0, 0.47), pat('plain', shade(c.alca, 0.08)));
  }
  f.salto(0.006);
  const bracoF = rig(corpo, 'bracoD', { x: 0.255, y: 0.56, z: f.z() + 0.001, rot: 0.2 });
  piece(bracoF, rrect(0.105, 0.3, 0.05, 0, -0.13), c.pele, { t: 0.008 });
  piece(bracoF, ellipse(0.065, 0.06, 0, -0.27, 14), c.pele2, { t: 0.008, z: 0.004 });
  f.salto(0.012);
  // cabeça
  const cabeca = rig(corpo, 'cabeca', { x: 0, y: 0.68, z: f.z() });
  const h = pilha(cabeca);
  const orelhaE = rig(cabeca, 'orelhaE', { x: -0.205, y: 0.28, z: 0.001, rot: 0.25 });
  const orelhaD = rig(cabeca, 'orelhaD', { x: 0.205, y: 0.28, z: 0.001, rot: -0.25 });
  for (const o of [orelhaE, orelhaD]) {
    piece(o, blob([[-0.085, -0.03], [0.085, -0.03], [0.065, 0.09], [0, 0.165], [-0.065, 0.09]], 5), c.pele, { t: 0.008 });
    piece(o, blob([[-0.045, -0.01], [0.045, -0.01], [0.03, 0.07], [0, 0.115], [-0.03, 0.07]], 4), c.pele2, { t: 0.008, z: 0.005 });
  }
  h.salto(0.008);
  h(ellipse(0.315, 0.275, 0, 0.14, 40), c.estampa, { name: 'rosto' });
  h(ellipse(0.075, 0.05, -0.215, 0.045, 18), '#f77f98', { jitter: 0.001 });
  h(ellipse(0.075, 0.05, 0.215, 0.045, 18), '#f77f98', { jitter: 0.001 });
  // olhos piscam
  const olhos = rig(cabeca, 'olhos', { y: 0.175, z: h.z() + 0.001 });
  for (const sx of [-1, 1]) {
    piece(olhos, ellipse(0.078, 0.092, sx * 0.118, 0, 24), '#fffdf4', { t: 0.006, edge: '#e8d9c4', jitter: 0.001 });
    piece(olhos, ellipse(0.054, 0.066, sx * 0.112, -0.008, 22), '#2d1c2f', { t: 0.006, z: 0.005, jitter: 0 });
    piece(olhos, ellipse(0.018, 0.021, sx * 0.112 + 0.02, 0.022, 10), '#ffffff', { t: 0.004, z: 0.01, jitter: 0 });
  }
  h.salto(0.012);
  // focinho
  h(ellipse(0.135, 0.098, 0, 0.03, 30), c.pele2, { edge: '#fbd0d6', jitter: 0.001 });
  h(ellipse(0.024, 0.036, -0.048, 0.035, 12), '#9c4560', { jitter: 0 });
  h(ellipse(0.024, 0.036, 0.048, 0.035, 12), '#9c4560', { jitter: 0 });
  h(stroke([[-0.09, -0.085], [-0.035, -0.112], [0.035, -0.112], [0.09, -0.085]], 0.018), '#7c2c49', { jitter: 0 });
  // boca: fechada, sobra o sorriso de sempre; aberta só enquanto o porquinho fala
  const boca = rig(cabeca, 'boca', { y: -0.098, z: h.z() + 0.002, sy: 0.001 });
  piece(boca, ellipse(0.062, 0.058, 0, -0.022, 18), '#7c2c49', { t: 0.004, jitter: 0 });
  piece(boca, ellipse(0.04, 0.026, 0, -0.05, 14), '#ef7fa0', { t: 0.002, z: 0.003, jitter: 0 });
  const refs = { root, corpo, cabeca, boca, bracoE: bracoT, bracoD: bracoF, olhos, orelhaE, orelhaD, rabo, pernaE, pernaD };
  // acessórios
  if (tipo === 'pipo') {
    const ch = rig(cabeca, 'chapeu', { y: 0.33, z: h.z() + 0.003, rot: -0.08 });
    piece(ch, ellipse(0.31, 0.055, 0, -0.01, 26), pat('straw', '#f2cf63', '#c7972f', 0.2), { t: 0.008, edge: '#c7972f' });
    piece(ch, blob([[-0.15, 0.0], [0.15, 0.0], [0.13, 0.12], [0, 0.15], [-0.13, 0.12]], 5), pat('straw', '#f6d873', '#c7972f', 0.2), { t: 0.008, z: 0.004, edge: '#c7972f' });
    piece(ch, rrect(0.3, 0.038, 0.01, 0, 0.022), '#e0446a', { t: 0.006, z: 0.009 });
    refs.chapeu = ch;
  } else if (tipo === 'tico') {
    const ch = rig(cabeca, 'chapeu', { y: 0.31, z: h.z() + 0.003, rot: 0.06 });
    piece(ch, blob([[-0.2, -0.02], [0.2, -0.02], [0.17, 0.1], [0, 0.15], [-0.17, 0.1]], 5), pat('stripes', '#e84a5f', '#c8384c', 0.14), { t: 0.008 });
    piece(ch, blob([[0.08, -0.05], [0.34, -0.06], [0.33, -0.015], [0.08, 0.01]], 3), '#a82c3e', { t: 0.008, z: 0.004 });
    refs.chapeu = ch;
  } else if (tipo === 'bento') {
    const ch = rig(cabeca, 'chapeu', { y: 0.31, z: h.z() + 0.003 });
    piece(ch, blob([[-0.23, -0.02], [0.23, -0.02], [0.2, 0.09], [0, 0.17], [-0.2, 0.09]], 5), pat('plain', '#ffc531'), { t: 0.008, edge: '#d19712' });
    piece(ch, rrect(0.5, 0.04, 0.015, 0, -0.02), '#f0ae1f', { t: 0.008, z: 0.004 });
    piece(ch, rrect(0.05, 0.13, 0.015, 0, 0.08), '#f0ae1f', { t: 0.006, z: 0.006 });
    refs.chapeu = ch;
  } else if (tipo === 'mae') {
    const flor = rig(cabeca, 'flor', { x: 0.17, y: 0.34, z: h.z() + 0.003 });
    piece(flor, star(7, 0.09, 0.055), '#ff7fa8', { t: 0.006 }); piece(flor, ellipse(0.032, 0.032, 0, 0, 12), '#ffd24f', { t: 0.006, z: 0.004 });
    h(stroke([[-0.09, 0.27], [-0.14, 0.255]], 0.012), '#2d1c2f', { jitter: 0 });
    h(stroke([[0.09, 0.27], [0.14, 0.255]], 0.012), '#2d1c2f', { jitter: 0 });
  }
  const fase = Math.abs(x * 7 + z * 3) % 6.28;
  // A respiração soma ao que a linha do tempo escreveu neste quadro: antes, ela apagava os pulos e os gestos de cabeça.
  const soma = { y: 0, yEscrito: corpo.position.y, yBase: corpo.position.y, z: 0, zEscrito: cabeca.rotation.z, zBase: cabeca.rotation.z };
  refs.idle = (t) => {
    if (corpo.position.y !== soma.yEscrito) soma.yBase = corpo.position.y;
    if (cabeca.rotation.z !== soma.zEscrito) soma.zBase = cabeca.rotation.z;
    soma.yEscrito = corpo.position.y = soma.yBase + Math.abs(Math.sin(t * 1.5 + fase)) * 0.011;
    soma.zEscrito = cabeca.rotation.z = soma.zBase + Math.sin(t * 0.9 + fase) * 0.035;
    const pisca = (t * 0.37 + fase) % 1; olhos.scale.y = pisca < 0.035 ? 0.12 : 1;
    orelhaE.rotation.z = 0.25 + Math.sin(t * 1.3 + fase) * 0.05; orelhaD.rotation.z = -0.25 - Math.sin(t * 1.4 + fase) * 0.05;
  };
  return refs;
}

/** Só a cabeça, para espiar da janela. */
export function porcoNaJanela(parent, tipo, { x = 0, y = 0, z = 0, s = 1 } = {}) {
  const p = porco(parent, tipo, { x, y: y - 0.7 * s, z, s });
  p.bracoE.visible = false; p.bracoD.visible = false; p.pernaE.visible = false; p.pernaD.visible = false; p.rabo.visible = false;
  return p;
}

/**
 * Lobo olhando para +x: a pelúcia da referência de Alan, recortada em peças (`tools/lobo_pecas.py`). y=0 nos pés.
 * Os ângulos de descanso são os que `src/cenas.js` espera; o `grupo` interno devolve cada peça à pose da imagem.
 */
export function lobo(parent, { x = 0, y = 0, z = 0, s = 1, virado = false } = {}) {
  const root = rig(parent, 'lobo', { x, y, z, s, sx: virado ? -s : s });
  const corpo = rig(root, 'corpo');
  const O = [495, BASE_LOBO];
  const em = (pai, nome, px, opts = {}) => { const [lx, ly] = pxLobo(px, pai.origem); const r = rig(pai, nome, { x: lx, y: ly, ...opts }); r.origem = px; return r; };
  corpo.origem = O;
  const peca = (pai, nome, z = 0, opts = {}) => recorte(pai, nome, pai.origem, { z, ...opts });
  // Peça em repouso num ângulo: o grupo interno anula o ângulo, para a imagem casar com a pose de descanso.
  const girado = (pai, rot) => { const g = group(pai, { rot: -rot }); g.origem = pai.origem; return g; };

  const rabo = em(corpo, 'rabo', [335, 1070], { z: 0.001, rot: 0.5 });
  peca(girado(rabo, 0.5), 'rabo');
  const [cx, cy] = pxLobo([118, 1148], rabo.origem); const a = -0.5;
  const chama = rig(rabo, 'chama', { x: cx * Math.cos(a) - cy * Math.sin(a), y: cx * Math.sin(a) + cy * Math.cos(a), z: 0.012, rot: 1.25, s: 0.001 });
  piece(chama, flame(0.3, 0.44), '#f35a30', { t: 0.006, glow: true }); piece(chama, flame(0.19, 0.29), '#ffb02e', { t: 0.006, z: 0.004, glow: true }); piece(chama, flame(0.09, 0.15), '#fff0a0', { t: 0.006, z: 0.008, glow: true });

  const pernaT = em(corpo, 'pernaT', [590, 1085], { z: 0.008 }); peca(pernaT, 'pernaT');
  const pernaF = em(corpo, 'pernaF', [395, 1085], { z: 0.015 }); peca(pernaF, 'pernaF');
  const pescoco = group(corpo, { z: 0.02 }); pescoco.origem = O; recorte(pescoco, 'pescoco', O);
  const peito = em(corpo, 'peito', [500, 900], { z: 0.024 }); peca(peito, 'tronco');
  const bracoT = em(corpo, 'bracoT', [345, 790], { z: 0.036, rot: -0.35 }); peca(girado(bracoT, -0.35), 'bracoT');
  const bracoF = em(corpo, 'bracoF', [690, 775], { z: 0.036, rot: 0.25 }); peca(girado(bracoF, 0.25), 'bracoF');
  const lenco = em(corpo, 'lenco', [470, 660], { z: 0.05 }); peca(lenco, 'lenco');

  // cabeça: o y de descanso, 0,87, é o que as cenas devolvem ao terminar um gesto
  const cabeca = rig(corpo, 'cabeca', { x: pxLobo([480, 0], O)[0], y: 0.87, z: 0.066 });
  cabeca.origem = [480, O[1] - 0.87 / U_LOBO];
  const orelhaF = em(cabeca, 'orelhaF', [395, 290], { z: 0.0005 }); peca(orelhaF, 'orelhaF');
  const orelhaT = em(cabeca, 'orelhaT', [565, 185], { z: 0.0005 }); peca(orelhaT, 'orelhaT');
  const fundoBoca = em(cabeca, 'fundoBoca', [680, 590], { z: 0.008, sy: 0.35 });
  piece(fundoBoca, blob([[-0.15, 0.03], [0.11, 0.04], [0.115, -0.015], [0.05, -0.065], [-0.1, -0.04]], 6), '#4e3136', { t: 0.004, edge: '#4e3136' });
  piece(fundoBoca, ellipse(0.055, 0.019, 0.025, -0.038, 14), '#e8708c', { t: 0.004, z: 0.003 });
  const queixo = em(cabeca, 'queixo', [525, 548], { z: 0.014 }); peca(queixo, 'queixo');
  const rosto = group(cabeca, { z: 0.022 }); rosto.origem = cabeca.origem; recorte(rosto, 'cabeca', rosto.origem, { name: 'rosto' });
  // roxo de esforço: tinta translúcida entre o pelo e os olhos
  // A cena anima a escala de `roxo`; aqui ela vira a força da tinta, sempre no contorno da cabeça.
  const roxo = rig(cabeca, 'roxo', { s: 0.001 });
  const tintaRoxa = tinta(rosto, 'roxo', rosto.origem, { z: 0.009, propria: true }); tintaRoxa.material.opacity = 0; tintaRoxa.visible = false;
  const bochecha = em(cabeca, 'bochecha', [612, 452], { z: 0.032, s: 0.001 }); tinta(bochecha, 'bochecha', bochecha.origem);
  const olhoLonge = em(cabeca, 'olhoLonge', [647, 268], { z: 0.034 }); peca(olhoLonge, 'olhoLonge', 0, { t: 0.004 });
  const olho = em(cabeca, 'olho', [554, 303], { z: 0.036 }); peca(olho, 'olho', 0, { t: 0.004 });
  // A cena move a pupila em unidades do olho antigo, maior: aqui o trajeto vale a metade.
  const trilho = (dono, cx, cy) => { const [lx, ly] = pxLobo([cx, cy], dono.origem); const g = group(dono, { x: lx - 0.012, y: ly + 0.004, z: 0.005, s: 0.5 }); g.origem = [cx - 0.012 / U_LOBO, cy + 0.004 / U_LOBO]; return g; };
  const conta = (dono, nome, peca_, cx, cy) => { const r = rig(trilho(dono, cx, cy), nome, { x: 0.024, y: -0.008, s: 2 }); r.origem = [cx, cy]; recorte(r, peca_, r.origem, { t: 0.004 }); return r; };
  const pupila = conta(olho, 'pupila', 'conta', 575, 295);
  const pupilaLonge = conta(olhoLonge, 'pupilaLonge', 'contaLonge', 651, 276);
  const sobr = em(cabeca, 'sobrancelha', [528, 250], { z: 0.042, rot: -0.08 }); peca(girado(sobr, -0.08), 'sobr', 0, { t: 0.004 });
  const sobrLonge = em(cabeca, 'sobrancelhaLonge', [620, 215], { z: 0.04 }); peca(sobrLonge, 'sobrLonge', 0, { t: 0.004 });
  const fase = Math.abs(x * 5 + z * 2) % 6.28;
  const refs = { root, corpo, cabeca, queixo, fundoBoca, peito, bochecha, roxo, rabo, chama, olho, olhoLonge, pupila, sobr, lenco, bracoF, bracoT, pernaF, pernaT, orelhaF, orelhaT };
  refs.idle = (t) => {
    corpo.position.y = Math.sin(t * 1.5 + fase) * 0.006;
    rabo.rotation.z = 0.5 + Math.sin(t * 2.2 + fase) * 0.06;
    const pisca = (t * 0.27 + fase) % 1; const v = pisca < 0.03 ? 0.15 : 1;
    if (olho.scale.y <= 1) { olho.scale.y = v; olhoLonge.scale.y = v; }
    orelhaF.rotation.z = Math.sin(t * 1.1 + fase) * 0.04;
    pupilaLonge.position.x = pupila.position.x; pupilaLonge.position.y = pupila.position.y;
    sobrLonge.rotation.z = (sobr.rotation.z + 0.08) * 0.3; // rente à borda da cabeça: mais que isso, ela sai do contorno
    // Braços para o alto param abertos: a cabeça da pelúcia é grande e, a mais, eles sumiriam atrás dela.
    if (bracoF.rotation.z > 1.35) bracoF.rotation.z = 1.35; if (bracoT.rotation.z < -1.35) bracoT.rotation.z = -1.35;
    tintaRoxa.visible = roxo.scale.x > 0.02; tintaRoxa.material.opacity = Math.min(1, roxo.scale.x); bochecha.visible = bochecha.scale.x > 0.02;
  };
  return refs;
}

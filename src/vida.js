// Vida do cenário: um coletor por cena. Registra objetos uma vez, na montagem, e `idle(t)` os anima sem alocar nada.
//
// Regras do coletor:
// - cada movimento é um deslocamento SOMADO ao repouso guardado no registro (pose, posição ou escala), nunca acumulado:
//   idle(t) é uma função pura de t. Voltar no tempo, pular ou repetir o mesmo t dá o mesmo quadro;
// - em t = 0 (e com `parar(true)`) tudo fica exatamente no repouso: as capturas e os testes de geometria medem a pose de sempre;
// - o desvio máximo de cada movimento é o `amp` pedido (as fases são normalizadas), para o chamador saber a folga que precisa;
// - `idle` repetido com o mesmo t não faz nada (pausa);
// - o quadro só lê arrays montados no registro: sem closures, sem objetos, sem strings novas.
// Não registre uma propriedade que a Timeline da cena também anima no mesmo objeto: as duas se sobrescrevem.

const TAU = Math.PI * 2;
const suave = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const fasePadrao = (n) => (n * 2.399963) % TAU; // ângulo áureo: objetos seguidos não balançam juntos
const norma = (f) => 1 / (1 + Math.abs(Math.sin(f))); // deixa o desvio de (sin(θ + f) − sin f) dentro de ±1

export function criarVida() {
  let n = 0; let ultimo = NaN; let parada = false; let vento = 1;

  // balanca: rotação em torno da origem do objeto
  const bO = [], bE = [], bR = [], bA = [], bW = [], bF = [], bF2 = [], bS1 = [], bN1 = [], bS2 = [], bN2 = [], bL = [];
  // deriva: posição em laço (Lissajous) em torno do ponto de repouso
  const dO = [], dX = [], dY = [], dAx = [], dAy = [], dW = [], dRz = [], dF = [], dF2 = [], dS1 = [], dN1 = [], dS2 = [], dN2 = [];
  // pulsa: escala (uniforme, só x ou só y)
  const pO = [], pE = [], pX = [], pY = [], pA = [], pW = [], pF = [], pS = [], pN = [], pMin = [];
  // gesto: evento periódico (pulo, virar a cabeça) numa propriedade
  const gO = [], gP = [], gR = [], gA = [], gT = [], gD = [], gI = [], gF = [];
  // queda: trajeto que se repete, com atraso, balanço e desvanecer
  const qO = [], qX = [], qY = [], qZ = [], qSx = [], qSy = [], qAlto = [], qT = [], qAt = [], qAx = [], qGiro = [], qV = [], qF = [], qN1 = [], qS1 = [], qN2 = [], qS2 = [];

  const EIXO = { rx: 0, ry: 1, rz: 2 };
  const ESC = { s: 0, sx: 1, sy: 2 };
  const PROP = { x: 0, y: 1, rz: 2, sx: 3, sy: 4 };

  function repouso() {
    for (let i = 0; i < bO.length; i++) { const o = bO[i], e = bE[i]; if (e === 2) o.rotation.z = bR[i]; else if (e === 1) o.rotation.y = bR[i]; else o.rotation.x = bR[i]; }
    for (let i = 0; i < dO.length; i++) { dO[i].position.x = dX[i]; dO[i].position.y = dY[i]; }
    for (let i = 0; i < pO.length; i++) { const o = pO[i]; o.scale.x = pX[i]; o.scale.y = pY[i]; }
    for (let i = 0; i < gO.length; i++) {
      const o = gO[i], p = gP[i];
      if (p === 0) o.position.x = gR[i]; else if (p === 1) o.position.y = gR[i]; else if (p === 2) o.rotation.z = gR[i]; else if (p === 3) o.scale.x = gR[i]; else o.scale.y = gR[i];
    }
    for (let i = 0; i < qO.length; i++) { const o = qO[i]; o.position.x = qX[i]; o.position.y = qY[i]; o.rotation.z = qZ[i]; o.scale.x = qSx[i]; o.scale.y = qSy[i]; }
  }

  const vida = {
    /** Número de objetos registrados. */
    get n() { return n; },
    /** Força geral do vento (0 para, 1 normal). Só escala o balanço. */
    get vento() { return vento; },
    set vento(v) { vento = v; ultimo = NaN; },
    /** parar(true): tudo no repouso e idle() não faz nada (movimento reduzido, leitura, captura). parar(false) volta. */
    parar(sim = true) { parada = !!sim; ultimo = NaN; if (parada) repouso(); },
    repouso,

    /**
     * Balanço em torno da origem do objeto (rotação em `eixo`).
     * amp: desvio máximo em radianos; vel: rad/s; lado: 0 vai e volta, +1 ou −1 só para um lado (encostado na parede; começa no repouso).
     */
    balanca(obj, { amp = 0.025, vel = 1.2, fase = fasePadrao(n), eixo = 'rz', lado = 0 } = {}) {
      const e = EIXO[eixo] ?? 2; const f2 = fase * 1.7;
      bO.push(obj); bE.push(e); bR.push(obj.rotation[eixo === 'rx' ? 'x' : eixo === 'ry' ? 'y' : 'z']); bA.push(amp); bW.push(vel); bF.push(fase); bF2.push(f2);
      bS1.push(Math.sin(fase)); bN1.push(norma(fase)); bS2.push(Math.sin(f2)); bN2.push(norma(f2)); bL.push(lado);
      n++; return obj;
    },
    /**
     * Deriva em laço: x e y se afastam do repouso até ax e ay, em curva fechada (razao 2 faz um oito; 1, uma elipse).
     * Não mexe em z. Para nuvens, borboletas, vagalumes.
     */
    deriva(obj, { ax = 0.03, ay = 0.012, vel = 0.4, razao = 2, fase = fasePadrao(n) } = {}) {
      const f2 = fase + (razao === 1 ? Math.PI / 2 : 0.9);
      dO.push(obj); dX.push(obj.position.x); dY.push(obj.position.y); dAx.push(ax); dAy.push(ay); dW.push(vel); dRz.push(razao); dF.push(fase); dF2.push(f2);
      dS1.push(Math.sin(fase)); dN1.push(norma(fase)); dS2.push(Math.sin(f2)); dN2.push(norma(f2));
      n++; return obj;
    },
    /**
     * Pulsa a escala: fica entre 1 − amp e 1 + amp vezes o repouso (nunca abaixo de `min`). eixo: 's' (uniforme), 'sx' ou 'sy'.
     * Vagalume: amp 0.9, min 0.15.
     */
    pulsa(obj, { amp = 0.1, vel = 2, fase = fasePadrao(n), eixo = 's', min = 0.05 } = {}) {
      pO.push(obj); pE.push(ESC[eixo] ?? 0); pX.push(obj.scale.x); pY.push(obj.scale.y); pA.push(amp); pW.push(vel); pF.push(fase); pS.push(Math.sin(fase)); pN.push(norma(fase)); pMin.push(min);
      n++; return obj;
    },
    /** Bater de asas: a escala `eixo` vai de 1 (aberta, o repouso) até 1 − prof, vel rad/s (14 ≈ 2,2 batidas por segundo). */
    bate(obj, { prof = 0.7, vel = 14, eixo = 'sx' } = {}) {
      return vida.pulsa(obj, { amp: prof, vel, fase: Math.PI / 2, eixo, min: 0.02 }); // fase π/2: (sen − 1)·½ cai de 0 a −1, então a escala vai de 1 a 1 − prof
    },
    /**
     * Gesto que se repete: a cada `periodo` s, durante `dur` s, soma `amp` à propriedade `prop` (x, y, rz) ou multiplica a escala
     * (sx, sy) por 1 + amp. perfil 'pulo' sobe e desce (sen); 'olha' vai, segura e volta. `inicio`: quando começa o primeiro (≥ 0).
     */
    gesto(obj, { prop = 'y', amp = 0.03, periodo = 4, dur = 0.3, inicio = 1, perfil = 'pulo' } = {}) {
      const p = PROP[prop] ?? 1; const ini = Math.min(Math.max(0, inicio), Math.max(0, periodo - dur - 1e-4));
      const r = p === 0 ? obj.position.x : p === 1 ? obj.position.y : p === 2 ? obj.rotation.z : p === 3 ? obj.scale.x : obj.scale.y;
      gO.push(obj); gP.push(p); gR.push(r); gA.push(amp); gT.push(periodo); gD.push(dur); gI.push(ini); gF.push(perfil === 'olha' ? 1 : 0);
      n++; return obj;
    },
    /** Pulinho de passarinho. */
    pulinho(obj, { alt = 0.035, periodo = 5, dur = 0.3, inicio = 1.5 } = {}) { return vida.gesto(obj, { prop: 'y', amp: alt, periodo, dur, inicio, perfil: 'pulo' }); },
    /** Vira a cabeça: prop 'sx' com amp −2 espelha a peça (a cabeça "olha para trás"); 'rz' inclina. */
    olha(obj, { prop = 'sx', amp = -2, periodo = 4, dur = 1.4, inicio = 2 } = {}) { return vida.gesto(obj, { prop, amp, periodo, dur, inicio, perfil: 'olha' }); },
    /**
     * Queda que se repete (folha, pétala): parte do repouso depois de `atraso`, desce `alto` em `periodo` s balançando até ax e girando
     * até `giro` rad; some no fim e volta a nascer no alto. Antes do atraso (e em t = 0) fica parada no repouso, visível.
     */
    queda(obj, { alto = 1, periodo = 7, atraso = 0, ax = 0.06, giro = 0.9, voltas = 2.5, fase = fasePadrao(n) } = {}) {
      qO.push(obj); qX.push(obj.position.x); qY.push(obj.position.y); qZ.push(obj.rotation.z); qSx.push(obj.scale.x); qSy.push(obj.scale.y);
      qAlto.push(alto); qT.push(periodo); qAt.push(atraso); qAx.push(ax); qGiro.push(giro); qV.push(voltas); qF.push(fase);
      qS1.push(Math.sin(fase)); qN1.push(norma(fase)); qS2.push(Math.sin(fase + 1.3)); qN2.push(norma(fase + 1.3));
      n++; return obj;
    },

    /** Uma chamada por quadro com o relógio da cena (segundos). Mesmo t, ou t = 0, ou parada: repouso/nada. */
    idle(t) {
      if (t === ultimo) return;
      ultimo = t;
      if (parada || t === 0) { repouso(); return; }
      const g = vento * (0.675 + 0.325 * Math.sin(t * 0.41)); // rajada lenta, sempre ≤ vento
      for (let i = 0; i < bO.length; i++) {
        const w = bW[i], l = bL[i]; let d;
        if (l === 0) d = ((Math.sin(w * t + bF[i]) - bS1[i]) * bN1[i] + 0.35 * (Math.sin(w * 2.3 * t + bF2[i]) - bS2[i]) * bN2[i]) / 1.35;
        else d = l * ((1 - Math.cos(w * t)) * 0.5 + 0.35 * (1 - Math.cos(w * 2.3 * t)) * 0.5) / 1.35;
        d = bR[i] + bA[i] * g * d; const e = bE[i], o = bO[i];
        if (e === 2) o.rotation.z = d; else if (e === 1) o.rotation.y = d; else o.rotation.x = d;
      }
      for (let i = 0; i < dO.length; i++) {
        const w = dW[i], o = dO[i];
        o.position.x = dX[i] + dAx[i] * (Math.sin(w * t + dF[i]) - dS1[i]) * dN1[i];
        o.position.y = dY[i] + dAy[i] * (Math.sin(w * dRz[i] * t + dF2[i]) - dS2[i]) * dN2[i];
      }
      for (let i = 0; i < pO.length; i++) {
        let m = 1 + pA[i] * (Math.sin(pW[i] * t + pF[i]) - pS[i]) * pN[i]; if (m < pMin[i]) m = pMin[i];
        const e = pE[i], o = pO[i];
        if (e !== 2) o.scale.x = pX[i] * m;
        if (e !== 1) o.scale.y = pY[i] * m;
      }
      for (let i = 0; i < gO.length; i++) {
        const per = gT[i], dur = gD[i]; let k = t - gI[i]; k -= per * Math.floor(k / per); let v = 0;
        if (k < dur) { const u = k / dur; v = gF[i] === 0 ? Math.sin(Math.PI * u) : u < 0.25 ? suave(u * 4) : u > 0.75 ? suave((1 - u) * 4) : 1; }
        const p = gP[i], o = gO[i], r = gR[i] + (p >= 3 ? gR[i] * gA[i] * v : gA[i] * v);
        if (p === 0) o.position.x = r; else if (p === 1) o.position.y = r; else if (p === 2) o.rotation.z = r; else if (p === 3) o.scale.x = r; else o.scale.y = r;
      }
      for (let i = 0; i < qO.length; i++) {
        const o = qO[i]; const k = t - qAt[i];
        if (k <= 0) { o.position.x = qX[i]; o.position.y = qY[i]; o.rotation.z = qZ[i]; o.scale.x = qSx[i]; o.scale.y = qSy[i]; continue; }
        const c = Math.floor(k / qT[i]); const p = k / qT[i] - c; const ang = TAU * qV[i] * p;
        let f = 1; if (c >= 1 && p < 0.12) f = suave(p / 0.12); if (p > 0.85) f = Math.min(f, suave((1 - p) / 0.15)); if (f < 0.001) f = 0.001;
        o.position.x = qX[i] + qAx[i] * (Math.sin(ang + qF[i]) - qS1[i]) * qN1[i];
        o.position.y = qY[i] - qAlto[i] * p;
        o.rotation.z = qZ[i] + qGiro[i] * (Math.sin(ang + qF[i] + 1.3) - qS2[i]) * qN2[i];
        o.scale.x = qSx[i] * f; o.scale.y = qSy[i] * f;
      }
    },
  };
  return vida;
}

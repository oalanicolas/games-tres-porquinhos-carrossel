// Recortes do Lobo: contornos e atlas saem de `tools/lobo_pecas.py`. O corte é papel de verdade, com miolo claro.
import * as THREE from 'three';
import dados from './lobo-pecas.json';
import atlasUrl from './lobo-atlas.webp';

/** Altura do Lobo, das orelhas aos pés, em unidades da cena. */
const ALTURA = 1.46;
export const BASE_LOBO = dados.base;
export const U_LOBO = ALTURA / (dados.base - dados.topo);
/** Ponto da imagem nas coordenadas de um rig cuja origem está no pixel `o`. */
export const pxLobo = (p, o) => [(p[0] - o[0]) * U_LOBO, (o[1] - p[1]) * U_LOBO];

// O atlas decodifica antes do livro montar, para o Lobo nunca aparecer sem textura.
const imagem = new Image(); imagem.src = atlasUrl;
await imagem.decode().catch((e) => console.error('atlas do Lobo', e));
const textura = new THREE.Texture(imagem); textura.needsUpdate = true;
textura.colorSpace = THREE.SRGBColorSpace; textura.anisotropy = 8; textura.generateMipmaps = true; textura.minFilter = THREE.LinearMipmapLinearFilter;
const tampa = new THREE.MeshLambertMaterial({ map: textura }); tampa.name = 'lobo-atlas';
const corte = new THREE.MeshLambertMaterial({ color: '#b5afa2' }); corte.name = 'lobo-corte';
const transl = new THREE.MeshLambertMaterial({ map: textura, transparent: true, depthWrite: false }); transl.name = 'lobo-tinta';

function uvs(geo, d, o) {
  const pos = geo.attributes.position, uv = geo.attributes.uv, A = dados.atlas;
  for (let i = 0; i < uv.count; i++) {
    const px = o[0] + pos.getX(i) / U_LOBO, py = o[1] - pos.getY(i) / U_LOBO;
    uv.setXY(i, (px - d.ox) / A, 1 - (py - d.oy) / A);
  }
}
const forma = (d, o) => new THREE.Shape(d.contorno.map((p) => new THREE.Vector2(...pxLobo(p, o))));

/** Peça opaca, extrudada como as demais peças de papel. `o` é o pixel da origem do rig pai. */
export function recorte(parent, nome, o, { z = 0, t = 0.008, name = '' } = {}) {
  const d = dados.pecas[nome];
  const geo = new THREE.ExtrudeGeometry(forma(d, o), { depth: t, bevelEnabled: false, curveSegments: 1, steps: 1 });
  uvs(geo, d, o);
  const mesh = new THREE.Mesh(geo, [tampa, corte]);
  mesh.position.z = z; mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = name || nome; mesh.userData.paper = true;
  parent.add(mesh); return mesh;
}
/** Peça translúcida, sem espessura: não entra na fusão por material. */
export function tinta(parent, nome, o, { z = 0, propria = false } = {}) {
  const d = dados.pecas[nome];
  const geo = new THREE.ShapeGeometry(forma(d, o)); uvs(geo, d, o);
  const mesh = new THREE.Mesh(geo, propria ? transl.clone() : transl); mesh.position.z = z; mesh.name = nome; parent.add(mesh); return mesh;
}

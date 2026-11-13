// A estante: na capa fechada, os outros livros da coleção. Arquivo igual em todos os livros; quem é este livro vem de data-livro.
// A lista é public/livros.json. Sem lista, ou sem outro livro nela, a estante e o botão da barra não aparecem.
const nav = document.getElementById('estante');
const botao = document.getElementById('estante-botao');

function cartao(livro, origem) {
  const a = document.createElement('a');
  a.className = 'estante-livro'; a.href = livro.url; a.dataset.livro = livro.id;
  const img = document.createElement('img');
  img.src = livro.capa; img.alt = ''; img.width = 420; img.height = 300; img.decoding = 'async';
  const texto = document.createElement('span');
  const rotulo = document.createElement('small'); rotulo.textContent = 'Outra história';
  const titulo = document.createElement('strong'); titulo.textContent = livro.titulo;
  texto.append(rotulo, titulo); a.append(img, texto);
  a.addEventListener('click', () => { (window.dataLayer ||= []).push({ event: 'estante_clique', livro_origem: origem, livro_destino: livro.id }); });
  return a;
}

async function montar() {
  if (!nav || !botao) return;
  let lista = [];
  try { const r = await fetch('./livros.json'); if (r.ok) lista = await r.json(); } catch { return; }
  const origem = nav.dataset.livro;
  const outros = Array.isArray(lista) ? lista.filter((l) => l && l.id !== origem && l.url && l.titulo && l.capa) : [];
  if (!outros.length) return;
  nav.append(...outros.map((l) => cartao(l, origem)));
  nav.hidden = false; botao.hidden = false;
  // na barra: fecha o livro, e a estante está na capa
  botao.addEventListener('click', () => {
    const L = window.__livro;
    if (L && L.estado.modo !== 'capa') L.irPara(-1);
    const foco = () => { if (!document.getElementById('abertura').inert) nav.querySelector('a')?.focus({ preventScroll: true }); else setTimeout(foco, 200); };
    foco();
  });
}
montar();

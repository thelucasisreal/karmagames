// Gera as páginas estáticas do site a partir de jogos.js, para o Google (e IAs) lerem
// tudo sem precisar rodar JavaScript.
//
// Uso:  node scripts/seo.mjs
//
// Gera: index.html, jogar/<slug>/, categoria/<slug>/, sobre/, contato/, privacidade/,
//       termos/, 404.html, jogar.html (redireciona endereços antigos), sitemap.xml,
//       robots.txt, llms.txt, site.webmanifest e ads.txt (se tiver o código do AdSense).
// Lê:   jogos.js (catálogo), scripts/conteudo.json (texto de cada jogo),
//       scripts/paginas.mjs (páginas institucionais) e scripts/site.json (configuração).
// Sem dependências: só Node.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { PAGINAS, CATEGORIAS } from "./paginas.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ler = (arq) => fs.readFileSync(path.join(RAIZ, arq), "utf8");
const existe = (arq) => fs.existsSync(path.join(RAIZ, arq));
function gravar(arq, conteudo) {
  const destino = path.join(RAIZ, arq);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, conteudo);
}

const CFG = JSON.parse(ler("scripts/site.json"));
const DOMINIO = CFG.dominio.replace(/\/$/, "");
const NOME = CFG.nome;
const ANO = CFG.atualizado.slice(0, 4);

const contexto = { window: {} };
vm.runInNewContext(ler("jogos.js"), contexto);
const TODOS = contexto.window.KARMA_JOGOS.filter((j) => j && j.slug && j.titulo);
const JOGOS = TODOS.filter((j) => !j.emBreve);
const CONTEUDO = existe("scripts/conteudo.json") ? JSON.parse(ler("scripts/conteudo.json")) : {};
const avisos = [];

// Versão dos arquivos do site: muda sozinha quando o CSS, o JS ou o catálogo mudam (fura o cache).
// Inclui o index.html de cada jogo, para o iframe do jogo também pegar a versão nova.
const hashVersao = crypto.createHash("sha1").update(ler("assets/site.css")).update(ler("assets/site.js")).update(ler("jogos.js"));
for (const j of JOGOS) if (!j.url && existe(`jogos/${j.slug}/index.html`)) hashVersao.update(ler(`jogos/${j.slug}/index.html`));
const VERSAO = hashVersao.digest("hex").slice(0, 8);

// ---------- utilidades ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slugify = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const icone = (nome) => `<svg class="icon" aria-hidden="true"><use href="assets/icones.svg#i-${nome}"/></svg>`;
const plural = (n) => `${n} ${n === 1 ? "jogo" : "jogos"}`;
const abs = (rota) => `${DOMINIO}/${rota}`;
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

const capaDe = (j) => j.capa || `assets/capas/${j.slug}.webp`;
const rotaJogo = (j) => `jogar/${j.slug}/`;
const rotaCategoria = (c) => `categoria/${slugify(c)}/`;
const categorias = [...new Set(JOGOS.map((j) => j.categoria).filter(Boolean))];
const daCategoria = (c) => JOGOS.filter((j) => j.categoria === c);

// "Ação" -> "Jogos de Ação", "Clássicos" -> "Jogos Clássicos"...
const NOME_CATEGORIA = { "Clássicos": "Jogos Clássicos", "Casual": "Jogos Casuais", "Arcade": "Jogos Arcade" };
const nomeCategoria = (c) => NOME_CATEGORIA[c] || `Jogos de ${c}`;

// Imagem para redes sociais: JPG gerado por scripts/imagens.mjs; senão a capa (se não for SVG).
const OG_PADRAO = existe("assets/og/karma.jpg") ? "assets/og/karma.jpg" : "assets/capas/voo-livre.webp";
const ogDe = (j) => existe(`assets/og/${j.slug}.jpg`) ? `assets/og/${j.slug}.jpg`
  : (!capaDe(j).endsWith(".svg") && existe(capaDe(j))) ? capaDe(j) : OG_PADRAO;

const ORG = {
  "@type": "Organization", "@id": `${DOMINIO}/#org`, name: NOME, url: `${DOMINIO}/`,
  logo: { "@type": "ImageObject", url: abs(existe("assets/icone-512.png") ? "assets/icone-512.png" : "favicon.svg") },
  ...(CFG.email ? { email: CFG.email } : {}),
};
const SITE = { "@type": "WebSite", "@id": `${DOMINIO}/#site`, name: NOME, url: `${DOMINIO}/`, inLanguage: "pt-BR", publisher: { "@id": ORG["@id"] } };
const migalhas = (itens) => ({
  "@type": "BreadcrumbList",
  itemListElement: itens.map(([nome, rota], i) => ({ "@type": "ListItem", position: i + 1, name: nome, item: abs(rota) })),
});
const faqLd = (faq) => faq && faq.length ? {
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({ "@type": "Question", name: f.p, acceptedAnswer: { "@type": "Answer", text: f.r } })),
} : null;

// ---------- molde da página ----------
function pagina({ rota, titulo, descricao, corpo, dados = {}, og = OG_PADRAO, tipo = "website", grafo = [], indexar = true, canonica = true }) {
  const profunda = rota.includes("/") || !indexar; // páginas em subpasta usam <base> para os caminhos relativos
  const atributos = Object.entries(dados).map(([k, v]) => ` data-${k}="${esc(v)}"`).join("");
  const grafoLd = grafo.filter(Boolean);
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(descricao)}">
${profunda ? `  <base href="/">\n` : ""}${canonica ? `  <link rel="canonical" href="${abs(rota)}">\n` : ""}  <meta name="robots" content="${indexar ? "index, follow, max-image-preview:large" : "noindex, follow"}">
  <meta name="theme-color" content="#62d9cf">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
${existe("assets/icone-180.png") ? `  <link rel="apple-touch-icon" href="assets/icone-180.png">\n` : ""}  <link rel="manifest" href="site.webmanifest">
  <meta property="og:site_name" content="${esc(NOME)}">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:type" content="${tipo}">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(descricao)}">
  <meta property="og:url" content="${abs(rota)}">
  <meta property="og:image" content="${abs(og)}">
  <meta name="twitter:card" content="summary_large_image">
${CFG.googleVerificacao ? `  <meta name="google-site-verification" content="${esc(CFG.googleVerificacao)}">\n` : ""}  <link rel="preload" href="assets/fonts/unbounded-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/site.css?v=${VERSAO}">
${CFG.adsenseCliente ? `  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(CFG.adsenseCliente)}" crossorigin="anonymous"></script>\n` : ""}${grafoLd.length ? `  ${ld({ "@context": "https://schema.org", "@graph": grafoLd })}\n` : ""}</head>
<body${atributos}>
  <div class="pagina">
    <aside class="lateral" id="lateral" aria-label="Categorias">${lateralEstatica(dados.categoria)}</aside>
${corpo}
  </div>

  <div class="busca-painel" id="busca-painel" hidden>
    <div class="busca-topo">
      <label class="busca">
        <span class="sr-only">Buscar jogo</span>
        ${icone("magnifying-glass")}
        <input id="busca" type="search" placeholder="O que você quer jogar?" autocomplete="off" enterkeyhint="search">
      </label>
      <button class="btn-redondo" id="busca-fechar" type="button" aria-label="Fechar busca">
        ${icone("x")}
      </button>
    </div>
    <div class="mural" id="busca-resultados"></div>
  </div>

  <footer class="rodape">
    <a class="marca" href="./"><img class="marca-simbolo" src="assets/marca.svg" alt="" width="22" height="22"><span>karma<b>games</b></span></a>
    <nav class="rodape-links" aria-label="Institucional">
      ${PAGINAS.map((p) => `<a href="${p.slug}/">${esc(p.menu)}</a>`).join("\n      ")}
    </nav>
    <span>© ${ANO} ${esc(NOME)}. Todos os jogos são grátis. Sem download, sem cadastro.</span>
  </footer>

  <script src="jogos.js?v=${VERSAO}"></script>
  <script src="assets/site.js?v=${VERSAO}"></script>
</body>
</html>
`;
}

// A lateral é desenhada pelo site.js; esta versão estática serve para quem lê sem JavaScript.
function lateralEstatica(atual) {
  return `
      <a class="marca" href="./" aria-label="${esc(NOME)}, página inicial"><img class="marca-simbolo" src="assets/marca.svg" alt="" width="38" height="38"><span>karma<b>games</b></span></a>
      <h2>Todos os jogos</h2>
      <nav class="filtros" aria-label="Categorias">
        <a class="filtro" href="./"><span>Todos</span><span class="num">${JOGOS.length}</span></a>
        ${categorias.map((c) => `<a class="filtro" href="${rotaCategoria(c)}"${c === atual ? ' aria-current="page"' : ""}><span>${esc(c)}</span><span class="num">${daCategoria(c).length}</span></a>`).join("\n        ")}
      </nav>
    `;
}

function tile(j, prioridade = false) {
  return `<a class="tile t2" href="${rotaJogo(j)}" aria-label="${esc(j.titulo)}" title="${esc(j.titulo)}"><img class="capa" src="${esc(capaDe(j))}" alt="${esc(j.titulo)}" width="800" height="500" ${prioridade ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"><span class="tile-nome">${esc(j.titulo)}</span></a>`;
}

const lista = (tag, itens) => `<${tag}>${itens.map((i) => `<li>${i}</li>`).join("")}</${tag}>`;
function faqHtml(faq) {
  return faq.map((f) => `<details><summary>${esc(f.p)}</summary><p>${esc(f.r)}</p></details>`).join("\n          ");
}
function migalhasHtml(itens) {
  return `<nav class="migalhas" aria-label="Você está em"><ol>${itens.map(([nome, rota], i) =>
    i === itens.length - 1 ? `<li aria-current="page">${esc(nome)}</li>` : `<li><a href="${rota || "./"}">${esc(nome)}</a></li>`).join("")}</ol></nav>`;
}

// ---------- página de cada jogo ----------
function paginaJogo(j) {
  const c = CONTEUDO[j.slug];
  if (!c) avisos.push(`sem texto em scripts/conteudo.json: ${j.slug}`);
  const sobre = c?.sobre?.length ? c.sobre : [j.descricao];
  const faq = c?.faq || [];
  const rota = rotaJogo(j);
  const cat = j.categoria;
  const trilha = [["Início", ""], ...(cat ? [[nomeCategoria(cat), rotaCategoria(cat)]] : []), [j.titulo, rota]];
  const parecidos = [...JOGOS.filter((o) => o.slug !== j.slug && o.categoria === cat), ...JOGOS.filter((o) => o.slug !== j.slug && o.categoria !== cat)].slice(0, 8);
  const descricao = c?.metaDescricao || `${j.descricao} Jogue grátis no navegador, sem download e sem cadastro.`;

  const corpo = `  <main id="conteudo">
    <div class="mural" id="mural">
      <section class="palco-celula" id="palco-celula">
        <div class="palco" id="palco">
          <div class="palco-carregando" id="carregando"><img class="marca-simbolo" src="assets/marca.svg" alt="Carregando jogo"></div>
        </div>
        <div class="jogo-barra">
          <div class="jogo-titulo">
            <h1 id="jogo-nome">${esc(j.titulo)}</h1>
            <span id="jogo-categoria">${esc(cat || "")}</span>
          </div>
          <div class="jogo-acoes" id="jogo-acoes" hidden>
            <button class="btn-redondo" id="btn-reiniciar" type="button" aria-label="Recomeçar o jogo" title="Recomeçar">${icone("arrow-clockwise")}</button>
            <button class="btn-redondo" id="btn-sair" type="button" aria-label="Sair do jogo" title="Sair">${icone("x")}</button>
            <button class="btn-redondo" id="btn-tela-cheia" type="button" aria-label="Tela cheia" title="Tela cheia">${icone("arrows-out")}</button>
          </div>
        </div>
      </section>
    </div>
    <article class="texto">
      ${migalhasHtml(trilha)}
      <h2>Sobre o jogo ${esc(j.titulo)}</h2>
      ${sobre.map((p) => `<p>${esc(p)}</p>`).join("\n      ")}
      ${c?.comoJogar?.length ? `<h2>Como jogar</h2>\n      ${lista("ol", c.comoJogar.map(esc))}` : ""}
      ${j.controles ? `<h2>Controles</h2>\n      <p class="controles">${icone("game-controller")}<span>${esc(j.controles)}</span></p>` : ""}
      ${c?.dicas?.length ? `<h2>Dicas</h2>\n      ${lista("ul", c.dicas.map(esc))}` : ""}
      ${faq.length ? `<h2>Perguntas frequentes</h2>\n      <div class="faq">\n          ${faqHtml(faq)}\n      </div>` : ""}
      <h2>Mais jogos${cat ? ` de ${esc(cat)}` : ""}</h2>
      ${lista("ul class=\"links-jogos\"", parecidos.map((o) => `<a href="${rotaJogo(o)}">${esc(o.titulo)}</a>`))}
    </article>
  </main>`;

  const pagJogo = {
    "@type": ["VideoGame", "WebApplication"], "@id": `${abs(rota)}#jogo`, name: j.titulo, url: abs(rota),
    description: sobre[0], image: abs(ogDe(j)), inLanguage: "pt-BR",
    genre: cat, applicationCategory: "GameApplication", operatingSystem: "Qualquer navegador moderno",
    gamePlatform: ["Navegador", "Computador", "Celular"], browserRequirements: "Requer HTML5 e JavaScript",
    isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "BRL", availability: "https://schema.org/InStock" },
    author: { "@id": ORG["@id"] }, publisher: { "@id": ORG["@id"] },
    ...(j.adicionado ? { datePublished: j.adicionado } : {}),
    ...(j.controles ? { gameTip: j.controles } : {}),
  };
  const html = pagina({
    rota, titulo: `${j.titulo}: jogue grátis online | ${NOME}`, descricao, corpo, og: ogDe(j),
    dados: { pagina: "jogar", slug: j.slug, ...(cat ? { categoria: cat } : {}) },
    grafo: [ORG, SITE, pagJogo, migalhas(trilha), faqLd(faq)],
  });
  gravar(`${rota}index.html`, html);
}

// ---------- página de cada categoria ----------
function paginaCategoria(c) {
  const jogos = daCategoria(c);
  const rota = rotaCategoria(c);
  const titulo = nomeCategoria(c);
  const texto = CATEGORIAS[c] || `${titulo} grátis para jogar direto no navegador.`;
  if (!CATEGORIAS[c]) avisos.push(`sem texto de categoria em scripts/paginas.mjs: ${c}`);
  const trilha = [["Início", ""], [titulo, rota]];
  const corpo = `    <main>
      <div class="mural" id="mural">
        <div class="tile tile-titulo"><h1>${esc(titulo)}</h1><span>${plural(jogos.length)}</span></div>
        ${jogos.map((j, i) => tile(j, i < 4)).join("\n        ")}
      </div>
      <article class="texto">
        ${migalhasHtml(trilha)}
        <h2>${esc(titulo)} grátis</h2>
        <p>${esc(texto)}</p>
        ${lista("ul class=\"lista-jogos\"", jogos.map((j) => `<a href="${rotaJogo(j)}">${esc(j.titulo)}</a>: ${esc(j.descricao)}`))}
      </article>
    </main>`;
  gravar(`${rota}index.html`, pagina({
    rota, titulo: `${titulo} grátis online | ${NOME}`, descricao: texto.slice(0, 158), corpo,
    dados: { pagina: "inicio", categoria: c, titulo },
    grafo: [ORG, SITE, {
      "@type": "CollectionPage", "@id": abs(rota), name: titulo, url: abs(rota), description: texto, inLanguage: "pt-BR", isPartOf: { "@id": SITE["@id"] },
      mainEntity: { "@type": "ItemList", numberOfItems: jogos.length, itemListElement: jogos.map((j, i) => ({ "@type": "ListItem", position: i + 1, url: abs(rotaJogo(j)), name: j.titulo })) },
    }, migalhas(trilha)],
  }));
}

// ---------- página inicial ----------
const FAQ_SITE = [
  { p: "Os jogos da Karma Games são grátis?", r: "Sim. Todos os jogos são grátis e continuam grátis. O site se mantém com anúncios." },
  { p: "Precisa baixar ou instalar alguma coisa?", r: "Não. Os jogos abrem direto no navegador, em HTML5. É só clicar em Jogar." },
  { p: "Precisa criar conta?", r: "Não. Não tem cadastro. Os recordes e o progresso ficam salvos no seu próprio aparelho." },
  { p: "Dá para jogar no celular?", r: "Sim. Os jogos funcionam no celular e no tablet, com controles de toque, e também no computador com teclado e mouse." },
  { p: "Quais jogos tem na Karma Games?", r: `São ${JOGOS.length} jogos, como ${JOGOS.slice(0, 8).map((j) => j.titulo).join(", ")} e outros, divididos em ${categorias.map((c) => c.toLowerCase()).join(", ")}.` },
];
function paginaInicial() {
  const autorais = JOGOS.filter((j) => j.autoral);
  // Os mais buscados vão na descrição; os que não estiverem no catálogo ficam de fora.
  const famosos = ["xadrez", "paciencia", "sudoku", "campo-minado", "dama"].map((s) => JOGOS.find((j) => j.slug === s)).filter(Boolean);
  const descricao = `${JOGOS.length} jogos grátis no navegador, sem download e sem cadastro: ${famosos.map((j) => j.titulo).join(", ")} e mais. No PC ou no celular.`;
  const corpo = `    <main>
      <div class="mural" id="mural">
        ${JOGOS.map((j, i) => tile(j, i < 6)).join("\n        ")}
      </div>
      <article class="texto">
        <h1>Jogos online grátis, direto no navegador</h1>
        <p>A Karma Games tem ${plural(JOGOS.length)} grátis para jogar no computador, no tablet ou no celular. Não precisa baixar nada nem criar conta: escolha um jogo, clique em Jogar e pronto. Todos estão em português e os recordes ficam salvos no seu aparelho.</p>
        <h2>Categorias</h2>
        ${lista("ul class=\"lista-jogos\"", categorias.map((c) => `<a href="${rotaCategoria(c)}">${esc(nomeCategoria(c))}</a> (${daCategoria(c).length}): ${esc(daCategoria(c).map((j) => j.titulo).join(", "))}`))}
        ${autorais.length ? `<h2>Feitos aqui na Karma</h2>\n        ${lista("ul class=\"lista-jogos\"", autorais.map((j) => `<a href="${rotaJogo(j)}">${esc(j.titulo)}</a>: ${esc(j.descricao)}`))}` : ""}
        <h2>Perguntas frequentes</h2>
        <div class="faq">
          ${faqHtml(FAQ_SITE)}
        </div>
      </article>
    </main>`;
  gravar("index.html", pagina({
    rota: "", titulo: `${NOME}: jogos grátis online no navegador`, descricao, corpo,
    dados: { pagina: "inicio" },
    grafo: [ORG, { ...SITE, description: descricao, potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${DOMINIO}/?q={busca}` }, "query-input": "required name=busca" } },
      { "@type": "ItemList", "@id": `${DOMINIO}/#jogos`, name: "Jogos da Karma Games", numberOfItems: JOGOS.length, itemListElement: JOGOS.map((j, i) => ({ "@type": "ListItem", position: i + 1, url: abs(rotaJogo(j)), name: j.titulo })) },
      faqLd(FAQ_SITE)],
  }));
}

// ---------- páginas institucionais ----------
const CONTATO = [
  ...(CFG.email ? [`E-mail: <a href="mailto:${esc(CFG.email)}">${esc(CFG.email)}</a>`] : []),
  `Sugestões e erros nos jogos: <a href="https://github.com/thelucasisreal/karmagames/issues" rel="noopener">abra um pedido no GitHub</a>`,
];
if (!CFG.email) avisos.push("sem e-mail de contato em scripts/site.json (o AdSense costuma exigir um contato)");
function trocar(texto) {
  return texto.replace(/\{data\}/g, new Date(CFG.atualizado + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }))
    .replace(/\{jogos\}/g, JOGOS.length).replace(/\{dominio\}/g, DOMINIO.replace(/^https?:\/\//, ""))
    .replace(/\{email\}/g, esc(CFG.email));
}
function bloco([tag, valor]) {
  if (valor === "{contato}") return lista("ul", CONTATO);
  if (tag === "ul") return lista("ul", valor.map(trocar));
  return `<${tag}>${trocar(valor)}</${tag}>`;
}
function paginaTexto(p) {
  const rota = `${p.slug}/`;
  const corpo = `    <main>
      <article class="texto texto-pagina">
        ${migalhasHtml([["Início", ""], [p.titulo, rota]])}
        <h1>${esc(p.titulo)}</h1>
        ${p.blocos.map(bloco).join("\n        ")}
      </article>
    </main>`;
  gravar(`${rota}index.html`, pagina({
    rota, titulo: `${p.titulo} | ${NOME}`, descricao: p.descricao, corpo, dados: { pagina: "texto" },
    grafo: [ORG, SITE, { "@type": p.slug === "sobre" ? "AboutPage" : p.slug === "contato" ? "ContactPage" : "WebPage", "@id": abs(rota), name: p.titulo, url: abs(rota), inLanguage: "pt-BR", isPartOf: { "@id": SITE["@id"] } }, migalhas([["Início", ""], [p.titulo, rota]])],
  }));
}

function pagina404() {
  gravar("404.html", pagina({
    rota: "404.html", titulo: `Página não encontrada | ${NOME}`, descricao: "Essa página não existe.", indexar: false, canonica: false,
    dados: { pagina: "texto" },
    corpo: `    <main>
      <article class="texto texto-pagina">
        <h1>Essa página não está aqui.</h1>
        <p>O endereço pode estar errado ou o jogo saiu do catálogo. Que tal um destes?</p>
        ${lista("ul class=\"links-jogos\"", JOGOS.slice(0, 12).map((j) => `<a href="${rotaJogo(j)}">${esc(j.titulo)}</a>`))}
        <p><a class="btn-texto" href="./">Ver todos os jogos</a></p>
      </article>
    </main>`,
  }));
}

// Endereço antigo (jogar.html?j=slug): manda para a página nova do jogo.
function redirecionamento() {
  gravar("jogar.html", `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Abrindo o jogo · ${esc(NOME)}</title>
  <meta name="robots" content="noindex, follow">
  <script>
    var j = new URLSearchParams(location.search).get("j") || "";
    var jogos = ${JSON.stringify(JOGOS.map((j) => j.slug))};
    location.replace(jogos.indexOf(j) >= 0 ? "jogar/" + j + "/" : "./");
  </script>
</head>
<body><p><a href="./">Ver todos os jogos</a></p></body>
</html>
`);
}

// ---------- arquivos para buscadores e IAs ----------
function sitemap() {
  const url = (rota, extra = "") => `  <url><loc>${abs(rota)}</loc><lastmod>${CFG.atualizado}</lastmod>${extra}</url>`;
  const img = (j) => existe(capaDe(j)) ? `<image:image><image:loc>${abs(capaDe(j))}</image:loc></image:image>` : "";
  gravar("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[url(""), ...categorias.map((c) => url(rotaCategoria(c))), ...JOGOS.map((j) => url(rotaJogo(j), img(j))), ...PAGINAS.map((p) => url(`${p.slug}/`))].join("\n")}
</urlset>
`);
  gravar("robots.txt", `User-agent: *
Allow: /
# Os jogos "crus" ficam dentro das páginas jogar/<slug>/; quem deve aparecer na busca é a página.
Disallow: /jogos/
Disallow: /scripts/

Sitemap: ${DOMINIO}/sitemap.xml
`);
}

function llms() {
  const linha = (j) => `- [${j.titulo}](${abs(rotaJogo(j))}): ${(CONTEUDO[j.slug]?.metaDescricao || j.descricao)}`;
  gravar("llms.txt", `# ${NOME}

> Site brasileiro de jogos grátis para jogar direto no navegador, em português, sem download e sem cadastro. ${JOGOS.length} jogos feitos pela própria Karma Games, que funcionam no computador e no celular.

Todos os jogos são grátis (o site se mantém com anúncios). Cada jogo tem uma página com regras, controles, dicas e perguntas frequentes. Os recordes ficam salvos no aparelho de quem joga.

${categorias.map((c) => `## ${nomeCategoria(c)}\n\n${daCategoria(c).map(linha).join("\n")}`).join("\n\n")}

## Sobre o site

${PAGINAS.map((p) => `- [${p.titulo}](${abs(`${p.slug}/`)}): ${p.descricao}`).join("\n")}
`);
}

function manifesto() {
  const icones = [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }];
  for (const t of [192, 512]) if (existe(`assets/icone-${t}.png`)) icones.push({ src: `/assets/icone-${t}.png`, sizes: `${t}x${t}`, type: "image/png" });
  gravar("site.webmanifest", JSON.stringify({
    name: NOME, short_name: "Karma", description: "Jogos grátis direto no navegador.", lang: "pt-BR",
    start_url: "/", scope: "/", display: "standalone", background_color: "#62d9cf", theme_color: "#62d9cf", icons: icones,
  }, null, 2) + "\n");
}

function adsTxt() {
  if (!CFG.adsenseCliente) { avisos.push("sem código do AdSense em scripts/site.json: ads.txt e script de anúncios não foram gerados"); return; }
  gravar("ads.txt", `google.com, ${CFG.adsenseCliente.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`);
}

// ---------- rodar ----------
paginaInicial();
for (const c of categorias) paginaCategoria(c);
for (const j of JOGOS) paginaJogo(j);
for (const p of PAGINAS) paginaTexto(p);
pagina404();
redirecionamento();
sitemap();
llms();
manifesto();
adsTxt();

// Apaga páginas de jogos e categorias que saíram do catálogo.
for (const [pasta, validos] of [["jogar", JOGOS.map((j) => j.slug)], ["categoria", categorias.map(slugify)]]) {
  if (!existe(pasta)) continue;
  for (const d of fs.readdirSync(path.join(RAIZ, pasta))) {
    if (!validos.includes(d)) fs.rmSync(path.join(RAIZ, pasta, d), { recursive: true, force: true });
  }
}

console.log(`ok: ${JOGOS.length} jogos, ${categorias.length} categorias, ${PAGINAS.length} páginas (versão ${VERSAO})`);
for (const a of avisos) console.log("aviso:", a);

(function () {
  "use strict";

  const TODOS = (window.KARMA_JOGOS || []).filter((j) => j && j.slug && j.titulo);
  const JOGOS = TODOS.filter((j) => !j.emBreve);
  const EM_BREVE = TODOS.filter((j) => j.emBreve);
  const ICONES = "assets/icones.svg";
  const CHAVE_RECENTES = "karma:recentes";
  const DIAS_NOVO = 30;
  const PAGINA = document.body.dataset.pagina;
  const PAGINA_JOGO = PAGINA === "jogar";

  // Ícone e cor de cada categoria. Categoria nova sem entrada usa o controle e o verde da marca.
  const CATEGORIA = {
    "Ação": { icone: "sword", cor: "#ff8a65" },
    "Arcade": { icone: "joystick", cor: "#ffd54f" },
    "Clássicos": { icone: "crown", cor: "#b39ddb" },
    "Quebra-cabeça": { icone: "puzzle", cor: "#81d4fa" },
    "Esporte": { icone: "ball", cor: "#a5d6a7" },
    "Casual": { icone: "heart", cor: "#f48fb1" },
    "Tabuleiro": { icone: "grid", cor: "#ffab91" },
    "Simulação": { icone: "sparkle", cor: "#ce93d8" },
  };

  // ---------- utilidades ----------
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icone = (nome) => `<svg class="icon" aria-hidden="true"><use href="${ICONES}#i-${nome}"/></svg>`;
  const normalizar = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const plural = (n) => `${n} ${n === 1 ? "jogo" : "jogos"}`;

  const capaDe = (j) => j.capa || `assets/capas/${j.slug}.webp`;
  // A versão (?v=) muda quando qualquer jogo muda: o navegador não fica preso num jogo velho no cache.
  const VERSAO = (document.currentScript && new URL(document.currentScript.src).searchParams.get("v")) || "";
  const urlDoJogo = (j) => j.url || `jogos/${j.slug}/${VERSAO ? `?v=${VERSAO}` : ""}`;
  // Páginas fora da raiz têm <base href="/">, então os caminhos relativos valem para todas.
  const linkDoJogo = (j) => `jogar/${encodeURIComponent(j.slug)}/`;
  const slugify = (s) => normalizar(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const linkDaCategoria = (c) => `categoria/${slugify(c)}/`;
  // Selo "Novo" só faz sentido se nem todo mundo for novo.
  const recemChegado = (j) => {
    if (!j.adicionado) return false;
    const dias = (Date.now() - new Date(j.adicionado + "T00:00:00").getTime()) / 864e5;
    return dias >= 0 && dias <= DIAS_NOVO;
  };
  const poucosNovos = JOGOS.filter(recemChegado).length <= JOGOS.length / 2;
  const ehNovo = (j) => poucosNovos && recemChegado(j);
  const categorias = [...new Set(JOGOS.map((j) => j.categoria).filter(Boolean))];

  function ler(chave, padrao) {
    try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento, tudo bem */ }
  }
  const slugsRecentes = () => ler(CHAVE_RECENTES, []);

  // Imagem de capa. Se o arquivo não existir, troca por um ícone.
  function imgCapa(j, extra = "") {
    return `<img class="capa" src="${esc(capaDe(j))}" alt="" loading="lazy" decoding="async" ${extra}>`;
  }
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains("capa")) return;
    const vazio = document.createElement("span");
    vazio.className = "capa-vazia";
    vazio.innerHTML = icone("game-controller");
    img.replaceWith(vazio);
  }, true);

  // ---------- blocos do mural ----------
  // tam: 1 (quadradinho), 2 (2x2) ou 3 (3x3)
  function tile(j, tam = 1) {
    const jogado = slugsRecentes().includes(j.slug);
    const selo = jogado ? `<span class="selo" title="Você já jogou">${icone("arrow-clockwise")}</span>`
      : ehNovo(j) ? `<span class="selo selo-novo">NOVO</span>`
      : j.autoral ? `<span class="selo selo-karma" title="Feito aqui na Karma">${icone("star")}</span>` : "";
    return `
      <a class="tile t${tam}" href="${linkDoJogo(j)}" aria-label="${esc(j.titulo)}" title="${esc(j.titulo)}">
        ${selo}
        ${imgCapa(j, tam === 3 ? 'fetchpriority="high" loading="eager"' : "")}
        <span class="tile-nome">${esc(j.titulo)}</span>
      </a>`;
  }

  function tileEmBreve(j) {
    return `
      <div class="tile t2 breve" title="${esc(j.titulo)}: em breve">
        ${imgCapa(j)}
        <span class="tile-nome">${esc(j.titulo)}</span>
      </div>`;
  }

  function tileTitulo(titulo, sub) {
    return `<div class="tile tile-titulo"><h1>${esc(titulo)}</h1>${sub ? `<span>${esc(sub)}</span>` : ""}</div>`;
  }

  // Todos os jogos do mural têm o mesmo tamanho (2x2), numa grade certinha.
  const TAM = 2;

  // Jogos que você já abriu vêm primeiro, depois o resto na ordem do catálogo.
  function ordenados(lista) {
    const vistos = slugsRecentes();
    const pos = (j) => { const p = vistos.indexOf(j.slug); return p < 0 ? Infinity : p; };
    return [...lista].sort((a, b) => pos(a) - pos(b));
  }

  // ---------- lateral: marca, busca e "Todos os jogos" com filtros ----------
  function lateral(atual) {
    const filtro = (rota, nome, ic, cor, num, ativo) => `
      <a class="filtro" href="${rota || "./"}" style="--cor:${cor}"${ativo ? ' aria-current="page"' : ""}>
        <span class="filtro-icone">${icone(ic)}</span><span>${esc(nome)}</span><span class="num">${num}</span>
      </a>`;
    $("#lateral").innerHTML = `
      <a class="marca" href="./" aria-label="Karma Games, página inicial">
        <img class="marca-simbolo" src="assets/marca.svg" alt=""><span>karma<b>games</b></span>
      </a>
      <button class="lateral-busca" type="button" id="btn-buscar">
        ${icone("magnifying-glass")}<span>Buscar jogo</span><kbd>/</kbd>
      </button>
      <h2>Todos os jogos</h2>
      <nav class="filtros" aria-label="Categorias">
        ${filtro("", "Todos", "grid", "#c8f13a", JOGOS.length, !atual && PAGINA === "inicio")}
        ${categorias.map((c) => {
          const info = CATEGORIA[c] || { icone: "game-controller", cor: "#c8f13a" };
          return filtro(linkDaCategoria(c), c, info.icone, info.cor, JOGOS.filter((j) => j.categoria === c).length, c === atual);
        }).join("")}
      </nav>
      <button class="lateral-sorte" type="button" id="btn-aleatorio">${icone("dice")} Jogo aleatório</button>
      <p class="lateral-rodape">Todos grátis, direto no navegador. Sem download, sem cadastro.</p>
      <nav class="lateral-links" aria-label="Institucional">
        <a href="sobre/">Sobre</a><a href="contato/">Contato</a><a href="privacidade/">Privacidade</a><a href="termos/">Termos</a>
      </nav>`;
    ligarLogo();
  }

  // ---------- botões do logo e busca ----------
  function ligarLogo() {
    $("#btn-aleatorio").addEventListener("click", () => {
      const atual = document.body.dataset.slug;
      const opcoes = JOGOS.filter((j) => j.slug !== atual);
      if (opcoes.length) location.href = linkDoJogo(opcoes[Math.floor(Math.random() * opcoes.length)]);
    });
    $("#btn-buscar").addEventListener("click", abrirBusca);
  }

  const painel = $("#busca-painel");
  const busca = $("#busca");
  function desenharBusca() {
    const termo = normalizar(busca.value.trim());
    const lista = termo
      ? JOGOS.filter((j) => normalizar(`${j.titulo} ${j.descricao} ${j.categoria}`).includes(termo))
      : JOGOS;
    $("#busca-resultados").innerHTML = lista.length
      ? lista.map((j) => tile(j, TAM)).join("")
      : `<div class="vazio"><strong>Nenhum jogo encontrado</strong>Tente outra palavra.</div>`;
  }
  function abrirBusca() {
    painel.hidden = false;
    document.body.style.overflow = "hidden";
    desenharBusca();
    busca.focus();
  }
  function fecharBusca() {
    painel.hidden = true;
    document.body.style.overflow = "";
  }
  busca.addEventListener("input", desenharBusca);
  $("#busca-fechar").addEventListener("click", fecharBusca);
  painel.addEventListener("click", (e) => { if (e.target === painel || e.target.id === "busca-resultados") fecharBusca(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !painel.hidden) fecharBusca();
    // "/" abre a busca, como em muitos sites
    if (e.key === "/" && painel.hidden && document.activeElement === document.body) { e.preventDefault(); abrirBusca(); }
  });

  // ---------- página inicial ----------
  function paginaInicial() {
    const mural = $("#mural");

    // Endereço antigo de categoria (./#c=Ação) vira a página da categoria.
    const antiga = decodeURIComponent(location.hash);
    if (antiga.startsWith("#c=") && categorias.includes(antiga.slice(3))) {
      location.replace(linkDaCategoria(antiga.slice(3)));
      return;
    }

    function desenhar() {
      const c = document.body.dataset.categoria;
      let html = "";

      if (c) {
        const daqui = JOGOS.filter((j) => j.categoria === c);
        html += tileTitulo(document.body.dataset.titulo || c, plural(daqui.length));
        html += ordenados(daqui).map((j) => tile(j, TAM)).join("");
        lateral(c);
      } else {
        html += ordenados(JOGOS).map((j, i) => tile(j, TAM)).join("");
        html += EM_BREVE.map(tileEmBreve).join("");
        lateral(null);
      }

      mural.innerHTML = html;
    }

    desenhar();

    // Busca vinda de outro lugar (./?q=...)
    const q = new URLSearchParams(location.search).get("q");
    if (q) { busca.value = q; abrirBusca(); }
  }

  // ---------- página do jogo ----------
  function paginaJogo() {
    const slug = document.body.dataset.slug;
    const jogo = JOGOS.find((j) => j.slug === slug);
    const mural = $("#mural");

    if (!jogo) {
      document.title = "Jogo não encontrado · Karma Games";
      mural.innerHTML = `
        <div class="erro">
          <h1>Esse jogo não está aqui.</h1>
          <p>O endereço pode estar errado ou o jogo saiu do catálogo.</p>
          <p><a class="btn-texto" href="./">Ver todos os jogos</a></p>
        </div>`;
      lateral(null);
      return;
    }

    $("#jogo-nome").textContent = jogo.titulo;
    $("#jogo-categoria").textContent = jogo.categoria || "";
    $("#jogo-acoes").hidden = false;

    // Os outros jogos ficam em volta do palco, como no Poki.
    const outros = JOGOS.filter((j) => j.slug !== jogo.slug);
    const mesmos = outros.filter((j) => j.categoria === jogo.categoria);
    const resto = outros.filter((j) => j.categoria !== jogo.categoria);
    mural.insertAdjacentHTML("beforeend",
      [...mesmos, ...resto].map((j, i) => tile(j, TAM)).join("") +
      EM_BREVE.map(tileEmBreve).join(""));
    lateral(jogo.categoria);

    // Lobby: capa, nome e botão Jogar. O jogo só carrega depois do clique.
    const palco = $("#palco");
    const carregando = $("#carregando");
    carregando.classList.add("sumir");
    const lobby = document.createElement("div");
    lobby.className = "lobby";
    lobby.innerHTML = `
      <img class="lobby-fundo" src="${esc(capaDe(jogo))}" alt="" aria-hidden="true">
      <div class="lobby-conteudo">
        <img class="lobby-capa" src="${esc(capaDe(jogo))}" alt="">
        <h2 class="lobby-titulo">${esc(jogo.titulo)}</h2>
        ${jogo.categoria ? `<span class="lobby-cat">${esc(jogo.categoria)}</span>` : ""}
        ${jogo.descricao ? `<p class="lobby-desc">${esc(jogo.descricao)}</p>` : ""}
        <button class="lobby-jogar" type="button">${icone("play")}<span>Jogar</span></button>
        ${jogo.controles ? `<p class="lobby-controles">${icone("game-controller")}<span>${esc(jogo.controles)}</span></p>` : ""}
      </div>`;
    palco.appendChild(lobby);
    lobby.querySelector(".lobby-capa").addEventListener("error", (e) => { e.target.remove(); lobby.querySelector(".lobby-fundo").remove(); });

    // No celular o jogo ocupa a tela inteira (como no Poki), com uma barrinha e o botão de sair.
    const celula = $("#palco-celula");
    const ehCelular = () => matchMedia("(pointer: coarse) and (max-width: 1024px), (max-width: 760px)").matches;
    function entrarImersivo() {
      if (document.body.classList.contains("imersivo")) return;
      document.body.classList.add("imersivo");
      history.pushState({ imersivo: true }, "");
      const tela = document.documentElement;
      const pedir = tela.requestFullscreen || tela.webkitRequestFullscreen;
      if (pedir) Promise.resolve(pedir.call(tela, { navigationUI: "hide" })).catch(() => {});
    }
    function sairImersivo(voltarHistorico) {
      if (!document.body.classList.contains("imersivo")) return;
      document.body.classList.remove("imersivo");
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (voltarHistorico && history.state && history.state.imersivo) history.back();
    }
    // O botão "voltar" do Android sai da tela cheia em vez de sair da página.
    addEventListener("popstate", () => sairImersivo(false));
    $("#btn-sair").addEventListener("click", () => sairImersivo(true));

    let frame = null;
    function comecar() {
      if (ehCelular()) entrarImersivo();
      if (frame) return;
      carregando.classList.remove("sumir");
      lobby.classList.add("sumir");
      setTimeout(() => lobby.remove(), 400);
      frame = document.createElement("iframe");
      frame.title = jogo.titulo;
      frame.src = urlDoJogo(jogo);
      frame.allow = "fullscreen; autoplay; gamepad; microphone";
      frame.setAttribute("allowfullscreen", "");
      frame.addEventListener("load", () => {
        carregando.classList.add("sumir");
        try { frame.contentWindow.focus(); } catch { /* jogo de outro domínio */ }
      });
      palco.insertBefore(frame, carregando);
      gravar(CHAVE_RECENTES, [jogo.slug, ...slugsRecentes().filter((s) => s !== jogo.slug)].slice(0, 16));
    }
    const botaoJogar = lobby.querySelector(".lobby-jogar");
    botaoJogar.addEventListener("click", comecar);

    $("#btn-reiniciar").addEventListener("click", () => {
      if (!frame) return comecar();
      carregando.classList.remove("sumir");
      frame.src = urlDoJogo(jogo);
    });
    $("#btn-tela-cheia").addEventListener("click", () => {
      if (ehCelular()) return entrarImersivo();
      if (document.fullscreenElement) document.exitFullscreen();
      else if (palco.requestFullscreen) palco.requestFullscreen().catch(() => {});
      else if (palco.webkitRequestFullscreen) palco.webkitRequestFullscreen();
    });

    if ($("#jogo-info")) $("#jogo-info").innerHTML = `
      <h2>${esc(jogo.titulo)}</h2>
      <p>${esc(jogo.descricao || "")}</p>
      ${jogo.controles ? `<div class="controles">${icone("game-controller")}<span>${esc(jogo.controles)}</span></div>` : ""}`;

  }

  if (PAGINA_JOGO) paginaJogo();
  else if (PAGINA === "inicio") paginaInicial();
  else lateral(null);
})();

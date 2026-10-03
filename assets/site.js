(function () {
  "use strict";

  const TODOS = (window.KARMA_JOGOS || []).filter((j) => j && j.slug && j.titulo);
  const JOGOS = TODOS.filter((j) => !j.emBreve);
  const EM_BREVE = TODOS.filter((j) => j.emBreve);
  const ICONES = "assets/icones.svg";
  const CHAVE_RECENTES = "karma:recentes";
  const DIAS_NOVO = 30;

  // ---------- utilidades ----------
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icone = (nome) => `<svg class="icon" aria-hidden="true"><use href="${ICONES}#i-${nome}"/></svg>`;
  const normalizar = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const capaDe = (j) => j.capa || `assets/capas/${j.slug}.webp`;
  const urlDoJogo = (j) => j.url || `jogos/${j.slug}/`;
  const linkDoJogo = (j) => `jogar.html?j=${encodeURIComponent(j.slug)}`;
  // Selo "Novo" só faz sentido se nem todo mundo for novo.
  const recemChegado = (j) => {
    if (!j.adicionado) return false;
    const dias = (Date.now() - new Date(j.adicionado + "T00:00:00").getTime()) / 864e5;
    return dias >= 0 && dias <= DIAS_NOVO;
  };
  const poucosNovos = JOGOS.filter(recemChegado).length <= JOGOS.length / 2;
  const ehNovo = (j) => poucosNovos && recemChegado(j);

  function ler(chave, padrao) {
    try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento, tudo bem */ }
  }

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

  function card(j) {
    return `
      <a class="card" href="${linkDoJogo(j)}">
        <div class="card-capa">
          ${ehNovo(j) ? '<span class="selo">Novo</span>' : ""}
          ${imgCapa(j)}
          <span class="bolha-play">${icone("play")}</span>
        </div>
        <div>
          <h3>${esc(j.titulo)}</h3>
          <div class="card-meta">${esc(j.categoria || "Jogo")}</div>
        </div>
      </a>`;
  }

  // ---------- página inicial ----------
  function paginaInicial() {
    const destaque = JOGOS.find((j) => j.destaque) || JOGOS[0];

    if (destaque) {
      $("#destaque").innerHTML = `
        <div class="wrap">
          <div>
            <h1 class="entra">Jogos grátis, <em>direto</em> no navegador.</h1>
            <p class="entra entra-2">Sem download e sem cadastro. Escolha um jogo e comece agora, no computador ou no celular.</p>
            <div class="destaque-acoes entra entra-3">
              <a class="btn btn-primario" href="${linkDoJogo(destaque)}">${icone("play")} Jogar ${esc(destaque.titulo)}</a>
              <a class="btn btn-fantasma" href="#catalogo">Ver catálogo</a>
            </div>
          </div>
          <a class="destaque-capa entra entra-2" href="${linkDoJogo(destaque)}" aria-label="Jogar ${esc(destaque.titulo)}">
            ${imgCapa(destaque, 'fetchpriority="high" loading="eager"')}
            <span class="destaque-legenda">
              <span><strong>${esc(destaque.titulo)}</strong><span>${esc(destaque.descricao || "")}</span></span>
              <span class="bolha-play">${icone("play")}</span>
            </span>
          </a>
        </div>`;
    }

    // Continue jogando
    const recentes = ler(CHAVE_RECENTES, [])
      .map((slug) => JOGOS.find((j) => j.slug === slug))
      .filter(Boolean)
      .slice(0, 8);
    if (recentes.length) {
      $("#recentes").innerHTML = recentes.map((j) => `
        <a class="recente" href="${linkDoJogo(j)}">${imgCapa(j)}<span>${esc(j.titulo)}</span></a>`).join("");
      $("#secao-recentes").hidden = false;
    }

    // Filtros e busca
    const categorias = ["Todos", ...new Set(JOGOS.map((j) => j.categoria).filter(Boolean))];
    let categoria = "Todos";
    let termo = "";

    const filtros = $("#filtros");
    filtros.innerHTML = categorias.map((c) =>
      `<button class="filtro" type="button" data-cat="${esc(c)}" aria-pressed="${c === categoria}">${esc(c)}</button>`).join("");
    filtros.addEventListener("click", (e) => {
      const b = e.target.closest(".filtro");
      if (!b) return;
      categoria = b.dataset.cat;
      filtros.querySelectorAll(".filtro").forEach((f) => f.setAttribute("aria-pressed", f === b));
      desenharGrade();
    });

    const busca = $("#busca");
    busca.addEventListener("input", () => {
      termo = normalizar(busca.value.trim());
      desenharGrade();
    });
    busca.addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
    });

    function desenharGrade() {
      const lista = JOGOS.filter((j) =>
        (categoria === "Todos" || j.categoria === categoria) &&
        (!termo || normalizar(`${j.titulo} ${j.descricao} ${j.categoria}`).includes(termo)));

      $("#titulo-catalogo").textContent = termo ? "Resultados da busca" : categoria === "Todos" ? "Todos os jogos" : categoria;
      $("#contagem").textContent = `${lista.length} ${lista.length === 1 ? "jogo" : "jogos"}`;
      $("#grade").innerHTML = lista.length
        ? lista.map(card).join("")
        : `<div class="vazio"><strong>Nenhum jogo encontrado</strong>Tente outra palavra ou veja todas as categorias.
             <br><button class="btn btn-fantasma" type="button" id="limpar">Limpar busca</button></div>`;

      const limpar = $("#limpar");
      if (limpar) limpar.addEventListener("click", () => {
        busca.value = ""; termo = ""; categoria = "Todos";
        filtros.querySelectorAll(".filtro").forEach((f) => f.setAttribute("aria-pressed", f.dataset.cat === "Todos"));
        desenharGrade();
        busca.focus();
      });
    }
    desenharGrade();

    // Feitos aqui (jogos próprios) e Em breve
    const autorais = JOGOS.filter((j) => j.autoral);
    let html = "";
    if (autorais.length) {
      html += `<div class="secao-topo"><h2 id="titulo-feitos">Feitos aqui</h2></div><div class="grade">${autorais.map(card).join("")}</div>`;
    }
    if (EM_BREVE.length) {
      html += `<div class="secao-topo${autorais.length ? " secao-topo-espaco" : ""}"><h2 ${autorais.length ? "" : 'id="titulo-feitos"'}>Em breve</h2></div>
        <div class="breve-lista">${EM_BREVE.map(cardEmBreve).join("")}</div>`;
    }
    if (!html) {
      html = `<div class="feitos">
           <span class="feitos-simbolo">${icone("game-controller")}</span>
           <div>
             <h2 id="titulo-feitos">Jogos feitos aqui, em breve</h2>
             <p>Estamos criando jogos próprios da Karma. Quando ficarem prontos, eles aparecem primeiro nesta seção.</p>
           </div>
         </div>`;
    }
    $("#feitos").innerHTML = html;
  }

  function cardEmBreve(j) {
    return `
      <article class="breve">
        <div class="breve-capa">${imgCapa(j)}</div>
        <div class="breve-texto">
          <h3>${esc(j.titulo)}</h3>
          <div class="card-meta">${esc(j.categoria || "Jogo")}${j.autoral ? " · Feito aqui na Karma" : ""}</div>
          <p>${esc(j.descricao || "")}</p>
        </div>
      </article>`;
  }

  // ---------- página do jogo ----------
  function paginaJogo() {
    const slug = new URLSearchParams(location.search).get("j");
    const jogo = JOGOS.find((j) => j.slug === slug);

    if (!jogo) {
      document.title = "Jogo não encontrado · Karma Games";
      $("#jogo-nome").textContent = "Jogo não encontrado";
      $("#conteudo").innerHTML = `
        <div class="wrap erro">
          <h1>Esse jogo não está aqui.</h1>
          <p>O endereço pode estar errado ou o jogo saiu do catálogo.</p>
          <a class="btn btn-primario" href="./">Ver todos os jogos</a>
        </div>`;
      return;
    }

    document.title = `${jogo.titulo} · Karma Games`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && jogo.descricao) meta.content = `${jogo.descricao} Jogue grátis na Karma Games.`;
    $("#jogo-nome").textContent = jogo.titulo;
    $("#jogo-categoria").textContent = jogo.categoria || "";
    $("#jogo-acoes").hidden = false;

    const palco = $("#palco");
    const frame = document.createElement("iframe");
    frame.title = jogo.titulo;
    frame.src = urlDoJogo(jogo);
    frame.allow = "fullscreen; autoplay; gamepad";
    frame.setAttribute("allowfullscreen", "");
    frame.addEventListener("load", () => {
      $("#carregando").classList.add("sumir");
      try { frame.contentWindow.focus(); } catch { /* jogo de outro domínio */ }
    });
    palco.appendChild(frame);

    $("#btn-reiniciar").addEventListener("click", () => {
      $("#carregando").classList.remove("sumir");
      frame.src = urlDoJogo(jogo);
    });
    $("#btn-tela-cheia").addEventListener("click", () => {
      const alvo = palco;
      if (document.fullscreenElement) document.exitFullscreen();
      else if (alvo.requestFullscreen) alvo.requestFullscreen().catch(() => {});
      else if (alvo.webkitRequestFullscreen) alvo.webkitRequestFullscreen();
    });

    $("#jogo-info").innerHTML = `
      <p>${esc(jogo.descricao || "")}</p>
      ${jogo.controles ? `<div class="controles">${icone("game-controller")}<span>${esc(jogo.controles)}</span></div>` : ""}`;

    const outros = JOGOS.filter((j) => j.slug !== jogo.slug);
    const mesmos = outros.filter((j) => j.categoria === jogo.categoria);
    const resto = outros.filter((j) => j.categoria !== jogo.categoria);
    $("#mais").innerHTML = [...mesmos, ...resto].slice(0, 4).map(card).join("");

    gravar(CHAVE_RECENTES, [jogo.slug, ...ler(CHAVE_RECENTES, []).filter((s) => s !== jogo.slug)].slice(0, 12));
  }

  if (document.body.dataset.pagina === "jogar") paginaJogo();
  else paginaInicial();
})();

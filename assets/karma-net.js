/* Karma Net: multiplayer online dos jogos do Karma Games.
 *
 * Fala com o servidor de salas (realtime/servidor.mjs) por WebSocket. O servidor só repassa:
 * a regra continua no jogo, e cada lado aplica a jogada que chega com a mesma função do clique.
 *
 * Uso num jogo (ver jogos/ligue-4):
 *   <script src="../../assets/karma-net.js"></script>
 *   const sala = await KarmaNet.lobby({ jogo: "ligue-4", titulo: "Ligue 4" });  // null se cancelou
 *     lobby: Jogo rápido (entra numa sala aberta ou cria uma), lista de salas abertas, sala com amigo
 *     (código/convite) e entrar com código. Com max 2 resolve quando os dois estão na mesa; com mais
 *     lugares (crossstrike) resolve assim que entra, e o jogo cuida da espera.
 *   sala.lugar            // 0 = quem criou, 1 = quem entrou
 *   sala.enviar({ c: 3 }) // jogada
 *   sala.on("msg", (dados, de) => ...)
 *   sala.on("saiu", (lugar) => ...)   // também: entrou, caiu, voltou, conexao(true|false)
 *   sala.publicar(estado) // snapshot guardado no servidor: quem recarrega a página recebe em sala.estado
 *   sala.abrir(false)     // tira a sala da lista do lobby (ex.: a partida começou)
 *   sala.sair()
 *
 * Convite: jogar/<slug>/?sala=CODIGO. O site repassa o ?sala ao iframe, e o lobby entra direto.
 */
(function () {
  "use strict";

  // o primeiro caractere do código diz o servidor; criar tenta na ordem e usa o primeiro que responde
  const SERVIDORES = { 1: "wss://rt1.karmagames.com.br", 2: "wss://rt2.karmagames.com.br" };
  const ORDEM = ["1", "2"];
  const NOME_KEY = "karma:net:nome";
  const RETOMA_KEY = (jogo) => `karma:net:sala:${jogo}`;
  const TIMEOUT_MS = 8000;

  // teste local: ?rt=ws://localhost:4810 aponta tudo pra um servidor só
  const params = (() => {
    const p = new URLSearchParams(location.search);
    try { if (window.top !== window) new URLSearchParams(window.top.location.search).forEach((v, k) => p.has(k) || p.set(k, v)); } catch { /* outro domínio */ }
    return p;
  })();
  const urlDe = (codigo) => params.get("rt") || SERVIDORES[String(codigo)[0]] || SERVIDORES[ORDEM[0]];

  const ler = (k, padrao) => { try { return localStorage.getItem(k) ?? padrao; } catch { return padrao; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sem storage */ } };
  const lerSessao = (k) => { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } };
  const gravarSessao = (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* sem storage */ } };

  // ---------- conexão ----------

  function abre(url) {
    return new Promise((ok, falha) => {
      let ws;
      try { ws = new WebSocket(url); } catch (e) { return falha(e); }
      const t = setTimeout(() => { ws.close(); falha(new Error("servidor não respondeu")); }, TIMEOUT_MS);
      ws.onopen = () => { clearTimeout(t); ok(ws); };
      ws.onerror = () => { clearTimeout(t); falha(new Error("não deu pra conectar")); };
    });
  }

  function pede(ws, pedido) {
    return new Promise((ok, falha) => {
      const t = setTimeout(() => falha(new Error("servidor não respondeu")), TIMEOUT_MS);
      ws.onmessage = (ev) => {
        const m = JSON.parse(ev.data);
        if (m.t === "sala") { clearTimeout(t); ok(m); }
        else if (m.t === "erro") { clearTimeout(t); falha(new Error(m.motivo)); }
      };
      ws.onclose = () => { clearTimeout(t); falha(new Error("conexão caiu")); };
      ws.send(JSON.stringify(pedido));
    });
  }

  class Sala {
    constructor(ws, info, url) {
      this.ouvintes = {};
      this.url = url;
      this.saindo = false;
      this.aplica(info);
      this.liga(ws);
    }

    aplica(info) {
      this.codigo = info.codigo;
      this.jogo = info.jogo;
      this.lugar = info.lugar;
      this.chave = info.chave;
      this.max = info.max;
      this.aberta = !!info.aberta;
      this.criada = info.criada;
      this.jogadores = info.jogadores;
      this.estado = info.estado;
      gravarSessao(RETOMA_KEY(this.jogo), { codigo: this.codigo, chave: this.chave });
    }

    get link() {
      return `${location.origin}/jogar/${encodeURIComponent(this.jogo)}/?sala=${this.codigo}`;
    }
    get cheia() { return this.jogadores.length >= this.max; }
    nomeDe(lugar) { return (this.jogadores.find((j) => j.lugar === lugar) || {}).nome || "Adversário"; }

    on(evento, fn) { (this.ouvintes[evento] ||= []).push(fn); return this; }
    emite(evento, ...args) { (this.ouvintes[evento] || []).forEach((fn) => { try { fn(...args); } catch (e) { console.error(e); } }); }

    liga(ws) {
      this.ws = ws;
      this.tentativas = 0;
      ws.onmessage = (ev) => this.recebe(JSON.parse(ev.data));
      ws.onclose = () => this.caiu();
    }

    recebe(m) {
      switch (m.t) {
        case "msg": return this.emite("msg", m.dados, m.de);
        case "entrou":
          this.jogadores = this.jogadores.filter((j) => j.lugar !== m.jogador.lugar).concat(m.jogador).sort((a, b) => a.lugar - b.lugar);
          return this.emite("entrou", m.jogador);
        case "caiu": case "voltou": {
          const j = this.jogadores.find((x) => x.lugar === m.lugar);
          if (j) j.on = m.t === "voltou";
          aviso(m.t === "caiu" ? `${this.nomeDe(m.lugar)} caiu. Esperando voltar…` : `${this.nomeDe(m.lugar)} voltou`, m.t === "caiu");
          return this.emite(m.t, m.lugar);
        }
        case "saiu":
          // o jogo ainda acha o nome de quem saiu (sala.nomeDe) durante o evento; a lista muda depois
          aviso(`${this.nomeDe(m.lugar)} saiu da sala`, true);
          this.emite("saiu", m.lugar);
          this.jogadores = this.jogadores.filter((j) => j.lugar !== m.lugar);
          return;
      }
    }

    // queda nossa (rede, celular dormiu): volta sozinho com a chave, sem perder o lugar
    caiu() {
      if (this.saindo) return;
      this.emite("conexao", false);
      aviso("Sem conexão. Tentando voltar…", true);
      const espera = Math.min(1000 * 2 ** this.tentativas++, 15000);
      setTimeout(async () => {
        if (this.saindo) return;
        try {
          const ws = await abre(this.url);
          const info = await pede(ws, { t: "entrar", codigo: this.codigo, chave: this.chave });
          this.aplica(info);
          this.liga(ws);
          aviso("Conectado de novo");
          this.emite("conexao", true);
        } catch (e) {
          if (/não encontrada/.test(e.message)) { this.encerra(); return this.emite("saiu", -1); }
          this.caiu();
        }
      }, espera);
    }

    envia(obj) {
      if (this.ws && this.ws.readyState === 1) { this.ws.send(JSON.stringify(obj)); return true; }
      return false;
    }
    enviar(dados, para) { return this.envia(para == null ? { t: "msg", dados } : { t: "msg", dados, para }); }
    publicar(estado) { this.estado = estado; return this.envia({ t: "estado", dados: estado }); }

    encerra() {
      this.saindo = true;
      gravarSessao(RETOMA_KEY(this.jogo), null);
      if (this.ws) { this.ws.onclose = null; this.ws.close(); }
    }
    sair() { this.envia({ t: "sair" }); this.encerra(); }
    abrir(aberta) { this.aberta = !!aberta; return this.envia({ t: "abrir", aberta: !!aberta }); }
  }

  async function criar({ jogo, max = 2, nome, aberta = false }) {
    let ultimo;
    for (const prefixo of params.get("rt") ? [ORDEM[0]] : ORDEM) {
      const url = urlDe(prefixo);
      try {
        const ws = await abre(url);
        return new Sala(ws, await pede(ws, { t: "criar", jogo, max, nome, aberta }), url);
      } catch (e) { ultimo = e; }
    }
    throw ultimo;
  }

  async function entrar({ jogo, codigo, nome, chave }) {
    codigo = String(codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (codigo.length < 5) throw new Error("código incompleto");
    const url = urlDe(codigo);
    const ws = await abre(url);
    return new Sala(ws, await pede(ws, { t: "entrar", jogo, codigo, nome, chave }), url);
  }

  // salas abertas de todos os servidores, mais antigas primeiro. Servidor fora do ar só some da lista
  const httpDe = (ws) => ws.replace(/^ws/, "http");
  async function listar(jogo) {
    const urls = params.get("rt") ? [params.get("rt")] : ORDEM.map((p) => SERVIDORES[p]);
    const listas = await Promise.all(urls.map(async (u) => {
      try {
        const r = await fetch(`${httpDe(u)}/salas?jogo=${encodeURIComponent(jogo)}`, { signal: AbortSignal.timeout(4000), cache: "no-store" });
        return (await r.json()).salas || [];
      } catch { return []; }
    }));
    return listas.flat().sort((a, b) => a.criada - b.criada);
  }

  // recarregou a página no meio da partida: volta pra mesma sala e lugar
  async function retomar(jogo) {
    const r = lerSessao(RETOMA_KEY(jogo));
    if (!r) return null;
    try { return await entrar({ jogo, ...r }); } catch { gravarSessao(RETOMA_KEY(jogo), null); return null; }
  }

  // ---------- interface (lobby e avisos) ----------

  const CSS = `
.kn-ov{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:16px;background:rgba(13,14,18,.82);font:400 15px/1.4 "Geist",system-ui,sans-serif;color:var(--text,#f2f3f5);animation:kn-fade .2s ease}
.kn-dlg{width:min(100%,360px);max-height:calc(100dvh - 32px);overflow-y:auto;overscroll-behavior:contain;background:var(--surface,#171920);border:1px solid var(--line,#262a33);border-radius:var(--r,12px);padding:24px 22px 20px;text-align:center;box-shadow:0 16px 40px rgba(0,0,0,.5)}
.kn-dlg h2{font:800 22px/1.15 var(--display,system-ui);margin:0 0 6px}
.kn-dlg p{color:var(--muted,#9aa0ab);margin:0 0 14px}
.kn-col{display:flex;flex-direction:column;gap:10px}
.kn-row{display:flex;gap:8px;justify-content:center}
.kn-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:999px;background:var(--raised,#1f222b);border:1px solid var(--line,#262a33);color:inherit;font:600 14px/1 inherit;cursor:pointer}
.kn-btn:hover{background:#292d38}
.kn-btn.kn-pri{background:var(--accent,#c8f13a);border-color:var(--accent,#c8f13a);color:var(--bg,#0d0e12)}
.kn-btn.kn-ghost{background:none;border-color:transparent;color:var(--muted,#9aa0ab)}
.kn-in{width:100%;min-height:44px;padding:0 14px;border-radius:10px;border:1px solid var(--line,#262a33);background:var(--bg,#0d0e12);color:inherit;font:600 16px/1 inherit;text-align:center;user-select:text;-webkit-user-select:text}
.kn-in.kn-cod{font:800 24px/1 var(--display,monospace);letter-spacing:.18em;text-transform:uppercase}
.kn-code{font:800 34px/1 var(--display,monospace);letter-spacing:.16em;color:var(--accent,#c8f13a);margin:6px 0 14px;user-select:text;-webkit-user-select:text}
.kn-sub{font:600 12px/1 inherit;color:var(--muted,#9aa0ab);text-transform:uppercase;letter-spacing:.08em;text-align:left;margin:8px 2px 0}
.kn-lista{display:flex;flex-direction:column;gap:6px;max-height:190px;overflow-y:auto;text-align:left}
.kn-item{display:flex;align-items:center;gap:10px;min-height:48px;padding:6px 6px 6px 14px;border-radius:10px;background:var(--bg,#0d0e12);border:1px solid var(--line,#262a33);color:inherit;font:inherit;cursor:pointer;width:100%;text-align:left}
.kn-item:hover{border-color:var(--accent,#c8f13a)}
.kn-item b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
.kn-item small{color:var(--muted,#9aa0ab);font-variant-numeric:tabular-nums}
.kn-item span{padding:8px 12px;border-radius:999px;background:var(--raised,#1f222b);font-weight:600;font-size:13px}
.kn-vazio{color:var(--muted,#9aa0ab);font-size:14px;padding:10px 4px;text-align:center}
.kn-linha{display:flex;align-items:center;gap:10px;color:var(--muted,#9aa0ab);font-size:12px;margin:4px 0}
.kn-linha::before,.kn-linha::after{content:"";flex:1;height:1px;background:var(--line,#262a33)}
.kn-erro{color:var(--coral,#ff6b5a);font-weight:600;min-height:1.4em;margin-top:8px}
.kn-esp{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent,#c8f13a);margin-right:8px;animation:kn-pulse 1s ease infinite}
.kn-toast{position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);z-index:70;padding:8px 14px;border-radius:999px;background:var(--raised,#1f222b);border:1px solid var(--line,#262a33);color:var(--text,#f2f3f5);font:600 13px/1.2 "Geist",system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.4);animation:kn-fade .2s ease;pointer-events:none}
.kn-toast.kn-ruim{border-color:var(--coral,#ff6b5a)}
@keyframes kn-fade{from{opacity:0}}
@keyframes kn-pulse{50%{opacity:.3}}
@media (prefers-reduced-motion:reduce){.kn-ov,.kn-toast,.kn-esp{animation:none}}`;

  function estilo() {
    if (document.getElementById("kn-css")) return;
    const s = document.createElement("style");
    s.id = "kn-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  let toastTimer;
  function aviso(texto, ruim) {
    estilo();
    let t = document.querySelector(".kn-toast");
    if (!t) { t = document.createElement("div"); t.className = "kn-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = texto;
    t.classList.toggle("kn-ruim", !!ruim);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), ruim ? 6000 : 2500);
  }

  const el = (html) => { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  // Abre a sala. Resolve com a Sala (com max 2, quando os dois estão na mesa) ou null se cancelou.
  function lobby({ jogo, titulo = "Jogar online", max = 2 }) {
    estilo();
    const esperaCheia = max <= 2;
    return new Promise((resolve) => {
      const ov = el(`<div class="kn-ov"><div class="kn-dlg" role="dialog" aria-modal="true" aria-label="${esc(titulo)}"></div></div>`);
      const dlg = ov.firstChild;
      document.body.appendChild(ov);
      let sala = null, timer = null, vivo = true;
      const para = () => { clearInterval(timer); timer = null; };
      const fecha = (r) => { vivo = false; para(); ov.remove(); resolve(r); };
      const cancela = () => { if (sala) sala.sair(); fecha(null); };
      ov.addEventListener("keydown", (e) => { if (e.key === "Escape") cancela(); });
      const nome = () => { const i = dlg.querySelector("#kn-nome"); const n = i ? i.value.trim() : ler(NOME_KEY, ""); gravar(NOME_KEY, n); return n; };

      // sala criada esperando gente. Na aberta, se aparecer outra aberta mais antiga (duas pessoas
      // tocaram em Jogo rápido juntas), muda pra ela: a mais antiga fica, e os dois se encontram
      const esperando = (s) => {
        sala = s;
        if (!esperaCheia || s.cheia) return fecha(s);
        para();
        dlg.innerHTML = s.aberta ? `
          <h2>Procurando adversário</h2>
          <p><span class="kn-esp"></span>Sua sala está na lista. Quem tocar em Jogo rápido cai aqui.</p>
          <div class="kn-col">
            <button class="kn-btn" data-a="link">Chamar um amigo (${esc(s.codigo)})</button>
            <button class="kn-btn kn-ghost" data-a="cancelar">Cancelar</button>
          </div>` : `
          <h2>Sala criada</h2>
          <p>Passe o código ou o link pra quem vai jogar com você.</p>
          <div class="kn-code">${esc(s.codigo)}</div>
          <div class="kn-col">
            <button class="kn-btn kn-pri" data-a="link">${navigator.share ? "Compartilhar convite" : "Copiar link do convite"}</button>
            <p style="margin:6px 0 0"><span class="kn-esp"></span>Esperando adversário…</p>
            <button class="kn-btn kn-ghost" data-a="cancelar">Cancelar</button>
          </div>`;
        dlg.querySelector('[data-a="link"]').onclick = async (e) => {
          try {
            if (navigator.share) await navigator.share({ title: titulo, text: `Bora jogar ${titulo}? Código ${s.codigo}`, url: s.link });
            else { await navigator.clipboard.writeText(s.link); e.target.textContent = "Link copiado!"; }
          } catch { /* fechou o compartilhar */ }
        };
        dlg.querySelector('[data-a="cancelar"]').onclick = cancela;
        s.on("entrou", () => { if (s.cheia && vivo && sala === s) fecha(s); });
        if (s.aberta) timer = setInterval(async () => {
          const outra = (await listar(jogo)).find((x) => x.codigo !== s.codigo && x.criada < s.criada);
          if (!outra || !vivo || sala !== s || s.cheia) return;
          try {
            const nova = await entrar({ jogo, codigo: outra.codigo, nome: nome() });
            s.sair();
            esperando(nova);
          } catch { /* encheu antes: segue esperando na própria */ }
        }, 3000);
      };

      const tenta = async (botao, acao) => {
        const erro = dlg.querySelector(".kn-erro");
        if (botao) botao.disabled = true;
        if (erro) erro.textContent = "";
        try { esperando(await acao()); } catch (e) { if (erro) erro.textContent = e.message; if (botao) botao.disabled = false; }
      };

      // Jogo rápido: a sala aberta mais antiga com vaga; se nenhuma, cria uma aberta e espera nela
      const rapido = async () => {
        for (const x of await listar(jogo)) {
          try { return await entrar({ jogo, codigo: x.codigo, nome: nome() }); } catch { /* encheu: tenta a próxima */ }
        }
        return criar({ jogo, max, nome: nome(), aberta: true });
      };

      const pintaLista = (lista) => {
        const box = dlg.querySelector(".kn-lista");
        if (!box) return;
        box.innerHTML = lista.length ? lista.map((x) => `
          <button class="kn-item" data-cod="${esc(x.codigo)}"><b>Sala de ${esc(x.dono)}</b><small>${x.jogadores}/${x.max}</small><span>Entrar</span></button>`).join("")
          : `<div class="kn-vazio">Nenhuma sala aberta agora. Toque em Jogo rápido e a sua aparece aqui.</div>`;
        box.querySelectorAll(".kn-item").forEach((b) => {
          b.onclick = () => tenta(b, () => entrar({ jogo, codigo: b.dataset.cod, nome: nome() }));
        });
      };

      const inicio = () => {
        dlg.innerHTML = `
          <h2>${esc(titulo)} online</h2>
          <div class="kn-col">
            <input class="kn-in" id="kn-nome" maxlength="20" placeholder="Seu nome" autocomplete="nickname" value="${esc(ler(NOME_KEY, ""))}">
            <button class="kn-btn kn-pri" data-a="rapido">Jogo rápido</button>
            <div class="kn-sub">Salas abertas</div>
            <div class="kn-lista" aria-live="polite"><div class="kn-vazio">Procurando salas…</div></div>
            <div class="kn-linha">ou jogue com um amigo</div>
            <button class="kn-btn" data-a="criar">Criar sala com código</button>
            <div class="kn-row"><input class="kn-in kn-cod" id="kn-cod" maxlength="5" placeholder="CÓDIGO" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="kn-btn" data-a="entrar">Entrar</button></div>
            <button class="kn-btn kn-ghost" data-a="cancelar">Voltar</button>
          </div>
          <div class="kn-erro" role="alert"></div>`;
        const cod = dlg.querySelector("#kn-cod");
        dlg.querySelector('[data-a="rapido"]').onclick = (e) => tenta(e.target, rapido);
        dlg.querySelector('[data-a="criar"]').onclick = (e) => tenta(e.target, () => criar({ jogo, max, nome: nome() }));
        const entra = () => tenta(dlg.querySelector('[data-a="entrar"]'), () => entrar({ jogo, codigo: cod.value, nome: nome() }));
        dlg.querySelector('[data-a="entrar"]').onclick = entra;
        cod.addEventListener("keydown", (e) => { if (e.key === "Enter") entra(); });
        dlg.querySelector('[data-a="cancelar"]').onclick = cancela;
        const atualiza = async () => { const l = await listar(jogo); if (vivo && !sala) pintaLista(l); };
        atualiza();
        timer = setInterval(atualiza, 3000);
      };

      // convite: entra direto, pedindo só o nome se ainda não tem
      const convite = params.get("sala");
      inicio();
      if (convite && !lobby.usouConvite) {
        lobby.usouConvite = true;
        dlg.querySelector("#kn-cod").value = convite.toUpperCase();
        if (ler(NOME_KEY, "")) dlg.querySelector('[data-a="entrar"]').click();
      }
      setTimeout(() => dlg.querySelector("input,button")?.focus(), 50);
    });
  }

  window.KarmaNet = { lobby, criar, entrar, listar, retomar, aviso, convite: params.get("sala") };
})();

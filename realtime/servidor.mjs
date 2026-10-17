// Servidor de salas do Karma Games: WebSocket genérico, não conhece regra de nenhum jogo.
// Cria sala com código, repassa mensagens entre quem está nela, guarda o último estado que o
// anfitrião publicou (pra quem entra ou volta) e segura o lugar de quem caiu por um tempo.
//
// Protocolo (JSON, um objeto por mensagem; ver assets/karma-net.js):
//   cliente → servidor
//     {t:"criar", jogo, nome, max}            → {t:"sala", ...}
//     {t:"entrar", codigo, jogo, nome, chave?} → {t:"sala", ...} ou {t:"erro", motivo}
//     {t:"msg", dados, para?}                 repassa a todos (ou só ao lugar `para`)
//     {t:"estado", dados}                     guarda o snapshot da sala (qualquer jogador)
//     {t:"sair"}
//   servidor → cliente
//     {t:"sala", codigo, jogo, lugar, chave, max, jogadores:[{lugar,nome,on}], estado}
//     {t:"msg", de, dados}  {t:"entrou", jogador}  {t:"caiu", lugar}  {t:"voltou", lugar}
//     {t:"saiu", lugar}  {t:"erro", motivo}
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { WebSocketServer } from "ws";

const PORTA = Number(process.env.PORTA || 4810);
const HOST = process.env.HOST || "127.0.0.1";
// o primeiro caractere do código diz em qual servidor a sala mora: a lib conecta direto nele
const PREFIXO = process.env.PREFIXO || "1";
const ORIGENS = (process.env.ORIGENS ||
  "https://karmagames.com.br,https://www.karmagames.com.br,https://thelucasisreal.github.io")
  .split(",").map((s) => s.trim()).filter(Boolean);

const MAX_SALAS = 2000;
const MAX_JOGADORES = 8;
const MAX_BYTES = 8 * 1024;          // jogada de tabuleiro é dezena de bytes; snapshot cabe folgado
const MSGS_POR_SEG = 40;             // crossstrike manda 20/s; folga pra rajada de eventos
const ESPERA_VOLTA_MS = 90_000;      // quem caiu (aba fechou, celular dormiu) tem esse tempo pra voltar
const SALA_VAZIA_MS = 5 * 60_000;
const PING_MS = 25_000;
// sem 0/O/1/I/L: código é lido em voz alta e digitado no celular
const LETRAS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const salas = new Map();
let conexoes = 0;
const inicio = Date.now();

function novoCodigo() {
  for (;;) {
    const b = randomBytes(4);
    const c = PREFIXO + [...b].map((x) => LETRAS[x % LETRAS.length]).join("");
    if (!salas.has(c)) return c;
  }
}

const limpaNome = (n) => String(n || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 20) || "Jogador";
const limpaJogo = (j) => String(j || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);

function envia(ws, obj) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function jogadoresDe(sala) {
  return [...sala.jogadores.values()].map((j) => ({ lugar: j.lugar, nome: j.nome, on: !!j.ws }));
}

function difunde(sala, obj, menos) {
  const txt = JSON.stringify(obj);
  for (const j of sala.jogadores.values()) {
    if (j.lugar !== menos && j.ws && j.ws.readyState === 1) j.ws.send(txt);
  }
}

function descreveSala(sala, j) {
  return {
    t: "sala", codigo: sala.codigo, jogo: sala.jogo, lugar: j.lugar, chave: j.chave,
    max: sala.max, jogadores: jogadoresDe(sala), estado: sala.estado,
  };
}

function primeiroLugarLivre(sala) {
  for (let i = 0; i < sala.max; i++) if (!sala.jogadores.has(i)) return i;
  return -1;
}

function removeJogador(sala, lugar) {
  const j = sala.jogadores.get(lugar);
  if (!j) return;
  clearTimeout(j.timer);
  sala.jogadores.delete(lugar);
  difunde(sala, { t: "saiu", lugar });
  if (!sala.jogadores.size) agendaFim(sala);
}

function agendaFim(sala) {
  clearTimeout(sala.timerFim);
  sala.timerFim = setTimeout(() => {
    if (![...sala.jogadores.values()].some((j) => j.ws)) {
      for (const j of sala.jogadores.values()) clearTimeout(j.timer);
      salas.delete(sala.codigo);
    }
  }, SALA_VAZIA_MS);
}

function senta(ws, sala, j) {
  ws.sala = sala;
  ws.lugar = j.lugar;
  j.ws = ws;
  clearTimeout(j.timer);
  clearTimeout(sala.timerFim);
}

function trata(ws, msg) {
  const sala = ws.sala;
  switch (msg.t) {
    case "criar": {
      if (sala) return envia(ws, { t: "erro", motivo: "já está numa sala" });
      if (salas.size >= MAX_SALAS) return envia(ws, { t: "erro", motivo: "servidor cheio, tente de novo" });
      const jogo = limpaJogo(msg.jogo);
      if (!jogo) return envia(ws, { t: "erro", motivo: "jogo inválido" });
      const max = Math.min(Math.max(Number(msg.max) || 2, 2), MAX_JOGADORES);
      const nova = { codigo: novoCodigo(), jogo, max, jogadores: new Map(), estado: null, criada: Date.now() };
      salas.set(nova.codigo, nova);
      const j = { lugar: 0, nome: limpaNome(msg.nome), chave: randomBytes(12).toString("base64url"), ws: null };
      nova.jogadores.set(0, j);
      senta(ws, nova, j);
      return envia(ws, descreveSala(nova, j));
    }
    case "entrar": {
      if (sala) return envia(ws, { t: "erro", motivo: "já está numa sala" });
      const alvo = salas.get(String(msg.codigo || "").toUpperCase().trim());
      if (!alvo) return envia(ws, { t: "erro", motivo: "sala não encontrada" });
      if (msg.jogo && limpaJogo(msg.jogo) !== alvo.jogo) {
        return envia(ws, { t: "erro", motivo: `essa sala é de outro jogo (${alvo.jogo})` });
      }
      // volta de quem caiu: a chave devolve o mesmo lugar, com o estado que a sala tem agora
      const antigo = msg.chave && [...alvo.jogadores.values()].find((j) => j.chave === msg.chave);
      if (antigo) {
        if (antigo.ws && antigo.ws !== ws) { antigo.ws.sala = null; antigo.ws.close(4000, "entrou em outra aba"); }
        senta(ws, alvo, antigo);
        envia(ws, descreveSala(alvo, antigo));
        return difunde(alvo, { t: "voltou", lugar: antigo.lugar }, antigo.lugar);
      }
      const lugar = primeiroLugarLivre(alvo);
      if (lugar < 0) return envia(ws, { t: "erro", motivo: "sala cheia" });
      const j = { lugar, nome: limpaNome(msg.nome), chave: randomBytes(12).toString("base64url"), ws: null };
      alvo.jogadores.set(lugar, j);
      senta(ws, alvo, j);
      envia(ws, descreveSala(alvo, j));
      return difunde(alvo, { t: "entrou", jogador: { lugar, nome: j.nome, on: true } }, lugar);
    }
    case "msg": {
      if (!sala) return;
      const out = { t: "msg", de: ws.lugar, dados: msg.dados };
      if (Number.isInteger(msg.para)) return envia(sala.jogadores.get(msg.para)?.ws, out);
      return difunde(sala, out, ws.lugar);
    }
    case "estado":
      if (sala) sala.estado = msg.dados ?? null;
      return;
    case "sair":
      if (sala) { ws.sala = null; removeJogador(sala, ws.lugar); }
      return;
    case "ping":
      return envia(ws, { t: "pong", ts: msg.ts });
    default:
      return envia(ws, { t: "erro", motivo: "mensagem desconhecida" });
  }
}

function caiu(ws) {
  conexoes--;
  const sala = ws.sala;
  if (!sala) return;
  const j = sala.jogadores.get(ws.lugar);
  if (!j || j.ws !== ws) return;
  j.ws = null;
  difunde(sala, { t: "caiu", lugar: j.lugar });
  j.timer = setTimeout(() => removeJogador(sala, j.lugar), ESPERA_VOLTA_MS);
  if (![...sala.jogadores.values()].some((x) => x.ws)) agendaFim(sala);
}

const http = createServer((req, res) => {
  if (req.url === "/saude") {
    const jogadores = [...salas.values()].reduce((n, s) => n + s.jogadores.size, 0);
    const porJogo = {};
    for (const s of salas.values()) porJogo[s.jogo] = (porJogo[s.jogo] || 0) + 1;
    res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
    return res.end(JSON.stringify({
      ok: true, prefixo: PREFIXO, salas: salas.size, jogadores, conexoes, porJogo,
      memoriaMb: Math.round(process.memoryUsage().rss / 1048576), noArSeg: Math.round((Date.now() - inicio) / 1000),
    }));
  }
  res.writeHead(404).end();
});

const wss = new WebSocketServer({
  server: http,
  maxPayload: MAX_BYTES,
  verifyClient: ({ origin }) => !origin || ORIGENS.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin),
});

wss.on("connection", (ws) => {
  conexoes++;
  ws.vivo = true;
  ws.janela = { inicio: Date.now(), n: 0 };
  ws.on("pong", () => { ws.vivo = true; });
  ws.on("message", (bruto, binario) => {
    if (binario) return;
    const agora = Date.now();
    if (agora - ws.janela.inicio >= 1000) ws.janela = { inicio: agora, n: 0 };
    if (++ws.janela.n > MSGS_POR_SEG) return; // excesso é descartado, não derruba
    let msg;
    try { msg = JSON.parse(bruto); } catch { return; }
    if (msg && typeof msg === "object") trata(ws, msg);
  });
  ws.on("close", () => caiu(ws));
  ws.on("error", () => {});
});

// conexão morta (celular sem sinal) não fecha sozinha: o ping descobre e libera o lugar pra espera
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.vivo) { ws.terminate(); continue; }
    ws.vivo = false;
    ws.ping();
  }
}, PING_MS).unref();

http.listen(PORTA, HOST, () => console.log(`karma realtime ${PREFIXO} em ${HOST}:${PORTA}`));

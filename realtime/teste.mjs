// Sobe o servidor numa porta livre e confere o protocolo de ponta a ponta.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import WebSocket from "ws";

const PORTA = 48100 + Math.floor(Math.random() * 500);
let proc;

before(async () => {
  proc = spawn(process.execPath, ["servidor.mjs"], { env: { ...process.env, PORTA, PREFIXO: "9" } });
  await new Promise((ok) => proc.stdout.once("data", ok));
});
after(() => proc.kill());

function cliente() {
  const ws = new WebSocket(`ws://127.0.0.1:${PORTA}`, { origin: "https://karmagames.com.br" });
  const fila = [];
  const esperando = [];
  ws.on("message", (b) => {
    const m = JSON.parse(b);
    const i = esperando.findIndex((e) => e.tipo === m.t);
    if (i >= 0) esperando.splice(i, 1)[0].ok(m); else fila.push(m);
  });
  const c = {
    ws,
    aberto: new Promise((ok) => ws.once("open", ok)),
    manda: (o) => ws.send(JSON.stringify(o)),
    espera: (tipo) => {
      const i = fila.findIndex((m) => m.t === tipo);
      if (i >= 0) return Promise.resolve(fila.splice(i, 1)[0]);
      return new Promise((ok, falha) => {
        esperando.push({ tipo, ok });
        setTimeout(() => falha(new Error(`não chegou ${tipo}`)), 2000);
      });
    },
  };
  return c;
}

test("cria, entra, repassa jogada e guarda estado", async () => {
  const a = cliente(); await a.aberto;
  a.manda({ t: "criar", jogo: "ligue-4", nome: "Pai", max: 2 });
  const sala = await a.espera("sala");
  assert.match(sala.codigo, /^9[A-Z2-9]{4}$/);
  assert.equal(sala.lugar, 0);

  const b = cliente(); await b.aberto;
  b.manda({ t: "entrar", codigo: sala.codigo.toLowerCase(), jogo: "ligue-4", nome: "Filho" });
  const salaB = await b.espera("sala");
  assert.equal(salaB.lugar, 1);
  assert.deepEqual(salaB.jogadores.map((j) => j.nome), ["Pai", "Filho"]);
  assert.equal((await a.espera("entrou")).jogador.nome, "Filho");

  a.manda({ t: "msg", dados: { c: 3 } });
  assert.deepEqual(await b.espera("msg"), { t: "msg", de: 0, dados: { c: 3 } });

  // sala cheia e jogo errado
  const c = cliente(); await c.aberto;
  c.manda({ t: "entrar", codigo: sala.codigo, jogo: "ligue-4" });
  assert.equal((await c.espera("erro")).motivo, "sala cheia");
  const d = cliente(); await d.aberto;
  d.manda({ t: "entrar", codigo: sala.codigo, jogo: "xadrez" });
  assert.match((await d.espera("erro")).motivo, /outro jogo/);

  // queda e volta com a chave: mesmo lugar e o estado guardado
  a.manda({ t: "estado", dados: { tabuleiro: [1, 2] } });
  b.ws.close();
  assert.equal((await a.espera("caiu")).lugar, 1);
  const b2 = cliente(); await b2.aberto;
  b2.manda({ t: "entrar", codigo: sala.codigo, chave: salaB.chave });
  const volta = await b2.espera("sala");
  assert.equal(volta.lugar, 1);
  assert.deepEqual(volta.estado, { tabuleiro: [1, 2] });
  assert.equal((await a.espera("voltou")).lugar, 1);

  b2.manda({ t: "sair" });
  assert.equal((await a.espera("saiu")).lugar, 1);
  for (const x of [a, b2, c, d]) x.ws.close();
});

test("sala aberta aparece na lista até encher; fechada não aparece", async () => {
  const lista = async () => (await (await fetch(`http://127.0.0.1:${PORTA}/salas?jogo=xadrez`)).json()).salas;
  const a = cliente(); await a.aberto;
  a.manda({ t: "criar", jogo: "xadrez", nome: "Ana", max: 2, aberta: true });
  const sala = await a.espera("sala");
  const f = cliente(); await f.aberto;
  f.manda({ t: "criar", jogo: "xadrez", nome: "Fechada", max: 2 });
  await f.espera("sala");
  let l = await lista();
  assert.deepEqual(l.map((s) => [s.codigo, s.dono, s.jogadores]), [[sala.codigo, "Ana", 1]]);

  // quem criou fecha e abre de novo
  a.manda({ t: "abrir", aberta: false }); await new Promise((r) => setTimeout(r, 50));
  assert.equal((await lista()).length, 0);
  a.manda({ t: "abrir", aberta: true }); await new Promise((r) => setTimeout(r, 50));
  assert.equal((await lista()).length, 1);

  const b = cliente(); await b.aberto;
  b.manda({ t: "entrar", codigo: sala.codigo, jogo: "xadrez", nome: "Bia" });
  await b.espera("sala");
  assert.equal((await lista()).length, 0, "cheia sai da lista");
  for (const x of [a, b, f]) x.ws.close();
});

test("origem de fora é recusada", async () => {
  const ws = new WebSocket(`ws://127.0.0.1:${PORTA}`, { origin: "https://site-qualquer.com" });
  await assert.rejects(new Promise((ok, falha) => { ws.on("open", ok); ws.on("error", falha); }));
});

test("/saude responde com a contagem", async () => {
  const r = await (await fetch(`http://127.0.0.1:${PORTA}/saude`)).json();
  assert.equal(r.ok, true);
  assert.equal(r.prefixo, "9");
});

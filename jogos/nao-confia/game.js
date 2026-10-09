// NÃO CONFIA — plataforma troll em 15 fases.
// Tudo desenhado no canvas e com sons sintetizados: sem imagens, sem audios, sem build.
'use strict';

const T = 30;                 // tamanho do bloco
const COLS = 32, LINHAS = 18;
const W = COLS * T, H = LINHAS * T;
const VMAX = 4.5, ACEL = 0.45, ACEL_AR = 0.35;
const GRAV = 0.55, PULO = 10.6, QUEDA_MAX = 12;
const FRAMES_MORTO = 6;       // 0,1 s ate renascer
const COR_JOGADOR = '#ff8a1f';

const tela = document.getElementById('tela');
const ctx = tela.getContext('2d');

const sortear = lista => lista[Math.floor(Math.random() * lista.length)];
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const toca = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// ---------- progresso salvo ----------

function carregar() {
  try {
    return { mortes: 0, fase: 0, zerou: false, ...JSON.parse(localStorage.getItem('naoConfia')) };
  } catch {
    return { mortes: 0, fase: 0, zerou: false };
  }
}
const salvo = carregar();
// Atalho pra testar: index.html?fase=9 comeca direto na fase 9
const faseNaUrl = Number(new URLSearchParams(location.search).get('fase'));
if (faseNaUrl >= 1 && faseNaUrl <= 15) salvo.fase = faseNaUrl - 1;
function gravar() {
  try { localStorage.setItem('naoConfia', JSON.stringify(salvo)); } catch { /* sem storage */ }
}

// ---------- som (tudo sintetizado) ----------

let audio = null;
let mudo = false;

function tom(freq, dur, { tipo = 'square', vol = 0.1, ate = null, atraso = 0 } = {}) {
  if (mudo) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime + atraso;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t);
    if (ate) o.frequency.exponentialRampToValueAtTime(ate, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch { /* navegador sem audio */ }
}

function ruido(dur, vol = 0.15, atraso = 0) {
  if (mudo) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const n = Math.floor(audio.sampleRate * dur);
    const buf = audio.createBuffer(1, n, audio.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = audio.createBufferSource();
    const g = audio.createGain();
    g.gain.value = vol;
    s.buffer = buf;
    s.connect(g).connect(audio.destination);
    s.start(audio.currentTime + atraso);
  } catch { /* sem audio */ }
}

const MORTES_SOM = [
  () => { tom(392, 0.12, { tipo: 'sawtooth', vol: 0.07 }); tom(370, 0.12, { tipo: 'sawtooth', vol: 0.07, atraso: 0.12 }); tom(330, 0.3, { tipo: 'sawtooth', vol: 0.07, ate: 290, atraso: 0.24 }); },
  () => tom(140, 0.35, { tipo: 'sine', vol: 0.25, ate: 700 }),
  () => { ruido(0.18, 0.2); tom(160, 0.15, { tipo: 'triangle', vol: 0.2, ate: 40 }); },
  () => { tom(95, 0.32, { tipo: 'sawtooth', vol: 0.12, ate: 55 }); ruido(0.3, 0.05); },
];

const SONS = {
  pulo: () => tom(260, 0.12, { vol: 0.05, ate: 520 }),
  virar: () => tom(200, 0.2, { tipo: 'triangle', vol: 0.12, ate: 900 }),
  pousar: () => tom(90, 0.05, { tipo: 'triangle', vol: 0.08 }),
  morte: () => sortear(MORTES_SOM)(),
  vitoria: () => [523, 659, 784, 1047].forEach((f, i) => tom(f, 0.14, { vol: 0.08, atraso: i * 0.08 })),
  risada: () => [0, 1, 2].forEach(i => tom(420 - i * 40, 0.09, { tipo: 'sawtooth', vol: 0.07, ate: 300, atraso: i * 0.13 })),
  risadinha: () => [0, 1].forEach(i => tom(900, 0.05, { tipo: 'square', vol: 0.04, ate: 700, atraso: i * 0.07 })),
  moeda: () => { tom(988, 0.08, { vol: 0.06 }); tom(1319, 0.2, { vol: 0.06, atraso: 0.08 }); },
  esmagar: () => { ruido(0.25, 0.25); tom(70, 0.2, { tipo: 'sine', vol: 0.3, ate: 35 }); },
  espinho: () => tom(1200, 0.04, { vol: 0.03, ate: 600 }),
  clique: () => tom(1500, 0.04, { tipo: 'triangle', vol: 0.08 }),
  glitch: () => { for (let i = 0; i < 6; i++) tom(100 + Math.random() * 1500, 0.05, { vol: 0.05, atraso: i * 0.05 }); },
  nhac: () => { tom(180, 0.08, { tipo: 'square', vol: 0.12, ate: 90 }); ruido(0.06, 0.15, 0.05); },
  crack: () => ruido(0.2, 0.15),
};
const som = nome => SONS[nome]?.();

// ---------- controles ----------

const teclas = { esq: false, dir: false, pulo: false };
let bufferPulo = 0;
const MAPA = {
  ArrowLeft: 'esq', KeyA: 'esq', ArrowRight: 'dir', KeyD: 'dir',
  Space: 'pulo', ArrowUp: 'pulo', KeyW: 'pulo', KeyZ: 'pulo',
};

function apertou(tecla) {
  if (tecla === 'pulo' && !teclas.pulo) {
    bufferPulo = 7;
    if (estado === 'menu' || estado === 'fim') comecar();
  }
  teclas[tecla] = true;
}

addEventListener('keydown', e => {
  const tecla = MAPA[e.code];
  if (tecla) {
    e.preventDefault();
    if (!e.repeat) apertou(tecla);
    return;
  }
  if (e.code === 'KeyM') mudo = !mudo;
  if (e.code === 'KeyR' && estado === 'jogando') morrer('DESISTIU, NÉ?');
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (estado === 'jogando') estado = 'pausa';
    else if (estado === 'pausa') estado = 'jogando';
  }
  if (e.code === 'KeyQ' && estado === 'pausa') estado = 'menu';
  if (e.code === 'KeyN' && estado === 'menu') {
    Object.assign(salvo, { mortes: 0, fase: 0 });
    gravar();
    comecar();
  }
});
addEventListener('keyup', e => {
  const tecla = MAPA[e.code];
  if (tecla) teclas[tecla] = false;
});
addEventListener('blur', () => { teclas.esq = teclas.dir = teclas.pulo = false; });

// Botoes na tela pra celular e tablet
if (matchMedia('(pointer: coarse)').matches) {
  document.getElementById('toque').hidden = false;
  for (const b of document.querySelectorAll('#toque button')) {
    const tecla = b.dataset.tecla;
    const solta = () => { teclas[tecla] = false; b.classList.remove('ativo'); };
    b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); apertou(tecla); b.classList.add('ativo'); });
    b.addEventListener('pointerup', solta);
    b.addEventListener('pointercancel', solta);
  }
  tela.addEventListener('pointerdown', () => { if (estado === 'menu' || estado === 'fim') comecar(); });
}

// ---------- mundos ----------

const MUNDOS = [
  { nome: 'GRAMA INOCENTE', ceu: ['#7fd3ff', '#dff6ff'], corpo: '#8a5a3c', topo: '#5fd35f', sombra: '#6b432c', espinho: '#ffffff', espinhoBorda: '#6f6f6f', deco: 'nuvem' },
  { nome: 'CAVERNA DA MENTIRA', ceu: ['#120d22', '#2c2150'], corpo: '#4b3d7a', topo: '#9b87e8', sombra: '#352a5c', espinho: '#ece4ff', espinhoBorda: '#6d5fa8', deco: 'cristal' },
  { nome: 'CASTELO DO CAPETA', ceu: ['#1c0606', '#4a1212'], corpo: '#6e2b2b', topo: '#d0574f', sombra: '#4e1c1c', espinho: '#ffd6c9', espinhoBorda: '#9a4a3a', deco: 'brasa' },
];

// ---------- estado do jogo ----------

let estado = 'menu';          // menu | jogando | morto | vitoria | pausa | fim
let faseAtual = 0;
let tentativa = 1;
let L = null;                 // fase montada
let p = null;                 // jogador
let timerEstado = 0;
let tremor = 0;
let flash = 0;
let piada = null;
let intro = 0;
let quadro = 0;
let memoria = {};             // o que sobrevive entre mortes na mesma fase (checkpoint de verdade)
const particulas = [];

function dizer(txt, frames = 80) {
  piada = { txt, t: frames };
}

// ---------- montagem de fase ----------

function novaFase(def) {
  const L = {
    def, mundo: MUNDOS[def.mundo], t: 0,
    grid: Array.from({ length: LINHAS }, () => Array(COLS).fill(0)),
    blocos: [], perigos: [], portas: [], coisas: [], gatilhos: [], timers: [], placas: [],
    inicioPos: { x: 2 * T + 5, y: 16 * T - 26 },
    inverter: false, hudCaiu: false, tituloCaiu: false, tituloAoContrario: false, glitch: 0,
    aoPular: null, aoBaterCabeca: null,
  };
  Object.assign(L, {
    solido(c, r, w = 1, h = 1, v = 1) {
      for (let rr = r; rr < r + h; rr++) {
        for (let cc = c; cc < c + w; cc++) if (rr >= 0 && rr < LINHAS && cc >= 0 && cc < COLS) L.grid[rr][cc] = v;
      }
    },
    chao(c0 = 0, c1 = COLS - 1, r0 = 16) { L.solido(c0, r0, c1 - c0 + 1, LINHAS - r0); },
    buraco(c0, c1) {
      L.solido(c0, 16, c1 - c0 + 1, 2, 0);
      L.espinhos(c0, 17, c1 - c0 + 1);
    },
    espinhos(c, r, n = 1, dir = 'cima', extra = {}) {
      const lista = [];
      for (let i = 0; i < n; i++) {
        const e = { x: (c + i) * T, y: r * T, w: T, h: T, tipo: 'espinho', dir, ativo: true, visivel: true, escala: 1, ...extra };
        L.perigos.push(e);
        lista.push(e);
      }
      return lista;
    },
    bloco(c, r, w = 1, h = 1, extra = {}) {
      const b = { x: c * T, y: r * T, w: w * T, h: h * T, solido: true, visivel: true, dx: 0, dy: 0, ...extra };
      L.blocos.push(b);
      return b;
    },
    porta(c, rChao, extra = {}) {
      const d = { x: c * T, y: rChao * T - 45, w: 30, h: 45, saida: true, visivel: true, ...extra };
      L.portas.push(d);
      return d;
    },
    inicio(c, r) { L.inicioPos = { x: c * T + 5, y: (r + 1) * T - 26 }; },
    gatilho(c, r, w, h, fn, extra = {}) {
      const g = { x: c * T, y: r * T, w: w * T, h: h * T, fn, vezes: 1, ...extra };
      L.gatilhos.push(g);
      return g;
    },
    depois(seg, fn) { L.timers.push({ t: Math.round(seg * 60), fn }); },
    placa(c, r, txt, extra = {}) {
      const pl = { x: c * T + T / 2, y: r * T + T / 2, txt, visivel: true, ...extra };
      L.placas.push(pl);
      return pl;
    },
    coisa(obj) { L.coisas.push(obj); return obj; },
  });
  return L;
}

function novoJogador(pos) {
  return {
    x: pos.x, y: pos.y, w: 20, h: 26, vx: 0, vy: 0, grav: 1,
    noChao: false, coyote: 0, chaoBloco: null, olhar: 1, escX: 1, escY: 1,
  };
}

const corpoJogador = () => ({ x: p.x, y: p.y, w: p.w, h: p.h });
const hitJogador = () => ({ x: p.x + 3, y: p.y + 3, w: p.w - 6, h: p.h - 6 });

function montarFase() {
  const def = FASES[faseAtual];
  L = novaFase(def);
  def.montar(L, tentativa, memoria);
  p = novoJogador(memoria.checkpoint || L.inicioPos);
  bufferPulo = 0;
}

function comecar() {
  faseAtual = Math.min(salvo.fase, FASES.length - 1);
  if (estado === 'fim') faseAtual = 0;
  tentativa = 1;
  memoria = {};
  montarFase();
  intro = 110;
  estado = 'jogando';
}

function morrer(motivo) {
  if (estado !== 'jogando') return;
  estado = 'morto';
  timerEstado = FRAMES_MORTO;
  salvo.mortes++;
  gravar();
  explosao(p.x + p.w / 2, p.y + p.h / 2, COR_JOGADOR, 28);
  tremor = 12;
  som('morte');
  dizer(motivo);
}

function vencer() {
  if (estado !== 'jogando') return;
  estado = 'vitoria';
  timerEstado = 40;
  flash = 1;
  som('vitoria');
  confete(p.x + p.w / 2, p.y);
}

function proximaFase() {
  faseAtual++;
  tentativa = 1;
  memoria = {};
  piada = null;
  if (faseAtual >= FASES.length) {
    salvo.fase = 0;
    salvo.zerou = true;
    gravar();
    estado = 'fim';
    return;
  }
  salvo.fase = Math.max(salvo.fase, faseAtual);
  gravar();
  montarFase();
  intro = 110;
  estado = 'jogando';
}

// ---------- fisica ----------

function solidosEm(r) {
  const lista = [];
  const c0 = Math.floor(r.x / T), c1 = Math.floor((r.x + r.w - 0.001) / T);
  const r0 = Math.floor(r.y / T), r1 = Math.floor((r.y + r.h - 0.001) / T);
  for (let rr = r0; rr <= r1; rr++) {
    for (let cc = c0; cc <= c1; cc++) {
      if (rr >= 0 && rr < LINHAS && cc >= 0 && cc < COLS && L.grid[rr][cc]) lista.push({ x: cc * T, y: rr * T, w: T, h: T });
    }
  }
  for (const b of L.blocos) if (b.solido && toca(r, b)) lista.push(b);
  return lista;
}

function revelar(s) {
  if (s.revelavel && !s.visivel) {
    s.visivel = true;
    som('clique');
    brilho(s.x + s.w / 2, s.y + s.h / 2);
  }
}

function moverJogador() {
  let dir = (teclas.dir ? 1 : 0) - (teclas.esq ? 1 : 0);
  if (L.inverter) dir = -dir;
  const acel = p.noChao ? ACEL : ACEL_AR;
  if (dir) p.vx += limitar(dir * VMAX - p.vx, -acel, acel);
  else {
    p.vx *= p.noChao ? 0.55 : 0.92;
    if (Math.abs(p.vx) < 0.08) p.vx = 0;
  }
  if (dir) p.olhar = dir;

  p.coyote = p.noChao ? 6 : p.coyote - 1;
  if (bufferPulo > 0 && p.coyote > 0) {
    bufferPulo = 0;
    p.coyote = 0;
    if (L.def.puloInverte) {
      p.grav *= -1;
      p.vy = 0;
      som('virar');
    } else {
      p.vy = -PULO * p.grav;
      som('pulo');
    }
    poeira(p.x + p.w / 2, p.grav > 0 ? p.y + p.h : p.y);
    p.noChao = false;
    p.chaoBloco = null;
    p.escX = 0.7;
    p.escY = 1.35;
    L.aoPular?.();
  }
  if (bufferPulo > 0) bufferPulo--;

  // Soltar o pulo cedo faz um pulinho mais baixo
  if (p.vy * p.grav < 0 && !teclas.pulo && !L.def.puloInverte) p.vy += GRAV * p.grav * 1.4;
  p.vy = limitar(p.vy + GRAV * p.grav, -QUEDA_MAX, QUEDA_MAX);

  if (p.chaoBloco) {
    p.x += p.chaoBloco.dx;
    p.y += p.chaoBloco.dy;
  }

  p.x += p.vx;
  for (const s of solidosEm(p)) {
    if (p.vx > 0) p.x = s.x - p.w;
    else if (p.vx < 0) p.x = s.x + s.w;
    else continue;
    p.vx = 0;
    revelar(s);
  }
  if (p.x < 0) { p.x = 0; p.vx = 0; }
  if (p.x + p.w > W && !L.def.saidaDireita) { p.x = W - p.w; p.vx = 0; }

  const estavaNoChao = p.noChao;
  p.noChao = false;
  p.chaoBloco = null;
  p.y += p.vy;
  for (const s of solidosEm(p)) {
    if (p.vy > 0) p.y = s.y - p.h;
    else if (p.vy < 0) p.y = s.y + s.h;
    else continue;
    if (Math.sign(p.vy) === p.grav) {
      p.noChao = true;
      p.chaoBloco = s.dx !== undefined ? s : null;
    } else {
      L.aoBaterCabeca?.(s);
    }
    revelar(s);
    p.vy = 0;
  }
  if (p.noChao && !estavaNoChao) {
    p.escX = 1.3;
    p.escY = 0.75;
    poeira(p.x + p.w / 2, p.grav > 0 ? p.y + p.h : p.y);
    som('pousar');
  }
  p.escX += (1 - p.escX) * 0.2;
  p.escY += (1 - p.escY) * 0.2;
}

function caixaDoPerigo(e) {
  if (e.hit) return { x: e.x + e.hit[0], y: e.y + e.hit[1], w: e.hit[2], h: e.hit[3] };
  if (e.tipo !== 'espinho') return e;
  const s = e.escala ?? 1;
  if (s < 0.6) return { x: 0, y: -999, w: 0, h: 0 };
  switch (e.dir) {
    case 'baixo': return { x: e.x + 6, y: e.y, w: e.w - 12, h: e.h * 0.55 };
    case 'esq': return { x: e.x, y: e.y + 6, w: e.w * 0.55, h: e.h - 12 };
    case 'dir': return { x: e.x + e.w * 0.45, y: e.y + 6, w: e.w * 0.55, h: e.h - 12 };
    default: return { x: e.x + 6, y: e.y + e.h * 0.45, w: e.w - 12, h: e.h * 0.55 };
  }
}

function passo() {
  L.t++;
  for (const tm of [...L.timers]) {
    if (--tm.t <= 0) {
      L.timers.splice(L.timers.indexOf(tm), 1);
      tm.fn();
    }
  }
  for (const b of L.blocos) {
    const ox = b.x, oy = b.y;
    b.update?.(b);
    b.dx = b.x - ox;
    b.dy = b.y - oy;
  }
  for (const c of [...L.coisas]) c.update?.(c);
  for (const e of [...L.perigos]) {
    if (e.escala < 1) e.escala = Math.min(1, e.escala + 0.2);
    e.update?.(e);
  }
  for (const d of L.portas) d.update?.(d);
  if (L.glitch > 0) L.glitch--;
  if (estado !== 'jogando') return;

  moverJogador();
  if (estado !== 'jogando') return;

  const corpo = corpoJogador();
  for (const g of L.gatilhos) {
    if (g.vezes !== 0 && toca(corpo, g)) {
      g.vezes--;
      g.fn(g);
      if (estado !== 'jogando') return;
    }
  }
  const hb = hitJogador();
  for (const e of L.perigos) {
    if (e.ativo && toca(hb, caixaDoPerigo(e))) return morrer(e.motivo || L.def.motivo || 'ESPETADO!');
  }
  for (const d of L.portas) {
    if (!toca(corpo, d)) continue;
    if (d.aoTocar) d.aoTocar(d);
    else if (d.saida) return vencer();
    if (estado !== 'jogando') return;
  }
  if (p.y > H + 60 || p.y < -120) return morrer(L.def.motivoQueda || 'CAIU NO VAZIO');
  if (L.def.saidaDireita && p.x + p.w >= W) vencer();
}

// ---------- particulas e efeitos ----------

function particula(x, y, vx, vy, cor, vida, tam, grav = 0.25) {
  particulas.push({ x, y, vx, vy, cor, vida, max: vida, tam, grav });
}
function explosao(x, y, cor, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 6;
    particula(x, y, Math.cos(a) * v, Math.sin(a) * v - 2, i % 3 ? cor : '#2b1a0a', 40 + Math.random() * 30, 3 + Math.random() * 5);
  }
}
function poeira(x, y) {
  for (let i = 0; i < 6; i++) particula(x, y, (Math.random() - 0.5) * 3, -Math.random() * 1.5, '#ffffffaa', 18, 3, 0.05);
}
function brilho(x, y) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    particula(x, y, Math.cos(a) * 2, Math.sin(a) * 2, '#fff7a8', 25, 3, 0);
  }
}
function poof(x, y) {
  for (let i = 0; i < 14; i++) particula(x, y, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, '#ffffffcc', 30, 6, 0);
}
function confete(x, y) {
  const cores = ['#ffd23f', '#ff5c8a', '#4dd6ff', '#7dff6b', '#c58bff'];
  for (let i = 0; i < 40; i++) particula(x, y, (Math.random() - 0.5) * 9, -Math.random() * 9, sortear(cores), 70, 4, 0.2);
}

function atualizarParticulas() {
  for (let i = particulas.length - 1; i >= 0; i--) {
    const q = particulas[i];
    q.x += q.vx;
    q.y += q.vy;
    q.vy += q.grav;
    q.vx *= 0.98;
    if (--q.vida <= 0) particulas.splice(i, 1);
  }
}

// ---------- pecas reutilizaveis das fases ----------

function derrubar(lista, intervalo = 2) {
  lista.forEach((b, i) => {
    let espera = i * intervalo;
    b.vy = 0;
    b.update = () => {
      if (espera-- > 0) { b.tremor = 1.5; return; }
      b.tremor = 0;
      b.vy += 0.6;
      b.y += b.vy;
    };
  });
}

function bandeira(L, c, aoTocar, extra = {}) {
  const f = L.coisa({
    x: c * T + 10, y: 14 * T, w: 22, h: 2 * T, ativa: false, ...extra,
    update() {
      if (!f.ativa && estado === 'jogando' && toca(f, corpoJogador())) {
        f.ativa = true;
        aoTocar();
      }
    },
    draw() {
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(f.x, f.y, 4, f.h);
      const onda = Math.sin(quadro / 6) * 3;
      ctx.fillStyle = f.ativa ? '#3ddc84' : '#ff4d4d';
      ctx.beginPath();
      ctx.moveTo(f.x + 4, f.y + 2);
      ctx.lineTo(f.x + 26, f.y + 10 + onda);
      ctx.lineTo(f.x + 4, f.y + 20);
      ctx.fill();
    },
  });
  return f;
}

function esmagador(L, c, tipo) {
  const topo = 7 * T;
  const fundo = 16 * T - 5 * T;
  const b = L.bloco(c, 7, 2, 5, { desenho: 'esmagador', estado: 'armado', t: 0 });
  b.update = () => {
    const sob = p.x + p.w > b.x + 10 && p.x < b.x + b.w;
    if (b.estado === 'armado') {
      if (tipo === 'lento' && p.x + p.w > b.x - T && p.x < b.x + b.w) {
        b.estado = 'tremendo';
        b.t = 27;
      }
      if (tipo === 'rapido' && sob && Math.abs(p.vx) > 2.6) b.estado = 'caindo';
    }
    if (b.estado === 'tremendo') {
      b.tremor = 2;
      if (--b.t <= 0) { b.estado = 'caindo'; b.tremor = 0; }
    }
    if (b.estado === 'caindo') {
      b.y = Math.min(fundo, b.y + 24);
      if (toca(b, corpoJogador())) morrer('VIROU PANQUECA');
      if (b.y >= fundo) {
        b.estado = 'embaixo';
        b.t = 70;
        tremor = 8;
        som('esmagar');
      }
    }
    if (b.estado === 'embaixo' && --b.t <= 0) b.estado = 'subindo';
    if (b.estado === 'subindo') {
      b.y = Math.max(topo, b.y - 2);
      if (b.y <= topo) b.estado = 'armado';
    }
  };
  return b;
}

function espelhar(L) {
  for (const linha of L.grid) linha.reverse();
  for (const lista of [L.blocos, L.perigos, L.portas, L.gatilhos]) {
    for (const o of lista) o.x = W - o.x - o.w;
  }
  for (const e of L.perigos) {
    if (e.dir === 'esq') e.dir = 'dir';
    else if (e.dir === 'dir') e.dir = 'esq';
  }
  for (const pl of L.placas) pl.x = W - pl.x;
}

// ---------- as 15 fases ----------

const FASES = [
  // ===== MUNDO 1: GRAMA INOCENTE =====
  {
    nome: 'Bem-vindo, Otário', mundo: 0, motivoQueda: 'O CHÃO TE ODEIA',
    montar(L, tentativa) {
      L.chao();
      L.inicio(2, 15);
      L.placa(6, 12, tentativa > 1 ? 'AGORA VAI, CONFIA →' : 'FÁCIL, NÉ? →');
      L.porta(29, 16);
      const desmoronar = (c0, c1) => {
        L.solido(c0, 16, c1 - c0 + 1, 2, 0);
        const pedacos = [];
        for (let c = c0; c <= c1; c++) pedacos.push(L.bloco(c, 16, 1, 2));
        L.gatilho(c0, 15, c1 - c0 + 1, 1, () => { som('crack'); derrubar(pedacos); });
      };
      desmoronar(13, 16);
      // Aprendeu a pular o buraco? Na proxima tentativa aparece outro.
      if (tentativa > 1) desmoronar(20, 22);
    },
  },
  {
    nome: 'A Porta É Tímida', mundo: 0,
    montar(L) {
      L.chao();
      L.inicio(4, 15);
      L.buraco(10, 12);
      L.placa(18, 11, 'SAÍDA →');
      const d = L.porta(28, 16, { estado: 'parada' });
      d.update = () => {
        if (d.estado === 'parada') {
          const dist = d.x - (p.x + p.w);
          if (dist < 150 && dist > -20 && p.vx > 0.3) {
            d.estado = 'fugindo';
            som('risada');
            dizer('A PORTA FICOU COM VERGONHA', 70);
          }
        }
        if (d.estado === 'fugindo') {
          d.x += Math.max(p.vx * 1.3, 3);
          if (d.x > W + 10) {
            d.estado = 'escondida';
            d.x = T;
            poof(d.x + 15, d.y + 20);
            L.placa(3, 12, '← PSIU, AQUI');
          }
        }
      };
    },
  },
  {
    nome: 'Plataformas Fofoqueiras', mundo: 0, motivo: 'TRAÍDO PELA PLATAFORMA', motivoQueda: 'TRAÍDO PELA PLATAFORMA',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.solido(8, 16, 16, 2, 0);
      L.espinhos(8, 17, 16);
      L.placa(4, 12, 'NÃO OLHE PRA BAIXO');
      L.porta(29, 16);
      // Ponte invisivel: so existe pra quem atravessa andando, sem pular
      const ponte = L.bloco(8, 16, 16, 1, { visivel: false });
      let pulou = false;
      L.coisa({
        update() {
          const centro = p.x + p.w / 2;
          if (centro > 8 * T && centro < 24 * T && p.vy * p.grav < 0) pulou = true;
          ponte.solido = !pulou;
        },
      });
      for (const [c, r] of [[10, 12], [15, 11], [20, 12]]) {
        const b = L.bloco(c, r, 2, 1, { alvoX: null });
        b.update = () => {
          if (b.alvoX === null && p.vy > 0 && p.x + p.w > b.x && p.x < b.x + b.w) {
            const folga = b.y - (p.y + p.h);
            if (folga > -4 && folga < 55) {
              b.alvoX = b.x + (p.x + p.w / 2 < b.x + b.w / 2 ? 95 : -95);
              som('risadinha');
            }
          }
          if (b.alvoX !== null) b.x += (b.alvoX - b.x) * 0.35;
        };
      }
    },
  },
  {
    nome: 'O Teto Também É Chão', mundo: 0, puloInverte: true, motivo: 'ESPETADO DE PONTA-CABEÇA',
    montar(L) {
      L.solido(0, 14, 32, 4);
      L.solido(0, 0, 32, 5);
      L.inicio(2, 13);
      L.espinhos(8, 13, 5, 'cima');
      L.espinhos(20, 13, 4, 'cima');
      L.espinhos(14, 5, 5, 'baixo');
      L.espinhos(26, 5, 3, 'baixo');
      L.placa(4, 10, 'PULE OS ESPINHOS!');
      L.porta(30, 0, { invertida: true, y: 5 * T });
    },
  },
  {
    nome: 'Checkpoint Amigo', mundo: 0, motivoQueda: 'SALVO... NO BURACO',
    montar(L, tentativa, memoria) {
      L.chao(0, 10);
      L.chao(20, 31);
      const pisos = [];
      for (let c = 11; c <= 19; c++) pisos.push(L.bloco(c, 16, 1, 2));
      L.inicio(2, 15);
      L.placa(7, 12, 'CHECKPOINT LOGO ALI :)');
      bandeira(L, 15, () => {
        dizer('CHECKPOINT SALVO! :)');
        som('moeda');
        L.depois(0.35, () => { som('risada'); derrubar(pisos, 1); });
      });
      // O de verdade fica num corredor baixo: nao da pra pular por cima dele
      L.solido(21, 12, 6, 2);
      bandeira(L, 24, () => {
        memoria.checkpoint = { x: 24 * T + 5, y: 16 * T - 26 };
        dizer('ESSE É DE VERDADE (EU ACHO)');
        som('moeda');
      }, { ativa: !!memoria.checkpoint });
      L.espinhos(28, 15, 1);
      L.porta(30, 16);
    },
  },

  // ===== MUNDO 2: CAVERNA DA MENTIRA =====
  {
    nome: 'Controles Bêbados', mundo: 1,
    montar(L) {
      L.chao();
      L.solido(0, 0, 32, 2);
      L.inicio(2, 15);
      L.solido(6, 12, 5, 2);
      L.placa(8, 10, 'PEGUE A MOEDA :)');
      const moeda = L.coisa({
        x: 8 * T + 4, y: 14 * T, w: 22, h: 2 * T, pega: false,
        update() {
          if (!moeda.pega && toca(moeda, corpoJogador())) {
            moeda.pega = true;
            L.inverter = true;
            som('moeda');
            dizer('CONTROLES INVERTIDOS!');
          }
        },
        draw() {
          if (moeda.pega) return;
          const larg = Math.abs(Math.cos(quadro / 10)) * 10 + 2;
          ctx.fillStyle = '#ffd23f';
          ctx.beginPath();
          ctx.ellipse(moeda.x + 11, 15 * T + 12, larg, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#b8860b';
          ctx.lineWidth = 2;
          ctx.stroke();
        },
      });
      L.buraco(13, 15);
      L.buraco(20, 22);
      L.buraco(26, 27);
      let desinverteu = false;
      L.coisa({
        update() {
          if (L.inverter && !desinverteu && !p.noChao && p.x + p.w > 20 * T && p.x < 23 * T) {
            desinverteu = true;
            L.inverter = false;
            som('virar');
            dizer('DESINVERTEU NO MEIO DO PULO!');
          }
        },
      });
      L.porta(30, 16);
    },
  },
  {
    nome: 'Espinhos Mutantes', mundo: 1,
    montar(L) {
      L.chao();
      L.solido(0, 0, 32, 2);
      L.inicio(2, 15);
      const A = [7, 15, 23].flatMap(c => L.espinhos(c, 15, 2));
      const B = [11, 19].flatMap(c => L.espinhos(c, 15, 2));
      const mostrar = (lista, sim) => lista.forEach(e => {
        e.ativo = sim;
        e.visivel = sim;
        if (sim) e.escala = 0;
      });
      mostrar(B, false);
      let vezDoA = true;
      L.aoPular = () => {
        vezDoA = !vezDoA;
        mostrar(A, vezDoA);
        mostrar(B, !vezDoA);
        som('espinho');
      };
      L.placa(4, 11, 'PULAR É SEGURO');
      L.porta(29, 16);
    },
  },
  {
    nome: 'Hitbox Mentirosa', mundo: 1,
    montar(L) {
      L.chao();
      L.solido(0, 0, 32, 2);
      L.inicio(2, 15);
      // Espinhos gigantes: so 1 pixel da ponta mata
      for (const c of [9, 10, 11]) {
        L.perigos.push({ x: c * T, y: 13 * T, w: T, h: 3 * T, tipo: 'espinho', dir: 'cima', ativo: true, visivel: true, escala: 1, hit: [14, 0, 2, 2], motivo: 'ACHOU O PIXEL MALDITO' });
      }
      L.placa(10, 10, 'NEM PENSE');
      L.solido(16, 13, 2, 3);
      L.solido(19, 10, 8, 1);
      // Florzinha: desenho pequeno, hitbox gigante
      L.perigos.push({ x: 24 * T, y: 16 * T - 14, w: 14, h: 14, tipo: 'flor', ativo: true, visivel: true, hit: [-2 * T, -5 * T + 14, 5 * T, 5 * T], motivo: 'A FLORZINHA?!' });
      L.porta(30, 16);
    },
  },
  {
    nome: 'Porta Mentirosa', mundo: 1, saidaDireita: true,
    montar(L) {
      L.chao();
      L.solido(29, 5, 3, 11);
      L.inicio(2, 15);
      L.placa(28, 3, 'SAÍDA →');
      L.porta(9, 16, {
        rotulo: '1',
        aoTocar: () => {
          poof(p.x + 10, p.y + 13);
          p.x = L.inicioPos.x;
          p.y = L.inicioPos.y;
          p.vx = 0;
          som('risada');
          dizer('VOLTA PRO COMEÇO, HAHA');
        },
      });
      const morde = L.porta(18, 16, { rotulo: '2', olhos: true, base: 18 * T, fase: 0, cd: 0, aoTocar: () => morrer('A PORTA MORDEU') });
      morde.update = () => {
        const dx = (p.x + p.w / 2) - (morde.x + 15);
        // So morde quem esta no chao: pular por cima sempre funciona
        if (morde.fase === 0 && --morde.cd <= 0 && Math.abs(dx) < 110 && p.noChao) {
          morde.fase = 1;
          morde.dir = Math.sign(dx) || -1;
          morde.t = 0;
          som('nhac');
        }
        if (morde.fase === 1) {
          morde.x += morde.dir * 7;
          if (++morde.t >= 9) morde.fase = 2;
        }
        if (morde.fase === 2) {
          morde.x += (morde.base - morde.x) * 0.15;
          if (Math.abs(morde.base - morde.x) < 1) {
            morde.x = morde.base;
            morde.fase = 0;
            morde.cd = 60;
          }
        }
      };
      // A porta 3 nao abre: ela e' um elevador
      const elevador = L.bloco(28, 0, 1, 1, { y: 16 * T - 45, h: 45, desenho: 'porta', rotulo: '3' });
      elevador.update = () => {
        if (p.chaoBloco === elevador && elevador.y > 5 * T) elevador.y = Math.max(5 * T, elevador.y - 2.5);
      };
    },
  },
  {
    nome: 'Esmagador Fofoqueiro', mundo: 1,
    montar(L) {
      L.chao();
      L.solido(0, 0, 32, 7);
      L.inicio(2, 15);
      L.placa(5, 12, 'CORRE!');
      esmagador(L, 9, 'lento');
      L.placa(16, 12, 'SHHH... DEVAGAR');
      esmagador(L, 20, 'rapido');
      L.porta(30, 16);
    },
  },

  // ===== MUNDO 3: CASTELO DO CAPETA =====
  {
    nome: 'A Interface Te Odeia', mundo: 2,
    montar(L) {
      L.chao();
      L.solido(24, 12, 8, 4);
      L.inicio(2, 15);
      L.porta(28, 12);
      const caixa = L.coisa({
        x: 12, y: 10, w: 140, h: 34, estado: 'hud', vy: 0,
        update() {
          if (caixa.estado === 'caindo') {
            caixa.vy += 0.7;
            caixa.y += caixa.vy;
            if (caixa.y >= 16 * T - caixa.h) {
              caixa.y = 16 * T - caixa.h;
              caixa.estado = 'rolando';
              tremor = 6;
              som('esmagar');
            }
          }
          if (caixa.estado === 'rolando') caixa.x += 4;
          if (caixa.estado !== 'hud' && toca(caixa, hitJogador())) morrer('ATROPELADO PELO PLACAR');
        },
        draw() { if (caixa.estado !== 'hud') desenharCaixaMortes(caixa.x, caixa.y); },
      });
      L.gatilho(8, 0, 1, 18, () => {
        L.hudCaiu = true;
        caixa.estado = 'caindo';
        som('risada');
      });
      const titulo = L.bloco(0, 0, 1, 1, { x: W / 2 - 190, y: 8, w: 380, h: 34, solido: false, desenho: 'banner', estado: 'hud', vy: 0, t: 0 });
      titulo.update = () => {
        if (titulo.estado === 'tremendo') {
          titulo.tremor = 3;
          if (--titulo.t <= 0) { titulo.estado = 'caindo'; titulo.tremor = 0; }
        }
        if (titulo.estado === 'caindo') {
          titulo.vy += 0.8;
          titulo.y += titulo.vy;
          if (toca(titulo, hitJogador())) morrer('ESMAGADO PELO TÍTULO');
          if (titulo.y >= 16 * T - titulo.h) {
            titulo.y = 16 * T - titulo.h;
            titulo.estado = 'chao';
            titulo.solido = true;
            tremor = 10;
            som('esmagar');
          }
        }
      };
      L.gatilho(15, 0, 1, 18, () => {
        L.tituloCaiu = true;
        titulo.estado = 'tremendo';
        titulo.t = 45;
      });
    },
  },
  {
    nome: 'Pula Que Eu Te Pego', mundo: 2, motivo: 'VIROU ESPETINHO',
    montar(L) {
      L.chao();
      L.solido(0, 0, 32, 2);
      L.inicio(2, 15);
      L.espinhos(4, 2, 12, 'baixo');
      L.bloco(9, 14, 1, 2, { solido: false });   // muro de mentira
      L.solido(19, 14, 1, 2);                    // muro de verdade
      const zona = (c0, c1) => L.coisa({
        update() {
          if (p.grav === 1 && !p.noChao && p.y < 14 * T && p.x + p.w > c0 * T && p.x < (c1 + 1) * T) {
            p.grav = -1;
            p.vy = -2;
            som('virar');
          }
        },
      });
      zona(8, 10);
      zona(18, 20);
      L.placa(5, 10, 'PULA O MURINHO');
      L.porta(28, 0, { invertida: true, y: 2 * T });
    },
  },
  {
    nome: 'Tudo Mentira', mundo: 2, motivoQueda: 'ERA SÓ DESENHO',
    montar(L, tentativa, memoria) {
      L.chao(0, 6);
      L.chao(26, 31);
      L.espinhos(7, 17, 19);
      L.inicio(2, 15);
      L.bloco(4, 12, 1, 1, { visivel: false, revelavel: true });
      L.placa(3, 9, 'SÓ CONFIE NO QUE VOCÊ VÊ');
      const falsos = [[10, 13], [14, 13], [18, 13]].map(([c, r]) => L.bloco(c, r, 2, 1, { solido: false }));
      // Os que voce ja descobriu continuam aparecendo depois de morrer
      memoria.revelados ||= new Set();
      const escondidos = [[8, 14], [11, 12], [14, 11], [17, 11], [20, 13], [23, 14]].map(([c, r], i) => {
        const b = L.bloco(c, r, 2, 1, { visivel: memoria.revelados.has(i), revelavel: true });
        b.update = () => { if (b.visivel) memoria.revelados.add(i); };
        return b;
      });
      L.coisa({
        update() {
          for (const f of falsos) {
            if (f.visivel && toca(f, corpoJogador())) {
              f.visivel = false;
              poof(f.x + f.w / 2, f.y + f.h / 2);
              som('risadinha');
            }
          }
          // De vez em quando um brilhinho entrega um bloco escondido
          if (L.t % 100 === 0) {
            const b = sortear(escondidos.filter(e => !e.visivel));
            if (b) brilho(b.x + b.w / 2, b.y + b.h / 2);
          }
        },
      });
      L.porta(29, 16);
    },
  },
  {
    nome: 'A Fase Tá Bugada', mundo: 2,
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(5, 15, 1);
      L.espinhos(11, 15, 1);
      L.espinhos(17, 15, 1);
      L.placa(26, 12, 'QUASE LÁ!');
      L.porta(29, 16);
      L.gatilho(23, 0, 1, 18, () => {
        L.glitch = 45;
        som('glitch');
        tremor = 10;
        espelhar(L);
        L.inverter = true;
        L.tituloAoContrario = true;
        dizer('ESPELHOU TUDO! (OS CONTROLES TAMBÉM)', 110);
      });
    },
  },
  {
    nome: 'O Chefão É a Porta', mundo: 2, motivo: 'A PORTA MORDEU',
    montar(L) {
      L.chao();
      L.solido(0, 0, 32, 2);
      L.solido(0, 2, 1, 14);
      L.solido(31, 2, 1, 14);
      L.inicio(5, 15);
      L.placa(16, 5, 'APERTE O BOTÃO NA HORA CERTA');
      const chaoPorta = 16 * T - 45;
      const chefe = L.coisa({ x: 24 * T, y: chaoPorta, w: 30, h: 45, vx: 0, vy: 0, noAr: false, estado: 'fugindo', t: 0, tiros: 0, jaula: null });
      const botao = L.coisa({ x: 15 * T, y: 16 * T - 8, w: 2 * T, h: 8, cd: 0 });
      const jaulas = [1, 27].map(c => L.coisa({ x: c * T, w: 4 * T, y: 2 * T, h: 100, estado: 'cima', t: 0 }));
      const chaoJaula = 16 * T - 100;

      chefe.update = () => {
        if (chefe.estado === 'fugindo') {
          const dx = (chefe.x + 15) - (p.x + p.w / 2);
          if (!chefe.noAr) {
            chefe.vx = Math.abs(dx) < 190 ? (Math.sign(dx) || 1) * 3.6 : chefe.vx * 0.85;
            chefe.x += chefe.vx;
            const min = T, max = W - T - chefe.w;
            if (chefe.x <= min || chefe.x >= max) {
              chefe.x = limitar(chefe.x, min, max);
              if (Math.abs(dx) < 120) {
                // Encurralada: pula por cima do jogador ate o outro canto
                const alvo = chefe.x <= min + 1 ? 29 * T : 2 * T;
                chefe.noAr = true;
                chefe.vy = -12;
                chefe.vx = (alvo - chefe.x) / 48;
                som('pulo');
              }
            }
          } else {
            chefe.vy += 0.5;
            chefe.x += chefe.vx;
            chefe.y += chefe.vy;
            if (chefe.y >= chaoPorta) {
              chefe.y = chaoPorta;
              chefe.noAr = false;
              chefe.vx = 0;
              tremor = 5;
            }
          }
          if (toca(chefe, hitJogador())) morrer('A PORTA MORDEU');
        } else if (chefe.estado === 'presa') {
          chefe.t++;
          if (toca(chefe, hitJogador())) morrer('MORDEU ATRAVÉS DA GRADE');
          if (chefe.tiros < 3 && chefe.t % 75 === 0) {
            chefe.tiros++;
            const dir = chefe.jaula.x < W / 2 ? 1 : -1;
            som('nhac');
            L.perigos.push({
              x: chefe.x + (dir > 0 ? 40 : -34), y: 16 * T - 24, w: 24, h: 24, tipo: 'espinho', dir: 'cima',
              ativo: true, visivel: true, escala: 1, motivo: 'ESPINHO TELEGUIADO',
              update(e) {
                e.x += dir * 5.5;
                if (e.x < T || e.x > W - T - e.w) { e.ativo = false; e.visivel = false; }
              },
            });
          }
          if (chefe.tiros >= 3 && chefe.t >= 3 * 75 + 90) {
            chefe.estado = 'cansada';
            chefe.jaula.estado = 'subindo';
            dizer('ELA CANSOU! PEGA ELA!', 90);
          }
        } else if (chefe.estado === 'cansada' && toca(chefe, corpoJogador())) {
          vencer();
        }
      };
      chefe.draw = () => desenharPorta({ ...chefe, olhos: chefe.estado !== 'cansada', dormindo: chefe.estado === 'cansada', dentes: chefe.estado !== 'cansada' });

      botao.update = () => {
        if (botao.cd > 0) botao.cd--;
        if (botao.cd <= 0 && p.noChao && toca(botao, corpoJogador())) {
          botao.cd = 160;
          som('clique');
          for (const j of jaulas) if (j.estado === 'cima') j.estado = 'caindo';
        }
      };
      botao.draw = () => {
        ctx.fillStyle = botao.cd > 0 ? '#7a1f1f' : '#ff3b3b';
        ctx.fillRect(botao.x + 6, botao.y + (botao.cd > 0 ? 5 : 0), botao.w - 12, botao.cd > 0 ? 3 : 8);
      };

      for (const j of jaulas) {
        j.update = () => {
          if (j.estado === 'caindo') {
            j.y = Math.min(chaoJaula, j.y + 14);
            if (toca(j, hitJogador())) morrer('ENJAULADO POR ENGANO');
            if (j.y >= chaoJaula) {
              som('esmagar');
              tremor = 6;
              const centro = chefe.x + 15;
              if (chefe.estado === 'fugindo' && !chefe.noAr && centro > j.x && centro < j.x + j.w) {
                chefe.estado = 'presa';
                chefe.jaula = j;
                chefe.t = 0;
                j.estado = 'prendendo';
                dizer('PRESA! AGORA DESVIA', 80);
              } else {
                j.estado = 'esperando';
                j.t = 60;
              }
            }
          }
          if (j.estado === 'esperando' && --j.t <= 0) j.estado = 'subindo';
          if (j.estado === 'subindo') {
            j.y = Math.max(2 * T, j.y - 3);
            if (j.y <= 2 * T) j.estado = 'cima';
          }
        };
        j.draw = () => {
          ctx.strokeStyle = '#c9c9d6';
          ctx.lineWidth = 4;
          for (let x = j.x + 8; x < j.x + j.w; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, j.y);
            ctx.lineTo(x, j.y + j.h);
            ctx.stroke();
          }
          ctx.fillStyle = '#8d8da0';
          ctx.fillRect(j.x, j.y, j.w, 8);
          ctx.fillRect(j.x, j.y + j.h - 6, j.w, 6);
        };
      }
      dizer('CHEFÃO: A PORTA', 90);
    },
  },
];

// ---------- desenho ----------

function texto(txt, x, y, { tam = 20, cor = '#fff', alinhar = 'center', contorno = '#000', peso = 700 } = {}) {
  ctx.font = `${peso} ${tam}px Fredoka, system-ui, sans-serif`;
  ctx.textAlign = alinhar;
  ctx.textBaseline = 'middle';
  if (contorno) {
    ctx.lineWidth = Math.max(3, tam / 5);
    ctx.strokeStyle = contorno;
    ctx.lineJoin = 'round';
    ctx.strokeText(txt, x, y);
  }
  ctx.fillStyle = cor;
  ctx.fillText(txt, x, y);
}

function desenharFundo(m) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, m.ceu[0]);
  g.addColorStop(1, m.ceu[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (m.deco === 'nuvem') {
    ctx.fillStyle = '#ffffffcc';
    for (let i = 0; i < 5; i++) {
      const x = ((i * 230 + quadro * (0.2 + i * 0.05)) % (W + 160)) - 80;
      const y = 60 + (i % 3) * 55;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.arc(x + 25, y - 10, 28, 0, Math.PI * 2);
      ctx.arc(x + 52, y, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (m.deco === 'cristal') {
    for (let i = 0; i < 26; i++) {
      const x = (i * 137) % W, y = (i * 89) % (H - 100);
      ctx.fillStyle = `rgba(180,160,255,${0.15 + 0.15 * Math.sin(quadro / 30 + i)})`;
      ctx.fillRect(x, y, 3, 3);
    }
  } else {
    for (let i = 0; i < 18; i++) {
      const x = (i * 173 + Math.sin(quadro / 40 + i) * 20) % W;
      const y = H - ((quadro * (0.6 + (i % 4) * 0.2) + i * 61) % H);
      ctx.fillStyle = `rgba(255,${120 + (i % 3) * 40},60,0.5)`;
      ctx.fillRect(x, y, 3, 3);
    }
  }
}

function desenharBloco(x, y, w, h, m, comTopo = true) {
  ctx.fillStyle = m.corpo;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = m.sombra;
  ctx.fillRect(x, y + h - 4, w, 4);
  ctx.fillRect(x + w - 3, y, 3, h);
  if (comTopo) {
    ctx.fillStyle = m.topo;
    ctx.fillRect(x, y, w, 7);
  }
}

function desenharGrid() {
  const m = L.mundo;
  for (let r = 0; r < LINHAS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!L.grid[r][c]) continue;
      desenharBloco(c * T, r * T, T, T, m, r === 0 || !L.grid[r - 1][c]);
    }
  }
}

function desenharPorta(d) {
  if (d.visivel === false) return;
  ctx.save();
  ctx.translate(d.x + (d.tremor ? (Math.random() - 0.5) * d.tremor * 2 : 0), d.y);
  if (d.invertida) {
    ctx.translate(0, d.h);
    ctx.scale(1, -1);
  }
  ctx.fillStyle = '#2d1a0e';
  ctx.fillRect(-3, -3, d.w + 6, d.h + 3);
  ctx.fillStyle = '#9a5f2e';
  ctx.fillRect(0, 0, d.w, d.h);
  ctx.fillStyle = '#7d4a22';
  ctx.fillRect(5, 5, d.w - 10, 14);
  ctx.fillRect(5, 23, d.w - 10, 17);
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(d.w - 7, 26, 2.5, 0, Math.PI * 2);
  ctx.fill();
  if (d.olhos || d.dormindo) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(5, 8, 8, d.dormindo ? 2 : 7);
    ctx.fillRect(17, 8, 8, d.dormindo ? 2 : 7);
    if (!d.dormindo) {
      ctx.fillStyle = '#d11';
      ctx.fillRect(8, 11, 3, 3);
      ctx.fillRect(20, 11, 3, 3);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 5); ctx.lineTo(13, 8);
      ctx.moveTo(26, 5); ctx.lineTo(17, 8);
      ctx.stroke();
    }
  }
  if (d.dentes) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(4 + i * 6, 30);
      ctx.lineTo(7 + i * 6, 36);
      ctx.lineTo(10 + i * 6, 30);
      ctx.fill();
    }
  }
  ctx.restore();
  if (d.dormindo) texto('zzz', d.x + 30, d.y - 12 - Math.sin(quadro / 15) * 4, { tam: 16, cor: '#bfe3ff' });
  if (d.rotulo) texto(d.rotulo, d.x + d.w / 2, d.y - 14, { tam: 18 });
}

function desenharEsmagador(b) {
  ctx.fillStyle = '#5a5a6a';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = '#3d3d4a';
  ctx.fillRect(b.x, b.y + b.h - 10, b.w, 10);
  ctx.fillStyle = '#c8c8d8';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(b.x + i * 15, b.y + b.h);
    ctx.lineTo(b.x + i * 15 + 7.5, b.y + b.h + 8);
    ctx.lineTo(b.x + i * 15 + 15, b.y + b.h);
    ctx.fill();
  }
  // olhos que seguem o jogador
  const olhaX = limitar((p.x - b.x) / 40, -3, 3);
  ctx.fillStyle = '#fff';
  ctx.fillRect(b.x + 10, b.y + b.h - 50, 14, 12);
  ctx.fillRect(b.x + 36, b.y + b.h - 50, 14, 12);
  ctx.fillStyle = '#111';
  ctx.fillRect(b.x + 15 + olhaX, b.y + b.h - 46, 5, 5);
  ctx.fillRect(b.x + 41 + olhaX, b.y + b.h - 46, 5, 5);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(b.x + 8, b.y + b.h - 56); ctx.lineTo(b.x + 26, b.y + b.h - 50);
  ctx.moveTo(b.x + 52, b.y + b.h - 56); ctx.lineTo(b.x + 34, b.y + b.h - 50);
  ctx.stroke();
}

function desenharBlocos() {
  for (const b of L.blocos) {
    if (!b.visivel) continue;
    const tx = b.tremor ? (Math.random() - 0.5) * b.tremor * 2 : 0;
    if (b.desenho === 'porta') desenharPorta({ ...b, x: b.x + tx });
    else if (b.desenho === 'esmagador') desenharEsmagador({ ...b, x: b.x + tx });
    else if (b.desenho === 'banner') desenharBanner(b.x + tx, b.y);
    else desenharBloco(b.x + tx, b.y, b.w, b.h, L.mundo);
  }
}

function desenharEspinho(e) {
  const m = L.mundo;
  const s = e.escala;
  ctx.fillStyle = m.espinho;
  ctx.strokeStyle = m.espinhoBorda;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const { x, y, w, h } = e;
  if (e.dir === 'baixo') {
    ctx.moveTo(x + 2, y); ctx.lineTo(x + w / 2, y + h * s); ctx.lineTo(x + w - 2, y);
  } else if (e.dir === 'esq') {
    ctx.moveTo(x + w, y + 2); ctx.lineTo(x + w - w * s, y + h / 2); ctx.lineTo(x + w, y + h - 2);
  } else if (e.dir === 'dir') {
    ctx.moveTo(x, y + 2); ctx.lineTo(x + w * s, y + h / 2); ctx.lineTo(x, y + h - 2);
  } else {
    ctx.moveTo(x + 2, y + h); ctx.lineTo(x + w / 2, y + h - h * s); ctx.lineTo(x + w - 2, y + h);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function desenharFlor(e) {
  const cx = e.x + 7, cy = e.y + 4;
  ctx.strokeStyle = '#3c9a3c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, e.y + e.h);
  ctx.stroke();
  ctx.fillStyle = '#ff7eb6';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + quadro / 60;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function desenharPerigos() {
  for (const e of L.perigos) {
    if (!e.visivel) continue;
    if (e.tipo === 'flor') desenharFlor(e);
    else if (e.tipo === 'espinho') desenharEspinho(e);
  }
}

function desenharJogador() {
  if (estado === 'morto' || !p) return;
  ctx.save();
  ctx.translate(p.x + p.w / 2, p.grav > 0 ? p.y + p.h : p.y);
  ctx.scale(p.escX, p.escY * p.grav);
  const w = p.w, h = p.h;
  ctx.fillStyle = '#2b1a0a';
  ctx.beginPath();
  ctx.roundRect(-w / 2 - 2, -h - 2, w + 4, h + 4, 6);
  ctx.fill();
  ctx.fillStyle = COR_JOGADOR;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h, w, h, 5);
  ctx.fill();
  const piscando = quadro % 180 < 6;
  const ox = p.olhar * 2.5;
  ctx.fillStyle = '#fff';
  ctx.fillRect(-6 + ox, -h + 6, 5, piscando ? 1 : 7);
  ctx.fillRect(2 + ox, -h + 6, 5, piscando ? 1 : 7);
  if (!piscando) {
    ctx.fillStyle = '#111';
    ctx.fillRect(-4 + ox + p.olhar, -h + 8, 2, 3);
    ctx.fillRect(4 + ox + p.olhar, -h + 8, 2, 3);
  }
  ctx.restore();
}

function desenharPlacas() {
  for (const pl of L.placas) if (pl.visivel) texto(pl.txt, pl.x, pl.y, { tam: 18, cor: '#fff', contorno: '#00000099' });
}

function desenharCaixaMortes(x, y) {
  ctx.fillStyle = '#000000aa';
  ctx.beginPath();
  ctx.roundRect(x, y, 140, 34, 8);
  ctx.fill();
  texto(`☠ MORTES: ${salvo.mortes}`, x + 70, y + 18, { tam: 16, contorno: null });
}

function tituloDaFase() {
  const n = String(faseAtual + 1).padStart(2, '0');
  const t = `FASE ${n} · ${FASES[faseAtual].nome.toUpperCase()}`;
  return L.tituloAoContrario ? [...t].reverse().join('') : t;
}

function desenharBanner(x, y) {
  ctx.fillStyle = '#000000aa';
  ctx.beginPath();
  ctx.roundRect(x, y, 380, 34, 8);
  ctx.fill();
  texto(tituloDaFase(), x + 190, y + 18, { tam: 15, contorno: null });
}

function desenharHud() {
  if (!L.hudCaiu) desenharCaixaMortes(12, 10);
  if (!L.tituloCaiu) desenharBanner(W / 2 - 190, 8);
  texto(`TENTATIVA ${tentativa}`, W - 16, 27, { tam: 15, alinhar: 'right', contorno: '#00000099' });
  if (L.inverter) texto('🙃 CONTROLES INVERTIDOS', W - 16, 52, { tam: 13, alinhar: 'right', cor: '#ffd23f', contorno: '#000' });
}

function desenharPiada() {
  if (!piada) return;
  const a = Math.min(1, piada.t / 15);
  ctx.globalAlpha = a;
  const pulo = Math.max(0, (piada.t - 65) / 15);
  texto(piada.txt, W / 2, 110 - pulo * 10, { tam: 34 + pulo * 8, cor: '#ffe14d', contorno: '#000' });
  ctx.globalAlpha = 1;
  if (--piada.t <= 0) piada = null;
}

function desenharIntro() {
  if (intro <= 0) return;
  const a = Math.min(1, intro / 20);
  ctx.globalAlpha = a;
  ctx.fillStyle = '#000000aa';
  ctx.fillRect(0, H / 2 - 60, W, 120);
  const def = FASES[faseAtual];
  texto(`MUNDO ${def.mundo + 1} · ${MUNDOS[def.mundo].nome}`, W / 2, H / 2 - 22, { tam: 18, cor: '#ffd23f', contorno: null });
  texto(`${String(faseAtual + 1).padStart(2, '0')} — ${def.nome.toUpperCase()}`, W / 2, H / 2 + 16, { tam: 36 });
  ctx.globalAlpha = 1;
  intro--;
}

function desenharGlitch() {
  if (!L.glitch) return;
  for (let i = 0; i < 8; i++) {
    const y = Math.random() * H, h = 6 + Math.random() * 30;
    ctx.drawImage(tela, 0, y, W, h, (Math.random() - 0.5) * 60, y, W, h);
  }
  ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,0,80' : '0,255,220'},0.15)`;
  ctx.fillRect(0, 0, W, H);
  if (Math.random() > 0.5) texto('ERRO 404: FASE NÃO ENCONTRADA', W / 2, H / 2, { tam: 30, cor: '#ff3b6b' });
}

function desenharParticulas() {
  for (const q of particulas) {
    ctx.globalAlpha = Math.min(1, q.vida / (q.max * 0.4));
    ctx.fillStyle = q.cor;
    ctx.fillRect(q.x - q.tam / 2, q.y - q.tam / 2, q.tam, q.tam);
  }
  ctx.globalAlpha = 1;
}

function desenharMenu() {
  desenharFundo(MUNDOS[Math.floor(quadro / 300) % 3]);
  ctx.fillStyle = '#00000066';
  ctx.fillRect(0, 0, W, H);
  const balanco = Math.sin(quadro / 20) * 0.05;
  ctx.save();
  ctx.translate(W / 2, 170);
  ctx.rotate(balanco);
  texto('NÃO CONFIA', 0, 0, { tam: 92, cor: '#ffd23f', contorno: '#2b1a0a' });
  ctx.restore();
  texto('um jogo onde tudo mente pra você', W / 2, 245, { tam: 22, cor: '#fff', contorno: '#000' });
  if (Math.floor(quadro / 30) % 2) {
    texto(salvo.fase > 0 ? `ESPAÇO: CONTINUAR (FASE ${salvo.fase + 1})` : 'APERTE ESPAÇO PRA JOGAR', W / 2, 330, { tam: 28 });
  }
  if (salvo.fase > 0) texto('N: COMEÇAR DO ZERO', W / 2, 372, { tam: 18, cor: '#ccc' });
  texto(`☠ Mortes até agora: ${salvo.mortes}`, W / 2, 420, { tam: 18, cor: '#ffb3b3' });
  texto('← → andar · ESPAÇO pular · R reiniciar · ESC pausa · M som', W / 2, 500, { tam: 15, cor: '#ddd', contorno: '#000' });
  // bonequinho correndo no menu
  if (!p || estado === 'menu') {
    const x = (quadro * 3) % (W + 40) - 20;
    ctx.fillStyle = COR_JOGADOR;
    ctx.fillRect(x, 455 - Math.abs(Math.sin(quadro / 8)) * 20, 20, 26);
  }
}

function desenharFim() {
  desenharFundo(MUNDOS[2]);
  ctx.fillStyle = '#00000088';
  ctx.fillRect(0, 0, W, H);
  texto('VOCÊ ZEROU!', W / 2, 140, { tam: 72, cor: '#ffd23f' });
  texto('(e a gente nem acreditava em você)', W / 2, 200, { tam: 22 });
  const m = salvo.mortes;
  const titulo = m < 60 ? 'LENDA' : m < 150 ? 'TEIMOSO' : m < 300 ? 'PERSISTENTE' : 'MASOQUISTA OFICIAL';
  texto(`☠ ${m} mortes`, W / 2, 280, { tam: 40, cor: '#ffb3b3' });
  texto(`Título: ${titulo}`, W / 2, 330, { tam: 28 });
  // O "FIM" cai e quica: dessa vez nao machuca ninguem
  const t = Math.min(quadro % 400, 120);
  const y = 380 + Math.abs(Math.cos(t / 12)) * Math.max(0, 60 - t / 2) * -1;
  texto('FIM', W / 2, y + 40, { tam: 40, cor: '#fff' });
  if (Math.floor(quadro / 30) % 2) texto('ESPAÇO: JOGAR DE NOVO', W / 2, 500, { tam: 20 });
}

function desenhar() {
  ctx.save();
  if (tremor > 0) {
    ctx.translate((Math.random() - 0.5) * tremor, (Math.random() - 0.5) * tremor);
    tremor *= 0.85;
    if (tremor < 0.5) tremor = 0;
  }
  if (estado === 'menu') {
    desenharMenu();
  } else if (estado === 'fim') {
    desenharFim();
    desenharParticulas();
  } else {
    desenharFundo(L.mundo);
    desenharGrid();
    desenharPlacas();
    desenharBlocos();
    for (const d of L.portas) desenharPorta(d);
    desenharPerigos();
    for (const c of L.coisas) c.draw?.(c);
    desenharJogador();
    desenharParticulas();
    desenharGlitch();
    desenharHud();
    desenharPiada();
    desenharIntro();
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash * 0.6})`;
      ctx.fillRect(0, 0, W, H);
      flash = Math.max(0, flash - 0.05);
    }
    if (estado === 'pausa') {
      ctx.fillStyle = '#000000aa';
      ctx.fillRect(0, 0, W, H);
      texto('PAUSADO', W / 2, H / 2 - 20, { tam: 56 });
      texto('ESC continua · Q volta pro menu', W / 2, H / 2 + 30, { tam: 20 });
    }
  }
  ctx.restore();
}

// ---------- laco principal (passo fixo de 60 Hz) ----------

let anterior = performance.now();
let acumulado = 0;
const PASSO_MS = 1000 / 60;

function atualizar() {
  quadro++;
  if (estado === 'jogando') passo();
  else if (estado === 'morto' && --timerEstado <= 0) {
    tentativa++;
    montarFase();
    estado = 'jogando';
  } else if (estado === 'vitoria' && --timerEstado <= 0) {
    proximaFase();
  }
  if (estado !== 'pausa') atualizarParticulas();
}

function laco(agora) {
  acumulado += Math.min(100, agora - anterior);
  anterior = agora;
  while (acumulado >= PASSO_MS) {
    atualizar();
    acumulado -= PASSO_MS;
  }
  desenhar();
  requestAnimationFrame(laco);
}
requestAnimationFrame(laco);

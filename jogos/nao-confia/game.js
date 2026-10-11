// NÃO CONFIA — plataforma troll em 100 fases (10 mundos de 10).
// Este arquivo e' o motor: fisica, pecas de armadilha, desenho e telas.
// As fases ficam em fases/mundoNN.js e entram na lista FASES.
// Tudo desenhado no canvas e com sons sintetizados: sem imagens, sem audios, sem build.
'use strict';

const T = 30;                 // tamanho do bloco
const COLS = 32, LINHAS = 18;
const W = COLS * T, H = LINHAS * T;
const VMAX = 4.5, QUEDA_MAX = 12;
const FRAMES_MORTO = 6;       // 0,1 s ate renascer
const COR_JOGADOR = '#ff8a1f';
const FASES_POR_MUNDO = 10;

// Fisica padrao; cada mundo ou fase pode mudar (gelo, espaco...)
const FISICA = { acel: 0.45, acelAr: 0.35, freio: 0.55, freioAr: 0.92, grav: 0.55, pulo: 10.6 };

const FASES = [];             // preenchida pelos arquivos fases/mundoNN.js

const tela = document.getElementById('tela');
const ctx = tela.getContext('2d');
const sombraCanvas = document.createElement('canvas');
sombraCanvas.width = W;
sombraCanvas.height = H;
const ctxSombra = sombraCanvas.getContext('2d');

const sortear = lista => lista[Math.floor(Math.random() * lista.length)];
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const toca = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// ---------- progresso salvo ----------

function carregar() {
  const padrao = { mortes: 0, fase: 0, max: 0, zerou: false, paciencia: 100 };
  try {
    const s = { ...padrao, ...JSON.parse(localStorage.getItem('naoConfia')) };
    s.max = Math.max(s.max, s.fase);
    return s;
  } catch {
    return padrao;
  }
}
const salvo = carregar();
// O troll acabou enquanto o jogo estava fechado: devolve um pouco de paciencia
if (salvo.trollAte && salvo.trollAte <= Date.now()) {
  salvo.trollAte = 0;
  salvo.paciencia = Math.max(salvo.paciencia, 30);
}
function gravar() {
  try { localStorage.setItem('naoConfia', JSON.stringify(salvo)); } catch { /* sem storage */ }
}
// Atalho pra testar: index.html?fase=42 comeca direto na fase 42
const faseNaUrl = Number(new URLSearchParams(location.search).get('fase'));
if (faseNaUrl >= 1 && faseNaUrl <= 100) {
  salvo.fase = faseNaUrl - 1;
  salvo.max = Math.max(salvo.max, salvo.fase);
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
  mola: () => tom(180, 0.25, { tipo: 'sine', vol: 0.18, ate: 720 }),
  tiro: () => { tom(600, 0.08, { tipo: 'square', vol: 0.06, ate: 200 }); ruido(0.05, 0.08); },
  laser: () => tom(1400, 0.06, { tipo: 'sawtooth', vol: 0.03, ate: 900 }),
  raio: () => { ruido(0.4, 0.3); tom(60, 0.4, { tipo: 'sawtooth', vol: 0.15, ate: 30 }); },
};
const som = nome => SONS[nome]?.();

// ---------- controles ----------

const teclas = { esq: false, dir: false, pulo: false };
let pulsoPulo = false;        // apertou pular neste quadro
let bufferPulo = 0;
const MAPA = {
  ArrowLeft: 'esq', KeyA: 'esq', ArrowRight: 'dir', KeyD: 'dir',
  Space: 'pulo', ArrowUp: 'pulo', KeyW: 'pulo', KeyZ: 'pulo',
};

function apertou(tecla) {
  if (trollAtivo()) return;
  if (tecla === 'pulo' && !teclas.pulo) {
    pulsoPulo = true;
    if (estado === 'menu' || estado === 'fim') comecar();
  }
  teclas[tecla] = true;
}

addEventListener('keydown', e => {
  // Com o troll na tela, so da pra desligar o som
  if (trollAtivo() && e.code !== 'KeyM') { e.preventDefault(); return; }
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
  if (estado === 'menu') {
    if (e.code === 'KeyN') {
      Object.assign(salvo, { mortes: 0, fase: 0, paciencia: 100 });
      gravar();
      comecar();
    }
    // 1..9 e 0 escolhem o mundo (se ja chegou nele)
    const m = /^Digit(\d)$/.exec(e.code);
    if (m) {
      const mundo = m[1] === '0' ? 9 : Number(m[1]) - 1;
      const inicio = mundo * FASES_POR_MUNDO;
      if (inicio <= salvo.max && inicio < FASES.length) {
        salvo.fase = inicio;
        comecar();
      }
    }
  }
});
addEventListener('keyup', e => {
  const tecla = MAPA[e.code];
  if (tecla) teclas[tecla] = false;
});
addEventListener('blur', () => { teclas.esq = teclas.dir = teclas.pulo = false; });

// Botoes na tela pra celular e tablet
const TOQUE = matchMedia('(pointer: coarse)').matches;
if (TOQUE) {
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
  { nome: 'DESERTO DA MIRAGEM', ceu: ['#ffb46b', '#ffe7b0'], corpo: '#d9a35b', topo: '#f2cf8a', sombra: '#b07d3c', espinho: '#fff6e0', espinhoBorda: '#8a6a3a', deco: 'sol' },
  { nome: 'GELO TRAIÇOEIRO', ceu: ['#a8dcff', '#f0fbff'], corpo: '#7fb8e0', topo: '#e8f7ff', sombra: '#5a92bd', espinho: '#ffffff', espinhoBorda: '#4f86b0', deco: 'neve', fisica: { acel: 0.12, acelAr: 0.2, freio: 0.985, freioAr: 0.97 } },
  { nome: 'FÁBRICA MALUCA', ceu: ['#2a2d33', '#4a4f57'], corpo: '#6c727c', topo: '#f2c230', sombra: '#4b5058', espinho: '#e6e6e6', espinhoBorda: '#7a7a7a', deco: 'engrenagem' },
  { nome: 'ESPAÇO SIDERAL', ceu: ['#05030f', '#1a1240'], corpo: '#5b5f78', topo: '#a7adcf', sombra: '#3c3f55', espinho: '#d6f0ff', espinhoBorda: '#5a7aa0', deco: 'estrela', fisica: { grav: 0.22, pulo: 7.9 } },
  { nome: 'CIDADE DOS BUGS', ceu: ['#001a0d', '#00331a'], corpo: '#0f5132', topo: '#39ff88', sombra: '#083823', espinho: '#b6ffd6', espinhoBorda: '#1f9a5a', deco: 'glitch' },
  { nome: 'CÉU FALSO', ceu: ['#ffc6e8', '#fff0d6'], corpo: '#ffffff', topo: '#ffd6f0', sombra: '#e9d4e6', espinho: '#ffe066', espinhoBorda: '#c9a227', deco: 'ceu' },
  { nome: 'O FIM (MENTIRA)', ceu: ['#f4f4f4', '#dcdcdc'], corpo: '#222222', topo: '#ff3b3b', sombra: '#111111', espinho: '#222222', espinhoBorda: '#000000', deco: 'vazio' },
];

// ---------- deboche ----------

const DEBOCHES = [
  'Patético.', 'Skill issue. Muito skill issue.', 'Desinstala, vai. Ninguém vai saber.', 'Até minha avó passava. De olho fechado.',
  'Seus dedos pediram demissão.', 'Isso foi constrangedor de assistir.', 'O contador de mortes tá cansado de você.', 'Você joga com o cotovelo?',
  'Eu esperava pouco. Você entregou menos.', 'O bot de teste passou. O bot.', 'Parabéns, você achou o jeito mais burro de morrer.', 'Nem tentando morrer você morria tão bem.',
  'Essa armadilha era a mais fácil do jogo.', 'Você confia em tudo, né? Por isso tá aqui.', 'Seu reflexo é de tartaruga com sono.', 'Já pensou em jogar outra coisa? Tipo nada?',
  'Morreu igual um NPC.', 'Tá rindo? Todo mundo tá rindo DE você.', 'Faltou só jogar bem.', 'Você é o motivo das instruções existirem.',
  'Que vergonha. Sério, que vergonha.', 'Tem gente que nasceu pra isso. Não é você.', 'Recorde mundial de burrice!', 'Eu já vi peixe jogar melhor.',
  'Isso foi de propósito? Fala que foi, por favor.', 'O jogo tá te humilhando e você deixa.', 'Chora não, tenta de novo. Ou chora.', 'Sua paciência foi embora. Sua dignidade também.',
  'A fase 100 tá rindo de você daqui.', 'Você nunca vai chegar na fase 100.', 'Seu teclado merece alguém melhor.', 'Que tal pular na hora certa? Ou em qualquer hora?',
  'Mais uma pra coleção de vergonha.', 'Errou rude. Errou feio. Errou muito.', 'Eu espero. Eu tenho o dia todo. Você não tem talento.', 'Desiste. É sério. Desiste.',
  'Até a porta tá com pena de você.', 'Isso não foi azar. Foi você mesmo.', 'Você perdeu pra um quadrado laranja. Você É o quadrado laranja.', 'Print disso vai pro grupo da família.',
];
let ultimoDeboche = '';
function deboche() {
  let d;
  // Quanto mais voce morre na mesma fase, mais o jogo esfrega na sua cara
  const extra = tentativa >= 5 ? [
    `Tentativa ${tentativa}. TENTATIVA ${tentativa}.`, `${tentativa} vezes na mesma fase. Impressionante.`,
    `Já são ${salvo.mortes} mortes. Orgulho zero.`, `Fase ${faseAtual + 1} de 100. Você não vai passar da ${faseAtual + 2}.`,
  ] : [];
  do d = sortear([...DEBOCHES, ...extra, ...extra]); while (d === ultimoDeboche);
  ultimoDeboche = d;
  return d;
}

function humorDaPaciencia(v) {
  if (v >= 75) return { txt: 'ZEN', cor: '#3ddc84' };
  if (v >= 50) return { txt: 'IRRITADO', cor: '#ffd23f' };
  if (v >= 25) return { txt: 'SURTANDO', cor: '#ff9a3c' };
  if (v > 0) return { txt: 'VAI QUEBRAR O TECLADO', cor: '#ff4d4d' };
  return { txt: '💢 ESGOTADA', cor: '#ff2a2a' };
}

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

function dizer(txt, frames = 80, sub = '') {
  piada = { txt, sub, t: frames };
}

// ---------- montagem de fase ----------

function novaFase(def, tentativaAtual) {
  const mundo = MUNDOS[def.mundo];
  const L = {
    def, mundo, t: 0, tentativa: tentativaAtual,
    fis: { ...FISICA, ...mundo.fisica, ...def.fisica },
    grid: Array.from({ length: LINHAS }, () => Array(COLS).fill(0)),
    blocos: [], perigos: [], portas: [], coisas: [], gatilhos: [], timers: [], placas: [],
    inicioPos: { x: 2 * T + 5, y: 16 * T - 26 },
    inverter: false, hudCaiu: false, tituloCaiu: false, tituloAoContrario: false, glitch: 0,
    escuro: null, visual: null, semPulo: false,
    aoPular: null, aoPousar: null, aoBaterCabeca: null, filtrarComando: null, desenharAcima: null,
  };
  Object.assign(L, {
    solido(c, r, w = 1, h = 1, v = 1) {
      for (let rr = r; rr < r + h; rr++) {
        for (let cc = c; cc < c + w; cc++) if (rr >= 0 && rr < LINHAS && cc >= 0 && cc < COLS) L.grid[rr][cc] = v;
      }
    },
    chao(c0 = 0, c1 = COLS - 1, r0 = 16) { L.solido(c0, r0, c1 - c0 + 1, LINHAS - r0); },
    teto(r1 = 1, c0 = 0, c1 = COLS - 1) { L.solido(c0, 0, c1 - c0 + 1, r1 + 1); },
    buraco(c0, c1, comEspinho = true) {
      L.solido(c0, 16, c1 - c0 + 1, 2, 0);
      if (comEspinho) L.espinhos(c0, 17, c1 - c0 + 1);
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
    // Texto pode ser uma lista: muda a cada morte ("a fase muda sutilmente")
    placa(c, r, txt, extra = {}) {
      const texto = Array.isArray(txt) ? txt[(L.tentativa - 1) % txt.length] : txt;
      const pl = { x: c * T + T / 2, y: r * T + T / 2, txt: texto, visivel: true, ...extra };
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
const centroX = () => p.x + p.w / 2;

function montarFase() {
  const def = FASES[faseAtual];
  L = novaFase(def, tentativa);
  def.montar(L, tentativa, memoria);
  if (SORTE && !def.semSorte) dadoDoTroll(L);
  p = novoJogador(memoria.checkpoint || L.inicioPos);
  bufferPulo = 0;
  pulsoPulo = false;
}

function comecar() {
  if (trollAtivo()) return;
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
  salvo.paciencia = Math.max(0, salvo.paciencia - 3);
  if (salvo.paciencia === 0 && SORTE) chamarTroll();
  gravar();
  explosao(p.x + p.w / 2, p.y + p.h / 2, COR_JOGADOR, 28);
  tremor = 12;
  som('morte');
  dizer(motivo, 80, deboche());
}

function vencer() {
  if (estado !== 'jogando') return;
  estado = 'vitoria';
  timerEstado = 40;
  flash = 1;
  salvo.paciencia = Math.min(100, salvo.paciencia + 12);
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
  salvo.fase = faseAtual;
  salvo.max = Math.max(salvo.max, faseAtual);
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

// Le os controles do quadro; algumas fases mexem nisso (lag, controles trocados...)
function lerComando() {
  let cmd = {
    dir: (teclas.dir ? 1 : 0) - (teclas.esq ? 1 : 0),
    segurando: teclas.pulo,
    apertou: pulsoPulo,
  };
  pulsoPulo = false;
  if (L.filtrarComando) cmd = L.filtrarComando(cmd);
  if (L.inverter) cmd.dir = -cmd.dir;
  if (L.inverterDado > 0) { L.inverterDado--; cmd.dir = -cmd.dir; }
  if (L.semPulo) cmd.apertou = false;
  return cmd;
}

function moverJogador() {
  const f = L.fis;
  const cmd = lerComando();
  p.cmd = cmd;
  if (cmd.apertou) bufferPulo = 7;
  const dir = cmd.dir;
  const acel = p.noChao ? f.acel : f.acelAr;
  if (dir) p.vx += limitar(dir * VMAX * (p.velMult || 1) - p.vx, -acel, acel);
  else {
    p.vx *= p.noChao ? f.freio : f.freioAr;
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
      p.vy = -f.pulo * p.grav;
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
  if (p.vy * p.grav >= 0) p.lancado = false;
  if (p.vy * p.grav < 0 && !cmd.segurando && !L.def.puloInverte && !p.lancado) p.vy += f.grav * p.grav * 1.4;
  // Lancado por mola/foguete pode subir mais rapido que o limite normal
  if (!p.semGravidade) p.vy = limitar(p.vy + f.grav * p.grav, p.lancado ? -30 : -QUEDA_MAX, p.lancado ? 30 : QUEDA_MAX);
  if (p.empurrao) {
    p.vx += p.empurrao;
    p.empurrao = 0;
  }

  if (p.chaoBloco) {
    const est = p.chaoBloco.esteira;
    p.x += p.chaoBloco.dx + (typeof est === 'function' ? est(cmd) : est || 0);
    p.y += p.chaoBloco.dy;
  }

  p.x += p.vx;
  for (const s of solidosEm(p)) {
    // Encostou so de raspao com o pe (ate 4px, ex.: plataforma que sobe): sobe em cima, nao e' parede
    const peEmCima = p.grav > 0 ? p.y + p.h - s.y <= 4 : s.y + s.h - p.y <= 4;
    if (peEmCima && Math.min(p.y + p.h, s.y + s.h) - Math.max(p.y, s.y) <= 4) {
      p.y = p.grav > 0 ? s.y - p.h : s.y + s.h;
      continue;
    }
    // Degrau baixinho (mola, tampa...): sobe sem precisar pular
    if (p.noChao && p.grav > 0 && s.y >= p.y + p.h - 13 && !solidosEm({ x: p.x, y: s.y - p.h, w: p.w, h: p.h }).some(o => o !== s && o.y < s.y)) {
      p.y = s.y - p.h;
      continue;
    }
    if (p.vx > 0 || (p.vx === 0 && p.x + p.w / 2 < s.x + s.w / 2)) p.x = s.x - p.w;
    else p.x = s.x + s.w;
    p.vx = 0;
    revelar(s);
  }
  if (p.x < 0 && !L.def.saidaEsquerda) { p.x = 0; p.vx = 0; }
  if (p.x + p.w > W && !L.def.saidaDireita) { p.x = W - p.w; p.vx = 0; }

  const estavaNoChao = p.noChao;
  p.noChao = false;
  p.chaoBloco = null;
  p.y += p.vy;
  let molaPisada = null;
  const vyAntes = p.vy;
  for (const s of solidosEm(p)) {
    if (vyAntes > 0) p.y = Math.min(p.y, s.y - p.h);
    else if (vyAntes < 0) p.y = Math.max(p.y, s.y + s.h);
    else continue;
    if (Math.sign(vyAntes) === p.grav) {
      p.noChao = true;
      // Pisando num bloco que se mexe (plataforma, elevador...) ele te carrega junto
      if (s.dx !== undefined || !p.chaoBloco) p.chaoBloco = s.dx !== undefined ? s : p.chaoBloco;
      if (s.mola) molaPisada = s;
    } else {
      L.aoBaterCabeca?.(s);
    }
    revelar(s);
    s.aoTocar?.(s);
    p.vy = 0;
  }
  if (molaPisada) {
    const forca = typeof molaPisada.mola === 'function' ? molaPisada.mola(p.cmd) : molaPisada.mola;
    p.vy = -forca * p.grav;
    p.noChao = false;
    p.chaoBloco = null;
    molaPisada.apertada = 8;
    p.lancado = true;
    p.escY = 1.5;
    som('mola');
  } else if (p.noChao && !estavaNoChao) {
    p.escX = 1.3;
    p.escY = 0.75;
    poeira(p.x + p.w / 2, p.grav > 0 ? p.y + p.h : p.y);
    som('pousar');
    L.aoPousar?.();
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
    if (b.apertada) b.apertada--;
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
  if (L.def.saidaBaixo && p.y > H) return vencer();
  if (L.def.saidaEsquerda && p.x + p.w <= 0) return vencer();
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
function brilho(x, y, cor = '#fff7a8') {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    particula(x, y, Math.cos(a) * 2, Math.sin(a) * 2, cor, 25, 3, 0);
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

// Pedaco do chao que desaba quando o jogador pisa
function desmoronar(L, c0, c1, { intervalo = 2, r = 16, h = 2 } = {}) {
  L.solido(c0, r, c1 - c0 + 1, h, 0);
  const pedacos = [];
  for (let c = c0; c <= c1; c++) pedacos.push(L.bloco(c, r, 1, h));
  L.gatilho(c0, r - 1, c1 - c0 + 1, 1, () => { som('crack'); derrubar(pedacos, intervalo); });
  return pedacos;
}

// ---------- dado do troll ----------
// A cada tentativa o dado sorteia pegadinhas que nao estao no mapa da fase: espinho que cai do
// ceu, espinho que brota do chao, chao que some, controle invertido, pulo maluco, apagao.
// Cada uma acontece 1, 2 ou 3 vezes (tambem sorteado), num ponto ou num momento sorteado.
// As vezes o dado nao tira nada, e ai voce fica esperando a pegadinha que nao vem.
// ?sorte=0 desliga (o robo de teste usa pra fase ficar sempre igual).
const SORTE = new URLSearchParams(location.search).get('sorte') !== '0';
const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chance = pr => Math.random() < pr;

// Linha do chao (grid) na coluna c: o primeiro bloco solido com ar em cima
function chaoDaColuna(L, c) {
  if (c < 1 || c >= COLS - 1) return -1;
  for (let r = 2; r < LINHAS; r++) if (L.grid[r][c] && !L.grid[r - 1][c]) return r;
  return -1;
}

const TROLLS = {
  // Um espinho cai bem em cima da sua cabeca (com um "!" piscando antes pra dar tempo de fugir)
  ceu(L, col = null, aviso = 20) {
    const c = col ?? limitar(Math.floor(centroX() / T), 0, COLS - 1);
    som('risadinha');
    const marca = L.coisa({
      update() {
        if (--aviso > 0) return;
        L.coisas.splice(L.coisas.indexOf(marca), 1);
        const [e] = L.espinhos(c, -1, 1, 'baixo', { motivo: 'O DADO DO TROLL TE ACERTOU' });
        e.update = () => {
          e.y += 17;
          const r = Math.floor((e.y + T) / T);
          if (e.y > H || (r > 0 && r < LINHAS && L.grid[r][c] && e.y > 2 * T)) {
            L.perigos.splice(L.perigos.indexOf(e), 1);
            poof(e.x + 15, e.y + 20);
          }
        };
      },
      draw() {
        if (Math.floor(aviso / 4) % 2) return;
        texto('!', c * T + T / 2, 100, { tam: 40, cor: '#ff3b3b' });
        texto('▼', c * T + T / 2, 132, { tam: 20, cor: '#ff3b3b' });
        ctx.fillStyle = '#ff3b3b33';
        ctx.fillRect(c * T, 0, T, H);
      },
    });
    return true;
  },
  // Um espinho brota do chao logo na sua frente e depois some de novo
  brota(L) {
    const c = Math.floor(centroX() / T) + p.olhar * entre(2, 5);
    const r = chaoDaColuna(L, c);
    if (r < 0) return false;
    let t = 0;
    let espinho = null;
    const brotinho = L.coisa({
      update() {
        t++;
        if (t < 22) { if (t % 4 === 0) poeira(c * T + T / 2, r * T); return; }
        if (!espinho) {
          [espinho] = L.espinhos(c, r - 1, 1, 'cima', { escala: 0, motivo: 'BROTOU DO CHÃO (O DADO QUIS)' });
          som('espinho');
        }
        if (t > 22 + 140) {
          L.perigos.splice(L.perigos.indexOf(espinho), 1);
          L.coisas.splice(L.coisas.indexOf(brotinho), 1);
          poof(c * T + T / 2, r * T - 10);
        }
      },
      draw() {
        if (t >= 22) return;
        ctx.fillStyle = '#00000055';
        ctx.fillRect(c * T + 4, r * T - 3, T - 8, 3);
      },
    });
    return true;
  },
  // O pedaco de chao na sua frente treme, cai, e volta uns segundos depois
  buraco(L, col = null) {
    const c = col ?? Math.floor(centroX() / T) + p.olhar * entre(1, 3);
    const r = chaoDaColuna(L, c);
    if (r < 0) return false;
    let h = 0;
    while (r + h < LINHAS && L.grid[r + h][c]) h++;
    const b = L.bloco(c, r, 1, h, { comTopo: true });
    L.solido(c, r, 1, h, 0);
    let t = 0;
    som('crack');
    b.update = () => {
      t++;
      if (t < 12) { b.tremor = 1.5; return; }
      if (t === 12) { b.tremor = 0; b.solido = false; b.vy = 0; }
      if (t < 200) { b.vy += 0.6; b.y += b.vy; return; }
      // Volta pro lugar (se voce nao estiver no meio do caminho)
      const volta = { x: c * T, y: r * T, w: T, h: h * T };
      if (toca(volta, corpoJogador())) return;
      L.solido(c, r, 1, h, 1);
      L.blocos.splice(L.blocos.indexOf(b), 1);
      poof(c * T + T / 2, r * T);
    };
    return true;
  },
  inverte(L) {
    L.inverterDado = entre(90, 180);
    tremor = 5;
    som('glitch');
    return true;
  },
  // O proximo pulo sai gigante ou um pulinho de nada
  pulo(L) {
    if (L.def.puloInverte) return false;
    L.puloDado = chance(0.5) ? 1.45 : 0.5;
    return true;
  },
  // Varios espinhos do ceu em volta de voce, um atras do outro
  chuva(L) {
    const c0 = Math.floor(centroX() / T);
    const cols = [-2, -1, 0, 1, 2].map(d => c0 + d * (chance(0.5) ? 1 : -1)).filter(c => c >= 0 && c < COLS);
    cols.forEach((c, i) => L.depois(i * 0.12, () => TROLLS.ceu(L, c, 18)));
    return true;
  },
  // Chao some em 2 ou 3 colunas seguidas na sua frente
  cratera(L) {
    const c0 = Math.floor(centroX() / T) + p.olhar * entre(1, 2);
    let ok = false;
    for (let i = 0; i < entre(2, 3); i++) ok = TROLLS.buraco(L, c0 + i * p.olhar) || ok;
    return ok;
  },
  // Um vento te empurra pra um lado
  vento(L) {
    const dir = chance(0.5) ? 1 : -1;
    let t = entre(50, 100);
    som('glitch');
    const v = L.coisa({
      update() {
        if (estado === 'jogando') p.empurrao = (p.empurrao || 0) + dir * 0.4;
        if (--t <= 0) L.coisas.splice(L.coisas.indexOf(v), 1);
        if (t % 4 === 0) particula(dir > 0 ? 0 : W, Math.random() * H, dir * 14, 0, '#ffffff66', 50, 3, 0);
      },
    });
    return true;
  },
  // A porta (se for uma porta comum) muda de lugar
  porta(L) {
    const d = L.portas[0];
    if (!d || d.update || d.aoTocar || !d.saida) return false;
    const rPorta = Math.round((d.y + 45) / T);
    const opcoes = [];
    for (let c = 2; c < COLS - 1; c++) {
      if (chaoDaColuna(L, c) === rPorta && Math.abs(c * T - d.x) > 4 * T && Math.abs(c * T - centroX()) > 3 * T) opcoes.push(c);
    }
    if (!opcoes.length) return false;
    poof(d.x + 15, d.y + 20);
    d.x = sortear(opcoes) * T;
    poof(d.x + 15, d.y + 20);
    som('risada');
    dizer(sortear(['A PORTA SE MUDOU', 'ENDEREÇO NOVO', 'ERA AQUI, AGORA É ALI']), 50);
    return true;
  },
  // Um bicho fantasma aparece na borda e te persegue atravessando tudo
  perseguidor(L) {
    const daEsquerda = centroX() > W / 2;
    const vel = 1.9 + L.def.mundo * 0.14 + Math.random() * 0.6;
    let vida = entre(300, 480);
    const e = {
      x: daEsquerda ? -30 : W + 4, y: limitar(p.y - 40 + Math.random() * 80, 2 * T, 15 * T), w: 26, h: 24,
      vx: 0, vy: 0, tipo: 'bicho', cor: sortear(['#ff3b6b', '#7a4cff', '#22c55e']), espinhudo: chance(0.5),
      ativo: true, visivel: true, motivo: sortear(['O BICHO TE PEGOU', 'COMIDO VIVO', 'ELE TE ACHOU']),
      update() {
        const dx = centroX() - (e.x + e.w / 2), dy = p.y + p.h / 2 - (e.y + e.h / 2);
        const d = Math.hypot(dx, dy) || 1;
        e.vx = dx / d * vel;
        e.y += dy / d * vel;
        e.x += e.vx;
        if (--vida <= 0) { L.perigos.splice(L.perigos.indexOf(e), 1); poof(e.x + 13, e.y + 12); }
      },
    };
    L.perigos.push(e);
    som('risada');
    dizer(sortear(['TEM ALGO ATRÁS DE VOCÊ', 'CORRE!', 'ELE TÁ COM FOME']), 45);
    return true;
  },
  // Balas muito rapidas vindo da borda na altura da sua cabeca (com um risco vermelho antes)
  bala(L) {
    const n = entre(1, 3);
    for (let i = 0; i < n; i++) {
      L.depois(i * 0.35, () => {
        if (estado !== 'jogando') return;
        const daEsquerda = chance(0.5);
        const y = p.y + p.h / 2 - 6;
        let aviso = 18;
        const risco = L.coisa({
          update() {
            if (--aviso > 0) return;
            L.coisas.splice(L.coisas.indexOf(risco), 1);
            const v = 13 + Math.random() * 6;
            projetil(L, daEsquerda ? -30 : W + 10, y, daEsquerda ? v : -v, 0, { w: 20, h: 12, motivo: sortear(['BALA PERDIDA (EM VOCÊ)', 'NEM VIU DE ONDE VEIO', 'HEADSHOT']) });
            som('tiro');
          },
          draw() {
            ctx.fillStyle = Math.floor(aviso / 3) % 2 ? '#ff2a4acc' : '#ff2a4a44';
            ctx.fillRect(daEsquerda ? 0 : W - 40, y + 4, 40, 4);
          },
        });
      });
    }
    return true;
  },
  // O chao vira sabao por uns segundos
  gelo(L) {
    mudarFisica(L, { freio: 0.985, acel: 0.14 }, entre(150, 260));
    som('glitch');
    return true;
  },
  // Gravidade de lua ou de chumbo
  gravidade(L) {
    const lua = chance(0.5);
    mudarFisica(L, { grav: L.fisBase.grav * (lua ? 0.45 : 1.55) }, entre(120, 220));
    dizer(lua ? 'GRAVIDADE DE LUA' : 'VOCÊ ENGORDOU', 40);
    return true;
  },
  // Te joga uns blocos pra tras
  teleporte(L) {
    const dx = -p.olhar * entre(3, 7) * T;
    const alvo = { x: limitar(p.x + dx, 2, W - p.w - 2), y: p.y, w: p.w, h: p.h };
    if (solidosEm(alvo).length) return false;
    poof(centroX(), p.y + 13);
    p.x = alvo.x;
    poof(centroX(), p.y + 13);
    som('virar');
    dizer(sortear(['VOLTA AQUI', 'ESQUECEU ALGO?', 'DE NOVO, DO COMEÇO (QUASE)']), 40);
    return true;
  },
  apagao(L) {
    L.apagao = entre(40, 75);
    som('raio');
    return true;
  },
};

// Troca um pedaco da fisica por um tempo e depois volta ao normal
function mudarFisica(L, mudanca, frames) {
  L.fis = { ...L.fisBase, ...mudanca };
  L.fisAte = L.t + frames;
}

function dadoDoTroll(L) {
  L.fisBase = { ...L.fis };
  L.coisa({ update() { if (L.fisAte && L.t >= L.fisAte) { L.fis = { ...L.fisBase }; L.fisAte = 0; } } });
  const m = L.def.mundo;
  // 76% das tentativas tem pegadinha; nas outras 24% voce fica com medo a toa
  if (chance(0.24)) return;
  const max = faseAtual === 0 ? 2 : m < 2 ? 4 : m < 5 ? 6 : Object.keys(TROLLS).length;
  const tipos = Object.keys(TROLLS).sort(() => Math.random() - 0.5).slice(0, entre(1, max));

  const inicio = Math.floor(L.inicioPos.x / T);
  const porta = L.portas[0] ? Math.floor(L.portas[0].x / T) : COLS - 2;
  const de = Math.min(inicio, porta) + 3, ate = Math.max(inicio, porta) - 2;

  const antes = L.aoPular;
  L.aoPular = () => {
    if (L.puloDado) { p.vy *= L.puloDado; som(L.puloDado > 1 ? 'mola' : 'risadinha'); L.puloDado = 0; }
    antes?.();
  };

  // Fora as marcadas, de tempos em tempos o dado rola de novo e repete uma delas (a fase toda)
  const intervalo = () => entre(Math.max(90, 260 - m * 18), Math.max(200, 480 - m * 25));
  let proxima = intervalo();
  L.coisa({
    update() {
      if (estado !== 'jogando' || L.t < 60 || --proxima > 0) return;
      proxima = TROLLS[sortear(tipos)](L) ? intervalo() : 20;
    },
  });

  for (const tipo of tipos) {
    const vezes = tipo === 'porta' ? entre(2, 5) : entre(2, m < 3 ? 4 : 6);
    for (let i = 0; i < vezes; i++) {
      const disparar = () => {
        if (estado !== 'jogando' || L.t < 40) return false;
        return TROLLS[tipo](L);
      };
      if (ate > de && chance(0.55)) {
        // Num ponto sorteado do caminho: dispara quando voce passa por ali
        const cx = entre(de, ate) * T + T / 2;
        let lado = null;
        const ponto = L.coisa({
          update() {
            const agora = Math.sign(centroX() - cx);
            if (lado === null) { lado = agora; return; }
            if (agora && agora !== lado && disparar()) L.coisas.splice(L.coisas.indexOf(ponto), 1);
            if (agora) lado = agora;
          },
        });
      } else {
        // Num momento sorteado (se nao der na hora, tenta de novo um pouco depois)
        const tentar = () => { if (!disparar()) L.depois(0.7, tentar); };
        L.depois(1 + Math.random() * 8, tentar);
      }
    }
  }
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

// Botao de pressao no chao (dispara uma vez)
function botao(L, c, rChao, aoApertar, { rotulo = '', cor = '#ff3b3b', largura = 2, piscar = null } = {}) {
  const b = L.coisa({
    x: c * T + 3, y: rChao * T - 8, w: T * largura - 6, h: 8, apertado: false,
    update() {
      const pisou = p.noChao && toca({ x: b.x, y: b.y - 2, w: b.w, h: b.h + 2 }, corpoJogador());
      if (pisou && !b.apertado) {
        b.apertado = true;
        som('clique');
        aoApertar(b);
      }
    },
    draw() {
      ctx.fillStyle = '#333';
      ctx.fillRect(b.x - 3, b.y + 4, b.w + 6, 4);
      ctx.fillStyle = piscar?.() ? '#ffffff' : cor;
      const alt = b.apertado ? 3 : 8;
      ctx.fillRect(b.x, b.y + 8 - alt, b.w, alt);
      if (rotulo) texto(rotulo, limitar(b.x + b.w / 2, 28, W - 28), b.y - 22, { tam: largura < 2 ? 13 : 15 });
    },
  });
  return b;
}

// Plataforma que vai e volta (dx/dy em blocos, vel em px por quadro)
function plataforma(L, c, r, w, { dx = 0, dy = 0, vel = 1.5, fase = 0, ...extra } = {}) {
  const b = L.bloco(c, r, w, 1, { plataforma: true, ...extra });
  const x0 = b.x, y0 = b.y;
  const dist = Math.hypot(dx, dy) * T;
  let t = fase * dist;
  b.update = () => {
    if (b.parada) return;
    t += vel;
    const k = dist ? (1 - Math.cos((t / dist) * Math.PI)) / 2 : 0;
    b.x = x0 + dx * T * k;
    b.y = y0 + dy * T * k;
  };
  return b;
}

function mola(L, c, rChao, forca = 15, extra = {}) {
  return L.bloco(c, rChao, 1, 1, { y: rChao * T - 12, h: 12, mola: forca, desenho: 'mola', ...extra });
}

function esteira(L, c0, c1, r, vel) {
  L.solido(c0, r, c1 - c0 + 1, 1, 0);
  return L.bloco(c0, r, c1 - c0 + 1, 1, { esteira: vel, desenho: 'esteira' });
}

// Raio laser que liga e desliga (em quadros). Vertical por padrao: coluna c, linhas r0..r1.
function laser(L, c, r0, r1, { ligado = 60, desligado = 60, fase = 0, motivo = 'FRITO NO LASER' } = {}) {
  const e = {
    x: c * T + 11, y: r0 * T, w: 8, h: (r1 - r0 + 1) * T, tipo: 'laser', ativo: false, visivel: true, motivo,
    update() {
      if (e.fixo !== undefined) { e.ativo = e.fixo; return; }
      const ciclo = (L.t + fase) % (ligado + desligado);
      const antes = e.ativo;
      e.ativo = ciclo < ligado;
      e.aviso = !e.ativo && ciclo > ligado + desligado - 25;
      if (e.ativo && !antes) som('laser');
    },
  };
  L.perigos.push(e);
  return e;
}

function projetil(L, x, y, vx, vy, extra = {}) {
  const e = {
    x, y, w: 22, h: 22, vx, vy, tipo: 'bala', ativo: true, visivel: true, grav: 0, motivo: 'ACERTADO EM CHEIO', ...extra,
    update() {
      e.vy += e.grav;
      e.x += e.vx;
      e.y += e.vy;
      const fora = e.x < -60 || e.x > W + 60 || e.y > H + 60 || e.y < -300;
      const bateu = !e.atravessa && solidosEm({ x: e.x + 4, y: e.y + 4, w: e.w - 8, h: e.h - 8 }).length;
      if (fora || bateu) {
        if (bateu) poof(e.x + e.w / 2, e.y + e.h / 2);
        L.perigos.splice(L.perigos.indexOf(e), 1);
      }
    },
  };
  L.perigos.push(e);
  return e;
}

function canhao(L, c, r, dir, { periodo = 90, vel = 4, fase = 0, desenhoBala = 'bala', grav = 0, vy = 0 } = {}) {
  return L.coisa({
    update() {
      if ((L.t + fase) % periodo === 0) {
        projetil(L, c * T + 4 + dir * 20, r * T + 4, dir * vel, vy, { desenhoBala, grav });
        som('tiro');
      }
    },
    draw() {
      ctx.fillStyle = '#333a44';
      ctx.fillRect(c * T, r * T + 4, T, T - 4);
      ctx.fillStyle = '#1b1f26';
      ctx.fillRect(dir > 0 ? c * T + 20 : c * T - 8, r * T + 9, 18, 14);
    },
  });
}

// Bicho que patrulha entre as colunas c0 e c1 (mata ao encostar)
function bicho(L, c0, c1, rChao, { vel = 1.5, cor = '#7a4cff', motivo = 'ATROPELADO POR UM BICHO', w = 26, h = 24, ...extra } = {}) {
  const e = {
    x: c0 * T, y: rChao * T - h, w, h, vx: vel, tipo: 'bicho', cor, ativo: true, visivel: true, motivo, vy: 0, chaoY: rChao * T - h, ...extra,
    update() {
      e.x += e.vx;
      if (e.x < c0 * T) { e.x = c0 * T; e.vx = Math.abs(e.vx); }
      if (e.x > c1 * T + T - e.w) { e.x = c1 * T + T - e.w; e.vx = -Math.abs(e.vx); }
      // Pula junto com voce (com um atrasinho, se tiver)
      if (e.pulaComVoce && p.cmd?.apertou && e.pularEm === undefined) e.pularEm = L.t + (e.atrasoPulo || 0);
      if (e.pularEm !== undefined && L.t >= e.pularEm) {
        if (e.y >= e.chaoY) e.vy = -9;
        e.pularEm = undefined;
      }
      if (e.y < e.chaoY || e.vy < 0) {
        e.vy += 0.55;
        e.y = Math.min(e.chaoY, e.y + e.vy);
        if (e.y >= e.chaoY) e.vy = 0;
      }
    },
  };
  L.perigos.push(e);
  return e;
}

// Chama fn a cada quadro em que o jogador estiver dentro da area (em blocos)
function zona(L, c, r, w, h, fn) {
  const z = { x: c * T, y: r * T, w: w * T, h: h * T };
  return L.coisa({ update() { if (toca(z, corpoJogador())) fn(z); } });
}

function moeda(L, c, rChao, aoPegar, { alta = false, cor = '#ffd23f' } = {}) {
  const m = L.coisa({
    x: c * T + 4, y: alta ? (rChao - 2) * T : rChao * T - 26, w: 22, h: alta ? 2 * T : 26, pega: false,
    update() {
      if (!m.pega && toca(m, corpoJogador())) {
        m.pega = true;
        som('moeda');
        aoPegar(m);
      }
    },
    draw() {
      if (m.pega) return;
      const larg = Math.abs(Math.cos(quadro / 10)) * 10 + 2;
      ctx.fillStyle = cor;
      ctx.beginPath();
      ctx.ellipse(m.x + 11, rChao * T - 14, larg, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00000055';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
  });
  return m;
}

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

function desenharFundo(m, semente = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, m.ceu[0]);
  g.addColorStop(1, m.ceu[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // A semente muda com a tentativa: o cenario muda sutilmente a cada morte
  const s = semente * 97;
  switch (m.deco) {
    case 'nuvem':
    case 'ceu':
      ctx.fillStyle = m.deco === 'ceu' ? '#ffffffee' : '#ffffffcc';
      for (let i = 0; i < 5; i++) {
        const x = ((i * 230 + s + quadro * (0.2 + i * 0.05)) % (W + 160)) - 80;
        const y = 60 + ((i + semente) % 3) * 55;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.arc(x + 25, y - 10, 28, 0, Math.PI * 2);
        ctx.arc(x + 52, y, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'cristal':
      for (let i = 0; i < 26; i++) {
        const x = (i * 137 + s) % W, y = (i * 89) % (H - 100);
        ctx.fillStyle = `rgba(180,160,255,${0.15 + 0.15 * Math.sin(quadro / 30 + i)})`;
        ctx.fillRect(x, y, 3, 3);
      }
      break;
    case 'brasa':
      for (let i = 0; i < 18; i++) {
        const x = (i * 173 + s + Math.sin(quadro / 40 + i) * 20) % W;
        const y = H - ((quadro * (0.6 + (i % 4) * 0.2) + i * 61) % H);
        ctx.fillStyle = `rgba(255,${120 + (i % 3) * 40},60,0.5)`;
        ctx.fillRect(x, y, 3, 3);
      }
      break;
    case 'sol':
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.arc(780 - (s % 200), 110, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f0c27a88';
      ctx.beginPath();
      ctx.moveTo(0, 380);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 360 + Math.sin(x / 90 + semente) * 25);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.fill();
      break;
    case 'neve':
      ctx.fillStyle = '#ffffffcc';
      for (let i = 0; i < 40; i++) {
        const x = (i * 97 + s + Math.sin(quadro / 50 + i) * 15) % W;
        const y = (quadro * (0.5 + (i % 5) * 0.15) + i * 53) % H;
        ctx.fillRect(x, y, 3, 3);
      }
      break;
    case 'engrenagem':
      for (let i = 0; i < 4; i++) {
        const x = 140 + i * 230 + (s % 50), y = 120 + (i % 2) * 140;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((quadro / 120) * (i % 2 ? 1 : -1));
        ctx.strokeStyle = '#ffffff14';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff14';
        for (let k = 0; k < 8; k++) {
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(48, -8, 22, 16);
        }
        ctx.restore();
      }
      break;
    case 'estrela':
      for (let i = 0; i < 70; i++) {
        const x = (i * 151 + s) % W, y = (i * 67) % H;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(quadro / 40 + i))})`;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.fillStyle = '#c7a8ff55';
      ctx.beginPath();
      ctx.arc(160 + (s % 80), 120, 38, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'glitch':
      ctx.font = '700 14px monospace';
      ctx.textAlign = 'left';
      for (let i = 0; i < 30; i++) {
        const x = (i * 131 + s) % W;
        const y = (quadro * 2 + i * 71) % H;
        ctx.fillStyle = `rgba(57,255,136,${0.15 + (i % 3) * 0.08})`;
        ctx.fillText(String.fromCharCode(0x30a0 + ((i * 7 + Math.floor(quadro / 8)) % 90)), x, y);
      }
      break;
    case 'vazio':
      ctx.strokeStyle = '#00000010';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += T) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += T) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      break;
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
    ctx.fillRect(x, y, w, Math.min(7, h));
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
  // A cor da madeira muda um pouquinho a cada tentativa
  const tons = ['#9a5f2e', '#94592b', '#a06433', '#8f5528'];
  ctx.fillStyle = d.cor || tons[(L?.tentativa || 1) % tons.length];
  ctx.fillRect(0, 0, d.w, d.h);
  ctx.fillStyle = '#00000033';
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
  if (d.rotulo) texto(d.rotulo, d.x + d.w / 2, d.y - 14, { tam: d.tamRotulo || 18 });
}

function desenharEsmagador(b) {
  ctx.fillStyle = '#5a5a6a';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = '#3d3d4a';
  ctx.fillRect(b.x, b.y + b.h - 10, b.w, 10);
  ctx.fillStyle = '#c8c8d8';
  for (let i = 0; i < b.w / 15; i++) {
    ctx.beginPath();
    ctx.moveTo(b.x + i * 15, b.y + b.h);
    ctx.lineTo(b.x + i * 15 + 7.5, b.y + b.h + 8);
    ctx.lineTo(b.x + i * 15 + 15, b.y + b.h);
    ctx.fill();
  }
  const olhaX = limitar((p.x - b.x) / 40, -3, 3);
  const cx = b.x + b.w / 2;
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx - 20, b.y + b.h - 50, 14, 12);
  ctx.fillRect(cx + 6, b.y + b.h - 50, 14, 12);
  ctx.fillStyle = '#111';
  ctx.fillRect(cx - 15 + olhaX, b.y + b.h - 46, 5, 5);
  ctx.fillRect(cx + 11 + olhaX, b.y + b.h - 46, 5, 5);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 22, b.y + b.h - 56); ctx.lineTo(cx - 4, b.y + b.h - 50);
  ctx.moveTo(cx + 22, b.y + b.h - 56); ctx.lineTo(cx + 4, b.y + b.h - 50);
  ctx.stroke();
}

function desenharMola(b) {
  const a = b.apertada ? 6 : 12;
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 4; i++) ctx.lineTo(b.x + (i % 2 ? 8 : b.w - 8), b.y + b.h - (i / 4) * a);
  ctx.stroke();
  ctx.fillStyle = '#ff4d4d';
  ctx.fillRect(b.x, b.y + b.h - a - 3, b.w, 5);
}

function desenharEsteira(b) {
  ctx.fillStyle = '#2b2f36';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = '#f2c230';
  const vel = typeof b.esteira === 'function' ? (b.ultimaVel || 0) : b.esteira;
  const desloc = ((quadro * vel) % 20 + 20) % 20;
  for (let x = b.x - 20 + desloc; x < b.x + b.w - 8; x += 20) {
    if (x >= b.x) ctx.fillRect(x, b.y + 3, 8, 4);
  }
  ctx.fillStyle = '#444b55';
  ctx.fillRect(b.x, b.y + b.h - 8, b.w, 8);
}

function desenharNuvem(x, y, w, h, cor = '#ffffff') {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.roundRect(x, y + 6, w, h - 6, 12);
  ctx.fill();
  for (let i = 0; i < w / 22; i++) {
    ctx.beginPath();
    ctx.arc(x + 12 + i * 22, y + 10, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}

function desenharBlocos() {
  for (const b of L.blocos) {
    if (!b.visivel) continue;
    const tx = b.tremor ? (Math.random() - 0.5) * b.tremor * 2 : 0;
    if (b.desenhar) b.desenhar(b, tx);
    else if (b.desenho === 'porta') desenharPorta({ ...b, x: b.x + tx });
    else if (b.desenho === 'esmagador') desenharEsmagador({ ...b, x: b.x + tx });
    else if (b.desenho === 'banner') desenharBanner(b.x + tx, b.y);
    else if (b.desenho === 'mola') desenharMola(b);
    else if (b.desenho === 'esteira') desenharEsteira(b);
    else if (b.desenho === 'nuvem') desenharNuvem(b.x + tx, b.y, b.w, b.h, b.cor);
    else desenharBloco(b.x + tx, b.y, b.w, b.h, b.mundo || L.mundo, b.comTopo ?? true);
  }
}

function desenharEspinho(e) {
  const m = L.mundo;
  const s = e.escala;
  ctx.fillStyle = e.cor || m.espinho;
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
  ctx.fillStyle = e.cor || '#ff7eb6';
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

function desenharLaser(e) {
  if (e.ativo) {
    ctx.fillStyle = '#ff2a4a';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = '#ffd0d8';
    ctx.fillRect(e.x + 3, e.y, 2, e.h);
  } else {
    ctx.fillStyle = e.aviso ? '#ff2a4a88' : '#ff2a4a22';
    ctx.fillRect(e.x + 3, e.y, 2, e.h);
  }
  ctx.fillStyle = '#555';
  ctx.fillRect(e.x - 6, e.y - 4, 20, 8);
  ctx.fillRect(e.x - 6, e.y + e.h - 4, 20, 8);
}

function desenharBicho(e) {
  ctx.fillStyle = e.cor;
  ctx.beginPath();
  ctx.roundRect(e.x, e.y, e.w, e.h, 8);
  ctx.fill();
  const olhar = Math.sign(e.vx || 1) * 3;
  ctx.fillStyle = '#fff';
  ctx.fillRect(e.x + e.w / 2 - 8 + olhar, e.y + 5, 6, 7);
  ctx.fillRect(e.x + e.w / 2 + 2 + olhar, e.y + 5, 6, 7);
  ctx.fillStyle = '#111';
  ctx.fillRect(e.x + e.w / 2 - 6 + olhar, e.y + 8, 3, 3);
  ctx.fillRect(e.x + e.w / 2 + 4 + olhar, e.y + 8, 3, 3);
  if (e.espinhudo) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < e.w / 8; i++) {
      ctx.beginPath();
      ctx.moveTo(e.x + i * 8, e.y + 2);
      ctx.lineTo(e.x + i * 8 + 4, e.y - 7);
      ctx.lineTo(e.x + i * 8 + 8, e.y + 2);
      ctx.fill();
    }
  }
}

function desenharBala(e) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  if (e.desenhoBala === 'neve') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, e.w / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (e.desenhoBala === 'meteoro') {
    ctx.fillStyle = '#ffd23f88';
    ctx.beginPath();
    ctx.arc(cx - e.vx * 3, cy - e.vy * 3, e.w / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8a3d';
    ctx.beginPath();
    ctx.arc(cx, cy, e.w / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath();
  ctx.arc(cx, cy, e.w / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ddd';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + quadro / 5;
    ctx.fillRect(cx + Math.cos(a) * (e.w / 2) - 2, cy + Math.sin(a) * (e.h / 2) - 2, 4, 4);
  }
}

function desenharPerigos() {
  for (const e of L.perigos) {
    if (!e.visivel) continue;
    if (e.desenhar) e.desenhar(e);
    else if (e.tipo === 'flor') desenharFlor(e);
    else if (e.tipo === 'espinho') desenharEspinho(e);
    else if (e.tipo === 'laser') desenharLaser(e);
    else if (e.tipo === 'bicho') desenharBicho(e);
    else if (e.tipo === 'bala') desenharBala(e);
  }
}

function desenharJogador() {
  if (estado === 'morto' || !p || p.invisivel) return;
  ctx.save();
  ctx.translate(p.x + p.w / 2, p.grav > 0 ? p.y + p.h : p.y);
  ctx.scale(p.escX, p.escY * p.grav);
  const w = p.w, h = p.h;
  ctx.fillStyle = '#2b1a0a';
  ctx.beginPath();
  ctx.roundRect(-w / 2 - 2, -h - 2, w + 4, h + 4, 6);
  ctx.fill();
  ctx.fillStyle = p.cor || COR_JOGADOR;
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
  for (const pl of L.placas) {
    if (pl.visivel) texto(pl.txt, pl.x, pl.y, { tam: pl.tam || 18, cor: pl.cor || '#fff', contorno: '#000000aa' });
  }
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
  const t = `FASE ${n}/100 · ${FASES[faseAtual].nome.toUpperCase()}`;
  return L.tituloAoContrario ? [...t].reverse().join('') : t;
}

function desenharBanner(x, y) {
  ctx.fillStyle = '#000000aa';
  ctx.beginPath();
  ctx.roundRect(x, y, 380, 34, 8);
  ctx.fill();
  const t = tituloDaFase();
  texto(t, x + 190, y + 18, { tam: t.length > 40 ? 12 : 14, contorno: null });
}

function desenharPaciencia(xDir, y) {
  const v = salvo.paciencia;
  const h = humorDaPaciencia(v);
  const x = xDir - 200;
  ctx.fillStyle = '#000000aa';
  ctx.beginPath();
  ctx.roundRect(x, y, 200, 40, 8);
  ctx.fill();
  texto(`🧠 PACIÊNCIA ${v}%`, x + 9, y + 12, { tam: 12, alinhar: 'left', contorno: null });
  texto(h.txt, xDir - 9, y + 12, { tam: 10, alinhar: 'right', cor: h.cor, contorno: null });
  ctx.fillStyle = '#ffffff22';
  ctx.fillRect(x + 9, y + 25, 182, 7);
  ctx.fillStyle = h.cor;
  ctx.fillRect(x + 9, y + 25, 182 * (v / 100), 7);
}

function desenharHud() {
  if (!L.hudCaiu) desenharCaixaMortes(12, 10);
  if (!L.tituloCaiu) desenharBanner(W / 2 - 190, 8);
  desenharPaciencia(W - 12, 8);
  texto(`TENTATIVA ${tentativa}`, W - 16, 62, { tam: 13, alinhar: 'right', contorno: '#00000099' });
  if ((L.inverter && !L.semAvisoInversao) || L.inverterDado > 0) texto('🙃 CONTROLES INVERTIDOS', W - 16, 82, { tam: 13, alinhar: 'right', cor: '#ffd23f', contorno: '#000' });
  L.desenharHudExtra?.();
}

function desenharPiada() {
  if (!piada) return;
  const a = Math.min(1, piada.t / 15);
  ctx.globalAlpha = a;
  const pulo = Math.max(0, (piada.t - 65) / 15);
  texto(piada.txt, W / 2, 110 - pulo * 10, { tam: 34 + pulo * 8, cor: '#ffe14d', contorno: '#000' });
  if (piada.sub) texto(piada.sub, W / 2, 150, { tam: 18, cor: '#ffffff', contorno: '#000' });
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
  texto(`${String(faseAtual + 1).padStart(2, '0')}/100 — ${def.nome.toUpperCase()}`, W / 2, H / 2 + 16, { tam: 34 });
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
  if (Math.random() > 0.5) texto(L.textoGlitch || 'ERRO 404: FASE NÃO ENCONTRADA', W / 2, H / 2, { tam: 30, cor: '#ff3b6b' });
}

// Fase no escuro: so um circulo de luz em volta do jogador (e relampagos de vez em quando)
function desenharEscuro() {
  const e = L.escuro;
  if (!e) return;
  if (e.relampago && L.t % e.relampago < 12) return;
  ctxSombra.globalCompositeOperation = 'source-over';
  ctxSombra.fillStyle = '#05040a';
  ctxSombra.fillRect(0, 0, W, H);
  ctxSombra.globalCompositeOperation = 'destination-out';
  const furo = (x, y, r) => {
    const g = ctxSombra.createRadialGradient(x, y, r * 0.5, x, y, r);
    g.addColorStop(0, '#000');
    g.addColorStop(1, '#0000');
    ctxSombra.fillStyle = g;
    ctxSombra.beginPath();
    ctxSombra.arc(x, y, r, 0, Math.PI * 2);
    ctxSombra.fill();
  };
  if (estado !== 'morto') furo(p.x + p.w / 2, p.y + p.h / 2, e.raio);
  for (const luz of e.luzes || []) furo(luz.x, luz.y, luz.r);
  ctx.drawImage(sombraCanvas, 0, 0);
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
  desenharFundo(MUNDOS[Math.floor(quadro / 300) % MUNDOS.length]);
  ctx.fillStyle = '#00000077';
  ctx.fillRect(0, 0, W, H);
  const balanco = Math.sin(quadro / 20) * 0.05;
  ctx.save();
  ctx.translate(W / 2, 140);
  ctx.rotate(balanco);
  texto('NÃO CONFIA', 0, 0, { tam: 92, cor: '#ffd23f', contorno: '#2b1a0a' });
  ctx.restore();
  texto('100 fases onde tudo mente pra você', W / 2, 212, { tam: 22, cor: '#fff', contorno: '#000' });
  if (Math.floor(quadro / 30) % 2) {
    texto(salvo.fase > 0 ? `${TOQUE ? 'TOQUE' : 'ESPAÇO'}: CONTINUAR (FASE ${salvo.fase + 1}/100)` : (TOQUE ? 'TOQUE PRA JOGAR' : 'APERTE ESPAÇO PRA JOGAR'), W / 2, 286, { tam: 28 });
  }
  if (salvo.fase > 0 && !TOQUE) texto('N: COMEÇAR DO ZERO', W / 2, 326, { tam: 17, cor: '#ccc' });
  const liberados = Math.min(MUNDOS.length, Math.floor(salvo.max / FASES_POR_MUNDO) + 1);
  if (liberados > 1) {
    if (!TOQUE) texto(`TECLAS 1 A ${liberados === 10 ? '9 E 0' : liberados}: ESCOLHER MUNDO`, W / 2, 362, { tam: 15, cor: '#bfe3ff' });
    for (let i = 0; i < MUNDOS.length; i++) {
      const x = W / 2 - 225 + i * 50, y = 394;
      ctx.fillStyle = i < liberados ? MUNDOS[i].topo : '#333';
      ctx.fillRect(x - 18, y - 12, 36, 24);
      texto(i < liberados ? String((i + 1) % 10) : '?', x, y + 1, { tam: 14, cor: i < liberados ? '#000' : '#888', contorno: null });
    }
  }
  const h = humorDaPaciencia(salvo.paciencia);
  texto(`☠ Mortes: ${salvo.mortes}   ·   🧠 Paciência: ${salvo.paciencia}% (${h.txt})`, W / 2, 440, { tam: 17, cor: '#ffb3b3' });
  texto(TOQUE ? '◀ ▶ andar · PULA pular (segure pra pular mais alto)' : '← → andar · ESPAÇO pular · R reiniciar · ESC pausa · M som', W / 2, 505, { tam: 15, cor: '#ddd', contorno: '#000' });
  const x = (quadro * 3) % (W + 40) - 20;
  ctx.fillStyle = COR_JOGADOR;
  ctx.fillRect(x, 470 - Math.abs(Math.sin(quadro / 8)) * 20, 20, 26);
}

function desenharFim() {
  desenharFundo(MUNDOS[9]);
  ctx.fillStyle = '#000000aa';
  ctx.fillRect(0, 0, W, H);
  texto('VOCÊ ZEROU AS 100 FASES!', W / 2, 130, { tam: 54, cor: '#ffd23f' });
  texto('(e a gente nem acreditava em você)', W / 2, 190, { tam: 22 });
  const m = salvo.mortes;
  const titulo = m < 300 ? 'LENDA' : m < 800 ? 'TEIMOSO' : m < 1500 ? 'PERSISTENTE' : 'MASOQUISTA OFICIAL';
  texto(`☠ ${m} mortes`, W / 2, 270, { tam: 40, cor: '#ffb3b3' });
  texto(`Título: ${titulo}`, W / 2, 320, { tam: 28 });
  texto(`🧠 Paciência que sobrou: ${salvo.paciencia}%`, W / 2, 360, { tam: 20 });
  const t = Math.min(quadro % 400, 120);
  const y = 380 + Math.abs(Math.cos(t / 12)) * Math.max(0, 60 - t / 2) * -1;
  texto('FIM', W / 2, y + 50, { tam: 40, cor: '#fff' });
  if (Math.floor(quadro / 30) % 2) texto(TOQUE ? 'TOQUE: JOGAR DE NOVO' : 'ESPAÇO: JOGAR DE NOVO', W / 2, 505, { tam: 20 });
}

function desenharMundo() {
  desenharFundo(L.mundo, L.tentativa);
  // "Erro de colisao": o cenario aparece deslocado, mas o jogador nao
  ctx.save();
  if (L.deslocamento) ctx.translate(L.deslocamento, 0);
  desenharGrid();
  desenharPlacas();
  desenharBlocos();
  for (const d of L.portas) desenharPorta(d);
  desenharPerigos();
  for (const c of L.coisas) c.draw?.(c);
  ctx.restore();
  desenharJogador();
  desenharParticulas();
  L.desenharAcima?.();
  if (L.apagao > 0) {
    ctx.fillStyle = `rgba(5,4,10,${Math.min(1, L.apagao / 8)})`;
    ctx.fillRect(0, 0, W, H);
    L.apagao--;
  }
}

function desenhar() {
  if (trollAtivo()) return desenharTroll();
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
    // Algumas fases mostram o mundo espelhado ou de cabeca pra baixo (so o desenho muda)
    ctx.save();
    if (L.visual === 'espelho') { ctx.translate(W, 0); ctx.scale(-1, 1); }
    if (L.visual === 'cabeca') { ctx.translate(0, H); ctx.scale(1, -1); }
    desenharMundo();
    ctx.restore();
    desenharEscuro();
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

// ---------- o troll da paciencia ----------
// Paciencia chegou a zero: aparece um troll gigante gritando com voce por 5 minutos.
// O fim fica salvo, entao recarregar a pagina nao adianta. So o M (som) funciona.
const TROLL_MS = 5 * 60 * 1000;
const XINGAMENTOS = [
  'RUIM!', 'LIXO!', 'DESISTE!', 'VOCÊ É UMA VERGONHA!', 'SEU HORRÍVEL!', 'PERDEDOR!',
  'QUE VERGONHA!', 'NEM TENTA MAIS!', 'VOCÊ É MUITO RUIM!', 'DESINSTALA!', 'PATÉTICO!', 'HORRÍVEL! HORRÍVEL!',
];
let trollNaTela = false;
let trollFala = 0;
let trollFrase = XINGAMENTOS[0];
const trollAtivo = () => SORTE && salvo.trollAte > Date.now();

function chamarTroll() {
  salvo.trollAte = Date.now() + TROLL_MS;
  trollFala = 0;
}

function gritar(frase) {
  if (mudo) return;
  // Grito sintetizado bem alto + a voz do navegador xingando
  tom(260, 0.7, { tipo: 'sawtooth', vol: 0.4, ate: 900 });
  tom(180, 0.7, { tipo: 'square', vol: 0.3, ate: 620, atraso: 0.05 });
  ruido(0.6, 0.35);
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(frase);
    u.lang = 'pt-BR';
    u.volume = 1;
    u.rate = 1.15;
    u.pitch = 0.4;
    speechSynthesis.speak(u);
  } catch { /* navegador sem voz */ }
}

function atualizarTroll() {
  if (!trollNaTela) {
    trollNaTela = true;
    teclas.esq = teclas.dir = teclas.pulo = false;
    piada = null;
  }
  if (--trollFala <= 0) {
    let f;
    do f = sortear(XINGAMENTOS); while (f === trollFrase);
    trollFrase = f;
    trollFala = 150;
    tremor = 25;
    gritar(f);
  }
  if (trollFala % 20 === 0) tom(90 + Math.random() * 60, 0.15, { tipo: 'sawtooth', vol: 0.2 });
  atualizarParticulas();
}

function sairTroll() {
  trollNaTela = false;
  try { speechSynthesis.cancel(); } catch { /* sem voz */ }
  salvo.trollAte = 0;
  salvo.paciencia = 30;
  gravar();
  dizer('O TROLL CANSOU DE VOCÊ', 90, 'Paciência: 30%. Não gasta tudo de novo.');
  if (L && (estado === 'jogando' || estado === 'morto' || estado === 'pausa')) {
    tentativa++;
    montarFase();
    estado = 'jogando';
  }
}

function desenharTroll() {
  ctx.save();
  const sacode = trollFala > 120 ? 18 : 4;
  ctx.translate((Math.random() - 0.5) * sacode, (Math.random() - 0.5) * sacode);
  ctx.fillStyle = quadro % 10 < 5 ? '#3a0008' : '#5c0010';
  ctx.fillRect(-30, -30, W + 60, H + 60);
  // Cara do troll
  const cx = W / 2, cy = 250, boca = 30 + Math.abs(Math.sin(quadro / 3)) * 45;
  ctx.fillStyle = '#5aa83a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 190, 170, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a8f2f';
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + lado * 175, cy - 40);
    ctx.lineTo(cx + lado * 260, cy - 110);
    ctx.lineTo(cx + lado * 185, cy + 10);
    ctx.fill();
  }
  for (const lado of [-1, 1]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx + lado * 70, cy - 50, 42, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c40000';
    ctx.beginPath();
    ctx.arc(cx + lado * 70 + (Math.random() - 0.5) * 8, cy - 46, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1d3d12';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(cx + lado * 120, cy - 110);
    ctx.lineTo(cx + lado * 25, cy - 75);
    ctx.stroke();
  }
  ctx.fillStyle = '#2a0505';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 75, 110, boca, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff8d6';
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 22 - 10, cy + 75 - boca + 4);
    ctx.lineTo(cx + i * 22 + 10, cy + 75 - boca + 4);
    ctx.lineTo(cx + i * 22, cy + 75 - boca + 26);
    ctx.fill();
  }
  ctx.restore();
  const tam = 64 + (trollFala > 130 ? (trollFala - 130) * 2 : 0);
  texto(trollFrase, W / 2, 470, { tam: Math.min(tam, 96), cor: '#ffe14d', contorno: '#000' });
  const falta = Math.max(0, salvo.trollAte - Date.now());
  const min = Math.floor(falta / 60000), seg = Math.floor(falta / 1000) % 60;
  texto('SUA PACIÊNCIA ACABOU', W / 2, 36, { tam: 26, cor: '#fff', contorno: '#000' });
  texto(`O TROLL VAI EMBORA EM ${min}:${String(seg).padStart(2, '0')}`, W / 2, 522, { tam: 18, cor: '#ffb3b3', contorno: '#000' });
  desenharParticulas();
}

// ---------- laco principal (passo fixo de 60 Hz) ----------

let anterior = performance.now();
let acumulado = 0;
const PASSO_MS = 1000 / 60;

function atualizar() {
  quadro++;
  if (trollAtivo()) return atualizarTroll();
  if (trollNaTela) sairTroll();
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

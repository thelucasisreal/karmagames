// Tela do Jogo das 20 Perguntas.
// Quem cria a sala (ou joga contra o bot) roda o motor aqui mesmo no navegador.
// Os amigos se conectam a ele pela internet com PeerJS (WebRTC), sem servidor nosso.

import { executar, ErroDoJogo, conectar as conectarNoMotor, desconectar as desconectarDoMotor, fecharSala, novoCodigo } from './motor.js';
import { PERGUNTAS, GRUPOS, CATEGORIAS, DIFICULDADES } from './dados.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function el(tag, props = {}, ...filhos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) if (f != null && f !== false) e.append(f);
  return e;
}

const guardar = {
  ler(chave, area = localStorage) {
    try { return JSON.parse(area.getItem(chave)); } catch { return null; }
  },
  salvar(chave, valor, area = localStorage) {
    try {
      if (valor == null) area.removeItem(chave);
      else area.setItem(chave, JSON.stringify(valor));
    } catch { /* navegador sem storage: tudo bem */ }
  },
};

const CORES = ['#ffd23f', '#5fb8ff', '#2dd47a', '#ff8fab', '#c4a7ff', '#ffa94d'];
const pts = n => `${Number(n).toLocaleString('pt-BR')} pts`;
const sinal = n => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('pt-BR')} pts`;
const EMOJI_CAT = { animais: '🐾', pessoas: '🧑', objetos: '📦', lugares: '🌍', surpresa: '🎲' };

const info = { perguntas: PERGUNTAS, grupos: GRUPOS, categorias: CATEGORIAS, dificuldades: DIFICULDADES };
const PREFIXO = 'karmagames-20perguntas-';
let rede = null;            // { papel: 'local' | 'dono' | 'convidado', cred, peer?, conn?, pedir? }
let estado = null;
let deltaRelogio = 0;
let vistos = 0;             // quantas entradas do historico ja animamos
let grupoAtivo = 'Geral';
const cfgSolo = { dificuldade: 'medio', categoria: 'surpresa', ...guardar.ler('cfgSolo') };

// ---------- comunicacao ----------

async function tentar(onde, fn) {
  $(onde).textContent = '';
  try {
    await fn();
  } catch (erro) {
    $(onde).textContent = erro.message;
  }
}

function executarAqui(corpo) {
  try {
    return executar(corpo);
  } catch (e) {
    if (e instanceof ErroDoJogo) throw new Error(e.message);
    console.error(e);
    throw new Error('Algo deu errado.');
  }
}

async function api(acao, dados = {}) {
  if (rede?.papel === 'convidado') return rede.pedir({ tipo: 'acao', corpo: { ...dados, acao } });
  return executarAqui({ ...rede?.cred, ...dados, acao });
}

function receber(novo) {
  deltaRelogio = novo.agora - Date.now();
  if (vistos === Infinity || novo.historico.length < vistos) vistos = novo.historico.length;
  estado = novo;
  desenhar();
}

// A tela deste navegador tambem e' uma "conexao" do motor
const telaLocal = {
  enviar: receber,
  fechar: msg => { if (rede && rede.papel !== 'convidado') voltarAoInicio(msg); },
};

function guardarSessao() {
  guardar.salvar('sessao', rede ? { papel: rede.papel, ...rede.cred } : null, sessionStorage);
}

function jogarAqui(cred, papel, peer = null) {
  rede = { papel, cred, peer };
  vistos = Infinity; // nao anima o historico antigo ao (re)conectar
  guardarSessao();
  conectarNoMotor(cred, telaLocal);
}

let promessaPeer = null;
function carregarPeer() {
  promessaPeer ||= new Promise((ok, erro) => {
    if (window.Peer) return ok(window.Peer);
    const sc = document.createElement('script');
    sc.src = 'peerjs.min.js';
    sc.onload = () => (window.Peer ? ok(window.Peer) : erro(new Error('peerjs')));
    sc.onerror = () => { promessaPeer = null; erro(new Error('Não deu pra carregar o modo online. Confira sua internet.')); };
    document.head.append(sc);
  });
  return promessaPeer;
}

function abrirPeer(Peer, id) {
  return new Promise(ok => {
    const peer = id ? new Peer(id, { debug: 0 }) : new Peer({ debug: 0 });
    const tempo = setTimeout(() => ok({ peer, erro: 'tempo' }), 12000);
    peer.once('open', () => { clearTimeout(tempo); ok({ peer }); });
    peer.once('error', e => { clearTimeout(tempo); ok({ peer, erro: e.type }); });
  });
}

// --- dono da sala: o motor roda aqui e os amigos conectam ---

async function criarSala(nome) {
  const Peer = await carregarPeer();
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const codigo = novoCodigo();
    const { peer, erro } = await abrirPeer(Peer, PREFIXO + codigo);
    if (!erro) {
      const cred = executarAqui({ acao: 'criar', nome, codigo });
      peer.on('connection', atenderAmigo);
      peer.on('disconnected', () => { if (rede?.peer === peer) peer.reconnect(); });
      peer.on('error', e => console.warn('peer', e.type));
      return jogarAqui(cred, 'dono', peer);
    }
    peer.destroy();
    if (erro !== 'unavailable-id') throw new Error('Não deu pra criar a sala online. Confira sua internet.');
  }
  throw new Error('Não deu pra criar a sala. Tente de novo.');
}

function atenderAmigo(conn) {
  let cred = null;
  const conexao = {
    enviar: v => { if (conn.open) conn.send({ tipo: 'estado', v }); },
    fechar: msg => {
      try { conn.send({ tipo: 'fechou', msg }); } catch { /* ja caiu */ }
      setTimeout(() => conn.close(), 300);
    },
  };
  conn.on('data', msg => {
    if (!msg || typeof msg !== 'object') return;
    const responder = corpo => conn.send({ tipo: 'resposta', id: msg.id, ...corpo });
    try {
      if (msg.tipo === 'entrar') {
        cred = executar({ acao: 'entrar', nome: msg.nome, codigo: rede.cred.sala });
        conectarNoMotor(cred, conexao);
        responder({ ok: cred });
      } else if (msg.tipo === 'voltar') {
        const tentativa = { sala: rede.cred.sala, id: String(msg.id_), token: String(msg.token) };
        conectarNoMotor(tentativa, conexao);
        cred = tentativa;
        responder({ ok: cred });
      } else if (msg.tipo === 'acao' && cred) {
        // A identidade vem da conexao, nunca do que o amigo mandou
        const acao = String(msg.corpo?.acao);
        if (['criar', 'entrar', 'solo'].includes(acao)) throw new ErroDoJogo('Ação inválida.');
        responder({ ok: executar({ ...msg.corpo, ...cred, acao }) });
      }
    } catch (e) {
      responder({ erro: e instanceof ErroDoJogo ? e.message : 'Algo deu errado.' });
    }
  });
  conn.on('close', () => { if (cred) desconectarDoMotor(cred, conexao); });
}

// --- convidado: fala com o navegador do dono ---

async function entrarNaSala({ nome, codigo, volta = null }) {
  const Peer = await carregarPeer();
  const { peer, erro } = await abrirPeer(Peer);
  if (erro) {
    peer.destroy();
    throw new Error('Não deu pra conectar. Confira sua internet.');
  }
  const conn = peer.connect(PREFIXO + codigo, { reliable: true });
  await new Promise((ok, falhou) => {
    const tempo = setTimeout(() => falhou(new Error('Não achei nenhuma sala com esse código.')), 10000);
    peer.on('error', e => {
      clearTimeout(tempo);
      falhou(new Error(e.type === 'peer-unavailable' ? 'Não achei nenhuma sala com esse código.' : 'A conexão caiu. Tente de novo.'));
    });
    conn.on('open', () => { clearTimeout(tempo); ok(); });
  }).catch(e => { peer.destroy(); throw e; });

  const pendentes = new Map();
  let seq = 0;
  let motivoFechou = '';
  conn.on('data', msg => {
    if (msg?.tipo === 'estado') receber(msg.v);
    else if (msg?.tipo === 'fechou') motivoFechou = msg.msg;
    else if (msg?.tipo === 'resposta') {
      const p = pendentes.get(msg.id);
      if (!p) return;
      pendentes.delete(msg.id);
      if (msg.erro) p.falhou(new Error(msg.erro));
      else p.ok(msg.ok);
    }
  });
  const pedir = mensagem => new Promise((ok, falhou) => {
    const id = ++seq;
    pendentes.set(id, { ok, falhou });
    conn.send({ ...mensagem, id });
    setTimeout(() => { if (pendentes.delete(id)) falhou(new Error('A sala não respondeu.')); }, 8000);
  });

  rede = { papel: 'convidado', peer, conn, pedir, cred: null };
  vistos = Infinity;
  try {
    rede.cred = await pedir(volta ? { tipo: 'voltar', id_: volta.id, token: volta.token } : { tipo: 'entrar', nome });
  } catch (e) {
    rede = null;
    peer.destroy();
    throw e;
  }
  guardarSessao();
  conn.on('close', () => {
    if (rede?.conn === conn) voltarAoInicio(motivoFechou || 'O dono da sala saiu. A sala fechou.');
  });
}

function voltarAoInicio(msg = '') {
  const r = rede;
  rede = null;
  estado = null;
  guardarSessao();
  if (r?.papel === 'convidado') r.peer.destroy();
  else if (r) {
    fecharSala(r.cred.sala);
    r.peer?.destroy();
  }
  mostrar('inicio');
  $('#erro-inicio').textContent = msg;
}

// Fechar a aba do dono fecha a sala de todo mundo: avisa antes
addEventListener('beforeunload', e => {
  if (rede?.papel === 'dono' && estado?.jogadores.length > 1) {
    e.preventDefault();
    e.returnValue = '';
  }
});

function mostrar(tela) {
  for (const t of $$('.tela')) t.hidden = t.id !== `tela-${tela}`;
}

// ---------- tela inicial ----------

function nomeDigitado() {
  const nome = $('#nome').value.trim();
  if (!nome) {
    $('#nome').focus();
    throw new Error('Digite seu nome primeiro.');
  }
  guardar.salvar('nome', nome);
  return nome;
}

function segmentos(alvo, opcoes, atual, aoEscolher, travado = false) {
  $(alvo).replaceChildren(...Object.entries(opcoes).map(([valor, rotulo]) =>
    el('button', {
      type: 'button', 'aria-pressed': String(valor === atual), disabled: travado,
      onclick: () => aoEscolher(valor),
    }, rotulo),
  ));
}

function rotulosCategoria() {
  return Object.fromEntries(Object.entries(info.categorias).map(([k, v]) => [k, `${EMOJI_CAT[k]} ${v}`]));
}

function desenharSolo() {
  segmentos('#solo-dif', info.dificuldades, cfgSolo.dificuldade, v => {
    cfgSolo.dificuldade = v;
    guardar.salvar('cfgSolo', cfgSolo);
    desenharSolo();
  });
  segmentos('#solo-cat', rotulosCategoria(), cfgSolo.categoria, v => {
    cfgSolo.categoria = v;
    guardar.salvar('cfgSolo', cfgSolo);
    desenharSolo();
  });
}

$('#btn-criar').onclick = () => tentar('#erro-inicio', async () => {
  const nome = nomeDigitado();
  $('#erro-inicio').textContent = 'Criando a sala...';
  await criarSala(nome);
});

$('#form-entrar').onsubmit = ev => {
  ev.preventDefault();
  tentar('#erro-inicio', async () => {
    const codigo = $('#codigo').value.trim();
    if (!codigo) throw new Error('Digite o código da sala.');
    const nome = nomeDigitado();
    $('#erro-inicio').textContent = 'Procurando a sala...';
    await entrarNaSala({ nome, codigo: codigo.toUpperCase() });
    $('#erro-inicio').textContent = '';
  });
};

$('#btn-solo').onclick = () => tentar('#erro-inicio', async () => {
  jogarAqui(executarAqui({ acao: 'solo', nome: nomeDigitado(), ...cfgSolo }), 'local');
});

$('#codigo').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };

// ---------- desenho geral ----------

function desenhar() {
  if (!estado) return;
  if (estado.fase === 'lobby') {
    mostrar('lobby');
    desenharLobby();
  } else {
    mostrar('jogo');
    desenharJogo();
  }
}

const eu = () => estado.jogadores.find(j => j.id === estado.eu);
const souDono = () => estado.dono === estado.eu;
const corDe = id => CORES[estado.jogadores.findIndex(j => j.id === id) % CORES.length] || CORES[0];

function avatar(j) {
  return el('span', { class: 'avatar', style: `background:${corDe(j.id)}` }, j.bot ? '🤖' : j.nome[0].toUpperCase());
}

function etiquetas(j) {
  return [
    j.id === estado.dono && estado.modo === 'multi' && el('span', { class: 'tag dono' }, '👑 dono'),
    j.id === estado.eu && el('span', { class: 'tag voce' }, 'você'),
    !j.online && !j.bot && el('span', { class: 'tag' }, 'offline'),
  ];
}

// ---------- lobby ----------

function desenharLobby() {
  $('#lobby-codigo').textContent = estado.sala;
  $('#lobby-link').textContent = rede?.papel === 'dono'
    ? 'Mande o código pros amigos: eles abrem o 20 Perguntas, clicam em Entrar e digitam o código. Não feche esta aba, a sala fica no seu navegador!'
    : 'Mande esse código pra mais amigos entrarem.';

  $('#lobby-contagem').textContent = `(${estado.jogadores.length}/6)`;
  $('#lobby-jogadores').replaceChildren(...estado.jogadores.map(j =>
    el('li', { class: j.online ? '' : 'offline' }, avatar(j), el('span', { class: 'nome' }, j.nome), ...etiquetas(j)),
  ));

  const dono = souDono();
  const mudar = campo => valor => tentar('#erro-lobby', () => api('config', { [campo]: valor }));
  segmentos('#lobby-dif', info.dificuldades, estado.dificuldade, mudar('dificuldade'), !dono);
  segmentos('#lobby-cat', rotulosCategoria(), estado.categoria, mudar('categoria'), !dono);
  segmentos('#lobby-quem', { jogo: '🎲 O jogo sorteia', mestre: '🎩 Um jogador (Mestre)' }, estado.quemEscolhe, mudar('quemEscolhe'), !dono);
  const comMestre = estado.quemEscolhe === 'mestre';
  $('#lobby-cat-bloco').hidden = comMestre;
  $('#lobby-quem-info').textContent = comMestre
    ? 'Um jogador escreve o segredo que quiser e responde as perguntas. A cada partida o mestre muda, seguindo a ordem da lista.'
    : 'O jogo escolhe um segredo e responde sozinho. Todo mundo tenta adivinhar.';
  $('#dono-aviso').textContent = dono ? '' : '(o dono da sala escolhe)';

  const poucos = estado.jogadores.length < 2;
  $('#btn-comecar').hidden = !dono;
  $('#btn-comecar').disabled = poucos;
  const nomeDono = estado.jogadores.find(j => j.id === estado.dono)?.nome;
  $('#lobby-aviso').textContent = !dono
    ? `Esperando ${nomeDono} começar a partida...`
    : poucos ? 'Esperando mais alguém entrar (mínimo 2 jogadores).' : 'Todo mundo pronto? Bora!';
}

$('#lobby-codigo').onclick = async () => {
  try {
    await navigator.clipboard.writeText(estado.sala);
    $('#lobby-codigo').classList.add('copiado');
    setTimeout(() => $('#lobby-codigo').classList.remove('copiado'), 1500);
  } catch { /* sem permissao de clipboard */ }
};

$('#btn-comecar').onclick = () => tentar('#erro-lobby', () => api('iniciar'));

for (const b of $$('.btn-sair')) {
  b.onclick = async () => {
    // Convidado sai da sala; dono ou jogo contra o bot fecha a sala inteira
    if (rede?.papel === 'convidado') await api('sair').catch(() => {});
    voltarAoInicio();
  };
}

// ---------- jogo ----------

function desenharJogo() {
  const minhaVez = estado.vezDe === estado.eu && estado.fase === 'jogo' && !estado.pendente;
  const atual = estado.jogadores.find(j => j.id === estado.vezDe);
  const meu = eu();
  const souMestre = estado.mestreId === estado.eu;
  const mestre = estado.jogadores.find(j => j.id === estado.mestreId);

  // painel
  $('#painel-sala').textContent = estado.modo === 'multi' ? `sala ${estado.sala}` : 'vs bot';
  $('#painel-restantes').textContent = `${estado.restantes} / ${estado.total}`;
  $('#painel-barra').style.width = `${(estado.restantes / estado.total) * 100}%`;
  $('#painel-cat').textContent = `${EMOJI_CAT[estado.categoria]} ${info.categorias[estado.categoria]}`;
  $('#painel-dif').textContent = info.dificuldades[estado.dificuldade];
  const dicasSobrando = estado.dicasMax - meu.dicasUsadas;
  $('#painel-dicas').textContent = souMestre ? '🎩 mestre' : `${dicasSobrando} / ${estado.dicasMax}`;
  $('#painel-combo').replaceChildren(meu.combo
    ? el('span', { class: 'fogo' }, '🔥 COMBO ×1.2 ativo!')
    : `${'🔥'.repeat(meu.seguidos)}${'·'.repeat(3 - meu.seguidos)} ${meu.seguidos} / 3`);
  $('#painel-max').textContent = estado.fase === 'jogo' ? pts(meu.pontos) : pts(estado.fim?.extratos[estado.eu]?.total ?? 0);
  $('.painel-max span').textContent = souMestre ? '🛡️ Seus pontos de mestre agora' : '🏆 Pontuação máxima possível agora';

  // placar
  $('#placar').replaceChildren(...placarOrdenado().map((j, i) =>
    el('li', { class: [j.id === estado.vezDe && 'atual', j.id === estado.fim?.vencedorId && 'vencedor', !j.online && !j.bot && 'offline'].filter(Boolean).join(' ') },
      el('span', { class: 'posicao' }, `${i + 1}º`),
      avatar(j),
      el('span', { class: 'nome' }, j.nome, j.id === estado.eu ? ' (você)' : '', j.combo ? ' 🔥' : '', j.pula ? ' ⏭️' : '',
        j.id === estado.mestreId ? el('div', { class: 'tag-mestre' }, '🎩 mestre') : null),
      el('span', { class: 'pts', title: estado.fase === 'jogo' ? 'Quanto faria acertando agora' : 'Pontuação final' }, pts(j.pontos)),
    ),
  ));

  // dicas secretas
  $('#caixa-dicas').hidden = !estado.minhasDicas.length;
  $('#minhas-dicas').replaceChildren(...estado.minhasDicas.map(d => el('li', {}, d)));
  $('#btn-dica').disabled = dicasSobrando <= 0 || estado.fase !== 'jogo';
  $('#btn-dica').textContent = `💡 Dica (${dicasSobrando})`;

  // de quem e' a vez
  const vez = $('#vez');
  const mestreDeveResponder = souMestre && !!estado.pendente;
  vez.classList.toggle('minha', minhaVez || mestreDeveResponder);
  const quemPediu = estado.jogadores.find(j => j.id === estado.pendente?.jogadorId);
  if (estado.fase === 'escolha') {
    $('#vez-texto').replaceChildren(`🎩 ${mestre?.nome ?? 'O mestre'} está escolhendo o segredo...`);
  } else if (estado.fase !== 'jogo') {
    $('#vez-texto').replaceChildren('Fim de jogo!');
  } else if (mestreDeveResponder) {
    $('#vez-texto').replaceChildren(`❓ Responda ${quemPediu?.nome ?? ''}!`, el('small', {}, estado.pendente.tipo === 'chute' ? 'Diga se o chute está certo.' : 'Responda à pergunta aqui embaixo.'));
  } else if (estado.pendente) {
    $('#vez-texto').replaceChildren(`⏳ Esperando o mestre ${mestre?.nome ?? ''} responder...`,
      el('small', {}, `${quemPediu?.nome ?? ''}: ${estado.pendente.tipo === 'chute' ? `É "${estado.pendente.texto}"?` : estado.pendente.texto}`));
  } else if (souMestre) {
    $('#vez-texto').replaceChildren(`Vez de ${atual?.nome ?? '...'} perguntar`, el('small', {}, 'Quando chegar uma pergunta, você responde.'));
  } else if (minhaVez) {
    $('#vez-texto').replaceChildren('⭐ Sua vez! ', el('small', {}, 'Escolha uma pergunta abaixo ou dê um chute.'));
  } else if (atual?.bot) {
    $('#vez-texto').replaceChildren(`🤖 ${atual.nome.replace('🤖 ', '')} está pensando...`);
  } else {
    $('#vez-texto').replaceChildren(`Vez de ${atual?.nome ?? '...'}`, el('small', {}, 'Fique de olho nas respostas!'));
  }
  $('#vez-contador').textContent = `📊 ${estado.restantes}/${estado.total} perguntas · 💡 ${dicasSobrando} dica(s) · 🏆 ${pts(meu.pontos)}`;
  $('#timer').hidden = !estado.prazo;

  // chute
  $('#chute').disabled = !minhaVez;
  $('#form-chute button').disabled = !minhaVez;

  // modo mestre
  $('#form-chute').hidden = souMestre;
  $('.perguntas').hidden = souMestre;
  $('#mestre-caixa').hidden = !souMestre || estado.fase !== 'jogo';
  $('#form-livre').hidden = !estado.mestreId;
  $('#pergunta-livre').disabled = !minhaVez;
  $('#form-livre button').disabled = !minhaVez;
  if (souMestre) desenharMestre();
  desenharEscolha(souMestre, mestre);

  desenharPerguntas(minhaVez);
  desenharHistorico();
  animarNovidades();
  desenharFim();
}

function desenharMestre() {
  $('#mestre-segredo').textContent = estado.meuSegredo ?? '';
  const p = estado.pendente;
  const quem = estado.jogadores.find(j => j.id === p?.jogadorId)?.nome;
  const responder = (acao, dados) => tentar('#erro-jogo', () => api(acao, dados));
  if (!p) {
    const atual = estado.jogadores.find(j => j.id === estado.vezDe);
    $('#mestre-pendente').replaceChildren(el('p', { class: 'sub' }, `Esperando ${atual?.nome ?? 'alguém'} fazer uma pergunta...`));
  } else if (p.tipo === 'pergunta') {
    $('#mestre-pendente').replaceChildren(el('div', { class: 'pendente' },
      el('div', { class: 'quem' }, `${quem} perguntou:`),
      el('div', { class: 'pergunta' }, p.texto),
      el('div', { class: 'botoes-resposta' }, ...['SIM', 'NÃO', 'TALVEZ', 'IRRELEVANTE'].map(r =>
        el('button', { class: `btn b-${r}`, onclick: () => responder('responder', { resposta: r }) }, r))),
    ));
  } else {
    $('#mestre-pendente').replaceChildren(el('div', { class: 'pendente' },
      el('div', { class: 'quem' }, `${quem} chutou:`),
      el('div', { class: 'pergunta' }, `É "${p.texto}"?`),
      el('div', { class: 'botoes-resposta' },
        el('button', { class: 'btn b-SIM', onclick: () => responder('julgar', { certo: true }) }, '✅ Acertou!'),
        el('button', { class: 'btn b-NÃO', onclick: () => responder('julgar', { certo: false }) }, '❌ Errou')),
    ));
  }
}

let categoriaDoSegredo = 'surpresa';

function desenharEscolha(souMestre, mestre) {
  $('#escolha').hidden = estado.fase !== 'escolha';
  if (estado.fase !== 'escolha') return;
  $('#escolha-mestre').hidden = !souMestre;
  $('#escolha-espera').hidden = souMestre;
  $('#escolha-espera-texto').textContent = `${mestre?.nome ?? 'O mestre'} está escolhendo o segredo...`;
  const opcoes = { ...Object.fromEntries(Object.entries(rotulosCategoria()).filter(([k]) => k !== 'surpresa')), surpresa: '🤫 Não contar' };
  segmentos('#segredo-cat', opcoes, categoriaDoSegredo, v => {
    categoriaDoSegredo = v;
    desenharEscolha(souMestre, mestre);
  });
}

$('#form-segredo').onsubmit = ev => {
  ev.preventDefault();
  tentar('#erro-escolha', async () => {
    await api('segredo', { texto: $('#segredo-texto').value, categoria: categoriaDoSegredo });
    $('#segredo-texto').value = '';
  });
};

$('#form-livre').onsubmit = ev => {
  ev.preventDefault();
  const texto = $('#pergunta-livre').value.trim();
  if (!texto) return;
  tentar('#erro-jogo', async () => {
    await api('perguntar', { texto });
    $('#pergunta-livre').value = '';
  });
};

function placarOrdenado() {
  return [...estado.jogadores].sort((a, b) => b.pontos - a.pontos);
}

function desenharPerguntas(minhaVez) {
  const feitas = new Map(estado.historico.filter(h => h.qid).map(h => [h.qid, h.resposta]));
  const busca = $('#busca').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  $('#grupos').replaceChildren(...info.grupos.map(g =>
    el('button', {
      type: 'button', role: 'tab', 'aria-selected': String(!busca && g === grupoAtivo),
      onclick: () => { grupoAtivo = g; $('#busca').value = ''; desenharJogo(); },
    }, g),
  ));

  const lista = info.perguntas.filter(p => busca
    ? p.texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(busca)
    : p.grupo === grupoAtivo);

  $('#lista-perguntas').replaceChildren(
    ...lista.map(p => {
      const resposta = feitas.get(p.id);
      if (resposta) {
        return el('button', { class: 'feita', disabled: true }, el('span', {}, p.texto), el('b', { class: `resp ${resposta}` }, resposta));
      }
      return el('button', {
        disabled: !minhaVez,
        onclick: () => tentar('#erro-jogo', () => api('perguntar', { qid: p.id })),
      }, p.texto);
    }),
    ...(lista.length ? [] : [el('div', { class: 'vazio' }, 'Nenhuma pergunta com esse texto.')]),
  );
}

function desenharHistorico() {
  const itens = estado.historico.map(h => {
    if (h.tipo === 'info' || h.tipo === 'dica') return el('li', { class: 'info' }, h.texto);
    const quem = h.jogadorId === estado.eu ? 'Você' : h.nome;
    return el('li', {},
      el('div', { class: 'quem' }, el('span', {}, `${h.n}. ${quem}`), el('span', {}, h.pontos ? sinal(h.pontos) : '')),
      el('div', { class: 'txt' },
        el('span', {}, h.tipo === 'chute' ? `🎯 É "${h.texto}"?` : h.texto),
        el('b', { class: `resp ${h.resposta}` }, h.resposta),
      ),
    );
  }).reverse();
  const p = estado.pendente;
  if (p) {
    const quem = p.jogadorId === estado.eu ? 'Você' : estado.jogadores.find(j => j.id === p.jogadorId)?.nome;
    itens.unshift(el('li', {},
      el('div', { class: 'quem' }, el('span', {}, `${estado.total - estado.restantes + 1}. ${quem}`)),
      el('div', { class: 'txt' }, el('span', {}, p.tipo === 'chute' ? `🎯 É "${p.texto}"?` : p.texto), el('b', { class: 'resp ESPERANDO' }, '⏳'))));
  }
  $('#historico').replaceChildren(...(itens.length ? itens : [el('li', { class: 'vazio' }, 'Nenhuma pergunta ainda.')]));
}

const COR_RESPOSTA = { SIM: 'var(--sim)', 'NÃO': 'var(--nao)', TALVEZ: 'var(--talvez)', IRRELEVANTE: 'var(--apagado)', ACERTOU: 'var(--sim)', ERROU: 'var(--nao)' };

function animarNovidades() {
  const novas = estado.historico.slice(vistos).filter(h => h.resposta);
  vistos = estado.historico.length;
  const ultima = novas.at(-1);
  if (!ultima) return;
  const quem = ultima.jogadorId === estado.eu ? 'Você' : ultima.nome;
  const texto = ultima.tipo === 'chute' ? `${quem}: "${ultima.texto}"` : `${quem}: ${ultima.texto}`;
  const caixa = el('div', { style: `background:${COR_RESPOSTA[ultima.resposta]}` },
    ultima.resposta === 'ACERTOU' ? '🎉 ACERTOU!' : ultima.resposta,
    el('small', {}, texto),
  );
  $('#flash').replaceChildren(caixa);
  setTimeout(() => caixa.remove(), 1400);
}

function desenharFim() {
  const fim = estado.fim;
  $('#fim').hidden = !fim;
  if (!fim) return;

  const vencedor = estado.jogadores.find(j => j.id === fim.vencedorId);
  const usadas = estado.total - estado.restantes;
  let titulo;
  if (fim.motivo === 'acerto' && fim.vencedorId === estado.eu) titulo = '🎉 PARABÉNS! VOCÊ ADIVINHOU O SEGREDO!';
  else if (fim.motivo === 'acerto') titulo = `🏆 ${vencedor?.nome ?? 'Alguém'} acertou!`;
  else if (fim.motivo === 'mestre-saiu') titulo = '🎩 O mestre saiu da sala!';
  else titulo = '⌛ Fim de jogo! As 20 perguntas acabaram.';
  if (fim.mestreId === estado.eu) {
    titulo = fim.motivo === 'acerto' ? `😮 ${vencedor?.nome ?? 'Alguém'} adivinhou seu segredo!` : '🛡️ Ninguém adivinhou seu segredo!';
  }
  $('#fim-titulo').textContent = titulo;

  $('#fim-segredo').textContent = fim.segredo.nome;
  $('#fim-categoria').textContent = fim.segredo.categoria;
  $('#fim-curiosidade').hidden = !fim.segredo.curiosidade;
  $('#fim-curiosidade').replaceChildren(el('b', {}, '🤓 Curiosidade: '), fim.segredo.curiosidade ?? '');

  const meu = eu();
  $('#fim-resumo').replaceChildren(
    el('li', {}, `Segredo: ${fim.segredo.nome}`),
    el('li', {}, `Perguntas usadas: ${usadas}/${estado.total}`),
    ...(fim.mestreId === estado.eu ? [] : [el('li', {}, `Dicas utilizadas: ${meu.dicasUsadas}/${estado.dicasMax}`)]),
  );
  const ext = fim.extratos[estado.eu];
  $('#fim-extrato').replaceChildren(
    ...(ext.linhas.length ? ext.linhas : [{ rotulo: 'Nenhum ponto nessa partida', valor: 0 }]).map(l =>
      el('div', { class: `linha-ext ${l.valor > 0 ? 'mais' : l.valor < 0 ? 'menos' : ''}` }, el('span', {}, l.rotulo), el('b', {}, sinal(l.valor)))),
    el('div', { class: 'linha-ext total' }, el('span', {}, '🏆 PONTUAÇÃO FINAL'), el('b', {}, pts(ext.total))),
    el('div', { class: 'rank' },
      el('span', { class: `letra rank-${ext.rank.letra}` }, ext.rank.letra),
      el('span', {}, el('b', {}, `Rank ${ext.rank.letra}: ${ext.rank.nome}`),
        el('div', { class: 'sub', style: 'margin:0' }, ext.mestre ? 'Mestre: quanto mais perguntas o segredo aguentar, melhor o rank.'
          : ext.venceu ? 'S = Mastermind · A = Detetive · B = Curioso · C = Iniciante' : 'Só quem acerta o segredo sobe de rank.')),
    ),
  );

  const sim = estado.historico.filter(h => h.resposta === 'SIM');
  $('#fim-pistas').replaceChildren(...(sim.length ? [
    el('div', { class: 'rotulo' }, 'As pistas que levavam até ele'),
    el('div', { class: 'pistas' }, ...sim.map(h => el('span', {}, `✔ ${h.texto}`))),
  ] : []));

  const ordem = placarOrdenado();
  $('#fim-placar').replaceChildren(...ordem.map((j, i) =>
    el('li', { class: i === 0 ? 'vencedor' : '' },
      el('span', { class: 'posicao' }, i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`),
      avatar(j),
      el('span', { class: 'nome' }, j.nome, j.id === estado.eu ? ' (você)' : ''),
      el('span', { class: 'pts' }, pts(j.pontos)),
    ),
  ));

  const dono = souDono();
  $('#btn-revanche').hidden = !dono;
  $('#btn-revanche').textContent = estado.modo === 'solo' ? '🔁 Jogar de novo' : '🔁 Voltar pra sala e jogar de novo';
  $('#fim-espera').textContent = dono ? '' : 'Esperando o dono da sala começar outra partida...';
}

$('#btn-revanche').onclick = () => tentar('#erro-jogo', () => api('revanche'));

$('#btn-dica').onclick = () => tentar('#erro-jogo', () => api('dica'));

$('#form-chute').onsubmit = ev => {
  ev.preventDefault();
  const texto = $('#chute').value.trim();
  if (!texto) return;
  tentar('#erro-jogo', async () => {
    await api('chutar', { texto });
    $('#chute').value = '';
  });
};

$('#busca').oninput = () => estado && desenharPerguntas(estado.vezDe === estado.eu && estado.fase === 'jogo');

setInterval(() => {
  if (!estado?.prazo) return;
  const falta = Math.max(0, estado.prazo - (Date.now() + deltaRelogio));
  $('#timer-barra').style.width = `${(falta / 60000) * 100}%`;
  $('#timer').classList.toggle('urgente', falta < 10000);
}, 200);

// ---------- inicio ----------

(async function iniciar() {
  $('#nome').value = guardar.ler('nome') || '';
  const codigoNaUrl = new URLSearchParams(location.search).get('sala');
  if (codigoNaUrl) $('#codigo').value = codigoNaUrl.toUpperCase();
  desenharSolo();
  // Recarregou a pagina: convidado tenta voltar pra sala; a sala do dono morreu junto com a pagina
  const antiga = guardar.ler('sessao', sessionStorage);
  guardar.salvar('sessao', null, sessionStorage);
  if (antiga?.papel === 'convidado') {
    $('#erro-inicio').textContent = 'Voltando pra sala...';
    try {
      await entrarNaSala({ codigo: antiga.sala, volta: antiga });
      $('#erro-inicio').textContent = '';
    } catch {
      $('#erro-inicio').textContent = 'A sala em que você estava não existe mais.';
    }
  } else if (antiga?.papel === 'dono') {
    $('#erro-inicio').textContent = 'Sua sala fechou quando a página recarregou. Crie outra!';
  }
})();

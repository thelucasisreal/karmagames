// Motor do Jogo das 20 Perguntas: salas, turnos, bot e pontuacao.
// Roda no navegador de quem cria a sala (ou de quem joga contra o bot).
// Os outros jogadores falam com ele pela rede (ver rede em app.js).

import {
  CATEGORIAS, DIFICULDADES, NIVEL, PERGUNTAS, SEGREDOS,
  responder, confere, dicasDe, chaveDoChute,
} from './dados.js';

const TOTAL_PERGUNTAS = 20;
const TEMPO_DA_VEZ = 60_000;
const MAX_JOGADORES = 6;
const NOMES_BOT = { facil: 'Bot Novato', medio: 'Bot Esperto', dificil: 'Bot Gênio' };

// Pontuacao
const BASE = { facil: 1000, medio: 2000, dificil: 3500 };
const POR_PERGUNTA_SOBRANDO = 100;
const MENTE_BRILHANTE = 1500;      // acertar usando 5 perguntas ou menos
const PENALIDADE_DICA = 250;
const PENALIDADE_CHUTE = 100;
const POR_PISTA = 100;             // consolo pra quem nao acertou: cada SIM que achou
const COMBO = 1.2;                 // 3 SIM seguidos
const RESPOSTAS_DO_MESTRE = ['SIM', 'NÃO', 'TALVEZ', 'IRRELEVANTE'];
const CATEGORIAS_DO_MESTRE = ['animais', 'pessoas', 'objetos', 'lugares'];
const RANKS = [
  { letra: 'S', nome: 'Mastermind', bonus: 2500 },
  { letra: 'A', nome: 'Detetive', bonus: 1200 },
  { letra: 'B', nome: 'Curioso', bonus: 500 },
  { letra: 'C', nome: 'Iniciante', bonus: -Infinity },
];

const salas = new Map();

export class ErroDoJogo extends Error {}
const falha = msg => { throw new ErroDoJogo(msg); };
const sortear = lista => lista[Math.floor(Math.random() * lista.length)];

// ---------- salas e jogadores ----------

// Ids aleatorios sem crypto.randomUUID (que so existe em https/localhost)
const aleatorio = n => Array.from({ length: n }, () => Math.floor(Math.random() * 36).toString(36)).join('');

export function novoCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo;
  do {
    codigo = Array.from({ length: 4 }, () => sortear(letras)).join('');
  } while (salas.has(codigo));
  return codigo;
}

function limparNome(nome) {
  const limpo = String(nome || '').replace(/\s+/g, ' ').trim().slice(0, 16);
  return limpo || falha('Digite seu nome primeiro.');
}

function novaSala(modo, codigo) {
  const sala = {
    codigo: codigo && !salas.has(codigo) ? codigo : novoCodigo(), modo, dono: null, fase: 'lobby',
    dificuldade: 'medio', categoria: 'surpresa',
    // quemEscolhe: 'jogo' = o servidor sorteia o segredo; 'mestre' = um jogador escreve o segredo e responde
    quemEscolhe: 'jogo', mestreId: null, rodada: 0, pendente: null,
    jogadores: [], segredo: null, usados: new Set(),
    restantes: TOTAL_PERGUNTAS, historico: [], vez: 0, prazo: null, timer: null, fim: null,
    vazioDesde: null,
  };
  salas.set(sala.codigo, sala);
  return sala;
}

function adicionarJogador(sala, nome, bot = false) {
  let final = nome;
  for (let n = 2; sala.jogadores.some(j => j.nome.toLowerCase() === final.toLowerCase()); n++) {
    final = `${nome.slice(0, 13)} ${n}`;
  }
  const j = {
    id: aleatorio(8), token: aleatorio(24),
    nome: final, bot, dicas: [], pula: false, ...placarZerado(),
    online: bot, offlineDesde: bot ? null : Date.now(), conexoes: new Set(),
  };
  sala.jogadores.push(j);
  return j;
}

function placarZerado() {
  return { sims: 0, seguidos: 0, combo: false, errados: 0 };
}

function removerJogador(sala, j) {
  const i = sala.jogadores.indexOf(j);
  if (i < 0) return;
  sala.jogadores.splice(i, 1);
  for (const c of j.conexoes) c.fechar?.('Você saiu da sala.');

  const humanos = sala.jogadores.filter(p => !p.bot);
  if (!humanos.length) return apagarSala(sala);
  if (sala.dono === j.id) sala.dono = humanos[0].id;
  if (sala.pendente?.jogadorId === j.id) sala.pendente = null;

  if (sala.mestreId === j.id && sala.fase === 'escolha') {
    sala.fase = 'lobby';
  } else if (sala.mestreId === j.id && sala.fase === 'jogo') {
    registrar(sala, { tipo: 'info', texto: `🎩 O mestre ${j.nome} saiu da sala.` });
    encerrar(sala, null, 'mestre-saiu');
  } else if (sala.fase === 'jogo') {
    registrar(sala, { tipo: 'info', texto: `${j.nome} saiu da sala.` });
    if (i < sala.vez) sala.vez--;
    else if (i === sala.vez) {
      sala.vez--;
      proximaVez(sala);
    }
  }
  transmitir(sala);
}

function apagarSala(sala) {
  clearTimeout(sala.timer);
  for (const j of sala.jogadores) for (const c of j.conexoes) c.fechar?.('A sala fechou.');
  salas.delete(sala.codigo);
}

// ---------- partida ----------

function poolDe(sala) {
  const nivel = NIVEL[sala.dificuldade];
  return SEGREDOS.filter(s => s.dif === nivel && (sala.categoria === 'surpresa' || s.cat === sala.categoria));
}

const temMestre = sala => sala.modo === 'multi' && sala.quemEscolhe === 'mestre';

function iniciarPartida(sala) {
  clearTimeout(sala.timer);
  sala.restantes = TOTAL_PERGUNTAS;
  sala.historico = [];
  sala.fim = null;
  sala.pendente = null;
  sala.prazo = null;
  for (const j of sala.jogadores) {
    Object.assign(j, placarZerado(), { dicas: [], pula: false });
  }

  if (temMestre(sala)) {
    // O mestre muda a cada partida, seguindo a ordem da sala
    sala.mestreId = sala.jogadores[sala.rodada % sala.jogadores.length].id;
    sala.rodada++;
    sala.segredo = null;
    sala.fase = 'escolha';
    return;
  }

  sala.mestreId = null;
  const pool = poolDe(sala);
  let opcoes = pool.filter(s => !sala.usados.has(s.id));
  if (!opcoes.length) {
    sala.usados.clear();
    opcoes = pool;
  }
  sala.segredo = sortear(opcoes);
  sala.usados.add(sala.segredo.id);
  sala.fase = 'jogo';
  // Contra o bot, a pessoa sempre comeca. No multiplayer, quem comeca e' sorteado.
  sala.vez = sala.modo === 'solo' ? 0 : Math.floor(Math.random() * sala.jogadores.length);
  const atual = sala.jogadores[sala.vez];
  if (!atual.bot && !atual.online) proximaVez(sala);
  else comecarVez(sala);
}

function comecarVez(sala) {
  clearTimeout(sala.timer);
  sala.prazo = null;
  const j = sala.jogadores[sala.vez];
  if (!j || sala.fase !== 'jogo') return;
  if (j.bot) {
    sala.timer = setTimeout(() => botJoga(sala, j), 1300 + Math.random() * 1400);
  } else if (sala.modo === 'multi') {
    sala.prazo = Date.now() + TEMPO_DA_VEZ;
    sala.timer = setTimeout(() => {
      registrar(sala, { tipo: 'info', texto: `⏰ O tempo de ${j.nome} acabou.` });
      proximaVez(sala);
      transmitir(sala);
    }, TEMPO_DA_VEZ);
  }
}

function proximaVez(sala) {
  const n = sala.jogadores.length;
  let i = sala.vez;
  for (let tentativa = 0; tentativa < n * 2; tentativa++) {
    i = (i + 1 + n) % n;
    const j = sala.jogadores[i];
    if (!j.bot && !j.online) continue;
    if (j.id === sala.mestreId) continue;
    if (j.pula) {
      j.pula = false;
      registrar(sala, { tipo: 'info', texto: `⏭️ ${j.nome} perdeu a vez pelo chute errado.` });
      continue;
    }
    sala.vez = i;
    return comecarVez(sala);
  }
  sala.vez = Math.max(0, Math.min(sala.vez, n - 1));
  comecarVez(sala);
}

function registrar(sala, entrada) {
  const { jogador, ...resto } = entrada;
  sala.historico.push({
    ...resto,
    ...(jogador && { jogadorId: jogador.id, nome: jogador.nome }),
  });
}

function exigirVez(sala, j) {
  if (sala.fase !== 'jogo') falha('A partida não está rolando.');
  if (sala.pendente) falha('Espere o mestre responder.');
  if (sala.jogadores[sala.vez] !== j) falha('Calma, ainda não é a sua vez!');
}

// Enquanto o mestre pensa na resposta, o relogio da vez fica parado
function esperarMestre(sala, pendente) {
  clearTimeout(sala.timer);
  sala.prazo = null;
  sala.pendente = pendente;
}

function perguntar(sala, j, { qid, texto }) {
  exigirVez(sala, j);
  let pergunta;
  if (qid) {
    pergunta = PERGUNTAS.find(p => p.id === qid) || falha('Pergunta inválida.');
    if (sala.historico.some(h => h.qid === qid)) falha('Essa pergunta já foi feita!');
  } else {
    if (!temMestre(sala)) falha('Escolha uma das perguntas da lista.');
    const livre = String(texto || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    if (livre.length < 3) falha('Escreva a sua pergunta.');
    pergunta = { texto: livre.endsWith('?') ? livre : `${livre}?` };
  }
  if (temMestre(sala)) {
    return esperarMestre(sala, { tipo: 'pergunta', jogadorId: j.id, qid: pergunta.id, texto: pergunta.texto });
  }
  aplicarResposta(sala, j, pergunta, responder(sala.segredo, qid));
}

function aplicarResposta(sala, j, pergunta, resposta) {
  sala.restantes--;
  registrar(sala, {
    tipo: 'pergunta', n: TOTAL_PERGUNTAS - sala.restantes, jogador: j,
    qid: pergunta.id, texto: pergunta.texto, resposta,
  });
  if (resposta === 'SIM') {
    j.sims++;
    j.seguidos++;
    if (j.seguidos >= 3 && !j.combo) {
      j.combo = true;
      registrar(sala, { tipo: 'info', texto: `🔥 ${j.nome} fez 3 SIM seguidos e ativou o COMBO ×1.2!` });
    }
  } else {
    j.seguidos = 0;
  }
  if (sala.restantes <= 0) encerrar(sala, null, 'acabou');
  else proximaVez(sala);
}

function chutar(sala, j, texto) {
  exigirVez(sala, j);
  const chute = String(texto || '').trim().slice(0, 40);
  if (!chute) falha('Escreva o seu chute.');
  if (confere(chute, sala.segredo)) return aplicarChute(sala, j, chute, true);
  // Com mestre, o proprio mestre decide se "cachorrinho" vale pra "cachorro"
  if (temMestre(sala)) return esperarMestre(sala, { tipo: 'chute', jogadorId: j.id, texto: chute });
  aplicarChute(sala, j, chute, false);
}

function aplicarChute(sala, j, chute, certo) {
  sala.restantes--;
  const n = TOTAL_PERGUNTAS - sala.restantes;
  if (certo) {
    registrar(sala, { tipo: 'chute', n, jogador: j, texto: chute, resposta: 'ACERTOU' });
    return encerrar(sala, j, 'acerto');
  }
  j.errados++;
  j.seguidos = 0;
  j.pula = sala.jogadores.length > 1;
  // `alvo` guarda qual segredo foi descartado, pro bot nao repetir o mesmo chute
  const alvo = temMestre(sala) ? undefined : poolDe(sala).find(s => confere(chute, s))?.id;
  registrar(sala, { tipo: 'chute', n, jogador: j, texto: chute, resposta: 'ERROU', pontos: -PENALIDADE_CHUTE, alvo });
  if (sala.restantes <= 0) encerrar(sala, null, 'acabou');
  else proximaVez(sala);
}

function definirSegredo(sala, j, { texto, categoria }) {
  if (sala.fase !== 'escolha') falha('Não é hora de escolher o segredo.');
  if (sala.mestreId !== j.id) falha('Só o mestre escolhe o segredo.');
  // "uma capivara" -> "Capivara", pra dica da primeira letra fazer sentido
  const limpo = String(texto || '').replace(/\s+/g, ' ').trim().slice(0, 40).replace(/^(o|a|os|as|um|uma)\s+(?=\S)/i, '');
  if (limpo.length < 2) falha('Escreva o seu segredo.');
  const nome = limpo[0].toUpperCase() + limpo.slice(1);
  const cat = CATEGORIAS_DO_MESTRE.includes(categoria) ? categoria : null;
  sala.categoria = cat ?? 'surpresa';
  sala.segredo = { id: 'mestre', nome, cat, dica: null, curiosidade: null, aceitos: [chaveDoChute(nome)] };
  sala.fase = 'jogo';
  registrar(sala, { tipo: 'info', texto: `🎩 ${j.nome} escolheu o segredo. Valendo!` });
  const palpiteiros = sala.jogadores.map((p, i) => i).filter(i => sala.jogadores[i].id !== j.id);
  sala.vez = sortear(palpiteiros);
  if (!sala.jogadores[sala.vez].online) proximaVez(sala);
  else comecarVez(sala);
}

function resolverPendente(sala, j, tipo) {
  if (sala.fase !== 'jogo' || sala.mestreId !== j.id) falha('Só o mestre pode responder.');
  const p = sala.pendente;
  if (p?.tipo !== tipo) falha('Não tem nada esperando resposta.');
  sala.pendente = null;
  return [sala.jogadores.find(x => x.id === p.jogadorId), p];
}

function mestreResponde(sala, j, { resposta }) {
  if (!RESPOSTAS_DO_MESTRE.includes(resposta)) falha('Resposta inválida.');
  const [quem, p] = resolverPendente(sala, j, 'pergunta');
  if (!quem) return proximaVez(sala);
  aplicarResposta(sala, quem, { id: p.qid, texto: p.texto }, resposta);
}

function mestreJulga(sala, j, { certo }) {
  const [quem, p] = resolverPendente(sala, j, 'chute');
  if (!quem) return proximaVez(sala);
  aplicarChute(sala, quem, p.texto, certo === true);
}

function pedirDica(sala, j) {
  if (sala.fase !== 'jogo') falha('A partida não está rolando.');
  if (sala.mestreId === j.id) falha('O mestre já sabe o segredo! 😄');
  const max = sala.modo === 'solo' ? 2 : 1;
  if (j.dicas.length >= max) falha('Você já usou todas as suas dicas.');
  const lista = dicasDe(sala.segredo, sala.categoria);
  j.dicas.push(lista[j.dicas.length % lista.length]);
  registrar(sala, { tipo: 'dica', jogador: j, texto: `${j.nome} usou uma dica 🤫` });
}

// Extrato de pontos de um jogador. `usadas` = perguntas gastas no momento do acerto.
function extrato(sala, j, venceu, usadas) {
  const linhas = [];
  let soma = 0;
  const somar = (rotulo, valor) => {
    linhas.push({ rotulo, valor });
    soma += valor;
  };
  const base = BASE[sala.dificuldade];
  if (venceu) {
    const sobra = TOTAL_PERGUNTAS - usadas;
    somar(`Pontuação base (${DIFICULDADES[sala.dificuldade]})`, base);
    somar(`Bônus por economia de perguntas (${sobra} restantes)`, sobra * POR_PERGUNTA_SOBRANDO);
    if (usadas <= 5) somar('Bônus Mente Brilhante 🧠', MENTE_BRILHANTE);
  } else if (j.sims) {
    somar(`Pistas encontradas (${j.sims} × SIM)`, j.sims * POR_PISTA);
  }
  if (j.combo && soma > 0) somar('Combo 🔥 3 SIM seguidos (×1.2)', Math.round(soma * (COMBO - 1)));
  const multa = j.dicas.length * PENALIDADE_DICA + j.errados * PENALIDADE_CHUTE;
  if (multa) somar(`Penalidades (${j.dicas.length} dica(s), ${j.errados} chute(s) errado(s))`, -multa);

  const total = Math.max(0, soma);
  const bonus = venceu ? total - base : -Infinity;
  const rank = RANKS.find(r => bonus >= r.bonus);
  return { linhas, total, venceu, rank: { letra: rank.letra, nome: rank.nome } };
}

// Quanto o jogador faria se acertasse no proximo lance
function maximoAgora(sala, j) {
  return extrato(sala, j, true, TOTAL_PERGUNTAS - sala.restantes + 1).total;
}

// O mestre ganha pontos por cada pergunta que o segredo aguentou, e um bonus se ninguem acertar
function extratoDoMestre(sala, usadas, invencivel) {
  const linhas = [{ rotulo: `Perguntas que seu segredo aguentou (${usadas} × 100)`, valor: usadas * 100 }];
  if (invencivel) linhas.push({ rotulo: 'Segredo invencível 🛡️ ninguém adivinhou', valor: BASE[sala.dificuldade] });
  const total = linhas.reduce((t, l) => t + l.valor, 0);
  const rank = invencivel ? RANKS[0] : usadas >= 12 ? RANKS[1] : usadas >= 7 ? RANKS[2] : RANKS[3];
  return { linhas, total, venceu: invencivel, mestre: true, rank: { letra: rank.letra, nome: rank.nome } };
}

function encerrar(sala, vencedor, motivo) {
  clearTimeout(sala.timer);
  sala.prazo = null;
  sala.pendente = null;
  sala.fase = 'fim';
  const usadas = TOTAL_PERGUNTAS - sala.restantes;
  const mestre = sala.jogadores.find(j => j.id === sala.mestreId);
  sala.fim = {
    motivo,
    usadas,
    vencedorId: vencedor?.id ?? null,
    mestreId: mestre?.id ?? null,
    extratos: Object.fromEntries(sala.jogadores.map(j => [j.id, j === mestre
      ? extratoDoMestre(sala, usadas, motivo === 'acabou')
      : extrato(sala, j, j === vencedor, usadas)])),
    segredo: {
      nome: sala.segredo.nome,
      categoria: CATEGORIAS[sala.segredo.cat] ?? (mestre ? `Escolhido por ${mestre.nome}` : ''),
      curiosidade: sala.segredo.curiosidade,
    },
  };
}

// ---------- bot ----------

function candidatosDoBot(sala) {
  const descartados = new Set(sala.historico.filter(h => h.alvo).map(h => h.alvo));
  return poolDe(sala).filter(s =>
    !descartados.has(s.id) &&
    sala.historico.every(h => h.tipo !== 'pergunta' || responder(s, h.qid) === h.resposta),
  );
}

// Quanto menor o maior grupo que sobra depois da resposta, melhor a pergunta.
function maiorGrupo(candidatos, qid) {
  const grupos = {};
  for (const s of candidatos) {
    const r = responder(s, qid);
    grupos[r] = (grupos[r] || 0) + 1;
  }
  return Math.max(...Object.values(grupos));
}

function botJoga(sala, bot) {
  if (!salas.has(sala.codigo) || sala.fase !== 'jogo' || sala.jogadores[sala.vez] !== bot) return;
  const candidatos = candidatosDoBot(sala);
  const feitas = new Set(sala.historico.map(h => h.qid));
  const livres = PERGUNTAS.filter(p => !feitas.has(p.id));
  const esperteza = { facil: 0.3, medio: 0.65, dificil: 1 }[sala.dificuldade];
  const confianca = { facil: 1, medio: 2, dificil: 2 }[sala.dificuldade];

  try {
    if (!candidatos.length || !livres.length) {
      chutar(sala, bot, sortear(poolDe(sala)).nome);
    } else if (candidatos.length <= confianca || sala.restantes <= 2) {
      chutar(sala, bot, sortear(candidatos).nome);
    } else {
      const uteis = livres.filter(p => maiorGrupo(candidatos, p.id) < candidatos.length);
      let escolhida;
      if (uteis.length && Math.random() < esperteza) {
        const melhor = Math.min(...uteis.map(p => maiorGrupo(candidatos, p.id)));
        escolhida = sortear(uteis.filter(p => maiorGrupo(candidatos, p.id) === melhor));
      } else {
        escolhida = sortear(uteis.length && Math.random() < 0.5 ? uteis : livres);
      }
      perguntar(sala, bot, { qid: escolhida.id });
    }
  } catch (erro) {
    console.error('Bot travou:', erro);
    proximaVez(sala);
  }
  transmitir(sala);
}

// ---------- estado enviado pro navegador ----------

function visao(sala, eu) {
  const atual = sala.fase === 'jogo' ? sala.jogadores[sala.vez] : null;
  return {
    agora: Date.now(),
    sala: sala.codigo, modo: sala.modo, eu: eu.id, dono: sala.dono, fase: sala.fase,
    dificuldade: sala.dificuldade, categoria: sala.categoria,
    total: TOTAL_PERGUNTAS, restantes: sala.restantes,
    vezDe: atual?.id ?? null, prazo: sala.prazo,
    quemEscolhe: sala.quemEscolhe, mestreId: sala.mestreId,
    pendente: sala.pendente,
    meuSegredo: eu.id === sala.mestreId ? sala.segredo?.nome ?? null : null,
    dicasMax: sala.modo === 'solo' ? 2 : 1,
    minhasDicas: eu.dicas,
    jogadores: sala.jogadores.map(j => ({
      id: j.id, nome: j.nome, bot: j.bot, online: j.online, pula: j.pula,
      dicasUsadas: j.dicas.length, seguidos: j.seguidos, combo: j.combo, sims: j.sims, errados: j.errados,
      // durante a partida: quanto faria acertando agora; no fim: pontuacao final
      pontos: sala.fim ? sala.fim.extratos[j.id]?.total ?? 0
        : sala.fase !== 'jogo' ? 0
        : j.id === sala.mestreId ? (TOTAL_PERGUNTAS - sala.restantes) * 100
        : maximoAgora(sala, j),
    })),
    historico: sala.historico.map(({ alvo, ...h }) => h),
    fim: sala.fim,
  };
}

function transmitir(sala) {
  for (const j of sala.jogadores) {
    if (!j.conexoes.size) continue;
    const v = visao(sala, j);
    for (const c of j.conexoes) c.enviar(v);
  }
}

// ---------- acoes ----------

function credenciais(sala, j) {
  return { sala: sala.codigo, id: j.id, token: j.token };
}

const ACOES_SEM_SALA = {
  criar({ nome, codigo }) {
    const n = limparNome(nome);
    const sala = novaSala('multi', codigo);
    const j = adicionarJogador(sala, n);
    sala.dono = j.id;
    return credenciais(sala, j);
  },

  entrar({ nome, codigo }) {
    const n = limparNome(nome);
    const sala = salas.get(String(codigo || '').trim().toUpperCase());
    if (!sala || sala.modo !== 'multi') falha('Não achei nenhuma sala com esse código.');
    if (sala.fase !== 'lobby') falha('Essa sala já está no meio de uma partida. Espere acabar!');
    if (sala.jogadores.length >= MAX_JOGADORES) falha(`A sala está cheia (máximo ${MAX_JOGADORES}).`);
    const j = adicionarJogador(sala, n);
    transmitir(sala);
    return credenciais(sala, j);
  },

  solo({ nome, dificuldade, categoria }) {
    const n = limparNome(nome);
    const sala = novaSala('solo');
    sala.dificuldade = DIFICULDADES[dificuldade] ? dificuldade : 'medio';
    sala.categoria = CATEGORIAS[categoria] ? categoria : 'surpresa';
    const j = adicionarJogador(sala, n);
    sala.dono = j.id;
    adicionarJogador(sala, `🤖 ${NOMES_BOT[sala.dificuldade]}`, true);
    j.online = true; // a conexao chega logo em seguida; nao deixa o bot pular a pessoa
    iniciarPartida(sala);
    return credenciais(sala, j);
  },
};

const ACOES_NA_SALA = {
  config(sala, j, { dificuldade, categoria, quemEscolhe }) {
    if (sala.dono !== j.id) falha('Só o dono da sala pode mudar isso.');
    if (sala.fase !== 'lobby') falha('A partida já começou.');
    if (DIFICULDADES[dificuldade]) sala.dificuldade = dificuldade;
    if (CATEGORIAS[categoria]) sala.categoria = categoria;
    if (quemEscolhe === 'jogo' || quemEscolhe === 'mestre') sala.quemEscolhe = quemEscolhe;
  },

  iniciar(sala, j) {
    if (sala.dono !== j.id) falha('Só o dono da sala pode começar.');
    if (sala.fase !== 'lobby') falha('A partida já começou.');
    if (sala.jogadores.length < 2) falha('Precisa de pelo menos 2 jogadores. Mande o código pros amigos!');
    iniciarPartida(sala);
  },

  perguntar: (sala, j, dados) => perguntar(sala, j, dados),
  segredo: (sala, j, dados) => definirSegredo(sala, j, dados),
  responder: (sala, j, dados) => mestreResponde(sala, j, dados),
  julgar: (sala, j, dados) => mestreJulga(sala, j, dados),
  chutar: (sala, j, { texto }) => chutar(sala, j, texto),
  dica: (sala, j) => pedirDica(sala, j),

  revanche(sala, j) {
    if (sala.dono !== j.id) falha('Só o dono da sala pode reiniciar.');
    if (sala.fase !== 'fim') falha('A partida ainda não acabou.');
    if (sala.modo === 'solo') return iniciarPartida(sala);
    sala.fase = 'lobby';
    sala.fim = null;
    sala.historico = [];
    // no modo mestre a categoria e' escolhida pelo mestre; volta pro padrao na sala
    if (temMestre(sala)) sala.categoria = 'surpresa';
    for (const p of sala.jogadores) Object.assign(p, placarZerado(), { dicas: [], pula: false });
  },

  sair(sala, j) {
    removerJogador(sala, j);
  },
};

export function executar(corpo) {
  const { acao } = corpo;
  if (Object.hasOwn(ACOES_SEM_SALA, acao)) return ACOES_SEM_SALA[acao](corpo);
  if (!Object.hasOwn(ACOES_NA_SALA, acao)) falha('Ação desconhecida.');
  const sala = salas.get(corpo.sala) || falha('Essa sala não existe mais.');
  const j = sala.jogadores.find(p => p.id === corpo.id && p.token === corpo.token) || falha('Você não está nessa sala.');
  ACOES_NA_SALA[acao](sala, j, corpo);
  if (salas.has(sala.codigo)) transmitir(sala);
  return { ok: true };
}

// ---------- conexoes ----------
// Uma conexao e' { enviar(visao), fechar?(motivo) }: a tela local ou um amigo pela rede.

function acharJogador({ sala: codigo, id, token }) {
  const sala = salas.get(codigo);
  const j = sala?.jogadores.find(p => p.id === id && p.token === token);
  return j ? { sala, j } : null;
}

export function conectar(cred, conexao) {
  const achou = acharJogador(cred) || falha('Essa sala não existe mais.');
  const { sala, j } = achou;
  j.conexoes.add(conexao);
  j.online = true;
  j.offlineDesde = null;
  transmitir(sala);
}

export function desconectar(cred, conexao) {
  const achou = acharJogador(cred);
  if (!achou) return;
  const { sala, j } = achou;
  j.conexoes.delete(conexao);
  if (j.conexoes.size) return;
  j.online = false;
  j.offlineDesde = Date.now();
  // Se era a vez de quem caiu, passa pro proximo depois de alguns segundos (pode ser so um F5)
  setTimeout(() => {
    if (!j.online && sala.fase === 'jogo' && sala.jogadores[sala.vez] === j && salas.has(sala.codigo)) {
      proximaVez(sala);
      transmitir(sala);
    }
  }, 8000);
  transmitir(sala);
}

export function fecharSala(codigo) {
  const sala = salas.get(codigo);
  if (sala) apagarSala(sala);
}

// Tira do lobby quem caiu e apaga salas abandonadas
setInterval(() => {
  const agora = Date.now();
  for (const sala of salas.values()) {
    if (sala.fase === 'lobby') {
      for (const j of [...sala.jogadores]) {
        if (!j.online && !j.bot && agora - j.offlineDesde > 20_000) removerJogador(sala, j);
      }
    }
    const alguemOnline = sala.jogadores.some(j => !j.bot && j.online);
    if (alguemOnline) sala.vazioDesde = null;
    else if (!sala.vazioDesde) sala.vazioDesde = agora;
    else if (agora - sala.vazioDesde > 5 * 60_000) apagarSala(sala);
  }
}, 15_000);

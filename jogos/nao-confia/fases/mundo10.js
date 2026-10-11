// Mundo 10: O Fim (Mentira)
'use strict';

FASES.push(
  {
    nome: 'Créditos Falsos', mundo: 9, motivoQueda: 'CAIU DOS CRÉDITOS',
    montar(L) {
      L.chao(0, 4);
      L.espinhos(5, 17, 21);
      L.solido(26, 3, 6, 1);
      L.inicio(2, 15);
      L.porta(29, 3);
      // Os creditos sobem pela tela. Da pra subir neles.
      const nomes = ['FIM', 'OBRIGADO POR JOGAR!', 'IDEIA: DAVI', 'PROGRAMAÇÃO: CLAUDE', 'TESTES: UM ROBÔ TEIMOSO',
        'NENHUMA PORTA SE MACHUCOU', 'BRINCADEIRA...', '...AINDA TEM FASE', 'SOBE MAIS UM POUCO', 'QUASE LÁ'];
      L.creditos = [];
      let n = 0;
      L.coisa({ update() {
        if (L.t % 62 === 1) {
          const lado = n % 2;
          const b = L.bloco(lado ? 15 : 6, 0, 8, 1, { y: H + 10, nome: nomes[n % nomes.length], lado,
            desenhar: bl => {
              ctx.fillStyle = '#222';
              ctx.fillRect(bl.x, bl.y, bl.w, bl.h);
              ctx.fillStyle = '#ff3b3b';
              ctx.fillRect(bl.x, bl.y, bl.w, 4);
              texto(bl.nome, bl.x + bl.w / 2, bl.y + 17, { tam: 13, contorno: null });
            } });
          b.update = () => { b.y -= 1.2; if (b.y < -40) { b.solido = false; b.visivel = false; } };
          L.creditos.push(b);
          n++;
        }
      } });
      L.placa(15, 9, ['', 'OS CRÉDITOS SÃO SÓLIDOS', 'SOBE NOS NOMES']);
    },
  },
  {
    nome: 'Fase Normal', mundo: 9,
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(15, 10, ['ESSA É NORMAL, JURO', 'SÉRIO, É NORMAL', 'COMO VOCÊ MORREU NUMA FASE NORMAL?', 'NÃO TEM NADA AQUI']);
    },
  },
  {
    nome: 'Tudo de Novo', mundo: 9, motivoQueda: 'CAIU DE NOVO',
    montar(L) {
      L.chao(0, 3);
      L.chao(9, 25);
      L.espinhos(26, 17, 6);
      L.inicio(1, 15);
      L.placa(10, 9, ['LEMBRA DESSAS?', 'TUDO QUE VOCÊ JÁ VIU', 'REVISÃO PRA PROVA']);
      // Checkpoint falso, chao que desaba, muro baixinho e a porta fujona 2.0, tudo junto
      const pisos = [];
      for (let c = 4; c <= 8; c++) pisos.push(L.bloco(c, 16, 1, 2));
      bandeira(L, 6, () => { dizer('CHECKPOINT SALVO! :)'); L.depois(0.3, () => derrubar(pisos, 1)); });
      desmoronar(L, 12, 14);
      L.solido(17, 15, 1, 1);
      const d = L.porta(22, 16, { olhos: true });
      d.update = () => {
        const dir = p.cmd?.dir || 0;
        if (dir > 0) d.x += 5.5;
        else if (dir < 0) d.x -= 6;
        d.x = limitar(d.x, 18 * T, W - d.w);
      };
    },
  },
  {
    nome: 'Espelho Total', mundo: 9,
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(8, 15, 1);
      L.espinhos(14, 15, 1);
      L.espinhos(20, 15, 1);
      L.buraco(25, 26);
      L.porta(29, 16);
      L.placa(15, 9, ['TUDO NORMAL POR AQUI', 'NADA ESTRANHO', 'ESQUERDA É ESQUERDA']);
      // So o desenho esta espelhado. Os controles continuam iguais.
      L.visual = 'espelho';
    },
  },
  {
    nome: 'De Cabeça pra Baixo', mundo: 9,
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(9, 15, 1);
      L.espinhos(16, 15, 1);
      L.buraco(21, 22);
      L.porta(29, 16);
      L.placa(15, 10, ['VIRA O MONITOR', 'PLANTA BANANEIRA', 'TÁ TUDO CERTO']);
      L.visual = 'cabeca';
    },
  },
  {
    nome: 'Contagem Regressiva', mundo: 9, motivoQueda: 'CORREU DEMAIS',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(29, 16);
      // O chao de alguns pedacos so existe depois que o tempo acaba
      const DURACAO = 360;
      const falsos = [[8, 10], [15, 17], [22, 24]].map(([c0, c1]) => {
        L.solido(c0, 16, c1 - c0 + 1, 2, 0);
        L.espinhos(c0, 17, c1 - c0 + 1);
        return L.bloco(c0, 16, c1 - c0 + 1, 1, { solido: false });
      });
      L.coisa({
        update() {
          if (L.t === DURACAO) {
            for (const b of falsos) b.solido = true;
            dizer('BRINCADEIRA 🙂 PODE IR', 90);
            som('risada');
          }
        },
        draw() {
          if (L.t >= DURACAO) return;
          const s = Math.ceil((DURACAO - L.t) / 60);
          texto('CORRE! A FASE VAI EXPLODIR!', W / 2, 5 * T, { tam: 26, cor: '#ff3b3b' });
          texto(String(s), W / 2, 8 * T, { tam: 80, cor: '#ff3b3b' });
        },
      });
      L.contagem = DURACAO;
    },
  },
  {
    nome: 'Dois de Você', mundo: 9, motivo: 'ESPETADO (OS DOIS)',
    montar(L) {
      L.chao();
      L.teto(1);
      L.inicio(2, 15);
      L.espinhos(14, 15, 1);
      L.espinhos(26, 15, 1);
      L.espinhos(7, 2, 1, 'baixo');
      L.espinhos(21, 2, 1, 'baixo');
      L.porta(30, 16);
      L.placa(15, 8, ['VOCÊ TEM UM GÊMEO NO TETO', 'CUIDA DELE TAMBÉM', 'SE ELE MORRE, VOCÊ MORRE']);
      // O clone e' o seu reflexo no teto. Se ele espetar, voce morre junto.
      L.coisa({
        update() {
          const clone = { x: p.x + 3, y: H - (p.y + p.h) + 3, w: p.w - 6, h: p.h - 6 };
          if (L.perigos.some(e => e.dir === 'baixo' && toca(clone, caixaDoPerigo(e)))) morrer('SEU CLONE ESPETOU (E VOCÊ JUNTO)');
        },
        draw() {
          if (estado === 'morto') return;
          const y = H - (p.y + p.h);
          ctx.fillStyle = '#2b1a0a';
          ctx.fillRect(p.x - 2, y - 2, p.w + 4, p.h + 4);
          ctx.fillStyle = '#4dd6ff';
          ctx.fillRect(p.x, y, p.w, p.h);
          ctx.fillStyle = '#fff';
          ctx.fillRect(p.x + 4 + p.olhar * 2.5, y + p.h - 13, 5, 7);
          ctx.fillRect(p.x + 12 + p.olhar * 2.5, y + p.h - 13, 5, 7);
        },
      });
    },
  },
  {
    nome: 'Sem Pulo', mundo: 9,
    montar(L) {
      L.chao(0, 8);
      L.chao(12, 31);
      L.espinhos(9, 17, 3);
      L.solido(18, 13, 1, 3);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(10, 9, ['PULE O BURACO!', 'APERTA PRA PULAR!', 'PULA, VAI!']);
      // O botao de pular quebrou. As molas fazem o servico.
      L.semPulo = true;
      mola(L, 7, 16, 12);
      mola(L, 15, 16, 12);
      L.desenharHudExtra = () => texto('PULO: QUEBRADO ✖', 82, 60, { tam: 13, cor: '#ff3b3b', contorno: '#000' });
    },
  },
  {
    nome: 'A Penúltima', mundo: 9,
    montar(L, tentativa) {
      L.chao();
      L.inicio(2, 15);
      L.placa(15, 7, 'TEM CERTEZA QUE QUER IR PRA ÚLTIMA FASE?');
      const [cSim, cNao] = tentativa % 2 ? [13, 24] : [24, 13];
      L.porta(cSim, 16, { rotulo: 'SIM', aoTocar: () => morrer('A RESPOSTA CERTA ERA NÃO') });
      L.porta(cNao, 16, { rotulo: 'NÃO' });
    },
  },
  {
    nome: 'A Porta Final', mundo: 9, motivo: 'A PORTA FINAL VENCEU',
    montar(L) {
      L.chao(0, 25);
      L.espinhos(26, 17, 6);
      L.inicio(3, 15);
      L.placa(10, 10, ['ÚLTIMA FASE. PEGA A PORTA!', 'ÚLTIMA FASE. CORRE ATRÁS DELA!', 'VAI, É SÓ PEGAR!']);
      // Fase 1: foge. Fase 2: cospe espinho do alto. Fase 3: se esconde no escuro.
      const chefe = { fase: 1, t: 0, tiros: 0 };
      L.chefe = chefe;
      const d = L.porta(22, 16, { olhos: true, dentes: true });
      chefe.porta = d;
      d.aoTocar = () => {
        if (chefe.fase === 1) {
          chefe.fase = 2;
          chefe.t = 0;
          d.olhos = true;
          d.y = 2 * T;
          d.x = W / 2 - 15;
          som('risada');
          dizer('AINDA NÃO!', 70);
          L.placas.length = 0;
        } else if (chefe.fase === 3) {
          vencer();
        }
      };
      d.update = () => {
        chefe.t++;
        if (chefe.fase === 1) {
          const dir = p.cmd?.dir || 0;
          if (dir > 0) d.x += 5.5;
          else if (dir < 0) d.x -= 6;
          d.x = limitar(d.x, 0, W - d.w);
        } else if (chefe.fase === 2) {
          d.x += limitar(centroX() - (d.x + 15), -1.5, 1.5);
          if (chefe.t % 45 === 0 && chefe.tiros < 6) {
            chefe.tiros++;
            projetil(L, d.x + 4, d.y + 46, 0, 0, { grav: 0.4, motivo: 'A PORTA CUSPIU ESPINHO' });
            som('tiro');
          }
          if (chefe.tiros >= 6 && chefe.t > 45 * 6 + 60) {
            chefe.fase = 3;
            chefe.t = 0;
            d.y = 16 * T - 45;
            d.x = 15 * T;
            d.olhos = false;
            d.dentes = false;
            d.vx = 1.2;
            L.escuro = { raio: 80, relampago: 170, luzes: [] };
            L.espinhos(8, 15, 1).forEach(e => { e.escala = 0; });
            L.espinhos(20, 15, 1).forEach(e => { e.escala = 0; });
            dizer('APAGUEI A LUZ!', 70);
          }
        } else if (chefe.fase === 3) {
          d.x += d.vx;
          if (d.x < 4 * T || d.x > 24 * T) d.vx *= -1;
          L.escuro.luzes = [{ x: d.x + 15, y: d.y + 22, r: 34 }];
        }
      };
    },
  },
);

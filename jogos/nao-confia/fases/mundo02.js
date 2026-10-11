// Mundo 2: Caverna da Mentira
'use strict';

FASES.push(
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
  {
    nome: 'Apagaram a Luz', mundo: 1,
    montar(L) {
      L.chao();
      L.teto();
      L.inicio(2, 15);
      L.buraco(8, 9);
      L.buraco(15, 16);
      L.buraco(21, 22);
      // A porta que brilha e' um vagalume. A de verdade esta no escuro.
      L.porta(26, 16, { cor: '#ffe680', aoTocar: () => morrer('ERA UM VAGALUME') });
      L.porta(30, 16);
      L.placa(5, 12, ['SIGA A LUZ', 'SIGA A LUZ (CONFIA)', 'A LUZ É SUA AMIGA']);
      L.escuro = { raio: 80, relampago: 210, luzes: [{ x: 26 * T + 15, y: 16 * T - 22, r: 55 }] };
    },
  },
  {
    nome: 'Não Pegue Nada', mundo: 1, motivo: 'GRANDE DEMAIS PRO TÚNEL',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.placa(8, 11, ['MOEDAS GRÁTIS!', 'PEGA, É DE GRAÇA!', 'MOEDA DÁ SORTE!']);
      for (const c of [6, 10, 14, 18]) {
        moeda(L, c, 16, () => {
          // Cada moeda te deixa maior. O tunel tem espinho no teto.
          p.y -= 22;
          p.h += 22;
          p.x -= 3;
          p.w += 6;
          dizer('VOCÊ CRESCEU!', 50);
        });
      }
      L.solido(22, 0, 6, 14);
      L.espinhos(22, 14, 6, 'baixo');
      for (let r = 9; r <= 13; r++) L.espinhos(21, r, 1, 'esq');
      L.porta(29, 16);
    },
  },
  {
    nome: 'Trampolim Traíra', mundo: 1, motivo: 'TRAMPOLINADO NO TETO',
    montar(L) {
      L.chao();
      L.teto(5);
      L.espinhos(0, 6, 32, 'baixo');
      L.inicio(2, 15);
      L.solido(14, 12, 2, 4);
      // Segurar o pulo na mola te joga no teto. Soltar da' o pulo certinho.
      mola(L, 11, 16, cmd => (cmd?.segurando ? 17 : 12.5));
      L.placa(8, 10, ['SEGURA O PULO NA MOLA!', 'PULA COM VONTADE!', 'MAIS FORÇA!']);
      L.porta(29, 16);
    },
  },
  {
    nome: 'Bloco Surpresa', mundo: 1, motivoQueda: 'SURPRESA!',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.buraco(12, 14);
      const surpresa = L.bloco(13, 12, 1, 1, { desenhar: b => {
        ctx.fillStyle = b.usado ? '#8a6a3a' : '#f2b631';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#7a4f10';
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
        if (!b.usado) texto('?', b.x + 15, b.y + 16, { tam: 22, contorno: '#7a4f10' });
      } });
      L.aoBaterCabeca = s => {
        if (s !== surpresa || surpresa.usado) return;
        surpresa.usado = true;
        som('risada');
        dizer('SURPRESA!', 50);
        projetil(L, surpresa.x + 4, surpresa.y + 30, 0, 2, { grav: 0.5, motivo: 'A SURPRESA ERA UMA BOMBA' });
      };
      L.placa(9, 9, ['BLOCO DE PRÊMIO!', 'BATE A CABEÇA NELE!', 'TEM PRÊMIO DENTRO!']);
      L.espinhos(22, 15, 1);
      L.porta(29, 16);
    },
  },
  {
    nome: 'A Enchente de Lava', mundo: 1, motivo: 'VIROU CHURRASCO',
    montar(L) {
      L.chao(0, 6);
      L.inicio(2, 15);
      L.solido(7, 13, 3, 1);
      L.solido(12, 10, 3, 1);
      const quebra = [];
      for (let c = 17; c <= 19; c++) quebra.push(L.bloco(c, 7, 1, 1));
      L.solido(22, 4, 10, 1);
      L.porta(29, 4);
      L.placa(4, 11, ['SOBE!', 'SOBE RÁPIDO!', 'NÃO OLHA PRA BAIXO!']);
      // A plataforma do meio desaba logo depois que voce pisa
      let pisou = false;
      L.aoPousar = () => {
        if (!pisou && quebra.includes(p.chaoBloco)) {
          pisou = true;
          L.depois(0.4, () => { som('crack'); derrubar(quebra, 1); });
        }
      };
      const lava = { x: 0, y: H + 20, w: W, h: H, tipo: 'lava', ativo: true, visivel: true, motivo: 'VIROU CHURRASCO',
        update() { if (L.t > 60) lava.y -= 0.7; },
        desenhar() {
          ctx.fillStyle = '#ff5a1f';
          ctx.beginPath();
          ctx.moveTo(0, lava.y);
          for (let x = 0; x <= W; x += 30) ctx.lineTo(x, lava.y + Math.sin(x / 40 + quadro / 10) * 5);
          ctx.lineTo(W, H);
          ctx.lineTo(0, H);
          ctx.fill();
          ctx.fillStyle = '#ffb02e';
          ctx.fillRect(0, lava.y + 8, W, 4);
        } };
      L.perigos.push(lava);
    },
  },
);

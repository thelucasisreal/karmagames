// Mundo 3: Castelo do Capeta
'use strict';

FASES.push(
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
    nome: 'Duas Portas', mundo: 2,
    montar(L, tentativa) {
      L.chao();
      L.inicio(2, 15);
      // A de verdade e' sempre a "MORTE". E elas trocam de lugar a cada morte.
      const [cSaida, cMorte] = tentativa % 2 ? [13, 25] : [25, 13];
      L.porta(cSaida, 16, { rotulo: 'SAÍDA', aoTocar: () => morrer('A SAÍDA ERA PRO OUTRO LADO') });
      L.porta(cMorte, 16, { rotulo: 'MORTE', cor: '#5a2a2a' });
      L.placa(7, 11, ['ESCOLHE BEM...', 'ESCOLHE MELHOR...', 'AGORA VAI...']);
    },
  },
  {
    nome: 'Canhão Educado', mundo: 2, motivo: 'BOLADA NA CARA',
    montar(L, tentativa) {
      L.chao();
      L.inicio(2, 15);
      L.porta(27, 16);
      L.placa(9, 11, ['BOM DIA! 🙂', 'BOA TARDE! 🙂', 'BOA NOITE! 🙂']);
      canhao(L, 30, 15, -1, { periodo: 75, vel: 4, fase: 40 + (tentativa % 3) * 8 });
      canhao(L, 30, 12, -1, { periodo: 75, vel: 5, fase: 77 + (tentativa % 3) * 8 });
      L.solido(31, 11, 1, 5);
    },
  },
  {
    nome: 'Lasers Pisca-Pisca', mundo: 2,
    montar(L) {
      L.chao();
      L.teto();
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(4, 11, ['DICA: PULE OS LASERS', 'PULAR AJUDA!', 'PULA, CONFIA']);
      // Pular liga todos os lasers por um tempinho
      let ligadoAte = 0;
      L.lasers = [7, 12, 17, 22].map((c, i) => {
        const e = laser(L, c, 2, 15, { ligado: 50, desligado: 70, fase: i * 31 });
        e.cicloFase = i * 31;
        const normal = e.update;
        e.update = () => {
          normal();
          if (L.t < ligadoAte) e.ativo = true;
        };
        return e;
      });
      L.aoPular = () => { ligadoAte = L.t + 35; som('laser'); };
    },
  },
  {
    nome: 'A Chave É Mentira', mundo: 2,
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.placa(8, 10, ['PEGUE A CHAVE PRA ABRIR A PORTA', 'A PORTA TÁ TRANCADA, VIU?', 'SEM CHAVE NÃO ROLA']);
      const porta = L.porta(28, 16, { rotulo: '🔒' });
      const chave = L.coisa({ x: 15 * T + 3, y: 16 * T - 24, w: 24, h: 24, pega: false,
        update() {
          if (chave.pega || !toca(chave, corpoJogador())) return;
          chave.pega = true;
          som('risada');
          dizer('AGORA SIM ELA TRANCOU', 80);
          porta.rotulo = '🔒🔒🔒';
          porta.aoTocar = () => morrer('TRANCADA DE VERDADE');
          L.espinhos(24, 15, 3);
        },
        draw() {
          if (chave.pega) return;
          const y = chave.y + Math.sin(quadro / 12) * 3;
          ctx.strokeStyle = '#ffd23f';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(chave.x + 7, y + 10, 6, 0, Math.PI * 2);
          ctx.moveTo(chave.x + 13, y + 10);
          ctx.lineTo(chave.x + 24, y + 10);
          ctx.moveTo(chave.x + 20, y + 10);
          ctx.lineTo(chave.x + 20, y + 16);
          ctx.stroke();
        },
      });
    },
  },
  {
    nome: 'Corredor Infinito', mundo: 2, saidaEsquerda: true,
    montar(L) {
      L.chao();
      L.inicio(4, 15);
      // A parede da esquerda e' so desenho
      L.bloco(0, 0, 1, 16, { solido: false });
      L.placa(10, 11, '→ SAÍDA LOGO ALI →');
      const contador = L.placa(16, 6, '');
      let voltas = 0;
      L.coisa({
        update() {
          if (p.x + p.w >= W - 1 && p.cmd?.dir > 0) {
            voltas++;
            p.x = T + 2;
            poof(W - 10, p.y + 13);
            som('risadinha');
            contador.txt = ['VOLTA 1/∞', 'VOLTA 2/∞', 'TÁ GOSTANDO?', 'CONTINUA...', 'NÃO CANSOU?'][Math.min(voltas, 5) - 1];
            if (voltas === 3) L.espinhos(15, 15, 1);
            if (voltas === 5) { L.espinhos(9, 15, 1); L.espinhos(21, 15, 1); }
          }
        },
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
);

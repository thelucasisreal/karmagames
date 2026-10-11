// Mundo 4: Deserto da Miragem
'use strict';

FASES.push(
  {
    nome: 'Miragem', mundo: 3, motivoQueda: 'ERA MIRAGEM',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.buraco(17, 20);
      L.placa(8, 11, ['UM OÁSIS! COM PORTA!', 'ÁGUA FRESQUINHA →', 'A PORTA TÁ NA ÁGUA →']);
      // Lago bonito por cima do buraco (so desenho) e uma porta que some quando chega perto
      const miragem = L.porta(18, 16, { saida: false, alfa: 1 });
      miragem.update = () => {
        const dist = Math.abs(miragem.x + 15 - centroX());
        if (dist < 110) miragem.alfa = Math.max(0, miragem.alfa - 0.08);
        miragem.visivel = miragem.alfa > 0.05;
      };
      L.coisa({ draw() {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#4fc3f7';
        ctx.fillRect(17 * T, 16 * T, 4 * T, 8);
        ctx.fillStyle = '#b3e5fc';
        ctx.fillRect(17 * T + ((quadro * 0.7) % 120), 16 * T + 2, 30, 2);
        ctx.globalAlpha = 1;
      } });
      // O cacto e' a saida de verdade
      const cacto = L.coisa({ x: 27 * T + 5, y: 16 * T - 50, w: 20, h: 50,
        update() { if (toca(cacto, corpoJogador())) vencer(); },
        draw() {
          ctx.fillStyle = '#3f9a4a';
          ctx.fillRect(cacto.x + 6, cacto.y, 9, 50);
          ctx.fillRect(cacto.x - 2, cacto.y + 14, 8, 6);
          ctx.fillRect(cacto.x - 2, cacto.y + 6, 5, 12);
          ctx.fillRect(cacto.x + 15, cacto.y + 22, 8, 6);
          ctx.fillRect(cacto.x + 18, cacto.y + 12, 5, 14);
        } });
    },
  },
  {
    nome: 'Areia Movediça', mundo: 3, motivo: 'ENGOLIDO PELA AREIA',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(10, 11, ['PULA RÁPIDO PRA NÃO AFUNDAR!', 'SE DEBATE QUE SAI!', 'PULA, PULA!']);
      const pocas = [[8, 13], [18, 23]];
      for (const [c0, c1] of pocas) L.solido(c0, 16, c1 - c0 + 1, 2, 0);
      // Na areia voce afunda devagar. Pular faz afundar de vez.
      let afundou = 0;
      L.coisa({
        update() {
          const dentro = pocas.some(([c0, c1]) => p.x + p.w > c0 * T + 4 && p.x < (c1 + 1) * T - 4 && p.y + p.h > 16 * T - 6);
          p.semGravidade = dentro;
          p.velMult = dentro ? 0.45 : 1;
          if (dentro) {
            p.vy = 0.12;
            p.noChao = true; // deixa subir de volta no chao firme
            if (p.y + p.h > 16 * T + 22) morrer('ENGOLIDO PELA AREIA');
          }
          afundou = dentro;
        },
        draw() {
          for (const [c0, c1] of pocas) {
            ctx.fillStyle = '#b8864a';
            ctx.fillRect(c0 * T, 16 * T, (c1 - c0 + 1) * T, 2 * T);
            ctx.fillStyle = '#9c6f38';
            for (let i = 0; i < 6; i++) {
              const x = c0 * T + ((i * 47 + quadro * 0.3) % ((c1 - c0 + 1) * T));
              ctx.beginPath();
              ctx.arc(x, 16 * T + 12 + (i % 3) * 14, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        },
      });
      L.filtrarComando = cmd => {
        if (afundou && cmd.apertou) {
          cmd.apertou = false;
          p.y += 12;
          dizer('NÃO SE DEBATA!', 40);
        }
        return cmd;
      };
    },
  },
  {
    nome: 'A Porta Fujona 3.0', mundo: 3, motivo: 'A PORTA BATEU NA SUA CARA',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.placa(10, 11, ['ELA É TÍMIDA, NÃO OLHA PRA ELA', 'NÃO ENCARA A PORTA', 'DÁ AS COSTAS PRA ELA']);
      // So deixa entrar quem chega de costas (olhando pra esquerda)
      L.porta(18, 16, { olhos: true, aoTocar: () => (p.olhar < 0 ? vencer() : morrer('A PORTA BATEU NA SUA CARA')) });
      L.espinhos(26, 15, 6);
    },
  },
  {
    nome: 'Sol Escaldante', mundo: 3, motivo: 'TORROU NO SOL',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(7, 7, ['PROTETOR SOLAR: NÃO TEM', 'TÁ QUENTE, HEIN', 'FICA NA SOMBRA']);
      const sombras = [[7, 8], [17, 18], [24, 25]].map(([c0, c1]) => {
        L.solido(c0, 11, c1 - c0 + 1, 1);
        return { c0, c1 };
      });
      // A sombra do meio e' uma nuvem que foge quando voce chega
      const nuvem = L.bloco(11, 10, 3, 1, { solido: false, desenho: 'nuvem', fugiu: false });
      nuvem.update = () => {
        if (!nuvem.fugiu && centroX() > nuvem.x - 10) { nuvem.fugiu = true; som('risadinha'); }
        if (nuvem.fugiu) nuvem.y -= 3;
      };
      let calor = 0;
      L.coisa({
        update() {
          const cx = centroX();
          const naSombra = sombras.some(s => cx > s.c0 * T && cx < (s.c1 + 1) * T && p.y > 11 * T)
            || (!nuvem.fugiu && cx > nuvem.x && cx < nuvem.x + nuvem.w);
          calor = limitar(calor + (naSombra ? -3 : 1.8), 0, 100);
          if (calor >= 100) morrer('TORROU NO SOL');
        },
        draw() {
          ctx.fillStyle = '#fff3a0';
          ctx.beginPath();
          ctx.arc(W / 2, 40, 30 + Math.sin(quadro / 8) * 3, 0, Math.PI * 2);
          ctx.fill();
        },
      });
      L.desenharHudExtra = () => {
        ctx.fillStyle = '#000000aa';
        ctx.fillRect(12, 50, 140, 16);
        ctx.fillStyle = calor > 70 ? '#ff3b3b' : '#ffb02e';
        ctx.fillRect(14, 52, 136 * (calor / 100), 12);
        texto('🌡️ CALOR', 82, 58, { tam: 11, contorno: '#000' });
      };
      L.calor = () => calor;
    },
  },
  {
    nome: 'Tempestade de Areia', mundo: 3, motivo: 'VOOU COM O VENTO',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(29, 16);
      L.espinhos(0, 15, 1);
      L.placa(9, 10, ['ANDA CONTRA O VENTO!', 'FORÇA NAS PERNAS!', 'SEGURA FIRME NO CHÃO!']);
      // No chao o vento te empurra pra tras; no ar ele te ajuda
      L.coisa({
        update() {
          p.empurrao = p.noChao ? -0.62 : 0.3;
          if (L.t % 2 === 0) particula(W + 5, Math.random() * H, -8 - Math.random() * 4, 0, '#e8c48a', 120, 3, 0);
        },
      });
    },
  },
  {
    nome: 'Pirâmide Pegadinha', mundo: 3, saidaBaixo: true, motivo: 'TUTANCÂMON MANDOU UM ABRAÇO',
    montar(L) {
      L.chao();
      L.teto(1);
      L.inicio(2, 15);
      L.solido(12, 13, 3, 3);
      L.solido(16, 10, 3, 6);
      L.solido(20, 7, 12, 9);
      L.placa(24, 4, 'TESOURO ↓');
      const teto = L.bloco(20, 2, 12, 1, { tremor: 0 });
      L.porta(28, 7, { rotulo: 'TESOURO', aoTocar: () => {
        teto.update = () => { teto.y += 14; if (toca(teto, corpoJogador())) morrer('O TETO DESABOU'); };
      } });
      // O bloco rachado do comeco quebra depois de 3 pulos em cima dele
      L.solido(6, 16, 1, 2, 0);
      const rachado = L.bloco(6, 16, 1, 1, { pulos: 0, desenhar: b => {
        desenharBloco(b.x, b.y, b.w, b.h, L.mundo);
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (b.pulos >= 0) { ctx.moveTo(b.x + 6, b.y + 8); ctx.lineTo(b.x + 16, b.y + 18); }
        if (b.pulos >= 1) { ctx.lineTo(b.x + 24, b.y + 12); }
        if (b.pulos >= 2) { ctx.moveTo(b.x + 16, b.y + 18); ctx.lineTo(b.x + 12, b.y + 28); }
        ctx.stroke();
      } });
      L.aoPousar = () => {
        if (p.chaoBloco !== rachado) return;
        rachado.pulos++;
        som('crack');
        if (rachado.pulos >= 3) {
          rachado.solido = false;
          rachado.visivel = false;
          poof(rachado.x + 15, rachado.y + 15);
          dizer('CRACK!', 40);
        }
      };
      L.placa(6, 13, ['', '', 'HMM, RACHADO...']);
    },
  },
  {
    nome: 'Cobra Cascavel', mundo: 3, motivo: 'A COBRA DEU O BOTE',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(8, 10, ['PULA A COBRA!', 'PULA ALTO!', 'PULA ELA, VAI!']);
      // Ela so morde quem passa pulando. Por baixo do nariz dela, de boa.
      const cobra = L.perigos[L.perigos.push({ x: 15 * T, y: 16 * T - 18, w: 60, h: 18, tipo: 'cobra', ativo: true, visivel: true, bote: 0, motivo: 'A COBRA DEU O BOTE',
        hit: [0, -2, 60, 2],
        update() {
          const perto = Math.abs(centroX() - (cobra.x + 30)) < 90;
          if (!p.noChao && perto) cobra.bote = Math.min(1, cobra.bote + 0.25);
          else cobra.bote = Math.max(0, cobra.bote - 0.08);
          const alt = 18 + cobra.bote * 110;
          cobra.hit = [10, 18 - alt, 40, alt - 14];
          cobra.ativo = cobra.bote > 0.2;
        },
        desenhar() {
          const alt = 18 + cobra.bote * 110;
          ctx.fillStyle = '#8bc34a';
          ctx.beginPath();
          ctx.roundRect(cobra.x, cobra.y + 6, 60, 12, 6);
          ctx.fill();
          ctx.fillRect(cobra.x + 20, cobra.y + 18 - alt, 16, alt - 6);
          ctx.fillStyle = '#558b2f';
          ctx.beginPath();
          ctx.ellipse(cobra.x + 28, cobra.y + 18 - alt, 13, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillRect(cobra.x + 22, cobra.y + 14 - alt, 4, 4);
          ctx.fillRect(cobra.x + 31, cobra.y + 14 - alt, 4, 4);
          ctx.fillStyle = '#e53935';
          ctx.fillRect(cobra.x + 27, cobra.y + 24 - alt, 2, 7);
        } }) - 1];
    },
  },
  {
    nome: 'Dunas Que Afundam', mundo: 3, motivo: 'AFUNDOU NA DUNA',
    montar(L) {
      L.chao(0, 5);
      L.chao(25, 31);
      L.espinhos(6, 17, 19);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(13, 7, ['CALMA, AS DUNAS SÃO FIRMES', 'PODE DESCANSAR NELAS', 'FICA À VONTADE']);
      // Cada duna afunda enquanto voce esta em cima e anda de um lado pro outro
      [[7, 13, 0], [13, 13, 40], [19, 13, 80]].forEach(([c, r, fase]) => {
        const b = L.bloco(c, r, 3, 1, { mundo: { ...L.mundo, topo: '#f6d896' } });
        const x0 = b.x;
        b.update = () => {
          b.x = x0 + Math.sin((L.t + fase) / 40) * 20;
          if (p.chaoBloco === b) b.y += 1.4;
        };
      });
    },
  },
  {
    nome: 'Múmia Imitadora', mundo: 3, motivo: 'ABRAÇO DE MÚMIA',
    montar(L) {
      L.chao(0, 25);
      L.chao(28, 31);
      L.inicio(3, 15);
      L.porta(30, 16);
      L.placa(9, 10, ['A MÚMIA É SUA FÃ', 'ELA FAZ TUDO QUE VOCÊ FAZ', 'SÓ QUE AO CONTRÁRIO']);
      // A mumia faz o contrario do que voce faz: voce vai pra direita, ela vem pra esquerda
      const mumia = { x: 23 * T, y: 16 * T - 28, w: 22, h: 28, vy: 0, tipo: 'mumia', ativo: true, visivel: true, motivo: 'ABRAÇO DE MÚMIA',
        update() {
          const dir = p.cmd?.dir || 0;
          mumia.x = limitar(mumia.x - dir * 4.2, 0, W - mumia.w);
          if (p.cmd?.apertou && mumia.noChao) mumia.vy = -10;
          mumia.vy = Math.min(12, mumia.vy + 0.55);
          const pesAntes = mumia.y + mumia.h;
          mumia.y += mumia.vy;
          mumia.noChao = false;
          for (const s of solidosEm(mumia)) {
            // so pousa se vinha de cima (se ja caiu no buraco, cai de vez)
            if (mumia.vy > 0 && pesAntes <= s.y + 1) { mumia.y = s.y - mumia.h; mumia.vy = 0; mumia.noChao = true; }
          }
          if (mumia.y > H + 40) { mumia.ativo = false; mumia.visivel = false; }
        },
        desenhar() {
          ctx.fillStyle = '#e8e2cf';
          ctx.fillRect(mumia.x, mumia.y, mumia.w, mumia.h);
          ctx.strokeStyle = '#b9b29a';
          ctx.lineWidth = 2;
          for (let i = 4; i < mumia.h; i += 6) {
            ctx.beginPath();
            ctx.moveTo(mumia.x, mumia.y + i);
            ctx.lineTo(mumia.x + mumia.w, mumia.y + i + 2);
            ctx.stroke();
          }
          ctx.fillStyle = '#d11';
          ctx.fillRect(mumia.x + 5, mumia.y + 6, 4, 3);
          ctx.fillRect(mumia.x + 13, mumia.y + 6, 4, 3);
        } };
      L.perigos.push(mumia);
      L.mumia = mumia;
    },
  },
  {
    nome: 'Esfinge do Enigma', mundo: 3, motivo: 'RESPOSTA ERRADA',
    montar(L, tentativa) {
      L.chao();
      L.inicio(2, 15);
      // Enigma: quanto mais se tira, maior fica? BURACO. As portas trocam de lugar a cada morte.
      const ordem = [['BOLA', 'PORTA', 'BURACO'], ['BURACO', 'BOLA', 'PORTA'], ['PORTA', 'BURACO', 'BOLA']][(tentativa - 1) % 3];
      ordem.forEach((nome, i) => {
        L.porta(11 + i * 7, 16, { rotulo: nome, tamRotulo: 14, ...(nome === 'BURACO' ? {} : { aoTocar: () => morrer(`${nome}?! ERROU!`) }) });
      });
      L.coisa({ draw() {
        ctx.fillStyle = '#d9a35b';
        ctx.fillRect(W / 2 - 60, 55, 120, 70);
        ctx.fillStyle = '#3b2a1a';
        ctx.fillRect(W / 2 - 30, 80, 12, 8);
        ctx.fillRect(W / 2 + 18, 80, 12, 8);
        ctx.fillRect(W / 2 - 15, 105, 30, 5);
        ctx.fillStyle = '#4a7bd1';
        ctx.fillRect(W / 2 - 70, 50, 20, 70);
        ctx.fillRect(W / 2 + 50, 50, 20, 70);
        texto('O QUE É, O QUE É:', W / 2, 150, { tam: 18, cor: '#ffe14d' });
        texto('QUANTO MAIS SE TIRA, MAIOR FICA?', W / 2, 176, { tam: 20 });
      } });
      // A esfinge cospe areia de vez em quando
      canhao(L, 31, 15, -1, { periodo: 120, vel: 3.5, fase: 60 });
    },
  },
);

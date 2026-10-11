// Mundo 7: Espaço Sideral (gravidade baixa: os pulos sao enormes)
'use strict';

FASES.push(
  {
    nome: 'Pequeno Salto', mundo: 6, motivo: 'PULOU ATÉ A LUA',
    montar(L) {
      L.chao();
      L.solido(4, 0, 24, 10);
      L.espinhos(4, 10, 24, 'baixo');
      L.inicio(2, 15);
      L.espinhos(9, 15, 1);
      L.espinhos(15, 15, 1);
      L.espinhos(21, 15, 1);
      L.porta(29, 16);
      L.placa(14, 13, ['UM PEQUENO SALTO PRO HOMEM...', 'PULA COM VONTADE!', 'NO ESPAÇO PULA MELHOR']);
    },
  },
  {
    nome: 'Lixo Espacial', mundo: 6, motivo: 'BATEU NUM SATÉLITE',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.buraco(9, 11);
      L.buraco(19, 21);
      L.porta(29, 16);
      L.placa(15, 8, ['RECICLE SEU LIXO ESPACIAL', 'CUIDADO COM O SATÉLITE', 'O SATÉLITE NÃO FREIA']);
      // Satelites velhos passeando bem na altura do pulo
      L.lixos = [[7, 13, 2.2, 0], [17, 23, 2.6, 60]].map(([c0, c1, vel, fase]) => {
        const e = { x: 0, y: 12 * T, w: 36, h: 22, tipo: 'lixo', ativo: true, visivel: true, motivo: 'BATEU NUM SATÉLITE', c0, c1, vel, fase,
          update() {
            const ida = (c1 - c0) * T;
            const t = ((L.t + fase) * vel) % (ida * 2);
            e.x = c0 * T + (t < ida ? t : ida * 2 - t);
          },
          desenhar() {
            ctx.fillStyle = '#9aa7b8';
            ctx.fillRect(e.x + 10, e.y + 4, 16, 14);
            ctx.fillStyle = '#3f6fd8';
            ctx.fillRect(e.x, e.y + 7, 10, 8);
            ctx.fillRect(e.x + 26, e.y + 7, 10, 8);
          } };
        e.update();
        L.perigos.push(e);
        return e;
      });
    },
  },
  {
    nome: 'Gravidade Zero', mundo: 6, motivo: 'FLUTUOU PRO ESPINHO',
    montar(L) {
      L.chao();
      L.teto(2);
      L.solido(13, 0, 6, 6);
      L.espinhos(13, 6, 6, 'baixo');
      L.inicio(2, 15);
      L.buraco(14, 17);
      L.porta(29, 16);
      L.placa(15, 12, ['PULE O BURACO!', 'PULA, PULA!', 'SEM PULAR VOCÊ CAI!']);
      // Na zona sem gravidade voce nao cai... e se pular, nao para mais de subir
      L.coisa({
        update() {
          const dentro = centroX() > 13 * T && centroX() < 19 * T;
          if (dentro && !p.semGravidade && p.vy > 0) p.vy = 0;
          p.semGravidade = dentro;
        },
        draw() {
          ctx.fillStyle = '#7c4dff22';
          ctx.fillRect(13 * T, 7 * T, 6 * T, 9 * T);
          texto('GRAVIDADE ZERO', 16 * T, 8 * T, { tam: 14, cor: '#c7a8ff' });
        },
      });
    },
  },
  {
    nome: 'Buraco Negro', mundo: 6, motivo: 'ERA UM ALIEN',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(28, 16, { olhos: true, dentes: true, aoTocar: () => morrer('ERA UM ALIEN') });
      L.placa(9, 9, ['NÃO CHEGA PERTO DO BURACO NEGRO!', 'FUJA DO BURACO NEGRO!', 'CORRE DELE!']);
      // O buraco negro puxa. E e' a saida.
      const bn = { x: 16 * T, y: 11 * T };
      L.coisa({
        update() {
          const dx = bn.x - centroX(), dy = bn.y - (p.y + p.h / 2);
          const d = Math.hypot(dx, dy);
          if (d < 260) p.empurrao = Math.sign(dx) * 0.22;
          if (d < 24) vencer();
        },
        draw() {
          for (let i = 5; i > 0; i--) {
            ctx.fillStyle = `rgba(124,77,255,${0.08 * i})`;
            ctx.beginPath();
            ctx.arc(bn.x, bn.y, 14 + i * 9 + Math.sin(quadro / 10 + i) * 3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(bn.x, bn.y, 16, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    },
  },
  {
    nome: 'Alien Disfarçado', mundo: 6,
    montar(L, tentativa) {
      L.chao();
      L.inicio(2, 15);
      L.placa(10, 10, ['CUIDADO COM O ALIEN!', 'O ALIEN TE VIU!', 'FOGE DO ALIEN!']);
      // A porta e' o alien. O alien e' a porta. E eles trocam de lugar a cada morte.
      const [cPorta, cAlien] = tentativa % 2 ? [18, 25] : [25, 18];
      L.porta(cPorta, 16, { aoTocar: () => morrer('A PORTA ERA O ALIEN') });
      const alien = L.coisa({ x: cAlien * T, y: 16 * T - 40, w: 30, h: 40,
        update() { if (toca(alien, corpoJogador())) vencer(); },
        draw() {
          const y = alien.y + Math.sin(quadro / 15) * 2;
          ctx.fillStyle = '#7dff6b';
          ctx.beginPath();
          ctx.ellipse(alien.x + 15, y + 14, 14, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(alien.x + 8, y + 24, 14, 16);
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.ellipse(alien.x + 9, y + 13, 4, 6, -0.4, 0, Math.PI * 2);
          ctx.ellipse(alien.x + 21, y + 13, 4, 6, 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#7dff6b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(alien.x + 10, y + 2); ctx.lineTo(alien.x + 6, y - 8);
          ctx.moveTo(alien.x + 20, y + 2); ctx.lineTo(alien.x + 24, y - 8);
          ctx.stroke();
        } });
    },
  },
  {
    nome: 'Órbita', mundo: 6, motivoQueda: 'PERDIDO NO ESPAÇO',
    montar(L) {
      L.chao(0, 5);
      L.chao(26, 31);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(15, 4, ['PULA DIRETO, É PERTINHO', 'DÁ PRA PULAR DE UMA VEZ', 'CONFIA NO PULO']);
      // Duas plataformas girando em volta de um planetinha
      const cx = 16 * T, cy = 12.5 * T, raio = 4 * T;
      L.orbitas = [0, Math.PI].map(a0 => {
        const b = L.bloco(0, 0, 3, 1, { mundo: { ...L.mundo, topo: '#7dff6b' } });
        b.update = () => {
          const a = a0 + L.t / 140;
          b.x = cx + Math.cos(a) * raio - b.w / 2;
          b.y = cy + Math.sin(a) * raio - b.h / 2;
        };
        b.update();
        return b;
      });
      L.coisa({ draw() {
        ctx.fillStyle = '#ff8a3d';
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.fill();
      } });
      L.espinhos(6, 17, 20);
    },
  },
  {
    nome: 'Foguete', mundo: 6, motivo: 'FOGUETE PRO ESPINHO',
    montar(L) {
      L.chao();
      L.solido(0, 5, 22, 2);
      L.solido(24, 5, 8, 2);
      L.espinhos(0, 7, 22, 'baixo');
      L.espinhos(24, 7, 8, 'baixo');
      L.solido(24, 4, 8, 1);
      L.inicio(2, 15);
      L.porta(28, 4);
      L.placa(10, 11, ['USE O FOGUETE NOVINHO', 'O VELHO NÃO FUNCIONA', 'O NOVO É MAIS RÁPIDO']);
      const foguete = (c, novo) => L.coisa({ x: c * T, y: 16 * T - 50, w: 30, h: 50, usado: false,
        update() {
          if (this.usado || !toca(this, corpoJogador())) return;
          this.usado = true;
          p.vy = -13;
          p.lancado = true;
          p.x = c * T + 5;
          som('mola');
          for (let i = 0; i < 20; i++) particula(c * T + 15, 16 * T, (Math.random() - 0.5) * 3, Math.random() * 3, '#ffb02e', 30, 5, 0);
        },
        draw() {
          ctx.fillStyle = novo ? '#e8e8e8' : '#8a8a8a';
          ctx.beginPath();
          ctx.moveTo(c * T + 15, 16 * T - 50);
          ctx.lineTo(c * T + 26, 16 * T - 30);
          ctx.lineTo(c * T + 26, 16 * T);
          ctx.lineTo(c * T + 4, 16 * T);
          ctx.lineTo(c * T + 4, 16 * T - 30);
          ctx.fill();
          ctx.fillStyle = novo ? '#ff3b3b' : '#6b4a2a';
          ctx.fillRect(c * T + 4, 16 * T - 12, 22, 12);
          texto(novo ? 'NOVO ✔' : 'VELHO ✖', c * T + 15, 16 * T - 64, { tam: 13 });
        } });
      foguete(12, true);
      foguete(22, false);
    },
  },
  {
    nome: 'Estação com Defeito', mundo: 6, motivo: 'GRAVIDADE BUGOU',
    montar(L) {
      L.chao();
      L.teto(1);
      L.espinhos(8, 2, 5, 'baixo');
      L.espinhos(18, 2, 5, 'baixo');
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(15, 10, ['O SISTEMA ESTÁ ESTÁVEL', 'NENHUM PROBLEMA AQUI', 'TUDO NORMAL A BORDO']);
      // A cada 150 quadros a gravidade vira por 80 quadros
      const ciclo = 150, invertido = 80;
      L.proximaVirada = () => (ciclo - invertido - (L.t % ciclo) + ciclo) % ciclo;
      L.coisa({
        update() {
          const pos = L.t % ciclo;
          const deveriaInverter = pos >= ciclo - invertido;
          if (deveriaInverter !== (p.grav < 0)) {
            p.grav *= -1;
            som('virar');
          }
        },
        draw() {
          const pos = L.t % ciclo;
          if (pos > ciclo - invertido - 45 && pos < ciclo - invertido && Math.floor(quadro / 6) % 2) {
            texto('⚠ GRAVIDADE INSTÁVEL ⚠', W / 2, 7 * T, { tam: 26, cor: '#ff3b3b' });
          }
        },
      });
    },
  },
  {
    nome: 'Chuva de Meteoros', mundo: 6, motivo: 'METEORO NA CABEÇA',
    montar(L, tentativa) {
      L.chao();
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(14, 8, ['CORRE QUE NENHUM TE ACERTA', 'NÃO PARA!', 'VAI RETO!']);
      // Cada meteoro avisa com uma sombra antes de cair
      // [coluna, quadro do impacto]: os primeiros miram em quem corre sem olhar
      const alvos = [[10, 53], [16, 93], [22, 133], [27, 166], [13, 120], [19, 172], [24, 210], [8, 200], [25, 252], [14, 240], [28, 300]];
      L.meteoros = [];
      alvos.forEach(([c, impacto]) => {
        const m = { c, cai: impacto + (tentativa % 3) * 6 };
        L.meteoros.push(m);
        L.coisa({
          update() {
            if (L.t === m.cai - 56) projetil(L, c * T + 4, -40, 0, 0, { grav: 0.32, w: 26, h: 26, desenhoBala: 'meteoro', atravessa: true, motivo: 'METEORO NA CABEÇA' });
          },
          draw() {
            if (L.t > m.cai - 60 && L.t < m.cai + 4) {
              ctx.fillStyle = '#00000055';
              ctx.beginPath();
              ctx.ellipse(c * T + 17, 16 * T - 2, 20, 5, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          },
        });
      });
    },
  },
  {
    nome: 'O Disco Voador', mundo: 6, motivo: 'DESINTEGRADO',
    montar(L) {
      L.chao();
      L.solido(24, 6, 8, 1);
      L.inicio(2, 15);
      L.porta(29, 6);
      L.placa(6, 11, ['NÃO DEIXA ELE TE ABDUZIR!', 'FOGE DA LUZ!', 'A LUZ É PERIGOSA!']);
      // O disco segue voce. Ficar na luz azul te leva pra cima. Quando ela fica vermelha, sai!
      const disco = L.coisa({ x: 10 * T, abduzindo: 0, estado: 'segue', t: 0,
        update() {
          const ciclo = (L.t + 40) % 170;
          disco.vermelho = ciclo >= 140;
          disco.aviso = ciclo >= 110 && ciclo < 140;
          const naLuz = Math.abs(centroX() - disco.x) < 26;
          if (disco.estado === 'segue') {
            disco.x += limitar(centroX() - disco.x, -1.2, 1.2);
            if (disco.vermelho && naLuz) morrer('DESINTEGRADO');
            disco.abduzindo = naLuz && !disco.vermelho && p.noChao ? disco.abduzindo + 1 : Math.max(0, disco.abduzindo - 2);
            if (disco.abduzindo >= 60) { disco.estado = 'levando'; som('virar'); dizer('ABDUZIDO!', 50); }
          } else if (disco.estado === 'levando') {
            p.semGravidade = true;
            p.vy = 0;
            p.vx = 0;
            p.y = Math.max(3 * T, p.y - 3);
            p.x = disco.x - p.w / 2;
            if (p.y <= 3 * T) disco.x = Math.min(27 * T, disco.x + 3);
            if (disco.x >= 27 * T) { disco.estado = 'largou'; p.semGravidade = false; }
          }
        },
        draw() {
          const raio = disco.vermelho ? '#ff2a4a88' : disco.aviso && Math.floor(quadro / 5) % 2 ? '#ff2a4a55' : '#4dd6ff44';
          if (disco.estado !== 'largou') {
            ctx.fillStyle = raio;
            ctx.beginPath();
            ctx.moveTo(disco.x - 10, 2 * T + 20);
            ctx.lineTo(disco.x + 10, 2 * T + 20);
            ctx.lineTo(disco.x + 30, 16 * T);
            ctx.lineTo(disco.x - 30, 16 * T);
            ctx.fill();
          }
          ctx.fillStyle = '#b0bec5';
          ctx.beginPath();
          ctx.ellipse(disco.x, 2 * T + 14, 46, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#7dff6b88';
          ctx.beginPath();
          ctx.ellipse(disco.x, 2 * T + 4, 20, 14, 0, Math.PI, 0);
          ctx.fill();
          if (disco.abduzindo > 0 && disco.estado === 'segue') {
            ctx.fillStyle = '#4dd6ff';
            ctx.fillRect(disco.x - 30, 2 * T + 32, 60 * (disco.abduzindo / 60), 4);
          }
        },
      });
      L.disco = disco;
    },
  },
);

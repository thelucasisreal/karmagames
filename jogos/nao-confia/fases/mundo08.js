// Mundo 8: Cidade dos Bugs
'use strict';

FASES.push(
  {
    nome: 'Lag', mundo: 7,
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(9, 15, 1);
      L.espinhos(16, 15, 1);
      L.buraco(21, 23);
      L.porta(29, 16);
      L.placa(12, 10, ['PING: 999ms', 'CONEXÃO RUIM...', 'TÁ TRAVANDO AÍ?']);
      // Tudo que voce aperta chega meio segundo depois
      const fila = [];
      L.filtrarComando = cmd => {
        fila.push({ ...cmd });
        return fila.length > 30 ? fila.shift() : { dir: 0, segurando: false, apertou: false };
      };
      L.desenharHudExtra = () => texto('📶 LAG: 500ms', 82, 60, { tam: 13, cor: '#ff3b3b', contorno: '#000' });
    },
  },
  {
    nome: 'Tela de Carregamento', mundo: 7, motivo: 'CARREGOU A ARMADILHA',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(29, 16);
      // Enquanto carrega, tudo e' seguro. Quando termina, aparecem os espinhos e os buracos.
      const DURACAO = 300;
      const espinhos = [7, 12, 18, 24].flatMap(c => L.espinhos(c, 15, 2));
      for (const e of espinhos) { e.ativo = false; e.visivel = false; }
      const pontes = [[9, 10], [15, 16], [21, 22]].map(([c0, c1]) => {
        L.solido(c0, 16, c1 - c0 + 1, 2, 0);
        L.espinhos(c0, 17, c1 - c0 + 1);
        return L.bloco(c0, 16, c1 - c0 + 1, 1);
      });
      L.placa(15, 9, ['', 'NÃO PRECISA ESPERAR...', 'DICA: O JOGO JÁ ESTÁ RODANDO']);
      L.coisa({
        update() {
          if (L.t === DURACAO) {
            for (const e of espinhos) { e.ativo = true; e.visivel = true; e.escala = 0; }
            for (const b of pontes) { b.solido = false; b.visivel = false; }
            som('glitch');
            dizer('FASE CARREGADA!', 60);
          }
        },
      });
      L.desenharAcima = () => {
        if (L.t >= DURACAO) return;
        ctx.fillStyle = 'rgba(0, 10, 5, 0.9)';
        ctx.fillRect(0, 0, W, H);
        const pct = Math.min(99, Math.floor((L.t / DURACAO) * 100));
        texto('CARREGANDO...', W / 2, H / 2 - 30, { tam: 36, cor: '#39ff88' });
        ctx.strokeStyle = '#39ff88';
        ctx.lineWidth = 3;
        ctx.strokeRect(W / 2 - 200, H / 2, 400, 24);
        ctx.fillStyle = '#39ff88';
        ctx.fillRect(W / 2 - 196, H / 2 + 4, 392 * (pct / 100), 16);
        texto(`${pct}%`, W / 2, H / 2 + 50, { tam: 20, cor: '#39ff88' });
      };
    },
  },
  {
    nome: 'Erro de Colisão', mundo: 7,
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(10, 15, 1);
      L.espinhos(17, 15, 1);
      L.espinhos(23, 15, 1);
      L.porta(26, 16);
      L.placa(13, 10, ['TUDO NO LUGAR CERTO', 'NENHUM BUG AQUI', 'COLISÃO 100% PERFEITA']);
      // O cenario aparece 2 blocos pra direita de onde ele realmente esta
      L.deslocamento = 2 * T;
    },
  },
  {
    nome: 'Velocidade Bugada', mundo: 7,
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(9, 15, 1);
      L.espinhos(15, 15, 1);
      L.buraco(20, 22);
      L.porta(29, 16);
      L.placa(14, 9, ['VELOCIDADE: NORMAL', 'VELOCIDADE: NORMAL (MENTIRA)', 'VELOCIDADE: ???']);
      // A cada pouco mais de um segundo a velocidade muda entre lerdinho e turbo
      L.coisa({ update() { p.velMult = Math.floor(L.t / 70) % 2 ? 1.9 : 0.35; } });
      L.desenharHudExtra = () => texto(p.velMult > 1 ? '⚡ TURBO' : '🐢 LERDO', 82, 60, { tam: 14, cor: p.velMult > 1 ? '#ffd23f' : '#9aa7b8', contorno: '#000' });
    },
  },
  {
    nome: 'O Cursor', mundo: 7, motivo: 'CLICADO ATÉ A MORTE',
    montar(L) {
      L.chao();
      L.inicio(3, 15);
      L.porta(29, 16);
      L.placa(10, 9, ['NÃO CLIQUE EM NADA', 'CUIDADO ONDE CLICA', 'CLIQUE COM SABEDORIA']);
      // Um portao de laser que abre e fecha... e o cursor do mouse vindo atras de voce
      L.portao = laser(L, 16, 2, 15, { ligado: 70, desligado: 60 });
      const cursor = { x: 20, y: 60, w: 12, h: 12, tipo: 'cursor', ativo: true, visivel: true, motivo: 'CLICADO ATÉ A MORTE',
        update() {
          const alvoX = centroX(), alvoY = p.y + p.h / 2;
          const d = Math.hypot(alvoX - cursor.x, alvoY - cursor.y) || 1;
          cursor.x += ((alvoX - cursor.x) / d) * 1.9;
          cursor.y += ((alvoY - cursor.y) / d) * 1.9;
        },
        desenhar() {
          ctx.save();
          ctx.translate(cursor.x, cursor.y);
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26); ctx.lineTo(15, 38); ctx.lineTo(20, 36); ctx.lineTo(14, 24); ctx.lineTo(25, 24);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } };
      L.perigos.push(cursor);
      L.cursor = cursor;
    },
  },
  {
    nome: 'Pop-up', mundo: 7, motivo: 'CLICOU NO X',
    montar(L) {
      L.chao();
      L.solido(25, 5, 7, 1);
      L.inicio(2, 15);
      L.porta(29, 5);
      L.placa(8, 15, ['FECHA OS POP-UPS NO X!', 'CLICA NO X!', 'O X FECHA, CONFIA']);
      // Janelas aparecem uma depois da outra: a barra de titulo e' chao; o X mata
      const janelas = [[5, 13, 30], [11, 10, 90], [17, 7, 150]];
      for (const [c, r, quando] of janelas) {
        const barra = L.bloco(c, r, 6, 1, { solido: false, visivel: false });
        const x = L.espinhos(c + 5, r - 1, 1, 'cima', { ativo: false, visivel: false, motivo: 'CLICOU NO X', tipo: 'xis' })[0];
        x.hit = [4, 14, 22, 16];
        x.desenhar = e => {
          ctx.fillStyle = '#e53935';
          ctx.fillRect(e.x + 4, e.y + 12, 22, 18);
          texto('X', e.x + 15, e.y + 22, { tam: 14, contorno: null });
        };
        barra.desenhar = b => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(b.x, b.y + T, b.w, 3 * T);
          ctx.strokeStyle = '#1e3a8a';
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y, b.w, 4 * T);
          ctx.fillStyle = '#1e40af';
          ctx.fillRect(b.x, b.y, b.w, b.h);
          texto('PARABÉNS! VOCÊ GANHOU!', b.x + b.w / 2 - 15, b.y + 15, { tam: 11, contorno: null });
          texto('🎁 CLIQUE AQUI', b.x + b.w / 2, b.y + 2 * T + 10, { tam: 16, cor: '#1e3a8a', contorno: null });
        };
        L.depois(quando / 60, () => {
          barra.solido = true;
          barra.visivel = true;
          x.ativo = true;
          x.visivel = true;
          som('clique');
        });
      }
    },
  },
  {
    nome: 'Porta Pirata', mundo: 7, motivo: 'BAIXOU UM VÍRUS',
    montar(L, tentativa) {
      L.chao();
      L.inicio(2, 15);
      L.placa(15, 9, ['PORTA ORIGINAL ✔', 'PORTA 100% ORIGINAL', 'SEM VÍRUS, CONFIA']);
      // So uma porta e' original: a que nao fica piscando. Muda de lugar a cada morte.
      const real = [3, 1, 4, 0, 2][(tentativa - 1) % 5];
      [7, 12, 17, 22, 27].forEach((c, i) => {
        if (i === real) return L.porta(c, 16);
        const d = L.porta(c, 16, { aoTocar: () => morrer('BAIXOU UM VÍRUS'), fase: i * 1.7 });
        d.update = () => {
          d.visivel = Math.sin(L.t / 4 + d.fase) > -0.6;
          d.x = c * T + (Math.random() - 0.5) * 2;
        };
      });
      L.portaReal = [7, 12, 17, 22, 27][real];
    },
  },
  {
    nome: 'Controles Aleatórios', mundo: 7,
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(0, 15, 1);
      L.espinhos(8, 15, 1);
      L.espinhos(14, 15, 1);
      L.espinhos(20, 15, 1);
      L.espinhos(25, 15, 1);
      L.porta(29, 16);
      L.placa(14, 10, ['CONTROLES: OK ✔', 'CONTROLES: ESTÁVEIS', 'NADA MUDA AQUI']);
      // Cada vez que voce pousa, os controles trocam
      L.aoPousar = () => {
        L.inverter = !L.inverter;
        som('glitch');
      };
    },
  },
  {
    nome: 'Tela Azul', mundo: 7,
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.buraco(18, 20);
      L.porta(29, 16);
      L.placa(6, 11, ['TUDO FUNCIONANDO', 'SISTEMA ESTÁVEL', 'SEM TRAVAMENTOS']);
      // No meio do caminho "trava" tudo. O jogo continua rodando por tras.
      let azulAte = 0;
      L.gatilho(10, 0, 1, 18, () => { azulAte = L.t + 200; som('glitch'); });
      L.desenharAcima = () => {
        if (L.t >= azulAte) return;
        ctx.fillStyle = '#0a5fd6';
        ctx.fillRect(0, 0, W, H);
        texto(':(', 140, 150, { tam: 110, alinhar: 'left', contorno: null });
        texto('Seu jogo travou e precisa ser reiniciado.', 140, 270, { tam: 22, alinhar: 'left', contorno: null });
        const pct = Math.floor(limitar(centroX() / W, 0, 1) * 100);
        texto(`${pct}% concluído`, 140, 320, { tam: 22, alinhar: 'left', contorno: null });
        texto('Pressione PULAR para tentar de novo.', 140, 370, { tam: 16, alinhar: 'left', contorno: null });
      };
    },
  },
  {
    nome: 'O Antivírus', mundo: 7, motivo: 'VÍRUS DETECTADO',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(30, 16);
      L.placa(15, 6, ['VOCÊ É O VÍRUS', 'ESCONDA-SE NAS PASTAS', 'ESCANEANDO...']);
      // Uma linha de varredura atravessa a tela de tempos em tempos. Dentro das pastas voce esta seguro.
      const pastas = [[1, 3], [10, 12], [19, 21], [27, 29]];
      const ciclo = 240, vel = 6;
      const linhaX = t => (t % ciclo) * vel - 60;
      L.varredura = { linhaX, ciclo, vel, pastas };
      const naPasta = () => pastas.some(([c0, c1]) => p.x >= c0 * T - 2 && p.x + p.w <= (c1 + 1) * T + 2);
      L.coisa({
        update() {
          const x = linhaX(L.t);
          if (x > p.x - 4 && x < p.x + p.w + 4 && !naPasta()) morrer('VÍRUS DETECTADO');
        },
        draw() {
          for (const [c0, c1] of pastas) {
            ctx.fillStyle = '#f2c230';
            ctx.fillRect(c0 * T, 16 * T - 40, (c1 - c0 + 1) * T, 40);
            ctx.fillRect(c0 * T, 16 * T - 48, T, 10);
            ctx.fillStyle = '#00000022';
            ctx.fillRect(c0 * T + 4, 16 * T - 34, (c1 - c0 + 1) * T - 8, 4);
          }
          const x = linhaX(L.t);
          if (x > -10 && x < W + 10) {
            ctx.fillStyle = '#ff2a4a';
            ctx.fillRect(x - 3, 0, 6, H);
            ctx.fillStyle = '#ff2a4a33';
            ctx.fillRect(x - 40, 0, 40, H);
          }
        },
      });
    },
  },
);

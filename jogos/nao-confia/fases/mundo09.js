// Mundo 9: Céu Falso
'use strict';

const nuvem = (L, c, r, w, extra = {}) => L.bloco(c, r, w, 1, { desenho: 'nuvem', ...extra });

FASES.push(
  {
    nome: 'Nuvem de Algodão', mundo: 8, motivoQueda: 'A NUVEM ERA SÓ FUMAÇA',
    montar(L) {
      L.chao(0, 5);
      L.chao(26, 31);
      L.espinhos(6, 17, 20);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(15, 7, ['NUVEM BRANQUINHA = SEGURA', 'PULA NAS FOFINHAS', 'A CINZA É DE CHUVA, EVITA']);
      // As fofinhas brancas sao de mentira. As cinzas de tempestade aguentam.
      for (const c of [9, 14, 19]) nuvem(L, c, 14, 2, { solido: false });
      for (const c of [7, 12, 17, 22]) nuvem(L, c, 13, 2, { cor: '#8a8f9c' });
    },
  },
  {
    nome: 'Escada de Nuvens', mundo: 8, motivoQueda: 'A NUVEM EVAPOROU',
    montar(L) {
      L.chao(0, 4);
      L.espinhos(5, 17, 27);
      L.solido(26, 5, 6, 1);
      L.inicio(2, 15);
      L.porta(29, 5);
      L.placa(10, 4, ['PODE DESCANSAR NAS NUVENS', 'SEM PRESSA', 'RESPIRA EM CADA DEGRAU']);
      // Cada nuvem some um pouco depois que voce pisa
      const degraus = [[5, 13], [9, 11], [13, 9], [17, 7], [21, 5]].map(([c, r]) => nuvem(L, c, r, 2, { pisada: 0 }));
      L.aoPousar = () => {
        const b = p.chaoBloco;
        if (!degraus.includes(b) || b.pisada) return;
        b.pisada = L.t;
        L.depois(0.5, () => { b.solido = false; b.visivel = false; poof(b.x + 30, b.y + 10); });
      };
    },
  },
  {
    nome: 'Pássaro Bravo', mundo: 8, motivo: 'BICADO',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(9, 15, 1);
      L.espinhos(16, 15, 1);
      L.espinhos(23, 15, 1);
      L.porta(29, 16);
      L.placa(14, 10, ['O PASSARINHO É MANSO', 'FAZ CARINHO NELE', 'ELE SÓ QUER AMIGOS']);
      // Ele voa de um lado pro outro e mergulha em quem esta no ar perto dele
      const passaro = { x: 15 * T, y: 9 * T, w: 30, h: 20, vx: 2.4, tipo: 'passaro', ativo: true, visivel: true, motivo: 'BICADO', estado: 'voa',
        update() {
          if (passaro.estado === 'voa') {
            passaro.x += passaro.vx;
            if (passaro.x < 4 * T || passaro.x > 27 * T) passaro.vx *= -1;
            if (!p.noChao && Math.abs(centroX() - (passaro.x + 15)) < 140) { passaro.estado = 'mergulho'; som('nhac'); }
          } else if (passaro.estado === 'mergulho') {
            const dx = centroX() - (passaro.x + 15), dy = p.y - passaro.y;
            const d = Math.hypot(dx, dy) || 1;
            passaro.x += (dx / d) * 7;
            passaro.y += (dy / d) * 7;
            if (passaro.y > 15 * T || p.noChao) passaro.estado = 'volta';
          } else {
            passaro.y = Math.max(9 * T, passaro.y - 3);
            if (passaro.y <= 9 * T) passaro.estado = 'voa';
          }
        },
        desenhar() {
          const asa = Math.sin(quadro / 3) * 8;
          ctx.fillStyle = '#e53935';
          ctx.beginPath();
          ctx.ellipse(passaro.x + 15, passaro.y + 10, 14, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(passaro.x + 10, passaro.y + 8);
          ctx.lineTo(passaro.x + 18, passaro.y - 6 + asa);
          ctx.lineTo(passaro.x + 24, passaro.y + 8);
          ctx.fill();
          ctx.fillStyle = '#ffb300';
          ctx.fillRect(passaro.x + (passaro.vx > 0 ? 27 : -3), passaro.y + 8, 6, 4);
          ctx.fillStyle = '#000';
          ctx.fillRect(passaro.x + (passaro.vx > 0 ? 20 : 6), passaro.y + 6, 3, 3);
        } };
      L.perigos.push(passaro);
      L.passaro = passaro;
    },
  },
  {
    nome: 'Pé de Feijão', mundo: 8,
    montar(L) {
      L.chao();
      L.solido(24, 4, 8, 1);
      L.inicio(2, 15);
      L.porta(29, 4);
      L.espinhos(28, 15, 4);
      L.placa(14, 12, ['CORRE! NÃO PARA!', 'NÃO PARA, SENÃO JÁ ERA!', 'PARADO É PIOR!']);
      // Ficar 2 segundos parado em cima do brotinho faz o pe de feijao crescer ate as nuvens
      let parado = 0, cresceu = false;
      const folhas = [];
      L.coisa({
        update() {
          const emCima = p.noChao && centroX() > 9 * T && centroX() < 10 * T + 10 && Math.abs(p.vx) < 0.3;
          parado = emCima ? parado + 1 : 0;
          if (parado >= 120 && !cresceu) {
            cresceu = true;
            som('mola');
            dizer('UAU!', 40);
            [[11, 13], [14, 10], [17, 7], [20, 4]].forEach(([c, r], i) => L.depois(i * 0.25, () => {
              const f = L.bloco(c, r, 2, 1, { mundo: { ...L.mundo, corpo: '#3f9a4a', topo: '#7dff6b' } });
              folhas.push(f);
              brilho(c * T + 30, r * T);
            }));
          }
        },
        draw() {
          ctx.fillStyle = '#3f9a4a';
          ctx.fillRect(9 * T + 12, 16 * T - 14, 6, 14);
          ctx.beginPath();
          ctx.ellipse(9 * T + 10, 16 * T - 14, 7, 4, -0.5, 0, Math.PI * 2);
          ctx.ellipse(9 * T + 21, 16 * T - 16, 7, 4, 0.5, 0, Math.PI * 2);
          ctx.fill();
          if (cresceu) {
            ctx.fillStyle = '#3f9a4a';
            ctx.fillRect(9 * T + 12, 4 * T, 6, 12 * T);
          } else if (parado > 0) {
            ctx.fillStyle = '#7dff6b';
            ctx.fillRect(9 * T - 10, 16 * T - 40, 50 * (parado / 120), 5);
          }
        },
      });
    },
  },
  {
    nome: 'Balão', mundo: 8, motivo: 'O BALÃO ESTOUROU',
    montar(L) {
      L.chao();
      L.teto(2);
      L.espinhos(8, 3, 16, 'baixo');
      L.solido(11, 9, 1, 7);
      L.espinhos(15, 15, 5);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(6, 7, ['PULO NÃO FUNCIONA AQUI', 'SEGURA PRA SUBIR', 'SOLTA PRA DESCER']);
      // Voce esta segurando um balao: segurar o pulo sobe devagar, soltar desce
      L.filtrarComando = cmd => {
        if (cmd.segurando) p.vy = Math.max(-2.2, p.vy - 1);
        cmd.apertou = false;
        return cmd;
      };
      L.coisa({ draw() {
        if (estado === 'morto') return;
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centroX(), p.y);
        ctx.lineTo(centroX(), p.y - 26);
        ctx.stroke();
        ctx.fillStyle = '#ff4d8a';
        ctx.beginPath();
        ctx.ellipse(centroX(), p.y - 36, 11, 13, 0, 0, Math.PI * 2);
        ctx.fill();
      } });
      // O balao estoura se encostar nos espinhos do teto
      L.coisa({ update() {
        const b = { x: centroX() - 10, y: p.y - 49, w: 20, h: 24 };
        if (L.perigos.some(e => e.dir === 'baixo' && toca(b, caixaDoPerigo(e)))) morrer('O BALÃO ESTOUROU');
      } });
    },
  },
  {
    nome: 'Chuva Ácida', mundo: 8, motivo: 'DERRETIDO PELA CHUVA',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(14, 6, ['A CHUVA É SÓ ÁGUA', 'É CHUVA NORMAL, RELAXA', 'TOMA UM BANHO DE CHUVA']);
      const guardas = [[6, 8], [15, 17], [24, 26]];
      for (const [c0, c1] of guardas) L.bloco(c0, 12, c1 - c0 + 1, 1, { mundo: { ...L.mundo, corpo: '#e53935', topo: '#ff6b6b' } });
      // Chove 100 quadros, para 90. Debaixo do guarda-chuva nao pega.
      const ciclo = 190, chove = 100;
      L.chuva = { ciclo, chove, guardas, chovendo: () => (L.t + 110) % ciclo < chove };
      L.coisa({
        update() {
          if (!L.chuva.chovendo()) return;
          const cx = centroX();
          const coberto = guardas.some(([c0, c1]) => cx > c0 * T - 4 && cx < (c1 + 1) * T + 4);
          if (!coberto) morrer('DERRETIDO PELA CHUVA');
        },
        draw() {
          const t = (L.t + 110) % ciclo;
          if (t >= chove - 30 && t < chove && Math.floor(quadro / 5) % 2) texto('PARANDO...', W / 2, 7 * T, { tam: 18 });
          if (t > ciclo - 40 && Math.floor(quadro / 5) % 2) texto('⚠ VAI CHOVER ⚠', W / 2, 7 * T, { tam: 24, cor: '#7dff6b' });
          if (!L.chuva.chovendo()) return;
          ctx.strokeStyle = '#7dff6bcc';
          ctx.lineWidth = 2;
          for (let i = 0; i < 80; i++) {
            const x = (i * 53 + quadro * 3) % W;
            const y = (i * 97 + quadro * 14) % H;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 3, y + 12);
            ctx.stroke();
          }
        },
      });
    },
  },
  {
    nome: 'Raio', mundo: 8, motivo: 'ELETROCUTADO',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(11, 15, 1);
      L.espinhos(19, 15, 1);
      L.buraco(24, 25);
      L.porta(29, 16);
      L.placa(14, 7, ['PARA E ADMIRA A TEMPESTADE', 'QUE RAIO BONITO!', 'FICA PARADINHO PRA VER']);
      // A nuvem marca onde voce esta e o raio cai ali um pouquinho depois
      const marcas = [];
      L.coisa({
        update() {
          if (L.t % 45 === 20) marcas.push({ x: centroX(), cai: L.t + 40 });
          for (const m of marcas) {
            if (L.t === m.cai) {
              som('raio');
              flash = 0.4;
              if (Math.abs(centroX() - m.x) < 26) morrer('ELETROCUTADO');
            }
          }
          while (marcas.length && marcas[0].cai < L.t - 10) marcas.shift();
        },
        draw() {
          for (const m of marcas) {
            if (L.t < m.cai) {
              ctx.fillStyle = `rgba(255,230,80,${0.15 + 0.4 * ((L.t % 10) < 5)})`;
              ctx.fillRect(m.x - 22, 0, 44, 16 * T);
            } else if (L.t < m.cai + 8) {
              ctx.strokeStyle = '#fff59d';
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(m.x, 0);
              for (let y = 60; y <= 16 * T; y += 60) ctx.lineTo(m.x + (y / 60 % 2 ? 14 : -14), y);
              ctx.stroke();
            }
          }
        },
      });
    },
  },
  {
    nome: 'Escada pro Céu', mundo: 8, saidaBaixo: true,
    montar(L) {
      L.chao(0, 3);
      L.chao(6, 31);
      L.inicio(1, 15);
      L.placa(4, 13, ['INFERNO ↓', 'NEM PENSE ↓', 'É O INFERNO, SÉRIO ↓']);
      // A escada dourada leva a uma porta linda... e o anjo te empurra de la
      const ouro = { ...L.mundo, corpo: '#f2c230', topo: '#fff3a0', sombra: '#c99a00' };
      [[10, 13, 3], [14, 11, 3], [18, 9, 3], [22, 7, 10]].forEach(([c, r, w]) => L.bloco(c, r, w, 16 - r, { mundo: ouro }));
      L.porta(28, 7, { rotulo: 'CÉU ✨', cor: '#fff3a0', aoTocar: () => morrer('O ANJO TE EMPURROU') });
    },
  },
  {
    nome: 'Vento Mentiroso', mundo: 8, motivoQueda: 'LEVADO PELO VENTO',
    montar(L) {
      L.chao(0, 10);
      L.chao(17, 31);
      L.espinhos(11, 17, 6);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(13, 8, ['VENTO CONTRA ←←←', 'VENTO FORTE CONTRA VOCÊ', 'IMPOSSÍVEL PULAR ISSO']);
      // As setas dizem que o vento vem contra. Mentira: no ar ele te empurra pra frente.
      L.coisa({
        update() {
          const cx = centroX();
          if (cx > 9 * T && cx < 18 * T && !p.noChao) p.empurrao = 0.45;
          if (cx > 20 * T && cx < 27 * T && p.noChao) p.empurrao = -0.3;
          if (L.t % 3 === 0) particula(9 * T + Math.random() * 9 * T, 6 * T + Math.random() * 9 * T, 5, 0, '#ffffffaa', 30, 3, 0);
        },
        draw() {
          for (let i = 0; i < 3; i++) texto('←', 11 * T + i * 60, 12 * T, { tam: 30, cor: '#ffffff' });
          texto('→ →', 23 * T, 13 * T, { tam: 24, cor: '#ffffff' });
        },
      });
    },
  },
  {
    nome: 'São Pedro', mundo: 8,
    montar(L, tentativa) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(8, 15, 2);
      const portao = L.bloco(26, 10, 1, 6, { solido: tentativa === 1, mundo: { ...L.mundo, corpo: '#f2c230', topo: '#fff3a0' } });
      portao.visivel = tentativa === 1;
      L.porta(29, 16, { rotulo: 'PARAÍSO', tamRotulo: 14 });
      // Sao Pedro so deixa entrar quem ja morreu
      L.coisa({ draw() {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(23 * T + 15, 13 * T, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(23 * T + 3, 13 * T + 12, 24, 40);
        ctx.strokeStyle = '#ffd23f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(23 * T + 15, 13 * T - 18, 12, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        texto(tentativa === 1 ? 'SÓ ENTRA QUEM JÁ MORREU' : 'AGORA SIM, PODE ENTRAR', 23 * T + 15, 10 * T, { tam: 16, cor: '#fff' });
      } });
      L.placa(8, 11, tentativa === 1 ? 'NÃO MORRA AQUI!' : 'VIU? ERA SÓ MORRER');
    },
  },
);

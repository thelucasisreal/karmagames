// Mundo 6: Fábrica Maluca
'use strict';

// Prensa que desce de tempos em tempos (periodo e fase em quadros)
function prensa(L, c, { periodo = 120, fase = 0, preguicosa = false } = {}) {
  const topo = 7 * T, fundo = 16 * T - 5 * T;
  const espera = periodo - 60;
  const b = L.bloco(c, 7, 2, 5, { desenho: 'esmagador' });
  const posicao = t => {
    const pos = (t + fase) % periodo;
    if (preguicosa || pos < espera) return topo;
    if (pos < espera + 5) return Math.min(fundo, topo + (pos - espera + 1) * 24);
    if (pos < espera + 35) return fundo;
    return fundo - ((pos - espera - 35) / 25) * (fundo - topo);
  };
  b.update = () => {
    const antes = b.y;
    b.y = posicao(L.t);
    const pos = (L.t + fase) % periodo;
    b.tremor = preguicosa ? 2 : pos > espera - 20 && pos < espera ? 1.5 : 0;
    if (b.y > antes && toca(b, corpoJogador())) morrer('PRENSADO');
    if (b.y === fundo && antes < fundo) { som('esmagar'); tremor = 5; }
  };
  // Pro robo de teste: a prensa fica la em cima pelos proximos n quadros?
  b.seguraPor = n => {
    for (let k = 0; k <= n; k++) if (posicao(L.t + k) > topo + 10) return false;
    return true;
  };
  return b;
}

FASES.push(
  {
    nome: 'Esteira Teimosa', mundo: 5, motivo: 'BRIGOU COM A ESTEIRA',
    montar(L) {
      L.chao();
      L.inicio(5, 15);
      L.espinhos(0, 15, 2);
      L.porta(29, 16);
      L.placa(10, 11, ['ANDA, A ESTEIRA TÁ CONTRA!', 'CORRE MAIS FORTE!', 'FORÇA NAS PERNAS!']);
      // A esteira sempre vai contra voce. Se nao fizer nada, ela te leva pra porta.
      const est = esteira(L, 0, 31, 16, 0);
      est.esteira = cmd => (est.ultimaVel = cmd.dir ? -cmd.dir * 6 : 3);
    },
  },
  {
    nome: 'Prensa Hidráulica', mundo: 5, motivo: 'PRENSADO',
    montar(L) {
      L.chao();
      L.solido(0, 0, 32, 7);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(9, 13, ['ESSA AQUI NÃO DESCE, JURO', 'A QUE TREME É A PERIGOSA', 'CORRE DA QUE TREME']);
      L.prensas = [
        prensa(L, 7, { fase: 25 }),
        prensa(L, 12, { fase: 112 }),
        prensa(L, 17, { preguicosa: true }),
        prensa(L, 22, { fase: 45 }),
      ];
    },
  },
  {
    nome: 'Linha de Montagem', mundo: 5, motivo: 'EMBALADO PRA VIAGEM',
    montar(L) {
      L.solido(0, 13, 5, 5);
      L.solido(27, 13, 5, 5);
      L.espinhos(5, 17, 22);
      L.inicio(2, 12);
      L.porta(30, 13);
      L.placa(14, 6, ['FIQUE NA CAIXA ATÉ O FIM', 'A CAIXA É SEGURA', 'VIAGEM TRANQUILA']);
      // Caixas andam pra direita... e a prensa do fim amassa tudo
      const caixas = [];
      L.coisa({ update() {
        if (L.t % 110 === 1) caixas.push(Object.assign(L.bloco(5, 12, 2, 1, { mundo: { ...L.mundo, corpo: '#a0743f', topo: '#c8955a' } }), { viva: true }));
        for (const c of caixas) {
          if (!c.viva) continue;
          c.update = () => { c.x += 2; };
          if (c.x >= 23 * T) {
            c.viva = false;
            c.solido = false;
            c.visivel = false;
            poof(c.x + 30, c.y);
            som('esmagar');
            if (p.chaoBloco === c) morrer('EMBALADO PRA VIAGEM');
          }
        }
      } });
      L.coisa({ draw() {
        ctx.fillStyle = '#5a5a6a';
        ctx.fillRect(23 * T + 10, 2 * T, 2 * T, 7 * T);
        ctx.fillStyle = '#c8c8d8';
        ctx.fillRect(23 * T + 10, 9 * T, 2 * T, 10);
      } });
      L.caixas = caixas;
    },
  },
  {
    nome: 'Serras Circulares', mundo: 5, motivo: 'FATIADO',
    montar(L) {
      L.chao();
      L.solido(0, 0, 32, 2);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(4, 11, ['SÓ PASSA CORRENDO', 'NÃO PARA!', 'VAI DIRETO!']);
      L.serras = [[9, 0], [15, 50], [21, 100]].map(([c, fase]) => {
        const s = { cx: c * T + 15, cy: 0, r: 22, tipo: 'serra', ativo: true, visivel: true, motivo: 'FATIADO', x: 0, y: 0, w: 0, h: 0,
          update() {
            s.cy = 9 * T + (Math.sin((L.t + fase) / 25) * 0.5 + 0.5) * (6 * T - 4);
            s.x = s.cx - s.r + 6; s.y = s.cy - s.r + 6; s.w = s.r * 2 - 12; s.h = s.r * 2 - 12;
          },
          desenhar() {
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(s.cx, 2 * T);
            ctx.lineTo(s.cx, s.cy);
            ctx.stroke();
            ctx.save();
            ctx.translate(s.cx, s.cy);
            ctx.rotate(quadro / 3);
            ctx.fillStyle = '#cfd4dc';
            ctx.beginPath();
            for (let i = 0; i < 16; i++) {
              const a = (i / 16) * Math.PI * 2;
              const r = i % 2 ? s.r : s.r - 6;
              ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.fill();
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } };
        s.update();
        L.perigos.push(s);
        s.fase = fase;
        return s;
      });
    },
  },
  {
    nome: 'Robô Copiador', mundo: 5, motivo: 'O ROBÔ TE ALCANÇOU',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(10, 15, 1);
      L.espinhos(18, 15, 1);
      L.espinhos(24, 15, 1);
      L.porta(29, 16);
      L.placa(8, 10, ['PODE IR COM CALMA', 'PARA E PENSA UM POUCO', 'RESPIRA FUNDO']);
      // O robo faz exatamente o caminho que voce fez, 1,5 segundo depois
      const rastro = [];
      const robo = { x: -100, y: 0, w: 20, h: 26, tipo: 'robo', ativo: false, visivel: false, motivo: 'O ROBÔ TE ALCANÇOU', hit: [3, 3, 14, 20],
        update() {
          rastro.push({ x: p.x, y: p.y });
          if (rastro.length > 90) {
            const r = rastro.shift();
            robo.x = r.x;
            robo.y = r.y;
            robo.ativo = robo.visivel = true;
          }
        },
        desenhar() {
          ctx.fillStyle = '#9aa7b8';
          ctx.fillRect(robo.x, robo.y, 20, 26);
          ctx.fillStyle = '#ff3b3b';
          ctx.fillRect(robo.x + 3, robo.y + 7, 14, 4);
          ctx.fillStyle = '#555';
          ctx.fillRect(robo.x + 9, robo.y - 6, 2, 6);
        } };
      L.perigos.push(robo);
    },
  },
  {
    nome: 'Elevador de Carga', mundo: 5, motivo: 'SUBIU DEMAIS',
    montar(L) {
      L.chao(0, 13);
      L.chao(18, 31);
      L.teto(1);
      L.espinhos(0, 2, 32, 'baixo');
      L.espinhos(14, 17, 4);
      L.solido(20, 8, 12, 1);
      L.inicio(2, 15);
      L.porta(29, 8);
      L.placa(9, 11, ['ESPERA O ELEVADOR PARAR', 'ELE PARA NO ÚLTIMO ANDAR', 'SÓ SAI QUANDO PARAR']);
      const elev = L.bloco(14, 16, 4, 1, { mundo: { ...L.mundo, corpo: '#f2c230', topo: '#ffe066' }, subindo: false });
      elev.update = () => {
        if (p.chaoBloco === elev) elev.subindo = true;
        if (elev.subindo) elev.y = Math.max(2 * T, elev.y - 1.6);
      };
      L.elevador = elev;
    },
  },
  {
    nome: 'Ímã Gigante', mundo: 5, motivo: 'GRUDOU NO ÍMÃ',
    montar(L) {
      L.chao();
      L.solido(11, 0, 9, 3);
      L.espinhos(11, 3, 9, 'baixo');
      L.inicio(2, 15);
      L.espinhos(15, 15, 1);
      L.porta(29, 16);
      L.placa(4, 11, ['PULA BEM ALTO NO ESPINHO', 'CAPRICHA NO PULO', 'PULO FORTE!']);
      // O ima puxa quem estiver no ar debaixo dele (e alto o bastante)
      L.coisa({
        update() {
          const cx = centroX();
          if (!p.noChao && cx > 11 * T && cx < 20 * T && p.y < 13 * T) {
            p.vy -= 1.3;
            if (L.t % 6 === 0) som('laser');
          }
        },
        draw() {
          ctx.fillStyle = '#d32f2f';
          ctx.fillRect(13 * T, 0, 2 * T, 2 * T);
          ctx.fillStyle = '#1976d2';
          ctx.fillRect(16 * T, 0, 2 * T, 2 * T);
          texto('ÍMÃ', 15.5 * T, 2.6 * T, { tam: 14 });
        },
      });
    },
  },
  {
    nome: 'Controle de Qualidade', mundo: 5, motivo: 'REPROVADO',
    montar(L) {
      L.chao();
      L.teto(1);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(8, 10, ['PASSE RÁPIDO PELO SCANNER', 'RAPIDINHO!', 'CORRE QUE ELE NÃO VÊ']);
      // O scanner reprova quem passa correndo
      let aprovado = false;
      L.coisa({
        update() {
          const dentro = p.x + p.w > 16 * T + 4 && p.x < 16 * T + 26;
          if (dentro && Math.abs(p.vx) > 2.2) morrer('REPROVADO');
          else if (dentro && !aprovado) { aprovado = true; som('moeda'); dizer('APROVADO ✔', 50); }
        },
        draw() {
          ctx.fillStyle = '#555';
          ctx.fillRect(16 * T, 2 * T, T, 14);
          ctx.fillStyle = aprovado ? '#3ddc8455' : '#39b6ff55';
          ctx.fillRect(16 * T + 4, 2 * T + 14, 22, 14 * T - 14);
          texto(aprovado ? 'APROVADO' : 'SCANNER', 16.5 * T, 2 * T - 6 + 30, { tam: 12 });
        },
      });
    },
  },
  {
    nome: 'Porta em Peças', mundo: 5, motivo: 'A PORTA AINDA NÃO TAVA PRONTA',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.placa(8, 10, ['CORRE, A PORTA VAI FECHAR!', 'RÁPIDO, ANTES QUE FECHE!', 'VAI, VAI, VAI!']);
      // Um guindaste monta a porta. Antes de ficar pronta, ela e' uma guilhotina.
      const porta = L.porta(14, 16, { visivel: true, progresso: 0, aoTocar: () => {
        if (porta.progresso >= 1) vencer();
        else morrer('A PORTA AINDA NÃO TAVA PRONTA');
      } });
      porta.update = () => {
        porta.progresso = Math.min(1, L.t / 300);
        porta.rotulo = porta.progresso >= 1 ? 'PRONTA ✔' : `${Math.floor(porta.progresso * 100)}%`;
        porta.tamRotulo = 14;
        porta.h = 10 + porta.progresso * 35;
        porta.y = 16 * T - porta.h;
      };
      L.portaPecas = porta;
    },
  },
  {
    nome: 'A Máquina de Portas', mundo: 5,
    montar(L) {
      L.chao();
      L.inicio(4, 15);
      L.espinhos(0, 15, 1);
      L.placa(12, 6, ['SÓ A PORTA CERTA ABRE', 'A CERTA É A MAIS BONITA', 'NÃO É A DE CABEÇA PRA BAIXO']);
      const est = esteira(L, 1, 31, 16, -2);
      est.ultimaVel = -2;
      // A maquina cospe portas. Quase todas explodem. A certa vem de cabeca pra baixo.
      const sequencia = [false, false, true, false, false, true];
      let n = 0;
      L.coisa({ update() {
        if (L.t % 115 !== 20) return;
        const certa = sequencia[n++ % sequencia.length];
        const d = L.porta(31, 16, certa ? { invertida: true } : { aoTocar: () => { explosao(d.x + 15, d.y + 20, '#ff8a1f', 20); morrer('A PORTA EXPLODIU'); } });
        d.update = () => { d.x -= 2; if (d.x < -40) L.portas.splice(L.portas.indexOf(d), 1); };
        som('clique');
      } });
      L.coisa({ draw() {
        ctx.fillStyle = '#3a3f47';
        ctx.fillRect(30 * T, 11 * T, 2 * T, 5 * T);
        ctx.fillStyle = '#f2c230';
        ctx.fillRect(30 * T + 6, 12 * T, 2 * T - 12, 10);
      } });
    },
  },
);

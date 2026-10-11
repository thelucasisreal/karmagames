// Mundo 5: Gelo Traiçoeiro (o chao escorrega: a fisica vem de MUNDOS[4].fisica)
'use strict';

FASES.push(
  {
    nome: 'Patinação Artística', mundo: 4, motivo: 'ESCORREGOU NO ESPINHO',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(9, 15, 1);
      L.espinhos(16, 15, 1);
      L.porta(29, 16);
      L.placa(5, 11, ['CUIDADO, ESCORREGA', 'PISA DEVAGARINHO', 'FREIA ANTES DO ESPINHO']);
      // O ultimo espinho escorrega na sua direcao quando voce chega perto
      const solto = L.espinhos(25, 15, 1)[0];
      solto.update = () => {
        if (solto.x - (p.x + p.w) < 120) solto.x = Math.max(20 * T, solto.x - 2.2);
      };
    },
  },
  {
    nome: 'Pinguim Fofoqueiro', mundo: 4, motivo: 'ATROPELADO POR PINGUIM',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(9, 10, ['PINGUINS SÃO FOFOS', 'FAZ CARINHO NELES', 'ELES NÃO MORDEM']);
      bicho(L, 8, 14, 16, { vel: 3, cor: '#263238', motivo: 'ATROPELADO POR PINGUIM' });
      bicho(L, 17, 25, 16, { vel: -3.6, cor: '#263238', motivo: 'ATROPELADO POR PINGUIM', pulaComVoce: true, atrasoPulo: 16 });
    },
  },
  {
    nome: 'Boneco de Neve Atirador', mundo: 4, motivo: 'BOLADA DE NEVE',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(27, 16);
      L.placa(10, 10, ['ELE SÓ QUER BRINCAR', 'GUERRA DE NEVE!', 'FICA PARADINHO PRA FOTO']);
      // Ele mira onde voce esta. Parado = acertado.
      L.coisa({
        update() {
          if (L.t % 70 !== 35) return;
          const ox = 30 * T, oy = 13 * T;
          const voo = 55;
          const alvo = centroX();
          projetil(L, ox, oy, (alvo - 11 - ox) / voo, -(0.3 * voo) / 2 + (16 * T - 22 - oy) / voo, { grav: 0.3, desenhoBala: 'neve', atravessa: true, motivo: 'BOLADA DE NEVE' });
          som('tiro');
        },
        draw() {
          ctx.fillStyle = '#fff';
          for (const [y, r] of [[16 * T - 22, 22], [16 * T - 56, 16], [16 * T - 82, 12]]) {
            ctx.beginPath();
            ctx.arc(30 * T + 15, y, r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#111';
          ctx.fillRect(30 * T + 9, 16 * T - 86, 3, 3);
          ctx.fillRect(30 * T + 17, 16 * T - 86, 3, 3);
          ctx.fillStyle = '#ff8a1f';
          ctx.fillRect(30 * T + 2, 16 * T - 82, 10, 3);
        },
      });
    },
  },
  {
    nome: 'Estalactites', mundo: 4, motivo: 'ESPETADO POR PICOLÉ',
    montar(L) {
      L.chao();
      L.teto(1);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(6, 11, ['DEVAGAR, ESCORREGA...', 'ANDA COM CALMA', 'SEM PRESSA']);
      // Caem quando voce chega perto. Quem passa correndo deixa elas pra tras.
      for (const c of [10, 14, 18, 22]) {
        const e = L.espinhos(c, 2, 1, 'baixo', { motivo: 'ESPETADO POR PICOLÉ', caindo: false, cor: '#cfefff' })[0];
        e.update = () => {
          if (!e.caindo && Math.abs(centroX() - (e.x + 15)) < 60) { e.caindo = true; som('crack'); }
          if (e.caindo && e.y < 15 * T) e.y = Math.min(15 * T, e.y + 16);
        };
      }
    },
  },
  {
    nome: 'Lago Congelado', mundo: 4, motivo: 'MERGULHO GELADO', motivoQueda: 'MERGULHO GELADO',
    montar(L) {
      L.chao(0, 8);
      L.chao(23, 31);
      L.espinhos(9, 17, 14);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(11, 11, ['PULE AS RACHADURAS!', 'NÃO PISA NA RACHADURA!', 'RACHADURA = PERIGO']);
      // Gelo fino: aguenta quem anda, quebra quem cai de pulo em cima
      const placas = [];
      for (let c = 9; c <= 22; c++) {
        const b = L.bloco(c, 16, 1, 1, { mundo: { ...L.mundo, corpo: '#a8dcff', topo: '#ffffff' }, rachado: [11, 15, 19].includes(c) });
        const desenhoNormal = () => desenharBloco(b.x, b.y, b.w, b.h, b.mundo);
        b.desenhar = () => {
          desenhoNormal();
          if (b.rachado) {
            ctx.strokeStyle = '#5a92bd';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(b.x + 4, b.y + 6); ctx.lineTo(b.x + 15, b.y + 16); ctx.lineTo(b.x + 26, b.y + 9);
            ctx.stroke();
          }
        };
        placas.push(b);
      }
      let vy = 0;
      L.coisa({ update() { if (!p.noChao) vy = p.vy; } });
      L.aoPousar = () => {
        const b = p.chaoBloco;
        if (!placas.includes(b) || vy < 4) return;
        som('crack');
        dizer('CRACK!', 40);
        const i = placas.indexOf(b);
        const quebradas = placas.slice(Math.max(0, i - 2), i + 3);
        for (const q of quebradas) q.solido = false;
        derrubar(quebradas, 1);
      };
    },
  },
  {
    nome: 'Avalanche', mundo: 4, motivo: 'VIROU BONECO DE NEVE',
    montar(L) {
      L.chao();
      L.inicio(3, 15);
      L.porta(30, 16);
      L.placa(10, 10, ['QUE BARULHO É ESSE?', 'ESCUTOU ALGUMA COISA?', 'DEVE SER NADA']);
      // A bola de neve vem da direita e cresce. Pular por cima dela e' o unico jeito.
      const bola = L.coisa({ x: W + 20, r: 16, ang: 0,
        update() {
          if (L.t < 60) return;
          bola.x -= 3.6;
          bola.r = Math.min(34, bola.r + 0.06);
          bola.ang -= 3.6 / bola.r;
          const caixa = { x: bola.x - bola.r + 6, y: 16 * T - bola.r * 2 + 6, w: bola.r * 2 - 12, h: bola.r * 2 - 6 };
          if (toca(caixa, hitJogador())) morrer('VIROU BONECO DE NEVE');
        },
        draw() {
          ctx.save();
          ctx.translate(bola.x, 16 * T - bola.r);
          ctx.rotate(bola.ang);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, bola.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#b8d8ee';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, bola.r * 0.6, 0, 2);
          ctx.stroke();
          ctx.restore();
        },
      });
      L.bola = bola;
    },
  },
  {
    nome: 'Gelo Fino', mundo: 4, motivoQueda: 'CONFIOU NO GELO BONITO',
    montar(L) {
      L.chao(0, 7);
      L.chao(23, 31);
      L.espinhos(8, 17, 15);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(12, 10, ['PISE SÓ NO GELO BONITINHO', 'O RACHADO QUEBRA, HEIN', 'EVITE O GELO RACHADO']);
      // O gelo lisinho e' de mentira. O rachado e' firme.
      for (let c = 8; c <= 22; c++) {
        const firme = (c - 8) % 5 < 3;
        const b = L.bloco(c, 16, 1, 1, { solido: firme, mundo: { ...L.mundo, corpo: '#bfe6ff', topo: '#ffffff' } });
        b.desenhar = () => {
          desenharBloco(b.x, b.y, b.w, b.h, b.mundo);
          if (firme) {
            ctx.strokeStyle = '#5a92bd';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(b.x + 3, b.y + 5); ctx.lineTo(b.x + 14, b.y + 18); ctx.lineTo(b.x + 27, b.y + 8);
            ctx.moveTo(b.x + 14, b.y + 18); ctx.lineTo(b.x + 12, b.y + 28);
            ctx.stroke();
          }
        };
      }
    },
  },
  {
    nome: 'Neve Que Esconde', mundo: 4, motivo: 'TINHA ESPINHO NA NEVE',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(7, 10, ['PULE OS ESPINHOS!', 'CUIDADO COM OS ESPINHOS!', 'ESPINHO MATA, VIU?']);
      // Os espinhos que aparecem sao de papelao. Os de verdade estao debaixo dos montinhos de neve.
      for (const c of [8, 15, 22]) {
        L.coisa({ draw() {
          ctx.fillStyle = '#c8a27a';
          ctx.strokeStyle = '#8a6a4a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(c * T + 2, 16 * T); ctx.lineTo(c * T + 15, 15 * T); ctx.lineTo(c * T + 28, 16 * T);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } });
      }
      for (const c of [11, 18, 25]) {
        L.perigos.push({ x: c * T, y: 15 * T, w: T, h: T, tipo: 'monte', ativo: true, visivel: true, motivo: 'TINHA ESPINHO NA NEVE', hit: [6, 14, 18, 16],
          desenhar(e) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(e.x + 15, e.y + 30, 18, 12, 0, Math.PI, 0);
            ctx.fill();
          } });
      }
    },
  },
  {
    nome: 'Teleférico', mundo: 4, motivoQueda: 'O TELEFÉRICO CAIU',
    // Aqui nao escorrega: o bondinho tem tapete
    fisica: { acel: 0.45, acelAr: 0.35, freio: 0.55, freioAr: 0.92 },
    montar(L) {
      L.chao(0, 5);
      L.espinhos(6, 17, 26);
      L.solido(21, 10, 11, 1);
      L.inicio(2, 15);
      L.porta(29, 10);
      L.placa(12, 6, ['PODE IR ATÉ O FIM DA LINHA', 'RELAXA E CURTE A VISTA', 'É SEGURO, CONFIA']);
      // O bondinho vai ate o fim, espera um pouco... e despenca
      const bonde = L.bloco(5, 13, 3, 1, { estado: 'parado', t: 0, mundo: { ...L.mundo, corpo: '#d33', topo: '#ff6b6b' } });
      bonde.update = () => {
        if (bonde.estado === 'parado' && p.chaoBloco === bonde) bonde.estado = 'indo';
        if (bonde.estado === 'indo') {
          bonde.x = Math.min(17 * T, bonde.x + 1.6);
          if (bonde.x >= 17 * T) { bonde.estado = 'fim'; bonde.t = 45; }
        }
        if (bonde.estado === 'fim' && --bonde.t <= 0) { bonde.estado = 'caindo'; som('crack'); }
        if (bonde.estado === 'caindo') bonde.y += 6;
      };
      L.coisa({ draw() {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 7 * T);
        ctx.lineTo(W, 7 * T);
        ctx.stroke();
        if (bonde.estado !== 'caindo') {
          ctx.beginPath();
          ctx.moveTo(bonde.x + 45, 7 * T);
          ctx.lineTo(bonde.x + 45, bonde.y);
          ctx.stroke();
        }
      } });
      L.bonde = bonde;
    },
  },
  {
    nome: 'Yeti Porteiro', mundo: 4, motivo: 'ABRAÇO DE YETI',
    montar(L) {
      L.chao();
      L.solido(24, 0, 8, 12);
      L.inicio(2, 15);
      L.porta(29, 16);
      L.placa(9, 9, ['ELE NÃO DEIXA NINGUÉM PASSAR', 'NEM ADIANTA TENTAR', 'ELE IMITA TUDO QUE VOCÊ FAZ']);
      L.espinhos(24, 12, 8, 'baixo', { cor: '#cfefff' });
      // O yeti pula quando voce pula... e bate a cabeca nas estalactites. 3 vezes e ele desmaia.
      const yeti = { x: 26 * T, y: 16 * T - 54, w: 44, h: 54, vy: 0, golpes: 0, tipo: 'yeti', ativo: true, visivel: true, motivo: 'ABRAÇO DE YETI',
        update() {
          if (yeti.golpes >= 3) {
            yeti.ativo = false;
            yeti.y = Math.min(16 * T - 30, yeti.y + 2);
            return;
          }
          const noChao = yeti.y >= 16 * T - 54;
          if (p.cmd?.apertou && noChao) yeti.vy = -9;
          yeti.vy += 0.55;
          yeti.y = Math.min(16 * T - 54, yeti.y + yeti.vy);
          if (yeti.y < 12 * T + 14) {
            yeti.y = 12 * T + 14;
            yeti.vy = 2;
            yeti.golpes++;
            tremor = 6;
            som('esmagar');
            dizer(['AI!', 'AIAI!', 'NOCAUTE!'][yeti.golpes - 1], 40);
          }
        },
        desenhar() {
          const d = yeti.golpes >= 3;
          ctx.fillStyle = '#f2f2f2';
          ctx.beginPath();
          ctx.roundRect(yeti.x, yeti.y, yeti.w, d ? 30 : yeti.h, 12);
          ctx.fill();
          ctx.fillStyle = '#6fb3d9';
          ctx.fillRect(yeti.x + 10, yeti.y + 10, 24, 18);
          ctx.fillStyle = '#111';
          if (d) {
            texto('x x', yeti.x + 22, yeti.y + 16, { tam: 12, cor: '#111', contorno: null });
          } else {
            ctx.fillRect(yeti.x + 14, yeti.y + 14, 4, 4);
            ctx.fillRect(yeti.x + 26, yeti.y + 14, 4, 4);
          }
          if (d) texto('zzz', yeti.x + 50, yeti.y - 8, { tam: 14, cor: '#bfe3ff' });
        } };
      L.perigos.push(yeti);
      L.yeti = yeti;
    },
  },
);

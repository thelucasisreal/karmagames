// Mundo 1: Grama Inocente
'use strict';

FASES.push(
  {
    nome: 'Bem-vindo, Otário', mundo: 0, motivoQueda: 'O CHÃO TE ODEIA',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.porta(29, 16);
      // Sem placas de ajuda: o chao cai logo no comeco, no meio e bem na frente da porta
      desmoronar(L, 4, 7);
      desmoronar(L, 13, 16);
      desmoronar(L, 25, 28);
      // Depois do buraco do meio os controles invertem, sem aviso nenhum
      L.semAvisoInversao = true;
      L.gatilho(18, 0, 1, 18, () => { L.inverter = true; som('glitch'); });
    },
  },
  {
    nome: 'A Porta É Tímida', mundo: 0, motivoQueda: 'BURACO SECRETO',
    montar(L) {
      L.chao();
      L.inicio(4, 15);
      // Um buraco bem obvio... e logo depois dele um secreto, que abre quando voce pisa
      L.buraco(12, 13);
      L.placa(18, 11, 'SAÍDA →');
      const espinhosSecretos = L.espinhos(15, 17, 3, 'cima', { visivel: false });
      // Dois blocos por coluna (igualzinho ao chao de verdade)
      const secreto = [15, 16, 17].flatMap(c => {
        L.solido(c, 16, 1, 2, 0);
        return [L.bloco(c, 16, 1, 1), L.bloco(c, 17, 1, 1, { comTopo: false })];
      });
      L.gatilho(15, 15, 3, 1, () => {
        for (const b of secreto) { b.solido = false; b.visivel = false; }
        for (const e of espinhosSecretos) e.visivel = true;
        som('crack');
      });
      const d = L.porta(28, 16, { estado: 'parada' });
      L.portaTimida = d;
      // Espinhos que caem do teto quando voce chega perto dela no final
      const chuva = [0, 1, 2].map(c => L.espinhos(c, 3, 1, 'baixo', { ativo: false, visivel: false, motivo: 'CHUVA DE ESPINHO' })[0]);
      d.update = () => {
        if (d.estado === 'parada') {
          const dist = d.x - (p.x + p.w);
          if (dist < 150 && dist > -20 && p.vx > 0.3) {
            d.estado = 'fugindo';
            som('risada');
            dizer('A PORTA FICOU COM VERGONHA', 70);
          }
        } else if (d.estado === 'fugindo') {
          d.x += Math.max(p.vx * 1.3, 3);
          if (d.x > W + 10) { d.estado = 'longe'; d.t = 40; }
        } else if (d.estado === 'longe') {
          // Ela volta correndo... e atropela quem estiver no caminho
          if (--d.t <= 0) { d.estado = 'atropelando'; d.olhos = true; d.dentes = true; som('nhac'); }
        } else if (d.estado === 'atropelando') {
          d.x -= 7;
          if (toca(d, hitJogador())) morrer('ATROPELADO PELA PORTA');
          if (d.x <= T) { d.x = T; d.estado = 'esperando'; d.olhos = false; d.dentes = false; poof(d.x + 15, d.y + 20); }
        } else if (d.estado === 'esperando') {
          if (Math.abs(centroX() - (d.x + 15)) < 120) {
            d.estado = 'chovendo';
            som('crack');
            for (const e of chuva) {
              e.ativo = e.visivel = true;
              e.update = () => {
                e.y += 14;
                if (e.y >= 16 * T - 8) { e.ativo = e.visivel = false; e.update = null; poof(e.x + 15, e.y + 15); }
              };
            }
          }
        } else if (d.estado === 'chovendo' && chuva.every(e => !e.visivel)) {
          d.estado = 'pronta';
        }
      };
      d.aoTocar = () => {
        if (d.estado === 'pronta') vencer();
        else if (d.estado === 'atropelando') morrer('ATROPELADO PELA PORTA');
      };
    },
  },
  {
    nome: 'Plataformas Fofoqueiras', mundo: 0, motivo: 'TRAÍDO PELA PLATAFORMA', motivoQueda: 'TRAÍDO PELA PLATAFORMA',
    montar(L) {
      L.chao();
      L.inicio(2, 15);
      L.solido(8, 16, 16, 2, 0);
      L.espinhos(8, 17, 16);
      L.placa(4, 12, 'NÃO OLHE PRA BAIXO');
      L.porta(29, 16);
      // Ponte invisivel: so existe pra quem atravessa andando, sem pular
      const ponte = L.bloco(8, 16, 16, 1, { visivel: false });
      let pulou = false;
      // No fim da ponte sobe uma torre de espinhos: tem que esperar.
      // Quem espera leva um espinho voando na cara (pula!). Depois a torre desce,
      // e assim que voce passa por ela vem outro espinho voando do nada.
      const torre = L.espinhos(24, 10, 1, 'cima', { ativo: false, visivel: false, motivo: 'TORRE DE ESPINHO' });
      for (let r = 11; r <= 15; r++) torre.push(...L.espinhos(24, r, 1, 'cima', { ativo: false, visivel: false, motivo: 'TORRE DE ESPINHO' }));
      const T3 = { estado: 'escondida', t: 0 };
      L.torre = T3;
      // Aparece tremendo meio segundo e depois dispara muito rapido
      const voador = (x, espera) => {
        const e = criarVoador(x);
        const voar = e.update;
        e.update = () => {
          if (espera-- > 0) { e.x = x + (Math.random() - 0.5) * 3; return; }
          voar();
        };
        return e;
      };
      const criarVoador = x => projetil(L, x, 16 * T - 24, -9, 0, { w: 30, h: 20, motivo: 'ESPINHO VOADOR', atravessa: true,
        desenhar: e => {
          ctx.fillStyle = L.mundo.espinho;
          ctx.strokeStyle = L.mundo.espinhoBorda;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y + e.h / 2);
          ctx.lineTo(e.x + e.w, e.y + 1);
          ctx.lineTo(e.x + e.w, e.y + e.h - 1);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } });
      L.coisa({
        update() {
          const centro = p.x + p.w / 2;
          T3.t++;
          if (T3.estado === 'escondida' && centro > 21 * T) {
            T3.estado = 'subiu';
            T3.t = 0;
            for (const e of torre) { e.ativo = e.visivel = true; e.escala = 0; }
            som('espinho');
          } else if (T3.estado === 'subiu' && T3.t === 70) {
            T3.estado = 'atirou';
            T3.t = 0;
            voador(24 * T, 30);
            som('tiro');
          } else if (T3.estado === 'atirou' && T3.t === 50) {
            T3.estado = 'descendo';
            som('crack');
          } else if (T3.estado === 'descendo') {
            for (const e of torre) e.y += 6;
            if (torre[0].y > 17 * T) {
              T3.estado = 'aberta';
              for (const e of torre) e.ativo = e.visivel = false;
            }
          } else if (T3.estado === 'aberta' && centro > 25 * T) {
            T3.estado = 'final';
            voador(W + 10, 0);
            som('tiro');
          }
          if (T3.estado === 'escondida' && centro > 8 * T && centro < 24 * T && p.vy * p.grav < 0) pulou = true;
          ponte.solido = !pulou;
        },
      });
      for (const [c, r] of [[10, 12], [15, 11], [20, 12]]) {
        const b = L.bloco(c, r, 2, 1, { alvoX: null });
        b.update = () => {
          if (b.alvoX === null && p.vy > 0 && p.x + p.w > b.x && p.x < b.x + b.w) {
            const folga = b.y - (p.y + p.h);
            if (folga > -4 && folga < 55) {
              b.alvoX = b.x + (p.x + p.w / 2 < b.x + b.w / 2 ? 95 : -95);
              som('risadinha');
            }
          }
          if (b.alvoX !== null) b.x += (b.alvoX - b.x) * 0.35;
        };
      }
    },
  },
  {
    nome: 'O Teto Também É Chão', mundo: 0, puloInverte: true, motivo: 'ESPETADO DE PONTA-CABEÇA',
    montar(L) {
      L.solido(0, 14, 32, 4);
      L.solido(0, 0, 32, 5);
      L.inicio(2, 13);
      L.espinhos(8, 13, 5, 'cima');
      L.espinhos(20, 13, 4, 'cima');
      L.espinhos(14, 5, 5, 'baixo');
      L.espinhos(24, 5, 3, 'baixo');
      L.placa(4, 10, 'PULE OS ESPINHOS!');
      // A porta esta presa com correntes. O botao vermelho (em cima de um espinho) solta ela.
      let aberta = false;
      const porta = L.porta(30, 0, { invertida: true, y: 5 * T, aoTocar: () => { if (aberta) vencer(); } });
      L.espinhos(27, 13, 2, 'cima');
      const botao = L.bloco(27, 0, 2, 1, { y: 13 * T - 10, h: 10, apertado: false,
        desenhar: b => {
          ctx.fillStyle = '#333';
          ctx.fillRect(b.x + 6, b.y + 6, b.w - 12, 4);
          ctx.fillStyle = '#ff3b3b';
          ctx.fillRect(b.x + 8, b.y + (b.apertado ? 4 : 0), b.w - 16, b.apertado ? 3 : 7);
        } });
      L.aoPousar = () => {
        if (p.chaoBloco !== botao || botao.apertado) return;
        botao.apertado = true;
        aberta = true;
        som('esmagar');
        for (let i = 0; i < 6; i++) poof(porta.x + 15, porta.y + i * 8);
        dizer('AS CORRENTES QUEBRARAM!', 60);
      };
      L.botaoCorrente = botao;
      // Nos ultimos espinhos o chao do fim se enche de espinho
      const extras = L.espinhos(24, 13, 3, 'cima', { ativo: false, visivel: false }).concat(L.espinhos(29, 13, 3, 'cima', { ativo: false, visivel: false }));
      L.coisa({
        update() {
          if (extras[0].ativo || centroX() < 20 * T) return;
          for (const e of extras) { e.ativo = e.visivel = true; e.escala = 0; }
          som('espinho');
        },
        draw() {
          if (aberta) return;
          ctx.strokeStyle = '#9aa0a6';
          ctx.lineWidth = 3;
          for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(porta.x - 4, porta.y + 10 + i * 18);
            ctx.lineTo(porta.x + 34, porta.y + 22 + i * 18);
            ctx.moveTo(porta.x + 34, porta.y + 10 + i * 18);
            ctx.lineTo(porta.x - 4, porta.y + 22 + i * 18);
            ctx.stroke();
          }
          ctx.fillStyle = '#c9c9d6';
          ctx.fillRect(porta.x + 9, porta.y + 18, 12, 10);
        },
      });
    },
  },
  {
    nome: 'Checkpoint Amigo', mundo: 0, motivoQueda: 'SALVO... NO BURACO',
    montar(L, tentativa, memoria) {
      // 1. Checkpoint falso que derruba o chao
      L.chao(0, 2);
      const pisos = [];
      for (let c = 3; c <= 7; c++) pisos.push(L.bloco(c, 16, 1, 2));
      L.inicio(1, 15);
      bandeira(L, 4, () => {
        dizer('CHECKPOINT SALVO! :)');
        som('moeda');
        L.depois(0.2, () => { som('risada'); derrubar(pisos, 1); });
      });
      // 2. Plataforma rapida que vai e volta, e outra que desaba quase na hora
      L.espinhos(8, 17, 7);
      L.plataformaCp = plataforma(L, 8, 14, 2, { dx: 3, vel: 2.2 });
      const fragil = L.bloco(13, 12, 2, 1, { mundo: { ...L.mundo, topo: '#c9a36a' } });
      L.fragil = fragil;
      L.aoPousar = () => {
        if (p.chaoBloco !== fragil || fragil.caindo) return;
        fragil.caindo = true;
        som('crack');
        L.depois(0.25, () => { fragil.solido = false; derrubar([fragil], 0); });
      };
      // 3. Checkpoint de verdade
      L.chao(15, 31);
      bandeira(L, 16, () => {
        memoria.checkpoint = { x: 16 * T + 5, y: 16 * T - 26 };
        dizer('ESSE É DE VERDADE', 50);
        som('moeda');
      }, { ativa: !!memoria.checkpoint });
      // 4. Corredor do pulinho com laser no fim
      L.solido(18, 0, 8, 12);
      L.espinhos(18, 12, 8, 'baixo');
      L.espinhos(19, 15, 1);
      L.espinhos(24, 15, 1);
      L.laserCp = laser(L, 22, 12, 15, { ligado: 45, desligado: 55, fase: 20 });
      // 5. Canhao no fim atirando pelo chao (a bola atravessa a fase toda)
      canhao(L, 31, 15, -1, { periodo: 150, vel: 4, fase: 100 });
      // 6. Onde voce encostar no chao do final nasce espinho: pulao direto na porta
      const zona = [27, 29];
      const brotou = new Set();
      L.coisa({ update() {
        if (!p.noChao) return;
        const c = Math.floor(centroX() / T);
        if (c >= zona[0] && c <= zona[1] && !brotou.has(c)) {
          brotou.add(c);
          L.espinhos(c, 15, 1)[0].escala = 0;
          som('espinho');
        }
      }, draw() {
        ctx.fillStyle = '#00000014';
        ctx.fillRect(zona[0] * T, 16 * T, (zona[1] - zona[0] + 1) * T, 4);
      } });
      L.porta(30, 16);
    },
  },
  {
    nome: 'A Porta Fujona 2.0', mundo: 0, motivoQueda: 'CORREU ATRÁS DA PORTA',
    montar(L) {
      L.chao(0, 24);
      L.espinhos(25, 17, 7);
      L.inicio(16, 15);
      // Parede na esquerda pra voce poder "andar parado" enquanto ela vem
      L.solido(2, 13, 1, 3);
      // No caminho pra tras o chao desaba: tem que pular enquanto a porta corre atras de voce
      desmoronar(L, 8, 11, { intervalo: 1 });
      L.placa(10, 11, ['A PORTA TÁ ALI →', 'VAI, PEGA ELA →', 'AGORA ELA NÃO FOGE →', 'CONFIA →']);
      const d = L.porta(22, 16, { olhos: true });
      // Quando voce quase alcanca, ela teleporta pro outro lado (1 vez, ou ate 3 com o dado)
      let saltos = SORTE ? entre(1, 3) : 1;
      const vem = SORTE ? 5.5 + Math.random() * 1.5 : 6;
      // Andou pra frente: ela foge. Andou pra tras: ela vem atras de voce.
      d.update = () => {
        const dir = p.cmd?.dir || 0;
        if (dir > 0) d.x += 5.5;
        else if (dir < 0) d.x -= vem;
        d.x = limitar(d.x, 0, W - d.w);
        if (saltos > 0 && Math.abs(d.x + d.w / 2 - centroX()) < 45) {
          saltos--;
          poof(d.x + 15, d.y + 20);
          d.x = 23 * T;
          poof(d.x + 15, d.y + 20);
          som('risada');
          dizer(sortear(['QUASE!', 'TCHAU!', 'PEGA EU!', 'AINDA NÃO']), 50);
        }
      };
    },
  },
  {
    nome: 'Não Aperte o Botão', mundo: 0, motivo: 'CHUVA DE ESPINHO',
    montar(L, tentativa) {
      L.chao();
      L.solido(26, 0, 1, 16);
      L.inicio(1, 15);
      L.porta(29, 16);
      L.placa(13, 9, ['SÓ UM É O CERTO', 'ERROU, MORREU', 'ESCOLHE BEM', 'TEM CERTEZA?']);
      // 13 botoes colados no chao, com um quadradinho de chao entre eles: so um abre a parede.
      // O certo muda a cada morte e so pisca rapidinho no comeco (quem piscou, perdeu).
      const certo = SORTE ? entre(0, 12) : 1;
      const pisca = () => (L.t > 20 && L.t < 30) || (L.t > 58 && L.t < 63);
      const mentiras = ['ESSE ✔', 'CONFIA', 'NÃO', 'EU!', '100%', 'SIM', 'ESSE', 'PISA', 'AQUI', 'CERTO', 'JURO', 'VAI', 'OK'];
      const botoes = [];
      for (let i = 0; i < 13; i++) {
        const cor = sortear(['#3ddc84', '#ff3b3b', '#ffd23f', '#4aa8ff']);
        botoes.push(botao(L, i * 2, 16, () => {
          if (i !== certo) {
            som('risada');
            flash = 0.6;
            return morrer(sortear(['BOTÃO ERRADO, GÊNIO', 'ERA O OUTRO, ÓBVIO', 'APERTOU O ERRADO KKKK', 'UM EM TREZE E VOCÊ ERROU']));
          }
          for (const b of botoes) b.apertado = true;
          L.solido(26, 0, 1, 16, 0);
          for (let r = 0; r < 16; r++) poof(26 * T + 15, r * T + 15);
          som('esmagar');
          dizer('...TÁ, ACERTOU. SORTE.');
        }, { rotulo: mentiras[(i + L.tentativa) % mentiras.length], cor, largura: 1, piscar: () => i === certo && pisca() }));
      }
    },
  },
  {
    nome: 'Buraco Amigo', mundo: 0, saidaBaixo: true,
    montar(L) {
      // Em cima: o buraco "da saida" tem espinho e a porta te soca. O caminho de verdade e' um
      // buraco escondido logo atras de onde voce nasce, que cai num tunel secreto.
      L.chao();
      L.solido(0, 10, COLS, 1);
      L.solido(0, 11, 1, 5);
      L.inicio(14, 9);
      for (const c of [11, 12]) {
        L.solido(c, 10, 1, 1, 0);
        L.bloco(c, 10, 1, 1, { solido: false });
      }
      L.solido(20, 10, 3, 1, 0);
      L.espinhos(20, 10, 3, 'cima', { motivo: 'ERA SÓ UM BURACO COM ESPINHO, GÊNIO' });
      L.placa(21, 6, ['⚠ CUIDADO: BURACO ⚠', '⚠ NEM PENSE EM PULAR ⚠', '⚠ É SÉRIO, É FUNDO ⚠']);
      L.placa(21, 8, 'SAÍDA ↓');
      L.porta(29, 10, { aoTocar: () => morrer('A PORTA TE DEU UM SOCO') });
      // No tunel tem dois buracos limpinhos, um de cada lado... e nenhum dos dois e' a saida
      // (o espinho ta la no fundo, so que invisivel)
      L.buraco(7, 8);
      L.buraco(15, 16);
      for (const e of L.perigos.filter(e => e.y === 17 * T)) { e.visivel = false; e.motivo = 'NENHUM DOS DOIS, NÉ'; }
      L.placa(7.5, 13, '← SAÍDA');
      L.placa(15.5, 13, 'SAÍDA →');
      // Enquanto voce esta em cima, o tunel parece terra maciça
      const capa = L.coisa({
        aberto: false,
        update() { if (p.y > 10.5 * T) capa.aberto = true; },
        draw() {
          if (capa.aberto) return;
          for (let r = 11; r < LINHAS; r++) for (let c = 1; c < COLS; c++) desenharBloco(c * T, r * T, T, T, L.mundo, false);
        },
      });
      // Pulou o da esquerda: o buraco de verdade abre logo na frente dele
      L.gatilho(5, 11, 2, 5, () => {
        L.solido(3, 16, 2, 2, 0);
        poof(4 * T, 16 * T);
        som('crack');
        dizer('AGORA SIM, PULA', 50);
      });
    },
  },
  {
    nome: 'Batatinha Frita 1, 2, 3', mundo: 0, motivo: 'O OLHO TE VIU',
    montar(L, tentativa) {
      L.chao();
      L.inicio(2, 15);
      L.espinhos(16, 15, 1);
      L.porta(29, 16);
      // Olho gigante: fechado, aviso (pisca), aberto. Se te ver mexendo, ja era.
      const fechados = [150, 110, 130, 95];
      const olho = L.coisa({ estado: 'fechado', t: fechados[tentativa % 4], n: tentativa,
        update() {
          if (--olho.t > 0) {
            if (olho.estado === 'aberto' && (Math.abs(p.vx) > 0.6 || !p.noChao)) morrer('O OLHO TE VIU');
            return;
          }
          if (olho.estado === 'fechado') { olho.estado = 'aviso'; olho.t = 28; som('clique'); }
          else if (olho.estado === 'aviso') { olho.estado = 'aberto'; olho.t = 70; som('laser'); }
          else { olho.estado = 'fechado'; olho.t = fechados[++olho.n % 4]; }
        },
        draw() {
          const x = W / 2, y = 115;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          const abertura = olho.estado === 'aberto' ? 30 : olho.estado === 'aviso' ? (quadro % 10 < 5 ? 14 : 3) : 2;
          ctx.ellipse(x, y, 70, abertura, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 4;
          ctx.stroke();
          if (olho.estado === 'aberto') {
            ctx.fillStyle = '#d11';
            ctx.beginPath();
            ctx.arc(x + limitar((p.x - x) / 20, -30, 30), y, 16, 0, Math.PI * 2);
            ctx.fill();
          }
          texto(olho.estado === 'aberto' ? 'PARADO!' : olho.estado === 'aviso' ? '...' : 'zzz', x, y + 55, { tam: 20 });
        },
      });
      L.olho = olho;
    },
  },
  {
    nome: 'Pedra Rolante', mundo: 0, motivo: 'ROLOU POR CIMA',
    montar(L) {
      L.chao();
      L.inicio(3, 15);
      L.espinhos(10, 15, 1);
      L.espinhos(17, 15, 1);
      L.solido(27, 10, 1, 6);
      L.porta(30, 16);
      L.placa(13, 11, ['CORRE!', 'CORRE MAIS!', 'CORRE... OU NÃO']);
      const pedra = L.coisa({ x: -70, y: 16 * T - 56, w: 56, h: 56, ang: 0, rolando: false, quebrou: false,
        update() {
          if (L.t === 50) { pedra.rolando = true; som('esmagar'); tremor = 6; }
          if (!pedra.rolando) return;
          pedra.x += 3.4;
          pedra.ang += 3.4 / 28;
          if (!pedra.quebrou && pedra.x + pedra.w >= 27 * T) {
            pedra.quebrou = true;
            L.solido(27, 10, 1, 6, 0);
            for (let r = 10; r < 16; r++) poof(27 * T + 15, r * T + 15);
            tremor = 12;
            som('esmagar');
          }
          const c = { x: pedra.x + 8, y: pedra.y + 8, w: pedra.w - 16, h: pedra.h - 8 };
          if (toca(c, hitJogador())) morrer('ROLOU POR CIMA');
        },
        draw() {
          ctx.save();
          ctx.translate(pedra.x + 28, pedra.y + 28);
          ctx.rotate(pedra.ang);
          ctx.fillStyle = '#7d7268';
          ctx.beginPath();
          ctx.arc(0, 0, 28, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#4f4740';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-14, -6); ctx.lineTo(6, 4); ctx.moveTo(4, -16); ctx.lineTo(10, -2);
          ctx.stroke();
          ctx.restore();
        },
      });
      L.pedra = pedra;
    },
  },
);

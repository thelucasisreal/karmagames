/*
  Catálogo da Karma Games.

  Para adicionar um jogo:
    1. Crie a pasta  jogos/<slug>/  com um index.html dentro (o jogo).
    2. Coloque uma imagem de capa em  assets/capas/<slug>.webp  (16:10, ~800x500).
    3. Copie um bloco abaixo e preencha os campos.

  Campos:
    slug       identificador curto, sem espaços (vira o endereço: jogar.html?j=slug)
    titulo     nome que aparece no site
    descricao  uma frase curta
    categoria  "Arcade" | "Quebra-cabeça" | "Clássicos" | "Ação" | ... (cria filtro sozinho)
    controles  texto curto mostrado na página do jogo
    autor      quem fez
    autoral    opcional: true para jogos feitos por você. Eles aparecem na seção "Feitos aqui"
    url        opcional: link de jogo hospedado fora (abre no iframe). Sem url, usa jogos/<slug>/
    destaque   opcional: true coloca o jogo no topo da página inicial
    emBreve    opcional: true mostra o jogo na seção "Em breve", sem botão de jogar
    adicionado data no formato AAAA-MM-DD (jogos dos últimos 30 dias ganham selo "Novo")
*/
window.KARMA_JOGOS = [
  {
    slug: "pitch",
    titulo: "Pitch",
    descricao: "Futebol 3D no navegador. Você é o camisa 10 no modo carreira, do campo de várzea até a glória.",
    categoria: "Esporte",
    autor: "Karma Games",
    autoral: true,
    emBreve: true,
  },
  {
    slug: "voo-livre",
    titulo: "Voo Livre",
    descricao: "Bata as asas, passe entre as colunas e não encoste em nada.",
    categoria: "Arcade",
    controles: "Espaço, clique ou toque para voar",
    autor: "Karma Games",
    destaque: true,
    adicionado: "2026-10-03",
  },
  {
    slug: "cobrinha",
    titulo: "Cobrinha",
    descricao: "Coma, cresça e não morda o próprio rabo.",
    categoria: "Clássicos",
    controles: "Setas ou WASD · deslize no celular",
    autor: "Karma Games",
    adicionado: "2026-10-03",
  },
  {
    slug: "2048",
    titulo: "2048",
    descricao: "Junte números iguais até chegar no 2048.",
    categoria: "Quebra-cabeça",
    controles: "Setas ou WASD · deslize no celular",
    autor: "Karma Games",
    adicionado: "2026-10-03",
  },
  {
    slug: "quebra-blocos",
    titulo: "Quebra-Blocos",
    descricao: "Rebata a bola e derrube todos os blocos da fase.",
    categoria: "Arcade",
    controles: "Mouse, setas ou arraste o dedo",
    autor: "Karma Games",
    adicionado: "2026-10-03",
  },
  {
    slug: "campo-minado",
    titulo: "Campo Minado",
    descricao: "Abra o campo inteiro sem pisar em nenhuma mina.",
    categoria: "Quebra-cabeça",
    controles: "Clique para abrir · botão direito ou toque longo marca",
    autor: "Karma Games",
    adicionado: "2026-10-03",
  },
  {
    slug: "memoria",
    titulo: "Jogo da Memória",
    descricao: "Vire as cartas e encontre todos os pares no menor número de jogadas.",
    categoria: "Quebra-cabeça",
    controles: "Clique ou toque nas cartas",
    autor: "Karma Games",
    adicionado: "2026-10-03",
  },
  {
    slug: "pong",
    titulo: "Pong",
    descricao: "O primeiro jogo de bola contra o computador. Faça 7 pontos.",
    categoria: "Clássicos",
    controles: "Mouse, setas ou arraste o dedo",
    autor: "Karma Games",
    adicionado: "2026-10-03",
  },
  {
    slug: "jogo-da-velha",
    titulo: "Jogo da Velha",
    descricao: "Contra o computador ou contra um amigo no mesmo aparelho.",
    categoria: "Clássicos",
    controles: "Clique ou toque na casa",
    autor: "Karma Games",
    adicionado: "2026-10-03",
  },
];

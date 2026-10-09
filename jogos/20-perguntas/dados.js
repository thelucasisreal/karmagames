// Banco de segredos e perguntas. Fica so no servidor: o navegador nunca recebe a lista de segredos.

export const CATEGORIAS = {
  animais: 'Animais',
  pessoas: 'Pessoas/Personagens',
  objetos: 'Objetos',
  lugares: 'Lugares',
  surpresa: 'Geral/Surpresa',
};

export const DIFICULDADES = { facil: 'Fácil', medio: 'Média', dificil: 'Difícil' };
export const NIVEL = { facil: 1, medio: 2, dificil: 3 };

// [id, texto, grupo]
export const PERGUNTAS = [
  ['vivo', 'É um ser vivo (ou já foi)?', 'Geral'],
  ['animal', 'É um animal?', 'Geral'],
  ['pessoa', 'É uma pessoa ou personagem?', 'Geral'],
  ['objeto', 'É um objeto?', 'Geral'],
  ['lugar', 'É um lugar?', 'Geral'],
  ['grande', 'É maior que um carro?', 'Geral'],
  ['pequeno', 'Cabe na palma da mão?', 'Geral'],
  ['brasil', 'Tem ligação com o Brasil?', 'Geral'],
  ['america', 'É das Américas?', 'Geral'],
  ['europa', 'É da Europa?', 'Geral'],
  ['asia_africa', 'É da Ásia ou da África?', 'Geral'],
  ['esporte', 'Tem ligação com esporte?', 'Geral'],
  ['musica', 'Tem ligação com música?', 'Geral'],
  ['voa', 'Voa?', 'Geral'],
  ['aquatico', 'Vive ou anda na água?', 'Geral'],

  ['mamifero', 'É um mamífero?', 'Animais'],
  ['ave', 'É uma ave?', 'Animais'],
  ['peixe', 'É um peixe?', 'Animais'],
  ['reptil', 'É um réptil?', 'Animais'],
  ['inseto', 'É um inseto?', 'Animais'],
  ['domestico', 'Vive com as pessoas (casa ou fazenda)?', 'Animais'],
  ['carnivoro', 'Come carne?', 'Animais'],
  ['patas4', 'Tem 4 patas?', 'Animais'],

  ['real', 'É uma pessoa real (não é personagem)?', 'Pessoas'],
  ['masc', 'É homem (ou macho)?', 'Pessoas'],
  ['animacao', 'Aparece em desenho, anime ou videogame?', 'Pessoas'],
  ['poderes', 'Tem superpoderes ou magia?', 'Pessoas'],
  ['antigo', 'Viveu há mais de 100 anos?', 'Pessoas'],

  ['eletronico', 'Usa eletricidade ou bateria?', 'Objetos'],
  ['comida', 'Dá pra comer?', 'Objetos'],
  ['cozinha', 'É usado na cozinha?', 'Objetos'],
  ['veiculo', 'É um meio de transporte?', 'Objetos'],
  ['brincar', 'É usado pra brincar?', 'Objetos'],
  ['escola', 'É usado na escola?', 'Objetos'],
  ['roupa', 'Dá pra vestir ou usar no corpo?', 'Objetos'],

  ['cidade', 'É uma cidade?', 'Lugares'],
  ['pais', 'É um país?', 'Lugares'],
  ['natureza', 'É um lugar natural (não foi construído)?', 'Lugares'],
  ['construcao', 'É uma construção feita por pessoas?', 'Lugares'],
  ['frio', 'É um lugar frio ou com neve?', 'Lugares'],
  ['mar', 'Fica perto do mar?', 'Lugares'],
].map(([id, texto, grupo]) => ({ id, texto, grupo }));

export const GRUPOS = [...new Set(PERGUNTAS.map(p => p.grupo))];

// [nome, dificuldade, tags SIM, tags TALVEZ, dica, curiosidade, apelidos aceitos no chute]
const BRUTO = {
  animais: [
    ['Cachorro', 1, 'mamifero domestico carnivoro patas4 brasil', '', 'É chamado de melhor amigo do ser humano.', 'O olfato do cachorro é milhares de vezes mais forte que o nosso.', 'cao, dog, cachorrinho'],
    ['Gato', 1, 'mamifero domestico carnivoro patas4 brasil', '', 'Mia e adora caixas de papelão.', 'Os gatos passam cerca de dois terços da vida dormindo.', 'gatinho'],
    ['Elefante', 1, 'mamifero grande patas4 asia_africa', '', 'Tem tromba e orelhas enormes.', 'É o maior animal terrestre do mundo.', ''],
    ['Leão', 1, 'mamifero carnivoro patas4 asia_africa', '', 'É chamado de Rei da Selva.', 'Quem mais caça no grupo são as leoas.', 'leao'],
    ['Galinha', 1, 'ave domestico brasil', 'voa', 'Bota ovos e cacareja.', 'Ela é parente distante dos dinossauros.', 'galo'],
    ['Tubarão', 1, 'peixe aquatico carnivoro', 'grande brasil', 'Tem várias fileiras de dentes e uma barbatana nas costas.', 'Os tubarões existem desde antes dos dinossauros.', 'tubarao'],
    ['Borboleta', 1, 'inseto voa pequeno brasil', '', 'Antes de voar, ela era uma lagarta.', 'Ela sente o gosto das coisas com os pés.', ''],
    ['Cavalo', 1, 'mamifero domestico patas4 brasil', 'grande', 'Relincha e pode ser montado.', 'Cavalos conseguem dormir em pé.', 'egua'],
    ['Girafa', 1, 'mamifero grande patas4 asia_africa', '', 'Tem o pescoço mais comprido do mundo animal.', 'A língua dela é roxa e mede quase meio metro.', ''],
    ['Jacaré', 1, 'reptil carnivoro patas4 brasil', 'aquatico', 'Tem a boca cheia de dentes e vive no Pantanal.', 'Ele pode ficar mais de uma hora debaixo d\'água.', 'jacare, crocodilo'],
    ['Papagaio', 1, 'ave voa brasil', 'domestico', 'É colorido e consegue imitar a fala das pessoas.', 'Alguns papagaios vivem mais de 60 anos.', 'louro'],
    ['Vaca', 1, 'mamifero domestico patas4 brasil', 'grande', 'Faz "muuu" e dá leite.', 'As vacas têm melhores amigas e ficam estressadas longe delas.', 'boi'],

    ['Pinguim', 2, 'ave aquatico carnivoro frio', 'america', 'É uma ave que não voa, mas nada muito bem.', 'Parece que ele está sempre de terno, pronto pra uma festa.', ''],
    ['Golfinho', 2, 'mamifero aquatico carnivoro', 'brasil', 'É muito inteligente e se comunica com assobios.', 'Golfinhos dormem com metade do cérebro de cada vez.', ''],
    ['Morcego', 2, 'mamifero voa brasil', 'carnivoro pequeno', 'Dorme de cabeça pra baixo.', 'É o único mamífero que voa de verdade.', ''],
    ['Canguru', 2, 'mamifero', 'patas4', 'Pula e carrega o filhote numa bolsa na barriga.', 'O canguru não consegue andar de ré.', ''],
    ['Tartaruga', 2, 'reptil patas4', 'aquatico brasil', 'Carrega a casa nas costas.', 'Algumas tartarugas vivem mais de 150 anos.', 'jabuti, cagado'],
    ['Polvo', 2, 'aquatico carnivoro', '', 'Tem oito braços.', 'O polvo tem três corações e sangue azul.', ''],
    ['Coruja', 2, 'ave voa carnivoro brasil', '', 'Fica acordada à noite e gira a cabeça quase toda.', 'Ela consegue girar a cabeça até 270 graus.', ''],
    ['Abelha', 2, 'inseto voa pequeno brasil', '', 'Faz mel.', 'Uma abelha produz só um pouquinho de mel na vida inteira: menos de uma colher de chá.', ''],
    ['Tamanduá', 2, 'mamifero patas4 brasil', 'carnivoro', 'Tem um focinho comprido e come formigas.', 'A língua do tamanduá-bandeira passa de 60 cm.', 'tamandua, tamandua bandeira'],
    ['Onça-pintada', 2, 'mamifero carnivoro patas4 brasil', '', 'É o maior felino das Américas e tem pintas.', 'Ela tem a mordida mais forte entre os grandes felinos.', 'onca, onca pintada, jaguar'],
    ['Camaleão', 2, 'reptil patas4 asia_africa', 'pequeno carnivoro', 'Muda de cor.', 'Cada olho dele se mexe pra um lado, independente do outro.', 'camaleao'],

    ['Ornitorrinco', 3, 'mamifero patas4', 'aquatico carnivoro', 'É um mamífero com bico de pato que bota ovos.', 'Os machos têm um esporão venenoso nas patas de trás.', ''],
    ['Axolote', 3, 'aquatico carnivoro patas4 america', 'pequeno', 'É um anfíbio rosinha que parece estar sempre sorrindo.', 'Ele consegue regenerar partes do corpo, até do coração.', 'axolotl'],
    ['Pangolim', 3, 'mamifero patas4 asia_africa', 'carnivoro', 'É coberto de escamas e vira uma bola quando tem medo.', 'É o único mamífero coberto de escamas.', ''],
    ['Peixe-boi', 3, 'mamifero aquatico brasil', 'grande', 'É grandão, calmo e come plantas aquáticas.', 'Apesar do nome, ele não é peixe: é mamífero!', 'peixe boi'],
    ['Boto-cor-de-rosa', 3, 'mamifero aquatico carnivoro brasil', '', 'É um golfinho rosa dos rios da Amazônia.', 'Diz a lenda que ele vira um rapaz nas festas juninas.', 'boto, boto rosa, boto cor de rosa'],
    ['Tatu-bola', 3, 'mamifero patas4 brasil', '', 'Se fecha numa bola perfeita.', 'Foi o mascote da Copa do Mundo de 2014.', 'tatu, tatu bola'],
    ['Louva-a-deus', 3, 'inseto carnivoro pequeno brasil', 'voa', 'É um inseto verde que parece estar rezando.', 'Ele consegue virar a cabeça pra olhar pra trás.', 'louva a deus'],
    ['Narval', 3, 'mamifero aquatico carnivoro frio', 'grande', 'É chamado de unicórnio do mar.', 'O "chifre" dele na verdade é um dente.', ''],
    ['Ararinha-azul', 3, 'ave voa brasil', '', 'É uma ave azul brasileira, estrela do filme Rio.', 'Ela chegou a sumir da natureza e está voltando aos poucos.', 'ararinha azul, arara azul, blu'],
  ],

  pessoas: [
    ['Pelé', 1, 'real masc esporte brasil', 'animacao', 'Usava a camisa 10 e ganhou três Copas do Mundo.', 'Pelé marcou mais de 1.000 gols na carreira.', 'pele, edson arantes do nascimento, rei pele'],
    ['Neymar', 1, 'real masc esporte brasil', 'animacao', 'Começou no Santos e jogou no Barcelona e no PSG.', 'É o maior artilheiro da história da seleção brasileira.', 'neymar jr, ney'],
    ['Messi', 1, 'real masc esporte america', 'animacao', 'Ganhou a Copa do Mundo de 2022 com a Argentina.', 'Ganhou a Bola de Ouro 8 vezes, mais que qualquer outro jogador.', 'lionel messi, leo messi'],
    ['Cristiano Ronaldo', 1, 'real masc esporte europa', 'animacao', 'É português e famoso pela comemoração "Siuuu".', 'É o maior artilheiro da história do futebol de seleções.', 'cr7, cristiano, ronaldo'],
    ['Mickey Mouse', 1, 'masc animacao animal america', '', 'É um ratinho de luvas brancas e shorts vermelho.', 'Foi criado por Walt Disney em 1928.', 'mickey'],
    ['Homem-Aranha', 1, 'masc poderes america animacao', 'voa', 'Foi picado por uma aranha radioativa.', 'O nome dele de verdade é Peter Parker.', 'homem aranha, spider man, spiderman, peter parker'],
    ['Mario', 1, 'masc animacao', 'europa', 'É um encanador de boné vermelho.', 'Ele apareceu pela primeira vez em 1981, no jogo Donkey Kong.', 'super mario'],
    ['Goku', 1, 'masc animacao poderes voa', 'asia_africa', 'É um guerreiro saiyajin que adora comer.', 'Ele foi inspirado no Rei Macaco, uma lenda chinesa.', 'son goku, kakaroto'],
    ['Bob Esponja', 1, 'masc animacao animal aquatico', 'pequeno', 'Mora num abacaxi no fundo do mar.', 'Ele trabalha de chapeiro no Siri Cascudo.', 'bob esponja calca quadrada, spongebob'],
    ['Batman', 1, 'masc america', 'animacao', 'Protege Gotham City à noite.', 'Ele não tem superpoderes: usa só inteligência e tecnologia.', 'bruce wayne'],
    ['Harry Potter', 1, 'masc poderes europa', 'animacao voa', 'É um bruxo com uma cicatriz de raio na testa.', 'Ele estudou em Hogwarts, na casa Grifinória.', 'harry'],

    ['Santos Dumont', 2, 'real masc brasil antigo', 'voa', 'É chamado de "Pai da Aviação".', 'Ele também ajudou a popularizar o relógio de pulso.', 'alberto santos dumont'],
    ['Albert Einstein', 2, 'real masc europa antigo', '', 'Criou a teoria da relatividade.', 'Ganhou o Prêmio Nobel de Física em 1921.', 'einstein'],
    ['Ayrton Senna', 2, 'real masc esporte brasil', 'animacao', 'Foi tricampeão de Fórmula 1.', 'Ele era famoso por ser quase imbatível na chuva.', 'senna'],
    ['Michael Jackson', 2, 'real masc musica america', '', 'É chamado de Rei do Pop.', 'O álbum Thriller é o mais vendido da história.', 'michael'],
    ['Naruto', 2, 'masc animacao poderes asia_africa', '', 'É um ninja que sonha em ser Hokage.', 'Ele carrega a Raposa de Nove Caudas dentro dele.', 'naruto uzumaki'],
    ['Shrek', 2, 'masc animacao', 'grande', 'É um ogro verde que mora num pântano.', 'O nome Shrek vem de uma palavra que significa "medo".', ''],
    ['Elsa', 2, 'animacao poderes', 'europa', 'Tem poderes de gelo e canta "Livre Estou".', 'Ela é a rainha de Arendelle, do filme Frozen.', 'rainha elsa'],
    ['Sonic', 2, 'masc animacao animal', '', 'É um ouriço azul super rápido.', 'Ele foi criado pela SEGA em 1991.', ''],
    ['Mônica', 2, 'animacao brasil', '', 'É baixinha, dentuça e tem um coelho de pelúcia.', 'Foi criada por Mauricio de Sousa, inspirada na filha dele.', 'monica, turma da monica'],
    ['Saci-Pererê', 2, 'masc brasil poderes', 'animacao antigo', 'Tem uma perna só e usa um gorro vermelho.', 'Dizem que ele se esconde dentro dos redemoinhos de vento.', 'saci, saci perere'],

    ['Tiradentes', 3, 'real masc brasil antigo', '', 'Lutou na Inconfidência Mineira.', 'Ganhou esse apelido porque também trabalhava como dentista.', 'joaquim jose da silva xavier'],
    ['Leonardo da Vinci', 3, 'real masc europa antigo', '', 'Pintou a Mona Lisa.', 'Ele desenhou máquinas voadoras 400 anos antes do avião.', 'da vinci, leonardo'],
    ['Cleópatra', 3, 'real asia_africa antigo', '', 'Foi a última rainha do Egito Antigo.', 'Ela falava vários idiomas, inclusive o egípcio.', 'cleopatra'],
    ['Napoleão', 3, 'real masc europa antigo', '', 'Foi imperador da França.', 'Apesar da fama, ele não era baixinho: tinha altura normal pra época.', 'napoleao, napoleao bonaparte'],
    ['Yuji Itadori', 3, 'masc animacao poderes asia_africa', '', 'Engoliu o dedo do Rei das Maldições.', 'Ele é famoso pelo Punho Divergente e pelo Kokusen.', 'yuji, itadori'],
    ['Sukuna', 3, 'masc animacao poderes asia_africa', 'antigo', 'É o Rei das Maldições, com quatro braços.', 'Os 20 dedos dele foram espalhados pelo mundo.', 'ryomen sukuna'],
    ['Kratos', 3, 'masc animacao poderes europa', 'grande', 'É o Fantasma de Esparta.', 'Nos jogos nórdicos, ele tem um filho chamado Atreus.', ''],
    ['Link', 3, 'masc animacao', 'poderes', 'É o herói de orelhas pontudas que salva a princesa Zelda.', 'Muita gente acha que ele se chama Zelda, mas Zelda é a princesa!', ''],
    ['Steve', 3, 'masc animacao', '', 'É o personagem quadradão de um jogo de construir com blocos.', 'Ele é o personagem padrão do Minecraft.', 'steve do minecraft'],
    ['Gojo', 3, 'masc animacao poderes asia_africa', 'voa', 'Usa uma venda nos olhos e é o feiticeiro mais forte.', 'A técnica dele, o Infinito, faz os golpes nunca chegarem até ele.', 'satoru gojo, gojo satoru'],
  ],

  objetos: [
    ['Celular', 1, 'eletronico pequeno', '', 'Quase todo mundo leva um no bolso.', 'O primeiro celular pesava quase 1 quilo.', 'telefone, smartphone'],
    ['Bola', 1, 'esporte brincar', '', 'É redonda e essencial no futebol.', 'Toda Copa do Mundo ganha uma bola nova, com nome próprio.', 'bola de futebol'],
    ['Cadeira', 1, '', '', 'Você provavelmente está perto de uma agora... ou sentado nela.', 'Por séculos, só reis e pessoas importantes tinham cadeiras.', ''],
    ['Geladeira', 1, 'eletronico cozinha', '', 'Deixa a comida gelada.', 'Antes dela, as pessoas usavam blocos de gelo pra conservar a comida.', 'refrigerador'],
    ['Televisão', 1, 'eletronico', '', 'Fica na sala e passa desenhos e jogos de futebol.', 'A TV chegou ao Brasil em 1950.', 'televisao, tv'],
    ['Banana', 1, 'comida', 'cozinha pequeno vivo brasil', 'É amarela e o macaco adora.', 'O Brasil é um dos maiores produtores de banana do mundo.', ''],
    ['Pizza', 1, 'comida europa', 'cozinha', 'É redonda, cortada em fatias e vem da Itália.', 'A pizza margherita foi feita em homenagem a uma rainha italiana.', ''],
    ['Carro', 1, 'veiculo', 'eletronico', 'Tem 4 rodas, volante e anda na rua.', 'O primeiro carro foi inventado em 1886, na Alemanha.', 'automovel'],
    ['Lápis', 1, 'pequeno escola', '', 'Dá pra apagar o que ele escreve.', 'Um lápis comum consegue desenhar uma linha de mais de 50 km.', 'lapis'],
    ['Tênis', 1, 'roupa esporte', '', 'Você calça antes de correr.', 'Tem tênis de colecionador que custa mais caro que um carro.', 'tenis, sapato'],
    ['Mochila', 1, 'escola', 'roupa', 'Você carrega nas costas pra ir pra aula.', 'A mochila dos astronautas tem oxigênio dentro.', ''],
    ['Bicicleta', 1, 'veiculo esporte', 'brincar', 'Tem duas rodas e pedais.', 'Existem mais bicicletas no mundo do que carros.', 'bike, bicicleta'],
    ['Colher', 1, 'pequeno cozinha', '', 'Serve pra tomar sopa.', 'As primeiras colheres eram feitas de conchas e madeira.', ''],

    ['Guarda-chuva', 2, '', 'roupa', 'Você abre quando começa a chover.', 'Ele foi inventado pra proteger do sol, não da chuva.', 'guarda chuva, sombrinha'],
    ['Relógio', 2, 'pequeno', 'eletronico roupa', 'Tem ponteiros ou números e marca as horas.', 'O relógio mais preciso do mundo levaria bilhões de anos pra atrasar 1 segundo.', 'relogio'],
    ['Violão', 2, 'musica', '', 'Tem 6 cordas e é tocado em rodas de amigos.', 'Em vários países ele é chamado de guitarra clássica.', 'violao'],
    ['Skate', 2, 'esporte brincar', 'veiculo', 'É uma prancha com 4 rodinhas.', 'O skate virou esporte olímpico em 2021 e o Brasil ganhou medalhas.', ''],
    ['Avião', 2, 'veiculo voa grande', 'eletronico', 'Leva pessoas pelo céu.', 'Santos Dumont fez um dos primeiros voos de avião, em 1906.', 'aviao'],
    ['Controle remoto', 2, 'eletronico pequeno', '', 'Some no sofá toda hora.', 'O primeiro controle de TV tinha um fio ligado ao aparelho.', 'controle'],
    ['Óculos', 2, 'pequeno roupa', '', 'Ajuda quem não enxerga bem.', 'Os primeiros óculos surgiram na Itália, há mais de 700 anos.', 'oculos'],
    ['Chave', 2, 'pequeno', '', 'Abre portas e cadeados.', 'Já existiam chaves de madeira no Egito Antigo.', ''],
    ['Travesseiro', 2, '', '', 'Você deita a cabeça nele pra dormir.', 'Na China antiga, os travesseiros eram de pedra ou porcelana.', 'almofada'],
    ['Pipa', 2, 'brincar voa', '', 'Sobe com o vento, presa por uma linha.', 'Em vários lugares do Brasil ela também é chamada de papagaio ou raia.', 'papagaio de papel, raia, arraia'],
    ['Escova de dente', 2, 'pequeno', '', 'Você usa depois de comer.', 'Antigamente as escovas eram feitas com pelos de porco.', 'escova, escova de dentes'],

    ['Ampulheta', 3, '', 'pequeno', 'Marca o tempo com areia caindo.', 'Era usada nos navios pra medir a velocidade.', ''],
    ['Bússola', 3, 'pequeno', '', 'A agulha dela sempre aponta pro norte.', 'Ela foi inventada na China.', 'bussola'],
    ['Telescópio', 3, '', 'escola', 'Serve pra ver estrelas e planetas de perto.', 'Galileu usou um em 1610 pra descobrir luas de Júpiter.', 'telescopio, luneta'],
    ['Submarino', 3, 'veiculo aquatico grande', 'eletronico', 'Viaja debaixo do mar.', 'Alguns conseguem ficar meses sem subir à superfície.', ''],
    ['Máquina de escrever', 3, '', 'escola', 'Era usada pra escrever textos antes do computador.', 'A ordem das letras do teclado (QWERTY) veio dela.', 'maquina de escrever'],
    ['Ioiô', 3, 'brincar pequeno', '', 'Sobe e desce preso num barbante.', 'Um ioiô já foi levado ao espaço por astronautas.', 'ioio, yoyo'],
    ['Cubo mágico', 3, 'brincar pequeno', '', 'Tem 6 cores e você gira até cada lado ficar de uma cor só.', 'O recorde de montagem é de pouco mais de 3 segundos.', 'cubo magico, cubo de rubik'],
    ['Disquete', 3, 'pequeno', 'eletronico', 'Guardava arquivos de computador antigamente.', 'O ícone de "salvar" em muitos programas é um desenho dele.', ''],
    ['Lupa', 3, 'pequeno', 'escola', 'Faz as coisas parecerem maiores.', 'Detetives famosos, como Sherlock Holmes, aparecem sempre com uma.', ''],
  ],

  lugares: [
    ['Brasil', 1, 'pais brasil mar', '', 'É o maior país da América do Sul.', 'É o único país das Américas que fala português.', ''],
    ['Praia', 1, 'natureza mar', 'brasil europa asia_africa aquatico', 'Tem areia, sol e ondas.', 'O Brasil tem mais de 7 mil km de litoral.', ''],
    ['Escola', 1, 'construcao', 'brasil europa asia_africa', 'Tem sala de aula, recreio e lição de casa.', 'No Japão, os próprios alunos limpam a escola.', 'colegio'],
    ['Shopping', 1, 'construcao', 'brasil europa asia_africa', 'Tem várias lojas, praça de alimentação e cinema.', 'Um dos maiores do mundo fica em Dubai e tem até um aquário gigante.', 'shopping center'],
    ['Hospital', 1, 'construcao', 'brasil europa asia_africa', 'É onde os médicos cuidam das pessoas.', 'Hospitais funcionam 24 horas por dia, todos os dias.', ''],
    ['Rio de Janeiro', 1, 'cidade brasil mar', '', 'Tem o Pão de Açúcar e a praia de Copacabana.', 'Já foi a capital do Brasil.', 'rio, rj'],
    ['Japão', 1, 'pais asia_africa mar', 'frio', 'É o país dos animes, do sushi e dos samurais.', 'O país é formado por milhares de ilhas.', 'japao'],
    ['Estados Unidos', 1, 'pais america mar', 'frio', 'Tem a Estátua da Liberdade e Hollywood.', 'O país tem 50 estados.', 'eua, usa, estados unidos da america'],
    ['Floresta Amazônica', 1, 'natureza brasil', 'vivo aquatico', 'É a maior floresta tropical do mundo.', 'Ela abriga cerca de 10% de todas as espécies conhecidas.', 'amazonia, floresta amazonica, amazonas'],
    ['Polo Norte', 1, 'natureza frio mar', '', 'É onde, dizem, mora o Papai Noel.', 'Lá não tem terra firme: é gelo boiando no mar.', ''],

    ['Paris', 2, 'cidade europa', '', 'É a capital da França.', 'É chamada de Cidade Luz.', ''],
    ['Egito', 2, 'pais asia_africa mar', '', 'Tem pirâmides e o rio Nilo.', 'A Grande Pirâmide foi a construção mais alta do mundo por quase 4 mil anos.', ''],
    ['Torre Eiffel', 2, 'construcao europa', '', 'É uma torre de ferro em Paris.', 'No verão ela cresce alguns centímetros por causa do calor.', 'torre eifel'],
    ['Cristo Redentor', 2, 'construcao brasil', '', 'Fica no alto do Corcovado, de braços abertos.', 'É uma das 7 Maravilhas do Mundo Moderno.', 'cristo'],
    ['Muralha da China', 2, 'construcao asia_africa', '', 'É uma muralha gigante construída pra proteger um império.', 'Somando todos os trechos, ela passa de 20 mil km.', 'grande muralha, grande muralha da china'],
    ['Antártida', 2, 'natureza frio mar', '', 'É o continente mais frio do planeta.', 'Quase não chove lá: ela é considerada um deserto.', 'antartida, antartica, antartica'],
    ['Monte Everest', 2, 'natureza frio asia_africa', '', 'É a montanha mais alta do mundo.', 'Ele tem quase 8.850 metros de altura.', 'everest'],
    ['Cataratas do Iguaçu', 2, 'natureza brasil', 'aquatico', 'São quedas d\'água enormes na fronteira com a Argentina.', 'São cerca de 275 quedas d\'água.', 'cataratas, foz do iguacu, cataratas do iguacu'],

    ['Machu Picchu', 3, 'construcao america', 'frio cidade', 'É uma cidade antiga dos Incas no alto das montanhas do Peru.', 'Ela ficou esquecida pelo mundo durante séculos.', 'machu pichu'],
    ['Coliseu', 3, 'construcao europa', '', 'É uma arena antiga de Roma onde lutavam gladiadores.', 'Cabiam cerca de 50 mil pessoas lá dentro.', 'coliseu de roma'],
    ['Stonehenge', 3, 'construcao europa', '', 'É um círculo de pedras gigantes na Inglaterra.', 'Até hoje ninguém sabe ao certo pra que ele servia.', ''],
    ['Deserto do Saara', 3, 'natureza asia_africa', '', 'É o maior deserto quente do mundo.', 'Há milhares de anos ele era verde, com rios e lagos.', 'saara'],
    ['Islândia', 3, 'pais europa frio mar', '', 'É uma ilha com vulcões e geleiras.', 'Quase toda a energia de lá vem de vulcões e rios.', 'islandia'],
    ['Fernando de Noronha', 3, 'natureza brasil mar', '', 'É um arquipélago em Pernambuco cheio de golfinhos.', 'Só um número limitado de turistas pode visitar por vez.', 'noronha'],
    ['Veneza', 3, 'cidade europa mar', 'aquatico', 'É uma cidade italiana onde as ruas são canais.', 'As pessoas andam de gôndola em vez de carro.', ''],
    ['Petra', 3, 'construcao asia_africa', 'cidade', 'É uma cidade antiga esculpida nas rochas, na Jordânia.', 'Ela aparece no filme Indiana Jones e a Última Cruzada.', ''],
  ],
};

// Tags que valem pra categoria inteira
const AUTOMATICAS = {
  animais: 'vivo animal',
  pessoas: 'vivo pessoa',
  objetos: 'objeto',
  lugares: 'lugar grande',
};

export function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const separar = s => s.split(/\s+/).filter(Boolean);
const QIDS = new Set(PERGUNTAS.map(p => p.id));

export const SEGREDOS = Object.entries(BRUTO).flatMap(([cat, lista]) =>
  lista.map(([nome, dif, sim, talvez, dica, curiosidade, apelidos]) => {
    const tags = new Set([...separar(AUTOMATICAS[cat]), ...separar(sim)]);
    if (tags.has('brasil')) tags.add('america');
    const t = new Set(separar(talvez));
    for (const tag of [...tags, ...t]) {
      if (!QIDS.has(tag)) throw new Error(`Tag desconhecida "${tag}" em ${nome}`);
    }
    for (const tag of t) tags.delete(tag);
    return {
      id: normalizar(nome).replace(/ /g, '-'),
      nome, cat, dif, tags, talvez: t, dica, curiosidade,
      aceitos: [nome, ...apelidos.split(',')].map(normalizar).filter(Boolean),
    };
  }),
);

export function responder(segredo, qid) {
  if (segredo.talvez.has(qid)) return 'TALVEZ';
  if (segredo.tags.has(qid)) return 'SIM';
  if (qid === 'masc' && segredo.cat === 'animais') return 'TALVEZ';
  return 'NÃO';
}

function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

const ARTIGOS = new Set(['e', 'eh', 'o', 'a', 'os', 'as', 'um', 'uma', 'ele', 'ela', 'seria']);

// "É o Pelé?" -> "pele"
export function chaveDoChute(texto) {
  const palavras = normalizar(texto).split(' ');
  while (palavras.length > 1 && ARTIGOS.has(palavras[0])) palavras.shift();
  return palavras.join(' ');
}

// Aceita erro de digitacao pequeno.
export function confere(chute, segredo) {
  const c = chaveDoChute(chute);
  if (!c) return false;
  return segredo.aceitos.some(alvo => {
    if (alvo === c) return true;
    const tolerancia = alvo.length >= 9 ? 2 : alvo.length >= 5 ? 1 : 0;
    return distancia(alvo, c) <= tolerancia;
  });
}

export function dicasDe(segredo, categoria) {
  const lista = [];
  if (segredo.cat && categoria === 'surpresa') lista.push(`A categoria é: ${CATEGORIAS[segredo.cat]}.`);
  if (segredo.dica) lista.push(segredo.dica);
  lista.push(`Começa com a letra "${segredo.nome[0].toUpperCase()}".`);
  lista.push(`O nome tem ${segredo.nome.replace(/[^\p{L}]/gu, '').length} letras.`);
  return lista;
}

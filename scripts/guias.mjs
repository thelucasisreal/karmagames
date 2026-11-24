// Guias: artigos longos de regras e estratégia, um por jogo. Viram guias/<slug>/ e a lista em guias/.
// Mesmo formato de blocos de paginas.mjs: ["h2", texto] | ["p", html] | ["ul", [html, ...]] | ["ol", [html, ...]].
// `jogo` é o slug em jogos.js: a página do jogo ganha um link para o guia, e o guia termina com o botão para jogar.
// `publicado` é a data em que o guia entrou no site (vai no schema como datePublished).

export const GUIAS = [
  {
    slug: "regras-do-xadrez",
    jogo: "xadrez",
    publicado: "2026-11-24",
    titulo: "Regras do xadrez: guia completo para iniciantes",
    descricao: "Como as peças do xadrez se movem, o que é xeque e xeque-mate, roque, en passant, promoção, empates e os primeiros princípios de estratégia.",
    blocos: [
      ["p", "O xadrez parece complicado na primeira vez, mas as regras cabem em poucas páginas. Este guia explica o tabuleiro, o movimento de cada peça, os lances especiais e as formas de terminar uma partida. No fim, tem os princípios que fazem um iniciante parar de perder peças de graça."],
      ["h2", "O tabuleiro e a posição inicial"],
      ["p", "O tabuleiro tem 64 casas, 8 por 8, alternando claras e escuras. Ele sempre é colocado com uma casa clara no canto inferior direito de cada jogador. As colunas são identificadas por letras (de <b>a</b> a <b>h</b>) e as fileiras por números (de <b>1</b> a <b>8</b>), então cada casa tem um nome, como e4 ou g1."],
      ["p", "Cada jogador começa com 16 peças: oito peões, duas torres, dois cavalos, dois bispos, uma dama e um rei. Na primeira fileira ficam, da esquerda para a direita, torre, cavalo, bispo, dama, rei, bispo, cavalo e torre. Na segunda ficam os oito peões. A dama começa na casa da cor dela: a dama branca em casa clara (d1) e a dama preta em casa escura (d8). As brancas sempre fazem o primeiro lance."],
      ["h2", "Como cada peça se move"],
      ["ul", [
        "<b>Rei:</b> anda uma casa em qualquer direção. Nunca pode ir para uma casa atacada por uma peça adversária.",
        "<b>Dama:</b> anda quantas casas quiser em linha reta ou na diagonal, sem pular peças. É a peça mais forte.",
        "<b>Torre:</b> anda quantas casas quiser na horizontal ou na vertical.",
        "<b>Bispo:</b> anda quantas casas quiser na diagonal. Por isso cada bispo passa a partida inteira em casas de uma cor só.",
        "<b>Cavalo:</b> anda em L: duas casas em uma direção e uma para o lado. É a única peça que pula por cima das outras.",
        "<b>Peão:</b> anda uma casa para a frente, ou duas no primeiro lance dele. Captura de um jeito diferente: uma casa na diagonal, para a frente. Peão nunca anda para trás."
      ]],
      ["p", "Capturar é ocupar a casa de uma peça adversária, que sai do tabuleiro. Com exceção do peão, toda peça captura do mesmo jeito que se move."],
      ["h2", "Xeque, xeque-mate e afogamento"],
      ["p", "Quando uma peça ataca o rei adversário, o rei está em <b>xeque</b>. Quem está em xeque é obrigado a sair dele no lance seguinte, de uma de três formas: movendo o rei para uma casa segura, capturando a peça que dá o xeque ou colocando uma peça no meio do caminho. Não é permitido fazer um lance que deixe o próprio rei em xeque."],
      ["p", "Se o rei está em xeque e não existe nenhum lance que resolva isso, é <b>xeque-mate</b> e a partida acaba. O rei nunca é capturado de fato: o mate é o fim."],
      ["p", "O caso oposto é o <b>afogamento</b>: o jogador da vez não está em xeque, mas não tem nenhum lance legal. Aí a partida termina empatada. O afogamento é a armadilha clássica de quem está ganhando com muita vantagem e encurrala o rei adversário sem dar xeque."],
      ["h2", "Os três lances especiais"],
      ["p", "<b>Roque.</b> É o único lance em que duas peças se movem ao mesmo tempo. O rei anda duas casas em direção a uma das torres, e essa torre pula para o outro lado do rei. Serve para proteger o rei e colocar a torre em jogo. Só vale se o rei e aquela torre ainda não se moveram, se não houver peças entre eles, se o rei não estiver em xeque e se ele não passar nem parar em casa atacada."],
      ["p", "<b>En passant.</b> Se um peão avança duas casas no primeiro lance e para ao lado de um peão adversário, esse peão adversário pode capturá-lo como se ele tivesse andado só uma casa. A captura tem que ser feita imediatamente, no lance seguinte, ou o direito se perde."],
      ["p", "<b>Promoção.</b> O peão que chega à última fileira vira outra peça, à escolha do jogador: dama, torre, bispo ou cavalo. Quase sempre se escolhe a dama. Dá para ter duas ou mais damas no tabuleiro."],
      ["h2", "Como uma partida pode empatar"],
      ["ul", [
        "Afogamento, explicado acima.",
        "Repetição: a mesma posição aparece três vezes, com o mesmo jogador da vez.",
        "Regra dos 50 lances: cinquenta lances de cada lado sem nenhuma captura e sem nenhum movimento de peão.",
        "Material insuficiente: quando não sobra peça capaz de dar mate, como rei contra rei, ou rei e bispo contra rei.",
        "Acordo entre os jogadores."
      ]],
      ["h2", "Quanto vale cada peça"],
      ["p", "Para decidir se uma troca é boa, os jogadores usam uma tabela aproximada: peão vale 1, cavalo e bispo valem 3, torre vale 5 e dama vale 9. Trocar um bispo por uma torre é ganhar dois pontos; entregar a dama por um cavalo é perder seis. A tabela não é lei, mas evita a maior parte das trocas ruins."],
      ["h2", "Princípios para as primeiras partidas"],
      ["ol", [
        "<b>Disputa o centro.</b> As casas e4, d4, e5 e d5 dão mais espaço às peças. Abrir com um peão de rei ou de dama é o começo mais natural.",
        "<b>Desenvolva as peças.</b> Tire cavalos e bispos da primeira fileira cedo. Mover o mesmo peão ou a mesma peça várias vezes na abertura atrasa todo o resto.",
        "<b>Faça o roque.</b> O rei no centro é alvo fácil. O roque costuma vir nos primeiros dez lances.",
        "<b>Não saia com a dama cedo.</b> Ela vira alvo, e você perde tempo fugindo enquanto o adversário desenvolve as peças dele.",
        "<b>Antes de cada lance, pergunte:</b> o que o último lance do adversário ameaça? Qual das minhas peças está sem defesa? A maioria das partidas de iniciante é decidida por uma peça que ficou solta."
      ]],
      ["h2", "Os primeiros mates que vale aprender"],
      ["p", "Saber dar mate com pouco material evita jogar fora uma partida ganha. O mais simples é rei e dama contra rei: use a dama para ir fechando o rei adversário em uma faixa cada vez menor, sempre a um lance de cavalo de distância para não afogar, e traga o seu rei para ajudar. O mesmo vale com rei e torre, só que demora um pouco mais. Treine os dois até sair sem pensar."],
      ["h2", "Treine no Xadrez da Karma Games"],
      ["p", "O <a href=\"jogar/xadrez/\">Xadrez da Karma Games</a> segue todas essas regras, incluindo roque, en passant, promoção e os empates por afogamento, repetição e 50 lances. Ao clicar numa peça ele mostra os lances possíveis, o que ajuda muito quem está aprendendo. Comece no nível Easy, suba para Medium quando ganhar com frequência e jogue no modo Online com um amigo para praticar contra uma pessoa."]
    ]
  },
  {
    slug: "regras-da-dama-brasileira",
    jogo: "dama",
    publicado: "2026-11-24",
    titulo: "Regras da dama brasileira: captura obrigatória, lei da maioria e dama voadora",
    descricao: "As regras oficiais da dama no Brasil explicadas com calma: tabuleiro, movimento das pedras, captura obrigatória, lei da maioria, dama voadora e empate.",
    blocos: [
      ["p", "Todo mundo já jogou dama, mas quase cada família joga com uma regra diferente. Essa confusão aparece na hora de jogar com outra pessoa ou contra o computador: \"pode comer para trás?\", \"sou obrigado a comer?\", \"a dama anda quanto?\". Este guia explica a regra brasileira, a mesma usada nos torneios do país e no jogo da Karma Games."],
      ["h2", "Tabuleiro e posição inicial"],
      ["p", "A dama brasileira usa o tabuleiro de 8 por 8 casas, o mesmo do xadrez. Ele é colocado com uma casa escura no canto inferior esquerdo de cada jogador, e as peças só ocupam as casas escuras. Cada lado começa com 12 pedras, distribuídas nas três primeiras fileiras. As duas fileiras do meio ficam vazias. As brancas começam."],
      ["h2", "Como a pedra se move"],
      ["p", "A pedra comum anda uma casa na diagonal, sempre para a frente, para uma casa vazia. Ela não anda para trás. Para trás, só capturando, como explicado a seguir."],
      ["h2", "Como se captura"],
      ["p", "Captura-se pulando por cima de uma peça adversária que esteja na casa diagonal vizinha, desde que a casa logo depois dela esteja vazia. A peça pulada sai do tabuleiro. Na regra brasileira, <b>a pedra comum pode capturar para a frente e para trás</b>."],
      ["p", "Se, depois de capturar, a pedra puder pular outra peça, ela continua no mesmo lance. Essa sequência é a captura múltipla, e as peças capturadas só saem do tabuleiro quando o lance termina. Durante a sequência não dá para pular a mesma peça duas vezes."],
      ["h2", "Captura obrigatória"],
      ["p", "Se existe uma captura possível, você é obrigado a fazê-la. Não dá para escolher um lance tranquilo quando há uma peça para comer. Antigamente existia o \"sopro\", em que o adversário tirava a pedra de quem esqueceu de capturar. Na regra oficial isso não existe: o lance sem captura simplesmente não é permitido."],
      ["p", "A obrigação é a base de quase toda tática da dama. Como você sabe que o adversário vai ter que capturar, pode oferecer uma pedra de propósito e preparar uma captura múltipla de volta. Essa jogada se chama entrega, e é a principal arma de quem joga bem."],
      ["h2", "Lei da maioria"],
      ["p", "Quando há mais de um jeito de capturar, você deve escolher o caminho que captura o <b>maior número de peças</b>. Não importa se as peças são pedras ou damas, nem qual peça sua faz a captura: conta só a quantidade. Se dois caminhos capturam o mesmo número, você escolhe qualquer um."],
      ["h2", "Promoção e dama voadora"],
      ["p", "A pedra que chega à última fileira do lado adversário vira <b>dama</b>. Para marcar, coloca-se outra pedra em cima dela. Se a pedra chegar à última fileira no meio de uma captura múltipla e ainda puder continuar capturando, ela segue como pedra e não é promovida naquele lance."],
      ["p", "A dama é <b>voadora</b>: anda quantas casas quiser na diagonal, para a frente ou para trás, desde que o caminho esteja livre. Na captura, ela pode pular uma peça que esteja a qualquer distância na mesma diagonal, com casas vazias entre elas, e parar em qualquer casa vazia depois da peça capturada. Por isso uma dama sozinha consegue segurar várias pedras adversárias."],
      ["h2", "Fim da partida e empate"],
      ["p", "Vence quem capturar todas as peças do adversário ou deixá-lo sem nenhum lance possível. O empate acontece por acordo, quando a mesma posição se repete, ou quando os dois lados passam 20 lances seguidos movendo só damas, sem nenhuma captura."],
      ["h2", "Estratégia básica"],
      ["ol", [
        "<b>Controle o centro.</b> Pedras no meio do tabuleiro têm duas opções de avanço e atrapalham o adversário. Pedras na borda são mais seguras, mas têm só uma diagonal.",
        "<b>Avance em grupo.</b> Pedra sozinha na frente é alvo fácil. Pedras lado a lado e em diagonal se protegem, porque não deixam casa livre atrás para o adversário pousar depois de capturar.",
        "<b>Guarde a última fileira.</b> Enquanto você tiver pedras na sua fileira de trás, o adversário não consegue fazer dama. Não tire essas pedras sem motivo.",
        "<b>Conte antes de entregar.</b> Antes de oferecer uma pedra, conte quantas peças você recupera na volta. Graças à lei da maioria, dá para prever exatamente qual caminho o adversário vai ser obrigado a seguir.",
        "<b>Dama vale muito.</b> No final da partida, uma dama vale mais que várias pedras. Vale a pena trocar duas pedras para fazer uma dama."
      ]],
      ["h2", "Jogue com as regras certas"],
      ["p", "A <a href=\"jogar/dama/\">Dama da Karma Games</a> segue exatamente essas regras: captura obrigatória, lei da maioria, dama voadora e empate após 20 lances só com damas. O jogo destaca as jogadas permitidas, então você não precisa decorar tudo de uma vez. Dá para jogar contra o computador em quatro níveis, com um amigo no mesmo aparelho ou no modo Online."]
    ]
  },
  {
    slug: "como-resolver-sudoku",
    jogo: "sudoku",
    publicado: "2026-11-24",
    titulo: "Como resolver sudoku: técnicas do fácil ao difícil",
    descricao: "Passo a passo para resolver sudoku sem chutar: varredura, candidato único, número escondido, pares e como usar as anotações.",
    blocos: [
      ["p", "Um sudoku bem feito tem uma única solução e pode ser resolvido só com lógica, sem tentativa e erro. A diferença entre um puzzle fácil e um difícil está em quais técnicas ele exige. Este guia apresenta essas técnicas na ordem em que você vai precisar delas."],
      ["h2", "A regra"],
      ["p", "A grade tem 9 linhas, 9 colunas e 9 quadrados de 3 por 3. Cada linha, cada coluna e cada quadrado precisa ter os números de 1 a 9, uma vez cada. Os números que já vêm preenchidos não mudam. Não tem conta: os números poderiam ser letras ou cores, e o jogo seria o mesmo."],
      ["h2", "Técnica 1: varredura"],
      ["p", "Escolha um número, por exemplo o 5, e olhe onde ele já aparece. Cada 5 elimina a linha, a coluna e o quadrado dele. Agora procure um quadrado que ainda não tem 5. Se, dentro dele, só sobrar uma casa livre que não está em linha nem coluna com outro 5, o 5 vai ali."],
      ["p", "Faça isso com os nove números, começando pelos que mais aparecem na grade: eles eliminam mais casas. Puzzles fáceis costumam sair inteiros só com a varredura."],
      ["h2", "Técnica 2: candidato único"],
      ["p", "Agora inverta o olhar: em vez de escolher um número, escolha uma casa. Veja quais números já estão na linha, na coluna e no quadrado dela. Se oito números diferentes já aparecem nesses lugares, só sobra um possível para aquela casa. Essa técnica funciona melhor em casas que ficam no cruzamento de uma linha e uma coluna já quase cheias."],
      ["h2", "Técnica 3: número escondido"],
      ["p", "Às vezes uma casa ainda tem vários candidatos, mas um deles só cabe nela dentro da linha, da coluna ou do quadrado. Por exemplo: numa linha faltam o 2, o 4 e o 7, e o 7 não pode entrar em nenhuma das outras casas livres porque já está nas colunas delas. Então o 7 vai na casa que sobrou, mesmo que ela também aceitasse o 2 ou o 4."],
      ["h2", "Técnica 4: anotações"],
      ["p", "No nível médio, chega uma hora em que nenhuma casa sai de cara. É aí que entram as anotações: em cada casa vazia, marque com números pequenos todos os candidatos possíveis. Parece trabalhoso, mas transforma o problema em algo que dá para enxergar."],
      ["p", "Sempre que preencher uma casa, apague aquele número das anotações da mesma linha, coluna e quadrado. Muitas vezes isso faz aparecer uma casa com um candidato só."],
      ["h2", "Técnica 5: pares e trios"],
      ["p", "Se duas casas da mesma linha têm exatamente os mesmos dois candidatos, por exemplo 3 e 8, esses dois números com certeza vão ocupar essas duas casas. Então dá para apagar o 3 e o 8 de todas as outras casas daquela linha. O mesmo vale para colunas e quadrados, e para três casas com os mesmos três candidatos."],
      ["h2", "Técnica 6: linha dentro do quadrado"],
      ["p", "Se, dentro de um quadrado, um número só pode ir em casas que estão todas na mesma linha, então esse número vai ficar naquela linha dentro do quadrado. Portanto ele não pode aparecer nessa linha em nenhum outro quadrado. Apague-o das anotações das outras casas dessa linha. A mesma lógica vale para colunas."],
      ["h2", "Erros comuns"],
      ["ul", [
        "<b>Chutar.</b> Um chute errado só aparece muitas jogadas depois, quando já é difícil voltar. Se travou, revise as anotações antes de arriscar.",
        "<b>Esquecer de atualizar as anotações.</b> Uma anotação velha leva a conclusões erradas.",
        "<b>Olhar só para um tipo de região.</b> Quem procura só nas linhas perde o que está nas colunas e nos quadrados. Alterne os três."
      ]],
      ["h2", "Pratique no Sudoku da Karma Games"],
      ["p", "O <a href=\"jogar/sudoku/\">Sudoku da Karma Games</a> cria um puzzle novo a cada partida, em três níveis. Tem modo Anotar (tecla N) para marcar candidatos, Desfazer, Dica e a opção de mostrar erros na hora, que é ótima para aprender. Comece no Fácil usando só varredura e candidato único. Quando conseguir sem a Dica, passe para o Médio e comece a usar as anotações."]
    ]
  },
  {
    slug: "como-jogar-campo-minado",
    jogo: "campo-minado",
    publicado: "2026-11-24",
    titulo: "Como jogar campo minado: números, padrões e estratégia",
    descricao: "Entenda o que os números do campo minado significam, aprenda os padrões 1-1 e 1-2-1 e descubra como abrir o tabuleiro sem depender da sorte.",
    blocos: [
      ["p", "O campo minado tem fama de jogo de sorte, mas quase todo tabuleiro se resolve com dedução. Os números dizem tudo o que você precisa saber; o truque é aprender a lê-los em grupo. Este guia mostra como."],
      ["h2", "O que os números significam"],
      ["p", "Cada casa aberta mostra quantas minas existem nas oito casas em volta dela: as duas do lado, as três de cima e as três de baixo, contando as diagonais. Uma casa sem número não tem nenhuma mina em volta, e por isso o jogo abre automaticamente toda a área vizinha. Você vence quando abre todas as casas que não têm mina."],
      ["h2", "Os níveis"],
      ["p", "Os três níveis clássicos são o Fácil, com 9 por 9 casas e 10 minas, o Médio, com 16 por 16 e 40 minas, e o Difícil, com 16 por 30 e 99 minas. No Difícil, cerca de uma casa em cada cinco tem mina, e a leitura dos padrões passa a ser indispensável."],
      ["h2", "Regra 1: o número já está satisfeito"],
      ["p", "Se um 1 já tem uma bandeira encostada nele, todas as outras casas fechadas em volta dele são seguras. Vale para qualquer número: um 3 com três bandeiras em volta libera o resto. Em vez de abrir uma por uma, clique no próprio número para abrir todas as vizinhas de uma vez. Só faça isso quando tiver certeza das bandeiras."],
      ["h2", "Regra 2: o número só tem as casas que precisa"],
      ["p", "O contrário também vale. Se um 2 tem exatamente duas casas fechadas em volta, as duas são minas. Um 1 com uma casa fechada só, idem. Comece sempre procurando essas situações nas bordas da área aberta."],
      ["h2", "Padrão 1-1"],
      ["p", "Numa borda reta, quando dois números 1 aparecem lado a lado e o primeiro está no canto da parede, a mina do primeiro 1 está numa das duas casas que ele compartilha com o segundo. Logo, a terceira casa encostada no segundo 1 é segura. Este padrão aparece o tempo todo."],
      ["h2", "Padrão 1-2-1"],
      ["p", "Numa borda reta, a sequência 1-2-1 tem uma resposta fixa: as minas estão nas casas em frente aos dois números 1, e a casa em frente ao 2 é segura. Aprenda a reconhecer de longe. Uma variação é o 1-2-2-1, em que as minas ficam em frente aos dois números 2."],
      ["h2", "Subtraia um número do outro"],
      ["p", "Quando dois números vizinhos compartilham casas fechadas, compare. Se um 2 enxerga as mesmas casas de um 1 vizinho e mais uma, essa casa a mais é uma mina: o 1 já garante uma mina nas casas em comum, e o 2 precisa de mais uma. Essa subtração resolve a maioria das situações que parecem empate."],
      ["h2", "Quando chutar"],
      ["p", "Às vezes não tem jeito: o tabuleiro trava e duas casas são igualmente prováveis. Nessa hora:"],
      ["ul", [
        "Antes de chutar, resolva todo o resto do tabuleiro. Outra área pode dar a informação que faltava.",
        "Prefira casas que, se forem seguras, revelem mais informação, como uma casa encostada em vários números.",
        "Cantos e bordas longe dos números costumam ter chance menor de mina do que casas presas entre números altos."
      ]],
      ["h2", "Como ficar mais rápido"],
      ["ol", [
        "Marque com bandeira só as minas que você vai usar para abrir casas com o clique no número. Marcar todas gasta tempo.",
        "Resolva uma frente por vez, em vez de pular de um canto ao outro do tabuleiro.",
        "Treine os padrões no Fácil até reconhecê-los sem contar. Depois a velocidade no Médio vem sozinha."
      ]],
      ["h2", "Jogue agora"],
      ["p", "No <a href=\"jogar/campo-minado/\">Campo Minado da Karma Games</a> a primeira casa aberta nunca é mina e o melhor tempo de cada nível fica salvo no navegador. No celular, use o toque longo ou o botão Bandeira para marcar minas. Comece no Fácil aplicando as regras 1 e 2 e só passe de nível quando ganhar sem chutar."]
    ]
  },
  {
    slug: "regras-da-paciencia",
    jogo: "paciencia",
    publicado: "2026-11-24",
    titulo: "Regras da paciência: como jogar e estratégias para ganhar mais",
    descricao: "As regras da paciência (Klondike), a diferença entre virar 1 e virar 3 cartas e as estratégias que aumentam suas vitórias.",
    blocos: [
      ["p", "A paciência mais conhecida no Brasil é a Klondike, a mesma que vinha nos computadores antigos. É jogada sozinha com um baralho comum de 52 cartas, sem coringas. Nem toda partida tem solução, mas boas decisões fazem uma grande diferença no número de vitórias."],
      ["h2", "A mesa"],
      ["ul", [
        "<b>Sete colunas:</b> a primeira tem uma carta, a segunda duas, e assim até a sétima, com sete. Só a última carta de cada coluna começa virada para cima.",
        "<b>Monte:</b> as 24 cartas que sobram ficam viradas para baixo, para serem compradas.",
        "<b>Descarte:</b> onde as cartas compradas do monte aparecem viradas para cima.",
        "<b>Quatro fundações:</b> as pilhas de destino, uma para cada naipe, começando vazias."
      ]],
      ["h2", "O objetivo"],
      ["p", "Levar as 52 cartas para as fundações. Cada fundação começa com o Ás e sobe em ordem, no mesmo naipe: Ás, 2, 3 e assim até o Rei."],
      ["h2", "Como mover as cartas"],
      ["ul", [
        "Nas colunas, as cartas formam sequências decrescentes de cores alternadas: um 9 vermelho vai sobre um 10 preto, um 8 preto vai sobre esse 9 vermelho.",
        "Você pode mover uma carta sozinha ou uma sequência inteira já organizada de uma coluna para outra.",
        "Quando uma carta virada para baixo fica exposta no fim de uma coluna, ela é virada para cima.",
        "Só um Rei, ou uma sequência que começa com um Rei, pode ocupar uma coluna vazia.",
        "A carta de cima do descarte pode ir para uma coluna ou para uma fundação.",
        "Quando o monte acaba, o descarte é virado e vira o monte de novo."
      ]],
      ["h2", "Virar 1 ou virar 3"],
      ["p", "No modo Virar 1, cada clique no monte mostra uma carta, e você vê todas elas a cada volta. No modo Virar 3, saem três cartas de cada vez e só a de cima pode ser usada. As de baixo ficam presas até a de cima sair, e a ordem do monte muda conforme você joga. O Virar 3 é bem mais difícil e exige planejar com antecedência."],
      ["h2", "Estratégias que funcionam"],
      ["ol", [
        "<b>Priorize as cartas viradas para baixo.</b> O que trava a paciência são as cartas escondidas nas colunas. Na dúvida entre dois lances, escolha o que vira uma carta nova, de preferência na coluna com mais cartas escondidas.",
        "<b>Use o monte por último.</b> Antes de comprar, veja todos os movimentos possíveis entre as colunas.",
        "<b>Não esvazie uma coluna sem ter um Rei para ela.</b> Coluna vazia só aceita Rei. Se não houver Rei disponível, ela não serve para nada por enquanto.",
        "<b>Escolha o Rei com cuidado.</b> Se dois Reis podem ir para a coluna vazia, prefira aquele cuja cor combina com as Damas e Valetes que você já tem à vista.",
        "<b>Não mande tudo para as fundações cedo demais.</b> Áses e 2 podem ir sempre. Cartas mais altas às vezes são necessárias nas colunas para receber outras. Um 5 vermelho na fundação pode fazer falta para segurar um 4 preto.",
        "<b>Equilibre as fundações.</b> Evite subir um naipe muito acima dos outros. Cartas baixas de outros naipes vão precisar das cartas que você mandou embora."
      ]],
      ["h2", "Quantas partidas dá para ganhar?"],
      ["p", "Nem toda distribuição de cartas tem solução. No Virar 1, jogadores experientes ganham a maioria das partidas; no Virar 3, a taxa cai bastante. Por isso, não desanime com uma sequência de derrotas: compare suas vitórias ao longo de muitas partidas."],
      ["h2", "Jogue agora"],
      ["p", "A <a href=\"jogar/paciencia/\">Paciência da Karma Games</a> tem os modos Virar 1 e Virar 3, botões de Dica e Desfazer e guarda no navegador quantas vitórias você fez e o seu melhor tempo. Use o Desfazer para testar as estratégias deste guia: volte um lance e compare o que acontece com cada escolha."]
    ]
  },
  {
    slug: "estrategia-2048",
    jogo: "2048",
    publicado: "2026-11-24",
    titulo: "Estratégia do 2048: como chegar ao 2048 (e passar dele)",
    descricao: "A estratégia do canto no 2048 explicada passo a passo: onde guardar a maior peça, quais direções usar e como sair de um tabuleiro travado.",
    blocos: [
      ["p", "O 2048 parece um jogo de reflexo, mas jogar rápido e aleatório raramente passa da peça 512. Quem chega ao 2048 com frequência segue uma estratégia simples e consistente. Este guia explica qual é e por que ela funciona."],
      ["h2", "Como o jogo funciona"],
      ["p", "O tabuleiro tem 4 por 4 casas. A cada movimento, todas as peças deslizam para o mesmo lado. Duas peças de mesmo valor que se encontram viram uma só, com a soma. Depois de cada movimento aparece uma peça nova numa casa vazia, quase sempre um 2 e às vezes um 4. O jogo acaba quando o tabuleiro enche e nenhum movimento junta peças."],
      ["p", "Para formar a peça 2048, você precisa juntar duas de 1024, que vieram de quatro de 512, e assim por diante. Na prática, são centenas de junções. Cada uma depende de as peças certas estarem lado a lado na hora certa."],
      ["h2", "A estratégia do canto"],
      ["p", "Escolha um canto, por exemplo o inferior esquerdo, e decida que a maior peça vai morar ali durante a partida inteira. Todo o resto do jogo gira em torno de proteger esse canto."],
      ["ol", [
        "<b>Use duas direções na maior parte do tempo.</b> Com o canto inferior esquerdo, os movimentos principais são para baixo e para a esquerda. Eles empurram as peças em direção ao canto.",
        "<b>A terceira direção é a reserva.</b> Quando baixo e esquerda não mexem nada, use a direita. Ela costuma ser menos perigosa que a quarta.",
        "<b>Evite a direção oposta ao canto.</b> No exemplo, é o movimento para cima. Ele tira a maior peça do canto e abre espaço para um 2 entrar no lugar dela. Use só se não houver nenhuma outra opção."
      ]],
      ["h2", "Monte uma fila em ordem"],
      ["p", "Não basta a maior peça estar no canto. As seguintes devem ficar ao lado dela, em ordem decrescente, ao longo da borda: por exemplo 256, 128, 64, 32 na fileira de baixo. Assim, quando um novo 32 se forma ao lado do 32, ele se junta, vira 64, encontra o outro 64, e a fila inteira se junta em cascata."],
      ["p", "Quando a fileira de baixo enche, continue a ordem na fileira de cima, em zigue-zague: a sequência sobe pela coluna da ponta e volta no sentido contrário. É o formato de cobra, usado por quem chega aos 4096 e 8192."],
      ["h2", "Mantenha a borda cheia"],
      ["p", "Se a fileira do canto tiver um buraco, um movimento lateral pode puxar uma peça pequena para lá e quebrar a ordem. Por isso, prefira movimentos que mantenham a fileira do canto completa. Com ela cheia, o movimento para a esquerda ou para a direita não tira a maior peça do lugar."],
      ["h2", "Quando o tabuleiro trava"],
      ["ul", [
        "Não entre em pânico. Olhe o tabuleiro inteiro e procure duas peças iguais vizinhas antes de mover.",
        "Prefira o movimento que junta peças pequenas longe do canto. Elas abrem espaço sem bagunçar a fila principal.",
        "Se você teve que tirar a maior peça do canto, devolva-a no próximo movimento, antes que uma peça nova ocupe o lugar."
      ]],
      ["h2", "Erros comuns"],
      ["ul", [
        "<b>Correr.</b> O jogo não tem tempo. Pense em cada movimento quando o tabuleiro estiver cheio.",
        "<b>Juntar peças grandes longe do canto.</b> Uma 128 perdida no meio do tabuleiro ocupa espaço e não tem como chegar à fila.",
        "<b>Usar as quatro direções igualmente.</b> É o jeito mais rápido de perder o controle do tabuleiro."
      ]],
      ["h2", "Jogue agora"],
      ["p", "O <a href=\"jogar/2048/\">2048 da Karma Games</a> guarda seu recorde e a partida em andamento, então dá para parar e voltar depois. O botão Desfazer (ou a tecla Z) volta a última jogada, ótimo para entender o efeito de cada direção enquanto você aprende a estratégia do canto."]
    ]
  }
];

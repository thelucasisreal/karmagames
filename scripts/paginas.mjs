// Textos das páginas institucionais (Sobre, Contato, Privacidade, Termos).
// Cada página é uma lista de blocos: ["h2", texto] | ["p", html] | ["ul", [html, ...]].
// {email}, {contato}, {data}, {jogos} e {dominio} são trocados pelo gerador (scripts/seo.mjs).

export const PAGINAS = [
  {
    slug: "sobre",
    titulo: "Sobre a Karma Games",
    menu: "Sobre",
    descricao: "Quem faz a Karma Games, como os jogos são feitos e por que todos são grátis, sem download e sem cadastro.",
    blocos: [
      ["p", "A Karma Games é um site brasileiro de jogos grátis para jogar direto no navegador. São {jogos} jogos, todos em português, que abrem em segundos no computador, no tablet ou no celular. Não tem download, não tem instalação e não pede cadastro."],
      ["h2", "Feitos aqui"],
      ["p", "Todos os jogos do catálogo foram feitos pela própria equipe da Karma Games. Tem clássicos que todo mundo conhece, como Xadrez, Dama, Paciência, Sudoku, Campo Minado e Jogo da Velha, refeitos com regras completas e controles que funcionam bem no toque. E tem jogos autorais, como o CrossStrike 3D, o Não Confia e o Behind The Grid, criados do zero para o site."],
      ["h2", "Como o site funciona"],
      ["ul", [
        "Os jogos rodam em HTML5 e JavaScript, direto no navegador. Funcionam no Chrome, Edge, Firefox e Safari atuais.",
        "O progresso e os recordes ficam salvos no seu próprio aparelho. Nenhuma conta é necessária.",
        "Cada jogo tem uma página com as regras, os controles, dicas e respostas para as dúvidas mais comuns.",
        "O site se mantém com anúncios. É isso que permite que todos os jogos continuem grátis."
      ]],
      ["h2", "Para quem é"],
      ["p", "Para quem quer uma partida rápida no intervalo, para quem gosta de quebra-cabeça e estratégia, e para famílias: a maioria dos jogos é tranquila para todas as idades. O CrossStrike 3D é um jogo de tiro, com violência de desenho, e é mais indicado para adolescentes e adultos."],
      ["h2", "Fale com a gente"],
      ["p", "Achou um erro, tem uma ideia de jogo ou quer dar uma sugestão? Veja a página de <a href=\"contato/\">contato</a>."]
    ]
  },
  {
    slug: "contato",
    titulo: "Contato",
    menu: "Contato",
    descricao: "Fale com a Karma Games: sugestões de jogos, erros encontrados, privacidade e parcerias.",
    blocos: [
      ["p", "Quer falar com a Karma Games? A gente lê todas as mensagens."],
      ["h2", "Como falar com a gente"],
      ["ul", "{contato}"],
      ["h2", "Ajuda a gente a te ajudar"],
      ["p", "Se for um erro em algum jogo, conte qual jogo, o que aconteceu e em qual aparelho e navegador você estava (por exemplo: celular Android, Chrome). Isso acelera muito o conserto."],
      ["h2", "Privacidade"],
      ["p", "Pedidos sobre seus dados pessoais, como acesso ou exclusão, também podem ser enviados pelos canais acima. Veja como tratamos os dados na <a href=\"privacidade/\">Política de Privacidade</a>."]
    ]
  },
  {
    slug: "privacidade",
    titulo: "Política de Privacidade",
    menu: "Privacidade",
    descricao: "Como a Karma Games trata dados, cookies e anúncios, de acordo com a LGPD.",
    blocos: [
      ["p", "Última atualização: {data}."],
      ["p", "Esta política explica quais dados a Karma Games ({dominio}) usa, para quê, e quais são os seus direitos de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD)."],
      ["h2", "O que a gente não coleta"],
      ["p", "Os jogos não pedem cadastro, nome, e-mail ou telefone. Não vendemos dados de ninguém."],
      ["h2", "Dados salvos no seu aparelho"],
      ["p", "Para lembrar dos jogos que você abriu, dos seus recordes e das suas configurações (como som ligado ou desligado), o site usa o armazenamento local do navegador (localStorage). Esses dados ficam só no seu aparelho, não são enviados para a gente e podem ser apagados a qualquer momento limpando os dados do site nas configurações do navegador."],
      ["h2", "Cookies e anúncios"],
      ["p", "O site exibe anúncios do Google AdSense, que é o que mantém os jogos grátis. Sobre isso:"],
      ["ul", [
        "Fornecedores terceiros, incluindo o Google, usam cookies para veicular anúncios com base em visitas anteriores do usuário a este e a outros sites.",
        "Com os cookies de publicidade, o Google e os parceiros dele podem veicular anúncios com base nas suas visitas a este site e a outros sites da internet.",
        "Você pode desativar a publicidade personalizada nas <a href=\"https://adssettings.google.com/\" rel=\"noopener\">Configurações de anúncios do Google</a>. Também é possível desativar cookies de fornecedores terceiros em <a href=\"https://www.aboutads.info/choices/\" rel=\"noopener\">www.aboutads.info</a>.",
        "Saiba mais em <a href=\"https://policies.google.com/technologies/ads?hl=pt-BR\" rel=\"noopener\">Como o Google usa cookies em publicidade</a> e <a href=\"https://policies.google.com/technologies/partner-sites?hl=pt-BR\" rel=\"noopener\">Como o Google usa dados de sites parceiros</a>."
      ]],
      ["h2", "Jogos online"],
      ["p", "Alguns jogos têm modo online com amigos. Nesses modos, os aparelhos se conectam diretamente (WebRTC) e um servidor de conexão de terceiros (PeerJS) ajuda a fazer o encontro entre os jogadores. É usado só um código de sala temporário e o apelido que você escolher no jogo."],
      ["h2", "Registros técnicos"],
      ["p", "O site é hospedado no GitHub Pages. Como qualquer servidor, ele pode registrar dados técnicos de acesso, como endereço IP e tipo de navegador, para segurança e funcionamento. Veja a <a href=\"https://docs.github.com/pt/site-policy/privacy-policies/github-general-privacy-statement\" rel=\"noopener\">declaração de privacidade do GitHub</a>."],
      ["h2", "Crianças"],
      ["p", "Os jogos são para todas as idades, mas não coletamos de propósito dados pessoais de crianças. Se você é responsável por uma criança e acha que ela enviou algum dado para a gente, fale com a gente que apagamos."],
      ["h2", "Seus direitos"],
      ["p", "Pela LGPD, você pode pedir confirmação de que tratamos seus dados, acesso, correção, exclusão e informações sobre compartilhamento. Para isso, use a página de <a href=\"contato/\">contato</a>."],
      ["h2", "Mudanças nesta política"],
      ["p", "Se esta política mudar, a data no topo desta página é atualizada."]
    ]
  },
  {
    slug: "termos",
    titulo: "Termos de Uso",
    menu: "Termos",
    descricao: "Regras de uso da Karma Games: jogos grátis, conteúdo, anúncios e responsabilidades.",
    blocos: [
      ["p", "Última atualização: {data}."],
      ["p", "Ao usar a Karma Games ({dominio}), você concorda com estes termos. Se não concordar, não use o site."],
      ["h2", "Uso do site"],
      ["ul", [
        "Os jogos são grátis para uso pessoal e não comercial.",
        "Não é permitido copiar, revender ou republicar os jogos ou o conteúdo do site sem autorização.",
        "Não é permitido tentar atrapalhar o funcionamento do site, dos jogos online ou de outros jogadores.",
        "Nos modos online, seja respeitoso. Apelidos ofensivos ou trapaças podem levar ao bloqueio da sala."
      ]],
      ["h2", "Conteúdo"],
      ["p", "Os jogos, textos, imagens e a marca Karma Games pertencem à Karma Games. Nomes de jogos clássicos de domínio público (como Xadrez, Dama e Paciência) são usados só para descrever os jogos."],
      ["h2", "Anúncios"],
      ["p", "O site exibe anúncios de terceiros, como o Google AdSense. Não somos responsáveis pelo conteúdo dos sites anunciados. Detalhes sobre cookies estão na <a href=\"privacidade/\">Política de Privacidade</a>."],
      ["h2", "Garantias"],
      ["p", "Os jogos são oferecidos do jeito que estão. Fazemos o possível para que funcionem bem, mas não garantimos que o site fique sempre no ar, sem erros, ou que recordes salvos no aparelho nunca se percam."],
      ["h2", "Mudanças"],
      ["p", "Estes termos podem ser atualizados. A data no topo mostra a versão em vigor. Dúvidas? Veja a página de <a href=\"contato/\">contato</a>."]
    ]
  }
];

// Texto de cada categoria (aparece na página da categoria).
export const CATEGORIAS = {
  "Ação": "Jogos de ação grátis para jogar no navegador: tiro em equipe, plataforma difícil e desafios de reflexo. Partidas rápidas no computador ou no celular, sem baixar nada.",
  "Arcade": "Jogos arcade grátis, do tipo que dá para jogar em um minuto e não dá para parar: blocos caindo, torre de blocos, voo entre colunas e quebra-blocos. Bata o seu próprio recorde.",
  "Clássicos": "Os jogos clássicos de sempre, grátis e em português: Paciência, Cobrinha, Pong, Forca, Genius, Jogo da Velha e Pedra, Papel e Tesoura. Do jeito que você lembra, funcionando no celular.",
  "Quebra-cabeça": "Jogos de quebra-cabeça e raciocínio grátis: Sudoku, 2048, Campo Minado e Jogo da Memória. Ótimos para treinar a cabeça em partidas curtas.",
  "Tabuleiro": "Jogos de tabuleiro online grátis: Xadrez, Dama na regra brasileira, Ligue 4 e Reversi. Jogue contra o computador ou com um amigo no mesmo aparelho.",
  "Casual": "Jogos casuais grátis para relaxar: estoure balões, pesque com o gatinho e faça biscoitos sem parar. Fáceis de aprender e bons para qualquer idade.",
  "Simulação": "Jogos de simulação grátis no navegador: viva a vida de influenciador, tome decisões e veja o que acontece nos bastidores.",
  "Esporte": "Jogos de esporte grátis para jogar direto no navegador."
};

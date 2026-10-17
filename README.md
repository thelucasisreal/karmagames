# Karma Games

Site de jogos grátis no navegador: **https://karmagames.com.br**

Site estático (HTML, CSS e JS puros, sem build). Hospedado no GitHub Pages.

## Rodar no computador

```sh
python3 -m http.server 8080
```

Depois abra http://localhost:8080

## Adicionar um jogo

1. Crie a pasta `jogos/<slug>/` com o `index.html` do jogo dentro (pode ter outros arquivos junto: imagens, sons, js).
2. Coloque a capa em `assets/capas/<slug>.webp` (formato 16:10, uns 800x500). Se não tiver capa, aparece um ícone no lugar.
3. Abra `jogos.js` e adicione um bloco:

```js
{
  slug: "meu-jogo",
  titulo: "Meu Jogo",
  descricao: "Uma frase curta sobre o jogo.",
  categoria: "Ação",
  controles: "Setas para andar, espaço para pular",
  autor: "Karma Games",
  autoral: true,          // aparece na seção "Feitos aqui"
  adicionado: "2026-10-03",
},
```

4. Escreva o texto da página do jogo em `scripts/conteudo.json` (sobre, como jogar, dicas e perguntas frequentes; copie o formato de outro jogo).
5. Gere as páginas: `node scripts/seo.mjs` (e `node scripts/imagens.mjs` para a imagem de prévia do jogo, depois `node scripts/seo.mjs` de novo).
6. `git add . && git commit -m "Novo jogo: Meu Jogo" && git push`. Em um ou dois minutos está no ar.

Se esquecer o passo 5, tudo bem: a cada push na `main` o GitHub roda o `seo.mjs` sozinho
(`.github/workflows/seo.yml`), grava as páginas, o sitemap e os `llms*.txt` que faltarem e avisa o Bing
(IndexNow). O jogo novo entra no sitemap com a data do dia.

## Multiplayer online

Xadrez, dama, ligue 4, reversi, jogo da velha e CrossStrike têm o modo **Online**: Jogo rápido, lista de
salas abertas ou sala com código e link de convite, cada um no próprio aparelho. A lib comum é `assets/karma-net.js` e o servidor de
salas fica em [`realtime/`](realtime/README.md), que explica como plugar outro jogo.

## Páginas geradas (SEO)

`index.html`, `jogar/<slug>/`, `categoria/<slug>/`, `sobre/`, `contato/`, `privacidade/`, `termos/`, `404.html`, `jogar.html`, `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, `site.webmanifest`, `ads.txt`, a chave do IndexNow (`<chave>.txt`) e `scripts/datas.json` são **gerados** por `node scripts/seo.mjs`. Não edite esses arquivos à mão: mude `jogos.js`, `scripts/conteudo.json`, `scripts/paginas.mjs` ou `scripts/site.json` e rode o script de novo.

- **Datas reais:** `scripts/datas.json` guarda um resumo do conteúdo de cada página. Quando o texto da página ou os arquivos do jogo mudam, a data vira a do dia; senão fica a antiga. Essa data vai no `<lastmod>` do sitemap, no `dateModified` do schema e no "Atualizado em" da página. O Google só confia no `lastmod` quando ele é honesto, por isso a data não muda à toa.
- **Busca por IA (GEO):** `llms.txt` é o índice do site para IAs; `llms-full.txt` tem o texto inteiro de todos os jogos. O `robots.txt` libera os robôs de busca das IAs (ChatGPT, Claude, Perplexity, Gemini...). Jogos com modo online ganham `playMode: MultiPlayer` no schema e entram na seção "Jogos online para jogar com amigos" da página inicial.

`scripts/site.json`:

| Campo | Para quê |
|-------|----------|
| `email` | contato público (páginas Contato e Privacidade) |
| `adsenseCliente` | código do AdSense (`ca-pub-...`): liga o script de anúncios e cria o `ads.txt` |
| `googleVerificacao` | código da meta tag do Search Console (não precisa se verificar pelo DNS) |
| `atualizado` | data da última revisão das políticas (Privacidade e Termos) |
| `indexnow` | chave do IndexNow (gera o `<chave>.txt` que prova ao Bing que o site é nosso) |

Jogo hospedado em outro lugar? Use o campo `url: "https://..."` em vez de criar a pasta (o site precisa permitir ser aberto em iframe).

Jogo feito com Vite (como os de futebol): rode `npm run build` com `base: "./"` no `vite.config.js` e copie o conteúdo de `dist/` para `jogos/<slug>/`.

Gerar capas automaticamente a partir dos próprios jogos: `npm i -D playwright-core sharp` e depois `node scripts/capas.mjs`.

## Domínio (DNS)

No painel onde o domínio `karmagames.com.br` está registrado (Registro.br ou outro), crie:

| Tipo  | Nome | Valor |
|-------|------|-------|
| A     | @    | 185.199.108.153 |
| A     | @    | 185.199.109.153 |
| A     | @    | 185.199.110.153 |
| A     | @    | 185.199.111.153 |
| CNAME | www  | thelucasisreal.github.io |

Depois, em **Settings → Pages** do repositório, confirme o domínio `karmagames.com.br` e marque **Enforce HTTPS** quando o certificado ficar pronto.

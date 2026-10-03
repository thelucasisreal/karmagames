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

4. `git add . && git commit -m "Novo jogo: Meu Jogo" && git push`. Em um ou dois minutos está no ar.

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

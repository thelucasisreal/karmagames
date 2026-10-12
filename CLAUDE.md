# Karma Games

Site estático (GitHub Pages, sem build de bundler). Veja o README.

- Depois de mudar `jogos.js`, `scripts/conteudo.json`, `scripts/paginas.mjs`, `scripts/site.json`, `assets/site.css` ou `assets/site.js`, rode `node scripts/seo.mjs`. Ele regera `index.html`, `jogar/<slug>/`, `categoria/<slug>/`, as páginas institucionais, `sitemap.xml`, `robots.txt`, `llms.txt` e a versão `?v=` dos arquivos. Não edite esses arquivos gerados à mão.
- Jogo novo precisa de texto em `scripts/conteudo.json` (metaDescricao, sobre, comoJogar, dicas, faq), escrito a partir do que o jogo realmente faz.
- Páginas fora da raiz usam `<base href="/">`: links e caminhos no `site.js` são relativos à raiz (`jogar/<slug>/`, `categoria/<slug>/`).
- Teste em http://localhost:8080 (`python3 -m http.server 8080`). Push só quando o usuário pedir.

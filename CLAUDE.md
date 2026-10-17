# Karma Games

Site estático (GitHub Pages, sem build de bundler). Veja o README.

- Depois de mudar `jogos.js`, `scripts/conteudo.json`, `scripts/paginas.mjs`, `scripts/site.json`, `assets/site.css` ou `assets/site.js`, rode `node scripts/seo.mjs`. Ele regera `index.html`, `jogar/<slug>/`, `categoria/<slug>/`, as páginas institucionais, `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, `scripts/datas.json` (data real de mudança de cada página) e a versão `?v=` dos arquivos. Não edite esses arquivos gerados à mão. O workflow `.github/workflows/seo.yml` também roda o script a cada push na main e grava o que faltar.
- Jogo novo precisa de texto em `scripts/conteudo.json` (metaDescricao, sobre, comoJogar, dicas, faq), escrito a partir do que o jogo realmente faz.
- Páginas fora da raiz usam `<base href="/">`: links e caminhos no `site.js` são relativos à raiz (`jogar/<slug>/`, `categoria/<slug>/`).
- Teste em http://localhost:8080 (`python3 -m http.server 8080`). Push só quando o usuário pedir.
- Multiplayer online: lib `assets/karma-net.js` + servidor `realtime/` (ver `realtime/README.md`). Jogo de turnos pluga o modo "online" como em `jogos/ligue-4` (bloco `/* ---- online ---- */`); a jogada remota passa pela mesma função do clique. Teste local com `?rt=ws://localhost:4810`.

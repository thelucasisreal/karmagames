# Realtime: servidor de salas do multiplayer online

Servidor WebSocket genérico. Ele **não conhece regra de jogo**: cria sala com código, repassa as
mensagens entre quem está nela, guarda o último estado publicado (para quem recarrega a página ou cai
e volta) e segura o lugar de quem caiu por 90 s.

Os jogos falam com ele pela lib [`assets/karma-net.js`](../assets/karma-net.js).

## Onde roda

Duas VMs gratuitas da Oracle (São Paulo), uma sala vive em uma só:

| servidor | endereço | código da sala começa com |
|---|---|---|
| `oci1-micro` | `wss://rt1.karmagames.com.br` | `1` |
| `oci1-micro2` | `wss://rt2.karmagames.com.br` | `2` |

Criar sala tenta o `rt1` e, se ele não responder, o `rt2`. Entrar lê o primeiro caractere do código e
vai direto ao servidor certo. Em cada VM: código em `/opt/karma-realtime`, serviço systemd
`karma-realtime` (porta 4810 local), e o Caddy publica o domínio com HTTPS automático.

`GET https://rt1.karmagames.com.br/saude` mostra salas, jogadores e memória.
`GET https://rt1.karmagames.com.br/salas?jogo=<slug>` lista as salas abertas com vaga (é o que o lobby mostra).

## Rodar no computador

```sh
cd realtime && npm install && npm start      # ws://localhost:4810
npm test                                     # testes do protocolo
```

Depois abra o jogo com `?rt=` apontando para ele, nas duas abas:
`http://localhost:8080/jogos/ligue-4/?rt=ws://localhost:4810`

## Plugar um jogo de turnos

Veja `jogos/ligue-4/index.html` (procure `/* ---- online ---- */`). O caminho é sempre o mesmo:

1. `<script src="../../assets/karma-net.js"></script>` e um botão `data-mode="online"`.
2. `KarmaNet.lobby({ jogo: "<slug>", titulo: "<Nome>" })` abre o lobby e resolve com a `sala`. Com
   `max: 2` (padrão) resolve quando os dois estão na mesa; com mais lugares, assim que a pessoa entra.
   `sala.lugar` 0 é quem criou. O lobby tem:
   - **Jogo rápido**: entra na sala aberta mais antiga com vaga, ou cria uma aberta e espera. Se duas
     pessoas tocam juntas, quem criou depois muda para a sala da outra.
   - **Salas abertas**: lista dos dois servidores, atualizada a cada 3 s.
   - **Criar sala com código** (não aparece na lista) e **entrar com código**.
3. Na sua vez: `sala.enviar({ ...jogada, rodada })` e aplica a jogada. Quando chega
   `sala.on("msg", d => ...)`: confere se é a vez do outro e se a jogada é válida, e chama a **mesma
   função do clique**.
4. Depois de cada jogada, `sala.publicar({ rodada, hist })`. Quem volta (recarregou ou caiu) recebe
   isso em `sala.estado` e refaz a partida.
5. `sala.on("saiu", ...)` encerra a partida; `sala.sair()` ao trocar de modo.

Convite: `karmagames.com.br/jogar/<slug>/?sala=CODIGO`. O site repassa o `?sala` ao jogo e o lobby entra
direto.

## Protocolo

Um objeto JSON por mensagem.

| de → para | mensagem |
|---|---|
| cliente → servidor | `{t:"criar", jogo, nome, max, aberta?}` · `{t:"entrar", codigo, jogo, nome, chave?}` · `{t:"msg", dados, para?}` · `{t:"estado", dados}` · `{t:"abrir", aberta}` (só o dono: menor lugar presente) · `{t:"sair"}` |
| servidor → cliente | `{t:"sala", codigo, lugar, chave, jogadores, estado}` · `{t:"msg", de, dados}` · `{t:"entrou"}` · `{t:"caiu"}` · `{t:"voltou"}` · `{t:"saiu"}` · `{t:"erro", motivo}` |

Limites: 8 jogadores por sala, 8 KB por mensagem, 40 mensagens/s por conexão, só origens do
karmagames.com.br, do GitHub Pages e de localhost.

## Atualizar o servidor

Copie `servidor.mjs`, `package.json` e `package-lock.json` para `/opt/karma-realtime` nas duas VMs,
rode `npm ci --omit=dev` como usuário `karma` e `systemctl restart karma-realtime`.

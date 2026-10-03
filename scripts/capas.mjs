// Gera as capas (assets/capas/<slug>.webp) tirando print de cada jogo em jogos/.
//
// Uso:  node scripts/capas.mjs              (só jogos sem capa)
//       node scripts/capas.mjs --todas      (refaz todas)
//       node scripts/capas.mjs cobrinha     (só esse)
// Precisa de:  npm i -D playwright-core sharp   e um Chromium/Chrome instalado
// (CHROME=/caminho/do/navegador se não estiver em /usr/bin/chromium).
import { chromium } from "playwright-core";
import sharp from "sharp";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CAPAS = path.join(RAIZ, "assets", "capas");
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav" };

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const todas = process.argv.includes("--todas");
const slugs = args.length ? args : fs.readdirSync(path.join(RAIZ, "jogos")).filter((d) => fs.existsSync(path.join(RAIZ, "jogos", d, "index.html")));

const servidor = http.createServer((req, res) => {
  let arq = path.join(RAIZ, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (arq.endsWith(path.sep)) arq = path.join(arq, "index.html");
  fs.readFile(arq, (err, dados) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(arq)] || "application/octet-stream" });
    res.end(dados);
  });
}).listen(0, "127.0.0.1");
await new Promise((r) => servidor.once("listening", r));
const porta = servidor.address().port;

fs.mkdirSync(CAPAS, { recursive: true });
const nav = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/chromium" });
const pag = await nav.newPage({ viewport: { width: 960, height: 600 } });
for (const slug of slugs) {
  const destino = path.join(CAPAS, `${slug}.webp`);
  if (fs.existsSync(destino) && !todas && !args.length) continue;
  await pag.goto(`http://127.0.0.1:${porta}/jogos/${slug}/`);
  await pag.waitForTimeout(900);
  // Mexe um pouco no jogo para a capa mostrar ele rodando, não a tela inicial.
  await pag.mouse.click(480, 300);
  await pag.keyboard.press("Space");
  for (const tecla of ["Space", "ArrowUp", "Space", "ArrowLeft", "Space", "ArrowDown", "Space", "ArrowRight", "Space"]) {
    await pag.waitForTimeout(160);
    await pag.keyboard.press(tecla);
  }
  await pag.waitForTimeout(250);
  await sharp(await pag.screenshot()).resize(800, 500).webp({ quality: 86 }).toFile(destino);
  console.log("capa:", path.relative(RAIZ, destino));
}
await nav.close();
servidor.close();

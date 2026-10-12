// Gera as imagens que os buscadores e as redes sociais pedem e que SVG não atende:
//   assets/icone-180.png, -192.png, -512.png   (ícone do site, a partir de favicon.svg)
//   assets/og/<slug>.jpg e assets/og/karma.jpg  (1200x630, prévia no WhatsApp, Google, redes)
// Uso:  node scripts/imagens.mjs            (só o que falta)
//       node scripts/imagens.mjs --todas    (refaz tudo)
// Precisa de Chromium/Chrome (CHROME=/caminho se não estiver em /usr/bin/chromium) e ImageMagick (magick).
// Depois rode  node scripts/seo.mjs  para as páginas apontarem para as imagens novas.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = process.env.CHROME || "/usr/bin/chromium";
const todas = process.argv.includes("--todas");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "karma-img-"));
const url = (arq) => pathToFileURL(path.join(RAIZ, arq)).href;

function foto(html, largura, altura, destino) {
  if (fs.existsSync(path.join(RAIZ, destino)) && !todas) return;
  const pagina = path.join(tmp, "p.html");
  const png = path.join(tmp, "p.png");
  fs.writeFileSync(pagina, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}</style>${html}`);
  const r = spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
    `--window-size=${largura},${altura + 300}`, `--screenshot=${png}`, "--virtual-time-budget=1500", pathToFileURL(pagina).href], { stdio: "pipe" });
  if (r.status !== 0 || !fs.existsSync(png)) throw new Error(`chromium falhou em ${destino}: ${r.stderr}`);
  fs.mkdirSync(path.dirname(path.join(RAIZ, destino)), { recursive: true });
  const saida = path.join(RAIZ, destino);
  const corte = ["-crop", `${largura}x${altura}+0+0`, "+repage", "-strip"];
  const args = destino.endsWith(".jpg") ? [png, ...corte, "-quality", "86", saida] : [png, ...corte, saida];
  spawnSync("magick", args, { stdio: "inherit" });
  fs.rmSync(png);
  console.log("imagem:", destino);
}

// Ícones
for (const t of [180, 192, 512]) {
  foto(`<img src="${url("favicon.svg")}" style="width:${t}px;height:${t}px;display:block">`, t, t, `assets/icone-${t}.png`);
}

// Prévia de cada jogo: a capa ocupando tudo e a marca no canto.
const contexto = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(RAIZ, "jogos.js"), "utf8"), contexto);
const marca = `<div style="position:absolute;left:36px;bottom:32px;display:flex;align-items:center;gap:14px;padding:12px 20px 12px 14px;border-radius:999px;background:#fff;font:800 30px/1 sans-serif;color:#0f1a2b;box-shadow:0 8px 24px rgba(0,0,0,.25)"><img src="${url("assets/marca.svg")}" style="width:44px;height:44px">karma<b style="background:#c8f13a;padding:2px 8px;border-radius:6px">games</b></div>`;
for (const j of contexto.window.KARMA_JOGOS) {
  const capa = j.capa || `assets/capas/${j.slug}.webp`;
  if (!fs.existsSync(path.join(RAIZ, capa))) continue;
  foto(`<div style="position:relative;width:1200px;height:630px;background:#62d9cf"><img src="${url(capa)}" style="width:1200px;height:630px;object-fit:cover;display:block">${marca}</div>`, 1200, 630, `assets/og/${j.slug}.jpg`);
}

// Prévia do site: mosaico de capas.
const capas = contexto.window.KARMA_JOGOS.map((j) => j.capa || `assets/capas/${j.slug}.webp`).filter((c) => fs.existsSync(path.join(RAIZ, c))).slice(0, 12);
foto(`<div style="position:relative;width:1200px;height:630px;background:linear-gradient(160deg,#62d9cf,#7cc8f2);overflow:hidden">
  <div style="position:absolute;inset:-40px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px;transform:rotate(-6deg)">${capas.map((c) => `<img src="${url(c)}" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:18px">`).join("")}</div>
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(13,14,18,.85),rgba(13,14,18,.2))"></div>
  <div style="position:absolute;left:64px;top:170px;color:#fff;font:800 64px/1.05 sans-serif;max-width:720px">Jogos grátis<br>direto no navegador</div>
  ${marca.replace("bottom:32px", "bottom:150px").replace("left:36px", "left:64px")}
</div>`, 1200, 630, "assets/og/karma.jpg");

fs.rmSync(tmp, { recursive: true, force: true });

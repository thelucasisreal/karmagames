// Avisa os buscadores do IndexNow (Bing, Yandex, Seznam, Naver...) das páginas novas ou mudadas.
// Compara o sitemap.xml atual com um anterior: entra quem é novo ou mudou de <lastmod>.
//
// Uso:  node scripts/indexnow.mjs <sitemap-anterior.xml> [--enviar]
// Sem --enviar só mostra a lista. Quem roda de verdade é o .github/workflows/seo.yml, depois do deploy.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CFG = JSON.parse(fs.readFileSync(path.join(RAIZ, "scripts/site.json"), "utf8"));
const [anterior, flag] = process.argv.slice(2);

const ler = (xml) => new Map([...xml.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map((m) => [m[1], m[2]]));
const agora = ler(fs.readFileSync(path.join(RAIZ, "sitemap.xml"), "utf8"));
const antes = anterior && fs.existsSync(anterior) ? ler(fs.readFileSync(anterior, "utf8")) : new Map();
const urls = [...agora].filter(([u, d]) => antes.get(u) !== d).map(([u]) => u);

console.log(`${urls.length} página(s) para avisar`);
for (const u of urls) console.log(" ", u);
if (!urls.length || flag !== "--enviar") process.exit(0);
if (!CFG.indexnow) { console.log("sem chave indexnow em scripts/site.json"); process.exit(0); }

const host = new URL(CFG.dominio).host;
const resp = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key: CFG.indexnow, keyLocation: `${CFG.dominio.replace(/\/$/, "")}/${CFG.indexnow}.txt`, urlList: urls.slice(0, 10000) }),
});
console.log(`IndexNow respondeu ${resp.status}`);
// 200/202 = recebido. Erro aqui não deve quebrar o deploy: o sitemap continua valendo.

import fs from "node:fs";
const c = JSON.parse(fs.readFileSync("C:/Users/yunis/Downloads/AlKitaab_Project/web/data/conjugations.json", "utf8"));
const e = c[Object.keys(c)[0]];
const params = new URLSearchParams({ action: "parse", format: "json", formatversion: "2", prop: "text", contentmodel: "wikitext", disablelimitreport: "1", title: e.title, text: `{{ar-conj|${e.args}}}` });
const r = await fetch(`https://en.wiktionary.org/w/api.php?${params}`, { headers: { "User-Agent": "AlKitaabVocabBot/1.0 (educational)" } });
const html = JSON.parse(await r.text()).parse.text;
const heads = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim()).filter((x) => /subjunctive|jussive|indicative|imperative/i.test(x));
console.log(JSON.stringify(heads.slice(0, 14)));

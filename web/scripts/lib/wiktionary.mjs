// Minimal Wiktionary client for the vocabulary tools.
//
//  - rawPage(title)            wikitext of an entry (cached)
//  - entriesOnPage(wikitext)   [{ root, conj: { args, form } }] in page order
//  - renderConj(title, args)   conjugation table for an {{ar-conj}} invocation, parsed (cached)
//
// Politeness: identifies itself, one request at a time, small delay, caches
// everything under data/cache/ (git-ignored). Wiktionary text is CC BY-SA 4.0.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CACHE = path.join(root, "data/cache/wiktionary");
const UA = "AlKitaabVocabBuilder/0.1 (private Arabic study project; root and conjugation lookups)";
const DELAY_MS = 120;

fs.mkdirSync(path.join(CACHE, "raw"), { recursive: true });
fs.mkdirSync(path.join(CACHE, "conj"), { recursive: true });

let last = 0;
async function politeFetch(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const wait = last + DELAY_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 404) return { status: 404, text: "" };
      if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 1500 * (i + 1))); continue; }
      return { status: res.status, text: await res.text() };
    } catch {
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return { status: 0, text: "" };
}

const fileKey = (s) => Buffer.from(s, "utf8").toString("hex").slice(0, 120) + "-" + Buffer.from(s, "utf8").length;

export async function rawPage(title) {
  const f = path.join(CACHE, "raw", fileKey(title) + ".txt");
  if (fs.existsSync(f)) { const t = fs.readFileSync(f, "utf8"); return t === "\u0000MISSING" ? null : t; }
  const { status, text } = await politeFetch(`https://en.wiktionary.org/w/index.php?title=${encodeURIComponent(title)}&action=raw`);
  if (status === 200) { fs.writeFileSync(f, text); return text; }
  if (status === 404) { fs.writeFileSync(f, "\u0000MISSING"); return null; }
  return undefined; // network trouble: do not cache
}

// Many pages at once (50 titles per request). Fills the same cache as rawPage.
// Returns Map(title -> wikitext | null when the page does not exist).
export async function rawPages(titles) {
  const out = new Map();
  const need = [];
  for (const t of [...new Set(titles)]) {
    const f = path.join(CACHE, "raw", fileKey(t) + ".txt");
    if (fs.existsSync(f)) { const c = fs.readFileSync(f, "utf8"); out.set(t, c === "\u0000MISSING" ? null : c); }
    else need.push(t);
  }
  for (let i = 0; i < need.length; i += 50) {
    const batch = need.slice(i, i + 50);
    const params = new URLSearchParams({
      action: "query", format: "json", formatversion: "2", prop: "revisions", rvprop: "content", rvslots: "main",
      redirects: "1", titles: batch.join("|"),
    });
    const { status, text } = await politeFetch(`https://en.wiktionary.org/w/api.php?${params}`);
    if (status !== 200) continue; // leave uncached; the caller can retry
    let q;
    try { q = JSON.parse(text).query; } catch { continue; }
    // follow normalization and redirects back to the titles we asked for
    const alias = new Map();
    for (const n of q.normalized ?? []) alias.set(n.to, n.from);
    for (const r of q.redirects ?? []) alias.set(r.to, alias.get(r.from) ?? r.from);
    const content = new Map();
    for (const p of q.pages ?? []) content.set(alias.get(p.title) ?? p.title, p.missing ? null : p.revisions?.[0]?.slots?.main?.content ?? null);
    for (const t of batch) {
      const c = content.has(t) ? content.get(t) : content.get(t.normalize("NFC"));
      if (c === undefined) continue;
      fs.writeFileSync(path.join(CACHE, "raw", fileKey(t) + ".txt"), c ?? "\u0000MISSING");
      out.set(t, c);
    }
  }
  return out;
}

const FORM_RE = new RegExp(`(?:^|<)(${["VIII", "VII", "VI", "IV", "IX", "III", "II", "XIII", "XII", "XI", "X", "V", "IIIq", "IIq", "IVq", "Iq", "I"].join("|")})(?=[\\/.>|~]|$)`);

// Roots and conjugation invocations in the order they appear on the page.
export function entriesOnPage(wikitext) {
  const out = [];
  let root = null;
  const re = /\{\{ar-rootbox\|([^}|]+)(?:\|[^}]*)?\}\}|\{\{ar-conj\|([^{}]*)\}\}/g;
  for (const m of wikitext.matchAll(re)) {
    if (m[1]) root = m[1].replace(/[\s.\-]/g, "");
    else {
      const args = m[2];
      const fm = args.match(FORM_RE);
      out.push({ root, conj: { args, form: fm ? fm[1] : null } });
    }
  }
  return out;
}

// All roots mentioned on a page (for checking a word's root).
export function rootsOnPage(wikitext) {
  const roots = new Set();
  const add = (s) => { const r = s.replace(/<[^>]*>/g, "").replace(/[\s.\-]/g, ""); if (/^[ء-ي]{2,5}$/.test(r)) roots.add(r); };
  for (const m of wikitext.matchAll(/\{\{ar-rootbox\|([^}|]+)(?:\|[^}]*)?\}\}/g)) add(m[1]);
  for (const m of wikitext.matchAll(/\{\{ar-root\|([^}]+)\}\}/g)) add(m[1].split("|").filter((x) => !/=/.test(x)).join(""));
  // dialect root templates: {{ajp-root|خ و ل}}, {{arz-root|…}}
  for (const m of wikitext.matchAll(/\{\{[a-z]{2,3}-root\|([^}|]+)/g)) add(m[1]);
  // etymology: {{ety|ar|…|:root|ك ن س<id:root>|…}}
  for (const m of wikitext.matchAll(/\{\{ety\|[^}]*?:root\|([^|}]+)/g)) add(m[1]);
  // {{root|ar|ك|ت|ب}}
  for (const m of wikitext.matchAll(/\{\{root\|ar\|([^}]+)\}\}/g)) add(m[1].split("|").filter((x) => !/=/.test(x)).join(""));
  return [...roots];
}

// ---------- table parsing ----------

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
export const formNumber = (f) => ROMAN[f] ?? null;

const stripTags = (s) => s.replace(/<[^>]+>/g, "");
const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");

function arabicOf(cellHtml) {
  const forms = [...cellHtml.matchAll(/<span[^>]*class="Arab[^"]*"[^>]*>([\s\S]*?)<\/span>/g)].map((m) => decode(stripTags(m[1])).trim()).filter(Boolean);
  return forms.length ? [...new Set(forms)].join(" / ") : null;
}

function cellsOf(rowHtml) {
  return [...rowHtml.matchAll(/<t([hd])([^>]*)>([\s\S]*?)<\/t\1>/g)].map((m) => ({ kind: m[1], attrs: m[2], html: m[3] }));
}

const MASC = ["1s", "2ms", "3ms", "1d", "2d", "3md", "1p", "2mp", "3mp"];
const FEM = ["2fs", "3fs", "3fd", "2fp", "3fp"];
const FEM_IMPERATIVE = ["2fs", "2fp"]; // the imperative has no third person

function personsFrom(mascCells, femCells, imperative = false) {
  const fem = imperative ? FEM_IMPERATIVE : FEM;
  const out = {};
  mascCells.forEach((c, i) => { const v = arabicOf(c.html); if (v && MASC[i]) out[MASC[i]] = v; });
  femCells.forEach((c, i) => { const v = arabicOf(c.html); if (v && fem[i]) out[fem[i]] = v; });
  if (out["1d"]) delete out["1d"]; // "we" is the same word in the dual and plural columns
  return out;
}

export function parseConjHtml(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => cellsOf(m[1]));
  const text = (c) => decode(stripTags(c.html)).replace(/\s+/g, " ").trim().toLowerCase();
  const result = { past: null, present: null, subjunctive: null, jussive: null, imperative: null, masdar: null, activeParticiple: null, passiveParticiple: null };

  let passive = false;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.length) continue;
    const head = text(r[0]);
    if (r[0].kind === "h" && head.startsWith("passive voice")) passive = true;

    const single = (key) => {
      const d = r.find((c) => c.kind === "d");
      if (d && !result[key]) result[key] = arabicOf(d.html)?.split(" / ") ?? null;
    };
    if (head.startsWith("verbal noun")) single("masdar");
    else if (head.startsWith("active participle")) single("activeParticiple");
    else if (head.startsWith("passive participle")) single("passiveParticiple");

    if (passive || r[0].kind !== "h") continue;
    const key = head.startsWith("past indicative") ? "past" : head.startsWith("non-past indicative") ? "present" : head.startsWith("non-past subjunctive") ? "subjunctive" : head.startsWith("non-past jussive") ? "jussive" : head.startsWith("imperative") ? "imperative" : null;
    if (!key || result[key]) continue;
    // masculine row: [tense th, "m" th, ...9 td]; feminine row: ["f" th, ...5 td]
    const masc = r.filter((c) => c.kind === "d");
    const next = rows[i + 1] ?? [];
    const fem = next.filter((c) => c.kind === "d");
    result[key] = personsFrom(masc, fem, key === "imperative");
  }
  return result;
}

export async function renderConj(title, args) {
  const f = path.join(CACHE, "conj", fileKey(`${title}||${args}`) + ".json");
  if (fs.existsSync(f)) {
    const cached = JSON.parse(fs.readFileSync(f, "utf8"));
    if (cached?.past && cached.subjunctive) return cached;
    fs.unlinkSync(f); // stale: empty, or from before the subjunctive and jussive were kept
  }
  const params = new URLSearchParams({
    action: "parse", format: "json", formatversion: "2", prop: "text", contentmodel: "wikitext",
    disablelimitreport: "1", title, text: `{{ar-conj|${args}}}`,
  });
  const { status, text } = await politeFetch(`https://en.wiktionary.org/w/api.php?${params}`);
  if (status !== 200) return undefined;
  let html;
  try { html = JSON.parse(text).parse?.text; } catch { return undefined; }
  if (!html) return null;
  const parsed = parseConjHtml(html);
  if (!parsed.past) return null; // an empty or error render is never cached
  fs.writeFileSync(f, JSON.stringify(parsed));
  return parsed;
}

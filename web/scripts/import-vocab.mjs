// Vocabulary import.
//
//   node scripts/import-vocab.mjs inspect [outDir]   parse, report, write enrichment inputs
//   node scripts/import-vocab.mjs build              merge enrichment -> src/data/words.json + review CSV
//
// Source:      data/source/arabic-vocab.txt
// Enrichment:  data/enrichment.json  (root, pos, gender, form, cleaned English; from the review pass)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseSource, buildEntries, dedupe, assignIds, bare, hasMarks, isArabicText,
} from "./lib/vocab-parse.mjs";
import { getForms } from "../src/lib/morphology.js";
import { stripDiacritics, rootKey } from "../src/lib/arabic.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(root, "data/source/arabic-vocab.txt");

export function load() {
  const { rows, problems } = parseSource(fs.readFileSync(SOURCE, "utf8"));
  const all = buildEntries(rows);
  const { kept, dropped } = dedupe(all);
  assignIds(kept);
  return { entries: kept, dropped, problems, total: rows.length };
}

// ---------- build ----------

const POS = new Set(["noun", "verb", "adjective", "adverb", "particle", "pronoun", "phrase", "suffix"]);
const PREP_DISPLAY = { الى: "إلى", عن: "عن", على: "على", من: "مِن", في: "في", ب: "بِـ", ل: "لِـ", مع: "مع", ك: "كَـ", حتى: "حتّى" };
const VOWEL_OF = { "َ": "a", "ِ": "i", "ُ": "u" };

// "الدَّعوة" -> "دَعوة": drop the article (and the shadda it caused on a sun letter).
function stripArticle(s) {
  if (!s) return s;
  const m = s.match(/^ال[ً-ْ]*(.+)$/u);
  if (!m || bare(m[1]).length < 2) return s;
  return m[1].replace(/^(.)ّ/u, "$1").replace(/^(.[ً-ِ])ّ/u, "$1");
}

const joinList = (a) => (a && a.length ? a.join(" / ") : null);
const showPreps = (a) => [...new Set((a ?? []).map((p) => PREP_DISPLAY[p] ?? p))];

function dialectObject(p) {
  if (!p) return null;
  const o = {};
  if (p.head) o.arabic = p.head;
  if (p.present && p.present !== p.head) o.present = p.present;
  if (p.past && p.past !== p.head) o.past = p.past;
  if (p.masdar) o.masdar = stripArticle(p.masdar);
  if (p.plural?.length) o.plural = joinList(p.plural);
  if (p.feminine) o.feminine = p.feminine;
  if (p.prepositions?.length) o.prepositions = showPreps(p.prepositions);
  if (p.alternates?.length) o.alternates = p.alternates;
  if (p.notes?.length) o.notes = p.notes;
  if (p.example) o.example = p.example;
  return Object.keys(o).length ? o : null;
}

// Letters of a voweled word as [{ch, marks}].
function letterMarks(s) {
  const out = [];
  for (const ch of s.normalize("NFC")) {
    if (/[ً-ْ]/.test(ch)) { if (out.length) out.at(-1).marks += ch; }
    else if (/[ء-ي]/.test(ch)) out.push({ ch, marks: "" });
  }
  return out;
}

// Form I vowels from the voweled past ("كَتَبَ") and present ("يَكتُب") forms.
function formIVowels(past, present) {
  const out = {};
  if (past) {
    const L = letterMarks(past);
    if (L.length === 3) { const m = [...L[1].marks].filter((c) => VOWEL_OF[c]); if (m.length === 1) out.pastVowel = VOWEL_OF[m[0]]; }
  }
  if (present) {
    const L = letterMarks(present);
    if (L.length === 4) { const m = [...L[2].marks].filter((c) => VOWEL_OF[c]); if (m.length === 1) out.presentVowel = VOWEL_OF[m[0]]; }
  }
  return out;
}

const looseKey = (s) => stripDiacritics(s).replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي");
// For comparing generated vs. listed forms: ignore sukun and the final case vowel.
const shape = (s) => s.normalize("NFC").replace(/ْ/g, "").replace(/[َُِ]$/u, "");

// ---------- "= <Arabic word>" glosses ----------
// Some rows have no English, only "= جريدة" (same as a word the student knows).
// Use the English of that word from elsewhere in the list.

const noArticle = (s) => bare(s).replace(/^ال(?=.{2})/, "");

function buildReferenceIndex(entries) {
  const index = new Map(); // key -> entries (source order)
  const add = (key, e) => { if (key && key.length > 1) index.set(key, [...(index.get(key) ?? []), e]); };
  for (const e of entries) {
    if (!e.en || /[؀-ۿ=*]/.test(e.en)) continue; // only rows with a real English gloss
    const m = e.msa;
    if (!m) continue;
    for (const tok of [m.head, m.past, m.present, ...(m.alternates ?? [])]) {
      if (!tok) continue;
      const first = tok.split(" ")[0];
      add(noArticle(first), e);
      add(noArticle(first).replace(/^ي(?=.{2})/, ""), e); // present-tense heads: يَتَكَلَّم -> تكلم
    }
  }
  return index;
}

const IRREGULAR_3RD = { has: "have", does: "do", goes: "go", is: "be" };
const thirdToBase = (w) =>
  IRREGULAR_3RD[w] ?? (/(ch|sh|ss|x|z)es$/.test(w) ? w.slice(0, -2) : /[^aeiou]ies$/.test(w) ? w.slice(0, -3) + "y" : /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w);

// "he obtains, acquires (a job)" -> "to obtain, acquire (a job)"
function toInfinitive(en) {
  const m = en.match(/^(?:he|she|it) (.*)$/i);
  if (!m) return en;
  const parts = m[1].split(/,\s*/).map((p, i) => {
    const [first, ...rest] = p.split(" ");
    return [thirdToBase(first.toLowerCase()), ...rest].join(" ");
  });
  return `to ${parts.join(", ")}`;
}

function referencedEnglish(e, index) {
  const latin = e.en.replace(/[؀-ۿ]/g, "").replace(/[^A-Za-z]/g, "");
  if (latin.length >= 2 || !/[؀-ۿ]/.test(e.en)) return null; // already has English, or nothing to look up
  const refs = (e.en.match(/[؀-ۿ][؀-ۿ\sً-ْ]*/g) ?? []).flatMap((s) => s.split(/[،,]/)).map((s) => s.trim()).filter(Boolean);
  for (const r of refs) {
    const words = r.split(/\s+/);
    const last = words.length > 1 ? words.at(-1) : null;
    const lastIsPrep = last && Object.hasOwn(PREP_DISPLAY, normPrepWord(last));
    // multi-word references match as a whole phrase; "X + preposition" may also match X by its preposition
    const keys = [noArticle(words.join(" "))];
    if (words.length === 1 || (words.length === 2 && lastIsPrep)) keys.push(noArticle(words[0]));
    for (const key of keys) {
      const hits = (index.get(key) ?? []).filter((h) => h.id !== e.id);
      if (!hits.length) continue;
      const withPrep = lastIsPrep ? hits.find((h) => (h.msa?.prepositions ?? []).includes(normPrepWord(last))) : null;
      const hit = withPrep ?? hits[0];
      return { english: toInfinitive(hit.en), ref: r, from: hit.id };
    }
  }
  return null;
}

const normPrepWord = (w) => stripDiacritics(w).replace(/ـ/g, "").replace(/[أإآ]/g, "ا");

// House style (matches the book and the generator): no fatha before a long alef.
const plainAlef = (s) => (typeof s === "string" ? s.replace(/َا/g, "ا") : s);
const mapValues = (o, f) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v)]));
const spaced = (r) => [...r].join(" ");

// Stored conjugations looked up on Wiktionary (scripts/fetch-conjugations.mjs).
function applyConjugations(w, c, flags) {
  if (!c || c.match === "none") return;
  w.conjugations = Object.fromEntries(["past", "present", "imperative"].filter((k) => c[k]).map((k) => [k, mapValues(c[k], plainAlef)]));
  if (c.activeParticiple?.length) w.activeParticiple = plainAlef(c.activeParticiple.join(" / "));
  if (c.passiveParticiple?.length) w.passiveParticiple = plainAlef(c.passiveParticiple.join(" / "));
  if (!w.masdar && c.masdar?.length) w.masdar = c.masdar.map(plainAlef); // Form I verbal nouns the list did not give
  if (c.match === "partial") flags.push("conjugation-matches-listed-form-only-partly");
  // The table matches the listed forms but is filed under another root. A difference only in a weak
  // letter (و vs ي) is a matter of convention, so keep ours and flag it; anything else is corrected.
  if (c.match === "exact" && c.root && w.root && rootKey(w.root) !== rootKey(c.root)) {
    const weakless = (r) => rootKey(r).replace(/و/g, "ي");
    if (weakless(w.root) === weakless(c.root)) flags.push(`root-differs-from-conjugation-source:${spaced(c.root)}`);
    else { flags.push(`root-corrected-from-conjugation:${w.root}->${spaced(c.root)}`); w.root = spaced(c.root); }
  }
}

// Wiktionary's roots for the entry (scripts/verify-roots.mjs).
function applyRootCheck(w, rc, flags) {
  if (!rc || !w.root) return;
  if (rc.status === "confirmed") {
    const i = flags.indexOf("root-uncertain");
    if (i >= 0) flags.splice(i, 1);
  } else if (rc.status === "differs") {
    // Never auto-applied: Wiktionary often files a word under a different but valid root
    // (حياة: ح ي ي / ح و ي), or lists only one of several entries on the page.
    flags.push(`root-differs-from-wiktionary:${rc.roots.join("/")}`);
  }
}

// Roots decided by hand after looking them up (data/root-decisions.json).
function applyRootDecision(w, d, flags) {
  if (!d) return;
  const i = flags.indexOf("root-uncertain");
  if (i >= 0) flags.splice(i, 1);
  for (let j = flags.length - 1; j >= 0; j--) if (flags[j].startsWith("root-differs-from-wiktionary")) flags.splice(j, 1);
  if ((w.root ?? null) !== d.root) flags.push(`root-decided:${w.root ?? "none"}->${d.root ?? "none"}`);
  w.root = d.root;
}

function buildWord(e, en, overrides, refIndex, conj, rootCheck, rootDecisions) {
  const flags = [...e.flags, ...(en.flags ?? [])];
  const msa = e.msa;
  const fromRef = refIndex ? referencedEnglish(e, refIndex) : null;
  if (fromRef) flags.push(`english-from-referenced-word:${fromRef.ref}->${fromRef.from}`);
  const isVerb = en.pos === "verb";
  const w = {
    id: e.id,
    book: e.book,
    unit: e.unit,
    part: e.part ?? null,
    arabic: msa?.head || null,
    definition: fromRef?.english ?? (en.english || e.en),
    transliteration: null,
    root: e.book === 1 ? null : en.root,
    pos: POS.has(en.pos) ? en.pos : "phrase",
    form: isVerb && e.book !== 1 ? en.form : null,
    gender: en.pos === "noun" ? en.gender : null,
    plural: joinList(msa?.plural),
    feminine: msa?.feminine ?? null,
    alternates: msa?.alternates?.length ? msa.alternates : null,
    masdar: msa?.masdar ? stripArticle(msa.masdar) : null,
    prepositions: showPreps(msa?.prepositions),
    notes: [msa?.notes?.length ? msa.notes.join("؛ ") : "", fromRef ? `Listed in the source as = ${fromRef.ref}` : ""].filter(Boolean).join("؛ "),
    example: msa?.example ?? null,
    conjugations: null,
    egyptian: dialectObject(e.egyptian),
    shami: dialectObject(e.shami),
  };
  if (!POS.has(en.pos)) flags.push(`unknown-pos:${en.pos}`);
  if (e.book === 1 && e.conjugatedRow) w.hideFromBook = 2; // Alif Baa form rows are for Alif Baa students only
  if (w.form === 1) {
    // Conjugated-form rows ("I study", "he writes") list only a present form: use it for the present vowel.
    const presentTok = msa?.present ?? (e.conjugatedRow ? msa?.head : null);
    Object.assign(w, formIVowels(e.conjugatedRow ? null : msa?.past, presentTok));
    if (e.conjugatedRow && w.presentVowel) flags.push("past-vowel-assumed");
  }
  if (w.arabic && !/[ً-ْ]/.test(w.arabic) && /[ء-ي]/.test(w.arabic)) flags.push("no-diacritics");
  applyConjugations(w, conj?.[e.id], flags);
  applyRootCheck(w, rootCheck?.[e.id], flags);
  applyRootDecision(w, rootDecisions?.[e.id], flags);
  Object.assign(w, overrides.patch?.[e.id] ?? {});
  for (const k of Object.keys(w)) if (w[k] === null || w[k] === undefined || (Array.isArray(w[k]) && !w[k].length)) {
    if (!["arabic", "root", "form", "gender", "transliteration", "conjugations", "egyptian", "shami", "plural", "part"].includes(k)) delete w[k];
  }
  return { word: w, flags };
}

// Does the generator reproduce the listed past/present forms for regular roots?
function validateVerb(w, e, flags) {
  if (w.pos !== "verb" || !w.root || !w.form) return;
  if (w.conjugations) return; // stored from Wiktionary: already checked against the listed forms
  let f = getForms({ ...w, pos: "verb" });
  if (!f.regular) { flags.push(`irregular:${f.irregularReason}`); return; }
  if (e.conjugatedRow) return; // heads are single conjugated forms, not past/present 3ms
  if (w.form === 1 && !w.presentVowel) flags.push("form-I-needs-presentVowel");

  // If the listed past form isn't what this form produces, try the other forms.
  const listedPast = e.msa?.past;
  if (listedPast && f.past?.["3ms"] && looseKey(f.past["3ms"]) !== looseKey(listedPast)) {
    for (let k = 1; k <= 10; k++) {
      if (k === w.form) continue;
      const cand = getForms({ ...w, form: k, ...(k === 1 ? formIVowels(e.msa.past, e.msa.present) : {}), pos: "verb" });
      if (cand.regular && cand.past && looseKey(cand.past["3ms"]) === looseKey(listedPast)) {
        flags.push(`form-corrected:${w.form}->${k}`);
        w.form = k;
        if (k === 1) Object.assign(w, formIVowels(e.msa.past, e.msa.present));
        f = cand;
        break;
      }
    }
  }
  const check = (tense, listed) => {
    const got = f[tense]?.["3ms"];
    if (!got || !listed) return;
    if (looseKey(got) !== looseKey(listed)) flags.push(`generator-mismatch-${tense}:${stripDiacritics(listed)}!=${stripDiacritics(got)}`);
    else if (/[ً-ْ]/.test(listed) && shape(got) !== shape(listed)) flags.push(`diacritics-differ-${tense}`);
  };
  check("past", e.msa?.past);
  check("present", e.msa?.present);
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const cmd = process.argv[2];

if (cmd === "build") {
  const enrichment = JSON.parse(fs.readFileSync(path.join(root, "data/enrichment.json"), "utf8"));
  const overrides = JSON.parse(fs.readFileSync(path.join(root, "scripts/overrides.json"), "utf8"));
  const { entries } = load();
  const refIndex = buildReferenceIndex(entries);
  const readJson = (f) => (fs.existsSync(path.join(root, f)) ? JSON.parse(fs.readFileSync(path.join(root, f), "utf8")) : null);
  const conj = readJson("data/conjugations.json");
  const rootCheck = readJson("data/root-check.json");
  const rootDecisions = readJson("data/root-decisions.json");
  const words = [], review = [], skipped = [];
  let drift = 0;

  for (const e of entries) {
    const en = enrichment[e.id];
    if (!en) { review.push([e.id, e.book, e.unit, e.en, "", "no-enrichment"]); continue; }
    if (en._en !== e.en) { drift++; review.push([e.id, e.book, e.unit, e.en, "", `english-changed-since-review (${en._en})`]); }
    if (overrides.skip.includes(e.id)) { skipped.push(`${e.id} "${e.en}"`); continue; }
    const { word, flags } = buildWord(e, en, overrides, refIndex, conj, rootCheck, rootDecisions);
    if (!overrides.patch?.[e.id]) validateVerb(word, e, flags);
    words.push(word);
    if (flags.length) review.push([word.id, word.book, word.unit, word.definition, word.arabic ?? word.egyptian?.arabic ?? "", flags.join("; ")]);
  }

  fs.writeFileSync(path.join(root, "src/data/words.json"), JSON.stringify(words, null, 1) + "\n");
  const csv = ["id,book,unit,english,arabic,flags", ...review.map((r) => r.map(csvCell).join(","))].join("\n");
  fs.writeFileSync(path.join(root, "data/review.csv"), "﻿" + csv + "\n");

  const n = (f) => words.filter(f).length;
  console.log("words:", words.length, "| skipped:", skipped.length, skipped, "| drift:", drift);
  console.log("by book:", [1, 2, 3, 4].map((b) => `${b}:${n((w) => w.book === b)}`).join(" "));
  console.log("verbs:", n((w) => w.pos === "verb"), "| form I with vowels:", n((w) => w.form === 1 && w.presentVowel), "of", n((w) => w.form === 1));
  console.log("egyptian:", n((w) => w.egyptian), "| shami:", n((w) => w.shami), "| dialect-only:", n((w) => !w.arabic));
  console.log("hidden from book 2+:", n((w) => w.hideFromBook));
  const kinds = {};
  for (const r of review) for (const f of String(r[5]).split("; ")) { const k = f.split(":")[0].replace(/-(past|present)$/, ""); kinds[k] = (kinds[k] ?? 0) + 1; }
  console.log("review rows:", review.length, kinds);
}

if (cmd === "inspect") {
  const out = process.argv[3];
  const { entries, dropped, problems, total } = load();
  const n = (f) => entries.filter(f).length;
  console.log("rows:", total, "kept:", entries.length, "exact duplicates dropped:", dropped.length);
  console.log("problems:", problems);
  console.log("dropped:", dropped.map((d) => `${d.book}/${d.unit} "${d.en.slice(0, 28)}" (kept ${d.keptAt})`).join("\n  "));
  console.log("\nby book:", [1, 2, 3, 4].map((b) => `${b}:${n((e) => e.book === b)}`).join(" "));
  console.log("no MSA:", n((e) => !e.msaRaw), "| of which dialect present:", n((e) => !e.msaRaw && (e.egRaw || e.shRaw)));
  console.log("no Arabic anywhere:", entries.filter((e) => !e.msaRaw && !e.egRaw && !e.shRaw).map((e) => `${e.id} "${e.en}"`));
  console.log("blank English:", entries.filter((e) => !e.en).map((e) => `${e.id} ${e.msaRaw || e.egRaw}`));
  console.log("flags:", [...new Set(entries.flatMap((e) => e.flags))]);
  console.log("conjugated-form rows by book:", [1, 2, 3, 4].map((b) => `${b}:${n((e) => e.book === b && e.conjugatedRow)}`).join(" "));
  const bareMsa = entries.filter((e) => e.msaRaw && isArabicText(e.msaRaw) && !hasMarks(e.msaRaw));
  console.log("MSA without diacritics:", bareMsa.length);

  if (process.argv.includes("--sample")) {
    const want = process.argv.slice(process.argv.indexOf("--sample") + 1).map(Number);
    for (const e of entries.filter((x) => want.includes(x.src))) console.log(JSON.stringify({ src: e.src, en: e.en, msa: e.msa, egyptian: e.egyptian, shami: e.shami }, null, 1));
  }

  if (out) {
    fs.mkdirSync(out, { recursive: true });
    const compact = entries.map((e) => ({
      id: e.id, book: e.book, en: e.en, msa: e.msaRaw, egyptian: e.egRaw, shami: e.shRaw,
      verb: /^to\s/i.test(e.en), conj: e.conjugatedRow,
    }));
    const SIZE = 220;
    for (let i = 0; i * SIZE < compact.length; i++) {
      fs.writeFileSync(path.join(out, `input-${String(i + 1).padStart(2, "0")}.json`), JSON.stringify(compact.slice(i * SIZE, (i + 1) * SIZE)));
    }
    fs.writeFileSync(path.join(out, "all.json"), JSON.stringify(entries, null, 1));
    console.log("wrote", Math.ceil(compact.length / SIZE), "chunks to", out);
  }
}

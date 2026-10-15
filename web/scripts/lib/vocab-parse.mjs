// Parses data/source/arabic-vocab.txt (English|Egyptian|Shami|MSA rows) into
// structured entries. Pure functions; no file access except in parseSource's caller.

import { stripDiacritics } from "../../src/lib/arabic.js";

const BOOKS = { "Alif Baa": 1, "Al-Kitaab part 1": 2, "Al-Kitaab part 2": 3, "Al-Kitaab part 3": 4 };
const FATHA = "َ", DAMMA = "ُ", KASRA = "ِ";
const MARKS = /[ً-ْ]/g;

// ---------- text cleaning ----------

export function cleanText(s) {
  return String(s ?? "")
    .replace(/[​-‏‪-‮⁦-⁩﻿]/g, "")
    .replace(/ /g, " ")
    .replace(/(?<=[ء-ْ])ـ+/g, "") // decorative stretch inside words; a leading one marks a suffix and stays
    .replace(/\s*\/\s*(?=[ةـ])/g, "/") // "مِتْجَوِّز/ ة" -> "مِتْجَوِّز/ة"
    .replace(/ج\s+\./g, "ج.") // "ج . –ون" -> "ج. –ون"
    .replace(/\s+/g, " ")
    .trim();
}

// Handles CSV-style quoting and the HTML leftovers found in the export.
function cleanCell(raw, flags) {
  let c = String(raw ?? "").trim();
  const quotes = (c.match(/"/g) ?? []).length;
  if (quotes) {
    if (c.startsWith('"')) c = c.slice(1);
    if (c.endsWith('"') && !c.endsWith('""')) c = c.slice(0, -1);
    c = c.replace(/""/g, '"');
    if (/span style/.test(c)) {
      flags.push("html-leftover-removed");
      c = c.replace(/^.*?span[^>]*>/, "").replace(/^[^:]*:\s*/, ""); // drop the markup and its stray label
    }
    if (!/[A-Za-z]/.test(c)) c = c.replace(/"/g, "");
  }
  return cleanText(c);
}

// Letters only, for comparing words.
export const bare = (s) =>
  stripDiacritics(s).replace(/ـ/g, "").replace(/[أإآٱ]/g, "ا").replace(/\s+/g, " ").trim();

export const hasMarks = (s) => /[ً-ْ]/.test(s);
export const isArabicText = (s) => /[؀-ۿ]/.test(s);

// ---------- source file ----------

export function parseSource(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const rows = [];
  const problems = [];
  let book = null, unit = null, part = null, lastUnit = 0;

  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    if (BOOKS[t]) { book = BOOKS[t]; lastUnit = 0; return; }
    if (/^English\|Egyptian\|Shami\|MSA/.test(t)) {
      const m = t.match(/lesson (\d+)(?: part (\d+))?/);
      if (m) { unit = +m[1]; part = m[2] ? +m[2] : null; }
      else { unit = lastUnit + 1; part = 1; problems.push({ line: i + 1, what: `header without a lesson number; treated as lesson ${unit} part 1` }); }
      lastUnit = unit;
      return;
    }
    let cells = line.split("|");
    const flags = [];
    if (cells.length === 3) { cells = [cells[0], cells[1], "", cells[2]]; flags.push("missing-column-assumed-shami-blank"); problems.push({ line: i + 1, what: "row had 3 columns; assumed Shami blank" }); }
    if (cells.length !== 4) { problems.push({ line: i + 1, what: `row has ${cells.length} columns; skipped`, text: t.slice(0, 80) }); return; }
    const [en, eg, sh, msa] = cells.map((c) => cleanCell(c, flags));
    if (!en && !eg && !sh && !msa) return;
    rows.push({ src: i + 1, book, unit, part, en, eg, sh, msa, flags });
  });
  return { rows, problems };
}

// ---------- cell parsing ----------

const PREPS = new Set(["الى", "عن", "على", "من", "في", "ب", "ل", "مع", "ك", "حتى"]);
const normPrep = (w) => stripDiacritics(w).replace(/ـ/g, "").replace(/[أإآ]/g, "ا").replace(/[()]/g, "");
const isPrep = (w) => PREPS.has(normPrep(w));

// Third-person present starts with ي. Past forms never do in this word list.
const isPresentStart = (w) => /^ي/.test(w) && stripDiacritics(w).length > 2;

function splitWords(s) { return s.split(" ").filter(Boolean); }

// "X (+ noun)", "X (من)" -> { text, notes[], preps[] }
function takeParens(s) {
  const notes = [], preps = [];
  const text = s.replace(/\(([^)]*)\)/g, (_, inner) => {
    const t = inner.trim();
    if (!t) return " ";
    if (/^(مؤنث|مؤنّث|مذكر|مذكّر)/.test(bare(t))) return ` (${t}) `; // gender markers are handled separately
    const parts = t.split(/[\/،,]/).map((x) => x.trim());
    if (parts.every((x) => isPrep(x))) preps.push(...parts.map(bare));
    else notes.push(t);
    return " ";
  });
  return { text: text.replace(/\s+/g, " ").trim(), notes, preps };
}

// Words after the first one that are prepositions are mandatory prepositions.
const NEGATION = new Set(["لم", "لا", "ما", "لن", "ليس", "لست"]);

function headAndPreps(tok) {
  const words = splitWords(tok);
  if (!words.length) return { head: "", preps: [], rest: [] };
  // "لم أجِد": a negation particle stays with its verb as one headword.
  if (words.length > 1 && NEGATION.has(bare(words[0]))) return { head: tok, preps: [], rest: [] };
  const head = words[0];
  const preps = [], rest = [];
  for (const w of words.slice(1)) (isPrep(w) ? preps : rest).push(w);
  return { head, preps: preps.map(bare), rest };
}

// Plural text after "ج." resolved against the head word.
function resolvePlural(p, head) {
  const out = [];
  for (const piece of p.split(/[،,]/).map((x) => x.trim()).filter(Boolean)) {
    const sfx = piece.match(/^[-–ـ\s]*(ات|ون|ين)(?:\s*\/\s*[-–ـ\s]*(ات|ون|ين))?$/);
    if (sfx && head) {
      const base = head.replace(/ة[ً-ْ]*$/, "");
      const parts = [sfx[1], sfx[2]].filter(Boolean);
      for (const s of parts) out.push(s === "ات" ? `${base}ات` : `${head}${s}`);
    } else if (sfx) {
      out.push(piece); // no head to attach to
    } else {
      out.push(piece.replace(/^\(ال\)/, "").trim());
    }
  }
  return out;
}

// Feminine of a "m/f" token such as جاهِز/ة or مَصري/مَصرِيّة.
function splitFeminine(tok) {
  if (/\s/.test(tok) || !tok.includes("/")) return { masc: tok, fem: null, alts: [] };
  const [m, f, ...more] = tok.split("/");
  if (!f) return { masc: m, fem: null, alts: [] };
  if (/^ة[ً-ْ]*$/.test(f) || /^ـ?ة$/.test(f)) {
    const stem = m.replace(/[ً-ْ]+$/, "");
    return { masc: m, fem: `${stem}ة`, alts: more };
  }
  if (/ة[ً-ْ]*$/.test(f) && !/ة[ً-ْ]*$/.test(m)) return { masc: m, fem: f, alts: more };
  return { masc: m, fem: null, alts: [f, ...more] };
}

/**
 * Parse one Arabic cell.
 * verbLike: English is "to …" (cell lists past, present, verbal noun in order).
 * Returns null for an empty cell.
 */
export function parseCell(text, { verbLike = false } = {}) {
  const flags = [];
  if (!text) return null;
  let s = text;

  // suffix rows: "ـكَ- اِسمُكَ"
  const sfx = s.match(/^(ـ\S*)\s*[-–]\s*(.+)$/);
  if (sfx) return { head: sfx[1], example: sfx[2], past: null, present: null, masdar: null, plural: [], feminine: null, alternates: [], prepositions: [], notes: [], flags: ["suffix"] };

  s = s.replace(/\.{2,}|…/g, " ").replace(/\s+/g, " ").trim(); // "يُساعِد ... في" -> "يُساعِد في"
  const raw = s;
  const pi = s.search(/ج\.|ج\s?\./);
  let pluralText = "";
  if (/ج\./.test(s)) {
    const [before, ...after] = s.split(/\s*ج\.\s*/);
    s = before;
    pluralText = after.join("،").trim();
  }

  const pr = takeParens(s);
  s = pr.text;
  const notes = [...pr.notes];
  const prepositions = [...pr.preps];

  // explicit gender marker: "أَحمَر (مؤنّث) حَمراء"
  let feminine = null;
  const g = s.match(/^(.*?)\s*\((?:مؤنث|مؤنّث)\)\s*(.*)$/);
  if (g) { s = g[1].trim(); feminine = g[2].trim() || null; }

  // "أدنى + اسم في إضافة": the part after "+" is a grammar note, not part of the word.
  if (!verbLike) {
    const plus = s.indexOf(" + ");
    if (plus > 0) { notes.push(`+ ${s.slice(plus + 3).trim()}`); s = s.slice(0, plus); }
  }

  // "لم أجِد = ما وَجَدتُ": the part after "=" is an equivalent, kept as an alternate (never a verbal noun).
  const [mainPart, ...equivalents] = s.split(/\s=\s/);
  const tokens = mainPart.split(/[،,؛;]/).map((t) => t.trim()).filter(Boolean);
  const extraAlternates = equivalents.flatMap((q) => q.split(/[،,؛;]/)).map((t) => t.trim()).filter(Boolean);
  const res = { head: "", past: null, present: null, masdar: null, plural: [], feminine, alternates: [], prepositions, notes, example: null, flags, raw };
  if (!tokens.length) {
    if (pluralText) res.plural = resolvePlural(pluralText, "");
    return res;
  }

  if (verbLike) {
    const others = [];
    for (const tok of tokens) {
      const { head, preps, rest } = headAndPreps(tok);
      if (!head) continue;
      if (!res.past && !res.present && !isPresentStart(head)) { res.past = head; prepositions.push(...preps); if (rest.length) notes.push(rest.join(" ")); }
      else if (!res.present && isPresentStart(head)) { res.present = head; prepositions.push(...preps); if (rest.length) notes.push(rest.join(" ")); }
      else if (!res.masdar && (res.past || res.present)) { res.masdar = head; } // "الفَوْز بـ" -> the noun only
      else others.push(tok);
    }
    if (others.length) { res.alternates = others; flags.push("extra-verb-tokens"); }
    res.head = res.past ?? res.present ?? "";
  } else {
    const first = tokens[0];
    const words = splitWords(first);
    const rest = words.slice(1);
    // "مُتَخَصِّص/ـة في": a head word followed only by prepositions -> head + mandatory prepositions.
    // Anything else with several words is a phrase and stays whole.
    const headOnly = rest.length > 0 && rest.every(isPrep);
    const target = headOnly || words.length === 1 ? words[0] : first;
    const { masc, fem, alts } = splitFeminine(target);
    res.head = masc;
    if (headOnly) prepositions.push(...rest.map(bare));
    if (fem) res.feminine = res.feminine ?? fem;
    res.alternates = [...alts, ...tokens.slice(1)];
  }

  if (extraAlternates.length) res.alternates = [...(res.alternates ?? []), ...extraAlternates];
  if (pluralText) res.plural = resolvePlural(pluralText, res.head);
  void pi;
  res.prepositions = [...new Set(prepositions.filter(Boolean))];
  res.notes = [...new Set(notes.filter(Boolean))];
  return res;
}

// ---------- row classification ----------

const CONJ_START = /^(I|he|she|you(?: \((?:masc|fem)\.\))?|we|they)\s+([a-z']+)/i;
const NOT_VERB_SECOND = new Set(["have", "am", "don't", "wonder", "was", "are", "is"]);

export function isToVerb(en) { return /^to\s/i.test(en); }
export function isConjugatedRow(en) {
  const m = en.match(CONJ_START);
  return !!m && !NOT_VERB_SECOND.has(m[2].toLowerCase());
}

// ---------- entries ----------

export function buildEntries(rows) {
  const entries = [];
  for (const r of rows) {
    const conjugatedRow = isConjugatedRow(r.en);
    const verbLike = isToVerb(r.en) || conjugatedRow;
    const flags = [...r.flags];
    const msa = parseCell(r.msa, { verbLike });
    const egyptian = parseCell(r.eg, { verbLike });
    const shami = parseCell(r.sh, { verbLike });
    entries.push({
      src: r.src, book: r.book, unit: r.unit, part: r.part,
      en: r.en, msaRaw: r.msa, egRaw: r.eg, shRaw: r.sh,
      msa, egyptian, shami,
      conjugatedRow,
      flags,
    });
  }
  return entries;
}

// Same gloss and same MSA/dialect words => later repeat. Keeps the earliest.
export function dedupe(entries) {
  const seen = new Map();
  const kept = [], dropped = [];
  for (const e of entries) {
    const key = [e.en.toLowerCase(), bare(e.msaRaw), bare(e.egRaw), bare(e.shRaw)].join("|");
    if (!e.en && !e.msaRaw && !e.egRaw && !e.shRaw) continue;
    if (seen.has(key)) { dropped.push({ ...e, keptAt: seen.get(key) }); continue; }
    seen.set(key, `${e.book}/${e.unit} (line ${e.src})`);
    kept.push(e);
  }
  return { kept, dropped };
}

export function assignIds(entries) {
  const counters = new Map();
  for (const e of entries) {
    const k = `${e.book}-${e.unit}`;
    const n = (counters.get(k) ?? 0) + 1;
    counters.set(k, n);
    e.id = `b${e.book}-u${e.unit}-${String(n).padStart(3, "0")}`;
  }
  return entries;
}

export { FATHA, DAMMA, KASRA, MARKS };

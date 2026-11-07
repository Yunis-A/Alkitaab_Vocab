// What a student knows up to a unit, for checking crossword clues: every word of the list up to it, with its
// inflections (and nothing else). Used by crossword-prep.mjs and check-crossword-clues.mjs.

import { normalizeArabic, stripDiacritics } from "../../src/lib/arabic.js";
import { getForms } from "../../src/lib/morphology.js";

export const norm = (s) => normalizeArabic(stripDiacritics(String(s ?? "")));
export const tokens = (text) => (String(text ?? "").match(/[ء-يٱ]+/g) ?? []);

// No extra words are allowed: a clue may only use words the student has met in the list by that unit (و is in the list, Alif Baa lesson 3).
const FUNCTION_WORDS = [];

function wordTokens(w) {
  const out = [];
  const add = (s) => { for (const t of tokens(stripDiacritics(String(s ?? "")))) out.push(norm(t)); };
  add(w.arabic); add(w.plural); add(w.feminine); add(w.masdar); add(w.present);
  for (const p of w.prepositions ?? []) add(p);
  for (const d of ["egyptian", "shami"]) if (w[d]) { add(w[d].arabic); add(w[d].plural); }
  if (w.pos === "verb" && w.arabic) {
    try {
      const f = getForms(w);
      for (const tense of ["past", "present", "imperative"]) if (f[tense]) Object.values(f[tense]).forEach(add);
      if (f.masdar) f.masdar.forEach(add);
      for (const p of [f.activeParticiple, f.passiveParticiple]) if (p) Object.values(p).forEach(add);
    } catch { /* irregular, not stored */ }
  }
  return out;
}

// { "b2-u1": Set of normalized tokens known at the end of that unit }
export function knownByUnit(words, units) {
  const sorted = [...words].sort((a, b) => a.book - b.book || a.unit - b.unit);
  const result = {};
  const known = new Set(FUNCTION_WORDS.map(norm));
  let i = 0;
  for (const u of units) {
    const [book, unit] = u.match(/\d+/g).map(Number);
    while (i < sorted.length && (sorted[i].book < book || (sorted[i].book === book && sorted[i].unit <= unit))) {
      for (const t of wordTokens(sorted[i])) known.add(t);
      i++;
    }
    result[u] = new Set(known);
  }
  return result;
}

const PREFIXES = ["وال", "فال", "بال", "كال", "ولل", "لل", "ال", "و", "ف", "ب", "ل", "ك", "س"];
const SUFFIXES = ["ها", "هم", "هن", "كم", "نا", "ات", "ون", "ين", "ان", "ه", "ك", "ي", "ة", "ا"];

// Is this token (after dropping a prefix and/or a suffix) a known word?
export function isKnown(token, known) {
  const t = norm(token);
  const tries = new Set([t]);
  for (const p of PREFIXES) if (t.startsWith(p) && t.length > p.length + 1) tries.add(t.slice(p.length));
  for (const base of [...tries]) for (const s of SUFFIXES) if (base.endsWith(s) && base.length > s.length + 1) tries.add(base.slice(0, -s.length));
  return [...tries].some((x) => known.has(x) || known.has(x + "ة") || known.has(x.replace(/^ا/, "")));
}

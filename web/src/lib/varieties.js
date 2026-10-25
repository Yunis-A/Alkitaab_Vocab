// A word can be learned in several "varieties": its MSA form, plus an
// Egyptian and/or Shami form when the list gives one. Each variety is its own
// flashcard. Dialect varieties only exist for dialects the student turned on.
//
// Word shape:  word.arabic            MSA headword (null for dialect-only rows)
//              word.egyptian / .shami { arabic, present, masdar, plural, feminine,
//                                       prepositions, notes } or null

import { levelReached } from "../config/books.js";
import { stripDiacritics } from "./arabic.js";

export const MSA = "ar-en";
export const DIALECTS = ["egyptian", "shami"];
export const DIALECT_VARIETY = { egyptian: "egy", shami: "shm" };
export const VARIETY_IDS = [MSA, ...Object.values(DIALECT_VARIETY)];

const VARIETY_DIALECT = Object.fromEntries(Object.entries(DIALECT_VARIETY).map(([d, v]) => [v, d]));

export function dialectOf(variety) {
  return VARIETY_DIALECT[variety] ?? null;
}

// Varieties of this word the student can study right now.
export function activeVarieties(word, dialects = {}) {
  const out = [];
  if (word.arabic) out.push(MSA);
  for (const d of DIALECTS) if (dialects[d] && word[d]?.arabic) out.push(DIALECT_VARIETY[d]);
  return out;
}

export function isWordAvailable(word, dialects) {
  return activeVarieties(word, dialects).length > 0;
}

// letters only; every hamza spelling counts as the same (مَليء / مَليئة)
const bareLetters = (s) => stripDiacritics(s).replace(/ـ/g, "").replace(/[أإؤئ]/g, "ء");

// "/ة" when the feminine is the masculine plus ة (جاهِز/ة), otherwise the whole feminine (أَحمَر/حَمراء).
export function feminineSuffix(base, feminine) {
  return bareLetters(feminine) === bareLetters(base) + "ة" ? "ة" : feminine;
}

// The MSA title of a word: the word, "/ة" (or the feminine) when it has one, and the preposition(s) it needs:
// جاهِز/ة, بَعيد/ة عَن, تَعَرَّفَ على. Forms the list only introduces later (formsFrom) wait for that lesson.
export function displayArabic(word, level) {
  if (!word.arabic) return "";
  let s = word.arabic;
  const formsShown = !word.formsFrom || (level && levelReached(level, word.formsFrom));
  if (word.feminine && formsShown) s += `/${feminineSuffix(word.arabic, word.feminine)}`;
  if (word.prepositions?.length) s += ` ${word.prepositions.join(" / ")}`;
  return s;
}

// The Arabic text shown on the front of a card for this variety.
export function varietyText(word, variety, level) {
  const d = dialectOf(variety);
  return d ? word[d]?.arabic ?? "" : displayArabic(word, level);
}

// What to show as the word's title: MSA, else the first enabled dialect form.
export function headword(word, dialects = {}, level) {
  if (word.arabic) return displayArabic(word, level);
  for (const d of DIALECTS) if (dialects[d] && word[d]?.arabic) return word[d].arabic;
  return "";
}

export function parseCardKey(key) {
  const i = key.lastIndexOf("|");
  return { wordId: key.slice(0, i), variety: key.slice(i + 1) };
}

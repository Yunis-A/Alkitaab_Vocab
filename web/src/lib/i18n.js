// Decides, per UI string, whether to show English or Arabic, and whether the
// layout should be RTL. Pure functions so they are easy to test.

import { levelReached, RTL_LEVEL, RTL_ARABIC_RATIO, UI_LEARNED_BOX } from "../config/books.js";
import { normalizeArabic } from "./arabic.js";
import { wordBox } from "./leitner.js";

// Normalized Arabic of every word, and of those the student has learned.
export function vocabSets(words, cards) {
  const known = new Set();
  const learned = new Set();
  for (const w of words) {
    const n = normalizeArabic(w.arabic);
    known.add(n);
    if (wordBox(cards, w.id) >= UI_LEARNED_BOX) learned.add(n);
  }
  return { known, learned };
}

export function isArabic(entry, level, vocab) {
  if (!levelReached(level, entry.unlock)) return false;
  return (entry.needs ?? []).every((raw) => {
    const n = normalizeArabic(raw);
    return !vocab.known.has(n) || vocab.learned.has(n);
  });
}

export function arabicRatio(table, level, vocab) {
  const entries = Object.values(table);
  if (!entries.length) return 0;
  return entries.filter((e) => isArabic(e, level, vocab)).length / entries.length;
}

export function isRtl(level, ratio) {
  return levelReached(level, RTL_LEVEL) || ratio >= RTL_ARABIC_RATIO;
}

// Returns the string (calling it if it is a function) in the right language.
export function translate(table, key, level, vocab, ...args) {
  const entry = table[key];
  if (!entry) return key;
  const v = isArabic(entry, level, vocab) ? entry.ar : entry.en;
  return typeof v === "function" ? v(...args) : v;
}

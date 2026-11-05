// The preposition trainer: for a verb, pick every preposition it takes. The choices are the prepositions
// stored in the word list.

import { stripDiacritics } from "./arabic.js";

// بِـ and بِ and ب are one preposition
export const prepKey = (p) => stripDiacritics(p).replace(/ـ/g, "").trim();

// Verbs worth asking about: MSA verbs that have at least one stored preposition.
export const prepositionVerbs = (words) => words.filter((w) => w.pos === "verb" && w.arabic && w.prepositions?.length);

// Every stored preposition as { key, text }, most common first. `text` is the fullest spelling seen.
export function allPrepositions(words) {
  const seen = new Map();
  for (const w of words) {
    for (const p of w.prepositions ?? []) {
      const key = prepKey(p);
      const e = seen.get(key) ?? { key, text: p, count: 0 };
      e.count += 1;
      if (p.length > e.text.length) e.text = p;
      seen.set(key, e);
    }
  }
  return [...seen.values()].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)).map(({ key, text }) => ({ key, text }));
}

// How a selection did: `right` chosen and correct, `wrong` chosen but not taken, `missed` taken but not chosen.
export function gradePrepositions(selected, word) {
  const taken = new Set(word.prepositions.map(prepKey));
  const right = [...selected].filter((k) => taken.has(k));
  const wrong = [...selected].filter((k) => !taken.has(k));
  const missed = [...taken].filter((k) => !selected.has(k));
  return { right, wrong, missed, perfect: wrong.length === 0 && missed.length === 0 };
}

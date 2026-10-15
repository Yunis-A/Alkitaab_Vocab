// A word can be learned in several "varieties": its MSA form, plus an
// Egyptian and/or Shami form when the list gives one. Each variety is its own
// flashcard. Dialect varieties only exist for dialects the student turned on.
//
// Word shape:  word.arabic            MSA headword (null for dialect-only rows)
//              word.egyptian / .shami { arabic, present, masdar, plural, feminine,
//                                       prepositions, notes } or null

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

// The Arabic text shown on the front of a card for this variety.
export function varietyText(word, variety) {
  const d = dialectOf(variety);
  return d ? word[d]?.arabic ?? "" : word.arabic ?? "";
}

// What to show as the word's title: MSA, else the first enabled dialect form.
export function headword(word, dialects = {}) {
  if (word.arabic) return word.arabic;
  for (const d of DIALECTS) if (dialects[d] && word[d]?.arabic) return word[d].arabic;
  return "";
}

export function parseCardKey(key) {
  const i = key.lastIndexOf("|");
  return { wordId: key.slice(0, i), variety: key.slice(i + 1) };
}

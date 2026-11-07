// What quick study and matching practise: one item per (word, variety), so the formal word and its
// Egyptian / Shami forms are separate cards when several are chosen.

import { levelKey } from "./filters.js";
import { activeVarieties } from "./varieties.js";
import { cardKey } from "./leitner.js";

export { cardKey };

// opts: { units: Set<"book.unit">, extra: Set<word id> (own words, whatever their lesson), lists: Set<1|2>, varieties: Set<"ar-en"|"egy"|"shm"> }
// Words without a list (part) are kept whichever lists are ticked. Returns [{ id, wordId, variety }].
export function buildItems(words, dialects, { units, lists, varieties, extra = null }) {
  const out = [];
  for (const w of words) {
    if (!units.has(levelKey(w)) && !extra?.has(w.id)) continue; // `extra`: the student's own words
    if (w.part != null && !lists.has(w.part)) continue;
    for (const v of activeVarieties(w, dialects)) {
      if (varieties.has(v)) out.push({ id: cardKey(w.id, v), wordId: w.id, variety: v });
    }
  }
  return out;
}

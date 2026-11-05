// The three moods of the present tense: marfūʿ (مرفوع), manṣūb (منصوب) and majzūm (مجزوم). The word list's
// present is written without a case ending; the conjugation game asks for the moods once the student has
// learned them. Irregular verbs have all three stored (from Wiktionary); regular ones are derived.

import { levelReached } from "../config/books.js";
import { getForms, PAST_PERSONS } from "./morphology.js";
import { presentAnswers } from "./chart.js";

export const MOODS = ["marfu", "mansub", "majzum"];
export const MOOD_LABELS = { marfu: "مرفوع", mansub: "منصوب", majzum: "مجزوم" }; // always written in Arabic

// Where each mood is learned (Al-Kitaab part 1, lessons 9, 10 and 13). Before a mood is learned the present is
// asked plain, and any of the moods, or no ending at all, is accepted.
export const MOOD_FROM = {
  marfu: { book: 2, unit: 9 },
  mansub: { book: 2, unit: 10 },
  majzum: { book: 2, unit: 13 },
};
export const learnedMoods = (level) => MOODS.filter((m) => levelReached(level, MOOD_FROM[m]));

// The persons whose form ends in a ن that drops in the manṣūb and majzūm.
const NOON_DROPPERS = new Set(["2fs", "2mp", "3mp", "2d", "3md", "3fd"]);

// A regular verb's present in each mood, from its marfūʿ chart (the generator's present, with its case endings).
function derive(present) {
  const marfu = {};
  const mansub = {};
  const majzum = {};
  for (const p of PAST_PERSONS) {
    const f = present[p];
    if (!f) continue;
    marfu[p] = f;
    if (NOON_DROPPERS.has(p)) {
      const dropped = presentAnswers(p, f).at(-1);
      mansub[p] = dropped;
      majzum[p] = dropped;
    } else if (f.endsWith("ُ")) {
      mansub[p] = `${f.slice(0, -1)}َ`;
      majzum[p] = `${f.slice(0, -1)}ْ`;
    } else {
      mansub[p] = f; // the feminine plural (يَفعَلْنَ) is the same in every mood
      majzum[p] = f;
    }
  }
  return { marfu, mansub, majzum };
}

// { marfu, mansub, majzum } -> { person: form } for a verb, or null when the moods are not known (an irregular
// verb without stored ones). A form may list variants ("a / b").
export function moodCharts(word) {
  const c = word.conjugations;
  if (c?.present && c.subjunctive && c.jussive) return { marfu: c.present, mansub: c.subjunctive, majzum: c.jussive };
  const f = getForms(word);
  if (!c && f.regular && f.present) return derive(f.present);
  return null;
}

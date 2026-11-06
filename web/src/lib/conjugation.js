// The conjugation game: given a verb's root (and its form, when the root has several), type the verb for a
// pronoun in the past or the present, or its verbal noun. Charts come from the morphology generator, or are
// stored for irregular verbs. Vowel marks are required.

import { levelReached } from "../config/books.js";
import { canon, hasStackedMarks, withArticle } from "./patterns.js";
import { stripDiacritics } from "./arabic.js";
import { getForms, PAST_PERSONS } from "./morphology.js";
import { presentAnswers } from "./chart.js";
import { MOODS, MOOD_FROM, learnedMoods, moodCharts } from "./moods.js";

export { presentAnswers, MOODS, MOOD_FROM, learnedMoods };

export const TENSES = ["past", "present", "masdar"];

// Where each tense is learned (Al-Kitaab part 1): the present at lesson 4, the verbal noun at lesson 6, the past
// at lesson 8.
export const TENSE_FROM = { present: { book: 2, unit: 4 }, masdar: { book: 2, unit: 6 }, past: { book: 2, unit: 8 } };
export const tensesAt = (level) => TENSES.filter((t) => levelReached(level, TENSE_FROM[t]));

// Where each pronoun is learned: أنا at Alif Baa 1, أنتَ and أنتِ at 2, هو and هي at 4; you all, they (m.) and we
// at part 1 lesson 2; the duals at part 2 lesson 5; the feminine plurals at part 2 lesson 7. (The labels turn
// Arabic there too: see "person.*" in the UI strings.)
const PERSON_FROM = {
  "1s": { book: 1, unit: 1 },
  "2ms": { book: 1, unit: 2 },
  "2fs": { book: 1, unit: 2 },
  "3ms": { book: 1, unit: 4 },
  "3fs": { book: 1, unit: 4 },
  "2mp": { book: 2, unit: 2 },
  "3mp": { book: 2, unit: 2 },
  "1p": { book: 2, unit: 2 },
  "2d": { book: 3, unit: 5 },
  "3md": { book: 3, unit: 5 },
  "3fd": { book: 3, unit: 5 },
  "2fp": { book: 3, unit: 7 },
  "3fp": { book: 3, unit: 7 },
};
export const personFrom = (person) => PERSON_FROM[person];
export const learnedPersons = (level) => PAST_PERSONS.filter((p) => levelReached(level, personFrom(p)));

// Every question the chosen verbs, tenses and pronouns allow. `verbs` are word entries; `tenses` and `persons`
// are Sets. With `moods` (a Set of the moods learned and ticked) the present is asked in each of them
// (مرفوع, منصوب, مجزوم) and written with its ending. With `moods: null`, before any mood is learned, the present
// is asked plain and any mood, or no ending at all, is accepted (`accept` lists them).
// Each item: { id, word, tense, mood (present only, with moods), person (null for the verbal noun), answers, accept? }.
export function conjugationItems(verbs, { tenses, persons, moods = null }) {
  const out = [];
  for (const word of verbs) {
    if (!word.root) continue;
    const forms = getForms(word);
    if (!forms.isVerb) continue;
    if (moods && tenses.has("present")) {
      const charts = moodCharts(word);
      for (const mood of MOODS.filter((m) => moods.has(m) && charts?.[m])) {
        for (const person of PAST_PERSONS) {
          const form = charts[mood][person];
          if (!persons.has(person) || !form) continue;
          out.push({ id: `${word.id}|present|${mood}|${person}`, word, tense: "present", mood, person, answers: form.split(" / ") });
        }
      }
    }
    for (const tense of ["past", "present"]) {
      if (!tenses.has(tense) || !forms[tense]) continue;
      if (tense === "present" && moods) continue; // asked by mood above
      for (const person of PAST_PERSONS) {
        const form = forms[tense][person];
        if (!persons.has(person) || !form) continue;
        out.push({
          id: `${word.id}|${tense}|${person}`, word, tense, person,
          answers: tense === "present" ? presentAnswers(person, form) : [form],
          ...(tense === "present" ? { accept: anyMood(word, person, presentAnswers(person, form)) } : {}),
        });
      }
    }
    if (tenses.has("masdar") && forms.masdar?.length) {
      out.push({ id: `${word.id}|masdar`, word, tense: "masdar", person: null, answers: forms.masdar });
    }
  }
  return out;
}

// Every form the plain present may be given with: no ending, or the ending of any of the three moods.
function anyMood(word, person, plain) {
  const charts = moodCharts(word);
  const more = charts ? MOODS.flatMap((m) => (charts[m]?.[person] ?? "").split(" / ").filter(Boolean)) : [];
  return [...plain, ...more];
}

// Is the root alone enough to know which verb is meant? The form number is shown when the same root has verbs
// of another form in the list.
export const needsForm = (word, allVerbs) => allVerbs.some((v) => v !== word && v.root === word.root && v.form !== word.form);

// Is `typed` right? Vowel marks must be right (a stray fatha before alif, a sukun or the other alif spellings
// of canon() are forgiven, two vowels on one letter are not). The present's case ending is forgiven; the verbal
// noun is accepted with or without ال.
//
// With `marks: false` the vowel marks are left out of the comparison altogether: only the letters count (the
// moods then differ only where a letter does, as in the noon of تَدرُسينَ / تَدرُسي).
export function isConjugationCorrect(item, typed, { marks = true } = {}) {
  if (!marks) return isLettersCorrect(item, typed);
  if (hasStackedMarks(typed)) return false;
  let t = canon(typed);
  if (!t) return false;
  if (item.tense === "present" && !item.mood) t = t.replace(/ُ$/, ""); // (with a mood, the ending is the answer)
  if (item.tense === "masdar") {
    return item.answers.some((a) => {
      const c = canon(a);
      return t === c || t === c.replace(/^ال/, "") || t === canon(withArticle(a));
    });
  }
  return (item.accept ?? item.answers).some((a) => t === canon(a));
}

// The letters alone, ignoring every vowel mark (and the shadda).
function isLettersCorrect(item, typed) {
  const t = stripDiacritics(typed).replace(/\s+/g, "");
  if (!t) return false;
  const letters = (a) => stripDiacritics(a).replace(/\s+/g, "");
  return (item.accept ?? item.answers).some((a) => {
    const l = letters(a);
    return t === l || (item.tense === "masdar" && (t === l.replace(/^ال/, "") || t === `ال${l}`));
  });
}

// The letter or mark a key press types (Shift: the shifted one), or null.
export function charFor(layout, code, shift) {
  if (code === "Space") return " ";
  for (const row of layout.rows) {
    for (const key of row) {
      if (key.code !== code) continue;
      return (shift ? key.sh : key.ch) ?? null;
    }
  }
  return null;
}

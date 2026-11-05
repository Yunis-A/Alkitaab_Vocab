// The conjugation game: given a verb's root (and its form, when the root has several), type the verb for a
// pronoun in the past or the present, or its verbal noun. Charts come from the morphology generator, or are
// stored for irregular verbs. Vowel marks are required.

import { levelReached } from "../config/books.js";
import { strings } from "../i18n/strings.js";
import { canon, hasStackedMarks, withArticle } from "./patterns.js";
import { getForms, PAST_PERSONS } from "./morphology.js";
import { presentAnswers } from "./chart.js";
import { MOODS, MOODS_FROM, moodCharts } from "./moods.js";

export { presentAnswers, MOODS, MOODS_FROM };

export const TENSES = ["past", "present", "masdar"];

// Where each pronoun is learned: the ones that are words of the list from that word's lesson (أنا, أنتَ, أنتِ,
// هو, هي), the rest from the lesson their label turns Arabic in (see "person.*" in the UI strings).
const FROM_LIST = {
  "1s": { book: 1, unit: 1 },
  "2ms": { book: 1, unit: 2 },
  "2fs": { book: 1, unit: 2 },
  "3ms": { book: 1, unit: 4 },
  "3fs": { book: 1, unit: 4 },
};
export const personFrom = (person) => FROM_LIST[person] ?? strings[`person.${person}`].unlock;
export const learnedPersons = (level) => PAST_PERSONS.filter((p) => levelReached(level, personFrom(p)));

// Every question the chosen verbs, tenses and pronouns allow. `verbs` are word entries; `tenses` and `persons`
// are Sets. With `moods` (a Set, once the student has learned them) the present is asked in each chosen mood
// (مرفوع, منصوب, مجزوم) and written with its ending; without, it is the plain present with no case ending.
// Each item: { id, word, tense, mood (present only, with moods), person (null for the verbal noun), answers }.
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
        });
      }
    }
    if (tenses.has("masdar") && forms.masdar?.length) {
      out.push({ id: `${word.id}|masdar`, word, tense: "masdar", person: null, answers: forms.masdar });
    }
  }
  return out;
}

// Is the root alone enough to know which verb is meant? The form number is shown when the same root has verbs
// of another form in the list.
export const needsForm = (word, allVerbs) => allVerbs.some((v) => v !== word && v.root === word.root && v.form !== word.form);

// Is `typed` right? Vowel marks must be right (a stray fatha before alif, a sukun or the other alif spellings
// of canon() are forgiven, two vowels on one letter are not). The present's case ending is forgiven; the verbal
// noun is accepted with or without ال.
export function isConjugationCorrect(item, typed) {
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
  return item.answers.some((a) => t === canon(a));
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

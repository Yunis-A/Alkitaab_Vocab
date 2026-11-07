// A student's own words: words from class that are not on their list yet. A word that is already on the course list
// but in a lesson they have not reached is not copied: it is unlocked early instead, so all its course data comes
// with it. Both are kept in the progress as { words: [own words], early: [ids of course words unlocked early] }.

import { compareLevel } from "../config/books.js";
import { stripDiacritics } from "./arabic.js";
import { search } from "./search.js";

export const emptyCustom = () => ({ words: [], early: [] });

export const POS_CHOICES = ["noun", "verb", "adjective", "adverb", "particle", "pronoun", "phrase"];
export const PREPOSITION_CHOICES = ["بِـ", "لِـ", "على", "عن", "إلى", "في", "مِن", "مع"];
export const VOWELS = ["a", "i", "u"];

// "كتب", "ك ت ب" or "كَتَبَ" -> "ك ت ب"; a hamza seat (أ إ ؤ ئ) is never a root letter, so it becomes ء.
export function normalizeRoot(input) {
  const letters = [...stripDiacritics(String(input ?? "")).replace(/[أإؤئ]/g, "ء")].filter((c) => /[ء-ي]/.test(c));
  return letters.join(" ");
}

// House style, as in the word list: no fatha before alif.
const clean = (s) => String(s ?? "").trim().replace(/َ(?=ا)/g, "");

// What is missing from the form (keys of the form fields), empty when it can be added.
export function missingFields(f) {
  const out = [];
  if (!clean(f.arabic)) out.push("arabic");
  if (!String(f.definition ?? "").trim()) out.push("definition");
  if (!POS_CHOICES.includes(f.pos)) out.push("pos");
  if (f.pos === "verb" && !f.form) out.push("form");
  return out;
}

// The form's fields -> a word shaped like the course words. It is placed in the student's current lesson.
export function buildCustomWord(f, level, id) {
  const isVerb = f.pos === "verb";
  const word = {
    id,
    custom: true,
    book: level.book,
    unit: level.unit,
    part: null,
    arabic: clean(f.arabic),
    definition: String(f.definition).trim(),
    transliteration: null,
    pos: f.pos,
    root: normalizeRoot(f.root) || null,
    form: isVerb ? Number(f.form) || null : null,
    gender: f.pos === "noun" ? f.gender || null : null,
    plural: f.plural ? clean(f.plural) : null,
    feminine: f.feminine ? clean(f.feminine) : null,
    prepositions: isVerb ? [...(f.prepositions ?? [])] : [],
    notes: String(f.notes ?? "").trim(),
    conjugations: null,
    egyptian: null,
    shami: null,
  };
  // Form I verbs need their vowels for the generator (the middle vowel of the past and of the present)
  if (isVerb && word.form === 1) {
    word.pastVowel = VOWELS.includes(f.pastVowel) ? f.pastVowel : "a";
    word.presentVowel = VOWELS.includes(f.presentVowel) ? f.presentVowel : "u";
  }
  return word;
}

// Words of the course list that look like what is being typed (the Arabic, else the English), with where they stand
// for this student: "have" (in a lesson they have reached), "added" (unlocked early) or "future" (not yet reached).
export function courseMatches(courseIndex, { arabic, definition }, level, custom, limit = 5) {
  const a = stripDiacritics(clean(arabic));
  const d = String(definition ?? "").trim();
  let found = [];
  if (a.length >= 2) found = search(courseIndex, a);
  else if (d.length >= 3) found = search(courseIndex, d);
  const early = new Set(custom.early);
  return found.slice(0, limit).map((word) => ({
    word,
    state: early.has(word.id) ? "added" : compareLevel(word, level) <= 0 ? "have" : "future",
  }));
}

// --- changes to the saved { words, early } ---
export const addOwnWord = (custom, word) => ({ ...custom, words: [...custom.words, word] });
export const removeOwnWord = (custom, id) => ({ ...custom, words: custom.words.filter((w) => w.id !== id) });
export const unlockEarly = (custom, id) => (custom.early.includes(id) ? custom : { ...custom, early: [...custom.early, id] });
export const lockEarly = (custom, id) => ({ ...custom, early: custom.early.filter((x) => x !== id) });

// Merging this browser's words with the account's: everything either side has.
export function mergeCustom(a = emptyCustom(), b = emptyCustom()) {
  const byId = new Map([...(b.words ?? []), ...(a.words ?? [])].map((w) => [w.id, w]));
  return { words: [...byId.values()], early: [...new Set([...(b.early ?? []), ...(a.early ?? [])])] };
}

export const newOwnId = () => `my-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

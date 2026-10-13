// Which grammar sections a student can see, and how they connect to word cards.

import { compareLevel, levelReached } from "../config/books.js";

export function matchesWord(word, spec) {
  if (!spec) return false;
  if (spec.pos && word.pos !== spec.pos) return false;
  if (spec.gender && word.gender !== spec.gender) return false;
  if (spec.forms && !spec.forms.includes(word.form)) return false;
  if (spec.hasRoot && !word.root) return false;
  if (spec.hasPrepositions && !word.prepositions?.length) return false;
  if (spec.hasPlural && !word.plural) return false;
  return true;
}

// Titles turn Arabic at Al-Kitaab part 2 unless a section says otherwise.
export function sectionTitle(section, level) {
  const from = section.arabicTitleFrom ?? { book: 3, unit: 1 };
  return levelReached(level, from) ? section.title.ar : section.title.en;
}

const ordered =(sections) =>
  [...sections].sort((a, b) => compareLevel(a.unlock, b.unlock));

export function unlockedSections(sections, level) {
  return ordered(sections).filter((s) => levelReached(level, s.unlock));
}

// The earliest section the student has not unlocked yet, or null.
export function nextLockedSection(sections, level) {
  return ordered(sections).find((s) => !levelReached(level, s.unlock)) ?? null;
}

// Unlocked sections that apply to this word.
export function sectionsForWord(sections, word, level) {
  return unlockedSections(sections, level).filter((s) => matchesWord(word, s.appliesTo));
}

// Words (already limited to the student's level) that a section applies to.
export function wordsForSection(section, words) {
  return words.filter((w) => matchesWord(w, section.appliesTo));
}

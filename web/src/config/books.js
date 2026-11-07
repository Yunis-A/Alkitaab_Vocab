// Book colors and unit counts. Edit values here.
// A book with `nameAr` switches to it once the student reaches `nameArFrom`.
export const books = {
  1: { name: "Alif Baa", nameAr: "ألف باء", nameArFrom: { book: 1, unit: 8 }, color: "#f36523", maxUnits: 10 },
  2: { name: "الكتاب ١", color: "#d3232a", maxUnits: 13 },
  3: { name: "الكتاب ٢", color: "#0a1f7d", maxUnits: 10 },
  4: { name: "الكتاب ٣", color: "#6d2770", maxUnits: 10 },
};

export const BOOK_IDS = Object.keys(books).map(Number);

// Layout flips to RTL at this level (start of Al-Kitaab part 2) or when the
// share of Arabic UI strings reaches RTL_ARABIC_RATIO, whichever comes first.
export const RTL_LEVEL = { book: 3, unit: 1 };
export const RTL_ARABIC_RATIO = 0.5;

// Status colors for word proficiency.
export const STATUS_COLORS = {
  proficient: "#2e9e5b",
  mastered: "#d4a017",
};

// A UI string whose required vocabulary is "learned" once every one of those
// words has reached at least this Leitner box (index 4 = the first 1-day box).
export const UI_LEARNED_BOX = 4;

// Numbers switch from 0-9 to ٠-٩ everywhere once the student reaches this level
// (Alif Baa unit 4 is where the digits are taught).
export const ARABIC_DIGITS_LEVEL = { book: 1, unit: 4 };

// How a lesson is written depends on the lesson itself, not on the student's level: Arabic digits from
// Alif Baa lesson 4 and "درس" from Alif Baa lesson 5; every Al-Kitaab lesson (books 2-4) has both.
export const LESSON_WORD_FROM = { book: 1, unit: 5 };

export function lessonStyle(book, unit) {
  const at = { book, unit };
  return { digits: levelReached(at, ARABIC_DIGITS_LEVEL), word: levelReached(at, LESSON_WORD_FROM) };
}

// Plurals are hidden until they are learned (Al-Kitaab part 1, lesson 2); gender information (masculine /
// feminine as a property of a word, and the Gender filter) until Alif Baa lesson 6. The Arabic words
// مُذَكَّر and مُؤَنَّث are learned in part 1 lesson 1 (see the UI strings).
export const PLURAL_FROM = { book: 2, unit: 2 };
export const GENDER_FROM = { book: 1, unit: 6 };

// After Alif Baa the student is asked for their name in Arabic, which is then shown instead of the English one.
export const NAME_AR_FROM = { book: 2, unit: 1 };

// The imperative (الأمر) is not shown before Al-Kitaab part 3, lesson 3.
export const IMPERATIVE_LEVEL = { book: 4, unit: 3 };

// Moving to a higher book starts at its unit 1; moving to a lower book lands
// on that book's last unit.
export function unitAfterBookChange(fromBook, toBook) {
  return toBook > fromBook ? 1 : books[toBook].maxUnits;
}

// Transliteration is only shown to Alif Baa students.
export const TRANSLITERATION_MAX_BOOK = 1;

// Compare levels: negative if a is before b.
export function compareLevel(a, b) {
  return a.book - b.book || a.unit - b.unit;
}

export function levelReached(level, target) {
  return compareLevel(level, target) >= 0;
}

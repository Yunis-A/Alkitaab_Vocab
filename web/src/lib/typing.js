// The typing lessons: which letters come when, what each lesson asks you to type, and who passes.
//
// Letters are taught by position on the keyboard (home row first, then the top row, then the bottom row),
// two per lesson, with a review lesson after every three of them. A student has to pass a lesson, with enough
// accuracy and speed, before the next one opens.

import { stripDiacritics } from "./arabic.js";

// 10 home-row letters, then ط (the home row's last key) and the top row, the bottom row, the hamza seats on alif
// (with Shift), ذ and the lam-alef key.
export const LETTER_ORDER = [
  "ب", "ت", "ي", "ن", "س", "م", "ش", "ك", "ل", "ا",
  "ط", "ق", "ف", "ع", "غ", "ث", "ه", "ص", "خ", "ض", "ح", "ج", "د",
  "ر", "و", "ى", "ة", "ز", "ء", "ظ", "ؤ", "ئ",
  "أ", "إ", // the hamza seats on alif, typed with Shift (H and Y)
  "ذ", "لا",
];

export const MIN_ACCURACY = 0.9;
// characters per minute needed to pass: 20 in the first lesson, 2 more with each lesson (about 4 words a
// minute at first, 13 by the end)
export const minCpm = (index) => 20 + 2 * index;

const PER_LESSON = 2;
const REVIEW_EVERY = 3; // a review lesson after this many new-letter lessons

function buildLessons() {
  const lessons = [];
  let known = [];
  let recent = [];
  let news = 0;
  for (let i = 0; i < LETTER_ORDER.length; i += PER_LESSON) {
    const letters = LETTER_ORDER.slice(i, i + PER_LESSON);
    known = [...known, ...letters];
    recent = [...recent, ...letters];
    news += 1;
    lessons.push({ id: `n${news}`, kind: "new", number: news, letters, known: [...known] });
    const last = i + PER_LESSON >= LETTER_ORDER.length;
    if (news % REVIEW_EVERY === 0 || last) {
      const reviews = lessons.filter((l) => l.kind === "review").length + 1;
      lessons.push({ id: `r${reviews}`, kind: "review", number: reviews, letters: recent.slice(-REVIEW_EVERY * PER_LESSON), known: [...known] });
      recent = [];
    }
  }
  return lessons.map((l, index) => ({ ...l, index, minCpm: minCpm(index) }));
}

export const LESSONS = buildLessons();

// A lesson opens once every lesson before it has been passed.
export const isUnlocked = (index, passed) => LESSONS.slice(0, index).every((l) => passed[l.id]);

// --- what to type ---

// Words from the list that can be typed with the letters known so far (letters only, no spaces or marks).
// Hamza seats count as their own letters: a word with أ or إ waits until those are taught.
export function typableWords(words, known) {
  const ok = new Set(known.filter((t) => t.length === 1));
  const seen = new Set();
  for (const w of words) {
    if (!w.arabic) continue;
    const s = stripDiacritics(w.arabic);
    if (s.length < 2 || s.length > 7 || !/^[ء-يٱ]+$/.test(s)) continue;
    if ([...s].every((c) => ok.has(c))) seen.add(s);
  }
  return [...seen];
}

function shuffle(items, rng) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const combo = (pool, length, rng) => Array.from({ length }, () => pool[Math.floor(rng() * pool.length)]);

// The tokens of a lesson: letters (or "لا") and spaces between the words. A new-letter lesson drills its two
// letters in short strings, then adds real words that use them; a review lesson mixes words and strings of
// the letters of the last few lessons.
export function buildText(lesson, words, rng = Math.random) {
  const usable = typableWords(words, lesson.known);
  const hasNew = (w) => lesson.letters.some((l) => w.includes(l));
  const units = [];

  if (lesson.kind === "new") {
    // every new letter appears at least three times
    const drills = [];
    for (const l of lesson.letters) for (let i = 0; i < 3; i++) drills.push([l, ...combo(lesson.letters, 2, rng)]);
    units.push(...shuffle(drills, rng));
    const withNew = shuffle(usable.filter(hasNew), rng).slice(0, 4);
    for (const w of withNew) units.push([...w]);
    if (withNew.length < 2) for (let i = 0; i < 3; i++) units.push(combo(lesson.known, 3, rng));
  } else {
    const picked = shuffle(usable.filter(hasNew), rng).slice(0, 4);
    const rest = shuffle(usable.filter((w) => !picked.includes(w)), rng).slice(0, 3);
    for (const w of [...picked, ...rest]) units.push([...w]);
    const need = Math.max(4, 8 - units.length);
    for (let i = 0; i < need; i++) units.push(combo(lesson.letters, 3, rng));
  }

  const tokens = [];
  shuffle(units, rng).forEach((u, i) => {
    if (i) tokens.push(" ");
    tokens.push(...u);
  });
  return tokens;
}

// --- results ---

// correct: right key presses (spaces included); mistakes: wrong ones; ms: first key to last.
export function typingResult({ correct, mistakes, ms }, lesson) {
  const total = correct + mistakes;
  const accuracy = total ? correct / total : 0;
  const cpm = ms > 0 ? correct / (ms / 60000) : 0;
  return { accuracy, cpm, passed: accuracy >= MIN_ACCURACY && cpm >= lesson.minCpm };
}

// Keeps the better of two saved results for a lesson (by speed).
export const betterResult = (a, b) => (!a ? b : !b ? a : b.cpm > a.cpm ? b : a);

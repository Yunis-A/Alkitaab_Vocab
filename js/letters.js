/**
 * Alif Baa letter unlock map — cumulative by unit (book 1).
 * Unit 1: introduction only (no letters/marks).
 */

const SHORT_VOWELS = ["َ", "ُ", "ِ"];
const SUKUUN = "ْ";
const SHADDA = "ّ";

/** Letters / marks newly introduced at each Alif Baa unit */
const UNIT_LETTERS = {
  1: [],
  2: ["ب", "ت", "ث", "ا", "و", "ي", "ى", "ة", ...SHORT_VOWELS],
  3: ["خ", "ح", "ج", "و", "ي", SUKUUN],
  4: ["ء", "أ", "إ", "ؤ", "ئ", "آ", "ز", "ر", "ذ", "د", "٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"],
  5: ["ش", "س", "ص", "ض", SHADDA],
  // Units 6–10 filled later when vocab is provided
  6: [],
  7: [],
  8: [],
  9: [],
  10: [],
};

/** Full alphabet — treated as known on book 2+ */
const FULL_ALPHABET = new Set([
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض",
  "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي", "ى", "ة",
  "ء", "أ", "إ", "ؤ", "ئ", "آ",
  "َ", "ُ", "ِ", "ً", "ٌ", "ٍ", SUKUUN, SHADDA, "ـ",
  "٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
]);

/** Characters ignored when checking letter knowledge (punctuation, spaces, Latin) */
function isIgnorable(ch) {
  if (!ch) return true;
  if (/\s/.test(ch)) return true;
  if (/[.,!?;:'"«»()[\]{}…\-/]/.test(ch)) return true;
  // Latin digits / letters in mixed prompts
  if (/[A-Za-z0-9]/.test(ch)) return true;
  // Tatweel
  if (ch === "ـ") return true;
  // Tanween — treat as known once short vowels known (unit 2+)
  return false;
}

function getKnownLetters(state) {
  if (!state || state.book >= 2) {
    return new Set(FULL_ALPHABET);
  }
  const known = new Set();
  const maxUnit = Math.min(Math.max(1, state.unit || 1), 10);
  for (let u = 1; u <= maxUnit; u++) {
    for (const ch of UNIT_LETTERS[u] || []) {
      known.add(ch);
    }
  }
  // Once short vowels known, also allow tanween
  if (known.has("َ")) {
    known.add("ً");
    known.add("ٌ");
    known.add("ٍ");
  }
  return known;
}

/**
 * Extract base Arabic letters/marks from a string for gating.
 * Hamza-on-carrier forms are kept as distinct chars in UNIT_LETTERS.
 */
function extractLetters(arabic) {
  const chars = [];
  for (const ch of arabic || "") {
    if (isIgnorable(ch)) continue;
    chars.push(ch);
  }
  return chars;
}

/**
 * True if every letter/mark in the Arabic is known at current state.
 * Empty arabic → false (still show transliteration if any).
 */
function knowsAllLetters(arabic, state) {
  const letters = extractLetters(arabic);
  if (!letters.length) return false;
  const known = getKnownLetters(state);
  return letters.every((ch) => known.has(ch));
}

/**
 * Whether to display transliteration for this word at this progress.
 */
function shouldShowTransliteration(word, state) {
  if (!word || !word.transliteration) return false;
  // Book 2+ sample vocab: show transliteration if present (no Alif Baa gate)
  if (word.book >= 2) return true;
  // Alif Baa: hide when student knows all letters in the word
  return !knowsAllLetters(word.arabic, state);
}

function displayTransliteration(word, state) {
  return shouldShowTransliteration(word, state) ? word.transliteration : "";
}

window.AlKitaabLetters = {
  UNIT_LETTERS,
  getKnownLetters,
  extractLetters,
  knowsAllLetters,
  shouldShowTransliteration,
  displayTransliteration,
};

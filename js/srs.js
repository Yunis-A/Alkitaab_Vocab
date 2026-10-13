/**
 * Anki-style SM-2 spaced repetition.
 * Ratings: again | hard | good | easy
 */

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

function loadSrsMap() {
  try {
    return JSON.parse(localStorage.getItem(AlKitaab.STORAGE_KEYS.srs) || "{}");
  } catch {
    return {};
  }
}

function saveSrsMap(map) {
  localStorage.setItem(AlKitaab.STORAGE_KEYS.srs, JSON.stringify(map));
}

function defaultCard() {
  return {
    ease: DEFAULT_EASE,
    interval: 0,
    repetitions: 0,
    due: Date.now(),
    lapses: 0,
  };
}

function getCard(wordId) {
  const map = loadSrsMap();
  return map[wordId] ? { ...defaultCard(), ...map[wordId] } : defaultCard();
}

function setCard(wordId, card) {
  const map = loadSrsMap();
  map[wordId] = card;
  saveSrsMap(map);
}

function isDue(card, now = Date.now()) {
  return card.due <= now;
}

function ensureCardsForWords(words) {
  const map = loadSrsMap();
  let changed = false;
  for (const w of words) {
    if (!map[w.id]) {
      map[w.id] = defaultCard();
      changed = true;
    }
  }
  if (changed) saveSrsMap(map);
}

function getDueWords(words, now = Date.now()) {
  ensureCardsForWords(words);
  return words.filter((w) => isDue(getCard(w.id), now));
}

function countDue(words, now = Date.now()) {
  return getDueWords(words, now).length;
}

/**
 * Apply SM-2-ish rating and return updated card.
 * intervals in days; due stored as timestamp.
 */
function review(wordId, rating) {
  const card = getCard(wordId);
  const day = 24 * 60 * 60 * 1000;
  let { ease, interval, repetitions, lapses } = card;

  if (rating === "again") {
    repetitions = 0;
    lapses += 1;
    interval = 0;
    ease = Math.max(MIN_EASE, ease - 0.2);
    const due = Date.now() + 1 * 60 * 1000; // 1 minute
    const next = { ease, interval, repetitions, due, lapses };
    setCard(wordId, next);
    return next;
  }

  if (rating === "hard") {
    if (repetitions === 0) {
      interval = 1;
    } else {
      interval = Math.max(1, Math.round(interval * 1.2));
    }
    ease = Math.max(MIN_EASE, ease - 0.15);
    repetitions += 1;
  } else if (rating === "good") {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * ease);
    repetitions += 1;
  } else if (rating === "easy") {
    if (repetitions === 0) interval = 4;
    else if (repetitions === 1) interval = 7;
    else interval = Math.round(interval * ease * 1.3);
    ease += 0.15;
    repetitions += 1;
  }

  const due = Date.now() + interval * day;
  const next = { ease, interval, repetitions, due, lapses };
  setCard(wordId, next);
  return next;
}

/** Mark a word as failed (e.g. from quiz) — schedules Again. */
function markAgain(wordId) {
  return review(wordId, "again");
}

function previewIntervals(wordId) {
  const card = getCard(wordId);
  const day = 1;
  const labels = {};

  // Approximate next interval labels without mutating
  const clone = { ...card };

  function sim(rating) {
    let { ease, interval, repetitions } = { ...clone };
    if (rating === "again") return "< 1 min";
    if (rating === "hard") {
      if (repetitions === 0) return "1 day";
      return `${Math.max(1, Math.round(interval * 1.2))} days`;
    }
    if (rating === "good") {
      if (repetitions === 0) return "1 day";
      if (repetitions === 1) return "3 days";
      return `${Math.round(interval * ease)} days`;
    }
    if (rating === "easy") {
      if (repetitions === 0) return "4 days";
      if (repetitions === 1) return "7 days";
      return `${Math.round(interval * ease * 1.3)} days`;
    }
    return "";
  }

  labels.again = sim("again");
  labels.hard = sim("hard");
  labels.good = sim("good");
  labels.easy = sim("easy");
  return labels;
}

window.AlKitaabSrs = {
  loadSrsMap,
  getCard,
  setCard,
  isDue,
  ensureCardsForWords,
  getDueWords,
  countDue,
  review,
  markAgain,
  previewIntervals,
  defaultCard,
};

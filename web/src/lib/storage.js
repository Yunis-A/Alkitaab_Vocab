// Persistence boundary. Everything the app saves goes through load/save here,
// so swapping localStorage for a backend API later only touches this file.

import { VARIETY_IDS } from "./varieties.js";

const KEY = "alkitaab_progress_v1";

// geoBest:  best map-game time in ms, keyed by mode id.
// dialects: which dialect forms the student studies (off by default).
// typing:   passed typing lessons ({ id: { accuracy, cpm } }).
// profile:  the student's name, in English (asked first) and in Arabic (asked after Alif Baa).
// custom:   the student's own words and the course words they unlocked early ({ words, early }).
// dark:     dark mode; null until the student chooses, then the system's setting is followed.
export const emptyProgress = () => ({
  level: null, cards: {}, geoBest: {}, dialects: { egyptian: false, shami: false }, typing: { passed: {} }, dark: null, custom: { words: [], early: [] },
  profile: { name: "", nameAr: "", skippedAr: false },
});

// Keep only cards for known varieties (older saves had another direction).
function migrate(progress) {
  const cards = {};
  for (const [key, card] of Object.entries(progress.cards ?? {})) {
    if (VARIETY_IDS.some((v) => key.endsWith(`|${v}`))) cards[key] = card;
  }
  return {
    ...progress,
    cards,
    dialects: { ...emptyProgress().dialects, ...progress.dialects },
    typing: { ...emptyProgress().typing, ...progress.typing },
    custom: { ...emptyProgress().custom, ...progress.custom },
    profile: { ...emptyProgress().profile, ...progress.profile },
  };
}

export function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    return raw ? migrate({ ...emptyProgress(), ...raw }) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

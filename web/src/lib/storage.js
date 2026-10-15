// Persistence boundary. Everything the app saves goes through load/save here,
// so swapping localStorage for a backend API later only touches this file.

import { VARIETY_IDS } from "./varieties.js";

const KEY = "alkitaab_progress_v1";

// geoBest:  best map-game time in ms, keyed by mode id.
// dialects: which dialect forms the student studies (off by default).
const empty = () => ({ level: null, cards: {}, geoBest: {}, dialects: { egyptian: false, shami: false } });

// Keep only cards for known varieties (older saves had another direction).
function migrate(progress) {
  const cards = {};
  for (const [key, card] of Object.entries(progress.cards ?? {})) {
    if (VARIETY_IDS.some((v) => key.endsWith(`|${v}`))) cards[key] = card;
  }
  return { ...progress, cards, dialects: { ...empty().dialects, ...progress.dialects } };
}

export function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    return raw ? migrate({ ...empty(), ...raw }) : empty();
  } catch {
    return empty();
  }
}

export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

// Persistence boundary. Everything the app saves goes through load/save here,
// so swapping localStorage for a backend API later only touches this file.

const KEY = "alkitaab_progress_v1";

// geoBest: best map-game time in ms, keyed by mode id.
const empty = () => ({ level: null, cards: {}, geoBest: {} });

// Cards are Arabic -> English only; drop any other direction saved earlier.
function migrate(progress) {
  const cards = {};
  for (const [key, card] of Object.entries(progress.cards ?? {})) {
    if (key.endsWith("|ar-en")) cards[key] = card;
  }
  return { ...progress, cards };
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

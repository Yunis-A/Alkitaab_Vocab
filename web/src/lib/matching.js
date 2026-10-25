// Matching game: a round shows the English meaning of some words on one side and their Arabic on the
// other, and the student connects each pair.

export const ROUND_SIZE = 6;

export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// `items` are { id, arabic, english }. Picks up to `size` at random, never two with the same English or the
// same Arabic (the student could not tell them apart), and returns the two sides shuffled independently.
export function buildRound(items, size = ROUND_SIZE, rng = Math.random) {
  const seenEn = new Set();
  const seenAr = new Set();
  const picked = [];
  for (const it of shuffle(items, rng)) {
    if (!it.arabic || !it.english || seenEn.has(it.english) || seenAr.has(it.arabic)) continue;
    seenEn.add(it.english);
    seenAr.add(it.arabic);
    picked.push(it);
    if (picked.length === size) break;
  }
  return { english: shuffle(picked, rng), arabic: shuffle(picked, rng) };
}

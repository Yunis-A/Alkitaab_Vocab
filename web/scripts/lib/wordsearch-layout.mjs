// Hides words in a letter grid. A direction is (dr, dc) in logical coordinates: (0, 1) runs along increasing
// columns, which on the Arabic page is right to left, the way Arabic reads; (1, 0) runs down; (1, 1) runs down
// and to the left; (-1, 0), (0, -1) and (-1, 1) run up, left to right and up-left.

export const DIRS = {
  easy: [[0, 1], [1, 0]],
  medium: [[0, 1], [1, 0], [1, 1]],
  hard: [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, 1]],
};

function rngFrom(seed) {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

const FILLER = "ااااالللييمننرتتبوهكدسعفقحجشصطغخزذض";

function attempt(words, size, dirs, rng) {
  const grid = Array.from({ length: size }, () => Array(size).fill(""));
  const placed = [];
  const order = [...words].sort((a, b) => b.answer.length - a.answer.length + (rng() - 0.5) * 2);
  for (const w of order) {
    const letters = [...w.answer];
    let done = false;
    for (let t = 0; t < 120 && !done; t++) {
      const [dr, dc] = dirs[Math.floor(rng() * dirs.length)];
      const r = Math.floor(rng() * size), c = Math.floor(rng() * size);
      const er = r + dr * (letters.length - 1), ec = c + dc * (letters.length - 1);
      if (er < 0 || ec < 0 || er >= size || ec >= size) continue;
      let ok = true, overlap = 0;
      for (let k = 0; k < letters.length && ok; k++) {
        const cell = grid[r + dr * k][c + dc * k];
        if (cell && cell !== letters[k]) ok = false;
        if (cell === letters[k]) overlap++;
      }
      if (!ok || overlap === letters.length) continue; // a word wholly inside others is not allowed
      for (let k = 0; k < letters.length; k++) grid[r + dr * k][c + dc * k] = letters[k];
      placed.push({ ...w, r, c, dr, dc });
      done = true;
    }
  }
  return { grid, placed };
}

// { rows, cols, grid: ["...", ...], words: [{ answer, arabic, english, r, c, dr, dc }], left: [answers not placed] }
export function layoutWordSearch(words, { size, level = "easy", seed = 1, tries = 400 }) {
  const rng = rngFrom(seed);
  const dirs = DIRS[level];
  let best = null;
  for (let i = 0; i < tries; i++) {
    const result = attempt(words, size, dirs, rng);
    if (!best || result.placed.length > best.placed.length) best = result;
    if (best.placed.length === words.length) break;
  }
  const letters = [...new Set(best.placed.flatMap((w) => [...w.answer]))].join("") + FILLER;
  const grid = best.grid.map((row) => row.map((ch) => ch || letters[Math.floor(rng() * letters.length)]).join(""));
  return {
    rows: size,
    cols: size,
    grid,
    words: best.placed.map(({ answer, arabic, english, r, c, dr, dc }) => ({ answer, arabic, english, r, c, dr, dc })),
    left: words.filter((w) => !best.placed.some((p) => p.answer === w.answer)).map((w) => w.answer),
  };
}

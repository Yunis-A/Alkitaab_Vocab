// Word search helpers: a puzzle is { rows, cols, grid: ["...", ...], words: [{ answer, arabic, english, r, c, dr, dc }] }.
// Rows and columns are logical: column 0 is the right-hand column on the Arabic page.

export const searchId = (book, unit) => `b${book}-u${unit}`;

// How much English a unit's word list shows next to the Arabic: all of it in part 1 lessons 1-4, a lighter hint in
// lessons 5-11, none after that.
export function glossMode(book, unit) {
  if (book === 2 && unit <= 4) return "full";
  if (book === 2 && unit <= 11) return "light";
  return "none";
}

// the cells of a word, in order
export const wordCells = (w) => Array.from({ length: w.answer.length }, (_, k) => ({ r: w.r + w.dr * k, c: w.c + w.dc * k }));

// The straight line from one cell to another (every cell between, both ends included), or null if it is not a
// horizontal, vertical or diagonal line.
export function lineBetween(a, b) {
  const dr = b.r - a.r, dc = b.c - a.c;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  if (steps === 0) return [a];
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const sr = Math.sign(dr), sc = Math.sign(dc);
  return Array.from({ length: steps + 1 }, (_, k) => ({ r: a.r + sr * k, c: a.c + sc * k }));
}

// The word a line of cells spells, forwards or backwards, or null.
export function wordOnLine(puzzle, line) {
  if (!line || line.length < 2) return null;
  const text = line.map(({ r, c }) => puzzle.grid[r][c]).join("");
  const back = [...text].reverse().join("");
  return puzzle.words.find((w) => w.answer === text || w.answer === back) ?? null;
}

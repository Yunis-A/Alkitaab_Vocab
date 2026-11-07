// Crossword helpers: a puzzle is { rows, cols, cells: ["ك..ت", ...] ("." = no cell), entries: [{ n, dir, r, c, answer, clue }] }.
// "across" runs along increasing columns (right to left on the page), "down" along increasing rows.

import { normalizeArabic } from "./arabic.js";

export const puzzleId = (book, unit) => `b${book}-u${unit}`;

// ا for any alef, ي for ى, ه for ة ...: what is typed may be any spelling of the letter
export const sameLetter = (a, b) => !!a && !!b && normalizeArabic(a) === normalizeArabic(b);

export const isCell = (puzzle, r, c) => r >= 0 && c >= 0 && r < puzzle.rows && c < puzzle.cols && puzzle.cells[r][c] !== ".";
export const letterAt = (puzzle, r, c) => puzzle.cells[r][c];

// the cells of an entry, in order
export function entryCells(entry) {
  return Array.from({ length: entry.answer.length }, (_, k) => ({
    r: entry.r + (entry.dir === "down" ? k : 0),
    c: entry.c + (entry.dir === "across" ? k : 0),
  }));
}

// the entry of a direction that covers a cell, or null
export function entryAt(puzzle, r, c, dir) {
  return puzzle.entries.find((e) => e.dir === dir && entryCells(e).some((x) => x.r === r && x.c === c)) ?? null;
}

// `typed` is rows x cols of strings ("" when empty)
export const emptyTyped = (puzzle) => Array.from({ length: puzzle.rows }, () => Array(puzzle.cols).fill(""));

export const isEntrySolved = (puzzle, typed, entry) => entryCells(entry).every(({ r, c }) => sameLetter(typed[r][c], letterAt(puzzle, r, c)));

export function isSolved(puzzle, typed) {
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (isCell(puzzle, r, c) && !sameLetter(typed[r][c], letterAt(puzzle, r, c))) return false;
    }
  }
  return true;
}

// cells that hold a letter which is wrong (empty cells are not wrong)
export function wrongCells(puzzle, typed) {
  const out = [];
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (isCell(puzzle, r, c) && typed[r][c] && !sameLetter(typed[r][c], letterAt(puzzle, r, c))) out.push({ r, c });
    }
  }
  return out;
}

// where a typed letter goes next: the following cell of the entry, or the same cell at its end
export function nextCell(puzzle, r, c, dir) {
  const nr = r + (dir === "down" ? 1 : 0);
  const nc = c + (dir === "across" ? 1 : 0);
  return isCell(puzzle, nr, nc) ? { r: nr, c: nc } : { r, c };
}
export function prevCell(puzzle, r, c, dir) {
  const pr = r - (dir === "down" ? 1 : 0);
  const pc = c - (dir === "across" ? 1 : 0);
  return isCell(puzzle, pr, pc) ? { r: pr, c: pc } : { r, c };
}

// Lays words out as a crossword: words cross at shared letters, no two words touch side by side, the grid
// stays small. `words` are { answer, clue }. Deterministic for a given seed. Rows and columns are logical: an
// "across" word runs along increasing columns (in the Arabic page, right to left).

const MAX = 15; // rows and columns

function rngFrom(seed) {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function shuffled(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const key = (r, c) => `${r},${c}`;

function tryLayout(words, rng) {
  const cells = new Map(); // "r,c" -> { ch, across, down }
  const placed = [];
  let r0 = 0, r1 = 0, c0 = 0, c1 = 0;

  const at = (r, c) => cells.get(key(r, c));
  const dr = (dir) => (dir === "down" ? 1 : 0);
  const dc = (dir) => (dir === "across" ? 1 : 0);

  function fit(w, r, c, dir) {
    const len = w.answer.length;
    const rEnd = r + dr(dir) * (len - 1);
    const cEnd = c + dc(dir) * (len - 1);
    const nr0 = Math.min(r0, r), nr1 = Math.max(r1, rEnd), nc0 = Math.min(c0, c), nc1 = Math.max(c1, cEnd);
    if (nr1 - nr0 + 1 > MAX || nc1 - nc0 + 1 > MAX) return null;
    if (at(r - dr(dir), c - dc(dir)) || at(rEnd + dr(dir), cEnd + dc(dir))) return null; // ends must be free
    let crossings = 0;
    for (let k = 0; k < len; k++) {
      const rr = r + dr(dir) * k, cc = c + dc(dir) * k;
      const cell = at(rr, cc);
      if (cell) {
        if (cell.ch !== w.answer[k] || cell[dir]) return null; // letter must match, and not run along another word
        crossings++;
      } else if (at(rr + dc(dir), cc + dr(dir)) || at(rr - dc(dir), cc - dr(dir))) {
        return null; // would touch a neighbouring word side by side
      }
    }
    if (!crossings) return null;
    return { crossings, area: (nr1 - nr0 + 1) * (nc1 - nc0 + 1) };
  }

  function put(w, r, c, dir) {
    for (let k = 0; k < w.answer.length; k++) {
      const rr = r + dr(dir) * k, cc = c + dc(dir) * k;
      const cell = at(rr, cc) ?? { ch: w.answer[k], across: false, down: false };
      cell[dir] = true;
      cells.set(key(rr, cc), cell);
      r0 = Math.min(r0, rr); r1 = Math.max(r1, rr); c0 = Math.min(c0, cc); c1 = Math.max(c1, cc);
    }
    placed.push({ ...w, r, c, dir });
  }

  const [first, ...rest] = words;
  put(first, 0, 0, "across");
  let queue = rest;
  for (let round = 0; round < 3 && queue.length; round++) {
    const left = [];
    for (const w of queue) {
      let best = null;
      for (const [k, cell] of cells) {
        const [r, c] = k.split(",").map(Number);
        for (let i = 0; i < w.answer.length; i++) {
          if (w.answer[i] !== cell.ch) continue;
          for (const dir of ["across", "down"]) {
            if (cell[dir]) continue; // the cell is already part of a word in this direction
            const r2 = dir === "down" ? r - i : r, c2 = dir === "across" ? c - i : c;
            const f = fit(w, r2, c2, dir);
            if (!f) continue;
            const score = f.crossings * 100 - f.area + rng();
            if (!best || score > best.score) best = { score, r: r2, c: c2, dir, ...f };
          }
        }
      }
      if (best) put(w, best.r, best.c, best.dir); else left.push(w);
    }
    queue = left;
  }

  const area = (r1 - r0 + 1) * (c1 - c0 + 1);
  const crossings = [...cells.values()].filter((x) => x.across && x.down).length;
  return { placed, unplaced: queue, area, crossings, bounds: { r0, r1, c0, c1 } };
}

// The best of many tries: the most words placed, then the smallest grid, then the most crossings.
export function layoutCrossword(words, { seed = 1, tries = 600 } = {}) {
  const rng = rngFrom(seed);
  let best = null;
  for (let i = 0; i < tries; i++) {
    // longest words first, with some shuffling so the tries differ
    const order = shuffled(words, rng).sort((a, b) => b.answer.length - a.answer.length + (rng() - 0.5) * 3);
    const result = tryLayout(order, rng);
    const better = !best
      || result.placed.length > best.placed.length
      || (result.placed.length === best.placed.length && (result.area < best.area || (result.area === best.area && result.crossings > best.crossings)));
    if (better) best = result;
  }
  return toPuzzle(best);
}

// The placed words -> { rows, cols, cells: ["ك..ت", ...] ("." empty), entries: [{ n, dir, r, c, answer, clue }] },
// numbered in reading order (row by row, from the first column).
function toPuzzle({ placed, unplaced, bounds }) {
  const rows = bounds.r1 - bounds.r0 + 1;
  const cols = bounds.c1 - bounds.c0 + 1;
  const grid = Array.from({ length: rows }, () => Array(cols).fill("."));
  for (const w of placed) {
    for (let k = 0; k < w.answer.length; k++) {
      const r = w.r - bounds.r0 + (w.dir === "down" ? k : 0);
      const c = w.c - bounds.c0 + (w.dir === "across" ? k : 0);
      grid[r][c] = w.answer[k];
    }
  }
  const byStart = new Map(placed.map((w) => [`${w.r - bounds.r0},${w.c - bounds.c0},${w.dir}`, w]));
  const entries = [];
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === ".") continue;
      const across = byStart.get(`${r},${c},across`);
      const down = byStart.get(`${r},${c},down`);
      if (!across && !down) continue;
      n += 1;
      if (across) entries.push({ n, dir: "across", r, c, answer: across.answer, clue: across.clue });
      if (down) entries.push({ n, dir: "down", r, c, answer: down.answer, clue: down.clue });
    }
  }
  return { rows, cols, cells: grid.map((row) => row.join("")), entries, unplaced: unplaced.map((w) => w.answer) };
}

// Quick study: a throwaway session over the words of chosen units. It has its own three boxes and never
// touches the Leitner cards. Every word starts in "hard"; the student moves it to hard, medium or easy.
// Words come from hard first, then medium; once only easy ones remain the session is "done" (and the
// student may keep going through the easy ones).

export const QUICK_BOXES = ["hard", "medium", "easy"];

export function startBoxes(wordIds) {
  return Object.fromEntries(wordIds.map((id) => [id, "hard"]));
}

export function countBoxes(boxes) {
  const n = { hard: 0, medium: 0, easy: 0 };
  for (const b of Object.values(boxes)) n[b] += 1;
  return n;
}

// The next word to show, as { id, from } with `from` the box it was drawn from, or null if there are no
// words. Draws at random from hard, else medium, else (when `keepGoing`) easy; returns { id: null, from:
// "done" } when only easy words remain and the student has not asked to keep going. `last` is not repeated
// straight away unless it is the only choice. `rng` returns [0, 1).
export function pickNext(boxes, { last = null, keepGoing = false, rng = Math.random } = {}) {
  const ids = Object.keys(boxes);
  if (!ids.length) return null;
  for (const box of QUICK_BOXES) {
    if (box === "easy" && !keepGoing) break;
    let pool = ids.filter((id) => boxes[id] === box);
    if (!pool.length) continue;
    if (pool.length > 1) pool = pool.filter((id) => id !== last);
    return { id: pool[Math.floor(rng() * pool.length)], from: box };
  }
  return { id: null, from: "done" };
}

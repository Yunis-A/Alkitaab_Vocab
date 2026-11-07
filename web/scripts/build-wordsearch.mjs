// Builds src/data/wordsearch.json: one word search per unit from Al-Kitaab part 1, hiding most of the unit's words
// (data/crossword/candidates.json has them). Bigger grids and more directions later in the course.
//   node scripts/build-wordsearch.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { layoutWordSearch } from "./lib/wordsearch-layout.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidates = JSON.parse(fs.readFileSync(path.join(root, "data/crossword/candidates.json"), "utf8"));

const order = (u) => u.match(/\d+/g).map(Number);
const levelOf = (book, unit) => (book === 2 && unit <= 4 ? "easy" : book === 2 && unit <= 11 ? "medium" : "hard");

function pick(list, cap, seed) {
  // one entry per answer; short words first, then the rest in a fixed shuffled order
  const seen = new Set();
  const unique = list.filter((c) => !seen.has(c.answer) && seen.add(c.answer));
  let s = seed;
  const rand = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const shuffled = unique.map((c) => ({ c, k: rand() })).sort((a, b) => a.k - b.k).map((x) => x.c);
  const short = shuffled.filter((c) => c.answer.length <= 7);
  const long = shuffled.filter((c) => c.answer.length > 7);
  return [...short, ...long].slice(0, cap);
}

const out = {};
for (const unit of Object.keys(candidates).sort((a, b) => order(a)[0] - order(b)[0] || order(a)[1] - order(b)[1])) {
  const [book, u] = order(unit);
  const total = new Set(candidates[unit].map((c) => c.answer)).size;
  // most of the unit's words (all of them in small units), in a grid that grows with their number
  const cap = Math.min(total, book === 2 ? 28 : 34);
  const size = cap <= 14 ? 11 : cap <= 20 ? 12 : cap <= 26 ? 13 : cap <= 30 ? 14 : 15;
  const chosen = pick(candidates[unit], cap, book * 100 + u).map((c) => ({ answer: c.answer, arabic: c.arabic, english: c.english }));
  const puzzle = layoutWordSearch(chosen, { size, level: levelOf(book, u), seed: book * 100 + u, tries: 500 });
  const { left, ...keep } = puzzle;
  out[unit] = keep;
  console.log(unit, `${size}x${size}`, levelOf(book, u), `hidden ${keep.words.length}/${chosen.length} of ${total}`, left.length ? `(left out: ${left.join(" ")})` : "");
}
fs.writeFileSync(path.join(root, "src/data/wordsearch.json"), JSON.stringify(out, null, 1) + "\n");
console.log("units:", Object.keys(out).length);

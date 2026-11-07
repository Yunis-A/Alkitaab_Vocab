// Builds src/data/crosswords.json from the clue files (data/crossword/clues-*.json): lays each unit's words out as a
// crossword grid. The puzzles are static: one per unit, from Al-Kitaab part 1.
//   node scripts/build-crosswords.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { layoutCrossword } from "./lib/crossword-layout.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "data/crossword");

const clues = {};
for (const f of fs.readdirSync(dir).filter((x) => /^clues-.*\.json$/.test(x)).sort()) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  for (const [unit, entries] of Object.entries(data)) clues[unit] = [...(clues[unit] ?? []), ...entries];
}

const out = {};
const order = (u) => u.match(/\d+/g).map(Number);
for (const unit of Object.keys(clues).sort((a, b) => order(a)[0] - order(b)[0] || order(a)[1] - order(b)[1])) {
  const seen = new Set();
  const words = clues[unit].filter((e) => !seen.has(e.answer) && seen.add(e.answer)).map((e) => ({ answer: e.answer, clue: e.clue }));
  const puzzle = layoutCrossword(words, { seed: 7, tries: 800 });
  const { unplaced, ...keep } = puzzle;
  out[unit] = keep;
  console.log(unit, `${keep.rows}x${keep.cols}`, `placed ${new Set(keep.entries.map((e) => e.answer)).size}/${words.length}`, unplaced.length ? `(left out: ${unplaced.join(" ")})` : "");
}
fs.writeFileSync(path.join(root, "src/data/crosswords.json"), JSON.stringify(out, null, 1) + "\n");
console.log("units:", Object.keys(out).length);

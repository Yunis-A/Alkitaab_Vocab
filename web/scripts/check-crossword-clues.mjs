// Checks crossword clue files: the answers belong to the unit, the clue does not give the answer away, every Arabic
// word of a clue is a word the student knows by that unit (an error otherwise), and the units have the right amount of
// English: part 1 lessons 1-4 may be mostly English, lessons 5-11 up to 40%, later units up to 15% (an error beyond).
//   node scripts/check-crossword-clues.mjs data/crossword/clues-1.json [more files...]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isKnown, knownByUnit, norm, tokens } from "./lib/crossword-known.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const words = JSON.parse(fs.readFileSync(path.join(root, "private/words.json"), "utf8"));
const candidates = JSON.parse(fs.readFileSync(path.join(root, "data/crossword/candidates.json"), "utf8"));
const known = knownByUnit(words, Object.keys(candidates));

// the share of clues that may be in English (a clue with Latin letters)
function englishShare(unit) {
  const [book, u] = unit.match(/\d+/g).map(Number);
  if (book === 2 && u <= 4) return 1;
  if (book === 2 && u <= 11) return 0.4;
  return 0.15;
}

let errors = 0;
let warnings = 0;
for (const file of process.argv.slice(2)) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [unit, entries] of Object.entries(data)) {
    const say = (kind, msg) => { console.log(`${kind} ${unit}: ${msg}`); if (kind === "ERROR") errors++; else warnings++; };
    const cands = candidates[unit];
    if (!cands) { say("ERROR", "unknown unit"); continue; }
    const byAnswer = new Map(cands.map((c) => [norm(c.answer), c]));
    const seen = new Set();
    if (entries.length < 8) say("WARN", `only ${entries.length} clues (aim for 12 or more)`);
    for (const e of entries) {
      const a = norm(e.answer);
      if (!byAnswer.has(a)) { say("ERROR", `${e.answer} is not a candidate answer of this unit`); continue; }
      if (seen.has(a)) say("ERROR", `${e.answer} appears twice`);
      seen.add(a);
      const clue = String(e.clue ?? "").trim();
      if (!clue) { say("ERROR", `${e.answer}: no clue`); continue; }
      if (/[0-9]/.test(clue)) { say("ERROR", `${e.answer}: no digits in a clue`); continue; }
      if (/[A-Za-z]/.test(clue) && /[ء-ي]/.test(clue)) say("WARN", `${e.answer}: mixes English and Arabic`);
      const toks = tokens(clue).map(norm);
      if (toks.some((t) => t === a || (a.length >= 4 && t.includes(a)))) say("ERROR", `${e.answer}: the clue contains the answer`);
      if (clue.length > 70) say("WARN", `${e.answer}: long clue (${clue.length})`);
      const unknown = tokens(clue).filter((t) => !isKnown(t, known[unit]));
      if (unknown.length) say("ERROR", `${e.answer}: not known by this unit: ${unknown.join(" ")}`);
    }
    const english = entries.filter((e) => /[A-Za-z]/.test(e.clue ?? "")).length;
    if (entries.length && english / entries.length > englishShare(unit) + 1e-9) {
      say("ERROR", `${english} of ${entries.length} clues are English; at most ${Math.floor(englishShare(unit) * entries.length)} may be`);
    }
  }
}
console.log(`${errors} errors, ${warnings} warnings`);
process.exit(errors ? 1 : 0);

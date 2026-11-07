// Checks crossword clue files: the answers belong to the unit, the clue does not give the answer away, and the
// words of a clue are words the student knows by that unit (warnings list the ones that are not).
//   node scripts/check-crossword-clues.mjs data/crossword/clues-1.json [more files...]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isKnown, knownByUnit, norm, tokens } from "./lib/crossword-known.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const words = JSON.parse(fs.readFileSync(path.join(root, "src/data/words.json"), "utf8"));
const candidates = JSON.parse(fs.readFileSync(path.join(root, "data/crossword/candidates.json"), "utf8"));
const known = knownByUnit(words, Object.keys(candidates));

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
      if (!clue || /[A-Za-z0-9]/.test(clue)) { say("ERROR", `${e.answer}: the clue must be Arabic only`); continue; }
      const toks = tokens(clue).map(norm);
      if (toks.some((t) => t === a || (a.length >= 4 && t.includes(a)))) say("ERROR", `${e.answer}: the clue contains the answer`);
      if (clue.length > 70) say("WARN", `${e.answer}: long clue (${clue.length})`);
      const unknown = tokens(clue).filter((t) => !isKnown(t, known[unit]));
      if (unknown.length) say("WARN", `${e.answer}: not known by this unit: ${unknown.join(" ")}`);
    }
  }
}
console.log(`${errors} errors, ${warnings} warnings`);
process.exit(errors ? 1 : 0);

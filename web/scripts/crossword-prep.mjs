// Prepares the crossword work: the words each unit offers as answers (data/crossword/candidates.json).
//   node scripts/crossword-prep.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripDiacritics } from "../src/lib/arabic.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const words = JSON.parse(fs.readFileSync(path.join(root, "src/data/words.json"), "utf8"));

const per = {};
for (const w of words) {
  if (w.book < 2 || !w.arabic || w.custom) continue;
  if (!["noun", "verb", "adjective", "adverb"].includes(w.pos)) continue;
  // the answer is the bare word: ال is left off (الأدب -> ادب)
  let answer = stripDiacritics(w.arabic).replace(/[أإآٱ]/g, "ا");
  if (answer.startsWith("ال") && answer.length - 2 >= 3) answer = answer.slice(2);
  if (!/^[ء-ي]+$/.test(answer) || answer.length < 3 || answer.length > 9) continue;
  const key = `b${w.book}-u${w.unit}`;
  (per[key] ??= []).push({ id: w.id, answer, arabic: w.arabic, english: w.definition, pos: w.pos });
}
fs.mkdirSync(path.join(root, "data/crossword"), { recursive: true });
fs.writeFileSync(path.join(root, "data/crossword/candidates.json"), JSON.stringify(per, null, 1));
console.log(Object.keys(per).length, "units;", Object.values(per).flat().length, "candidate answers");

// Which dictionary page (unvoweled past 3ms) belongs to a verb row? Shared by
// fetch-conjugations.mjs and verify-roots.mjs.
//
// Order: the hand-made map (data/past-forms.json), the overridden headword, the listed past form,
// then the headword if it looks like a past 3ms (not a present or inflected form).
// Returns { title, listedPast, skip } where skip means "deliberately no lookup".

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripDiacritics } from "../../src/lib/arabic.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manual = JSON.parse(fs.readFileSync(path.join(root, "data/past-forms.json"), "utf8"));
const patches = JSON.parse(fs.readFileSync(path.join(root, "scripts/overrides.json"), "utf8")).patch ?? {};
const clean = (s) => stripDiacritics(s).replace(/ـ/g, "");

export function pastTitle(id, e) {
  if (id in manual) return manual[id] === null ? { title: null, listedPast: null, skip: true } : { title: manual[id], listedPast: null, skip: false };
  const overridden = patches[id]?.arabic;
  let listedPast = e?.msa?.past ?? null;
  if (overridden) return { title: clean(overridden).split(" ")[0], listedPast: overridden.split(" ")[0], skip: false };
  if (listedPast) return { title: clean(listedPast).split(" ")[0], listedPast, skip: false };
  const head = e?.msa?.head ?? "";
  const bare = clean(head).split(" ")[0];
  if (bare.length >= 3 && !/^ي/.test(bare) && !/[تن]$/.test(bare)) return { title: bare, listedPast: head.split(" ")[0], skip: false };
  return { title: null, listedPast: null, skip: false };
}

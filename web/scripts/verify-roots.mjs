// Checks every word's root against Wiktionary's entry for that word.
//
//   node scripts/verify-roots.mjs
//
// Writes data/root-check.json (read by `build`) and data/root-check.csv.
//   confirmed  our root is one of the roots Wiktionary lists for the entry
//   differs    Wiktionary lists other root(s)
//   no-page    no entry (or no root on it): nothing to check against
// Wiktionary content is CC BY-SA 4.0.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "./import-vocab.mjs";
import { stripDiacritics, rootKey } from "../src/lib/arabic.js";
import { rawPages, rootsOnPage } from "./lib/wiktionary.mjs";
import { pastTitle } from "./lib/past-title.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const words = JSON.parse(fs.readFileSync(path.join(root, "private/words.json"), "utf8"));
const parsed = new Map(load().entries.map((e) => [e.id, e]));
const enrichment = JSON.parse(fs.readFileSync(path.join(root, "data/enrichment.json"), "utf8"));

const clean = (s) => stripDiacritics(s).replace(/ـ/g, "").trim();

// Dictionary page for a word: unvoweled past for verbs, the headword for everything else.
function titleFor(w) {
  const e = parsed.get(w.id);
  if (w.pos === "verb") return pastTitle(w.id, e).title;
  if (!w.arabic || /\s/.test(w.arabic)) return null;
  return clean(w.arabic).replace(/^ال(?=.{3})/, "");
}

const todo = words.filter((w) => w.root).map((w) => ({ w, title: titleFor(w) }));
const titles = todo.map((x) => x.title).filter(Boolean);
console.log("words with a root:", todo.length, "| distinct pages to read:", new Set(titles).size);

const pages = await rawPages(titles);
const results = {};
const rows = [];
let confirmed = 0, differs = 0, nopage = 0;

for (const { w, title } of todo) {
  const uncertain = (enrichment[w.id]?.flags ?? []).includes("root-uncertain");
  let status = "no-page", roots = [];
  if (title) {
    const raw = pages.get(title);
    roots = raw ? rootsOnPage(raw) : [];
    if (roots.length) status = roots.some((r) => rootKey(r) === rootKey(w.root)) ? "confirmed" : "differs";
  }
  results[w.id] = { title, status, roots, ours: w.root, uncertain };
  if (status === "confirmed") confirmed++; else if (status === "differs") differs++; else nopage++;
  if (status !== "confirmed" || uncertain) rows.push([w.id, w.definition, w.arabic ?? "", w.root, status, roots.join(" | "), uncertain ? "uncertain" : ""]);
}

fs.writeFileSync(path.join(root, "data/root-check.json"), JSON.stringify(results, null, 1));
const csvCell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v);
fs.writeFileSync(path.join(root, "data/root-check.csv"), "﻿" + ["id,english,arabic,our_root,status,wiktionary_roots,flag", ...rows.map((r) => r.map(csvCell).join(","))].join("\n") + "\n");

console.log({ confirmed, differs, "no-page": nopage });
const u = Object.values(results).filter((r) => r.uncertain);
console.log("previously uncertain:", u.length, "| now confirmed:", u.filter((r) => r.status === "confirmed").length, "| differs:", u.filter((r) => r.status === "differs").length, "| no page:", u.filter((r) => r.status === "no-page").length);

// Looks up full conjugations of irregular verbs (weak, hamzated, doubled,
// quadriliteral, Form VIII with assimilation) on Wiktionary and saves them to
// data/conjugations.json. `build` then stores them on the words.
//
//   node scripts/fetch-conjugations.mjs [--limit N] [--only id,id]
//
// Each result records where it came from and how well it matches the form
// listed in the vocabulary file, so wrong picks are easy to spot.
// Wiktionary content is CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "./import-vocab.mjs";
import { getForms } from "../src/lib/morphology.js";
import { stripDiacritics, rootKey, rootLetters } from "../src/lib/arabic.js";
import { rawPage, entriesOnPage, renderConj, formNumber } from "./lib/wiktionary.mjs";
import { pastTitle } from "./lib/past-title.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const words = JSON.parse(fs.readFileSync(path.join(root, "src/data/words.json"), "utf8"));
const { entries } = load();
const parsed = new Map(entries.map((e) => [e.id, e]));

const loose = (s) => stripDiacritics(s ?? "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ـ/g, "");
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const only = arg("--only")?.split(",");
const limit = Number(arg("--limit") ?? Infinity);

const todo = words.filter((w) => w.pos === "verb" && w.root && w.form && !getForms(w).regular && (!only || only.includes(w.id))).slice(0, limit);
console.log("irregular verbs to look up:", todo.length);

const out = fs.existsSync(path.join(root, "data/conjugations.json")) ? JSON.parse(fs.readFileSync(path.join(root, "data/conjugations.json"), "utf8")) : {};
const report = [];

for (const w of todo) {
  const e = parsed.get(w.id);
  const listedPresent = e?.msa?.present ?? null;
  const clean = (s) => stripDiacritics(s).replace(/ـ/g, "");

  // Dictionary page = unvoweled past 3ms. Order: the hand-made map, then the listed past form,
  // then the headword when it looks like a past 3ms (not a present or first-person form).
  const { title, listedPast, skip } = pastTitle(w.id, e);
  if (skip) { report.push([w.id, w.definition, w.arabic, "skipped-by-design", ""]); continue; }
  if (!title) { report.push([w.id, w.definition, w.arabic, "no-past-form-listed", ""]); continue; }

  const raw = await rawPage(title);
  if (raw === undefined) { report.push([w.id, w.definition, title, "network-error", ""]); continue; }
  if (raw === null) { report.push([w.id, w.definition, title, "no-wiktionary-page", ""]); continue; }

  const all = entriesOnPage(raw);
  const mine = rootKey(w.root);
  // four-letter roots are filed as "Iq" (quadriliteral form I)
  const sameForm = (c) => (rootLetters(w.root).length === 4 ? c.conj.form === "Iq" : formNumber(c.conj.form) === w.form);
  let cands = all.filter((c) => c.root && rootKey(c.root) === mine && sameForm(c));
  let rootNote = "";
  if (!cands.length) {
    cands = all.filter(sameForm);
    if (cands.length) rootNote = `wiktionary-root:${[...new Set(cands.map((c) => c.root))].join("/")}`;
  }
  if (!cands.length) { report.push([w.id, w.definition, title, "no-matching-form-on-page", all.map((c) => `${c.root}:${c.conj.form}`).join(" ")]); continue; }

  let best = null;
  for (const c of cands) {
    const t = await renderConj(title, c.conj.args);
    if (!t?.past) continue;
    const score = (listedPast && loose(t.past["3ms"]) === loose(listedPast) ? 1 : 0) + (listedPresent && loose(t.present?.["3ms"]) === loose(listedPresent) ? 1 : 0);
    // prefer the candidate whose past form matches the title we looked up
    const titleHit = loose(t.past["3ms"]) === loose(title) ? 0.5 : 0;
    if (!best || score + titleHit > best.score + best.titleHit) best = { score, titleHit, t, c };
  }
  if (!best) { report.push([w.id, w.definition, title, "could-not-render", ""]); continue; }

  const { t, c, score } = best;
  const expected = (listedPast ? 1 : 0) + (listedPresent ? 1 : 0);
  // with nothing listed to compare, the table is trusted when its past form is the page we asked for
  const unlisted = expected === 0 && loose(t.past["3ms"]) === loose(title);
  out[w.id] = {
    title, root: c.root, args: c.conj.args, match: unlisted || (expected > 0 && score >= expected) ? "exact" : score > 0 ? "partial" : "none",
    past: t.past, present: t.present, subjunctive: t.subjunctive, jussive: t.jussive, imperative: t.imperative,
    masdar: t.masdar, activeParticiple: t.activeParticiple, passiveParticiple: t.passiveParticiple,
  };
  if ((expected > 0 && score < expected) || rootNote) report.push([w.id, w.definition, title, expected > 0 && score < expected ? `listed-form-differs(${loose(listedPast ?? "")}/${loose(listedPresent ?? "")} vs ${loose(t.past["3ms"])}/${loose(t.present?.["3ms"])})` : "ok", rootNote]);
}

fs.writeFileSync(path.join(root, "data/conjugations.json"), JSON.stringify(out, null, 1));
const csv = ["id,english,title,problem,note", ...report.map((r) => r.map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(","))].join("\n");
fs.writeFileSync(path.join(root, "data/conjugation-report.csv"), "﻿" + csv + "\n");

const found = Object.keys(out).length;
const kinds = {};
for (const r of report) kinds[r[3].split("(")[0]] = (kinds[r[3].split("(")[0]] ?? 0) + 1;
console.log("stored:", found, "of", todo.length, "| exact:", Object.values(out).filter((o) => o.match === "exact").length, "| report rows:", report.length, kinds);

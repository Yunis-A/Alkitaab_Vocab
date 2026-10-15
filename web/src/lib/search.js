// Search over words by Arabic (with or without diacritics), root,
// transliteration, definition, or any generated/stored inflected form.
// Dialect forms are searched only for the dialects the student has enabled.

import { normalizeArabic, normalizeLatin, hasArabic, rootKey, stripDiacritics } from "./arabic.js";
import { getForms } from "./morphology.js";
import { DIALECTS } from "./varieties.js";

const splitList = (s) => String(s ?? "").split(/\s*\/\s*|\s*[،,]\s*/).filter(Boolean);

function collectForms(word) {
  const f = getForms(word);
  const out = [];
  // Imperatives are hidden until Al-Kitaab part 3, so they are not searchable.
  for (const tense of ["past", "present"]) {
    if (f[tense]) out.push(...Object.values(f[tense]));
  }
  if (f.masdar) out.push(...f.masdar);
  for (const p of [f.activeParticiple, f.passiveParticiple]) {
    if (p) out.push(...Object.values(p));
  }
  if (f.plural) out.push(...splitList(f.plural));
  if (word.feminine) out.push(word.feminine);
  return out;
}

function dialectForms(d) {
  if (!d) return { head: "", forms: [] };
  const all = [d.past, d.present, d.masdar, ...splitList(d.plural), d.feminine, ...(d.alternates ?? [])].filter(Boolean);
  return { head: normalizeArabic(d.arabic ?? ""), forms: all.map(normalizeArabic) };
}

export function buildIndex(words) {
  return words.map((word) => ({
    word,
    arabic: normalizeArabic(word.arabic ?? ""),
    root: rootKey(word.root ?? ""),
    forms: collectForms(word).map(normalizeArabic),
    dialect: Object.fromEntries(DIALECTS.map((d) => [d, dialectForms(word[d])])),
    translit: normalizeLatin(word.transliteration),
    definition: normalizeLatin(word.definition),
  }));
}

function arabicScore(entry, qa, qRoot, dialects) {
  let best = 0;
  const up = (n) => { if (n > best) best = n; };

  if (entry.arabic) {
    if (entry.arabic === qa) up(100);
    else if (entry.root && entry.root === qRoot) up(90);
    else if (entry.forms.includes(qa)) up(80);
    else if (entry.arabic.startsWith(qa)) up(70);
    else if (entry.root && qRoot.length >= 2 && entry.root.includes(qRoot)) up(60);
    else if (entry.arabic.includes(qa) || entry.forms.some((f) => f.includes(qa))) up(50);
  } else if (entry.root && entry.root === qRoot) {
    up(90);
  }

  for (const d of DIALECTS) {
    if (!dialects[d]) continue;
    const { head, forms } = entry.dialect[d];
    if (head && head === qa) up(95);
    else if (forms.includes(qa)) up(75);
    else if (head && head.startsWith(qa)) up(65);
    else if (head.includes(qa) || forms.some((f) => f.includes(qa))) up(45);
  }
  return best;
}

function latinScore(entry, ql) {
  if (entry.translit === ql) return 100;
  if (entry.definition === ql) return 95;
  if (entry.definition.split(/[;,]\s*/).includes(ql)) return 90;
  if (entry.translit.startsWith(ql)) return 70;
  if (entry.definition.startsWith(ql)) return 65;
  if (entry.translit.includes(ql)) return 50;
  if (entry.definition.includes(ql)) return 40;
  return 0;
}

// `dialects`: { egyptian: bool, shami: bool }. Returns words, best match first.
export function search(index, query, dialects = {}) {
  const raw = String(query ?? "").trim();
  if (!raw) return index.map((e) => e.word);

  const arabic = hasArabic(raw);
  const qa = arabic ? normalizeArabic(raw) : "";
  const qRoot = arabic ? rootKey(raw) : "";
  const ql = normalizeLatin(raw);

  return index
    .map((e) => ({ e, s: arabic ? arabicScore(e, qa, qRoot, dialects) : latinScore(e, ql) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.e.word.book - b.e.word.book || a.e.word.unit - b.e.word.unit)
    .map((x) => x.e.word);
}

export function wordsByRoot(words, root) {
  const r = rootKey(root);
  return words.filter((w) => rootKey(w.root ?? "") === r);
}

export { stripDiacritics };

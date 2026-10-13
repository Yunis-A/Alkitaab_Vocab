// Search over words by Arabic (with or without diacritics), root,
// transliteration, definition, or any generated/stored inflected form.

import { normalizeArabic, normalizeLatin, hasArabic, normalizeRootText, stripDiacritics } from "./arabic.js";
import { getForms } from "./morphology.js";

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
  if (f.plural) out.push(f.plural);
  return out;
}

export function buildIndex(words) {
  return words.map((word) => ({
    word,
    arabic: normalizeArabic(word.arabic),
    root: normalizeRootText(word.root),
    forms: collectForms(word).map(normalizeArabic),
    translit: normalizeLatin(word.transliteration),
    definition: normalizeLatin(word.definition),
  }));
}

// Higher = better match. 0 = no match.
function score(entry, qa, qRoot, ql) {
  if (qa) {
    if (entry.arabic === qa) return 100;
    if (entry.root && entry.root === qRoot) return 90;
    if (entry.forms.includes(qa)) return 80;
    if (entry.arabic.startsWith(qa)) return 70;
    if (entry.root && qRoot.length >= 2 && entry.root.includes(qRoot)) return 60;
    if (entry.arabic.includes(qa) || entry.forms.some((f) => f.includes(qa))) return 50;
    return 0;
  }
  if (entry.translit === ql) return 100;
  if (entry.definition === ql) return 95;
  if (entry.definition.split(/[;,]\s*/).includes(ql)) return 90;
  if (entry.translit.startsWith(ql)) return 70;
  if (entry.definition.startsWith(ql)) return 65;
  if (entry.translit.includes(ql)) return 50;
  if (entry.definition.includes(ql)) return 40;
  return 0;
}

export function search(index, query) {
  const raw = String(query ?? "").trim();
  if (!raw) return index.map((e) => e.word);

  const qa = hasArabic(raw) ? normalizeArabic(raw) : "";
  const qRoot = qa ? normalizeRootText(qa) : "";
  const ql = normalizeLatin(raw);

  return index
    .map((e) => ({ e, s: score(e, qa, qRoot, ql) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.e.word.book - b.e.word.book || a.e.word.unit - b.e.word.unit)
    .map((x) => x.e.word);
}

export function wordsByRoot(words, root) {
  const r = normalizeRootText(root);
  return words.filter((w) => normalizeRootText(w.root) === r);
}

export { stripDiacritics };

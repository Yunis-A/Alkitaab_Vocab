// Search over words by Arabic (with or without diacritics), root,
// transliteration, definition, or any generated/stored inflected form.
// Dialect forms are searched only for the dialects the student has enabled.

import { normalizeArabic, normalizeLatin, hasArabic, rootKey, stripDiacritics } from "./arabic.js";
import { getForms } from "./morphology.js";
import { DIALECTS } from "./varieties.js";
import { PLURAL_FROM, levelReached } from "../config/books.js";

const splitList = (s) => String(s ?? "").split(/\s*\/\s*|\s*[،,]\s*/).filter(Boolean);

function collectForms(word) {
  // dialect-only words have no MSA forms to search
  if (!word.arabic) return [];
  const f = getForms(word);
  const out = [];
  if (word.present) out.push(word.present);
  // Imperatives are hidden until Al-Kitaab part 3, so they are not searchable.
  for (const tense of ["past", "present"]) {
    if (f[tense]) out.push(...Object.values(f[tense]));
  }
  if (f.masdar) out.push(...f.masdar);
  for (const p of [f.activeParticiple, f.passiveParticiple]) {
    if (p) out.push(...Object.values(p));
  }
  if (word.feminine) out.push(word.feminine);
  return out;
}

function dialectForms(d) {
  if (!d) return { head: "", forms: [], plurals: [] };
  const all = [d.past, d.present, d.masdar, d.feminine, ...(d.alternates ?? [])].filter(Boolean);
  return { head: normalizeArabic(d.arabic ?? ""), forms: all.map(normalizeArabic), plurals: splitList(d.plural).map(normalizeArabic) };
}

// The plurals of a word (found only once they are learned).
function pluralsOf(word) {
  return word.arabic ? splitList(getForms(word).plural).map(normalizeArabic) : [];
}

export function buildIndex(words) {
  return words.map((word) => ({
    word,
    arabic: normalizeArabic(word.arabic ?? ""),
    root: rootKey(word.root ?? ""),
    forms: collectForms(word).map(normalizeArabic),
    plurals: pluralsOf(word),
    dialect: Object.fromEntries(DIALECTS.map((d) => [d, dialectForms(word[d])])),
    translit: normalizeLatin(word.transliteration),
    definition: normalizeLatin(word.definition),
  }));
}

function arabicScore(entry, qa, qRoot, dialects, plurals) {
  let best = 0;
  const up = (n) => { if (n > best) best = n; };

  if (entry.arabic) {
    if (entry.arabic === qa) up(100);
    else if (entry.root && entry.root === qRoot) up(90);
    else if (entry.forms.includes(qa) || (plurals && entry.plurals.includes(qa))) up(80);
    else if (entry.arabic.startsWith(qa)) up(70);
    else if (entry.root && qRoot.length >= 2 && entry.root.includes(qRoot)) up(60);
    else if (entry.arabic.includes(qa) || entry.forms.some((f) => f.includes(qa)) || (plurals && entry.plurals.some((f) => f.includes(qa)))) up(50);
  } else if (entry.root && entry.root === qRoot) {
    up(90);
  }

  for (const d of DIALECTS) {
    if (!dialects[d]) continue;
    const { head, forms } = entry.dialect[d];
    if (head && head === qa) up(95);
    else if (forms.includes(qa) || (plurals && entry.dialect[d].plurals.includes(qa))) up(75);
    else if (head && head.startsWith(qa)) up(65);
    else if (head.includes(qa) || forms.some((f) => f.includes(qa)) || (plurals && entry.dialect[d].plurals.some((f) => f.includes(qa)))) up(45);
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

// Lesson order for lists: "oldest" is curriculum order, "newest" puts the latest lesson first.
// Within one lesson the words keep their order from the list.
function lessonOrder(order) {
  return order === "newest"
    ? (a, b) => b.word.book - a.word.book || b.word.unit - a.word.unit || a.i - b.i
    : (a, b) => a.word.book - b.word.book || a.word.unit - b.word.unit || a.i - b.i;
}

// `dialects`: { egyptian: bool, shami: bool }. `level`: the student's level; plurals are searchable once learned.
// `order`: "oldest" (default) or "newest"; with no query it orders the whole list, with a query
// the best match still comes first and the order only breaks ties.
export function search(index, query, dialects = {}, order = "oldest", level = null) {
  const plurals = !level || levelReached(level, PLURAL_FROM);
  const byLesson = lessonOrder(order);
  const raw = String(query ?? "").trim();
  if (!raw) return index.map((e, i) => ({ word: e.word, i })).sort(byLesson).map((x) => x.word);

  const arabic = hasArabic(raw);
  const qa = arabic ? normalizeArabic(raw) : "";
  const qRoot = arabic ? rootKey(raw) : "";
  const ql = normalizeLatin(raw);

  return index
    .map((e, i) => ({ word: e.word, i, s: arabic ? arabicScore(e, qa, qRoot, dialects, plurals) : latinScore(e, ql) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || byLesson(a, b))
    .map((x) => x.word);
}

export function wordsByRoot(words, root) {
  const r = rootKey(root);
  return words.filter((w) => rootKey(w.root ?? "") === r);
}

export { stripDiacritics };

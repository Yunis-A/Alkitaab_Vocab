// Filters for the Lookup page. Pure functions, state lives in the URL.
//
// filters = { pos, from, to, form, gender, status, dialect }, all strings ("" = no filter).
//   pos      noun | verb | adjective | ...
//   from/to  lesson keys "book.unit" (inclusive); a reversed range is swapped
//   form     verb form number as a string ("1".."10")
//   gender   masculine | feminine
//   status   new | learning | proficient | mastered
//   dialect  egyptian | shami   (the word has a form in that dialect)

import { compareLevel } from "../config/books.js";

export const FILTER_KEYS = ["pos", "from", "to", "form", "gender", "status", "dialect"];

export const levelKey = ({ book, unit }) => `${book}.${unit}`;

export function parseLevelKey(key) {
  const m = /^(\d+)\.(\d+)$/.exec(key ?? "");
  return m ? { book: Number(m[1]), unit: Number(m[2]) } : null;
}

export function filtersFromParams(params) {
  return Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? ""]));
}

export function activeFilterCount(f) {
  return FILTER_KEYS.filter((k) => f[k]).length;
}

// Every lesson up to the student's level, in curriculum order.
export function levelsUpTo(level, books) {
  const out = [];
  for (let b = 1; b <= level.book; b++) {
    const last = b === level.book ? level.unit : books[b].maxUnits;
    for (let u = 1; u <= last; u++) out.push({ book: b, unit: u });
  }
  return out;
}

export function filterWords(words, f, { statusOf } = {}) {
  let from = parseLevelKey(f.from);
  let to = parseLevelKey(f.to);
  if (from && to && compareLevel(from, to) > 0) [from, to] = [to, from];

  return words.filter((w) => {
    if (f.pos && w.pos !== f.pos) return false;
    if (from && compareLevel(w, from) < 0) return false;
    if (to && compareLevel(w, to) > 0) return false;
    if (f.form && String(w.form) !== f.form) return false;
    if (f.gender && w.gender !== f.gender) return false;
    if (f.dialect && !w[f.dialect]) return false;
    if (f.status && statusOf && statusOf(w.id) !== f.status) return false;
    return true;
  });
}

// Which choices to offer: only values that actually occur in these words.
export function filterOptions(words) {
  const count = (get) => {
    const m = new Map();
    for (const w of words) { const v = get(w); if (v != null && v !== "") m.set(v, (m.get(v) ?? 0) + 1); }
    return m;
  };
  return { pos: count((w) => w.pos), form: count((w) => w.form), gender: count((w) => w.gender) };
}

import { useApp } from "../context/AppContext.jsx";
import { books } from "../config/books.js";
import { levelKey, levelsUpTo } from "../lib/filters.js";

// Checkboxes for the units up to the student's level, grouped by book. Ticking a book's name ticks all of
// its units. `value` is a Set of level keys ("book.unit").
export default function UnitPicker({ value, onChange, skipBooks = [] }) {
  const { level, nf, bookName } = useApp();
  const byBook = new Map();
  for (const l of levelsUpTo(level, books)) {
    if (!byBook.has(l.book)) byBook.set(l.book, []);
    byBook.get(l.book).push(l);
  }
  // newest book first, like the lookup filters
  const groups = [...byBook.entries()].filter(([book]) => !skipBooks.includes(book)).reverse();

  const toggle = (keys, on) => {
    const next = new Set(value);
    for (const k of keys) (on ? next.add(k) : next.delete(k));
    onChange(next);
  };

  return (
    <div className="unit-picker">
      {groups.map(([book, lessons]) => {
        const keys = lessons.map(levelKey);
        const all = keys.every((k) => value.has(k));
        return (
          <fieldset key={book}>
            <legend>
              <label>
                <input type="checkbox" checked={all} onChange={(e) => toggle(keys, e.target.checked)} />{" "}
                <bdi>{bookName(book)}</bdi>
              </label>
            </legend>
            <div className="unit-boxes">
              {lessons.map((l) => {
                const k = levelKey(l);
                return (
                  <label key={k} className="unit-box">
                    <input type="checkbox" checked={value.has(k)} onChange={(e) => toggle([k], e.target.checked)} />
                    <span>{nf(l.unit)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

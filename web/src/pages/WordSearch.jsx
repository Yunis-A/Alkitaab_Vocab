import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import wordsearches from "../data/wordsearch.json";
import { books } from "../config/books.js";
import { glossMode, lineBetween, searchId, wordCells, wordOnLine } from "../lib/wordsearch.js";

// One word search per unit, from Al-Kitaab part 1: pick the unit, then find the words. Tap the first letter of a
// word and then its last letter; a found word stays marked and is struck through in the list.
export default function WordSearch({ onExit }) {
  const { t, bookName, unitLabel, level, wordSearchesDone } = useApp();
  const [unit, setUnit] = useState(null);

  if (unit) return <Puzzle id={searchId(unit.book, unit.unit)} book={unit.book} unit={unit.unit} onExit={() => setUnit(null)} />;

  const groups = [];
  for (let b = level.book; b >= 2; b--) {
    const last = b === level.book ? level.unit : books[b].maxUnits;
    const units = [];
    for (let u = 1; u <= last; u++) if (wordsearches[searchId(b, u)]) units.push(u);
    if (units.length) groups.push({ book: b, units });
  }

  return (
    <main className="page narrow">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
      </div>
      <section className="card">
        <h2><bdi>{t("wordSearchTitle")}</bdi></h2>
        {groups.map((g) => (
          <fieldset key={g.book} className="cross-units">
            <legend><bdi>{bookName(g.book)}</bdi></legend>
            <div className="unit-boxes">
              {g.units.map((u) => {
                const done = wordSearchesDone[searchId(g.book, u)];
                return (
                  <button key={u} type="button" className={`cross-unit${done ? " done" : ""}`} onClick={() => setUnit({ book: g.book, unit: u })}>
                    <bdi>{done ? "✓ " : ""}{unitLabel(g.book, u)}</bdi>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </section>
    </main>
  );
}

export function Puzzle({ id, book, unit, onExit }) {
  const { t, nf, finishWordSearch } = useApp();
  const puzzle = wordsearches[id];
  const [start, setStart] = useState(null); // the first cell tapped
  const [found, setFound] = useState([]); // answers found
  const [miss, setMiss] = useState(null); // a wrong second tap flashes
  const gloss = glossMode(book, unit);

  const foundCells = useMemo(() => {
    const map = new Map();
    puzzle.words.filter((w) => found.includes(w.answer)).forEach((w, i) => wordCells(w).forEach(({ r, c }) => map.set(`${r},${c}`, i % 6)));
    return map;
  }, [puzzle, found]);

  const tap = (r, c) => {
    if (!start) { setStart({ r, c }); return; }
    if (start.r === r && start.c === c) { setStart(null); return; } // tapping it again cancels
    const word = wordOnLine(puzzle, lineBetween(start, { r, c }));
    if (word && !found.includes(word.answer)) {
      const next = [...found, word.answer];
      setFound(next);
      if (next.length === puzzle.words.length) finishWordSearch(id);
      setStart(null);
    } else {
      setMiss({ r, c });
      setTimeout(() => setMiss(null), 350);
      setStart({ r, c }); // the new tap becomes the start of the next try
    }
  };

  const all = found.length === puzzle.words.length;
  return (
    <main className="page ws-page">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
        <span className="muted"><bdi>{nf(found.length)} / {nf(puzzle.words.length)}</bdi></span>
      </div>
      {all && <p className="auth-info cross-done"><bdi>{t("wordSearchDone")}</bdi></p>}

      <div className="ws-layout">
        <div className="ws-grid" dir="rtl" style={{ gridTemplateColumns: `repeat(${puzzle.cols}, var(--cell))` }}>
          {puzzle.grid.flatMap((row, r) => [...row].map((ch, c) => {
            const key = `${r},${c}`;
            const cls = ["ws-cell", foundCells.has(key) ? `found f${foundCells.get(key)}` : "", start && start.r === r && start.c === c ? "start" : "", miss && miss.r === r && miss.c === c ? "miss" : ""].join(" ");
            return <button key={key} type="button" tabIndex={-1} className={cls} onClick={() => tap(r, c)}><span className="ar">{ch}</span></button>;
          }))}
        </div>

        <ul className="ws-words">
          {puzzle.words.map((w) => (
            <li key={w.answer} className={found.includes(w.answer) ? "done" : ""}>
              <span className="ar" dir="rtl">{w.arabic}</span>
              {gloss !== "none" && <small className={`ws-gloss ${gloss}`} dir="auto">{w.english}</small>}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

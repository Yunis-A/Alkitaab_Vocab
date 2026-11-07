import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useShiftHeld } from "../hooks.js";
import TypingKeyboard from "../components/TypingKeyboard.jsx";
import { LAYOUT } from "../data/keyboardLayouts.js";
import crosswords from "../data/crosswords.json";
import { charFor } from "../lib/conjugation.js";
import { books } from "../config/books.js";
import {
  emptyTyped, entryAt, entryCells, isCell, isEntrySolved, isSolved, nextCell, prevCell, puzzleId, wrongCells,
} from "../lib/crossword.js";

const MODIFIERS = new Set(["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "CapsLock", "Tab"]);
const LETTER = /[ء-ي]/;

// One crossword per unit, from Al-Kitaab part 1: pick the unit, then solve it. The clues are in Arabic, listed
// across (horizontal) and down (vertical). Type on the real keyboard (Arabic 101 positions, Shift for the hamza
// seats) or on the on-screen keys.
export default function Crossword({ onExit }) {
  const { t, bookName, unitLabel, level, crosswordsDone } = useApp();
  const [unit, setUnit] = useState(null); // { book, unit }

  if (unit) return <Puzzle id={puzzleId(unit.book, unit.unit)} onExit={() => setUnit(null)} />;

  // every unit up to the student's level that has a puzzle, newest book first
  const groups = [];
  for (let b = level.book; b >= 2; b--) {
    const last = b === level.book ? level.unit : books[b].maxUnits;
    const units = [];
    for (let u = 1; u <= last; u++) if (crosswords[puzzleId(b, u)]) units.push(u);
    if (units.length) groups.push({ book: b, units });
  }

  return (
    <main className="page narrow">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
      </div>
      <section className="card">
        <h2><bdi>{t("crosswordTitle")}</bdi></h2>
        {groups.map((g) => (
          <fieldset key={g.book} className="cross-units">
            <legend><bdi>{bookName(g.book)}</bdi></legend>
            <div className="unit-boxes">
              {g.units.map((u) => (
                <button key={u} type="button" className={`cross-unit${crosswordsDone[puzzleId(g.book, u)] ? " done" : ""}`} onClick={() => setUnit({ book: g.book, unit: u })}>
                  <bdi>{crosswordsDone[puzzleId(g.book, u)] ? "✓ " : ""}{unitLabel(g.book, u)}</bdi>
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </section>
    </main>
  );
}

export function Puzzle({ id, onExit }) {
  const { t, nf, finishCrossword } = useApp();
  const puzzle = crosswords[id];
  const [typed, setTyped] = useState(() => emptyTyped(puzzle));
  const first = puzzle.entries[0];
  const [active, setActive] = useState({ r: first.r, c: first.c, dir: first.dir });
  const [shown, setShown] = useState(false); // Check pressed: the wrong letters show
  const [shiftDown, setShiftDown] = useState(false);
  const shiftHeld = useShiftHeld();
  const state = useRef({});
  state.current = { typed, active, shown };

  const solved = useMemo(() => isSolved(puzzle, typed), [puzzle, typed]);
  const wrong = useMemo(() => (shown ? new Set(wrongCells(puzzle, typed).map((x) => `${x.r},${x.c}`)) : new Set()), [shown, puzzle, typed]);
  useEffect(() => {
    if (solved) finishCrossword(id);
  }, [solved, id, finishCrossword]);

  const numbers = useMemo(() => new Map(puzzle.entries.map((e) => [`${e.r},${e.c}`, e.n])), [puzzle]);
  const current = entryAt(puzzle, active.r, active.c, active.dir) ?? entryAt(puzzle, active.r, active.c, active.dir === "across" ? "down" : "across");
  const inCurrent = useMemo(() => new Set(current ? entryCells(current).map((x) => `${x.r},${x.c}`) : []), [current]);

  const select = (r, c, dir = state.current.active.dir) => {
    if (!isCell(puzzle, r, c)) return;
    const d = entryAt(puzzle, r, c, dir) ? dir : dir === "across" ? "down" : "across";
    setActive({ r, c, dir: d });
  };
  const clickCell = (r, c) => {
    const a = state.current.active;
    if (a.r === r && a.c === c) select(r, c, a.dir === "across" ? "down" : "across"); // a second click turns the other way
    else select(r, c);
  };
  const goEntry = (e) => setActive({ r: e.r, c: e.c, dir: e.dir });

  const typeLetter = (ch) => {
    const { active: a, typed: tp } = state.current;
    const next = tp.map((row) => [...row]);
    next[a.r][a.c] = ch;
    setTyped(next);
    setShown(false);
    const n = nextCell(puzzle, a.r, a.c, a.dir);
    setActive({ ...a, r: n.r, c: n.c });
  };
  const erase = () => {
    const { active: a, typed: tp } = state.current;
    const next = tp.map((row) => [...row]);
    if (next[a.r][a.c]) next[a.r][a.c] = "";
    else {
      const p = prevCell(puzzle, a.r, a.c, a.dir);
      next[p.r][p.c] = "";
      setActive({ ...a, r: p.r, c: p.c });
    }
    setTyped(next);
    setShown(false);
  };
  const move = (dr, dc) => {
    const a = state.current.active;
    select(a.r + dr, a.c + dc, dr ? "down" : "across");
  };
  const press = (code, shift) => {
    if (code === "Backspace" || code === "Delete") return erase();
    if (code === "Space") return setActive((a) => ({ ...a, dir: a.dir === "across" ? "down" : "across" }));
    if (code === "ArrowLeft") return move(0, 1); // the page runs right to left: left is the next column
    if (code === "ArrowRight") return move(0, -1);
    if (code === "ArrowUp") return move(-1, 0);
    if (code === "ArrowDown") return move(1, 0);
    const ch = charFor(LAYOUT, code, shift);
    if (ch && LETTER.test(ch)) typeLetter(ch);
    return undefined;
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || MODIFIERS.has(e.code)) return;
      const known = LAYOUT.rows.some((row) => row.some((key) => key.code === e.code)) || e.code.startsWith("Arrow") || e.code === "Delete";
      if (!known) return; // F5, Escape and the like keep working
      e.preventDefault();
      press(e.code, e.shiftKey);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const across = puzzle.entries.filter((e) => e.dir === "across");
  const down = puzzle.entries.filter((e) => e.dir === "down");
  const clueList = (title, list) => (
    <div className="cross-clues-col">
      <h3><bdi>{t(title)}</bdi></h3>
      <ol>
        {list.map((e) => {
          const done = isEntrySolved(puzzle, typed, e);
          const isCurrent = current === e;
          return (
            <li key={`${e.n}${e.dir}`} className={`${isCurrent ? "current" : ""}${done ? " done" : ""}`}>
              <button type="button" className="link-button" onClick={() => goEntry(e)}>
                <bdi>{nf(e.n)}.</bdi> <span className={/[A-Za-z]/.test(e.clue) ? "" : "ar"} dir="auto">{e.clue}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );

  return (
    <main className="page">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
        <span className="actions">
          <button type="button" onClick={() => setShown(true)}><span dir="auto">{t("studyCheck")}</span></button>
          <button type="button" onClick={() => { setTyped(emptyTyped(puzzle)); setShown(false); }}><span dir="auto">{t("crossClear")}</span></button>
        </span>
      </div>

      {solved && <p className="auth-info cross-done"><bdi>{t("crossDone")}</bdi></p>}

      <div className="cross-layout">
        <div className="cross-grid" dir="rtl" style={{ gridTemplateColumns: `repeat(${puzzle.cols}, var(--cell))` }}>
          {puzzle.cells.flatMap((row, r) => [...row].map((ch, c) => {
            if (ch === ".") return <span key={`${r},${c}`} className="cross-block" />;
            const key = `${r},${c}`;
            const cls = ["cross-cell", active.r === r && active.c === c ? "active" : "", inCurrent.has(key) ? "in-entry" : "", wrong.has(key) ? "wrong" : ""].join(" ");
            return (
              <button key={key} type="button" tabIndex={-1} className={cls} onClick={() => clickCell(r, c)}>
                {numbers.has(key) && <small className="cross-n">{nf(numbers.get(key))}</small>}
                <span className="ar">{typed[r][c]}</span>
              </button>
            );
          }))}
        </div>

        <div className="cross-clues">
          {clueList("crossAcross", across)}
          {clueList("crossDown", down)}
        </div>
      </div>

      <TypingKeyboard
        layout={LAYOUT}
        target={null}
        wrongCode={null}
        shiftDown={shiftDown}
        shift={shiftHeld || shiftDown}
        onPress={(code) => {
          if (code.startsWith("Shift")) setShiftDown((d) => !d);
          else if (code === "Backspace" || code === "Space") press(code, false);
          else { press(code, shiftDown); setShiftDown(false); }
        }}
      />
    </main>
  );
}

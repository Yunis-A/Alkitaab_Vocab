import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { varietyText } from "../lib/varieties.js";
import { buildRound } from "../lib/matching.js";

// Connect each English meaning to its Arabic word: pick one on each side. Rounds are not tracked anywhere.
export default function Matching({ items: studyItems, onExit }) {
  const { t, level, wordsById } = useApp();
  const items = useMemo(
    () => studyItems.map((i) => {
      const w = wordsById.get(i.wordId);
      return { id: i.id, arabic: varietyText(w, i.variety, level), english: w.definition };
    }),
    [studyItems, wordsById, level],
  );

  const [round, setRound] = useState(() => buildRound(items));
  const [matched, setMatched] = useState(() => new Set());
  const [pickEn, setPickEn] = useState(null);
  const [pickAr, setPickAr] = useState(null);
  const [wrong, setWrong] = useState(null); // { en, ar } flashed red for a moment

  const finished = round.english.length > 0 && matched.size === round.english.length;

  const attempt = (en, ar) => {
    if (en === ar) {
      setMatched((m) => new Set(m).add(en));
    } else {
      setWrong({ en, ar });
      setTimeout(() => setWrong(null), 600);
    }
    setPickEn(null);
    setPickAr(null);
  };

  const choose = (side, id) => {
    if (matched.has(id) || wrong) return;
    if (side === "en") {
      if (pickAr != null) attempt(id, pickAr); else setPickEn(pickEn === id ? null : id);
    } else if (pickEn != null) attempt(pickEn, id);
    else setPickAr(pickAr === id ? null : id);
  };

  const nextRound = () => {
    setRound(buildRound(items));
    setMatched(new Set());
    setPickEn(null);
    setPickAr(null);
  };

  const cls = (side, id) => {
    const picked = side === "en" ? pickEn === id : pickAr === id;
    const bad = wrong && (side === "en" ? wrong.en === id : wrong.ar === id);
    return `match-tile${matched.has(id) ? " matched" : ""}${picked ? " picked" : ""}${bad ? " wrong" : ""}`;
  };

  return (
    <main className="page narrow">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyChangeUnits")}</bdi></button>
      </div>

      <section className="card">
        <div className="match-grid">
          <div className="match-col">
            {round.english.map((it) => (
              <button key={it.id} type="button" className={cls("en", it.id)} disabled={matched.has(it.id)}
                onClick={() => choose("en", it.id)}>
                <bdi>{it.english}</bdi>
              </button>
            ))}
          </div>
          <div className="match-col">
            {round.arabic.map((it) => (
              <button key={it.id} type="button" className={cls("ar", it.id)} disabled={matched.has(it.id)}
                onClick={() => choose("ar", it.id)}>
                <span className="ar" dir="rtl">{it.arabic}</span>
              </button>
            ))}
          </div>
        </div>

        {finished && (
          <div className="match-done">
            <h2><bdi>{t("matchDone")}</bdi></h2>
            <button className="primary" onClick={nextRound}><span dir="auto">{t("matchNext")}</span></button>
          </div>
        )}
      </section>
    </main>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { dialectOf, varietyText } from "../lib/varieties.js";
import { countBoxes, pickNext, startBoxes } from "../lib/quickstudy.js";
import { RATINGS } from "../lib/leitner.js";
import WordDetail from "../components/WordDetail.jsx";

// A throwaway session: its boxes live only in this component and never touch the Leitner cards.
export default function QuickStudy({ items, englishFirst, onExit }) {
  const { t, nf, level, wordsById } = useApp();
  const ids = useMemo(() => items.map((i) => i.id), [items]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const [boxes, setBoxes] = useState(() => startBoxes(ids));
  const [keepGoing, setKeepGoing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [current, setCurrent] = useState(() => pickNext(startBoxes(ids)));

  const counts = countBoxes(boxes);
  const item = current?.id ? byId.get(current.id) : null;
  const word = item ? wordsById.get(item.wordId) : null;
  const dialect = item ? dialectOf(item.variety) : null;
  const arabic = item ? varietyText(word, item.variety, level) : "";

  const rate = (rating) => {
    const next = { ...boxes, [current.id]: rating };
    setBoxes(next);
    setRevealed(false);
    setCurrent(pickNext(next, { last: current.id, keepGoing }));
  };

  const goOn = () => {
    setKeepGoing(true);
    setCurrent(pickNext(boxes, { keepGoing: true }));
  };

  const restart = () => {
    const fresh = startBoxes(ids);
    setBoxes(fresh);
    setKeepGoing(false);
    setRevealed(false);
    setCurrent(pickNext(fresh));
  };

  useEffect(() => {
    if (!word) return undefined;
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (!revealed && (e.code === "Space" || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && /^[1-3]$/.test(e.key)) {
        rate(RATINGS[Number(e.key) - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // re-bound every render so `rate` always sees the current boxes

  return (
    <main className="page narrow">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
        <span className="quick-counts">
          {RATINGS.map((r) => (
            <span key={r} className={`quick-count rate-${r}`}><bdi>{t(r)}</bdi> {nf(counts[r])}</span>
          ))}
        </span>
      </div>

      {!word ? (
        <section className="card">
          <h2><bdi>{t("studyDone")}</bdi></h2>
          <div className="actions">
            <button className="primary" onClick={goOn}><span dir="auto">{t("studyKeepGoing")}</span></button>
            <button onClick={restart}><span dir="auto">{t("studyRestart")}</span></button>
          </div>
        </section>
      ) : (
        <section className="card flash">
          <div className="face">
            {dialect && (
              <span className="badge badge-learning"><bdi>{t(dialect === "egyptian" ? "dialectEgyptian" : "dialectShami")}</bdi></span>
            )}
            {englishFirst ? (
              <span className="definition big" dir="auto">{word.definition}</span>
            ) : (
              <span className="ar huge" dir="rtl">{arabic}</span>
            )}
          </div>
          {/* the rating buttons take the place of "Show answer" so the mouse does not have to move */}
          {revealed ? (
            <div className="ratings">
              {RATINGS.map((r) => (
                <button key={r} className={`rate rate-${r}`} onClick={() => rate(r)}>
                  <span dir="auto">{t(r)}</span>
                </button>
              ))}
            </div>
          ) : (
            <button className="primary" onClick={() => setRevealed(true)}>
              <span dir="auto">{t("showAnswer")}</span>
            </button>
          )}
          {revealed && (
            <>
              <hr />
              <div className="face">
                {englishFirst ? (
                  <span className="ar huge" dir="rtl">{arabic}</span>
                ) : (
                  <span className="definition big" dir="auto">{word.definition}</span>
                )}
              </div>
              <WordDetail word={word} showStatus={false} showHeader={false} links={false} />
            </>
          )}
        </section>
      )}
    </main>
  );
}

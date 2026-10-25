import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { headword } from "../lib/varieties.js";
import { countBoxes, pickNext, startBoxes } from "../lib/quickstudy.js";
import { RATINGS } from "../lib/leitner.js";
import WordDetail from "../components/WordDetail.jsx";

// A throwaway session: its boxes live only in this component and never touch the Leitner cards.
export default function QuickStudy({ words, onExit }) {
  const { t, nf, level, dialects } = useApp();
  const ids = useMemo(() => words.map((w) => w.id), [words]);
  const byId = useMemo(() => new Map(words.map((w) => [w.id, w])), [words]);

  const [boxes, setBoxes] = useState(() => startBoxes(ids));
  const [keepGoing, setKeepGoing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [current, setCurrent] = useState(() => pickNext(startBoxes(ids)));

  const counts = countBoxes(boxes);
  const word = current?.id ? byId.get(current.id) : null;

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
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyChangeUnits")}</bdi></button>
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
            <span className="ar huge" dir="rtl">{headword(word, dialects, level)}</span>
          </div>
          {revealed ? (
            <>
              <hr />
              <WordDetail word={word} showStatus={false} />
              <div className="ratings">
                {RATINGS.map((r) => (
                  <button key={r} className={`rate rate-${r}`} onClick={() => rate(r)}>
                    <span dir="auto">{t(r)}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <button className="primary" onClick={() => setRevealed(true)}>
              <span dir="auto">{t("showAnswer")}</span>
            </button>
          )}
        </section>
      )}
    </main>
  );
}

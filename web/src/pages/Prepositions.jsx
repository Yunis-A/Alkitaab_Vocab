import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { shuffle } from "../lib/matching.js";
import { allPrepositions, gradePrepositions } from "../lib/prepositions.js";

// Given a verb, tap every preposition it takes (each is a circle that turns green when chosen), then submit.
export default function Prepositions({ verbs, onExit }) {
  const { t, nf, words } = useApp();
  const choices = useMemo(() => allPrepositions(words.filter((w) => w.pos === "verb")), [words]);
  const [order, setOrder] = useState(() => shuffle(verbs));
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [graded, setGraded] = useState(null); // { right, wrong, missed, perfect } after Submit
  const [score, setScore] = useState(0);

  const word = order[i];
  const finished = i >= order.length;

  const toggle = (key) => {
    if (graded) return;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelected(next);
  };
  const submit = () => {
    const g = gradePrepositions(selected, word);
    setGraded(g);
    if (g.perfect) setScore((s) => s + 1);
  };
  const next = () => {
    setSelected(new Set());
    setGraded(null);
    setI(i + 1);
  };
  const restart = () => {
    setOrder(shuffle(verbs));
    setI(0);
    setSelected(new Set());
    setGraded(null);
    setScore(0);
  };

  const circleClass = (key) => {
    let cls = "prep-circle";
    if (graded) {
      if (graded.right.includes(key)) cls += " right";
      else if (graded.wrong.includes(key)) cls += " wrong";
      else if (graded.missed.includes(key)) cls += " missed";
    } else if (selected.has(key)) cls += " selected";
    return cls;
  };

  return (
    <main className="page narrow">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
        <span className="muted"><bdi>{t("genderScore", score, nf(score))} · {nf(Math.min(i + 1, order.length))} / {nf(order.length)}</bdi></span>
      </div>

      {finished ? (
        <section className="card">
          <h2><bdi>{t("genderScore", score, nf(score))} / {nf(order.length)}</bdi></h2>
          <div className="actions">
            <button className="primary" onClick={restart}><span dir="auto">{t("studyRestart")}</span></button>
            <button onClick={onExit}><span dir="auto">{t("studyExit")}</span></button>
          </div>
        </section>
      ) : (
        <section className="card flash">
          <div className="face">
            <span className="ar huge" dir="rtl">{word.arabic}</span>
            <span className="muted"><bdi>{word.definition}</bdi></span>
          </div>

          <div className="prep-grid" dir="rtl">
            {choices.map((c) => (
              <button key={c.key} type="button" className={circleClass(c.key)} aria-pressed={selected.has(c.key)} onClick={() => toggle(c.key)}>
                <span className="ar">{c.text}</span>
              </button>
            ))}
          </div>

          {graded ? (
            <>
              <p><bdi>{t(graded.perfect ? "genderRight" : "genderWrong")}</bdi></p>
              <button className="primary" onClick={next} autoFocus><span dir="auto">{t("genderNext")}</span></button>
            </>
          ) : (
            <button className="primary" disabled={selected.size === 0} onClick={submit}><span dir="auto">{t("studySubmit")}</span></button>
          )}
        </section>
      )}
    </main>
  );
}

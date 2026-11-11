import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { CHOICES, isRight, pickQuestion } from "../lib/agreement.js";

const ROUND = 10;

// Is this word masculine or feminine, and singular, dual or plural? Six buttons. A skeleton: words come from the
// lessons picked on the setup screen, and the forms are built by lib/agreement.js.
export default function Agreement({ words, onExit }) {
  const { t, nf } = useApp();
  const [q, setQ] = useState(() => pickQuestion(words));
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [n, setN] = useState(1);

  const finished = n > ROUND;
  const answer = (choice) => {
    if (picked) return;
    setPicked(choice);
    if (isRight(q, choice)) setScore((s) => s + 1);
  };
  const next = () => {
    setPicked(null);
    setQ(pickQuestion(words));
    setN(n + 1);
  };
  const restart = () => {
    setPicked(null);
    setQ(pickQuestion(words));
    setScore(0);
    setN(1);
  };

  const label = (c) => `${t(c.gender)} · ${t(c.number)}`;
  const cls = (c) => {
    let s = "gender-btn";
    if (picked) {
      if (isRight(q, c)) s += " right";
      else if (c === picked) s += " wrong";
    }
    return s;
  };

  return (
    <main className="page narrow">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
        <span className="muted"><bdi>{t("genderScore", score, nf(score))} · {nf(Math.min(n, ROUND))} / {nf(ROUND)}</bdi></span>
      </div>

      {finished || !q ? (
        <section className="card">
          <h2><bdi>{t("genderScore", score, nf(score))} / {nf(ROUND)}</bdi></h2>
          <div className="actions">
            <button className="primary" onClick={restart}><span dir="auto">{t("studyRestart")}</span></button>
            <button onClick={onExit}><span dir="auto">{t("studyExit")}</span></button>
          </div>
        </section>
      ) : (
        <section className="card flash">
          <div className="face">
            <span className="ar huge" dir="rtl">{q.form.text}</span>
            {picked && <span className="muted"><bdi>{q.word.definition} · {label(q.form)}</bdi></span>}
          </div>
          <div className="agree-buttons">
            {CHOICES.map((c) => (
              <button key={`${c.gender}-${c.number}`} type="button" className={cls(c)} disabled={!!picked} onClick={() => answer(c)}>
                <bdi>{label(c)}</bdi>
              </button>
            ))}
          </div>
          {picked && (
            <>
              <p><bdi>{t(isRight(q, picked) ? "genderRight" : "genderWrong")}</bdi></p>
              <button className="primary" onClick={next} autoFocus><span dir="auto">{t("genderNext")}</span></button>
            </>
          )}
        </section>
      )}
    </main>
  );
}

import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { GAME_COUNTRIES as COUNTRIES } from "../data/countries.js";
import { shuffle } from "../lib/matching.js";

// Is this country masculine or feminine? One country at a time, answered with two buttons.
export default function GenderQuiz({ onExit }) {
  const { t, nf } = useApp();
  const [order, setOrder] = useState(() => shuffle(COUNTRIES));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);

  const country = order[i];
  const finished = i >= order.length;

  const answer = (gender) => {
    if (picked) return;
    setPicked(gender);
    if (gender === country.gender) setScore((s) => s + 1);
  };
  const next = () => {
    setPicked(null);
    setI(i + 1);
  };
  const restart = () => {
    setOrder(shuffle(COUNTRIES));
    setI(0);
    setPicked(null);
    setScore(0);
  };

  const btn = (gender) => {
    let cls = "gender-btn";
    if (picked) {
      if (gender === country.gender) cls += " right";
      else if (gender === picked) cls += " wrong";
    }
    return (
      <button key={gender} type="button" className={cls} disabled={!!picked} onClick={() => answer(gender)}>
        <bdi>{t(gender)}</bdi>
      </button>
    );
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
            <span className="ar huge" dir="rtl">{country.ar}</span>
            <span className="muted"><bdi>{country.en}</bdi></span>
          </div>
          <div className="gender-buttons">{["masculine", "feminine"].map(btn)}</div>
          {picked && (
            <>
              <p><bdi>{t(picked === country.gender ? "genderRight" : "genderWrong")}</bdi></p>
              <button className="primary" onClick={next} autoFocus><span dir="auto">{t("genderNext")}</span></button>
            </>
          )}
        </section>
      )}
    </main>
  );
}

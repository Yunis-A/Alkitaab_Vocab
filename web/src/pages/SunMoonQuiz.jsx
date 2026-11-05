import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { LETTERS } from "../data/letters.js";
import { shuffle } from "../lib/matching.js";

function SunIcon() {
  return (
    <svg className="sm-icon" viewBox="0 0 64 64" aria-hidden="true">
      <g stroke="#f0a500" strokeWidth="4" strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return <line key={i} x1={32 + 20 * Math.cos(a)} y1={32 + 20 * Math.sin(a)} x2={32 + 28 * Math.cos(a)} y2={32 + 28 * Math.sin(a)} />;
        })}
      </g>
      <circle cx="32" cy="32" r="14" fill="#ffc933" stroke="#f0a500" strokeWidth="3" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="sm-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M44 8a26 26 0 1 0 12 40A22 22 0 0 1 44 8z" fill="#c9d3e6" stroke="#7f8fb0" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="50" cy="14" r="2" fill="#7f8fb0" />
      <circle cx="56" cy="26" r="1.5" fill="#7f8fb0" />
    </svg>
  );
}

// Given a letter, is it a sun letter or a moon letter? Answered by pressing the sun or the moon.
export default function SunMoonQuiz({ onExit }) {
  const { t, nf } = useApp();
  const [order, setOrder] = useState(() => shuffle(LETTERS));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null); // true = sun
  const [score, setScore] = useState(0);

  const item = order[i];
  const finished = i >= order.length;

  const answer = (sun) => {
    if (picked !== null) return;
    setPicked(sun);
    if (sun === item.sun) setScore((s) => s + 1);
  };
  const next = () => {
    setPicked(null);
    setI(i + 1);
  };
  const restart = () => {
    setOrder(shuffle(LETTERS));
    setI(0);
    setPicked(null);
    setScore(0);
  };

  const btn = (sun) => {
    let cls = "gender-btn sm-btn";
    if (picked !== null) {
      if (sun === item.sun) cls += " right";
      else if (sun === picked) cls += " wrong";
    }
    return (
      <button key={String(sun)} type="button" className={cls} disabled={picked !== null} onClick={() => answer(sun)}>
        {sun ? <SunIcon /> : <MoonIcon />}
        <bdi>{t(sun ? "sunLetter" : "moonLetter")}</bdi>
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
            <span className="ar huge letter-huge" dir="rtl">{item.letter}</span>
          </div>
          <div className="gender-buttons">{[true, false].map(btn)}</div>
          {picked !== null && (
            <>
              <p><bdi>{t(picked === item.sun ? "genderRight" : "genderWrong")}</bdi></p>
              <button className="primary" onClick={next} autoFocus><span dir="auto">{t("genderNext")}</span></button>
            </>
          )}
        </section>
      )}
    </main>
  );
}

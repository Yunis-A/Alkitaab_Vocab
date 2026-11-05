import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { GAME_COUNTRIES } from "../data/countries.js";
import { shuffle } from "../lib/matching.js";

// Does this country's Arabic name take ال (الصين) or not (فرنسا)? The country is shown in English and
// answered with two buttons; the Arabic name is shown afterwards.
export default function ArticleQuiz({ onExit }) {
  const { t, nf } = useApp();
  const [order, setOrder] = useState(() => shuffle(GAME_COUNTRIES));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null); // true = "with ال"
  const [score, setScore] = useState(0);

  const country = order[i];
  const finished = i >= order.length;

  const answer = (withArticle) => {
    if (picked !== null) return;
    setPicked(withArticle);
    if (withArticle === country.hasArticle) setScore((s) => s + 1);
  };
  const next = () => {
    setPicked(null);
    setI(i + 1);
  };
  const restart = () => {
    setOrder(shuffle(GAME_COUNTRIES));
    setI(0);
    setPicked(null);
    setScore(0);
  };

  const btn = (withArticle) => {
    let cls = "gender-btn";
    if (picked !== null) {
      if (withArticle === country.hasArticle) cls += " right";
      else if (withArticle === picked) cls += " wrong";
    }
    return (
      <button key={String(withArticle)} type="button" className={cls} disabled={picked !== null} onClick={() => answer(withArticle)}>
        <bdi>{t(withArticle ? "articleWith" : "articleWithout")}</bdi>
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
            <span className="huge"><bdi>{country.en}</bdi></span>
          </div>
          <div className="gender-buttons">{[true, false].map(btn)}</div>
          {picked !== null && (
            <>
              <p className="ar big" dir="rtl">{country.ar}</p>
              <p><bdi>{t(picked === country.hasArticle ? "genderRight" : "genderWrong")}</bdi></p>
              <button className="primary" onClick={next} autoFocus><span dir="auto">{t("genderNext")}</span></button>
            </>
          )}
        </section>
      )}
    </main>
  );
}

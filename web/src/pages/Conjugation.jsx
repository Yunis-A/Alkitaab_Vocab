import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import TypingKeyboard from "../components/TypingKeyboard.jsx";
import { LAYOUT as layout } from "../data/keyboardLayouts.js";
import { shuffle } from "../lib/matching.js";
import { canAppend } from "../lib/patterns.js";
import { charFor, isConjugationCorrect, needsForm } from "../lib/conjugation.js";
import { MOOD_LABELS } from "../lib/moods.js";

const QUESTIONS = 20; // per round
const MODIFIERS = new Set(["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "CapsLock", "Tab"]);

// Given a root (and the form, when the root has several), type the verb for the pronoun in the tense, or its
// verbal noun. The answer is typed on the real keyboard (Arabic 101 positions; Shift for the vowel marks) or
// on the on-screen keys; the vowel marks must be right.
export default function Conjugation({ items, allVerbs, onExit }) {
  const { t, nf } = useApp();
  const [order, setOrder] = useState(() => shuffle(items).slice(0, QUESTIONS));
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(null); // null, or whether the answer was right
  const [hint, setHint] = useState(false);
  const [score, setScore] = useState(0);
  const [shiftDown, setShiftDown] = useState(false);

  const item = order[i];
  const finished = i >= order.length;
  const formShown = item ? needsForm(item.word, allVerbs) : false;

  const state = useRef({});
  state.current = { typed, checked, item, finished };

  const check = () => {
    const s = state.current;
    if (s.checked !== null || !s.item || !s.typed) return;
    const ok = isConjugationCorrect(s.item, s.typed);
    setChecked(ok);
    if (ok) setScore((n) => n + 1);
  };
  const next = () => {
    setI((n) => n + 1);
    setTyped("");
    setChecked(null);
    setHint(false);
  };
  const restart = () => {
    setOrder(shuffle(items).slice(0, QUESTIONS));
    setI(0);
    setTyped("");
    setChecked(null);
    setHint(false);
    setScore(0);
  };

  const press = (code, shift) => {
    const s = state.current;
    if (s.finished) return;
    if (code === "Enter") { if (s.checked === null) check(); else next(); return; }
    if (s.checked !== null) return;
    if (code === "Backspace") { setTyped((x) => x.slice(0, -1)); return; }
    const ch = charFor(layout, code, shift);
    if (ch && canAppend(s.typed, ch)) setTyped((x) => x + ch);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || MODIFIERS.has(e.code)) return;
      if (!layout.rows.some((row) => row.some((key) => key.code === e.code))) return; // F5, Escape and the like keep working
      e.preventDefault();
      press(e.code, e.shiftKey);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const tenseLabel = item ? t(item.tense) : "";

  return (
    <main className="page">
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
            <span className="ar huge conj-root" dir="rtl">{item.word.root}</span>
            <span className="muted conj-clue">
              <bdi>
                {formShown && item.word.form ? `${t("form")} ${nf(item.word.form)} · ` : ""}
                {tenseLabel}
              </bdi>
              {item.mood && <strong className="conj-mood ar" dir="rtl"> · {MOOD_LABELS[item.mood]}</strong>}
              {item.person && <span> · </span>}
              {item.person && <strong className="conj-person"><bdi>{t(`person.${item.person}`)}</bdi></strong>}
            </span>
            {hint ? (
              <span className="muted"><bdi>{item.word.definition}</bdi></span>
            ) : (
              <button type="button" className="link-button" onClick={() => setHint(true)}><bdi>{t("conjHint")}</bdi></button>
            )}
          </div>

          <div className={`conj-input ar${checked === true ? " ok" : checked === false ? " bad" : ""}`} dir="rtl">
            {typed || " "}
          </div>
          {checked === false && (
            <p className="conj-answer ar" dir="rtl">{item.answers.join(" / ")}</p>
          )}
          {checked !== null && <p><bdi>{t(checked ? "genderRight" : "genderWrong")}</bdi></p>}

          <TypingKeyboard
            layout={layout}
            target={null}
            wrongCode={null}
            shiftDown={shiftDown}
            onPress={(code) => {
              if (code.startsWith("Shift")) setShiftDown((d) => !d);
              else { press(code, shiftDown); setShiftDown(false); }
            }}
          />

          <div className="actions">
            {checked === null ? (
              <button className="primary" disabled={!typed} onClick={check}><span dir="auto">{t("studyCheck")}</span></button>
            ) : (
              <button className="primary" onClick={next} autoFocus><span dir="auto">{t("genderNext")}</span></button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

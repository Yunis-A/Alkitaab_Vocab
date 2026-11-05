import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import TypingKeyboard from "../components/TypingKeyboard.jsx";
import { LAYOUTS, codeFor } from "../data/keyboardLayouts.js";
import { LESSONS, MIN_ACCURACY, buildText, isUnlocked, typingResult } from "../lib/typing.js";

const MODIFIERS = new Set(["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "CapsLock", "Tab"]);

// The lesson list; a lesson opens once the one before it has been passed.
export default function Typing({ onExit }) {
  const { t, nf, typing, setTypingLayout } = useApp();
  const [lessonIndex, setLessonIndex] = useState(null);
  const layout = LAYOUTS[typing.layout] ?? LAYOUTS.pc;

  if (lessonIndex !== null) {
    return (
      <TypingLesson
        key={lessonIndex}
        lesson={LESSONS[lessonIndex]}
        layout={layout}
        onExit={() => setLessonIndex(null)}
        onNext={() => setLessonIndex(lessonIndex + 1 < LESSONS.length ? lessonIndex + 1 : null)}
      />
    );
  }

  const layouts = Object.values(LAYOUTS);
  return (
    <main className="page">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
        {layouts.length > 1 && (
          <label className="typing-layout">
            <span><bdi>{t("typingLayout")}</bdi></span>
            <select value={layout.id} onChange={(e) => setTypingLayout(e.target.value)}>
              {layouts.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="mode-grid">
        {LESSONS.map((lesson) => {
          const done = typing.passed[lesson.id];
          const open = isUnlocked(lesson.index, typing.passed);
          return (
            <button key={lesson.id} type="button" className={`mode-card lesson-card${done ? " passed" : ""}`} disabled={!open}
              onClick={() => setLessonIndex(lesson.index)}>
              <strong><bdi>{lesson.kind === "review" ? t("reviewDue") : t("typingLesson", lesson.number, nf(lesson.number))}</bdi></strong>
              <span className="lesson-letters ar" dir="rtl">{lesson.letters.join(" ")}</span>
              <span className="mode-badge"><bdi dir="ltr">
                {done ? `✓ ${nf(Math.round(done.accuracy * 100))}% · ${nf(Math.round(done.cpm))}` : open ? t("typingMin", nf(Math.round(MIN_ACCURACY * 100)), nf(lesson.minCpm)) : "🔒"}
              </bdi></span>
            </button>
          );
        })}
      </div>
    </main>
  );
}

// One lesson: type the shown text, key by key, on the highlighted key. A wrong key does not advance.
export function TypingLesson({ lesson, layout, onExit, onNext }) {
  const { t, nf, visibleWords, passTyping } = useApp();
  const [round, setRound] = useState(0);
  const tokens = useMemo(() => buildText(lesson, visibleWords), [lesson, visibleWords, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pos, setPos] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongCode, setWrongCode] = useState(null);
  const [result, setResult] = useState(null);
  const startedAt = useRef(null);
  const flash = useRef(null);
  const state = useRef({});
  state.current = { pos, mistakes, tokens, done: !!result };

  const targetCode = result ? null : codeFor(layout, tokens[pos]);

  const press = (code) => {
    const s = state.current;
    if (s.done) return;
    if (startedAt.current === null) startedAt.current = performance.now();
    if (code === codeFor(layout, s.tokens[s.pos])) {
      const next = s.pos + 1;
      setPos(next);
      if (next === s.tokens.length) {
        const r = typingResult({ correct: s.tokens.length, mistakes: s.mistakes, ms: performance.now() - startedAt.current }, lesson);
        setResult(r);
        if (r.passed) passTyping(lesson.id, { accuracy: r.accuracy, cpm: r.cpm });
      }
    } else {
      setMistakes((m) => m + 1);
      setWrongCode(code);
      clearTimeout(flash.current);
      flash.current = setTimeout(() => setWrongCode(null), 350);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || MODIFIERS.has(e.code)) return;
      if (!layout.rows.some((row) => row.some((key) => key.code === e.code))) return; // F5, Escape and the like keep working
      e.preventDefault();
      press(e.code);
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(flash.current); };
  }); // re-bound each render so press() always sees the current lesson

  const retry = () => {
    startedAt.current = null;
    setPos(0);
    setMistakes(0);
    setWrongCode(null);
    setResult(null);
    setRound((n) => n + 1);
  };

  return (
    <main className="page">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
        <span className="muted"><bdi>
          {lesson.kind === "review" ? t("reviewDue") : t("typingLesson", lesson.number, nf(lesson.number))} · {t("typingMistakes")} {nf(mistakes)}
        </bdi></span>
      </div>

      <section className="card flash">
        {lesson.kind === "new" && (
          <p className="muted"><bdi>{t("typingNewLetters")}: </bdi><span className="ar lesson-letters" dir="rtl">{lesson.letters.join(" ")}</span></p>
        )}
        <div className="typing-text ar" dir="rtl">
          {tokens.map((tok, i) => (
            <span key={i} className={i < pos ? "typed" : i === pos ? "current" : ""}>{tok === " " ? " " : tok}</span>
          ))}
        </div>

        {result && (
          <div className="typing-result">
            <h2><bdi>{t(result.passed ? "typingPassed" : "typingNotYet")}</bdi></h2>
            <p>
              <bdi>{t("typingAccuracy")}: {nf(Math.round(result.accuracy * 100))}% · {t("typingSpeed")}: {nf(Math.round(result.cpm))}</bdi>
            </p>
            {!result.passed && <p className="muted"><bdi>{t("typingNeeded", nf(Math.round(MIN_ACCURACY * 100)), nf(lesson.minCpm))}</bdi></p>}
            <div className="actions">
              {result.passed && lesson.index + 1 < LESSONS.length && <button className="primary" onClick={onNext} autoFocus><span dir="auto">{t("typingNext")}</span></button>}
              <button className={result.passed ? "" : "primary"} onClick={retry}><span dir="auto">{t("typingRetry")}</span></button>
            </div>
          </div>
        )}
      </section>

      <TypingKeyboard layout={layout} targetCode={targetCode} wrongCode={wrongCode} onPress={press} />
    </main>
  );
}

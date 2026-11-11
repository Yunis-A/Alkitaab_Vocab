import { useEffect, useMemo, useRef, useState } from "react";
import { useNow, useShiftHeld } from "../hooks.js";
import { useApp } from "../context/AppContext.jsx";
import TypingKeyboard from "../components/TypingKeyboard.jsx";
import TypingText from "../components/TypingText.jsx";
import { LAYOUT as layout, SHIFT_KEY, keyFor } from "../data/keyboardLayouts.js";
import { LESSONS, accuracyFor, buildText, cpmFor, isUnlocked, showWpm, toWpm, typingResult } from "../lib/typing.js";

const MODIFIERS = new Set(["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "CapsLock", "Tab"]);

// 83000 ms -> "1:23"
const clock = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// The lesson list; a lesson opens once the one before it has been passed. Hard mode (the switch) is a second run from
// the beginning with stricter limits: its progress is kept apart, and switching it off brings back the normal run.
export default function Typing({ onExit }) {
  const { t, nf, typing, setTypingHard } = useApp();
  const [lessonIndex, setLessonIndex] = useState(null);
  const hard = !!typing.hard;
  const passed = hard ? typing.passedHard : typing.passed;

  if (lessonIndex !== null) {
    return (
      <TypingLesson
        key={`${lessonIndex}-${hard}`}
        lesson={LESSONS[lessonIndex]}
        hard={hard}
        onExit={() => setLessonIndex(null)}
        onNext={() => setLessonIndex(lessonIndex + 1 < LESSONS.length ? lessonIndex + 1 : null)}
      />
    );
  }

  return (
    <main className="page">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
        <label className={`switch${hard ? " hard" : ""}`}>
          <input type="checkbox" checked={hard} onChange={(e) => setTypingHard(e.target.checked)} />
          <span className="switch-track"><span className="switch-thumb" /></span>
          <span className="switch-label"><bdi>{t("typingHard")}</bdi></span>
        </label>
      </div>
      {hard && <p className="muted hard-note"><bdi>{t("typingHardHelp")}</bdi></p>}

      <div className="mode-grid">
        {LESSONS.map((lesson) => {
          const done = passed[lesson.id];
          const open = isUnlocked(lesson.index, passed);
          const need = `${nf(Math.round(accuracyFor(hard) * 100))}% · ${nf(showWpm(cpmFor(lesson, hard)))}`;
          return (
            <button key={lesson.id} type="button" className={`mode-card lesson-card${done ? " passed" : ""}`} disabled={!open}
              onClick={() => setLessonIndex(lesson.index)}>
              <strong><bdi>{lesson.kind === "review" ? t("reviewDue") : t("typingLesson", lesson.number, nf(lesson.number))}</bdi></strong>
              <span className="lesson-letters ar" dir="rtl">{lesson.letters.join(" ")}</span>
              <span className="mode-badge"><bdi dir="ltr">
                {done
                  ? `✓ ${nf(Math.round(done.accuracy * 100))}% · ${nf(showWpm(done.cpm))} ${t("typingWpm")}${done.ms ? ` · ${clock(done.ms)}` : ""}`
                  : open ? `${need} ${t("typingWpm")}` : "🔒"}
              </bdi></span>
            </button>
          );
        })}
      </div>
    </main>
  );
}

// One lesson: type the shown text, key by key, on the highlighted key. A wrong key does not advance. The time, the
// percent right and the words a minute are shown as you go.
export function TypingLesson({ lesson, hard = false, onExit, onNext }) {
  const { t, nf, visibleWords, passTyping } = useApp();
  const [round, setRound] = useState(0);
  const tokens = useMemo(() => buildText(lesson, visibleWords), [lesson, visibleWords, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pos, setPos] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongCode, setWrongCode] = useState(null);
  const [shiftDown, setShiftDown] = useState(false); // Shift tapped on the on-screen keyboard
  const shiftHeld = useShiftHeld();
  const [result, setResult] = useState(null);
  const startedAt = useRef(null);
  const flash = useRef(null);
  const state = useRef({});
  state.current = { pos, mistakes, tokens, done: !!result };
  useNow(250); // keeps the clock and the speed moving

  const wanted = result ? null : keyFor(layout, tokens[pos]);
  const target = wanted && { ...wanted, shiftKey: SHIFT_KEY };

  const press = (code, shift = false) => {
    const s = state.current;
    if (s.done) return;
    if (startedAt.current === null) startedAt.current = performance.now();
    const need = keyFor(layout, s.tokens[s.pos]);
    if (code === need.code && shift === need.shift) {
      clearTimeout(flash.current);
      setWrongCode(null); // the right key clears the red at once
      const next = s.pos + 1;
      setPos(next);
      if (next === s.tokens.length) {
        const r = typingResult({ correct: s.tokens.length, mistakes: s.mistakes, ms: performance.now() - startedAt.current }, lesson, hard);
        setResult(r);
        if (r.passed) passTyping(lesson.id, { accuracy: r.accuracy, cpm: r.cpm, ms: r.ms }, hard);
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
      press(e.code, e.shiftKey);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // re-bound each render so press() always sees the current lesson
  // (the red flash's timer is cleared only when the lesson closes: clearing it on every render left the key red)
  useEffect(() => () => clearTimeout(flash.current), []);

  const retry = () => {
    startedAt.current = null;
    setPos(0);
    setMistakes(0);
    setWrongCode(null);
    setResult(null);
    setRound((n) => n + 1);
  };

  // the numbers shown while typing
  const elapsed = result ? result.ms : startedAt.current === null ? 0 : performance.now() - startedAt.current;
  const accuracy = result ? result.accuracy : pos + mistakes ? pos / (pos + mistakes) : 1;
  const wpm = result ? toWpm(result.cpm) : elapsed > 1500 ? toWpm(pos / (elapsed / 60000)) : 0;
  const needAcc = accuracyFor(hard);
  const needWpm = toWpm(cpmFor(lesson, hard));

  return (
    <main className="page">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
        <span className="muted"><bdi>
          {hard ? `${t("typingHard")} · ` : ""}{lesson.kind === "review" ? t("reviewDue") : t("typingLesson", lesson.number, nf(lesson.number))}
        </bdi></span>
      </div>

      <section className="card flash">
        {lesson.kind === "new" && (
          <p className="muted"><bdi>{t("typingNewLetters")}: </bdi><span className="ar lesson-letters" dir="rtl">{lesson.letters.join(" ")}</span></p>
        )}

        <div className="typing-stats" dir="ltr" aria-live="off">
          <span><small>{t("typingTime")}</small><strong>{clock(elapsed)}</strong></span>
          <span className={accuracy >= needAcc ? "ok" : "low"}><small>{t("typingAccuracy")}</small><strong>{nf(Math.round(accuracy * 100))}%</strong></span>
          <span className={wpm >= needWpm ? "ok" : "low"}><small>{t("typingWpm")}</small><strong>{nf(Math.round(wpm))}</strong></span>
          <span><small>{t("typingMistakes")}</small><strong>{nf(mistakes)}</strong></span>
        </div>

        <TypingText tokens={tokens} pos={pos} />

        <p className="muted typing-progress"><bdi>{nf(Math.min(pos, tokens.length))} / {nf(tokens.length)}</bdi></p>

        {result && (
          <div className="typing-result">
            <h2><bdi>{t(result.passed ? "typingPassed" : "typingNotYet")}</bdi></h2>
            <p>
              <bdi>{t("typingAccuracy")}: {nf(Math.round(result.accuracy * 100))}% · {t("typingWpm")}: {nf(Math.round(toWpm(result.cpm)))} · {t("typingTime")}: {clock(result.ms)}</bdi>
            </p>
            {!result.passed && <p className="muted"><bdi>{t("typingNeeded", nf(Math.round(needAcc * 100)), nf(showWpm(cpmFor(lesson, hard))))}</bdi></p>}
            <div className="actions">
              {result.passed && lesson.index + 1 < LESSONS.length && <button className="primary" onClick={onNext} autoFocus><span dir="auto">{t("typingNext")}</span></button>}
              <button className={result.passed ? "" : "primary"} onClick={retry}><span dir="auto">{t("typingRetry")}</span></button>
            </div>
          </div>
        )}
      </section>

      <TypingKeyboard
        layout={layout}
        target={target}
        wrongCode={wrongCode}
        shiftDown={shiftDown}
        shift={shiftHeld || shiftDown}
        onPress={(code, shifted) => {
          if (code.startsWith("Shift")) setShiftDown((d) => !d);
          else { press(code, shifted); setShiftDown(false); }
        }}
      />
    </main>
  );
}

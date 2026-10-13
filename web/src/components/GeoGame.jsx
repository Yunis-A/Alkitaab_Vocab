import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useNow } from "../hooks.js";
import { geoCountries } from "../data/geography.js";
import {
  GEO_MODES, TIME_LIMIT_MS, WRONG_PENALTY_MS, buildQuestions, finalTime, formatTime,
} from "../lib/geoquiz.js";
import MenaMap from "./MenaMap.jsx";

// "idle" -> "playing" -> "done" (finished or timed out). Stop returns to idle.
export default function GeoGame() {
  const { t, geoBest, submitGeoTime } = useApp();
  const [modeId, setModeId] = useState(GEO_MODES[0].id);
  const [status, setStatus] = useState("idle");
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState(() => new Set());
  const [wrong, setWrong] = useState(0);
  const [wrongId, setWrongId] = useState(null);
  const [startedAt, setStartedAt] = useState(0);
  const [result, setResult] = useState(null); // { ms, isBest, timedOut, found }

  const mode = GEO_MODES.find((m) => m.id === modeId);
  const playing = status === "playing";
  const now = useNow(playing ? 100 : 60_000);
  const flashTimer = useRef(null);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const elapsed = playing ? Math.min(finalTime(now - startedAt, wrong), TIME_LIMIT_MS) : 0;

  // Out of time: the run ends without a score.
  useEffect(() => {
    if (playing && finalTime(now - startedAt, wrong) >= TIME_LIMIT_MS) {
      setResult({ ms: TIME_LIMIT_MS, isBest: false, timedOut: true, found: solved.size });
      setStatus("done");
    }
  }, [playing, now, startedAt, wrong, solved]);

  const label = (m) =>
    `${m.lang === "en" ? "English" : "Arabic"}: ${t("geoCountry")}${m.capitals ? ` & ${t("geoCapital")}` : ""}`;

  function start() {
    setQuestions(buildQuestions(mode, geoCountries));
    setIndex(0);
    setSolved(new Set());
    setWrong(0);
    setWrongId(null);
    setResult(null);
    setStartedAt(Date.now());
    setStatus("playing");
  }

  function stop() {
    clearTimeout(flashTimer.current);
    setWrongId(null);
    setResult(null);
    setStatus("idle");
  }

  function pick(id) {
    if (solved.has(id)) return; // already found: no effect, no penalty
    const q = questions[index];
    if (id === q.countryId) {
      const found = new Set(solved).add(id);
      setSolved(found);
      if (index + 1 === questions.length) {
        const ms = finalTime(Date.now() - startedAt, wrong);
        if (ms >= TIME_LIMIT_MS) {
          setResult({ ms: TIME_LIMIT_MS, isBest: false, timedOut: true, found: found.size });
        } else {
          setResult({ ms, isBest: submitGeoTime(mode.id, ms), timedOut: false, found: found.size });
        }
        setStatus("done");
      } else {
        setIndex(index + 1);
      }
    } else {
      setWrong(wrong + 1);
      setWrongId(id);
      clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setWrongId(null), 500);
    }
  }

  const q = playing ? questions[index] : null;
  const best = geoBest[modeId];

  return (
    <div className="geo">
      <div className="geo-controls">
        <select
          value={modeId}
          disabled={playing}
          aria-label="Mode"
          onChange={(e) => setModeId(e.target.value)}
        >
          {GEO_MODES.map((m) => (
            <option key={m.id} value={m.id}>{label(m)}</option>
          ))}
        </select>
        <span className="muted geo-best" dir="auto">
          {t("geoBest")}: {best != null ? formatTime(best) : "—"}
        </span>
        {playing ? (
          <button onClick={stop}><span dir="auto">{t("geoStop")}</span></button>
        ) : (
          <button className="primary" onClick={start}><span dir="auto">{t("geoStart")}</span></button>
        )}
      </div>

      {q && (
        <div className="geo-bar">
          <div className="geo-prompt">
            <span className="muted" dir="auto">
              {q.kind === "capital" ? `${t("geoCapital")} → ${t("geoCountry")}` : t("geoCountry")}
            </span>
            <strong className={mode.lang === "ar" ? "ar big" : "big"} dir={mode.lang === "ar" ? "rtl" : "ltr"}>
              {q.text}
            </strong>
          </div>
          <div className="geo-stats">
            <span>{index + 1} / {questions.length}</span>
            <span>✗ {wrong}</span>
            <span className="geo-time">{formatTime(elapsed)} / {formatTime(TIME_LIMIT_MS)}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="geo-result card">
          <h3>{result.timedOut ? "Time's up" : result.isBest ? "New best time!" : "Finished"}</h3>
          <p>
            {result.timedOut ? (
              <>Found {result.found} of {questions.length} in {formatTime(TIME_LIMIT_MS)}. No score recorded.</>
            ) : (
              <>
                Time <strong>{formatTime(result.ms)}</strong> ({wrong} wrong click{wrong === 1 ? "" : "s"}, +
                {(wrong * WRONG_PENALTY_MS) / 1000}s)
              </>
            )}
          </p>
          <button className="primary" onClick={start}><span dir="auto">{t("geoStart")}</span></button>
        </div>
      )}

      {status !== "idle" && <MenaMap solved={solved} wrongId={wrongId} onPick={pick} disabled={status === "done"} />}
    </div>
  );
}

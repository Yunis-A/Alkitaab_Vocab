import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useNow } from "../hooks.js";
import { formatInterval, RATINGS } from "../lib/leitner.js";
import { dialectOf, parseCardKey, varietyText } from "../lib/varieties.js";
import WordDetail from "../components/WordDetail.jsx";
import UnitPicker from "../components/UnitPicker.jsx";
import QuickStudy from "./QuickStudy.jsx";
import Matching from "./Matching.jsx";
import { levelKey } from "../lib/filters.js";
import { buildItems } from "../lib/study.js";

const VARIETY_LABELS = [
  ["ar-en", "studyFormal"],
  ["egy", "dialectEgyptian"],
  ["shm", "dialectShami"],
];

function Check({ checked, onChange, children }) {
  return (
    <label className="unit-box">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span><bdi>{children}</bdi></span>
    </label>
  );
}

const toggled = (set, value, on) => {
  const next = new Set(set);
  if (on) next.add(value); else next.delete(value);
  return next;
};

export default function Learn() {
  const { t, nf, level, visibleWords, activeCards, dialects } = useApp();
  const [mode, setMode] = useState("menu");
  const [units, setUnits] = useState(() => new Set([levelKey(level)]));
  const [lists, setLists] = useState(() => new Set([1, 2]));
  const [chosen, setChosen] = useState(() => new Set(["ar-en", "egy", "shm"]));
  const [englishFirst, setEnglishFirst] = useState(false);

  const dueCount = activeCards.filter(([, c]) => c.due <= Date.now()).length;
  // formal is always offered; a dialect only once it is switched on in Settings
  const offered = VARIETY_LABELS.filter(([v]) => v === "ar-en" || dialects[v === "egy" ? "egyptian" : "shami"]);
  const varieties = new Set(offered.map(([v]) => v).filter((v) => chosen.has(v)));
  const items = useMemo(
    () => buildItems(visibleWords, dialects, { units, lists, varieties }),
    [visibleWords, dialects, units, lists, chosen], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const exit = () => setMode("menu");

  if (mode === "review") return <Review onExit={exit} />;
  if (mode === "quick") return <QuickStudy items={items} englishFirst={englishFirst} onExit={exit} />;
  if (mode === "matching") return <Matching items={items} onExit={exit} />;

  return (
    <main className="page narrow">
      <section className="card">
        <h2><bdi>{t("reviewDue")}</bdi></h2>
        <p><bdi>{dueCount ? t("dueCount", dueCount, nf(dueCount)) : t("noneDue")}</bdi></p>
        <button className="primary" onClick={() => setMode("review")}>
          <span dir="auto">{t("reviewDue")}</span>
        </button>
      </section>

      <section className="card">
        <h2><bdi>{t("studyUnits")}</bdi></h2>
        <UnitPicker value={units} onChange={setUnits} />

        <div className="study-options">
          <div className="unit-boxes">
            <strong><bdi>{t("studyLists")}</bdi></strong>
            {[1, 2].map((n) => (
              <Check key={n} checked={lists.has(n)} onChange={(on) => setLists(toggled(lists, n, on))}>
                {t("studyListN", n, nf(n))}
              </Check>
            ))}
          </div>

          {offered.length > 1 && (
            <div className="unit-boxes">
              <strong><bdi>{t("studyVarieties")}</bdi></strong>
              {offered.map(([v, key]) => (
                <Check key={v} checked={chosen.has(v)} onChange={(on) => setChosen(toggled(chosen, v, on))}>
                  {t(key)}
                </Check>
              ))}
            </div>
          )}

          <div className="unit-boxes">
            <strong><bdi>{t("studyFirst")}</bdi></strong>
            <label className="unit-box">
              <input type="radio" name="first" checked={!englishFirst} onChange={() => setEnglishFirst(false)} />
              <span><bdi>{t("geoArabic")}</bdi></span>
            </label>
            <label className="unit-box">
              <input type="radio" name="first" checked={englishFirst} onChange={() => setEnglishFirst(true)} />
              <span><bdi>{t("geoEnglish")}</bdi></span>
            </label>
          </div>
        </div>

        {items.length === 0 && <p className="muted"><bdi>{t("studyNoUnits")}</bdi></p>}
        <div className="actions">
          <button className="primary" disabled={!items.length} onClick={() => setMode("quick")}>
            <span dir="auto">{t("quickStudy")}</span>
          </button>
          <button className="primary" disabled={items.length < 2} onClick={() => setMode("matching")}>
            <span dir="auto">{t("matching")}</span>
          </button>
        </div>
      </section>
    </main>
  );
}

// Active recall: see the Arabic, recall the meaning, flip, then rate confidence.
function Review({ onExit }) {
  const { t, level, wordsById, activeCards, rate } = useApp();
  const now = useNow(1000);
  const [revealed, setRevealed] = useState(false);

  const queue = useMemo(() => [...activeCards].sort((a, b) => a[1].due - b[1].due), [activeCards]);
  const current = queue.length && queue[0][1].due <= now ? queue[0] : null;
  const nextDue = queue.length && !current ? queue[0][1].due : null;

  const key = current?.[0];
  const { wordId, variety } = key ? parseCardKey(key) : {};
  const word = wordId ? wordsById.get(wordId) : null;
  const dialect = variety ? dialectOf(variety) : null;

  useEffect(() => {
    if (!current) return undefined;
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (!revealed && (e.code === "Space" || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && /^[1-3]$/.test(e.key)) {
        rate(key, RATINGS[Number(e.key) - 1]);
        setRevealed(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, key, revealed, rate]);

  if (!current) {
    return (
      <main className="page narrow">
        <section className="card">
          <h2><bdi>{t("sessionDone")}</bdi></h2>
          {nextDue && <p><bdi>{t("nextCardIn", formatInterval(nextDue - now))}</bdi></p>}
          <button onClick={onExit}>←</button>
        </section>
      </main>
    );
  }

  return (
    <main className="page narrow">
      <section className="card flash">
        <div className="face">
          {dialect && (
            <span className="badge badge-learning"><bdi>{t(dialect === "egyptian" ? "dialectEgyptian" : "dialectShami")}</bdi></span>
          )}
          <span className="ar huge" dir="rtl">{varietyText(word, variety, level)}</span>
        </div>

        {revealed ? (
          <>
            <hr />
            <WordDetail word={word} showStatus={false} />
            <div className="ratings">
              {RATINGS.map((r) => (
                <button
                  key={r}
                  className={`rate rate-${r}`}
                  onClick={() => {
                    rate(key, r);
                    setRevealed(false);
                  }}
                >
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
    </main>
  );
}

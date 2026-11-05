import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useNow } from "../hooks.js";
import { formatInterval, RATINGS } from "../lib/leitner.js";
import { dialectOf, parseCardKey, varietyText } from "../lib/varieties.js";
import WordDetail from "../components/WordDetail.jsx";
import UnitPicker from "../components/UnitPicker.jsx";
import QuickStudy from "./QuickStudy.jsx";
import GenderQuiz from "./GenderQuiz.jsx";
import ArticleQuiz from "./ArticleQuiz.jsx";
import GeoGame from "../components/GeoGame.jsx";
import Prepositions from "./Prepositions.jsx";
import VerbPatterns from "./VerbPatterns.jsx";
import { prepositionVerbs } from "../lib/prepositions.js";
import { PATTERNS_FROM } from "../lib/patterns.js";
import Matching from "./Matching.jsx";
import { levelReached } from "../config/books.js";
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

// The ways to study. `direct` ones start at once; the rest open a setup screen where the student picks the
// units (and a few options) first. `options` says which extra choices the setup shows.
const MODES = [
  { id: "review", title: "reviewDue", desc: "modeReviewDesc", direct: true },
  { id: "quick", title: "quickStudy", desc: "modeQuickDesc", options: ["lists", "varieties", "first"] },
  { id: "matching", title: "matching", desc: "modeMatchingDesc", options: ["lists", "varieties"] },
  { id: "prepositions", title: "prepositions", desc: "modePrepositionsDesc", options: [] },
  { id: "patterns", title: "studyPatterns", desc: "modePatternsDesc", direct: true, from: PATTERNS_FROM }, // covers what your level has learned
  { id: "geography", title: "geoGamesTitle", desc: "modeGeoGamesDesc" }, // opens a menu of geography games
];

// the games under "Geography games"
const GEO_GAMES = [
  { id: "map", title: "geoTitle", desc: "modeGeoDesc" },
  { id: "gender", title: "studyGender", desc: "modeGenderDesc", from: { book: 2, unit: 1 } }, // مُذَكَّر / مُؤَنَّث
  { id: "article", title: "studyArticle", desc: "modeArticleDesc" },
];

export default function Learn() {
  const { t, nf, level, visibleWords, activeCards, dialects } = useApp();
  const [mode, setMode] = useState("menu"); // "menu" | a mode id (setup) | "run:<id>"
  const [units, setUnits] = useState(() => new Set([levelKey(level)])); // the current lesson to start with
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
  // verbs of the chosen units, for the preposition and pattern trainers
  const chosenVerbs = useMemo(
    () => visibleWords.filter((w) => w.pos === "verb" && w.arabic && units.has(levelKey(w))),
    [visibleWords, units],
  );
  const prepVerbs = useMemo(() => prepositionVerbs(chosenVerbs), [chosenVerbs]);

  const exit = () => setMode("menu");
  const available = (m) => !m.from || levelReached(level, m.from);
  const count = { quick: items.length, matching: items.length, prepositions: prepVerbs.length };

  if (mode === "run:review") return <Review onExit={exit} />;
  if (mode === "run:quick") return <QuickStudy items={items} englishFirst={englishFirst} onExit={exit} />;
  if (mode === "run:matching") return <Matching items={items} onExit={exit} />;
  if (mode === "run:prepositions") return <Prepositions verbs={prepVerbs} onExit={exit} />;
  if (mode === "run:patterns") return <VerbPatterns onExit={exit} />;
  const backToGames = () => setMode("geography");
  if (mode === "run:gender") return <GenderQuiz onExit={backToGames} />;
  if (mode === "run:article") return <ArticleQuiz onExit={backToGames} />;
  if (mode === "run:map") {
    return (
      <main className="page">
        <div className="quick-bar">
          <button type="button" className="link-button" onClick={backToGames}><bdi>{t("studyExit")}</bdi></button>
        </div>
        <section className="card"><GeoGame /></section>
      </main>
    );
  }
  if (mode === "geography") {
    return (
      <main className="page">
        <div className="quick-bar">
          <button type="button" className="link-button" onClick={exit}><bdi>{t("studyExit")}</bdi></button>
        </div>
        <div className="mode-grid">
          {GEO_GAMES.filter(available).map((g) => (
            <button key={g.id} type="button" className="mode-card" onClick={() => setMode(`run:${g.id}`)}>
              <strong><bdi>{t(g.title)}</bdi></strong>
              <span className="muted"><bdi>{t(g.desc)}</bdi></span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  const setup = MODES.find((m) => m.id === mode);
  if (setup) {
    const needed = setup.id === "matching" ? 2 : 1;
    return (
      <main className="page narrow">
        <div className="quick-bar">
          <button type="button" className="link-button" onClick={exit}><bdi>{t("studyExit")}</bdi></button>
        </div>
        <section className="card">
          <h2><bdi>{t(setup.title)}</bdi></h2>
          <p className="muted"><bdi>{t(setup.desc)}</bdi></p>

          <h3><bdi>{t("studyUnits")}</bdi></h3>
          <UnitPicker value={units} onChange={setUnits} />

          <div className="study-options">
            {setup.options.includes("lists") && (
              <div className="unit-boxes">
                <strong><bdi>{t("studyLists")}</bdi></strong>
                {[1, 2].map((n) => (
                  <Check key={n} checked={lists.has(n)} onChange={(on) => setLists(toggled(lists, n, on))}>
                    {t("studyListN", n, nf(n))}
                  </Check>
                ))}
              </div>
            )}

            {setup.options.includes("varieties") && offered.length > 1 && (
              <div className="unit-boxes">
                <strong><bdi>{t("studyVarieties")}</bdi></strong>
                {offered.map(([v, key]) => (
                  <Check key={v} checked={chosen.has(v)} onChange={(on) => setChosen(toggled(chosen, v, on))}>
                    {t(key)}
                  </Check>
                ))}
              </div>
            )}

            {setup.options.includes("first") && (
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
            )}
          </div>

          {count[setup.id] < needed && <p className="muted"><bdi>{t("studyNoUnits")}</bdi></p>}
          <div className="actions">
            <button className="primary" disabled={count[setup.id] < needed} onClick={() => setMode(`run:${setup.id}`)}>
              <span dir="auto">{t("geoStart")}</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="mode-grid">
        {MODES.filter(available).map((m) => (
          <button key={m.id} type="button" className="mode-card" onClick={() => setMode(m.direct ? `run:${m.id}` : m.id)}>
            <strong><bdi>{t(m.title)}</bdi></strong>
            <span className="muted"><bdi>{t(m.desc)}</bdi></span>
            {m.id === "review" && (
              <span className="mode-badge"><bdi>{dueCount ? t("dueCount", dueCount, nf(dueCount)) : t("noneDue")}</bdi></span>
            )}
          </button>
        ))}
      </div>
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

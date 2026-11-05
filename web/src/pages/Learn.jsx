import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useNow } from "../hooks.js";
import { formatInterval, RATINGS } from "../lib/leitner.js";
import { dialectOf, parseCardKey, varietyText } from "../lib/varieties.js";
import WordDetail from "../components/WordDetail.jsx";
import UnitPicker from "../components/UnitPicker.jsx";
import QuickStudy from "./QuickStudy.jsx";
import GenderQuiz from "./GenderQuiz.jsx";
import SunMoonQuiz from "./SunMoonQuiz.jsx";
import Typing from "./Typing.jsx";
import ArticleQuiz from "./ArticleQuiz.jsx";
import GeoGame from "../components/GeoGame.jsx";
import Prepositions from "./Prepositions.jsx";
import VerbPatterns from "./VerbPatterns.jsx";
import { prepositionVerbs } from "../lib/prepositions.js";
import { PATTERNS_FROM } from "../lib/patterns.js";
import Conjugation from "./Conjugation.jsx";
import { conjugationItems, learnedMoods, learnedPersons, tensesAt } from "../lib/conjugation.js";
import { MOOD_LABELS } from "../lib/moods.js";
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
// units (and a few options) first. `options` says which extra choices the setup shows. A mode with no setup and
// not `direct` is a group (see GROUPS).
const MODES = [
  { id: "review", title: "reviewDue", desc: "modeReviewDesc", direct: true },
  { id: "quick", title: "quickStudy", desc: "modeQuickDesc", options: ["lists", "varieties", "first"] },
  { id: "matching", title: "matching", desc: "modeMatchingDesc", options: ["lists", "varieties"] },
  { id: "verbs", title: "studyVerbs", desc: "modeVerbsDesc" }, // opens a menu: prepositions, verb patterns, conjugation
  { id: "typing", title: "studyTyping", desc: "modeTypingDesc", direct: true },
  { id: "sunmoon", title: "studySunMoon", desc: "modeSunMoonDesc", direct: true, from: { book: 1, unit: 9 } }, // شَمس / قَمَر are taught in Alif Baa lesson 9
  { id: "geography", title: "geoGamesTitle", desc: "modeGeoGamesDesc" }, // opens a menu of geography games
];

// the games under "Verbs"
const CONJUGATION_FROM = PATTERNS_FROM; // the present tense is learned at part 1 lesson 4
const VERB_GAMES = [
  { id: "prepositions", title: "prepositions", desc: "modePrepositionsDesc", options: [] },
  { id: "patterns", title: "studyPatterns", desc: "modePatternsDesc", direct: true, from: PATTERNS_FROM }, // covers what your level has learned
  { id: "conjugation", title: "studyConjugation", desc: "modeConjugationDesc", options: ["tenses", "moods", "pronouns"], from: CONJUGATION_FROM },
];

// the games under "Geography games"
const GEO_GAMES = [
  { id: "map", title: "geoTitle", desc: "modeGeoDesc", direct: true },
  { id: "gender", title: "studyGender", desc: "modeGenderDesc", direct: true, from: { book: 2, unit: 1 } }, // مُذَكَّر / مُؤَنَّث
  { id: "article", title: "studyArticle", desc: "modeArticleDesc", direct: true },
];

const GROUPS = { verbs: VERB_GAMES, geography: GEO_GAMES };
// where Exit goes from a game or setup that sits in a group
const PARENT = Object.fromEntries(Object.entries(GROUPS).flatMap(([group, games]) => games.map((g) => [g.id, group])));

export default function Learn() {
  const { t, nf, level, visibleWords, activeCards, dialects } = useApp();
  const [mode, setMode] = useState("menu"); // "menu" | a mode id (setup) | "run:<id>"
  const [units, setUnits] = useState(() => new Set([levelKey(level)])); // the current lesson to start with
  const [lists, setLists] = useState(() => new Set([1, 2]));
  const [chosen, setChosen] = useState(() => new Set(["ar-en", "egy", "shm"]));
  const [englishFirst, setEnglishFirst] = useState(false);
  const [offTenses, setOffTenses] = useState(() => new Set()); // conjugation: types unticked (all learned ones start on)
  const [offPersons, setOffPersons] = useState(() => new Set()); // conjugation: pronouns unticked (all learned ones start on)
  const [offMoods, setOffMoods] = useState(() => new Set()); // conjugation: moods unticked

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
  // conjugation: the pronouns learned so far, minus those unticked; every verb of the list for the form check
  const learned = useMemo(() => learnedPersons(level), [level]);
  const persons = useMemo(() => new Set(learned.filter((p) => !offPersons.has(p))), [learned, offPersons]);
  const allVerbs = useMemo(() => visibleWords.filter((w) => w.pos === "verb" && w.arabic && w.root), [visibleWords]);
  // the types (past, present, verbal noun) and moods learned so far, minus those unticked
  const learnedTenses = useMemo(() => tensesAt(level), [level]);
  const tenses = useMemo(() => new Set(learnedTenses.filter((x) => !offTenses.has(x))), [learnedTenses, offTenses]);
  const learnedMoodList = useMemo(() => learnedMoods(level), [level]);
  const moods = useMemo(() => new Set(learnedMoodList.filter((m) => !offMoods.has(m))), [learnedMoodList, offMoods]);
  // once a mood is learned the present is asked by mood; before, plain, accepting any mood or no ending
  const conjItems = useMemo(
    () => conjugationItems(chosenVerbs, { tenses, persons, moods: learnedMoodList.length ? moods : null }),
    [chosenVerbs, tenses, persons, moods, learnedMoodList],
  );

  const exit = () => setMode("menu");
  const back = (id) => () => setMode(PARENT[id] ?? "menu");
  const available = (m) => !m.from || levelReached(level, m.from);
  const count = { quick: items.length, matching: items.length, prepositions: prepVerbs.length, conjugation: conjItems.length };

  if (mode === "run:review") return <Review onExit={exit} />;
  if (mode === "run:quick") return <QuickStudy items={items} englishFirst={englishFirst} onExit={exit} />;
  if (mode === "run:matching") return <Matching items={items} onExit={exit} />;
  if (mode === "run:prepositions") return <Prepositions verbs={prepVerbs} onExit={back("prepositions")} />;
  if (mode === "run:patterns") return <VerbPatterns onExit={back("patterns")} />;
  if (mode === "run:conjugation") return <Conjugation items={conjItems} allVerbs={allVerbs} onExit={back("conjugation")} />;
  if (mode === "run:gender") return <GenderQuiz onExit={back("gender")} />;
  if (mode === "run:article") return <ArticleQuiz onExit={back("article")} />;
  if (mode === "run:sunmoon") return <SunMoonQuiz onExit={exit} />;
  if (mode === "run:typing") return <Typing onExit={exit} />;
  if (mode === "run:map") {
    return (
      <main className="page">
        <div className="quick-bar">
          <button type="button" className="link-button" onClick={back("map")}><bdi>{t("studyExit")}</bdi></button>
        </div>
        <section className="card"><GeoGame /></section>
      </main>
    );
  }
  // a group: a menu of games (the geography games, the verb games)
  if (GROUPS[mode]) {
    return (
      <main className="page">
        <div className="quick-bar">
          <button type="button" className="link-button" onClick={exit}><bdi>{t("studyExit")}</bdi></button>
        </div>
        <div className="mode-grid">
          {GROUPS[mode].filter(available).map((g) => (
            <button key={g.id} type="button" className="mode-card" onClick={() => setMode(g.options ? g.id : `run:${g.id}`)}>
              <strong><bdi>{t(g.title)}</bdi></strong>
              <span className="muted"><bdi>{t(g.desc)}</bdi></span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  const setup = [...MODES, ...VERB_GAMES].find((m) => m.id === mode && m.options);
  if (setup) {
    const needed = setup.id === "matching" ? 2 : 1;
    return (
      <main className="page narrow">
        <div className="quick-bar">
          <button type="button" className="link-button" onClick={back(setup.id)}><bdi>{t("studyExit")}</bdi></button>
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
            {setup.options.includes("tenses") && (
              <details className="collapse">
                <summary><bdi>{t("conjTenses")}</bdi></summary>
                <div className="unit-boxes">
                  {learnedTenses.map((tense) => (
                    <Check key={tense} checked={tenses.has(tense)} onChange={(on) => setOffTenses(toggled(offTenses, tense, !on))}>
                      {t(tense)}
                    </Check>
                  ))}
                </div>
              </details>
            )}

            {setup.options.includes("moods") && learnedMoodList.length > 0 && tenses.has("present") && (
              <details className="collapse">
                <summary><bdi>{t("present")}</bdi></summary>
                <div className="unit-boxes">
                  {learnedMoodList.map((m) => (
                    <label key={m} className="unit-box">
                      <input type="checkbox" checked={moods.has(m)} onChange={(e) => setOffMoods(toggled(offMoods, m, !e.target.checked))} />
                      <span className="ar" dir="rtl">{MOOD_LABELS[m]}</span>
                    </label>
                  ))}
                </div>
              </details>
            )}

            {setup.options.includes("pronouns") && (
              <details className="collapse">
                <summary><bdi>{t("conjPronouns")}</bdi></summary>
                <div className="unit-boxes">
                  {learned.map((p) => (
                    <Check key={p} checked={persons.has(p)} onChange={(on) => setOffPersons(toggled(offPersons, p, !on))}>
                      {t(`person.${p}`)}
                    </Check>
                  ))}
                </div>
              </details>
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

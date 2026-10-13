import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useNow } from "../hooks.js";
import { cardKey, formatInterval, RATINGS } from "../lib/leitner.js";
import WordDetail from "../components/WordDetail.jsx";

const NEW_BATCH = 10;

export default function Learn() {
  const { t, nf, visibleWords, visibleIds, cards } = useApp();
  const [mode, setMode] = useState("menu");
  const [batch, setBatch] = useState([]);

  const newWords = visibleWords.filter((w) => !cards[cardKey(w.id)]);
  const dueCount = Object.entries(cards).filter(
    ([key, c]) => visibleIds.has(key.split("|")[0]) && c.due <= Date.now(),
  ).length;

  if (mode === "intro") {
    return <Intro words={batch} onDone={() => setMode("review")} />;
  }
  if (mode === "review") {
    return <Review onExit={() => setMode("menu")} />;
  }

  return (
    <main className="page narrow">
      <section className="card">
        <h2><bdi>{t("learnNew")}</bdi></h2>
        {newWords.length ? (
          <p><bdi>{t("newCount", newWords.length, nf(newWords.length))}</bdi></p>
        ) : (
          <p><bdi>{t("noNewWords")}</bdi></p>
        )}
        <button
          className="primary"
          disabled={!newWords.length}
          onClick={() => {
            setBatch(newWords.slice(0, NEW_BATCH));
            setMode("intro");
          }}
        >
          <span dir="auto">{t("learnNew")}</span>
        </button>
      </section>

      <section className="card">
        <h2><bdi>{t("reviewDue")}</bdi></h2>
        <p><bdi>{dueCount ? t("dueCount", dueCount, nf(dueCount)) : t("noneDue")}</bdi></p>
        <button className="primary" onClick={() => setMode("review")}>
          <span dir="auto">{t("reviewDue")}</span>
        </button>
      </section>
    </main>
  );
}

// First exposure: show the full entry, then start tracking the word.
function Intro({ words, onDone }) {
  const { t, nf, introduce } = useApp();
  const [i, setI] = useState(0);
  const word = words[i];

  if (!word) return <Finish onDone={onDone} />;

  return (
    <main className="page narrow">
      <p className="muted"><bdi>{t("cardOf", nf(i + 1), nf(words.length))}</bdi></p>
      <section className="card flash">
        <WordDetail word={word} showStatus={false} />
        <button
          className="primary"
          onClick={() => {
            introduce(word.id);
            setI(i + 1);
          }}
        >
          <span dir="auto">{t("gotIt")}</span>
        </button>
      </section>
    </main>
  );
}

function Finish({ onDone }) {
  useEffect(onDone, [onDone]);
  return null;
}

// Active recall: see the Arabic, recall the meaning, flip, then rate confidence.
function Review({ onExit }) {
  const { t, words, visibleIds, cards, rate } = useApp();
  const now = useNow(1000);
  const [revealed, setRevealed] = useState(false);

  const byId = useMemo(() => new Map(words.map((w) => [w.id, w])), [words]);

  const queue = Object.entries(cards)
    .filter(([key]) => visibleIds.has(key.split("|")[0]))
    .sort((a, b) => a[1].due - b[1].due);
  const current = queue.length && queue[0][1].due <= now ? queue[0] : null;
  const nextDue = queue.length && !current ? queue[0][1].due : null;

  const key = current?.[0];
  const word = key ? byId.get(key.split("|")[0]) : null;

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
          <span className="ar huge" dir="rtl">{word.arabic}</span>
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

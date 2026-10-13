import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { useNow } from "../hooks.js";
import { cardKey } from "../lib/leitner.js";

const STATUSES = [
  ["new", "statusNew"],
  ["learning", "statusLearning"],
  ["proficient", "statusProficient"],
  ["mastered", "statusMastered"],
];

export default function Home() {
  const { t, nf, visibleWords, visibleIds, cards, statusOf } = useApp();
  const now = useNow(15000);

  const dueCount = Object.entries(cards).filter(
    ([key, c]) => visibleIds.has(key.split("|")[0]) && c.due <= now,
  ).length;
  const newCount = visibleWords.filter((w) => !cards[cardKey(w.id, "ar-en")]).length;

  const counts = { new: 0, learning: 0, proficient: 0, mastered: 0 };
  for (const w of visibleWords) counts[statusOf(w.id)] += 1;
  const total = visibleWords.length || 1;

  return (
    <main className="page">
      <h1><bdi>{t("welcome")}</bdi></h1>

      <section className="card">
        <h2><bdi>{t("dueTitle")}</bdi></h2>
        <p><bdi>{dueCount ? t("dueCount", dueCount, nf(dueCount)) : t("noneDue")}</bdi></p>
        {newCount > 0 && <p><bdi>{t("newCount", newCount, nf(newCount))}</bdi></p>}
        <Link className="button primary" to="/learn" dir="auto">{t("navLearn")}</Link>
      </section>

      <section className="card">
        <h2><bdi>{t("progressTitle")}</bdi></h2>
        <div className="bar" role="img" aria-label={t("progressTitle")}>
          {STATUSES.map(([s]) => (
            <span key={s} className={`seg seg-${s}`} style={{ width: `${(counts[s] / total) * 100}%` }} />
          ))}
        </div>
        <ul className="legend">
          {STATUSES.map(([s, key]) => (
            <li key={s}>
              <span className={`dot seg-${s}`} />
              <span dir="auto">{t(key)}</span>: {nf(counts[s])}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

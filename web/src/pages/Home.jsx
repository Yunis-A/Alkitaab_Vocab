import { useState } from "react";
import { Link } from "react-router-dom";
import { NAME_AR_FROM, levelReached } from "../config/books.js";
import { useApp } from "../context/AppContext.jsx";
import { useNow } from "../hooks.js";

const STATUSES = [
  ["new", "statusNew"],
  ["learning", "statusLearning"],
  ["proficient", "statusProficient"],
  ["mastered", "statusMastered"],
];

export default function Home() {
  const { t, nf, level, visibleWords, activeCards, statusOf, displayName, profile, setProfile } = useApp();
  const [nameAr, setNameAr] = useState("");
  const now = useNow(15000);

  const dueCount = activeCards.filter(([, c]) => c.due <= now).length;

  const counts = { new: 0, learning: 0, proficient: 0, mastered: 0 };
  for (const w of visibleWords) counts[statusOf(w.id)] += 1;
  const total = visibleWords.length || 1;

  return (
    <main className="page">
      <h1><bdi>{displayName ? t("welcomeName", displayName) : t("welcome")}</bdi></h1>

      {/* once Alif Baa is finished: the name in Arabic, shown from then on instead of the English one */}
      {levelReached(level, NAME_AR_FROM) && !profile.nameAr.trim() && !profile.skippedAr && (
        <section className="card">
          <h2><bdi>{t("nameArAsk")}</bdi></h2>
          <form className="name-form" onSubmit={(e) => { e.preventDefault(); if (nameAr.trim()) setProfile({ nameAr: nameAr.trim() }); }}>
            <input className="ar" dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
            <button className="primary" disabled={!nameAr.trim()}><span dir="auto">{t("editSave")}</span></button>
            <button type="button" onClick={() => setProfile({ skippedAr: true })}><span dir="auto">{t("nameLater")}</span></button>
          </form>
        </section>
      )}

      <section className="card">
        <h2><bdi>{t("dueTitle")}</bdi></h2>
        <p><bdi>{dueCount ? t("dueCount", dueCount, nf(dueCount)) : t("noneDue")}</bdi></p>
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

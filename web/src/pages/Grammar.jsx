import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { grammarSections } from "../data/grammar.js";
import { nextLockedSection, sectionTitle, unlockedSections, wordsForSection } from "../lib/grammar.js";
import { hasArabic } from "../lib/arabic.js";

const MAX_WORDS = 12;

// Wraps Arabic cell text so it gets the Arabic font and direction.
function Cell({ text }) {
  return hasArabic(text) ? <span className="ar" dir="auto">{text}</span> : <span dir="auto">{text}</span>;
}

function Block({ block }) {
  if (block.p) return <p><bdi>{block.p}</bdi></p>;

  if (block.examples) {
    return (
      <ul className="examples">
        {block.examples.map((e) => (
          <li key={e.ar}>
            <span className="ar big" dir="rtl">{e.ar}</span>
            <span className="muted" dir="auto">{e.en}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.table) {
    const { head, rows } = block.table;
    return (
      <table className="grammar-table">
        <thead>
          <tr>{head.map((h) => <th key={h}><bdi>{h}</bdi></th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join("|")}>
              {r.map((c, i) => <td key={i}><Cell text={c} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return null;
}

export default function Grammar() {
  const { t, level, visibleWords, nf, bookName } = useApp();
  const { hash } = useLocation();
  const open = hash.slice(1);

  const unlocked = unlockedSections(grammarSections, level);
  const next = nextLockedSection(grammarSections, level);

  useEffect(() => {
    if (open) document.getElementById(open)?.scrollIntoView({ block: "start" });
  }, [open]);

  return (
    <main className="page">
      <h1><bdi>{t("navGrammar")}</bdi></h1>
      <p className="muted"><bdi>{t("grammarIntro")}</bdi></p>

      {unlocked.map((s) => {
        const related = wordsForSection(s, visibleWords);
        return (
          <details key={s.id} id={s.id} className="card grammar" open={open === s.id || undefined}>
            <summary><bdi>{sectionTitle(s, level)}</bdi></summary>
            <div className="grammar-body">
              {s.body.map((b, i) => <Block key={i} block={b} />)}
              {related.length > 0 && (
                <div className="related">
                  <h4><bdi>{t("yourWords")}</bdi></h4>
                  <div className="chips">
                    {related.slice(0, MAX_WORDS).map((w) => (
                      <Link key={w.id} className="chip ar" dir="rtl" to={`/lookup?q=${encodeURIComponent(w.arabic)}`}>
                        {w.arabic}
                      </Link>
                    ))}
                    {related.length > MAX_WORDS && <span className="muted">+{nf(related.length - MAX_WORDS)}</span>}
                  </div>
                </div>
              )}
            </div>
          </details>
        );
      })}

      <p className="muted">
        <bdi>
          {next
            ? t("grammarNext", `${bookName(next.unlock.book)} / ${nf(next.unlock.unit)}`)
            : t("grammarAllUnlocked")}
        </bdi>
      </p>
    </main>
  );
}

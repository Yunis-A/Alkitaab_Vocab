import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { search } from "../lib/search.js";
import { headword } from "../lib/varieties.js";
import WordDetail, { posLabel } from "../components/WordDetail.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const PAGE = 50;

export default function Lookup() {
  const { t, nf, visibleIndex, dialects } = useApp();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [limit, setLimit] = useState(PAGE);

  const results = useMemo(() => search(visibleIndex, q, dialects), [visibleIndex, q, dialects]);
  const shown = results.slice(0, limit);

  return (
    <main className="page">
      <input
        className="search"
        type="search"
        value={q}
        placeholder={t("searchPlaceholder")}
        onChange={(e) => {
          setLimit(PAGE);
          setParams(e.target.value ? { q: e.target.value } : {}, { replace: true });
        }}
        autoFocus
      />

      {results.length === 0 && <p><bdi>{t("noResults")}</bdi></p>}

      <ul className="results">
        {shown.map((w) => (
          <li key={w.id}>
            <details open={results.length <= 3}>
              <summary>
                <span className="ar big" dir="rtl">{headword(w, dialects)}</span>
                <span className="def" dir="auto">{w.definition}</span>
                <span className="pos" dir="auto">{posLabel(t, w.pos)}</span>
                <StatusBadge wordId={w.id} />
              </summary>
              <WordDetail word={w} showStatus={false} showHeader={false} />
            </details>
          </li>
        ))}
      </ul>

      {results.length > limit && (
        <button onClick={() => setLimit(limit + PAGE)}>+{nf(results.length - limit)}</button>
      )}
    </main>
  );
}

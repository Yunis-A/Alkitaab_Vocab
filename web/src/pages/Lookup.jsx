import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { GENDER_FROM, books, levelReached } from "../config/books.js";
import { search } from "../lib/search.js";
import { headword, varietyText, DIALECTS, DIALECT_VARIETY } from "../lib/varieties.js";
import {
  activeFilterCount, filterOptions, filterWords, filtersFromParams, levelKey, levelsUpTo,
} from "../lib/filters.js";
import WordDetail, { posLabel } from "../components/WordDetail.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import AddWord from "../components/AddWord.jsx";

const PAGE = 50;
const POS_ORDER = ["noun", "verb", "adjective", "adverb", "particle", "pronoun", "phrase", "suffix"];
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const STATUSES = [
  ["new", "statusNew"],
  ["learning", "statusLearning"],
  ["proficient", "statusProficient"],
  ["mastered", "statusMastered"],
];

function Select({ label, value, onChange, children }) {
  return (
    <label className="filter">
      <span><bdi>{label}</bdi></span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  );
}

export default function Lookup() {
  const { t, nf, bookName, myIds, level, visibleWords, visibleIndex, dialects, statusOf } = useApp();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const rawFilters = filtersFromParams(params);
  // A dialect filter left in the URL does nothing once that dialect is switched off.
  const showGender = levelReached(level, GENDER_FROM); // gender information starts at Alif Baa lesson 6
  const filters = { ...rawFilters, dialect: dialects[rawFilters.dialect] ? rawFilters.dialect : "", gender: showGender ? rawFilters.gender : "" };
  const [limit, setLimit] = useState(PAGE);

  // Everything lives in the URL (replace, so filtering does not fill the back button).
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    // verb form and gender only make sense for their type
    if (key === "pos") { if (value !== "verb") next.delete("form"); if (value !== "noun") next.delete("gender"); }
    setLimit(PAGE);
    setParams(next, { replace: true });
  };
  const clearFilters = () => {
    const next = new URLSearchParams(params);
    for (const k of Object.keys(filters)) next.delete(k);
    setLimit(PAGE);
    setParams(next, { replace: true });
  };

  const options = useMemo(() => filterOptions(visibleWords), [visibleWords]);
  // newest lesson first, so the book you are in is at the top of the list
  const levels = useMemo(() => levelsUpTo(level, books).reverse(), [level]);
  // newest lessons first unless the student picks "oldest" (kept in the URL as sort=oldest)
  const order = params.get("sort") === "oldest" ? "oldest" : "newest";
  const found = useMemo(() => search(visibleIndex, q, dialects, order, level), [visibleIndex, q, dialects, order, level]);
  const results = useMemo(() => filterWords(found, filters, { statusOf }), [found, params, dialects, statusOf]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = results.slice(0, limit);
  const active = activeFilterCount(filters);
  const enabledDialects = DIALECTS.filter((d) => dialects[d]);

  const lessonOption = (l) => (
    <option key={levelKey(l)} value={levelKey(l)}>
      {bookName(l.book)} / {nf(l.unit)}
    </option>
  );

  return (
    <main className="page lookup-page">
      <div className="lookup-layout">
      <div className="lookup-main">
      <input
        className="search"
        type="search"
        value={q}
        placeholder={t("searchPlaceholder")}
        onChange={(e) => setParam("q", e.target.value)}
        autoFocus
      />

      <div className="filters">
        <Select label={t("filterType")} value={filters.pos} onChange={(v) => setParam("pos", v)}>
          <option value="">{t("filterAny")}</option>
          {POS_ORDER.filter((p) => options.pos.has(p)).map((p) => (
            <option key={p} value={p}>{posLabel(t, p)} ({nf(options.pos.get(p))})</option>
          ))}
        </Select>

        <Select label={t("filterFrom")} value={filters.from} onChange={(v) => setParam("from", v)}>
          <option value="">{t("filterBeginning")}</option>
          {levels.map(lessonOption)}
        </Select>
        <Select label={t("filterTo")} value={filters.to} onChange={(v) => setParam("to", v)}>
          <option value="">{t("filterEnd")}</option>
          {levels.map(lessonOption)}
        </Select>

        {filters.pos === "verb" && (
          <Select label={t("filterForm")} value={filters.form} onChange={(v) => setParam("form", v)}>
            <option value="">{t("filterAny")}</option>
            {[...options.form.keys()].sort((a, b) => a - b).map((f) => (
              <option key={f} value={String(f)}>{ROMAN[f]} ({nf(options.form.get(f))})</option>
            ))}
          </Select>
        )}

        {filters.pos === "noun" && showGender && (
          <Select label={t("gender")} value={filters.gender} onChange={(v) => setParam("gender", v)}>
            <option value="">{t("filterAny")}</option>
            {["masculine", "feminine"].filter((g) => options.gender.has(g)).map((g) => (
              <option key={g} value={g}>{t(g)}</option>
            ))}
          </Select>
        )}

        <Select label={t("filterStatus")} value={filters.status} onChange={(v) => setParam("status", v)}>
          <option value="">{t("filterAny")}</option>
          {STATUSES.map(([s, key]) => <option key={s} value={s}>{t(key)}</option>)}
        </Select>

        <Select label={t("filterSort")} value={order} onChange={(v) => setParam("sort", v === "newest" ? "" : v)}>
          <option value="newest">{t("sortNewest")}</option>
          <option value="oldest">{t("sortOldest")}</option>
        </Select>

        {enabledDialects.length > 0 && (
          <Select label={t("filterDialect")} value={filters.dialect} onChange={(v) => setParam("dialect", v)}>
            <option value="">{t("filterAny")}</option>
            {enabledDialects.map((d) => (
              <option key={d} value={d}>{t(d === "egyptian" ? "dialectEgyptian" : "dialectShami")}</option>
            ))}
          </Select>
        )}

        {active > 0 && (
          <button type="button" className="link-button" onClick={clearFilters}>
            <bdi>{t("filterReset")} ({nf(active)})</bdi>
          </button>
        )}
      </div>

      <p className="muted result-count" aria-live="polite">
        <bdi>{t("resultsCount", results.length, nf(results.length))}</bdi>
      </p>

      {results.length === 0 && <p><bdi>{t("noResults")}</bdi></p>}

      <ul className="results">
        {shown.map((w) => (
          <li key={w.id}>
            <details open={results.length <= 3}>
              <summary>
                <span className="ar big" dir="rtl">
                  {filters.dialect ? varietyText(w, DIALECT_VARIETY[filters.dialect], level) : headword(w, dialects, level)}
                </span>
                <span className="def" dir="auto">{w.definition}</span>
                <span className="pos" dir="auto">{posLabel(t, w.pos)}</span>
                {myIds.has(w.id) && <span className="badge badge-learning my-badge"><bdi>{t("myWord")}</bdi></span>}
                <StatusBadge wordId={w.id} />
              </summary>
              <WordDetail word={w} showStatus={false} showHeader={false} dialectOnly={filters.dialect || null} />
            </details>
          </li>
        ))}
      </ul>

      {results.length > limit && (
        <button onClick={() => setLimit(limit + PAGE)}>+{nf(results.length - limit)}</button>
      )}
      </div>
      <AddWord />
      </div>
    </main>
  );
}

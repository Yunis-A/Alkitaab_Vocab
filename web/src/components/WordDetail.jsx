import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { getForms, PAST_PERSONS, IMPERATIVE_PERSONS } from "../lib/morphology.js";
import StatusBadge from "./StatusBadge.jsx";
import { grammarSections } from "../data/grammar.js";
import { IMPERATIVE_LEVEL, levelReached } from "../config/books.js";
import { sectionsForWord, sectionTitle } from "../lib/grammar.js";

const POS_KEYS = {
  noun: "posNoun",
  verb: "posVerb",
  adjective: "posAdjective",
  particle: "posParticle",
};

export function posLabel(t, pos) {
  return t(POS_KEYS[pos] ?? "posOther");
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function TenseTable({ title, data, order }) {
  const { t } = useApp();
  const rows = order.filter((p) => data[p]);
  if (!rows.length) return null;
  return (
    <div className="tense">
      <h4>{title}</h4>
      <table>
        <tbody>
          {rows.map((p) => (
            <tr key={p}>
              <th scope="row"><bdi>{t(`person.${p}`)}</bdi></th>
              <td className="ar" dir="rtl">{data[p]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <dt><bdi>{label}</bdi></dt>
      <dd>{children}</dd>
    </div>
  );
}

function Participle({ p }) {
  const parts = [p.m, p.f, p.pm, p.pf].filter(Boolean);
  return <span className="ar" dir="rtl">{parts.join(" · ")}</span>;
}

// showHeader=false omits the big Arabic word and its meaning, for places that
// already show them (the Lookup row).
export default function WordDetail({ word, showStatus = true, showHeader = true }) {
  const { t, level, nf, bookName, showTransliteration } = useApp();
  const f = getForms(word);
  const showImperative = !!level && levelReached(level, IMPERATIVE_LEVEL);
  const missing = f.missing.filter((k) => showImperative || k !== "imperative");
  const grammar = level ? sectionsForWord(grammarSections, word, level) : [];

  return (
    <div className="word-detail">
      {showHeader && (
        <>
          <div className="word-top">
            <span className="ar big" dir="rtl">{word.arabic}</span>
            {showStatus && <StatusBadge wordId={word.id} />}
          </div>
          <p className="definition"><bdi>{word.definition}</bdi></p>
        </>
      )}
      {showTransliteration && word.transliteration && <p className="translit">{word.transliteration}</p>}

      <dl className="fields">
        <Field label={t("pos")}>
          <span dir="auto">{posLabel(t, word.pos)}</span>
          {word.form ? <span> · {t("form")} {ROMAN[word.form]}</span> : null}
        </Field>
        {word.root && (
          <Field label={t("root")}>
            <Link className="root-link ar" dir="rtl" to={`/lookup?q=${encodeURIComponent(word.root)}`}>
              {word.root}
            </Link>
          </Field>
        )}
        {word.gender && (
          <Field label={t("gender")}>
            <span dir="auto">{t(word.gender)}</span>
          </Field>
        )}
        {f.plural && (
          <Field label={t("plural")}>
            <span className="ar" dir="rtl">{f.plural}</span>
          </Field>
        )}
        {word.prepositions?.length > 0 && (
          <Field label={t("prepositions")}>
            <span className="ar" dir="rtl">{word.prepositions.join(" · ")}</span>
          </Field>
        )}
        {f.masdar && (
          <Field label={t("masdar")}>
            <span className="ar" dir="rtl">{f.masdar.join(" · ")}</span>
          </Field>
        )}
        {f.activeParticiple && (
          <Field label={t("activeParticiple")}>
            <Participle p={f.activeParticiple} />
          </Field>
        )}
        {f.passiveParticiple && (
          <Field label={t("passiveParticiple")}>
            <Participle p={f.passiveParticiple} />
          </Field>
        )}
        <Field label={t("unitOfBook")}>
          <span dir="auto">{bookName(word.book)} / {nf(word.unit)}</span>
        </Field>
        {grammar.length > 0 && (
          <Field label={t("grammarLinks")}>
            <span className="grammar-links">
              {grammar.map((s) => (
                <Link key={s.id} className="chip" to={`/grammar#${s.id}`} dir="auto">
                  {sectionTitle(s, level)}
                </Link>
              ))}
            </span>
          </Field>
        )}
      </dl>

      {word.notes && (
        <p className="notes">
          <bdi><strong>{t("notes")}: </strong>{word.notes}</bdi>
        </p>
      )}

      {f.isVerb && (f.past || f.present || (showImperative && f.imperative)) && (
        <section className="conjugations">
          <h3><bdi>{t("conjugations")}</bdi></h3>
          <div className="tenses">
            {f.past && <TenseTable title={t("past")} data={f.past} order={PAST_PERSONS} />}
            {f.present && <TenseTable title={t("present")} data={f.present} order={PAST_PERSONS} />}
            {showImperative && f.imperative && <TenseTable title={t("imperative")} data={f.imperative} order={IMPERATIVE_PERSONS} />}
          </div>
        </section>
      )}

      {f.isVerb && missing.length > 0 && (
        <p className="warn">
          <bdi>
            {t("notStored")} {missing.map((k) => t(k)).join(", ")}
            {f.irregularReason ? ` (${f.irregularReason})` : ""}
          </bdi>
        </p>
      )}
    </div>
  );
}

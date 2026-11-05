import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { getForms, PAST_PERSONS, IMPERATIVE_PERSONS } from "../lib/morphology.js";
import StatusBadge from "./StatusBadge.jsx";
import { presentChart } from "../lib/chart.js";
import { grammarSections } from "../data/grammar.js";
import { IMPERATIVE_LEVEL, levelReached } from "../config/books.js";
import { sectionsForWord, sectionTitle } from "../lib/grammar.js";
import { DIALECTS, headword } from "../lib/varieties.js";

const POS_KEYS = {
  noun: "posNoun",
  verb: "posVerb",
  adjective: "posAdjective",
  particle: "posParticle",
  adverb: "posAdverb",
  pronoun: "posPronoun",
  phrase: "posPhrase",
  suffix: "posSuffix",
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

// One dialect's forms for this word (only rendered for dialects the student enabled).
function DialectBlock({ name, data, showFeminine, showPlural }) {
  const { t } = useApp();
  const list = (s) => (Array.isArray(s) ? s.join(" · ") : s);
  const rows = [
    [data.past ? t("past") : null, data.past && data.past !== data.arabic ? null : data.past],
    [t("present"), data.present && data.present !== data.arabic ? data.present : null],
    [t("masdar"), data.masdar],
    [t("plural"), showPlural ? list(data.plural) : null],
    [t("femForm"), showFeminine ? data.feminine : null],
    [t("prepositions"), list(data.prepositions)],
    [t("alsoLabel"), list(data.alternates)],
  ].filter(([, v]) => v);
  return (
    <section className="dialect">
      <h4><bdi>{t(name === "egyptian" ? "dialectEgyptian" : "dialectShami")}</bdi></h4>
      <div className="dialect-head">
        {data.arabic && <span className="ar big" dir="rtl">{data.arabic}</span>}
      </div>
      {rows.length > 0 && (
        <dl className="fields">
          {rows.map(([label, value]) => (
            <Field key={label} label={label}>
              <span className="ar" dir="rtl">{value}</span>
            </Field>
          ))}
        </dl>
      )}
      {data.notes?.length > 0 && <p className="notes"><bdi>{list(data.notes)}</bdi></p>}
    </section>
  );
}

// showHeader=false omits the big Arabic word and its meaning, for places that
// already show them (the Lookup row). links=false turns the root and grammar links into plain text, for
// sessions (quick study) that must not be left by accident.
export default function WordDetail({ word, showStatus = true, showHeader = true, links = true }) {
  const { t, level, nf, bookName, showTransliteration, dialects } = useApp();
  const f = getForms(word);
  const showImperative = !!level && levelReached(level, IMPERATIVE_LEVEL);
  const missing = f.missing.filter((k) => showImperative || k !== "imperative");
  const grammar = level ? sectionsForWord(grammarSections, word, level) : [];
  // Forms that the list only introduces later stay hidden until then: formsFrom covers the plural and the
  // feminine, pluralFrom just the plural (the feminine of such a word shows from the start).
  const reached = (from) => !from || (!!level && levelReached(level, from));
  const showFeminine = reached(word.formsFrom);
  const showPlural = showFeminine && reached(word.pluralFrom);

  return (
    <div className="word-detail">
      {showHeader && (
        <>
          <div className="word-top">
            <span className="ar big" dir="rtl">{headword(word, dialects, level)}</span>
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
            {links ? (
              <Link className="root-link ar" dir="rtl" to={`/lookup?q=${encodeURIComponent(word.root)}`}>
                {word.root}
              </Link>
            ) : (
              <span className="ar" dir="rtl">{word.root}</span>
            )}
          </Field>
        )}
        {word.gender && (
          <Field label={t("gender")}>
            <span dir="auto">{t(word.gender)}</span>
          </Field>
        )}
        {f.plural && showPlural && (
          <Field label={t("plural")}>
            <span className="ar" dir="rtl">{f.plural}</span>
          </Field>
        )}
        {word.feminine && showFeminine && (
          <Field label={t("femForm")}>
            <span className="ar" dir="rtl">{word.feminine}</span>
          </Field>
        )}
        {word.present && !f.present && (
          <Field label={t("present")}>
            <span className="ar" dir="rtl">{word.present}</span>
          </Field>
        )}
        {word.example && (
          <Field label={t("exampleLabel")}>
            <span className="ar" dir="rtl">{word.example}</span>
          </Field>
        )}
        {word.alternates?.length > 0 && (
          <Field label={t("alsoLabel")}>
            <span className="ar" dir="rtl">{word.alternates.join(" · ")}</span>
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
        {links && grammar.length > 0 && (
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

      {word.arabic && f.isVerb && (f.past || f.present || (showImperative && f.imperative)) && (
        <section className="conjugations">
          <h3><bdi>{t("conjugations")}</bdi></h3>
          <div className="tenses">
            {f.past && <TenseTable title={t("past")} data={f.past} order={PAST_PERSONS} />}
            {f.present && <TenseTable title={t("present")} data={presentChart(f.present)} order={PAST_PERSONS} />}
            {showImperative && f.imperative && <TenseTable title={t("imperative")} data={f.imperative} order={IMPERATIVE_PERSONS} />}
          </div>
        </section>
      )}

      {DIALECTS.map((d) => dialects[d] && word[d] && <DialectBlock key={d} name={d} data={word[d]} showFeminine={showFeminine} showPlural={showPlural} />)}

      {/* Developer note: which verb forms still need to be stored. Not shown to students. */}
      {import.meta.env.DEV && f.isVerb && missing.length > 0 && (
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

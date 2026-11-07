import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { GENDER_FROM, PLURAL_FROM, levelReached } from "../config/books.js";
import { POS_CHOICES, PREPOSITION_CHOICES, VOWELS, courseMatches, missingFields } from "../lib/customWords.js";
import { headword } from "../lib/varieties.js";
import { posLabel } from "./WordDetail.jsx";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const blank = () => ({
  arabic: "", definition: "", pos: "", root: "", form: "", gender: "", plural: "", feminine: "",
  prepositions: [], pastVowel: "a", presentVowel: "u", notes: "",
});

// A small tab at the side of the search; it opens a panel with more room: add a word from class. If it is already on the course list in a lesson the student
// has not reached, they can unlock that entry now instead of typing it in; otherwise they fill in the basics and it
// joins their own list (Lookup, Review and the games).
export default function AddWord() {
  const { t, nf, bookName, level, dialects, courseIndex, custom, wordsById, addWord, removeWord, unlockWord } = useApp();
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(false); // closed: only the small tab shows
  const [message, setMessage] = useState(null); // { kind, text }
  const set = (key, value) => setF((x) => ({ ...x, [key]: value }));

  const matches = useMemo(() => courseMatches(courseIndex, f, level, custom), [courseIndex, f.arabic, f.definition, level, custom]); // eslint-disable-line react-hooks/exhaustive-deps
  const isNoun = f.pos === "noun";
  const isVerb = f.pos === "verb";
  const hasRoot = ["noun", "verb", "adjective"].includes(f.pos);
  const showGender = isNoun && levelReached(level, GENDER_FROM);
  const showPlural = (isNoun || f.pos === "adjective") && levelReached(level, PLURAL_FROM);

  const submit = (e) => {
    e.preventDefault();
    if (missingFields(f).length) {
      setMessage({ kind: "error", text: t("addWordNeed") });
      return;
    }
    addWord(f);
    setF(blank());
    setMessage({ kind: "info", text: t("addWordAdded") });
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const mine = [...custom.words, ...custom.early.map((id) => wordsById.get(id)).filter(Boolean)];

  return (
    <>
      {!open && (
        <button type="button" className="add-word-tab" onClick={() => setOpen(true)} title={t("addWordTitle")} aria-label={t("addWordTitle")}>
          ＋
        </button>
      )}
      {open && <div className="add-word-backdrop" onClick={() => setOpen(false)} />}
      {open && (
      <aside className="add-word-drawer" role="dialog" aria-label={t("addWordTitle")}>
        <div className="add-word-head">
          <h3><bdi>{t("addWordTitle")}</bdi></h3>
          <button type="button" className="link-button" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </div>
        <p className="muted"><bdi>{t("addWordHelp")}</bdi></p>

        <form onSubmit={submit} className="add-word-form">
          <label className="field-label"><span dir="auto">{t("addWordArabic")}</span>
            <input className="ar" dir="rtl" value={f.arabic} onChange={(e) => set("arabic", e.target.value)} />
          </label>
          <label className="field-label"><span dir="auto">{t("addWordMeaning")}</span>
            <input dir="auto" value={f.definition} onChange={(e) => set("definition", e.target.value)} />
          </label>

          {matches.length > 0 && (
            <div className="add-matches">
              <p className="muted"><bdi>{t("addWordMatches")}</bdi></p>
              <ul>
                {matches.map(({ word, state }) => (
                  <li key={word.id}>
                    <span className="ar" dir="rtl">{headword(word, dialects, level)}</span>
                    <span className="muted" dir="auto">{word.definition}</span>
                    <small className="muted"><bdi>{bookName(word.book)} / {nf(word.unit)}</bdi></small>
                    {state === "future" && (
                      <button type="button" className="primary" onClick={() => unlockWord(word.id)}>
                        <span dir="auto">{t("addWordNow")}</span>
                      </button>
                    )}
                    {state === "added" && <span className="muted"><bdi>✓ {t("addWordEarly")}</bdi></span>}
                    {state === "have" && <span className="muted"><bdi>{t("addWordHave")}</bdi></span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label className="field-label"><span dir="auto">{t("pos")}</span>
            <select value={f.pos} onChange={(e) => set("pos", e.target.value)}>
              <option value="" />
              {POS_CHOICES.map((p) => <option key={p} value={p}>{posLabel(t, p)}</option>)}
            </select>
          </label>

          {hasRoot && (
            <label className="field-label"><span dir="auto">{t("root")}</span>
              <input className="ar" dir="rtl" value={f.root} onChange={(e) => set("root", e.target.value)} placeholder="ك ت ب" />
            </label>
          )}
          {showGender && (
            <label className="field-label"><span dir="auto">{t("gender")}</span>
              <select value={f.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="" />
                <option value="masculine">{t("masculine")}</option>
                <option value="feminine">{t("feminine")}</option>
              </select>
            </label>
          )}
          {showPlural && (
            <label className="field-label"><span dir="auto">{t("plural")}</span>
              <input className="ar" dir="rtl" value={f.plural} onChange={(e) => set("plural", e.target.value)} />
            </label>
          )}
          {f.pos === "adjective" && (
            <label className="field-label"><span dir="auto">{t("femForm")}</span>
              <input className="ar" dir="rtl" value={f.feminine} onChange={(e) => set("feminine", e.target.value)} />
            </label>
          )}

          {isVerb && (
            <>
              <label className="field-label"><span dir="auto">{t("form")}</span>
                <select value={f.form} onChange={(e) => set("form", e.target.value)}>
                  <option value="" />
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{ROMAN[n]}</option>)}
                </select>
              </label>
              {Number(f.form) === 1 && (
                <div className="add-vowels">
                  <label className="field-label"><span dir="auto">{t("addWordPastVowel")}</span>
                    <select value={f.pastVowel} onChange={(e) => set("pastVowel", e.target.value)}>
                      {VOWELS.map((v) => <option key={v} value={v}>{{ a: "فَعَلَ", i: "فَعِلَ", u: "فَعُلَ" }[v]}</option>)}
                    </select>
                  </label>
                  <label className="field-label"><span dir="auto">{t("addWordPresentVowel")}</span>
                    <select value={f.presentVowel} onChange={(e) => set("presentVowel", e.target.value)}>
                      {VOWELS.map((v) => <option key={v} value={v}>{{ a: "يَفعَلُ", i: "يَفعِلُ", u: "يَفعُلُ" }[v]}</option>)}
                    </select>
                  </label>
                </div>
              )}
              <div className="unit-boxes">
                <strong><bdi>{t("prepositions")}</bdi></strong>
                {PREPOSITION_CHOICES.map((p) => (
                  <label key={p} className="unit-box">
                    <input type="checkbox" checked={f.prepositions.includes(p)}
                      onChange={(e) => set("prepositions", e.target.checked ? [...f.prepositions, p] : f.prepositions.filter((x) => x !== p))} />
                    <span className="ar" dir="rtl">{p}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          <label className="field-label"><span dir="auto">{t("notes")}</span>
            <input dir="auto" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
          </label>

          {message && <p className={`auth-${message.kind}`} dir="auto" aria-live="polite">{message.text}</p>}
          <button className="primary"><span dir="auto">{t("addWordSubmit")}</span></button>
        </form>

        {mine.length > 0 && (
          <div className="my-words">
            <h4><bdi>{t("myWordsTitle")}</bdi></h4>
            <ul>
              {mine.map((w) => (
                <li key={w.id}>
                  <span className="ar" dir="rtl">{headword(w, dialects, level)}</span>
                  <span className="muted" dir="auto">{w.definition}</span>
                  <button type="button" className="link-button" onClick={() => removeWord(w.id)}><bdi>{t("addWordRemove")}</bdi></button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
      )}
    </>
  );
}

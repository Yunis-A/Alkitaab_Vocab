import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { getForms, PAST_PERSONS } from "../lib/morphology.js";
import { mayBeIrregular } from "../lib/customWords.js";

const TENSES = ["past", "present"];

// For a verb the student added: a note that irregular verbs may be generated wrongly, and a way to edit the
// forms (the charts, the verbal noun and the participles) or go back to the generated ones.
export default function CustomVerbTools({ word }) {
  const { t, updateWord } = useApp();
  const forms = getForms(word);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  const open = () => {
    setDraft({
      past: { ...(forms.past ?? {}) },
      present: { ...(forms.present ?? {}) },
      masdar: (forms.masdar ?? []).join(" / "),
      activeParticiple: forms.activeParticiple?.m ?? "",
      passiveParticiple: forms.passiveParticiple?.m ?? "",
    });
    setEditing(true);
  };
  const save = () => {
    const keep = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => String(v).trim()).map(([k, v]) => [k, String(v).trim()]));
    updateWord(word.id, {
      conjugations: { past: keep(draft.past), present: keep(draft.present) },
      masdar: draft.masdar.trim() || null,
      activeParticiple: draft.activeParticiple.trim() || null,
      passiveParticiple: draft.passiveParticiple.trim() || null,
      edited: true,
    });
    setEditing(false);
  };
  const reset = () => {
    updateWord(word.id, { conjugations: null, masdar: null, activeParticiple: null, passiveParticiple: null, edited: false });
    setEditing(false);
  };

  return (
    <section className="custom-verb-tools">
      {!word.edited && mayBeIrregular(word) && <p className="warn"><bdi>{t("customFormsNote")}</bdi></p>}
      {word.edited && <p className="muted"><bdi>{t("customFormsEdited")}</bdi></p>}

      {!editing ? (
        <div className="actions">
          <button type="button" onClick={open}><span dir="auto">{t("customFormsEdit")}</span></button>
          {word.edited && <button type="button" className="link-button" onClick={reset}><bdi>{t("customFormsReset")}</bdi></button>}
        </div>
      ) : (
        <div className="edit-forms">
          <div className="edit-tenses">
            {TENSES.map((tense) => (
              <div key={tense}>
                <h4><bdi>{t(tense)}</bdi></h4>
                {PAST_PERSONS.map((p) => (
                  <label key={p} className="edit-row">
                    <span><bdi>{t(`person.${p}`)}</bdi></span>
                    <input className="ar" dir="rtl" value={draft[tense][p] ?? ""} onChange={(e) => setDraft({ ...draft, [tense]: { ...draft[tense], [p]: e.target.value } })} />
                  </label>
                ))}
              </div>
            ))}
          </div>
          {[["masdar", "masdar"], ["activeParticiple", "activeParticiple"], ["passiveParticiple", "passiveParticiple"]].map(([key, label]) => (
            <label key={key} className="edit-row">
              <span><bdi>{t(label)}</bdi></span>
              <input className="ar" dir="rtl" value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
            </label>
          ))}
          <div className="actions">
            <button type="button" className="primary" onClick={save}><span dir="auto">{t("editSave")}</span></button>
            <button type="button" onClick={() => setEditing(false)}><span dir="auto">{t("editCancel")}</span></button>
          </div>
        </div>
      )}
    </section>
  );
}

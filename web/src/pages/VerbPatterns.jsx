import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import ArabicKeyboard from "../components/ArabicKeyboard.jsx";
import { FORMS, MULTI_FIELDS, answerText, buildTask, isCorrect, isCorrectSet } from "../lib/patterns.js";

const LABELS = {
  form: "form",
  past: "past",
  present: "present",
  masdar: "masdar",
  activeParticiple: "activeParticiple",
  passiveParticiple: "passiveParticiple",
  makaan: "makaan",
  passivePast: "passivePast",
  passivePresent: "passivePresent",
  imperative: "imperative",
};

const BOXES_FOR_FORM_I = 3;

// One pattern on ف ع ل is given; the student builds the rest with a restricted keyboard. Once it is form I
// (given as the clue, or picked by the student) the past and the present get three boxes each, to be
// filled in any order.
export default function VerbPatterns({ forms, onExit }) {
  const { t, nf } = useApp();
  const [task, setTask] = useState(() => buildTask(forms));
  const [answers, setAnswers] = useState({}); // box key -> text; boxes are "field" or "field#0".."field#2"
  const [active, setActive] = useState(null);
  const [checked, setChecked] = useState(false);
  const [right, setRight] = useState(0);
  const [asked, setAsked] = useState(0);
  const [round, setRound] = useState(1);

  const clue = task.clue;
  const formIsI = clue.field === "form" ? clue.value === 1 : Number(answers.form) === 1;
  const isMulti = (field) => formIsI && MULTI_FIELDS.includes(field);
  const boxKeys = (field) =>
    isMulti(field) ? Array.from({ length: BOXES_FOR_FORM_I }, (_, i) => `${field}#${i}`) : [field];
  // The noun of place (form I only) and the split of "passive participle / noun of place" appear only once
  // it is form I, so the boxes do not give the form away; after Check everything is shown.
  const splitPP = formIsI || (checked && task.form === 1);
  const shown = task.targets.filter((f) => f !== "makaan" || splitPP);
  const label = (field, isClue = false) =>
    field === "passiveParticiple" && !(splitPP || (isClue && task.form === 1))
      ? `${t("passiveParticiple")} / ${t("makaan")}`
      : t(LABELS[field]);
  const typedKeys = shown.filter((f) => f !== "form").flatMap(boxKeys);

  const cur = typedKeys.includes(active) ? active : typedKeys[0] ?? null; // the box the keyboard types into
  const set = (key, value) => setAnswers((a) => ({ ...a, [key]: value }));
  const key = (c) => cur && set(cur, (answers[cur] ?? "") + c);
  const back = () => cur && set(cur, (answers[cur] ?? "").slice(0, -1));

  const result = (field) => {
    if (field === "form") return isCorrect(task.form, "form", answers.form);
    if (isMulti(field)) return isCorrectSet(task.form, field, boxKeys(field).map((k) => answers[k] ?? ""));
    return isCorrect(task.form, field, answers[field] ?? "");
  };
  const check = () => {
    setChecked(true);
    setRight((r) => r + task.targets.filter(result).length);
    setAsked((a) => a + task.targets.length);
  };
  const next = () => {
    setTask(buildTask(forms));
    setAnswers({});
    setActive(null);
    setChecked(false);
    setRound((n) => n + 1);
  };

  return (
    <main className="page narrow">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
        <span className="muted"><bdi>{t("genderScore", right, nf(right))} / {nf(asked)}</bdi></span>
      </div>

      <section className="card flash" key={round}>
        <div className="face">
          <span className="muted"><bdi>{label(clue.field, true)}</bdi></span>
          {clue.field === "form" ? (
            <span className="huge">{nf(clue.value)}</span>
          ) : (
            <span className="ar huge" dir="rtl">{clue.value}</span>
          )}
        </div>

        <div className="pattern-fields">
          {shown.map((field) => {
            const ok = checked ? result(field) : null;
            return (
              <div key={field} className={`pattern-field${ok === true ? " ok" : ok === false ? " bad" : ""}`}>
                <span className="pattern-label"><bdi>{label(field)}</bdi></span>
                {field === "form" ? (
                  <span className="form-picks">
                    {FORMS.map((f) => (
                      <button key={f} type="button" disabled={checked}
                        className={`form-pick${Number(answers.form) === f ? " picked" : ""}`} onClick={() => set("form", f)}>
                        {nf(f)}
                      </button>
                    ))}
                  </span>
                ) : (
                  <span className="pattern-boxes">
                    {boxKeys(field).map((k) => (
                      <input
                        key={k}
                        className={`ar pattern-input${cur === k ? " active" : ""}`}
                        dir="rtl"
                        readOnly
                        inputMode="none"
                        value={answers[k] ?? ""}
                        onFocus={() => setActive(k)}
                        onClick={() => setActive(k)}
                        disabled={checked}
                      />
                    ))}
                  </span>
                )}
                {ok === false && <span className="pattern-answer ar" dir="rtl">{answerText(task.form, field)}</span>}
              </div>
            );
          })}
        </div>

        <ArabicKeyboard onKey={key} onBackspace={back} disabled={checked || !cur} />

        {checked ? (
          <button className="primary" onClick={next} autoFocus><span dir="auto">{t("genderNext")}</span></button>
        ) : (
          <button className="primary" onClick={check}><span dir="auto">{t("studyCheck")}</span></button>
        )}
      </section>
    </main>
  );
}

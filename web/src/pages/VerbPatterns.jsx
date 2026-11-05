import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import ArabicKeyboard from "../components/ArabicKeyboard.jsx";
import {
  answerSpec, answerText, buildTask, canAppend, fieldsAt, fieldsForAnyForm, formsAt, isCorrect, isCorrectSet,
} from "../lib/patterns.js";

// One pattern on ف ع ل is given; the student builds the rest with a restricted keyboard. What is asked
// follows the form the student says it is (the form number, or the form given as the clue): form I has three
// boxes for the past and the present and no verbal noun, form III has two verbal nouns from part 3 lesson 1,
// and so on. Before a form is picked, every field that could be asked is shown.
export default function VerbPatterns({ onExit }) {
  const { t, nf, level } = useApp();
  const [task, setTask] = useState(() => buildTask(level));
  const [answers, setAnswers] = useState({}); // box key -> text; boxes are "field#0", "field#1", ...
  const [active, setActive] = useState(null);
  const [checked, setChecked] = useState(false);
  const [right, setRight] = useState(0);
  const [asked, setAsked] = useState(0);
  const [round, setRound] = useState(1);

  const clue = task.clue;
  const believed = clue.field === "form" ? clue.value : answers.form ?? null; // the form the student has in mind

  // fields on screen (not counting the clue): by the believed form, else everything that could be asked
  const wanted = believed !== null ? fieldsAt(believed, level) : fieldsForAnyForm(level);
  const shown = ["form", ...wanted].filter((f) => f !== clue.field);
  // after Check: the real form's fields, so a missed field shows its answer
  const rows = checked ? task.targets : shown;

  const boxCount = (field) => answerSpec(checked ? task.form : believed, field, level).boxes;
  const boxKeys = (field) => Array.from({ length: boxCount(field) }, (_, i) => `${field}#${i}`);
  const typedKeys = rows.filter((f) => f !== "form").flatMap(boxKeys);

  const cur = typedKeys.includes(active) ? active : typedKeys[0] ?? null; // the box the keyboard types into
  const set = (key, value) => setAnswers((a) => ({ ...a, [key]: value }));
  const key = (c) => cur && canAppend(answers[cur] ?? "", c) && set(cur, (answers[cur] ?? "") + c);
  const back = () => cur && set(cur, (answers[cur] ?? "").slice(0, -1));

  // A field counts only if it was on screen and is right; what was not on screen (the student picked another
  // form) is missed.
  const result = (field) => {
    if (field === "form") return isCorrect(task.form, "form", answers.form);
    if (!shown.includes(field)) return false;
    const typed = Array.from({ length: answerSpec(believed, field, level).boxes }, (_, i) => answers[`${field}#${i}`] ?? "");
    return isCorrectSet(task.form, field, typed, level);
  };
  const check = () => {
    setChecked(true);
    setRight((r) => r + task.targets.filter(result).length);
    setAsked((a) => a + task.targets.length);
  };
  const next = () => {
    setTask(buildTask(level));
    setAnswers({});
    setActive(null);
    setChecked(false);
    setRound((n) => n + 1);
  };

  // 1-10 for the forms; four-letter roots read "4-letter I / II"
  const formLabel = (f) => (typeof f === "number" ? nf(f) : `${t("quadLabel")} ${nf(Number(f.slice(1)))}`);
  // the noun of place shares the passive participle's box except in form I (and before a form is picked)
  const label = (field, isClue = false) => {
    if (field === "masdar") return "المصدر"; // always Arabic: the student learns the word along with the exercise
    const split = believed === 1 || (isClue && task.form === 1) || (checked && task.form === 1);
    return field === "passiveParticiple" && !split ? `${t("passiveParticiple")} / ${t("makaan")}` : t(field);
  };

  return (
    <main className="page narrow">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
        <span className="muted"><bdi>{t("genderScore", right, nf(right))} / {nf(asked)}</bdi></span>
      </div>

      <section className="card flash" key={round}>
        <div className="face">
          <span className="muted"><bdi>{clue.field === "form" ? t("form") : label(clue.field, true)}</bdi></span>
          {clue.field === "form" ? (
            <span className="huge"><bdi>{formLabel(clue.value)}</bdi></span>
          ) : (
            <span className="ar huge" dir="rtl">{clue.value}</span>
          )}
        </div>

        <div className="pattern-fields">
          {rows.map((field) => {
            const ok = checked ? result(field) : null;
            return (
              <div key={field} className={`pattern-field${ok === true ? " ok" : ok === false ? " bad" : ""}`}>
                <span className="pattern-label"><bdi>{field === "form" ? t("form") : label(field)}</bdi></span>
                {field === "form" ? (
                  <span className="form-picks">
                    {formsAt(level).map((f) => (
                      <button key={f} type="button" disabled={checked}
                        className={`form-pick${answers.form === f ? " picked" : ""}`} onClick={() => set("form", f)}>
                        {formLabel(f)}
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
                {ok === false && <span className="pattern-answer ar" dir="rtl">{answerText(task.form, field, level)}</span>}
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

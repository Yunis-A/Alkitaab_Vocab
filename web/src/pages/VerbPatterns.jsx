import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import ArabicKeyboard from "../components/ArabicKeyboard.jsx";
import { FORMS, answerText, buildTask, isCorrect } from "../lib/patterns.js";

const LABELS = {
  form: "form",
  past: "past",
  present: "present",
  masdar: "masdar",
  activeParticiple: "activeParticiple",
  passiveParticiple: "passiveParticiple",
  passivePast: "passivePast",
  passivePresent: "passivePresent",
  imperative: "imperative",
};

// One pattern on ف ع ل is given; the student builds the rest with a restricted keyboard.
export default function VerbPatterns({ forms, onExit }) {
  const { t, nf } = useApp();
  const [task, setTask] = useState(() => buildTask(forms));
  const [answers, setAnswers] = useState({});
  const [active, setActive] = useState(null);
  const [checked, setChecked] = useState(false);
  const [right, setRight] = useState(0);
  const [asked, setAsked] = useState(0);
  const [round, setRound] = useState(1);

  const typed = task.targets.filter((f) => f !== "form");
  const cur = active ?? typed[0] ?? null; // the box the keyboard types into (the first one to start)
  const set = (field, value) => setAnswers((a) => ({ ...a, [field]: value }));
  const key = (c) => cur && set(cur, (answers[cur] ?? "") + c);
  const back = () => cur && set(cur, (answers[cur] ?? "").slice(0, -1));

  const result = (field) => isCorrect(task.form, field, answers[field] ?? "");
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

  const clue = task.clue;
  return (
    <main className="page narrow">
      <div className="quick-bar">
        <button type="button" className="link-button" onClick={onExit}><bdi>{t("studyExit")}</bdi></button>
        <span className="muted"><bdi>{t("genderScore", right, nf(right))} / {nf(asked)}</bdi></span>
      </div>

      <section className="card flash" key={round}>
        <div className="face">
          <span className="muted"><bdi>{t(LABELS[clue.field])}</bdi></span>
          {clue.field === "form" ? (
            <span className="huge">{nf(clue.value)}</span>
          ) : (
            <span className="ar huge" dir="rtl">{clue.value}</span>
          )}
        </div>

        <div className="pattern-fields">
          {task.targets.map((field) => {
            const ok = checked ? result(field) : null;
            return (
              <div key={field} className={`pattern-field${ok === true ? " ok" : ok === false ? " bad" : ""}`}>
                <span className="pattern-label"><bdi>{t(LABELS[field])}</bdi></span>
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
                  <input
                    className={`ar pattern-input${cur === field ? " active" : ""}`}
                    dir="rtl"
                    readOnly
                    inputMode="none"
                    value={answers[field] ?? ""}
                    onFocus={() => setActive(field)}
                    onClick={() => setActive(field)}
                    disabled={checked}
                  />
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

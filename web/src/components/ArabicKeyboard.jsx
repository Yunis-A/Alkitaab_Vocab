// A small on-screen keyboard with only the letters and vowel marks the verb patterns need (ف ع ل and the
// letters of the prefixes and suffixes, plus و for مَفعول). The text boxes next to it are read-only, so
// nothing else can be typed.

const ROOT = ["ف", "ع", "ل"];
const LETTERS = ["إ", "أ", "ا", "و", "ي", "ت", "ن", "م", "س", "ة"];
const MARKS = ["َ", "ِ", "ُ", "ّ"]; // fatha, kasra, damma, shadda

export default function ArabicKeyboard({ onKey, onBackspace, disabled }) {
  return (
    <div className="ar-keyboard" dir="ltr">
      <div className="kb-row">
        {ROOT.map((k) => (
          <button key={k} type="button" className="kb-key ar" disabled={disabled} onClick={() => onKey(k)}>{k}</button>
        ))}
      </div>
      <div className="kb-row">
        {LETTERS.map((k) => (
          <button key={k} type="button" className="kb-key ar" disabled={disabled} onClick={() => onKey(k)}>{k}</button>
        ))}
      </div>
      <div className="kb-row">
        {MARKS.map((k) => (
          <button key={k} type="button" className="kb-key ar" disabled={disabled} onClick={() => onKey(k)}>{`◌${k}`}</button>
        ))}
        <button type="button" className="kb-key kb-back" disabled={disabled} onClick={onBackspace} aria-label="Backspace">⌫</button>
      </div>
    </div>
  );
}

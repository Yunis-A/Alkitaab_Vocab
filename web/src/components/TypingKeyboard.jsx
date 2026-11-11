// The on-screen keyboard of the typing lessons and the conjugation game: the next key is highlighted (and the
// Shift key with it for a letter typed with Shift), a wrong press flashes red. While Shift is held (`shift`)
// the keyboard changes to its shifted layout: the keys that type something else with Shift (the vowel marks and
// the hamza seats) show it in bold, and the other keys fade. Keys can also be clicked or tapped (for screens
// without a keyboard); a tapped Shift stays down for the next key. A click types the face the keyboard shows:
// onPress(code, shifted) is told whether the shifted layout is up (the real Shift held, or the on-screen one tapped).

const isMark = (ch) => /[\u064B-\u0652]/.test(ch);
const face = (ch) => (isMark(ch) ? `\u25CC${ch}` : ch); // marks sit on a dotted circle

export default function TypingKeyboard({ layout, target, wrongCode, shiftDown, shift = false, onPress }) {
  return (
    <div className={`typing-keyboard${shift ? " shifted" : ""}`} dir="ltr" role="group" aria-label="Keyboard">
      {layout.rows.map((row, r) => (
        <div className="tk-row" key={r}>
          {row.map((key) => {
            const isShift = key.code.startsWith("Shift");
            const hit = target && (key.code === target.code || (target.shift && key.code === target.shiftKey));
            const lit = shift && key.sh; // shows its shifted face
            const dim = shift && !key.sh && !isShift;
            const cls = [
              "tk-key", key.ch ? "tk-letter" : "tk-other", hit ? "tk-target" : "", key.code === wrongCode ? "tk-wrong" : "",
              isShift && (shiftDown || shift) ? "tk-down" : "", lit ? "tk-lit" : "", dim ? "tk-dim" : "",
            ].join(" ");
            return (
              <button key={key.code} type="button" tabIndex={-1} className={cls} style={{ flex: `${key.w} 1 0` }} onClick={() => onPress(key.code, shift)}>
                {/* the other face, small in the corner */}
                {(lit ? key.ch : key.sh) && <span className="tk-shifted ar">{face(lit ? key.ch : key.sh)}</span>}
                {key.ch && <span className={`tk-ar ar${lit && isMark(key.sh) ? " tk-mark" : ""}`}>{lit ? face(key.sh) : key.ch}</span>}
                <span className="tk-latin">{key.latin}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

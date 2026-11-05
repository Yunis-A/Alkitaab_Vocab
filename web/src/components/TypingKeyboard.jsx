// The on-screen keyboard of the typing lessons: the next key is highlighted (and the Shift key with it for a
// letter typed with Shift), a wrong press flashes red. Keys can also be clicked or tapped (for screens without
// a keyboard); a tapped Shift stays down for the next key.

export default function TypingKeyboard({ layout, target, wrongCode, shiftDown, onPress }) {
  return (
    <div className="typing-keyboard" dir="ltr" role="group" aria-label="Keyboard">
      {layout.rows.map((row, r) => (
        <div className="tk-row" key={r}>
          {row.map((key) => {
            const isShift = key.code.startsWith("Shift");
            const hit = target && (key.code === target.code || (target.shift && key.code === target.shiftKey));
            const cls = ["tk-key", key.ch ? "tk-letter" : "tk-other", hit ? "tk-target" : "", key.code === wrongCode ? "tk-wrong" : "", isShift && shiftDown ? "tk-down" : ""].join(" ");
            return (
              <button key={key.code} type="button" tabIndex={-1} className={cls} style={{ flex: `${key.w} 1 0` }} onClick={() => onPress(key.code)}>
                {key.sh && <span className="tk-shifted ar">{/[\u064B-\u0652]/.test(key.sh) ? `◌${key.sh}` : key.sh}</span>}
                {key.ch && <span className="tk-ar ar">{key.ch}</span>}
                <span className="tk-latin">{key.latin}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// The on-screen keyboard of the typing lessons: the next key is highlighted, a wrong press flashes red. Keys
// can also be clicked or tapped (for screens without a keyboard).

export default function TypingKeyboard({ layout, targetCode, wrongCode, onPress }) {
  return (
    <div className="typing-keyboard" dir="ltr" role="group" aria-label="Keyboard">
      {layout.rows.map((row, r) => (
        <div className="tk-row" key={r}>
          {row.map((key) => {
            const cls = ["tk-key", key.ch ? "tk-letter" : "tk-other", key.code === targetCode ? "tk-target" : "", key.code === wrongCode ? "tk-wrong" : ""].join(" ");
            return (
              <button key={key.code} type="button" tabIndex={-1} className={cls} style={{ flex: `${key.w} 1 0` }} onClick={() => onPress(key.code)}>
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

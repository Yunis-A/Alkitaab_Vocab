import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";

// The text to type, in a window three lines high. Typed letters turn green and the letter to type is marked;
// when the typing moves to a new line, the lines slide up one (the top line slides out of sight). Letters only
// change colour and background, never size or spacing, so nothing shifts while typing and the Arabic letters
// keep joining.
export default function TypingText({ tokens, pos }) {
  const track = useRef(null);
  const focus = useRef(null);
  const [shift, setShift] = useState(0);
  const [size, setSize] = useState(0); // bumped on resize: the lines may wrap differently
  const at = Math.min(pos, tokens.length - 1); // the letter to mark (the last one once everything is typed)

  useEffect(() => {
    const onResize = () => setSize((n) => n + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // keep the line being typed on the window's second row: scroll up by whole lines
  useLayoutEffect(() => {
    const line = track.current && focus.current ? parseFloat(getComputedStyle(track.current).lineHeight) : 0;
    if (!line) return;
    setShift(Math.max(0, Math.round(focus.current.offsetTop / line) - 1) * line);
  }, [pos, size, tokens]);

  // group the tokens into words, keeping each token's index
  const words = [];
  let letters = [];
  tokens.forEach((tok, i) => {
    if (tok === " ") {
      words.push({ letters, space: i });
      letters = [];
    } else letters.push({ tok, i });
  });
  words.push({ letters, space: null });

  const cls = (i) => (i < pos ? "typed" : i === pos ? "current" : "");
  return (
    <div className="typing-window" dir="rtl">
      <div className="typing-track ar" ref={track} style={{ transform: `translateY(${-shift}px)` }}>
        {words.map((w, n) => (
          <Fragment key={n}>
            <span className="tw">
              {w.letters.map((l) => (
                <span key={l.i} ref={l.i === at ? focus : null} className={cls(l.i)}>{l.tok}</span>
              ))}
            </span>
            {w.space !== null && <span ref={w.space === at ? focus : null} className={`sp ${cls(w.space)}`}> </span>}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

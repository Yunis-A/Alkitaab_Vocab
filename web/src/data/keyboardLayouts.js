// Keyboard layouts for the typing lessons. A key is identified by its physical position (KeyboardEvent.code),
// so a lesson works whichever layout the computer is set to: pressing the key where ض sits counts as ض.
//
//   code   the physical key
//   ch     the Arabic letter it types (null if it is not a letter the lessons teach); "لا" is the lam-alef key
//   latin  the label printed on a QWERTY keycap
//   w      width, in units of a normal key
//
// "pc" is Arabic 101: the Windows layout, which macOS calls "Arabic – PC". (Apple's plain "Arabic" layout
// moves a few letters; add it here as another entry once its key map is confirmed.)

const k = (code, ch, latin, w = 1) => ({ code, ch, latin, w });
const blank = (code, latin, w = 1) => ({ code, ch: null, latin, w });

const PC_ROWS = [
  [
    k("Backquote", "ذ", "`"),
    ...["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => blank(`Digit${d}`, d)),
    blank("Minus", "-"),
    blank("Equal", "="),
    blank("Backspace", "⌫", 2),
  ],
  [
    blank("Tab", "Tab", 1.5),
    k("KeyQ", "ض", "Q"), k("KeyW", "ص", "W"), k("KeyE", "ث", "E"), k("KeyR", "ق", "R"), k("KeyT", "ف", "T"),
    k("KeyY", "غ", "Y"), k("KeyU", "ع", "U"), k("KeyI", "ه", "I"), k("KeyO", "خ", "O"), k("KeyP", "ح", "P"),
    k("BracketLeft", "ج", "["), k("BracketRight", "د", "]"),
    blank("Backslash", "\\", 1.5),
  ],
  [
    blank("CapsLock", "Caps", 1.75),
    k("KeyA", "ش", "A"), k("KeyS", "س", "S"), k("KeyD", "ي", "D"), k("KeyF", "ب", "F"), k("KeyG", "ل", "G"),
    k("KeyH", "ا", "H"), k("KeyJ", "ت", "J"), k("KeyK", "ن", "K"), k("KeyL", "م", "L"),
    k("Semicolon", "ك", ";"), k("Quote", "ط", "'"),
    blank("Enter", "Enter", 2.25),
  ],
  [
    blank("ShiftLeft", "Shift", 2.25),
    k("KeyZ", "ئ", "Z"), k("KeyX", "ء", "X"), k("KeyC", "ؤ", "C"), k("KeyV", "ر", "V"), k("KeyB", "لا", "B"),
    k("KeyN", "ى", "N"), k("KeyM", "ة", "M"), k("Comma", "و", ","), k("Period", "ز", "."), k("Slash", "ظ", "/"),
    blank("ShiftRight", "Shift", 2.75),
  ],
  [blank("Space", "Space", 6.25)],
];

export const LAYOUTS = {
  pc: { id: "pc", label: "Windows / Mac “Arabic – PC”", rows: PC_ROWS },
};
export const DEFAULT_LAYOUT = "pc";

// Where a letter lives on this layout: the key's code, or null.
export function codeFor(layout, token) {
  if (token === " ") return "Space";
  for (const row of layout.rows) for (const key of row) if (key.ch === token) return key.code;
  return null;
}

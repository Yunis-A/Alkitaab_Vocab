// The keyboard of the typing lessons: Arabic 101, the Windows layout (macOS calls it "Arabic – PC"). A key is
// identified by its physical position (KeyboardEvent.code), so a lesson works whichever layout the computer
// is set to: pressing the key where ض sits counts as ض.
//
//   code   the physical key
//   ch     the Arabic letter it types (null if it is not a letter the lessons teach); "لا" is the lam-alef key
//   latin  the label printed on a QWERTY keycap
//   w      width, in units of a normal key
//   sh     what Shift types: the hamza seats أ إ and آ, and the vowel marks (fatha, damma, kasra, shadda, sukun)

const k = (code, ch, latin, w = 1, sh = null) => ({ code, ch, latin, w, sh });
const blank = (code, latin, w = 1) => ({ code, ch: null, latin, w });

const PC_ROWS = [
  [
    k("Backquote", "ذ", "`", 1, "\u0651"),
    ...["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => blank(`Digit${d}`, d)),
    blank("Minus", "-"),
    blank("Equal", "="),
    blank("Backspace", "⌫", 2),
  ],
  [
    blank("Tab", "Tab", 1.5),
    k("KeyQ", "ض", "Q", 1, "\u064E"), k("KeyW", "ص", "W"), k("KeyE", "ث", "E", 1, "\u064F"), k("KeyR", "ق", "R"), k("KeyT", "ف", "T"),
    k("KeyY", "غ", "Y", 1, "إ"), k("KeyU", "ع", "U"), k("KeyI", "ه", "I"), k("KeyO", "خ", "O"), k("KeyP", "ح", "P"),
    k("BracketLeft", "ج", "["), k("BracketRight", "د", "]"),
    blank("Backslash", "\\", 1.5),
  ],
  [
    blank("CapsLock", "Caps", 1.75),
    k("KeyA", "ش", "A", 1, "\u0650"), k("KeyS", "س", "S"), k("KeyD", "ي", "D"), k("KeyF", "ب", "F"), k("KeyG", "ل", "G"),
    k("KeyH", "ا", "H", 1, "أ"), k("KeyJ", "ت", "J"), k("KeyK", "ن", "K"), k("KeyL", "م", "L"),
    k("Semicolon", "ك", ";"), k("Quote", "ط", "'"),
    blank("Enter", "Enter", 2.25),
  ],
  [
    blank("ShiftLeft", "Shift", 2.25),
    k("KeyZ", "ئ", "Z"), k("KeyX", "ء", "X", 1, "\u0652"), k("KeyC", "ؤ", "C"), k("KeyV", "ر", "V"), k("KeyB", "لا", "B"),
    k("KeyN", "ى", "N", 1, "آ"), k("KeyM", "ة", "M"), k("Comma", "و", ","), k("Period", "ز", "."), k("Slash", "ظ", "/"),
    blank("ShiftRight", "Shift", 2.75),
  ],
  [blank("Space", "Space", 6.25)],
];

export const LAYOUT = { id: "pc", label: "Arabic 101", rows: PC_ROWS };
export const LAYOUTS = { pc: LAYOUT }; // kept for the one layout; Apple's plain "Arabic" layout is not supported

// Where a letter lives on this layout: { code, shift } (shift: it is typed with Shift held), or null.
export function keyFor(layout, token) {
  if (token === " ") return { code: "Space", shift: false };
  for (const row of layout.rows) {
    for (const key of row) {
      if (key.ch === token) return { code: key.code, shift: false };
      if (key.sh === token) return { code: key.code, shift: true };
    }
  }
  return null;
}

export const codeFor = (layout, token) => keyFor(layout, token)?.code ?? null;

// The Shift key to use for a letter typed with Shift: the one on the other hand (all the shifted letters are
// on the right hand's keys).
export const SHIFT_KEY = "ShiftLeft";

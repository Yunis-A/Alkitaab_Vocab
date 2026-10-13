// Western <-> Arabic-Indic digits.

const ARABIC = "٠١٢٣٤٥٦٧٨٩";

// Converts every digit in `value` (a number or string) to the requested style.
export function localizeDigits(value, arabic) {
  const s = String(value);
  return arabic
    ? s.replace(/[0-9]/g, (d) => ARABIC[d])
    : s.replace(/[٠-٩]/g, (d) => String(ARABIC.indexOf(d)));
}

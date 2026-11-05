// The 28 letters (ء in place of ا), for the sun and moon letters game. A sun letter assimilates the ل of ال (الشَّمس); a moon
// letter does not (القَمَر).

const SUN = "تثدذرزسشصضطظلن";
// ا is not included: ء stands in for it (hamza is a moon letter)
const ALL = "ءبتثجحخدذرزسشصضطظعغفقكلمنهوي";

export const LETTERS = [...ALL].map((letter) => ({ letter, sun: SUN.includes(letter) }));

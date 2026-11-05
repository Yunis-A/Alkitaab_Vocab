// The 28 letters, for the sun and moon letters game. A sun letter assimilates the ل of ال (الشَّمس); a moon
// letter does not (القَمَر).

const SUN = "تثدذرزسشصضطظلن";
const ALL = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";

export const LETTERS = [...ALL].map((letter) => ({ letter, sun: SUN.includes(letter) }));

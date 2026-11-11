// The gender-and-number game: take a noun or adjective and show it as masculine or feminine, singular, dual or
// plural, then ask which of the six it is. SKELETON: the endings are the plain nominative ones (ـان dual; ـون
// masculine and ـات feminine sound plural); stored plurals are used when a noun has one. The rules are kept
// here so they can be refined later without touching the screen.

export const GENDERS = ["masculine", "feminine"];
export const NUMBERS = ["singular", "dual", "plural"];
export const CHOICES = NUMBERS.flatMap((n) => GENDERS.map((g) => ({ gender: g, number: n }))); // the six answers

const TRAIL = /[ً-ْ]+$/;
const TAA = /ة[ً-ْ]*$/;
const strip = (s) => s.replace(TRAIL, "");

const isOneWord = (s) => !!s && !/\s/.test(s.trim());

// Can the word be used? Nouns need a gender; adjectives need a feminine form; one word only.
export function eligible(w) {
  if (!isOneWord(w.arabic)) return false;
  if (w.pos === "noun") return (w.gender === "masculine" || w.gender === "feminine") && !/[ـ(]/.test(w.arabic);
  if (w.pos === "adjective") return isOneWord(w.feminine);
  return false;
}

// The stem without a feminine ة ("مُدَرِّسة" -> "مُدَرِّس")
const stem = (s) => (TAA.test(s) ? s.replace(TAA, "") : strip(s));

// Every form of the word the game can show: [{ gender, number, text }]
export function formsOf(w) {
  if (!eligible(w)) return [];
  const masc = w.pos === "adjective" ? w.arabic : w.gender === "masculine" ? w.arabic : null;
  const fem = w.pos === "adjective" ? w.feminine : w.gender === "feminine" ? w.arabic : null;
  const out = [];
  if (masc) {
    out.push({ gender: "masculine", number: "singular", text: masc });
    out.push({ gender: "masculine", number: "dual", text: strip(masc) + "ان" });
    out.push({ gender: "masculine", number: "plural", text: w.pos === "noun" && w.plural ? w.plural : strip(masc) + "ون" });
  }
  if (fem) {
    out.push({ gender: "feminine", number: "singular", text: fem });
    out.push({ gender: "feminine", number: "dual", text: TAA.test(fem) ? stem(fem) + "تان" : strip(fem) + "ان" });
    out.push({ gender: "feminine", number: "plural", text: w.pos === "noun" && w.plural && !masc ? w.plural : stem(fem) + "ات" });
  }
  return out;
}

// One random question from the words: { word, form } where form = { gender, number, text }
export function pickQuestion(words, rng = Math.random) {
  const pool = words.filter(eligible);
  if (!pool.length) return null;
  const word = pool[Math.floor(rng() * pool.length)];
  const forms = formsOf(word);
  return { word, form: forms[Math.floor(rng() * forms.length)] };
}

export const isRight = (q, choice) => q.form.gender === choice.gender && q.form.number === choice.number;

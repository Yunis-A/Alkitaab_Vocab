// The verb patterns on the root ف ع ل (forms I-VIII and X; form IX is rare and left out). The pattern
// trainer gives one of these and the student builds the others.
//
// Each value is a list of accepted answers (the first is the one shown). null = not asked: the form I
// verbal noun varies from verb to verb, and form VII has no passive participle.
// House style as in the word list: no sukun, no fatha before alif.

export const FORMS = [1, 2, 3, 4, 5, 6, 7, 8, 10];

// the answer fields after the form number, in the order they are asked
export const FIELDS = ["past", "present", "masdar", "activeParticiple", "passiveParticiple", "passivePast", "passivePresent", "imperative"];

export const PATTERNS = {
  1: {
    past: ["فَعَلَ", "فَعِلَ", "فَعُلَ"],
    present: ["يَفعَلُ", "يَفعِلُ", "يَفعُلُ"],
    masdar: null,
    activeParticiple: ["فاعِل"],
    passiveParticiple: ["مَفعول"],
    passivePast: ["فُعِلَ"],
    passivePresent: ["يُفعَلُ"],
    imperative: ["اِفعَل", "اِفعِل", "اُفعُل"],
  },
  2: {
    past: ["فَعَّلَ"], present: ["يُفَعِّلُ"], masdar: ["تَفعيل"], activeParticiple: ["مُفَعِّل"],
    passiveParticiple: ["مُفَعَّل"], passivePast: ["فُعِّلَ"], passivePresent: ["يُفَعَّلُ"], imperative: ["فَعِّل"],
  },
  3: {
    past: ["فاعَلَ"], present: ["يُفاعِلُ"], masdar: ["مُفاعَلة", "فِعال"], activeParticiple: ["مُفاعِل"],
    passiveParticiple: ["مُفاعَل"], passivePast: ["فوعِلَ"], passivePresent: ["يُفاعَلُ"], imperative: ["فاعِل"],
  },
  4: {
    past: ["أَفعَلَ"], present: ["يُفعِلُ"], masdar: ["إِفعال"], activeParticiple: ["مُفعِل"],
    passiveParticiple: ["مُفعَل"], passivePast: ["أُفعِلَ"], passivePresent: ["يُفعَلُ"], imperative: ["أَفعِل"],
  },
  5: {
    past: ["تَفَعَّلَ"], present: ["يَتَفَعَّلُ"], masdar: ["تَفَعُّل"], activeParticiple: ["مُتَفَعِّل"],
    passiveParticiple: ["مُتَفَعَّل"], passivePast: ["تُفُعِّلَ"], passivePresent: ["يُتَفَعَّلُ"], imperative: ["تَفَعَّل"],
  },
  6: {
    past: ["تَفاعَلَ"], present: ["يَتَفاعَلُ"], masdar: ["تَفاعُل"], activeParticiple: ["مُتَفاعِل"],
    passiveParticiple: ["مُتَفاعَل"], passivePast: ["تُفوعِلَ"], passivePresent: ["يُتَفاعَلُ"], imperative: ["تَفاعَل"],
  },
  7: {
    past: ["اِنفَعَلَ"], present: ["يَنفَعِلُ"], masdar: ["اِنفِعال"], activeParticiple: ["مُنفَعِل"],
    passiveParticiple: null, passivePast: ["اُنفُعِلَ"], passivePresent: ["يُنفَعَلُ"], imperative: ["اِنفَعِل"],
  },
  8: {
    past: ["اِفتَعَلَ"], present: ["يَفتَعِلُ"], masdar: ["اِفتِعال"], activeParticiple: ["مُفتَعِل"],
    passiveParticiple: ["مُفتَعَل"], passivePast: ["اُفتُعِلَ"], passivePresent: ["يُفتَعَلُ"], imperative: ["اِفتَعِل"],
  },
  10: {
    past: ["اِستَفعَلَ"], present: ["يَستَفعِلُ"], masdar: ["اِستِفعال"], activeParticiple: ["مُستَفعِل"],
    passiveParticiple: ["مُستَفعَل"], passivePast: ["اُستُفعِلَ"], passivePresent: ["يُستَفعَلُ"], imperative: ["اِستَفعِل"],
  },
};

// What the student may type: compared without sukun or tatweel, without the vowel that is just the long
// vowel's own mark (fatha before alif or taa marbuta, damma before waw, kasra before yaa), with the shadda
// before its vowel, and with any alif (ا إ آ) taken as the same.
export function canon(s) {
  return String(s ?? "")
    .replace(/[ـْ\s]/g, "")
    .replace(/َ(?=[اة])/g, "")
    .replace(/ُ(?=و)/g, "")
    .replace(/ِ(?=ي)/g, "")
    .replace(/([َُِ])ّ/g, "ّ$1")
    .replace(/[إآٱ]/g, "ا");
}

const askable = (form, field) => !!PATTERNS[form]?.[field];

// Can this value be given to the student without leaving the form unclear? (Form I and form IV share the
// passive present يُفعَلُ, for instance, so that one is never the clue.)
function uniqueClue(form, field) {
  const mine = PATTERNS[form][field].map(canon);
  return FORMS.every((f) => f === form || !askable(f, field) || !PATTERNS[f][field].map(canon).some((v) => mine.includes(v)));
}

// A round: one clue (the form number or one of the patterns) and the fields the student fills in.
// `forms` limits which forms may come up. Returns { form, clue: { field, value }, targets: [field...] }.
export function buildTask(forms, rng = Math.random) {
  const pool = forms.filter((f) => PATTERNS[f]);
  const form = pool[Math.floor(rng() * pool.length)];
  const clues = ["form", ...FIELDS.filter((f) => askable(form, f) && uniqueClue(form, f))];
  const field = clues[Math.floor(rng() * clues.length)];
  const value = field === "form" ? form : PATTERNS[form][field][0];
  const targets = ["form", ...FIELDS.filter((f) => askable(form, f))].filter((f) => f !== field);
  return { form, clue: { field, value }, targets };
}

// Is `answer` right for `field` of `form`? (For "form", the answer is a number.)
export function isCorrect(form, field, answer) {
  if (field === "form") return Number(answer) === form;
  const typed = canon(answer);
  return typed !== "" && PATTERNS[form][field].some((v) => canon(v) === typed);
}

// The answer to show for a field: every accepted variant.
export const answerText = (form, field) => (field === "form" ? String(form) : PATTERNS[form][field].join(" / "));

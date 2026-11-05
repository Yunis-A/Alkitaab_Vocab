// The verb patterns on the root ف ع ل (forms I-X). The pattern trainer gives one of these and the student
// builds the others.
//
// Each value is a list of accepted answers (the first is the one shown). null = not asked: the form I
// verbal noun varies from verb to verb, forms VII and IX have no passive, passive participle or noun of
// place (VII is inherently passive in meaning; IX is a colour/defect verb), and IX has no imperative.
// The noun of place has the same shape as the passive participle in every form but I, so it is only asked
// (separately) for form I.
// House style as in the word list: no sukun, no fatha before alif, no case endings on the present tense
// (يَفعَل, not يَفعَلُ), and the verbal noun is always written with ال (الإِفعال).

import { IMPERATIVE_LEVEL, levelReached } from "../config/books.js";

export const FORMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// four-letter roots (فَعلَلَ): "Q1" is their form I, "Q2" their form II (تَفَعلَلَ)
export const QUAD_FORMS = ["Q1", "Q2"];
export const ALL_FORMS = [...FORMS, ...QUAD_FORMS];

// the answer fields after the form number, in the order they are asked
export const FIELDS = ["past", "present", "masdar", "activeParticiple", "passiveParticiple", "makaan", "passivePast", "passivePresent", "imperative"];

// Letters that assimilate the ل of ال (the shadda goes on the letter: التَّفعيل).
const SUN = "تثدذرزسشصضطظلن";

// "تَفعيل" -> "التَّفعيل", "إِفعال" -> "الإِفعال", "اِنفِعال" -> "الاِنفِعال"
export function withArticle(word) {
  return "ال" + (SUN.includes(word[0]) ? word[0] + "ّ" + word.slice(1) : word);
}

const M = (...words) => words.map(withArticle);

export const PATTERNS = {
  1: {
    past: ["فَعَلَ", "فَعِلَ", "فَعُلَ"],
    present: ["يَفعَل", "يَفعِل", "يَفعُل"],
    masdar: null,
    activeParticiple: ["فاعِل"],
    passiveParticiple: ["مَفعول"],
    makaan: ["مَفعَل", "مَفعِل"],
    passivePast: ["فُعِلَ"],
    passivePresent: ["يُفعَل"],
    imperative: ["اِفعَل", "اِفعِل", "اُفعُل"],
  },
  2: {
    past: ["فَعَّلَ"], present: ["يُفَعِّل"], masdar: M("تَفعيل"), activeParticiple: ["مُفَعِّل"],
    passiveParticiple: ["مُفَعَّل"], passivePast: ["فُعِّلَ"], passivePresent: ["يُفَعَّل"], imperative: ["فَعِّل"],
  },
  3: {
    past: ["فاعَلَ"], present: ["يُفاعِل"], masdar: M("مُفاعَلة", "فِعال"), activeParticiple: ["مُفاعِل"],
    passiveParticiple: ["مُفاعَل"], passivePast: ["فوعِلَ"], passivePresent: ["يُفاعَل"], imperative: ["فاعِل"],
  },
  4: {
    past: ["أَفعَلَ"], present: ["يُفعِل"], masdar: M("إِفعال"), activeParticiple: ["مُفعِل"],
    passiveParticiple: ["مُفعَل"], passivePast: ["أُفعِلَ"], passivePresent: ["يُفعَل"], imperative: ["أَفعِل"],
  },
  5: {
    past: ["تَفَعَّلَ"], present: ["يَتَفَعَّل"], masdar: M("تَفَعُّل"), activeParticiple: ["مُتَفَعِّل"],
    passiveParticiple: ["مُتَفَعَّل"], passivePast: ["تُفُعِّلَ"], passivePresent: ["يُتَفَعَّل"], imperative: ["تَفَعَّل"],
  },
  6: {
    past: ["تَفاعَلَ"], present: ["يَتَفاعَل"], masdar: M("تَفاعُل"), activeParticiple: ["مُتَفاعِل"],
    passiveParticiple: ["مُتَفاعَل"], passivePast: ["تُفوعِلَ"], passivePresent: ["يُتَفاعَل"], imperative: ["تَفاعَل"],
  },
  7: {
    past: ["اِنفَعَلَ"], present: ["يَنفَعِل"], masdar: M("اِنفِعال"), activeParticiple: ["مُنفَعِل"],
    passiveParticiple: null, passivePast: null, passivePresent: null, imperative: ["اِنفَعِل"],
  },
  8: {
    past: ["اِفتَعَلَ"], present: ["يَفتَعِل"], masdar: M("اِفتِعال"), activeParticiple: ["مُفتَعِل"],
    passiveParticiple: ["مُفتَعَل"], passivePast: ["اُفتُعِلَ"], passivePresent: ["يُفتَعَل"], imperative: ["اِفتَعِل"],
  },
  9: {
    past: ["اِفعَلَّ"], present: ["يَفعَلّ"], masdar: M("اِفعِلال"), activeParticiple: ["مُفعَلّ"],
    passiveParticiple: null, passivePast: null, passivePresent: null, imperative: null,
  },
  Q1: {
    past: ["فَعلَلَ"], present: ["يُفَعلِل"], masdar: M("فَعلَلة", "فِعلال"), activeParticiple: ["مُفَعلِل"],
    passiveParticiple: ["مُفَعلَل"], passivePast: ["فُعلِلَ"], passivePresent: ["يُفَعلَل"], imperative: ["فَعلِل"],
  },
  Q2: {
    past: ["تَفَعلَلَ"], present: ["يَتَفَعلَل"], masdar: M("تَفَعلُل"), activeParticiple: ["مُتَفَعلِل"],
    passiveParticiple: ["مُتَفَعلَل"], passivePast: null, passivePresent: null, imperative: ["تَفَعلَل"],
  },
  10: {
    past: ["اِستَفعَلَ"], present: ["يَستَفعِل"], masdar: M("اِستِفعال"), activeParticiple: ["مُستَفعِل"],
    passiveParticiple: ["مُستَفعَل"], passivePast: ["اُستُفعِلَ"], passivePresent: ["يُستَفعَل"], imperative: ["اِستَفعِل"],
  },
};

// What the student may type: compared without sukun or tatweel, without the vowel that is just the long
// vowel's own mark (fatha before alif or taa marbuta, damma before waw, kasra before yaa) and with the
// shadda before its vowel. ا, أ and إ are different letters (الاِنفِعال is not الإِنفِعال). After ال the shadda
// on a sun letter is optional (التَفعيل is accepted).
export function canon(s) {
  return String(s ?? "")
    .replace(/[ـْ\s]/g, "")
    .replace(/َ(?=[اة])/g, "")
    .replace(/ُ(?=و)/g, "")
    .replace(/ِ(?=ي)/g, "")
    .replace(/([َُِ])ّ/g, "ّ$1")
    .replace(new RegExp(`^(ال)([${SUN}])ّ`), "$1$2");
}


// --- What the student has learned, lesson by lesson (levels are { book, unit }; book 2 = Al-Kitaab part 1,
// 3 = part 2, 4 = part 3). The trainer only asks what the student's level covers.
const at = (book, unit) => ({ book, unit });

// Four-letter roots are learned at part 2, lesson 7 (with the passive of forms I and II).
export const QUAD_FROM = at(3, 7);

// `from`: the form, its past and its present; `masdar`: its verbal noun (null = never asked)
export const FORM_LEVELS = {
  1: { from: at(2, 4), masdar: null },
  2: { from: at(2, 4), masdar: at(2, 6) },
  3: { from: at(2, 4), masdar: at(2, 6) },
  5: { from: at(2, 4), masdar: at(2, 6) },
  4: { from: at(2, 8), masdar: at(2, 8) },
  8: { from: at(2, 8), masdar: at(2, 8) },
  10: { from: at(2, 9), masdar: at(2, 9) },
  6: { from: at(2, 11), masdar: at(2, 11) },
  7: { from: at(2, 11), masdar: at(2, 11) },
  9: { from: at(3, 3), masdar: at(3, 3) },
  Q1: { from: QUAD_FROM, masdar: QUAD_FROM },
  Q2: { from: QUAD_FROM, masdar: QUAD_FROM },
};

// where each of the other fields is learned
export const FIELD_LEVELS = {
  makaan: at(3, 1), // the noun of place, form I only
  activeParticiple: at(3, 5),
  passiveParticiple: at(3, 8), // for the other forms it is also the noun of place
  imperative: IMPERATIVE_LEVEL,
};

// The passive past of forms I and II and four-letter I comes at part 2 lesson 7; the passive past of every
// other form and the passive present of every form come at part 2 lesson 10.
const PASSIVE_EARLY = [1, 2, "Q1"];
const PASSIVE_EARLY_FROM = at(3, 7);
const PASSIVE_LATER_FROM = at(3, 10);
export const PASSIVE_FIELDS = ["passivePast", "passivePresent"];

// The first level at which the trainer has anything to ask.
export const PATTERNS_FROM = at(2, 4);

const askable = (form, field) => !!PATTERNS[form]?.[field];

// Is this form on the course yet?
export const formsAt = (level) => ALL_FORMS.filter((f) => levelReached(level, FORM_LEVELS[f].from));

// The answer fields (after the form number) for this form at this level, in the order they are asked.
export function fieldsAt(form, level) {
  const known = (field) => {
    if (!askable(form, field)) return false;
    const fl = FORM_LEVELS[form];
    if (field === "past" || field === "present") return levelReached(level, fl.from);
    if (field === "masdar") return !!fl.masdar && levelReached(level, fl.masdar);
    if (field === "passivePast") return levelReached(level, PASSIVE_EARLY.includes(form) ? PASSIVE_EARLY_FROM : PASSIVE_LATER_FROM);
    if (field === "passivePresent") return levelReached(level, PASSIVE_LATER_FROM);
    return levelReached(level, FIELD_LEVELS[field]);
  };
  return FIELDS.filter(known);
}

// Can this value be given to the student without leaving the form unclear? Among the forms that can be
// asked for this field at this level, no other form may share it (form I and IV share the passive present
// يُفعَل, but only form I has a passive at the level where that is learned, for instance).
function uniqueClue(form, field, level) {
  const mine = PATTERNS[form][field].map(canon);
  return formsAt(level).every(
    (f) => f === form || !fieldsAt(f, level).includes(field) || !PATTERNS[f][field].map(canon).some((v) => mine.includes(v)),
  );
}

// A round at this level: one clue (the form number or one of the patterns) and the fields the student fills
// in. `only` can narrow the forms. Returns { form, clue: { field, value }, targets: [field...] }.
export function buildTask(level, rng = Math.random, only = null) {
  const pool = formsAt(level).filter((f) => !only || only.includes(f));
  const form = pool[Math.floor(rng() * pool.length)];
  const fields = fieldsAt(form, level);
  const clues = ["form", ...fields.filter((f) => uniqueClue(form, f, level))];
  const field = clues[Math.floor(rng() * clues.length)];
  const value = field === "form" ? form : PATTERNS[form][field][0];
  const targets = ["form", ...fields].filter((f) => f !== field);
  return { form, clue: { field, value }, targets };
}

// The present tense is written without case endings, so a typed final damma (يَفعَلُ) is not held against
// the student.
const typedForm = (field, answer) => {
  const s = canon(answer);
  return field === "present" || field === "passivePresent" ? s.replace(/ُ$/, "") : s;
};

// Is `answer` right for `field` of `form`? (For "form", the answer is a number.)
export function isCorrect(form, field, answer) {
  if (field === "form") return String(answer) === String(form);
  const typed = typedForm(field, answer);
  return typed !== "" && PATTERNS[form][field].some((v) => canon(v) === typed);
}

// Form I has three patterns for the past and the present (فَعَلَ فَعِلَ فَعُلَ): the student fills in three
// boxes, in any order, and needs all three, each once. For any other form, `answers` is a single entry.
export function isCorrectSet(form, field, answers) {
  const typed = answers.map((a) => typedForm(field, a)).filter(Boolean);
  if (form !== 1) return typed.length === 1 && isCorrect(form, field, typed[0]);
  const wanted = PATTERNS[1][field].map(canon);
  return typed.length === wanted.length && wanted.every((w) => typed.includes(w)) && new Set(typed).size === typed.length;
}

// Fields that take three boxes once the student says it is form I.
export const MULTI_FIELDS = ["past", "present"];

// The answer to show for a field: every accepted variant.
export const answerText = (form, field) => (field === "form" ? String(form) : PATTERNS[form][field].join(" / "));

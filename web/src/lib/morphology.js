// Generates verb conjugations, verbal nouns, participles and (regular) plurals.
//
// Rule: anything stored on the word wins; otherwise it is generated if the
// root is regular ("sound"). Irregular roots (weak, hamzated, doubled) and
// forms the generator does not cover are reported in `missing` so the UI can
// say they need to be stored in words.json.
//
// Stored fields read from a word (all optional):
//   conjugations: { past, present, imperative }   per-tense, replaces generated
//   masdar:            string | string[]
//   activeParticiple:  string
//   passiveParticiple: string
//   plural:            string
//   pastVowel / presentVowel: "a" | "i" | "u"   (Form I only)
//   transitive:        false suppresses the passive participle

import { rootLetters, FATHA as F, DAMMA as D, KASRA as K, SUKUN as S, SHADDA as SH } from "./arabic.js";

export const PAST_PERSONS = ["1s", "2ms", "2fs", "2d", "2mp", "2fp", "3ms", "3fs", "3md", "3fd", "3mp", "3fp", "1p"];
export const PRESENT_PERSONS = PAST_PERSONS;
export const IMPERATIVE_PERSONS = ["2ms", "2fs", "2d", "2mp", "2fp"];

const VOWEL = { a: F, i: K, u: D };
const WEAK_OR_HAMZA = new Set([..."وياىءأإآؤئ"]);
const FORM_VIII_ASSIMILATING = new Set([..."ثدذزصضطظ"]);
const SUPPORTED_FORMS = [1, 2, 3, 4, 5, 6, 7, 8, 10];

// ---------- verb stems ----------

function stems(form, [r1, r2, r3], pastV = "a", presV = "u") {
  switch (form) {
    case 1: {
      const presCore = r1 + S + r2 + VOWEL[presV];
      return {
        pastStem: r1 + F + r2 + VOWEL[pastV],
        presVowel: F,
        presCore,
        impCore: (presV === "u" ? "ا" + D : "ا" + K) + presCore,
      };
    }
    case 2: {
      const presCore = r1 + F + r2 + SH + K;
      return { pastStem: r1 + F + r2 + SH + F, presVowel: D, presCore, impCore: presCore };
    }
    case 3: {
      const presCore = r1 + F + "ا" + r2 + K;
      return { pastStem: r1 + F + "ا" + r2 + F, presVowel: D, presCore, impCore: presCore };
    }
    case 4: {
      const presCore = r1 + S + r2 + K;
      return { pastStem: "أ" + F + r1 + S + r2 + F, presVowel: D, presCore, impCore: "أ" + F + presCore };
    }
    case 5: {
      const core = "ت" + F + r1 + F + r2 + SH + F;
      return { pastStem: core, presVowel: F, presCore: core, impCore: core };
    }
    case 6: {
      const core = "ت" + F + r1 + F + "ا" + r2 + F;
      return { pastStem: core, presVowel: F, presCore: core, impCore: core };
    }
    case 7: {
      const presCore = "ن" + S + r1 + F + r2 + K;
      return { pastStem: "ا" + K + "ن" + S + r1 + F + r2 + F, presVowel: F, presCore, impCore: "ا" + K + presCore };
    }
    case 8: {
      const presCore = r1 + S + "ت" + F + r2 + K;
      return { pastStem: "ا" + K + r1 + S + "ت" + F + r2 + F, presVowel: F, presCore, impCore: "ا" + K + presCore };
    }
    case 10: {
      const presCore = "س" + S + "ت" + F + r1 + S + r2 + K;
      return { pastStem: "ا" + K + "س" + S + "ت" + F + r1 + S + r2 + F, presVowel: F, presCore, impCore: "ا" + K + presCore };
    }
    default:
      return null;
  }
}

const PAST_ENDINGS = {
  "3ms": F,
  "3fs": F + "ت" + S,
  "3md": F + "ا",
  "3fd": F + "ت" + F + "ا",
  "3mp": D + "وا",
  "3fp": S + "ن" + F,
  "2ms": S + "ت" + F,
  "2fs": S + "ت" + K,
  "2d": S + "ت" + D + "م" + F + "ا",
  "2mp": S + "ت" + D + "م" + S,
  "2fp": S + "ت" + D + "ن" + SH + F,
  "1s": S + "ت" + D,
  "1p": S + "ن" + F + "ا",
};

const PRESENT_PREFIX = {
  "1s": "أ", "1p": "ن",
  "2ms": "ت", "2fs": "ت", "2d": "ت", "2mp": "ت", "2fp": "ت",
  "3ms": "ي", "3md": "ي", "3mp": "ي", "3fp": "ي",
  "3fs": "ت", "3fd": "ت",
};

const PRESENT_ENDINGS = {
  "1s": D, "1p": D, "2ms": D, "3ms": D, "3fs": D,
  "2fs": K + "ين" + F,
  "2mp": D + "ون" + F, "3mp": D + "ون" + F,
  "2fp": S + "ن" + F, "3fp": S + "ن" + F,
  "2d": F + "ان" + K, "3md": F + "ان" + K, "3fd": F + "ان" + K,
};

const IMPERATIVE_ENDINGS = {
  "2ms": S,
  "2fs": K + "ي",
  "2d": F + "ا",
  "2mp": D + "وا",
  "2fp": S + "ن" + F,
};

// ---------- verb analysis ----------

export function analyzeVerb(word) {
  const letters = rootLetters(word.root);
  if (word.pos !== "verb") return { regular: false, reason: "not a verb" };
  if (letters.length !== 3) return { regular: false, reason: "quadriliteral root" };
  if (!SUPPORTED_FORMS.includes(word.form)) return { regular: false, reason: `Form ${word.form} not covered by generator` };
  if (letters.some((l) => WEAK_OR_HAMZA.has(l))) return { regular: false, reason: "weak or hamzated root" };
  if (letters[1] === letters[2]) return { regular: false, reason: "doubled root" };
  if (word.form === 8 && FORM_VIII_ASSIMILATING.has(letters[0])) return { regular: false, reason: "Form VIII assimilation" };
  if (word.form === 1 && !VOWEL[word.presentVowel]) return { regular: false, reason: "Form I needs presentVowel (a/i/u)" };
  return { regular: true, letters };
}

function conjugateRegular(word, letters) {
  const [r1, r2, r3] = letters;
  const pastV = word.pastVowel ?? "a";
  const presV = word.presentVowel ?? "u";
  const st = stems(word.form, letters, pastV, presV);

  const past = {};
  for (const p of PAST_PERSONS) past[p] = st.pastStem + r3 + PAST_ENDINGS[p];

  const present = {};
  for (const p of PRESENT_PERSONS) {
    present[p] = PRESENT_PREFIX[p] + st.presVowel + st.presCore + r3 + PRESENT_ENDINGS[p];
  }

  const imperative = {};
  for (const p of IMPERATIVE_PERSONS) imperative[p] = st.impCore + r3 + IMPERATIVE_ENDINGS[p];

  return { past, present, imperative };
}

// ---------- nouns derived from verbs ----------

function masdarRegular(form, [r1, r2, r3]) {
  switch (form) {
    case 2: return ["ت" + F + r1 + S + r2 + K + "ي" + r3];
    case 3: return ["م" + D + r1 + F + "ا" + r2 + F + r3 + F + "ة"];
    case 4: return ["إ" + K + r1 + S + r2 + F + "ا" + r3];
    case 5: return ["ت" + F + r1 + F + r2 + SH + D + r3];
    case 6: return ["ت" + F + r1 + F + "ا" + r2 + D + r3];
    case 7: return ["ا" + K + "ن" + S + r1 + K + r2 + F + "ا" + r3];
    case 8: return ["ا" + K + r1 + S + "ت" + K + r2 + F + "ا" + r3];
    case 10: return ["ا" + K + "س" + S + "ت" + K + r1 + S + r2 + F + "ا" + r3];
    default: return null; // Form I masdar is not predictable
  }
}

function activeParticipleRegular(form, [r1, r2, r3]) {
  switch (form) {
    case 1: return r1 + F + "ا" + r2 + K + r3;
    case 2: return "م" + D + r1 + F + r2 + SH + K + r3;
    case 3: return "م" + D + r1 + F + "ا" + r2 + K + r3;
    case 4: return "م" + D + r1 + S + r2 + K + r3;
    case 5: return "م" + D + "ت" + F + r1 + F + r2 + SH + K + r3;
    case 6: return "م" + D + "ت" + F + r1 + F + "ا" + r2 + K + r3;
    case 7: return "م" + D + "ن" + S + r1 + F + r2 + K + r3;
    case 8: return "م" + D + r1 + S + "ت" + F + r2 + K + r3;
    case 10: return "م" + D + "س" + S + "ت" + F + r1 + S + r2 + K + r3;
    default: return null;
  }
}

function passiveParticipleRegular(form, [r1, r2, r3]) {
  switch (form) {
    case 1: return "م" + F + r1 + S + r2 + D + "و" + r3;
    case 2: return "م" + D + r1 + F + r2 + SH + F + r3;
    case 3: return "م" + D + r1 + F + "ا" + r2 + F + r3;
    case 4: return "م" + D + r1 + S + r2 + F + r3;
    case 5: return "م" + D + "ت" + F + r1 + F + r2 + SH + F + r3;
    case 6: return "م" + D + "ت" + F + r1 + F + "ا" + r2 + F + r3;
    case 8: return "م" + D + r1 + S + "ت" + F + r2 + F + r3;
    case 10: return "م" + D + "س" + S + "ت" + F + r1 + S + r2 + F + r3;
    default: return null; // Form VII has no passive participle
  }
}

// Masculine/feminine/plural set for an agent noun or participle `m`.
function participleSet(m) {
  return { m, f: m + F + "ة", pm: m + D + "ون" + F, pf: m + F + "ات" };
}

// ---------- public API ----------

const asArray = (v) => (v == null ? null : Array.isArray(v) ? v : [v]);

export function getForms(word) {
  const out = {
    isVerb: word.pos === "verb",
    regular: true,
    irregularReason: null,
    past: null, present: null, imperative: null,
    masdar: null, activeParticiple: null, passiveParticiple: null,
    plural: null,
    source: {},
    missing: [],
  };

  const stored = word.conjugations ?? {};

  if (out.isVerb) {
    const analysis = analyzeVerb(word);
    out.regular = analysis.regular;
    out.irregularReason = analysis.regular ? null : analysis.reason;
    const gen = analysis.regular ? conjugateRegular(word, analysis.letters) : null;

    for (const tense of ["past", "present", "imperative"]) {
      if (stored[tense]) {
        out[tense] = stored[tense];
        out.source[tense] = "stored";
      } else if (gen) {
        out[tense] = gen[tense];
        out.source[tense] = "generated";
      } else {
        out.missing.push(tense);
      }
    }

    const letters = analysis.regular ? analysis.letters : null;

    const storedMasdar = asArray(word.masdar);
    if (storedMasdar) {
      out.masdar = storedMasdar;
      out.source.masdar = "stored";
    } else if (letters && masdarRegular(word.form, letters)) {
      out.masdar = masdarRegular(word.form, letters);
      out.source.masdar = "generated";
    } else {
      out.missing.push("masdar");
    }

    if (word.activeParticiple) {
      out.activeParticiple = { m: word.activeParticiple };
      out.source.activeParticiple = "stored";
    } else if (letters) {
      out.activeParticiple = participleSet(activeParticipleRegular(word.form, letters));
      out.source.activeParticiple = "generated";
    } else {
      out.missing.push("activeParticiple");
    }

    const passiveApplies = word.transitive !== false && word.form !== 7;
    if (passiveApplies) {
      if (word.passiveParticiple) {
        out.passiveParticiple = { m: word.passiveParticiple };
        out.source.passiveParticiple = "stored";
      } else if (letters) {
        out.passiveParticiple = participleSet(passiveParticipleRegular(word.form, letters));
        out.source.passiveParticiple = "generated";
      } else {
        out.missing.push("passiveParticiple");
      }
    }
  }

  if (word.plural) {
    out.plural = word.plural;
    out.source.plural = "stored";
  } else if (word.pos === "noun" && word.gender === "feminine" && word.arabic?.endsWith("ة")) {
    // Sound feminine plural. Broken plurals must be stored (stored wins above).
    out.plural = word.arabic.replace(/ة$/, "ات");
    out.source.plural = "generated";
  }

  return out;
}

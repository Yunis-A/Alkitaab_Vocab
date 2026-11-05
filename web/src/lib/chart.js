// How the present-tense chart is written: free of case endings. A form that can end in ن
// (you f., you all, they m./all, the duals) shows both of its endings, with ن and without it
// (تُحِبّينَ/ي); the others simply lose their final vowel (أُحِبّ, تُحِبّ).

const BOTH = [
  [/ينَ$/, "/ي"], // 2fs
  [/ونَ$/, "/وا"], // 2mp, 3mp
  [/انِ$/, "/ا"], // duals
];
const NEVER_DROPS_NOON = new Set(["2fp", "3fp"]); // يَفعَلْنَ keeps its ن in every mood

export function presentChartForm(person, form) {
  if (!form) return form;
  if (NEVER_DROPS_NOON.has(person)) return form;
  for (const [ending, extra] of BOTH) if (ending.test(form)) return form + extra;
  return form.replace(/ُ(?=ّ?$)/, ""); // the damma, also when a shadda follows it (يُحِبُّ)
}

// The whole present table, person by person.
export function presentChart(present) {
  if (!present) return present;
  return Object.fromEntries(Object.entries(present).map(([p, f]) => [p, presentChartForm(p, f)]));
}

// The present chart is free of case endings: a form that can lose its noon (تَدرُسينَ/ي) is accepted both ways.
export function presentAnswers(person, form) {
  const chart = presentChartForm(person, form);
  const [base, alt] = chart.split("/");
  if (!alt) return [base];
  const stem = base.slice(0, -2); // without the noon and its vowel
  return [base, alt === "وا" ? `${stem}ا` : stem];
}


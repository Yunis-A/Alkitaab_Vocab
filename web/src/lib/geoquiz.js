// Map game rules: modes, question building, timing.

// Labels are built in the UI so the words "country" and "capital" can switch to
// Arabic when the student has learned them.
//   kind: "country" -> every question is a country name
//   kind: "capital" -> every question is a capital (places without an agreed capital are left out)
//   kind: "both"    -> every country is asked twice, once by name and once by capital (places
//                      without an agreed capital are only asked by name)
export const GEO_MODES = [
  { id: "en-countries", lang: "en", kind: "country" },
  { id: "en-capital", lang: "en", kind: "capital" },
  { id: "en-both", lang: "en", kind: "both" },
  { id: "ar-countries", lang: "ar", kind: "country" },
  { id: "ar-capital", lang: "ar", kind: "capital" },
  { id: "ar-both", lang: "ar", kind: "both" },
];

// Each wrong click adds this to the final time.
export const WRONG_PENALTY_MS = 5000;

// A run ends (without a score) when time plus penalties reaches this.
export const TIME_LIMIT_MS = 10 * 60 * 1000;

function shuffle(items, rng) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The questions of a run, in random order (see GEO_MODES for what each mode asks).
export function buildQuestions(mode, countries, rng = Math.random) {
  const ar = mode.lang === "ar";
  const asCountry = (c) => ({ countryId: c.id, kind: "country", text: ar ? c.nameAr : c.nameEn });
  const asCapital = (c) => ({ countryId: c.id, kind: "capital", text: ar ? c.capitalAr : c.capitalEn });

  const all = [];
  for (const c of countries) {
    if (mode.kind !== "capital") all.push(asCountry(c));
    if (mode.kind !== "country" && c.capitalEn) all.push(asCapital(c));
  }
  return shuffle(all, rng);
}

export function finalTime(elapsedMs, wrongClicks) {
  return elapsedMs + wrongClicks * WRONG_PENALTY_MS;
}

export function formatTime(ms) {
  const total = Math.round(ms / 100) / 10;
  const m = Math.floor(total / 60);
  const s = (total - m * 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}

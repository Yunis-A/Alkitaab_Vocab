// Map game rules: modes, question building, timing.

// Labels are built in the UI so the words "country" and "capital" can switch to
// Arabic when the student has learned them.
export const GEO_MODES = [
  { id: "en-countries", lang: "en", capitals: false },
  { id: "en-capitals", lang: "en", capitals: true },
  { id: "ar-countries", lang: "ar", capitals: false },
  { id: "ar-capitals", lang: "ar", capitals: true },
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

// One question per country, in random order. In "capitals" modes about half of
// the countries (those with an agreed capital) are asked by capital instead.
export function buildQuestions(mode, countries, rng = Math.random) {
  const ar = mode.lang === "ar";
  const order = shuffle(countries, rng);
  const capitalPool = mode.capitals ? shuffle(order.filter((c) => c.capitalEn), rng) : [];
  const byCapital = new Set(capitalPool.slice(0, Math.ceil(order.length / 2)).map((c) => c.id));

  return order.map((c) => {
    const kind = byCapital.has(c.id) ? "capital" : "country";
    const text = kind === "capital" ? (ar ? c.capitalAr : c.capitalEn) : ar ? c.nameAr : c.nameEn;
    return { countryId: c.id, kind, text };
  });
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

import { test } from "node:test";
import assert from "node:assert/strict";

import { getForms, analyzeVerb } from "./morphology.js";
import { normalizeArabic } from "./arabic.js";
import { buildIndex, search } from "./search.js";
import {
  newCard, review, wordStatus, boxStatus, BOX_INTERVALS, cardKey, VARIETY_IDS, RATINGS,
} from "./leitner.js";
import { activeVarieties, isWordAvailable, headword, varietyText, parseCardKey, dialectOf } from "./varieties.js";
import { rootKey } from "./arabic.js";
import {
  filterWords, filterOptions, activeFilterCount, parseLevelKey, levelKey, levelsUpTo,
} from "./filters.js";
import { cleanText, parseCell } from "../../scripts/lib/vocab-parse.mjs";
import { unitAfterBookChange, books, IMPERATIVE_LEVEL, levelReached } from "../config/books.js";
import { GEO_MODES, TIME_LIMIT_MS, buildQuestions, finalTime, formatTime } from "./geoquiz.js";
import { geoCountries } from "../data/geography.js";
import { mapShapes } from "../data/menaMap.js";
import allWords from "../data/words.json" with { type: "json" };
import { stripDiacritics } from "./arabic.js";
import { localizeDigits } from "./numerals.js";
import { unlockedSections, nextLockedSection, sectionsForWord, sectionTitle } from "./grammar.js";
import { grammarSections } from "../data/grammar.js";
import { loadProgress, saveProgress } from "./storage.js";
import { vocabSets, isArabic, arabicRatio, isRtl } from "./i18n.js";
import { strings } from "../i18n/strings.js";

// Compare ignoring the order of combining marks (shadda vs. vowel).
const nfc = (s) => s.normalize("NFC");
const same = (actual, expected) => assert.equal(nfc(actual), nfc(expected));

const verb = (root, form, extra = {}) => ({ id: "t", pos: "verb", root, form, arabic: "", ...extra });

test("Form I sound verb (كتب, u)", () => {
  const f = getForms(verb("ك ت ب", 1, { presentVowel: "u" }));
  same(f.past["3ms"], "كَتَبَ");
  same(f.past["3fs"], "كَتَبَتْ");
  same(f.past["1s"], "كَتَبْتُ");
  same(f.past["3mp"], "كَتَبُوا");
  same(f.present["3ms"], "يَكْتُبُ");
  same(f.present["2fs"], "تَكْتُبِينَ");
  same(f.present["3mp"], "يَكْتُبُونَ");
  same(f.present["1s"], "أَكْتُبُ");
  same(f.imperative["2ms"], "اُكْتُبْ");
  same(f.imperative["2mp"], "اُكْتُبُوا");
  same(f.activeParticiple.m, "كاتِب"); // no fatha before a long alef (book style)
  same(f.activeParticiple.f, "كاتِبَة");
  same(f.activeParticiple.pm, "كاتِبُونَ");
  same(f.passiveParticiple.m, "مَكْتُوب");
  assert.deepEqual(f.missing, ["masdar"]); // Form I masdar must be stored
});

test("Form I with kasra/fatha present vowels and stative past", () => {
  const f = getForms(verb("ف ه م", 1, { pastVowel: "i", presentVowel: "a" }));
  same(f.past["3ms"], "فَهِمَ");
  same(f.present["3ms"], "يَفْهَمُ");
  same(f.imperative["2ms"], "اِفْهَمْ");
});

test("Forms II-X", () => {
  const ii = getForms(verb("د ر س", 2));
  same(ii.past["3ms"], "دَرَّسَ");
  same(ii.present["3ms"], "يُدَرِّسُ");
  same(ii.imperative["2ms"], "دَرِّسْ");
  same(ii.masdar[0], "تَدْرِيس");
  same(ii.activeParticiple.m, "مُدَرِّس");
  same(ii.passiveParticiple.m, "مُدَرَّس");

  const iii = getForms(verb("ك ت ب", 3));
  same(iii.past["3ms"], "كاتَبَ");
  same(iii.present["3ms"], "يُكاتِبُ");

  const iv = getForms(verb("خ ر ج", 4));
  same(iv.past["3ms"], "أَخْرَجَ");
  same(iv.present["3ms"], "يُخْرِجُ");
  same(iv.imperative["2ms"], "أَخْرِجْ");
  same(iv.masdar[0], "إِخْراج");

  const v = getForms(verb("ك ل م", 5));
  same(v.past["3ms"], "تَكَلَّمَ");
  same(v.present["3ms"], "يَتَكَلَّمُ");
  same(v.masdar[0], "تَكَلُّم");

  const vi = getForms(verb("ك ت ب", 6));
  same(vi.past["3ms"], "تَكاتَبَ");
  same(vi.present["3ms"], "يَتَكاتَبُ");

  const vii = getForms(verb("ك س ر", 7));
  same(vii.past["3ms"], "اِنْكَسَرَ");
  same(vii.present["3ms"], "يَنْكَسِرُ");
  assert.equal(vii.passiveParticiple, null);

  const viii = getForms(verb("ج م ع", 8));
  same(viii.past["3ms"], "اِجْتَمَعَ");
  same(viii.present["3ms"], "يَجْتَمِعُ");
  same(viii.masdar[0], "اِجْتِماع");

  const x = getForms(verb("ك ت ب", 10));
  same(x.past["3ms"], "اِسْتَكْتَبَ");
  same(x.present["3ms"], "يَسْتَكْتِبُ");
  same(x.imperative["2ms"], "اِسْتَكْتِبْ");
  same(x.masdar[0], "اِسْتِكْتاب");
});

test("irregular roots are not generated and are reported missing", () => {
  // a weak middle radical in the derived forms is regular
  const ii = getForms(verb("ع و د", 2));
  same(ii.past["3ms"], "عَوَّدَ");
  same(ii.present["3ms"], "يُعَوِّدُ");
  same(getForms(verb("ع و ن", 3)).present["3ms"], "يُعاوِنُ");
  assert.equal(analyzeVerb(verb("و ق ع", 2)).regular, false); // weak first radical is not
  assert.equal(analyzeVerb(verb("ر م ي", 2)).regular, false); // nor is a weak last radical

  for (const [root, why] of [["ق و ل", /weak/], ["أ ك ل", /weak/], ["ح ب ب", /doubled/]]) {
    const a = analyzeVerb(verb(root, 1, { presentVowel: "u" }));
    assert.equal(a.regular, false);
    assert.match(a.reason, why);
  }
  const f = getForms(verb("ق و ل", 1, { presentVowel: "u" }));
  assert.equal(f.past, null);
  assert.ok(f.missing.includes("past") && f.missing.includes("activeParticiple"));
});

test("stored data wins over generated, per field", () => {
  const f = getForms(verb("ك ت ب", 1, {
    presentVowel: "u",
    conjugations: { past: { "3ms": "STORED" } },
    masdar: "كِتَابَة",
    activeParticiple: "AP",
  }));
  assert.equal(f.past["3ms"], "STORED");
  assert.equal(f.source.past, "stored");
  assert.equal(f.source.present, "generated");
  assert.deepEqual(f.masdar, ["كِتَابَة"]);
  assert.equal(f.activeParticiple.m, "AP");
  assert.deepEqual(f.missing, []);
});

test("plurals: stored wins, feminine -a gets sound plural, others blank", () => {
  assert.equal(getForms({ pos: "noun", gender: "feminine", arabic: "جامعة", plural: "جامعات" }).source.plural, "stored");
  assert.equal(getForms({ pos: "noun", gender: "feminine", arabic: "جامعة" }).plural, "جامعات");
  assert.equal(getForms({ pos: "noun", gender: "masculine", arabic: "كتاب" }).plural, null);
});

test("search ignores diacritics, hamza/alef variants, and finds by root / form / English", () => {
  const words = [
    { id: "1", book: 1, unit: 1, arabic: "كَتَبَ", root: "ك ت ب", pos: "verb", form: 1, presentVowel: "u", transliteration: "kataba", definition: "to write" },
    { id: "2", book: 1, unit: 1, arabic: "كتاب", root: "ك ت ب", pos: "noun", transliteration: "kitaab", definition: "book" },
    { id: "3", book: 1, unit: 2, arabic: "أكل", root: "أ ك ل", pos: "verb", form: 1, transliteration: "akala", definition: "to eat" },
    { id: "4", book: 1, unit: 2, arabic: "طالب", root: "ط ل ب", pos: "noun", transliteration: "ṭaalib", definition: "student (m.)" },
  ];
  const idx = buildIndex(words);
  const ids = (q) => search(idx, q).map((w) => w.id);

  assert.deepEqual(ids("كتب").slice(0, 1), ["1"]); // exact word beats same-root
  assert.deepEqual(ids("كتب").sort(), ["1", "2"]); // root search finds both
  assert.deepEqual(ids("ك ت ب").sort(), ["1", "2"]);
  assert.deepEqual(ids("كَتَبَ"), ["1", "2"].slice(0, 1).concat(["2"]));
  assert.deepEqual(ids("اكل"), ["3"]); // bare alef matches أ
  assert.deepEqual(ids("يكتب")[0], "1"); // conjugated form
  assert.deepEqual(ids("book"), ["2"]);
  assert.deepEqual(ids("taalib"), ["4"]); // transliteration without dots
  assert.deepEqual(ids("zzz"), []);
  assert.equal(ids("").length, 4);
});

test("Leitner: 11 boxes, intervals, ratings, proficiency", () => {
  const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;
  assert.deepEqual(BOX_INTERVALS, [MIN, 3 * MIN, 15 * MIN, HOUR, DAY, DAY, 2 * DAY, 7 * DAY, 30 * DAY, 30 * DAY, 90 * DAY]);

  const t0 = 1_000_000;
  let c = newCard(t0);
  assert.equal(c.box, 0);
  assert.equal(c.due, t0); // new cards are due right away
  // easy moves up exactly one box
  c = review(c, "easy", t0);
  assert.equal(c.box, 1);
  assert.equal(c.due, t0 + 3 * MIN);
  // medium keeps you where you are (the same box's interval starts again)
  c = review(c, "medium", t0 + 10);
  assert.equal(c.box, 1);
  assert.equal(c.due, t0 + 10 + 3 * MIN);
  assert.equal(c.reviews, 2);
  assert.equal(c.lapses, 0);
  c = review(c, "easy", t0);
  assert.equal(c.box, 2);
  // hard goes all the way back to the first box
  c = review(c, "hard", t0);
  assert.equal(c.box, 0);
  assert.equal(c.due, t0 + MIN);
  assert.equal(c.lapses, 1);
  c = review({ ...c, box: 6 }, "hard", t0);
  assert.equal(c.box, 0);
  assert.equal(c.lapses, 2);
  // a card that was already in the first box stays there on medium, and that is not a lapse
  assert.equal(review({ ...newCard(t0), box: 0 }, "medium", t0).lapses, 0);
  assert.deepEqual(RATINGS, ["hard", "medium", "easy"]);
  for (const old of ["again", "good"]) assert.throws(() => review(c, old, t0));

  let k = { ...newCard(t0), box: 7 }; // in the 7-day box
  assert.equal(boxStatus(k.box), "learning");
  k = review(k, "medium", t0);
  assert.equal(k.box, 7); // staying put does not count as surviving it
  k = review(k, "easy", t0); // survived it
  assert.equal(k.box, 8);
  assert.equal(boxStatus(k.box), "proficient");
  k = review({ ...k, box: 9 }, "easy", t0);
  assert.equal(k.box, 10);
  assert.equal(boxStatus(k.box), "mastered");
  assert.equal(review(k, "easy", t0).box, 10); // capped
  assert.equal(review(k, "medium", t0).box, 10);
});

test("word status: MSA card by default, weakest active variety when dialects are on", () => {
  assert.deepEqual(VARIETY_IDS, ["ar-en", "egy", "shm"]);
  assert.equal(cardKey("w"), "w|ar-en");
  assert.equal(cardKey("w", "egy"), "w|egy");
  assert.equal(wordStatus({}, "w"), "new");
  const at = (box) => ({ [cardKey("w")]: { ...newCard(), box } });
  assert.equal(wordStatus(at(0), "w"), "learning");
  assert.equal(wordStatus(at(8), "w"), "proficient");
  assert.equal(wordStatus(at(10), "w"), "mastered");

  // with Egyptian on, a word is only as strong as its weakest card
  const both = { ...at(10), [cardKey("w", "egy")]: { ...newCard(), box: 8 } };
  assert.equal(wordStatus(both, "w", ["ar-en", "egy"]), "proficient");
  assert.equal(wordStatus(at(10), "w", ["ar-en", "egy"]), "learning"); // Egyptian not started
  assert.equal(wordStatus(at(10), "w", ["egy"]), "new");
});

test("varieties: dialect cards exist only for enabled dialects that have a form", () => {
  const w = { id: "x", arabic: "كِتاب", egyptian: { arabic: "كتاب" }, shami: { plural: "كْتُب" } };
  assert.deepEqual(activeVarieties(w, {}), ["ar-en"]);
  assert.deepEqual(activeVarieties(w, { egyptian: true, shami: true }), ["ar-en", "egy"]); // shami has no headword
  const only = { id: "y", arabic: null, shami: { arabic: "ماشي" } };
  assert.equal(isWordAvailable(only, {}), false); // dialect-only row is hidden until that dialect is on
  assert.equal(isWordAvailable(only, { shami: true }), true);
  assert.equal(headword(only, { shami: true }), "ماشي");
  assert.equal(varietyText(w, "egy"), "كتاب");
  assert.deepEqual(parseCardKey("b2-u1-003|egy"), { wordId: "b2-u1-003", variety: "egy" });
  assert.equal(dialectOf("shm"), "shami");
});

test("search: dialect forms are found only when that dialect is enabled; roots ignore hamza spelling", () => {
  const words = [
    { id: "1", book: 2, unit: 1, arabic: "أَكَلَ", root: "ء ك ل", pos: "verb", form: 1, transliteration: "", definition: "to eat", egyptian: { arabic: "أَكَل", present: "ياكُل" } },
    { id: "2", book: 2, unit: 1, arabic: null, pos: "phrase", transliteration: "", definition: "OK", shami: { arabic: "ماشي" } },
  ];
  const idx = buildIndex(words);
  assert.deepEqual(search(idx, "ياكل").map((w) => w.id), []);
  assert.deepEqual(search(idx, "ياكل", { egyptian: true }).map((w) => w.id), ["1"]);
  assert.deepEqual(search(idx, "ماشي").map((w) => w.id), []);
  assert.deepEqual(search(idx, "ماشي", { shami: true }).map((w) => w.id), ["2"]);
  assert.deepEqual(search(idx, "ماشي", { egyptian: true }).map((w) => w.id), []);
  for (const q of ["ء ك ل", "أ ك ل", "اكل"]) assert.ok(search(idx, q).some((w) => w.id === "1"), q);
  assert.equal(rootKey("أ ك ل"), rootKey("ء ك ل"));
});

test("digits switch to Arabic-Indic and back", () => {
  assert.equal(localizeDigits(12, true), "١٢");
  assert.equal(localizeDigits(12, false), "12");
  assert.equal(localizeDigits("الكتاب ١", false), "الكتاب 1");
  assert.equal(localizeDigits("الكتاب 2", true), "الكتاب ٢");
  assert.equal(localizeDigits("Alif Baa", true), "Alif Baa");
});

test("grammar unlocks by level and connects to words", () => {
  const at = (book, unit) => unlockedSections(grammarSections, { book, unit }).map((s) => s.id);
  assert.deepEqual(at(1, 1), ["script"]);
  assert.ok(at(1, 5).includes("shadda") && !at(1, 5).includes("roots"));
  assert.ok(at(2, 5).includes("past") && !at(2, 5).includes("present"));
  assert.equal(at(4, 10).length, grammarSections.length);
  assert.equal(nextLockedSection(grammarSections, { book: 1, unit: 1 }).id, "vowels");
  assert.equal(nextLockedSection(grammarSections, { book: 4, unit: 10 }), null);

  const verb = { pos: "verb", form: 2, root: "د ر س", prepositions: [] };
  const noun = { pos: "noun", gender: "feminine", root: "م د ن", prepositions: ["في"], plural: "مدن" };
  const ids = (w, lvl) => sectionsForWord(grammarSections, w, lvl).map((s) => s.id);
  assert.deepEqual(ids(verb, { book: 2, unit: 9 }), ["roots", "past", "present", "forms"]);
  assert.deepEqual(ids({ ...verb, form: 1 }, { book: 2, unit: 9 }), ["roots", "past", "present"]);
  assert.deepEqual(ids(noun, { book: 3, unit: 5 }), ["roots", "gender", "prepositions", "plurals"]);
  assert.deepEqual(ids(noun, { book: 1, unit: 1 }), []); // nothing unlocked applies yet

  const t = (lvl) => sectionTitle(grammarSections[0], lvl);
  assert.equal(t({ book: 2, unit: 13 }), "The Arabic script");
  assert.equal(t({ book: 3, unit: 1 }), "الكتابة العربية");
});

test("saved progress keeps known card varieties, drops the old English -> Arabic direction, defaults dialects off", () => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
  saveProgress({ level: { book: 2, unit: 1 }, cards: { "a|ar-en": { box: 3 }, "a|en-ar": { box: 2 }, "a|egy": { box: 1 }, "a|shm": { box: 1 } } });
  assert.deepEqual(Object.keys(loadProgress().cards).sort(), ["a|ar-en", "a|egy", "a|shm"]);
  assert.deepEqual(loadProgress().level, { book: 2, unit: 1 });
  assert.deepEqual(loadProgress().dialects, { egyptian: false, shami: false });
  saveProgress({ ...loadProgress(), dialects: { egyptian: true } });
  assert.deepEqual(loadProgress().dialects, { egyptian: true, shami: false });
});

test("UI language: level gate, vocabulary gate, RTL switch", () => {
  const words = [{ id: "b", arabic: "كتاب" }, { id: "d", arabic: "درس" }];
  const none = vocabSets(words, {});
  const entry = { en: "x", ar: "y", unlock: { book: 2, unit: 1 } };
  const gated = { ...entry, needs: ["كتاب"] };

  assert.equal(isArabic(entry, { book: 1, unit: 10 }, none), false);
  assert.equal(isArabic(entry, { book: 2, unit: 1 }, none), true);
  assert.equal(isArabic(gated, { book: 2, unit: 1 }, none), false); // known but unlearned
  assert.equal(isArabic({ ...gated, needs: ["غير موجود"] }, { book: 2, unit: 1 }, none), true); // not in list: ignored

  const cards = {};
  cards[cardKey("b")] = { ...newCard(), box: 4 }; // first 1-day box
  assert.equal(isArabic(gated, { book: 2, unit: 1 }, vocabSets(words, cards)), true);

  // Ratio grows with level; RTL at book 3 or at >=50% Arabic, whichever first.
  const r = (book, unit) => arabicRatio(strings, { book, unit }, none);
  assert.ok(r(1, 1) === 0);
  assert.ok(r(2, 1) > 0 && r(2, 13) > r(2, 1));
  assert.ok(r(4, 10) > r(3, 1));
  assert.equal(isRtl({ book: 1, unit: 1 }, 0), false);
  assert.equal(isRtl({ book: 2, unit: 5 }, 0.2), false);
  assert.equal(isRtl({ book: 2, unit: 5 }, 0.5), true);
  assert.equal(isRtl({ book: 3, unit: 1 }, 0), true);
});

test("changing book: higher starts at unit 1, lower lands on the last unit", () => {
  assert.equal(unitAfterBookChange(1, 3), 1);
  assert.equal(unitAfterBookChange(2, 3), 1);
  assert.equal(unitAfterBookChange(3, 1), books[1].maxUnits);
  assert.equal(unitAfterBookChange(4, 2), books[2].maxUnits);
});

test("imperative is gated to Al-Kitaab part 3 lesson 3 everywhere", () => {
  assert.deepEqual(IMPERATIVE_LEVEL, { book: 4, unit: 3 });
  assert.equal(levelReached({ book: 4, unit: 2 }, IMPERATIVE_LEVEL), false);
  assert.equal(levelReached({ book: 4, unit: 3 }, IMPERATIVE_LEVEL), true);
  const imp = grammarSections.find((s) => s.id === "imperative");
  assert.deepEqual(imp.unlock, IMPERATIVE_LEVEL);
  // not searchable by imperative form before that
  const idx = buildIndex([{ id: "1", book: 2, unit: 1, arabic: "كَتَبَ", root: "ك ت ب", pos: "verb", form: 1, presentVowel: "u", transliteration: "", definition: "to write" }]);
  assert.equal(search(idx, "اكتبوا").length, 0); // imperative 2mp (present "I write" is أكتب, which does match)
  assert.equal(search(idx, "يكتب").length, 1);
});

test("imported vocabulary: structure, levels, dialect rules and search", () => {
  const ids = new Set(allWords.map((w) => w.id));
  assert.equal(ids.size, allWords.length, "ids are unique");
  assert.ok(allWords.length > 1400);

  for (const w of allWords) {
    assert.ok(w.book >= 1 && w.book <= 4, w.id);
    assert.ok(w.unit >= 1 && w.unit <= books[w.book].maxUnits, `${w.id} unit ${w.unit}`);
    assert.ok(w.arabic || w.egyptian?.arabic || w.shami?.arabic, `${w.id} has nothing to show`);
    assert.ok(w.definition, `${w.id} has no English`);
    assert.ok(["noun", "verb", "adjective", "adverb", "particle", "pronoun", "phrase", "suffix"].includes(w.pos), `${w.id} pos ${w.pos}`);
    assert.ok(!/[ـ]/.test(w.arabic ?? "") || w.pos === "suffix", `${w.id} has a stretch mark`);
    if (w.book === 1) assert.equal(w.root, null, `${w.id}: Alif Baa has no roots`);
    if (w.form) assert.ok(w.root && w.pos === "verb", `${w.id} form without root`);
    if (w.hideFromBook) assert.equal(w.book, 1, "only Alif Baa form rows are hidden later");
    for (const d of ["egyptian", "shami"]) if (w[d]) assert.ok(Object.keys(w[d]).length, `${w.id} empty ${d}`);
  }

  // most MSA headwords carry diacritics (the rest are listed in data/review.csv)
  const withArabic = allWords.filter((w) => w.arabic);
  const voweled = withArabic.filter((w) => /[ً-ْ]/.test(w.arabic));
  assert.ok(voweled.length / withArabic.length > 0.9);

  // dialect-only rows exist and have no MSA word
  assert.ok(allWords.some((w) => !w.arabic && w.egyptian?.arabic));
  // the 18 Alif Baa conjugated-form rows are hidden from Al-Kitaab part 1 onward
  assert.equal(allWords.filter((w) => w.hideFromBook).length, 18);

  // search ignores diacritics and finds by root
  const idx = buildIndex(allWords);
  const kitab = allWords.find((w) => stripDiacritics(w.arabic ?? "") === "كتاب" && w.pos === "noun");
  assert.ok(kitab, "كتاب is in the list");
  assert.ok(search(idx, "كتاب").some((w) => w.id === kitab.id));
  assert.ok(search(idx, kitab.arabic).some((w) => w.id === kitab.id));
  const accept = allWords.find((w) => stripDiacritics(w.arabic ?? "") === "قبل" && w.pos === "verb");
  assert.ok(accept && accept.root === "ق ب ل" && accept.form === 1 && accept.presentVowel === "a");
  assert.ok(search(idx, "ق ب ل").some((w) => w.id === accept.id)); // by root

  // every irregular verb has stored conjugations, except the rows deliberately left out
  // (passive-only, dialect-only, negated or imperative-only rows: see data/past-forms.json)
  const irregular = allWords.filter((w) => w.pos === "verb" && w.root && w.form && !getForms(w).regular);
  const without = irregular.filter((w) => !w.conjugations);
  assert.ok(irregular.length > 150);
  assert.ok(without.length <= 15, `${without.length} irregular verbs without stored forms: ${without.map((w) => w.id)}`);
  const says = allWords.find((w) => w.id === "b2-u4-025"); // "he says" (hollow root ق و ل)
  same(says.conjugations.past["3ms"], "قالَ");
  same(says.conjugations.past["1s"], "قُلْتُ");
  same(says.conjugations.present["2fs"], "تَقُولِينَ");
  same(says.conjugations.imperative["2ms"], "قُلْ");
  const f2 = getForms(says);
  assert.equal(f2.source.past, "stored");
  assert.deepEqual(f2.missing, []);
  // no stored verbal noun carries a stray preposition
  for (const w of allWords) for (const m of [w.masdar].flat().filter(Boolean)) assert.ok(!/\s/.test(m), `${w.id} masdar "${m}"`);

  // sound verbs get fully voweled generated conjugations
  const f = getForms(accept);
  assert.equal(f.source.present, "generated");
  same(f.past["3ms"], "قَبِلَ");
  same(f.present["3ms"], "يَقْبَلُ");
});

test("lookup filters: type, lesson range, verb form, gender, status, dialect", () => {
  const words = [
    { id: "a", book: 1, unit: 2, pos: "noun", gender: "masculine", form: null },
    { id: "b", book: 1, unit: 9, pos: "noun", gender: "feminine", form: null, egyptian: { arabic: "x" } },
    { id: "c", book: 2, unit: 3, pos: "verb", gender: null, form: 2, shami: { arabic: "y" } },
    { id: "d", book: 2, unit: 8, pos: "verb", gender: null, form: 1 },
    { id: "e", book: 3, unit: 1, pos: "adjective", gender: null, form: null },
  ];
  const ids = (f, ctx) => filterWords(words, { ...none, ...f }, ctx).map((w) => w.id).join("");
  const none = { pos: "", from: "", to: "", form: "", gender: "", status: "", dialect: "" };

  assert.equal(ids({}), "abcde");
  assert.equal(ids({ pos: "verb" }), "cd");
  assert.equal(ids({ pos: "verb", form: "2" }), "c");
  assert.equal(ids({ pos: "noun", gender: "feminine" }), "b");
  assert.equal(ids({ from: "1.9", to: "2.3" }), "bc"); // inclusive range across books
  assert.equal(ids({ from: "2.1" }), "cde"); // open-ended
  assert.equal(ids({ to: "1.9" }), "ab");
  assert.equal(ids({ from: "2.3", to: "1.9" }), "bc"); // a reversed range is swapped
  assert.equal(ids({ dialect: "egyptian" }), "b");
  assert.equal(ids({ dialect: "shami" }), "c");
  const statusOf = (id) => (id === "d" ? "mastered" : "new");
  assert.equal(ids({ status: "mastered" }, { statusOf }), "d");
  assert.equal(ids({ status: "new", pos: "verb" }, { statusOf }), "c");
  assert.equal(activeFilterCount(none), 0);
  assert.equal(activeFilterCount({ ...none, pos: "verb", from: "1.1" }), 2);

  assert.deepEqual(parseLevelKey("2.13"), { book: 2, unit: 13 });
  assert.equal(parseLevelKey("nonsense"), null);
  assert.equal(levelKey({ book: 3, unit: 4 }), "3.4");

  // lessons offered stop at the student's level
  const lv = levelsUpTo({ book: 2, unit: 2 }, books);
  assert.equal(lv.length, books[1].maxUnits + 2);
  assert.deepEqual(lv.at(-1), { book: 2, unit: 2 });
  assert.deepEqual(lv[0], { book: 1, unit: 1 });
  // the Lookup page shows them newest first
  assert.deepEqual([...lv].reverse()[0], { book: 2, unit: 2 });

  // "Beginning" / "End" replace "Any" in the lesson range once بداية and نهاية are learned
  const bid = allWords.find((w) => w.definition === "beginning");
  const nih = allWords.find((w) => w.definition === "end, ending");
  assert.deepEqual([bid.book, bid.unit, nih.book, nih.unit], [3, 1, 3, 1]);
  for (const key of ["filterBeginning", "filterEnd"]) assert.deepEqual(strings[key].unlock, { book: bid.book, unit: bid.unit });
  assert.equal(strings.filterBeginning.ar, "البداية");
  assert.equal(strings.filterEnd.ar, "النهاية");
  // six game modes: country / country & capital / capital only, in English and in Arabic
  assert.deepEqual(GEO_MODES.map((m) => m.id), ["en-countries", "en-capitals", "en-capital", "ar-countries", "ar-capitals", "ar-capital"]);

  const opts = filterOptions(words);
  assert.equal(opts.pos.get("verb"), 2);
  assert.equal(opts.form.get(2), 1);
  assert.equal(opts.gender.get("masculine"), 1);

  // on the real vocabulary
  const verbs = filterWords(allWords, { ...none, pos: "verb" });
  assert.ok(verbs.length > 400 && verbs.every((w) => w.pos === "verb"));
  const lesson = filterWords(allWords, { ...none, from: "2.1", to: "2.1" });
  assert.ok(lesson.length > 10 && lesson.every((w) => w.book === 2 && w.unit === 1));
  assert.ok(lesson.some((w) => w.definition === "English"));
  const formII = filterWords(allWords, { ...none, pos: "verb", form: "2" });
  assert.ok(formII.length > 10 && formII.every((w) => w.form === 2));
  const sheShami = filterWords(allWords, { ...none, dialect: "shami" });
  assert.ok(sheShami.length > 500 && sheShami.every((w) => w.shami));
});

test("review edits: references, merged forms, corrected spellings", () => {
  const byId = new Map(allWords.map((w) => [w.id, w]));
  // rows you marked "= WORD" show that word instead of an English gloss
  assert.equal(byId.get("b3-u4-014").definition, "= جريدة");
  assert.equal(byId.get("b4-u2-028").definition, "= معظم");
  const refs = allWords.filter((w) => w.definition.startsWith("="));
  assert.ok(refs.length >= 13);
  for (const w of refs) assert.ok(/[؀-ۿ]/.test(w.definition), w.id);

  // entries folded into others are gone, and the forms sit on the target
  for (const gone of ["b3-u1-035", "b3-u2-047", "b3-u3-039"]) assert.equal(byId.has(gone), false, gone);
  const jadid = byId.get("b1-u4-021");
  assert.equal(jadid.plural, "جُدُد");
  assert.equal(jadid.egyptian.plural, "جُداد");
  assert.deepEqual(jadid.formsFrom, { book: 3, unit: 1 }); // not shown to Alif Baa students
  assert.equal(byId.get("b1-u3-018").plural, "هٰؤُلاء");
  assert.equal(byId.get("b1-u5-011").feminine, "بَيضاء");

  // corrected spellings and chosen roots
  assert.equal(byId.get("b2-u10-002").arabic, "إذا");
  assert.equal(byId.get("b1-u2-006").arabic, "وَعَلَيكُم السَّلام");
  assert.equal(byId.get("b2-u2-002").root, "ء ن س");
  assert.equal(byId.get("b3-u10-059").root, "س ء ل");

  // a verb you gave a present vowel for now generates its own conjugation
  const hasal = byId.get("b2-u6-006");
  assert.equal(hasal.arabic, "حَصَلَ");
  const f = getForms(hasal);
  assert.equal(f.source.present, "generated");
  same(f.present["3ms"], "يَحْصُلُ");
});

test("vocabulary parser: cleaning, verbs, plurals, feminine, prepositions, suffixes", () => {
  assert.equal(cleanText("الـشـَّـرق  الأَوْسَط"), "الشَّرق الأَوْسَط"); // stretch marks inside words go
  assert.equal(cleanText("ـَك- اِسمَك"), "ـَك- اِسمَك"); // a leading one marks a suffix and stays
  assert.equal(cleanText("مِتْجَوِّز/ ة"), "مِتْجَوِّز/ة");

  const v = parseCell("اِنتَقَلَ إلى،يَنتَقِل، الاِنتِقال", { verbLike: true });
  assert.equal(v.past, "اِنتَقَلَ");
  assert.equal(v.present, "يَنتَقِل");
  assert.equal(v.masdar, "الاِنتِقال");
  assert.deepEqual(v.prepositions, ["الى"]);

  assert.equal(parseCell("يخاف من، الخوف", { verbLike: true }).present, "يخاف"); // unvoweled present is still a present

  const p = parseCell("شَرِكة ج. –ات");
  assert.equal(p.head, "شَرِكة");
  assert.deepEqual(p.plural, ["شَرِكات"]);
  assert.deepEqual(parseCell("مُوَظَّف/ة ج. –ون/ين").plural, ["مُوَظَّفون", "مُوَظَّفين"]);
  assert.equal(parseCell("مُوَظَّف/ة ج. –ون/ين").feminine, "مُوَظَّفة");
  assert.deepEqual(parseCell("جَدّ ج. أَجداد").plural, ["أَجداد"]);

  const red = parseCell("أَحمَر(مؤنّث) حَمراءج. حُمْر");
  assert.equal(red.head, "أَحمَر");
  assert.equal(red.feminine, "حَمراء");
  assert.deepEqual(red.plural, ["حُمْر"]);

  const s = parseCell("ـكَ- اِسمُكَ");
  assert.equal(s.head, "ـكَ");
  assert.equal(s.example, "اِسمُكَ");
  assert.equal(parseCell(""), null);
});

test("geography game: questions, timing, data", () => {
  const rng = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (const mode of GEO_MODES) {
    const qs = buildQuestions(mode, geoCountries, rng);
    // capital-only modes skip the places without an agreed capital (Palestine, Israel)
    const expected = mode.only === "capital" ? geoCountries.filter((c) => c.capitalEn).length : geoCountries.length;
    assert.equal(qs.length, expected);
    assert.equal(new Set(qs.map((q) => q.countryId)).size, expected); // one each
    assert.equal(new Set(qs.map((q) => q.text)).size, qs.length); // prompts unambiguous
    const caps = qs.filter((q) => q.kind === "capital");
    assert.equal(caps.length > 0, mode.capitals);
    if (mode.only === "capital") assert.equal(caps.length, qs.length); // every question is a capital
    for (const q of caps) {
      assert.ok(geoCountries.find((c) => c.id === q.countryId).capitalEn); // never a disputed capital
    }
    for (const q of qs) assert.equal(/[؀-ۿ]/.test(q.text), mode.lang === "ar");
  }
  assert.equal(geoCountries.length, 21);
  for (const gone of ["TUR", "IRN"]) assert.ok(!geoCountries.some((c) => c.id === gone));
  for (const want of ["MAR", "MRT", "DZA", "TUN", "LBY", "SDN", "SOM", "ISR"]) {
    assert.ok(geoCountries.some((c) => c.id === want), want);
  }
  // no capital reads the same as any country name, so prompts are never ambiguous
  for (const k of [["nameEn", "capitalEn"], ["nameAr", "capitalAr"]]) {
    const names = new Set(geoCountries.map((c) => c[k[0]]));
    for (const c of geoCountries) if (c[k[1]]) assert.ok(!names.has(c[k[1]]), c[k[1]]);
  }
  assert.equal(TIME_LIMIT_MS, 600_000);
  assert.equal(finalTime(12_000, 3), 27_000);
  assert.equal(formatTime(65_400), "1:05.4");
  assert.equal(formatTime(9_000), "0:09.0");
  // every quiz country has a clickable shape, and exactly ONE (Somalia used to be split in two,
  // which made it highlight as two countries)
  const shapeIds = new Set(mapShapes.filter((s) => s.id).map((s) => s.id));
  for (const c of geoCountries) assert.ok(shapeIds.has(c.id), c.id);
  for (const id of shapeIds) assert.equal(mapShapes.filter((s) => s.id === id).length, 1, `${id} is one shape`);

  // the word "English" is in the list at Al-Kitaab part 1, lesson 1, and "Arabic" is a placeholder
  // that unlocks with it until the Alif Baa lesson is known
  const english = allWords.find((w) => w.definition === "English");
  assert.ok(english && english.book === 2 && english.unit === 1);
  assert.equal(english.arabic, "إِنجِليزِيّ");
  assert.equal(strings.geoEnglish.ar, "إنجليزي");
  assert.equal(strings.geoArabic.ar, "عربي");
  assert.deepEqual(strings.geoArabic.unlock, strings.geoEnglish.unlock);
});

test("geography words unlock at the lessons that teach them", () => {
  const none = vocabSets([], {});
  const ar = (key, book, unit) => isArabic(strings[key], { book, unit }, none);
  const gates = { geoEnglish: [2, 1], geoCountry: [2, 2], geoBest: [2, 5], geoTitle: [2, 6], geoStart: [2, 9], geoCapital: [3, 4], geoStop: [3, 6], book: [2, 1] };
  for (const [key, [b, u]] of Object.entries(gates)) {
    assert.equal(ar(key, b, u), true, `${key} at ${b}/${u}`);
    assert.equal(ar(key, u > 1 ? b : b - 1, u > 1 ? u - 1 : 10), false, `${key} just before`);
  }
  assert.equal(strings.geoStart.ar, "البدء");
  assert.equal(strings.geoStop.ar, "التوقف");
  assert.equal(strings.geoCapital.ar, "عاصمة");
  assert.equal(strings.geoBest.ar, "أحسن");
});

test("status labels turn Arabic where the list teaches the word behind them", () => {
  const at = (pred) => { const w = allWords.find(pred); return { book: w.book, unit: w.unit }; };
  assert.deepEqual(strings.statusNew.unlock, at((w) => w.definition === "new (fem.)")); // جديدة
  assert.deepEqual(strings.statusLearning.unlock, at((w) => w.definition === "to learn")); // تَعَلَّمَ
  assert.deepEqual(strings.statusMastered.unlock, at((w) => w.definition === "I memorize")); // أَحفَظ
  assert.deepEqual(strings.statusNew.unlock, { book: 1, unit: 4 });

  // a student in Al-Kitaab part 2 sees Arabic for all four
  const none = vocabSets([], {});
  const level = { book: 3, unit: 3 };
  for (const key of ["statusNew", "statusLearning", "statusProficient", "statusMastered"]) {
    assert.equal(isArabic(strings[key], level, none), true, key);
  }
  // and the badge is still English before that
  assert.equal(isArabic(strings.statusNew, { book: 1, unit: 3 }, none), false);
});

test("normalizeArabic", () => {
  assert.equal(normalizeArabic("أَكَلَ"), "اكل");
  assert.equal(normalizeArabic("مدرسة"), normalizeArabic("مَدْرَسَه"));
});

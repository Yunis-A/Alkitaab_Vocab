import { test } from "node:test";
import assert from "node:assert/strict";

import { getForms, analyzeVerb } from "./morphology.js";
import { normalizeArabic } from "./arabic.js";
import { buildIndex, search } from "./search.js";
import {
  newCard, review, wordStatus, boxStatus, BOX_INTERVALS, cardKey, DIRECTIONS, RATINGS,
} from "./leitner.js";
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
  same(f.activeParticiple.m, "كَاتِب");
  same(f.activeParticiple.f, "كَاتِبَة");
  same(f.activeParticiple.pm, "كَاتِبُونَ");
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
  same(iii.past["3ms"], "كَاتَبَ");
  same(iii.present["3ms"], "يُكَاتِبُ");

  const iv = getForms(verb("خ ر ج", 4));
  same(iv.past["3ms"], "أَخْرَجَ");
  same(iv.present["3ms"], "يُخْرِجُ");
  same(iv.imperative["2ms"], "أَخْرِجْ");
  same(iv.masdar[0], "إِخْرَاج");

  const v = getForms(verb("ك ل م", 5));
  same(v.past["3ms"], "تَكَلَّمَ");
  same(v.present["3ms"], "يَتَكَلَّمُ");
  same(v.masdar[0], "تَكَلُّم");

  const vi = getForms(verb("ك ت ب", 6));
  same(vi.past["3ms"], "تَكَاتَبَ");
  same(vi.present["3ms"], "يَتَكَاتَبُ");

  const vii = getForms(verb("ك س ر", 7));
  same(vii.past["3ms"], "اِنْكَسَرَ");
  same(vii.present["3ms"], "يَنْكَسِرُ");
  assert.equal(vii.passiveParticiple, null);

  const viii = getForms(verb("ج م ع", 8));
  same(viii.past["3ms"], "اِجْتَمَعَ");
  same(viii.present["3ms"], "يَجْتَمِعُ");
  same(viii.masdar[0], "اِجْتِمَاع");

  const x = getForms(verb("ك ت ب", 10));
  same(x.past["3ms"], "اِسْتَكْتَبَ");
  same(x.present["3ms"], "يَسْتَكْتِبُ");
  same(x.imperative["2ms"], "اِسْتَكْتِبْ");
  same(x.masdar[0], "اِسْتِكْتَاب");
});

test("irregular roots are not generated and are reported missing", () => {
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
  c = review(c, "good", t0);
  assert.equal(c.box, 1);
  assert.equal(c.due, t0 + 3 * MIN);
  c = review(c, "easy", t0);
  assert.equal(c.box, 3);
  c = review(c, "hard", t0); // hard goes all the way back
  assert.equal(c.box, 0);
  assert.equal(c.due, t0 + MIN);
  c = review({ ...c, box: 6 }, "hard", t0);
  assert.equal(c.box, 0);
  assert.equal(c.lapses, 2);
  assert.deepEqual(RATINGS, ["hard", "good", "easy"]);
  assert.throws(() => review(c, "again", t0));

  let k = { ...newCard(t0), box: 7 }; // in the 7-day box
  assert.equal(boxStatus(k.box), "learning");
  k = review(k, "good", t0); // survived it
  assert.equal(k.box, 8);
  assert.equal(boxStatus(k.box), "proficient");
  k = review({ ...k, box: 9 }, "good", t0);
  assert.equal(k.box, 10);
  assert.equal(boxStatus(k.box), "mastered");
  assert.equal(review(k, "easy", t0).box, 10); // capped
});

test("word status comes from the Arabic -> English card only", () => {
  assert.deepEqual(DIRECTIONS, ["ar-en"]);
  assert.equal(cardKey("w"), "w|ar-en");
  assert.equal(wordStatus({}, "w"), "new");
  const at = (box) => ({ [cardKey("w")]: { ...newCard(), box } });
  assert.equal(wordStatus(at(0), "w"), "learning");
  assert.equal(wordStatus(at(8), "w"), "proficient");
  assert.equal(wordStatus(at(10), "w"), "mastered");
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

test("saved progress drops cards from the removed English -> Arabic direction", () => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
  saveProgress({ level: { book: 2, unit: 1 }, cards: { "a|ar-en": { box: 3 }, "a|en-ar": { box: 2 } } });
  assert.deepEqual(Object.keys(loadProgress().cards), ["a|ar-en"]);
  assert.deepEqual(loadProgress().level, { book: 2, unit: 1 });
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

test("sample words carry diacritics and still match undiacritized searches", () => {
  // ماء is normally written with no short-vowel marks at all
  const needsMarks = allWords.filter((w) => w.id !== "b2-u2-004" && !/[ً-ْ]/.test(w.arabic));
  assert.deepEqual(needsMarks.map((w) => w.id), []);
  const idx = buildIndex(allWords);
  assert.ok(search(idx, "كتاب").some((w) => w.id === "b1-u1-001"));
  assert.ok(search(idx, "كِتاب").some((w) => w.id === "b1-u1-001"));
  assert.ok(search(idx, "مرحبا").some((w) => w.id === "b1-u3-001"));
  // generated conjugations of sound verbs are fully voweled
  const f = getForms(allWords.find((w) => w.id === "b2-u1-003"));
  same(f.present["3ms"], "يَكْتُبُ");
  assert.equal(f.source.present, "generated");
  assert.equal(stripDiacritics(f.past["3ms"]), "كتب");
});

test("geography game: questions, timing, data", () => {
  const rng = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (const mode of GEO_MODES) {
    const qs = buildQuestions(mode, geoCountries, rng);
    assert.equal(qs.length, geoCountries.length);
    assert.equal(new Set(qs.map((q) => q.countryId)).size, geoCountries.length); // one each
    assert.equal(new Set(qs.map((q) => q.text)).size, qs.length); // prompts unambiguous
    const caps = qs.filter((q) => q.kind === "capital");
    assert.equal(caps.length > 0, mode.capitals);
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
  // every quiz country has a clickable shape
  const shapeIds = new Set(mapShapes.filter((s) => s.id).map((s) => s.id));
  for (const c of geoCountries) assert.ok(shapeIds.has(c.id), c.id);
});

test("geography words unlock at the lessons that teach them", () => {
  const none = vocabSets([], {});
  const ar = (key, book, unit) => isArabic(strings[key], { book, unit }, none);
  const gates = { geoCountry: [2, 2], geoBest: [2, 5], geoTitle: [2, 6], geoStart: [2, 9], geoCapital: [3, 4], geoStop: [3, 6], book: [2, 1] };
  for (const [key, [b, u]] of Object.entries(gates)) {
    assert.equal(ar(key, b, u), true, `${key} at ${b}/${u}`);
    assert.equal(ar(key, u > 1 ? b : b - 1, u > 1 ? u - 1 : 10), false, `${key} just before`);
  }
  assert.equal(strings.geoStart.ar, "البدء");
  assert.equal(strings.geoStop.ar, "التوقف");
  assert.equal(strings.geoCapital.ar, "عاصمة");
  assert.equal(strings.geoBest.ar, "أحسن");
});

test("normalizeArabic", () => {
  assert.equal(normalizeArabic("أَكَلَ"), "اكل");
  assert.equal(normalizeArabic("مدرسة"), normalizeArabic("مَدْرَسَه"));
});

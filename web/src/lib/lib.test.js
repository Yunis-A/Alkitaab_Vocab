import { readFileSync } from "node:fs";
import { test } from "node:test";
import { startBoxes, pickNext, countBoxes } from "./quickstudy.js";
import { buildRound } from "./matching.js";
import { buildItems } from "./study.js";
import { mergeProgress } from "./sync.js";
import { FORMS, ALL_FORMS, FIELDS, PATTERNS, canon, hasStackedMarks, canAppend, buildTask, isCorrect, isCorrectSet, withArticle, formsAt, fieldsAt, fieldsForAnyForm, answerSpec, answerText, QUAD_FROM } from "./patterns.js";
import { presentChart, presentChartForm } from "./chart.js";
import { allPrepositions, gradePrepositions, prepositionVerbs, prepKey, prepositionLevels } from "./prepositions.js";
import { lessonStyle } from "../config/books.js";
import { COUNTRIES, GAME_COUNTRIES } from "../data/countries.js";
import { withoutArticle, addArticle } from "./article.js";
import { LETTERS } from "../data/letters.js";
import wordsearches from "../../private/wordsearch.json" with { type: "json" };
import { searchId, glossMode, wordCells, lineBetween, wordOnLine } from "./wordsearch.js";
import { isKnown, knownByUnit, tokens as arabicTokens } from "../../scripts/lib/crossword-known.mjs";
import crosswords from "../../private/crosswords.json" with { type: "json" };
import { puzzleId, sameLetter, entryCells, entryAt, emptyTyped, isEntrySolved, isSolved, wrongCells, nextCell, prevCell, isCell } from "./crossword.js";
import { LAYOUT, keyFor, codeFor } from "../data/keyboardLayouts.js";
import { PLURAL_FROM, GENDER_FROM } from "../config/books.js";
import { NAME_AR_FROM } from "../config/books.js";
import { mayBeIrregular, updateOwnWord, emptyCustom, normalizeRoot, missingFields, buildCustomWord, courseMatches, addOwnWord, removeOwnWord, unlockEarly, lockEarly, mergeCustom } from "./customWords.js";
import { MOODS, MOOD_LABELS, MOOD_FROM, learnedMoods, moodCharts } from "./moods.js";
import { TENSES, tensesAt, personFrom, learnedPersons, presentAnswers, conjugationItems, needsForm, isConjugationCorrect, charFor } from "./conjugation.js";
import { HARD_ACCURACY, HARD_CPM, accuracyFor, cpmFor, toWpm, showWpm, bestRecord, LESSONS, LETTER_ORDER, MIN_ACCURACY, isUnlocked, buildText, typableWords, typingResult, betterResult, targetLength, typicalCpm, TARGET_MINUTES } from "./typing.js";
import assert from "node:assert/strict";

import { getForms, analyzeVerb } from "./morphology.js";
import { normalizeArabic } from "./arabic.js";
import { buildIndex, search } from "./search.js";
import {
  newCard, review, wordStatus, boxStatus, BOX_INTERVALS, cardKey, VARIETY_IDS, RATINGS,
} from "./leitner.js";
import { activeVarieties, isWordAvailable, headword, varietyText, parseCardKey, dialectOf, displayArabic } from "./varieties.js";
import { rootKey } from "./arabic.js";
import {
  filterWords, filterOptions, activeFilterCount, parseLevelKey, levelKey, levelsUpTo,
} from "./filters.js";
import { cleanText, parseCell } from "../../scripts/lib/vocab-parse.mjs";
import { unitAfterBookChange, books, IMPERATIVE_LEVEL, levelReached } from "../config/books.js";
import { GEO_MODES, TIME_LIMIT_MS, buildQuestions, finalTime, formatTime } from "./geoquiz.js";
import { geoCountries } from "../data/geography.js";
import { mapShapes } from "../data/menaMap.js";
import allWords from "../../private/words.json" with { type: "json" };
import { stripDiacritics } from "./arabic.js";
import { localizeDigits } from "./numerals.js";
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

test("search order: newest lessons first, or oldest first; relevance still wins when searching", () => {
  const w = (id, book, unit, extra = {}) => ({ id, book, unit, arabic: "كلمة" + id, pos: "noun", definition: "word " + id, transliteration: "", ...extra });
  const words = [w("a", 1, 1), w("b", 1, 2), w("c", 1, 2), w("d", 2, 1), w("e", 3, 4)];
  const idx = buildIndex(words);
  const ids = (q, order) => search(idx, q, {}, order).map((x) => x.id).join("");

  assert.equal(ids("", "oldest"), "abcde");
  assert.equal(ids("", "newest"), "edbca"); // latest lesson first; b before c inside lesson 1/2 as in the list
  assert.equal(ids("", undefined), "abcde"); // default stays curriculum order

  // with a query, every word ties on "word" so the order decides
  assert.equal(ids("word", "newest"), "edbca");
  assert.equal(ids("word", "oldest"), "abcde");
  // an exact match beats a newer lesson
  assert.equal(search(idx, "word a", {}, "newest")[0].id, "a");
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
  const at = (box) => ({ [cardKey("w")]: { ...newCard(), box, reviews: 1 } });
  assert.equal(wordStatus({ [cardKey("w")]: newCard() }, "w"), "new"); // tracked but never reviewed
  assert.equal(wordStatus(at(0), "w"), "learning");
  assert.equal(wordStatus(at(8), "w"), "proficient");
  assert.equal(wordStatus(at(10), "w"), "mastered");

  // with Egyptian on, a word is only as strong as its weakest card
  const both = { ...at(10), [cardKey("w", "egy")]: { ...newCard(), box: 8, reviews: 1 } };
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
    // stretch marks only on suffixes and on the attached prepositions بِـ لِـ (a lone ب or ل is written joined)
    assert.ok(!/[ـ]/.test(w.arabic ?? "") || w.pos === "suffix" || /^[بل][ً-ْ]*ـ$/.test(w.arabic), `${w.id} has a stretch mark`);
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
  // six game modes: countries / capitals / both, in English and in Arabic
  assert.deepEqual(GEO_MODES.map((m) => m.id), ["en-countries", "en-capital", "en-both", "ar-countries", "ar-capital", "ar-both"]);

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

test("titles: /ة for the feminine and the preposition a word needs", () => {
  const L = { book: 4, unit: 10 };
  assert.equal(displayArabic({ arabic: "جاهِز", feminine: "جاهِزة" }, L), "جاهِز/ة");
  assert.equal(displayArabic({ arabic: "دُوَليّ", feminine: "دُوَليّة" }, L), "دُوَليّ/ة"); // shadda is ignored when comparing
  assert.equal(displayArabic({ arabic: "أَحمَر", feminine: "حَمراء" }, L), "أَحمَر/حَمراء"); // irregular: the whole feminine
  assert.equal(displayArabic({ arabic: "مَليء", feminine: "مَليئة", prepositions: ["بِـ"] }, L), "مَليء/ة بِـ"); // hamza seat changes
  assert.equal(displayArabic({ arabic: "بَعيد", feminine: "بَعيدة", prepositions: ["عَن"] }, L), "بَعيد/ة عَن");
  assert.equal(displayArabic({ arabic: "تَعَرَّفَ", prepositions: ["على"] }, L), "تَعَرَّفَ على");
  assert.equal(displayArabic({ arabic: "اِشتاقَ", prepositions: ["إلى", "لِـ"] }, L), "اِشتاقَ إلى / لِـ");
  assert.equal(displayArabic({ arabic: "رَحّالة" }, L), "رَحّالة"); // gender-neutral: nothing added
  assert.equal(displayArabic({ arabic: null }, L), "");
  // a feminine the list only introduces later stays hidden until then
  const white = { arabic: "أَبْيَض", feminine: "بَيضاء", formsFrom: { book: 3, unit: 3 } };
  assert.equal(displayArabic(white, { book: 1, unit: 5 }), "أَبْيَض");
  assert.equal(displayArabic(white, { book: 3, unit: 3 }), "أَبْيَض/بَيضاء");
  // cards show the same title
  assert.equal(varietyText({ arabic: "بَعيد", feminine: "بَعيدة", prepositions: ["عَن"] }, "ar-en", L), "بَعيد/ة عَن");
  assert.equal(headword({ arabic: "جاهِز", feminine: "جاهِزة" }, {}, L), "جاهِز/ة");

  // on the real vocabulary
  const byId = new Map(allWords.map((w) => [w.id, w]));
  assert.equal(displayArabic(byId.get("b1-u8-012"), L), "بَعيد/ة عن"); // far from
  assert.equal(displayArabic(byId.get("b1-u8-011"), L), "قَريب/ة مِن"); // close to
  assert.equal(displayArabic(byId.get("b1-u4-021"), { book: 1, unit: 4 }), "جَديد/ة");
  assert.equal(displayArabic(byId.get("b1-u5-011"), { book: 1, unit: 5 }), "أَبْيَض"); // white's feminine waits for part 2
});

test("house style and cleanup: no fatha before ا, no gender notes where /ة shows it", () => {
  // no Arabic string in any word has a fatha directly before an alef
  assert.deepEqual(allWords.filter((w) => /َا/.test(JSON.stringify(w))).map((w) => w.id), []);
  assert.ok(allWords.some((w) => w.arabic === "تَبادَلَ"));

  // entries that show a feminine carry no masc./fem. note in the English
  for (const w of allWords.filter((x) => x.feminine)) assert.ok(!/\((?:masc|fem|m\.|f\.)/i.test(w.definition), `${w.id} ${w.definition}`);
  // and no combined (masc./fem.) note survives anywhere
  assert.deepEqual(allWords.filter((w) => /\(masc\.\s*\/\s*fem\.\)/i.test(w.definition)).map((w) => w.id), []);
  // a truly gender-neutral word keeps its own note
  assert.equal(allWords.find((w) => w.arabic === "رَحّالة").definition, "traveler, explorer (masc. & fem.)");

  // adjectives: all regular ones now show a feminine; only comparatives, fixed forms and dialect-only rows have none
  const adj = allWords.filter((w) => w.pos === "adjective");
  assert.ok(adj.filter((w) => w.feminine).length > 150);
  const without = adj.filter((w) => !w.feminine && w.arabic);
  assert.ok(without.length <= 12, without.map((w) => w.arabic).join(" "));
});

test("added words: the Arabic language and the Qur'an (Alif Baa 10), part 1 lesson 1 vocabulary", () => {
  const find = (a) => allWords.find((w) => w.arabic === a);
  assert.deepEqual([find("عَرَبِيّ").book, find("عَرَبِيّ").unit], [1, 10]);
  assert.equal(find("عَرَبِيّ").feminine, "عَرَبِيّة");
  assert.deepEqual([find("القُرآن").book, find("القُرآن").unit], [1, 10]);
  assert.equal(find("القُرآن").root, null); // Alif Baa words have no roots
  for (const [ar, def, root] of [
    ["المُفرَدات", "vocabulary", "ف ر د"], ["الفُصحى", "formal Arabic; Standard Arabic", "ف ص ح"],
    ["القَواعِد", "grammar", "ق ع د"], ["الثَّقافة", "culture", "ث ق ف"], ["هَل", "(introduces a yes/no question)", null],
  ]) {
    const w = find(ar);
    assert.ok(w, ar);
    assert.deepEqual([w.book, w.unit, w.definition, w.root], [2, 1, def, root], ar);
  }
  assert.equal(find("هَل").pos, "particle");
  assert.equal(strings.navGrammar, undefined); // there is no Grammar section for now
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
  for (const gone of ["b3-u1-035", "b3-u2-047", "b3-u3-039", "b1-u4-022", "b3-u3-040", "b3-u3-042"]) assert.equal(byId.has(gone), false, gone);
  const jadid = byId.get("b1-u4-021");
  assert.equal(jadid.plural, "جُدُد");
  assert.equal(jadid.feminine, "جَديدة"); // new (masc.) and new (fem.) are one entry now
  assert.equal(jadid.definition, "new");
  assert.equal(jadid.egyptian.plural, "جُداد");
  assert.deepEqual(jadid.pluralFrom, { book: 3, unit: 1 }); // the plural waits for part 2; the feminine shows at once
  assert.equal(jadid.formsFrom, undefined);
  assert.equal(byId.get("b1-u5-013").feminine, "خَضراء"); // green and black joined their Alif Baa words, like white
  assert.equal(byId.get("b1-u5-012").feminine, "سَوداء");
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
    // capital questions skip the places without an agreed capital (Palestine, Israel)
    const withCapital = geoCountries.filter((c) => c.capitalEn).length;
    const caps = qs.filter((q) => q.kind === "capital");
    const names = qs.filter((q) => q.kind === "country");
    assert.equal(caps.length, mode.kind === "country" ? 0 : withCapital);
    assert.equal(names.length, mode.kind === "capital" ? 0 : geoCountries.length);
    assert.equal(qs.length, caps.length + names.length);
    // "both" asks every place by name AND by capital
    if (mode.kind === "both") for (const c of geoCountries) assert.ok(names.some((q) => q.countryId === c.id));
    assert.equal(new Set(qs.map((q) => q.text)).size, qs.length); // prompts unambiguous
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
  // "Arabic" turns Arabic where عَرَبِيّ is taught: Alif Baa lesson 10
  const arabicWord = allWords.find((w) => w.definition === "Arabic");
  assert.ok(arabicWord && arabicWord.book === 1 && arabicWord.unit === 10);
  assert.deepEqual(strings.geoArabic.unlock, { book: 1, unit: 10 });
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
  assert.deepEqual(strings.statusNew.unlock, at((w) => w.definition === "new")); // جَديد/ة
  assert.deepEqual(strings.statusLearning.unlock, at((w) => w.definition === "to learn")); // تَعَلَّمَ
  assert.deepEqual(strings.statusMastered.unlock, at((w) => w.definition === "I memorize")); // أَحفَظ
  assert.deepEqual(strings.statusNew.unlock, { book: 1, unit: 4 });

  // a student in Al-Kitaab part 2 sees Arabic for New, Learning and Mastered. Proficient (متقنة) is not part
  // of the standard curriculum, so it is not on the required list and stays English.
  const none = vocabSets([], {});
  const level = { book: 3, unit: 3 };
  for (const key of ["statusNew", "statusLearning", "statusMastered"]) {
    assert.equal(isArabic(strings[key], level, none), true, key);
  }
  // Proficient is not required vocabulary; it just turns Arabic once part 1 is done
  assert.equal(isArabic(strings.statusProficient, { book: 2, unit: 20 }, none), false);
  assert.equal(isArabic(strings.statusProficient, { book: 3, unit: 1 }, none), true);
  // and the badge is still English before that
  assert.equal(isArabic(strings.statusNew, { book: 1, unit: 3 }, none), false);
});

test("normalizeArabic", () => {
  assert.equal(normalizeArabic("أَكَلَ"), "اكل");
  assert.equal(normalizeArabic("مدرسة"), normalizeArabic("مَدْرَسَه"));
});

test("quick study draws from hard, then medium, then finishes (easy only on request)", () => {
  const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };
  const boxes = { a: "hard", b: "medium", c: "easy" };
  assert.equal(pickNext(boxes, { rng: () => 0 }).id, "a");
  assert.equal(pickNext({ ...boxes, a: "easy" }, { rng: () => 0 }).id, "b");
  const allEasy = { a: "easy", b: "easy" };
  assert.deepEqual(pickNext(allEasy), { id: null, from: "done" });
  assert.equal(pickNext(allEasy, { keepGoing: true, rng: () => 0 }).from, "easy");
  assert.equal(pickNext({}), null);
  // not the same word twice in a row unless it is the only one
  assert.equal(pickNext({ a: "hard", b: "hard" }, { last: "a", rng: seq([0]) }).id, "b");
  assert.equal(pickNext({ a: "hard", b: "easy" }, { last: "a" }).id, "a");
  assert.deepEqual(countBoxes(startBoxes(["x", "y"])), { hard: 2, medium: 0, easy: 0 });
});

test("matching rounds have matching sides and no ambiguous pairs", () => {
  const items = [
    { id: "1", arabic: "أ", english: "one" }, { id: "2", arabic: "ب", english: "two" },
    { id: "3", arabic: "ج", english: "one" }, { id: "4", arabic: "ب", english: "four" },
    { id: "5", arabic: "هـ", english: "five" }, { id: "6", arabic: "", english: "six" },
  ];
  const r = buildRound(items, 6);
  assert.deepEqual(r.english.map((i) => i.id).sort(), r.arabic.map((i) => i.id).sort());
  assert.equal(new Set(r.english.map((i) => i.english)).size, r.english.length);
  assert.equal(new Set(r.arabic.map((i) => i.arabic)).size, r.arabic.length);
  assert.ok(r.english.every((i) => i.arabic && i.english));
  assert.equal(buildRound(items, 2).english.length, 2);
});

test("study items: units, lists and varieties; dialects are separate cards", () => {
  const w = (id, unit, part, extra = {}) => ({ id, book: 3, unit, part, arabic: "ك", ...extra });
  const words = [
    w("a", 1, 1, { egyptian: { arabic: "كك" } }), w("b", 1, 2), w("c", 2, null), w("d", 1, 1, { arabic: null, shami: { arabic: "شش" } }),
  ];
  const opts = (o) => ({ units: new Set(["3.1"]), lists: new Set([1, 2]), varieties: new Set(["ar-en"]), ...o });
  const ids = (dialects, o) => buildItems(words, dialects, opts(o)).map((i) => i.id).join();
  assert.equal(ids({}, {}), "a|ar-en,b|ar-en");
  assert.equal(ids({}, { lists: new Set([2]) }), "b|ar-en");
  assert.equal(ids({ egyptian: true }, { varieties: new Set(["ar-en", "egy"]) }), "a|ar-en,a|egy,b|ar-en");
  assert.equal(ids({ egyptian: true }, { varieties: new Set(["egy"]) }), "a|egy");
  assert.equal(ids({ shami: true }, { varieties: new Set(["shm"]) }), "d|shm");
  assert.equal(ids({}, { units: new Set(["3.2"]), lists: new Set([1]) }), "c|ar-en"); // no list: always kept
});

test("Shami (part 1 lesson 1) and Language (part 1 lesson 2) turn Arabic where they are taught", () => {
  const shami = allWords.find((w) => w.definition.startsWith("Shami"));
  assert.equal(shami.arabic, "شامِيّ");
  assert.deepEqual(strings.dialectShami.unlock, { book: shami.book, unit: shami.unit });
  const lugha = allWords.find((w) => w.definition === "language");
  assert.deepEqual(strings.dialectsTitle.unlock, { book: lugha.book, unit: lugha.unit });
  assert.deepEqual(strings.studyVarieties.unlock, { book: lugha.book, unit: lugha.unit });
});

test("roots never use hamza seats; gender section words; 100 countries", () => {
  assert.deepEqual(allWords.filter((w) => /[أإؤئ]/.test(w.root ?? "")).map((w) => w.id), []);
  assert.equal(allWords.find((w) => w.definition.startsWith("Shami")).root, "ش ء م");
  const mq = (d) => allWords.find((w) => w.definition === d);
  assert.equal(mq("masculine").arabic, "مُذَكَّر");
  assert.equal(mq("feminine").arabic, "مُؤَنَّث");
  for (const d of ["masculine", "feminine"]) {
    assert.deepEqual(strings[d].unlock, { book: mq(d).book, unit: mq(d).unit });
    assert.deepEqual(strings[d].unlock, { book: 2, unit: 1 });
  }
  assert.deepEqual(strings.dialectEgyptian.unlock, { book: 2, unit: 1 }); // مِصرِيّ
  assert.equal(COUNTRIES.length, 100);
  assert.equal(new Set(COUNTRIES.map((c) => c.ar)).size, 100);
  assert.equal(new Set(COUNTRIES.map((c) => c.en)).size, 100);
  assert.ok(COUNTRIES.every((c) => ["masculine", "feminine"].includes(c.gender)));
  const masc = COUNTRIES.filter((c) => c.gender === "masculine").map((c) => c.en);
  for (const en of ["Lebanon", "Iraq", "Jordan", "Sudan", "Morocco"]) assert.ok(masc.includes(en), en);
  assert.equal(COUNTRIES.find((c) => c.en === "Egypt").gender, "feminine");
  assert.ok(COUNTRIES.every((c) => !/َا/.test(c.ar))); // house style: no fatha before alif
});

test("signing in merges this browser's progress into the account's", () => {
  const card = (box, reviews, lastReviewed = 1) => ({ box, due: 0, reviews, lapses: 0, lastReviewed });
  const local = {
    level: { book: 1, unit: 3 }, dialects: { egyptian: true, shami: false },
    cards: { "a|ar-en": card(5, 9), "b|ar-en": card(1, 1) }, geoBest: { m1: 50000, m2: 90000 },
  };
  const remote = {
    level: { book: 2, unit: 1 }, dialects: { egyptian: false, shami: true },
    cards: { "a|ar-en": card(2, 3), "c|ar-en": card(4, 6) }, geoBest: { m1: 70000 },
  };
  const m = mergeProgress(local, remote);
  assert.deepEqual(m.level, { book: 2, unit: 1 }); // the account's settings win
  assert.deepEqual(m.dialects, { egyptian: false, shami: true });
  assert.equal(m.cards["a|ar-en"].box, 5); // the more-studied copy wins
  assert.deepEqual(Object.keys(m.cards).sort(), ["a|ar-en", "b|ar-en", "c|ar-en"]);
  assert.deepEqual(m.geoBest, { m1: 50000, m2: 90000 }); // the faster time wins
  assert.equal(mergeProgress(local, null), local);
  assert.equal(mergeProgress({ ...local, level: null }, { ...remote, level: null }).level, null);
});

test("lessons are written by the lesson: Arabic digits from Alif Baa 4, درس from Alif Baa 5, always in Al-Kitaab", () => {
  assert.deepEqual(lessonStyle(1, 3), { digits: false, word: false });
  assert.deepEqual(lessonStyle(1, 4), { digits: true, word: false });
  assert.deepEqual(lessonStyle(1, 5), { digits: true, word: true });
  for (const b of [2, 3, 4]) assert.deepEqual(lessonStyle(b, 1), { digits: true, word: true });
});

test("account heading turns Arabic where حِساب (account) is taught", () => {
  const hisab = allWords.find((w) => w.definition.startsWith("account, bill"));
  assert.deepEqual(strings.accountTitle.unlock, { book: hisab.book, unit: hisab.unit });
  assert.equal(strings.accountTitle.ar, "الحساب");
  assert.deepEqual(strings.dialectsHelp.unlock, { book: 3, unit: 8 }); // no longer stuck on English
});

test("verb patterns on ف ع ل agree with the morphology generator and are checked strictly where it matters", () => {
  const noCase = (x) => x?.replace(/ُ$/, ""); // the trainer writes the present without its case ending
  for (const f of FORMS.filter((x) => x !== 9)) { // the generator has no form IX
    const g = getForms({ pos: "verb", root: "ف ع ل", form: f, arabic: "x", presentVowel: "a" });
    const same = (field, val) => !val || !PATTERNS[f][field] || PATTERNS[f][field].some((v) => canon(v) === canon(val));
    assert.ok(same("past", g.past["3ms"]), `${f} past`);
    assert.ok(same("present", noCase(g.present["3ms"])), `${f} present`);
    assert.ok(same("imperative", g.imperative["2ms"]), `${f} imperative`);
    assert.ok(same("masdar", g.masdar?.[0] && withArticle(g.masdar[0])), `${f} masdar`);
    assert.ok(same("activeParticiple", g.activeParticiple?.m), `${f} active participle`);
    assert.ok(same("passiveParticiple", g.passiveParticiple?.m), `${f} passive participle`);
  }
  // the verbal noun always carries ال, with the shadda on a sun letter
  assert.equal(canon(PATTERNS[2].masdar[0]), canon("التَّفعيل"));
  assert.equal(PATTERNS[4].masdar[0], "الإِفعال");
  assert.equal(PATTERNS[7].masdar[0], "الاِنفِعال");
  assert.equal(isCorrect(2, "masdar", "تَفعيل"), true); // ال is the default, but an answer without it is accepted
  assert.equal(isCorrect(2, "masdar", "التَفعيل"), true); // the shadda after ال is optional
  assert.equal(isCorrect(2, "past", "التَفعيل"), false);
  assert.equal(isCorrect(4, "masdar", "الإفعال"), true); // the hamza under the alif already says kasra
  assert.equal(isCorrect(4, "masdar", "إِفعال"), true);
  assert.equal(isCorrect(4, "masdar", "الأفعال"), false);
  // ا, أ and إ are different letters
  assert.equal(isCorrect(4, "masdar", "الاِفعال"), false);
  assert.equal(isCorrect(4, "masdar", "الإِفعال"), true);
  assert.equal(isCorrect(7, "masdar", "الإِنفِعال"), false);
  assert.equal(isCorrect(4, "past", "اَفعَلَ"), false);
  // typing: sukun and fatha before alif do not matter; the vowels on the letters do
  assert.equal(isCorrect(3, "past", "فَاعَلَ"), true);
  assert.equal(isCorrect(2, "past", "فَعَلَ"), false);
  assert.equal(isCorrect(2, "past", ""), false);
  // present: no case ending expected, a typed one is forgiven
  assert.equal(isCorrect(2, "present", "يُفَعِّل"), true);
  assert.equal(isCorrect(2, "present", "يُفَعِّلُ"), true);
  assert.equal(isCorrect(1, "present", "يَفعِلُ"), true);
  assert.equal(isCorrect(1, "imperative", "اُفعُل"), true); // the final damma of اُفعُل is part of the stem
  assert.equal(isCorrect(5, "form", 5), true);
  // form I: three boxes, any order, all three, each once
  assert.equal(isCorrectSet(1, "past", ["فَعُلَ", "فَعَلَ", "فَعِلَ"]), true);
  assert.equal(isCorrectSet(1, "past", ["فَعَلَ", "فَعَلَ", "فَعِلَ"]), false);
  assert.equal(isCorrectSet(1, "present", ["يَفعُل", "يَفعَلُ", "يَفعِل"]), true);
  assert.equal(isCorrectSet(1, "present", ["يَفعُل", "يَفعَل", ""]), false);
  assert.equal(isCorrectSet(2, "past", ["فَعَّلَ"]), true);
  // a clue always identifies one form at the level it is asked
  const rng = (() => { let x = 11; return () => (x = (x * 16807) % 2147483647) / 2147483647; })();
  const TOP = { book: 4, unit: 99 };
  for (const level of [{ book: 2, unit: 4 }, { book: 2, unit: 8 }, { book: 3, unit: 5 }, { book: 3, unit: 8 }, TOP]) {
    for (let i = 0; i < 150; i++) {
      const t = buildTask(level, rng);
      assert.ok(formsAt(level).includes(t.form));
      assert.ok(!t.targets.includes(t.clue.field));
      assert.deepEqual([...t.targets, t.clue.field].filter((f) => f !== "form").sort(), [...fieldsAt(t.form, level)].sort());
      if (t.clue.field !== "form") {
        const sharing = formsAt(level).filter((f) => fieldsAt(f, level).includes(t.clue.field) && PATTERNS[f][t.clue.field].some((v) => canon(v) === canon(t.clue.value)));
        assert.deepEqual(sharing, [t.form]);
      }
    }
  }
  // form VII: no passive, passive participle or noun of place; form IX: also no imperative
  for (const f of [7, 9]) for (const field of ["passivePast", "passivePresent", "passiveParticiple", "makaan"]) assert.equal(PATTERNS[f][field] ?? null, null, `${f} ${field}`);
  assert.equal(PATTERNS[9].imperative, null);
  assert.deepEqual([PATTERNS[9].past[0], PATTERNS[9].present[0], PATTERNS[9].masdar[0], PATTERNS[9].activeParticiple[0]], ["اِفعَلَّ", "يَفعَلّ", "الاِفعِلال", "مُفعَلّ"]);
  for (let i = 0; i < 100; i++) {
    for (const [form, none] of [[9, ["imperative", "passivePast", "passivePresent", "passiveParticiple", "makaan"]], [7, ["passivePast", "passivePresent", "passiveParticiple", "makaan"]]]) {
      assert.ok(!buildTask(TOP, rng, [form]).targets.some((f) => none.includes(f)));
    }
  }
  // the noun of place is a separate answer only for form I (مَفعَل / مَفعِل, unlike the passive participle مَفعول)
  assert.deepEqual(FORMS.filter((f) => PATTERNS[f].makaan), [1]);
  assert.equal(isCorrect(1, "makaan", "مَفعِل"), true);
  assert.equal(isCorrect(1, "makaan", "مَفعول"), false);
  // four-letter roots: the same exercise on ف ع ل ل
  assert.equal(PATTERNS.Q1.past[0], "فَعلَلَ");
  assert.equal(isCorrect("Q1", "form", "Q1"), true);
  assert.equal(isCorrect("Q1", "past", "فَعلَلَ"), true);
  assert.equal(isCorrect("Q1", "present", "يُفَعلِلُ"), true);
  assert.equal(isCorrect("Q1", "passivePast", "فُعلِلَ"), true);
  assert.deepEqual(ALL_FORMS.filter((f) => typeof f === "string"), ["Q1"]); // only the first four-letter form is kept
  assert.equal(PATTERNS.Q2, undefined);
});

test("verb patterns: boxes follow the form; form III has two verbal nouns from part 3 lesson 1", () => {
  const L = (book, unit) => ({ book, unit });
  assert.deepEqual([answerSpec(1, "past").boxes, answerSpec(1, "present").boxes, answerSpec(1, "imperative").boxes, answerSpec(2, "past").boxes], [3, 3, 1, 1]);
  // form III verbal noun: only المُفاعَلة before part 3 lesson 1, then two boxes (it and الفِعال, in any order)
  assert.equal(answerSpec(3, "masdar", L(3, 13)).boxes, 1);
  assert.equal(isCorrect(3, "masdar", "المُفاعَلة", L(3, 13)), true);
  assert.equal(isCorrect(3, "masdar", "الفِعال", L(3, 13)), false);
  assert.equal(answerSpec(3, "masdar", L(4, 1)).boxes, 2);
  assert.equal(isCorrectSet(3, "masdar", ["الفِعال", "المُفاعَلة"], L(4, 1)), true);
  assert.equal(isCorrectSet(3, "masdar", ["فِعال", "مُفاعَلة"], L(4, 1)), true); // ال optional
  assert.equal(isCorrectSet(3, "masdar", ["المُفاعَلة", ""], L(4, 1)), false);
  assert.equal(isCorrectSet(3, "masdar", ["المُفاعَلة"], L(3, 13)), true);
  // form I asks no verbal noun: picking form I on screen leaves nothing to answer for it
  assert.ok(!fieldsAt(1, L(3, 8)).includes("masdar") && fieldsAt(2, L(3, 8)).includes("masdar"));
  assert.ok(fieldsForAnyForm(L(3, 8)).includes("masdar") && fieldsForAnyForm(L(3, 8)).includes("makaan"));
  assert.deepEqual(fieldsForAnyForm(L(2, 4)), ["past", "present"]);
  // the labels for these words turn Arabic in the lessons the exercise asks for them
  const u = (key) => strings[key].unlock;
  assert.deepEqual([u("present"), u("masdar"), u("makaan"), u("activeParticiple"), u("passiveParticiple"), u("passivePast"), u("passivePresent")],
    [L(2, 4), L(2, 6), L(3, 1), L(3, 5), L(3, 8), L(3, 7), L(3, 10)]);
});

test("verb patterns are asked only when the lesson has been reached", () => {
  const L = (book, unit) => ({ book, unit });
  const f = (form, level) => fieldsAt(form, level);
  assert.deepEqual(formsAt(L(2, 3)), []); // nothing before part 1 lesson 4
  assert.deepEqual(formsAt(L(2, 4)), [1, 2, 3, 5]);
  assert.deepEqual(f(1, L(2, 4)), ["past", "present"]);
  assert.deepEqual(f(2, L(2, 5)), ["past", "present"]); // the verbal noun waits for lesson 6
  assert.deepEqual(f(2, L(2, 6)), ["past", "present", "masdar"]);
  assert.deepEqual(f(1, L(3, 8)), ["past", "present", "activeParticiple", "passiveParticiple", "makaan", "passivePast"]); // form I never asks the verbal noun
  assert.deepEqual(formsAt(L(2, 8)), [1, 2, 3, 4, 5, 8]);
  assert.deepEqual(f(4, L(2, 8)), ["past", "present", "masdar"]); // part 1 lesson 8: past, present and masdar of forms 1-5 and 8
  assert.deepEqual(formsAt(L(2, 9)), [1, 2, 3, 4, 5, 8, 10]);
  assert.deepEqual(formsAt(L(2, 10)), [1, 2, 3, 4, 5, 8, 10]);
  assert.deepEqual(formsAt(L(2, 11)), [1, 2, 3, 4, 5, 6, 7, 8, 10]);
  assert.ok(!formsAt(L(3, 2)).includes(9));
  assert.ok(formsAt(L(3, 3)).includes(9)); // form IX at part 2 lesson 3
  assert.ok(!f(3, L(3, 4)).includes("activeParticiple"));
  assert.ok(f(3, L(3, 5)).includes("activeParticiple")); // part 2 lesson 5
  assert.ok(!f(1, L(3, 7)).includes("passiveParticiple"));
  assert.ok(f(1, L(3, 8)).includes("passiveParticiple") && f(3, L(3, 8)).includes("passiveParticiple")); // part 2 lesson 8
  assert.ok(!f(1, L(3, 0)).includes("makaan") && f(1, L(3, 1)).includes("makaan")); // noun of place: part 2 lesson 1, form I only
  assert.ok(!f(2, L(3, 8)).includes("makaan"));
  // the passive past of forms I and II (and four-letter I) comes at part 2 lesson 7 on its own; the passive
  // present of every form and the passive past of the rest come at lesson 10
  for (const form of [1, 2, "Q1"]) {
    assert.ok(!f(form, L(3, 6)).includes("passivePast") && f(form, L(3, 7)).includes("passivePast"), `${form} passive past`);
    assert.ok(!f(form, L(3, 9)).includes("passivePresent") && f(form, L(3, 10)).includes("passivePresent"), `${form} passive present`);
  }
  for (const form of [3, 4, 5, 6, 8, 10]) {
    assert.ok(!f(form, L(3, 9)).some((x) => x.startsWith("passiveP") && x !== "passiveParticiple"), `${form} early`);
    assert.ok(f(form, L(3, 10)).includes("passivePast") && f(form, L(3, 10)).includes("passivePresent"), `${form} at lesson 10`);
  }
  assert.ok(!f(7, L(4, 10)).includes("passivePast") && !f(9, L(4, 10)).includes("passivePast")); // VII and IX have none
  assert.ok(f("Q1", L(3, 7)).includes("passivePast"));
  // the imperative: part 3 lesson 3
  assert.ok(!f(1, L(4, 2)).includes("imperative") && f(1, L(4, 3)).includes("imperative"));
  assert.ok(!f(9, L(4, 10)).includes("imperative"));
  // four-letter roots arrive at part 2 lesson 7
  assert.deepEqual(QUAD_FROM, { book: 3, unit: 7 });
  assert.ok(!formsAt(L(QUAD_FROM.book, QUAD_FROM.unit - 1)).includes("Q1") && formsAt(QUAD_FROM).includes("Q1"));
});

test("present chart: no case endings; both endings where the form can lose its noon", () => {
  assert.equal(presentChartForm("1s", "أُحِبُّ"), "أُحِبّ"); // damma then shadda
  assert.equal(presentChartForm("1s", "أُحِبَُّ"), "أُحِبَّ"); // shadda then damma
  assert.equal(presentChartForm("3ms", "يَفْعَلُ"), "يَفْعَل");
  assert.equal(presentChartForm("1p", "نَفْعَلُ"), "نَفْعَل");
  assert.equal(presentChartForm("2fs", "تَفْعَلِينَ"), "تَفْعَلِينَ/ي");
  assert.equal(presentChartForm("2mp", "تَفْعَلُونَ"), "تَفْعَلُونَ/وا");
  assert.equal(presentChartForm("3mp", "يَفْعَلُونَ"), "يَفْعَلُونَ/وا");
  assert.equal(presentChartForm("2d", "تَفْعَلانِ"), "تَفْعَلانِ/ا");
  assert.equal(presentChartForm("3fd", "تَفْعَلانِ"), "تَفْعَلانِ/ا");
  assert.equal(presentChartForm("3fp", "يَفْعَلْنَ"), "يَفْعَلْنَ"); // fp keeps its noon in every mood
  assert.equal(presentChartForm("3fp", "يَدْعُونَ"), "يَدْعُونَ"); // ...even when it looks like the plural
  assert.equal(presentChartForm("3ms", "يَدعو"), "يَدعو"); // nothing to drop after a long vowel
  assert.equal(presentChartForm("2ms", null), null);
  // every irregular chart: no person ends in a damma any more
  for (const w of allWords) {
    if (!w.conjugations?.present) continue;
    for (const [p, f] of Object.entries(presentChart(w.conjugations.present))) assert.ok(!f.endsWith("ُ"), `${w.id} ${p}`);
  }
});

test("preposition trainer: stored prepositions, grading", () => {
  const verbs = prepositionVerbs(allWords);
  assert.ok(verbs.length > 100 && verbs.every((w) => w.pos === "verb" && w.prepositions.length));
  const all = allPrepositions(allWords.filter((w) => w.pos === "verb"));
  assert.deepEqual(all.map((p) => p.key).sort(), ["إلى", "ب", "عن", "على", "في", "مع", "من", "ل"].sort());
  assert.equal(prepKey("بِـ"), "ب");
  const w = { prepositions: ["بِـ", "مع"] };
  assert.equal(gradePrepositions(new Set(["ب", "مع"]), w).perfect, true);
  const g = gradePrepositions(new Set(["ب", "في"]), w);
  assert.deepEqual([g.right, g.wrong, g.missed, g.perfect], [["ب"], ["في"], ["مع"], false]);
});

test("two short vowels on one letter are never accepted or typed", () => {
  const F = "َ", D = "ُ", K = "ِ", SH = "ّ";
  assert.equal(hasStackedMarks("فَعَلَ"), false);
  assert.equal(hasStackedMarks(`فَ${F}ا`), true); // two fathas on one letter
  assert.equal(hasStackedMarks(`فَ${K}عَلَ`), true); // fatha and kasra
  assert.equal(hasStackedMarks(`فَعَّلَ`), false); // shadda with one vowel is fine
  assert.equal(hasStackedMarks(`فَ${SH}${F}عَل`), true); // fatha, shadda, fatha
  assert.equal(hasStackedMarks(`ف${SH}${SH}`), true);
  // they are not accepted as answers, however the rest looks (a fatha before alif is normally forgiven)
  assert.equal(isCorrect(3, "past", "فَاعَلَ"), true);
  assert.equal(isCorrect(3, "past", `ف${F}${F}اعَلَ`), false);
  assert.equal(isCorrect(3, "past", `فَاعَلَ${F}`), false);
  assert.equal(isCorrectSet(1, "past", ["فَعَلَ", "فَعِلَ", `فَعُلَ${F}`]), false);
  // the keyboard will not add them
  assert.equal(canAppend("ف", F), true);
  assert.equal(canAppend(`ف${F}`, D), false);
  assert.equal(canAppend(`ف${F}`, F), false);
  assert.equal(canAppend(`ف${F}`, SH), true);
  assert.equal(canAppend(`ف${SH}`, F), true);
  assert.equal(canAppend(`ف${SH}${F}`, K), false);
  assert.equal(canAppend(`ف${F}ع`, K), true); // a new letter starts fresh
  assert.equal(canAppend("", "ع"), true);
});

test("the learn cards' Arabic descriptions use words from the list and turn Arabic where those are learned", () => {
  const L = (book, unit) => ({ book, unit });
  const at = (arabic) => allWords.filter((w) => w.arabic && w.arabic.replace(/[ً-ْـ]/g, "") === arabic).map((w) => L(w.book, w.unit)).sort((a, b) => a.book - b.book || a.unit - b.unit)[0];
  const last = (...words) => words.map(at).reduce((m, l) => (l.book - m.book || l.unit - m.unit) > 0 ? l : m);
  for (const w of ["هل", "أتذكر", "كلمة", "أدرس", "جديد", "عربي", "إنجليزي", "في", "أو", "من", "فعل", "بلد", "عاصمة", "مذكر", "مؤنث"]) assert.ok(at(w), `${w} is in the list`);
  assert.deepEqual(strings.modeReviewDesc.unlock, last("هل", "أتذكر", "كلمة"));
  assert.deepEqual(strings.modeQuickDesc.unlock, last("تعلم", "كلمة", "جديد")); // تعلم: part 2 lesson 2
  assert.deepEqual(strings.modeMatchingDesc.unlock, { book: 3, unit: 4 }); // مع (a verb's preposition, part 2 lesson 4)
  assert.deepEqual(last("كلمة", "عربي", "إنجليزي"), { book: 2, unit: 1 });
  assert.deepEqual(strings.modePatternsDesc.unlock, last("كلمة", "من", "فعل"));
  assert.deepEqual(strings.modeGenderDesc.unlock, last("بلد", "مذكر", "مؤنث"));
  assert.deepEqual(strings.modeGeoDesc.unlock, last("بلد", "عاصمة"));
});

test("geography games: the countries, which take ال, and prepositions usable in descriptions", () => {
  const names = GAME_COUNTRIES.map((c) => c.en);
  // the 16 well-known countries, America, then every place of the map game
  assert.deepEqual(names.slice(0, 16), [
    "the United States", "China", "France", "Spain", "Britain", "Turkey", "Iran", "Russia", "Japan", "Italy",
    "Canada", "Mexico", "Germany", "India", "Pakistan", "South Korea",
  ]);
  assert.equal(names[16], "America");
  assert.equal(GAME_COUNTRIES.length, 16 + 1 + geoCountries.length);
  assert.equal(new Set(names).size, names.length);
  assert.ok(GAME_COUNTRIES.every((c) => c && c.ar && ["masculine", "feminine"].includes(c.gender)));
  for (const g of geoCountries) assert.ok(GAME_COUNTRIES.some((c) => c.en === g.nameEn || c.en === `the ${g.nameEn}`), g.nameEn);
  // the masculine ones among them: Lebanon, Iraq, Jordan, Sudan, Morocco, Yemen
  assert.deepEqual(GAME_COUNTRIES.filter((c) => c.gender === "masculine").map((c) => c.en).sort(), ["Iraq", "Jordan", "Lebanon", "Morocco", "Sudan", "Yemen"]);
  const withArticleNames = GAME_COUNTRIES.filter((c) => c.hasArticle).map((c) => c.en);
  for (const en of ["the United States", "China", "Japan", "Mexico", "India", "Iraq", "Saudi Arabia", "Yemen"]) assert.ok(withArticleNames.includes(en), en);
  for (const en of ["France", "Spain", "America", "Egypt", "Syria", "Lebanon", "Qatar"]) assert.ok(!withArticleNames.includes(en), en);
  // the name is shown without ال and can be given it back
  assert.equal(canon(withoutArticle("الصِّين")), canon("صِين")); // the shadda goes with ال
  assert.equal(withoutArticle("الأُردُن"), "أُردُن");
  assert.equal(withoutArticle("الوِلايات المُتَّحِدة"), "وِلايات المُتَّحِدة");
  assert.equal(withoutArticle("فَرَنسا"), "فَرَنسا");
  for (const c of GAME_COUNTRIES.filter((x) => x.hasArticle)) assert.equal(canon(addArticle(withoutArticle(c.ar))), canon(c.ar), c.en);
  assert.ok(!GAME_COUNTRIES.some((c) => !c.hasArticle && c.ar.startsWith("ال")));
  // prepositions may be used in Arabic text from where they are introduced for a verb (not added to the list)
  const lv = prepositionLevels(allWords);
  assert.deepEqual([lv.get("عن"), lv.get("إلى"), lv.get("على"), lv.get("مع"), lv.get("في")], [
    { book: 2, unit: 2 }, { book: 2, unit: 4 }, { book: 2, unit: 6 }, { book: 3, unit: 4 }, { book: 1, unit: 1 },
  ]);
  const later = (...ls) => ls.reduce((m, l) => (l.book - m.book || l.unit - m.unit) > 0 ? l : m);
  assert.deepEqual(strings.modePrepositionsDesc.unlock, later(lv.get("في"), lv.get("على"), lv.get("مع"), { book: 3, unit: 4 })); // في أو على مع فعل
  assert.deepEqual(strings.articleWith.unlock, lv.get("مع"));
  const bidun = allWords.find((w) => w.definition === "without");
  assert.deepEqual(strings.articleWithout.unlock, { book: bidun.book, unit: bidun.unit });
  assert.ok(!allWords.some((w) => ["على", "عن", "إلى"].includes((w.arabic ?? "").replace(/[ً-ْ]/g, "")))); // not added to the list
});

test("sun and moon letters: 28 letters (ء instead of ا), 14 of each; the game opens with شمس and قمر at Alif Baa 9", () => {
  assert.equal(LETTERS.length, 28);
  assert.equal(new Set(LETTERS.map((l) => l.letter)).size, 28);
  assert.ok(!LETTERS.some((l) => l.letter === "ا") && LETTERS.some((l) => l.letter === "ء" && !l.sun));
  assert.deepEqual(LETTERS.filter((l) => l.sun).map((l) => l.letter).sort(), [..."تثدذرزسشصضطظلن"].sort());
  assert.deepEqual(LETTERS.filter((l) => !l.sun).map((l) => l.letter).sort(), [..."ءبجحخعغفقكمهوي"].sort());
  const sun = allWords.find((w) => w.definition === "sun");
  const moon = allWords.find((w) => w.definition === "moon");
  assert.deepEqual([sun.arabic, sun.book, sun.unit, moon.arabic, moon.book, moon.unit], ["شَمس", 1, 9, "قَمَر", 1, 9]);
  for (const key of ["modeSunMoonDesc", "sunLetter", "moonLetter"]) assert.deepEqual(strings[key].unlock, { book: 1, unit: 9 }, key);
  assert.equal(strings.studySunMoon.en, "Sun letters and moon letters"); // the card title; its Arabic needs words the list does not have yet
});

test("typing lessons: the Arabic 101 key map, two letters per lesson, review lessons, strict order", () => {
  const pc = LAYOUT;
  const at = (code) => pc.rows.flat().find((k) => k.code === code)?.ch;
  assert.deepEqual(["KeyQ", "KeyA", "KeyZ", "KeyH", "KeyB", "Backquote", "Quote", "Semicolon", "Comma"].map(at), ["ض", "ش", "ئ", "ا", "لا", "ذ", "ط", "ك", "و"]);
  assert.equal(codeFor(pc, "ض"), "KeyQ");
  assert.equal(codeFor(pc, " "), "Space");
  // every taught letter has exactly one key, and every letter key is taught once
  const letterKeys = pc.rows.flat().filter((k) => k.ch).map((k) => k.ch).sort();
  const shifted = pc.rows.flat().filter((k) => k.sh).map((k) => k.sh);
  assert.deepEqual(shifted.filter((x) => !/[ً-ْ]/.test(x)).sort(), ["أ", "آ", "إ"].sort());
  // the vowel marks are on Shift: fatha Q, damma E, kasra A, sukun X, shadda `
  assert.deepEqual(["KeyQ", "KeyE", "KeyA", "KeyX", "Backquote"].map((c) => pc.rows.flat().find((k) => k.code === c).sh), ["َ", "ُ", "ِ", "ْ", "ّ"]);
  assert.deepEqual([...LETTER_ORDER].sort(), [...letterKeys, "أ", "إ"].sort()); // the hamza seats أ إ are taught; آ is not
  assert.equal(new Set(letterKeys).size, 34);
  assert.deepEqual([keyFor(pc, "أ"), keyFor(pc, "إ"), keyFor(pc, "ا"), keyFor(pc, "ض")], [
    { code: "KeyH", shift: true }, { code: "KeyY", shift: true }, { code: "KeyH", shift: false }, { code: "KeyQ", shift: false },
  ]);
  for (const l of LETTER_ORDER) assert.ok(codeFor(pc, l), l);
  // by position: the home-row letters come first, then the top row, then the bottom row
  const rowOf = (l) => pc.rows.findIndex((row) => row.some((k) => k.ch === l));
  assert.deepEqual(LETTER_ORDER.slice(0, 10).map(rowOf), Array(10).fill(2));
  // lessons: two new letters each (the last has the lam-alef key), a review after every three
  const news = LESSONS.filter((l) => l.kind === "new");
  assert.equal(news.length, 18);
  assert.ok(news.every((l) => l.letters.length === 2));
  assert.deepEqual(news[0].letters, ["ب", "ت"]);
  assert.deepEqual(LESSONS.slice(0, 5).map((l) => l.id), ["n1", "n2", "n3", "r1", "n4"]);
  assert.equal(LESSONS.at(-1).kind, "review");
  assert.deepEqual(LESSONS.at(-1).known.length, 36);
  assert.deepEqual(news.find((l) => l.letters.includes("أ")).letters, ["أ", "إ"]); // taught together, after ؤ ئ
  assert.ok(LESSONS.every((l, i) => l.index === i && l.minCpm === 20 + 2 * i));
  // a lesson opens only when every lesson before it is passed
  assert.equal(isUnlocked(0, {}), true);
  assert.equal(isUnlocked(1, {}), false);
  assert.equal(isUnlocked(2, { n1: {} }), false);
  assert.equal(isUnlocked(2, { n1: {}, n2: {} }), true);
  assert.equal(isUnlocked(3, { n1: {}, n3: {}, n2: {} }), true);
  assert.equal(isUnlocked(4, { n1: {}, n2: {}, n3: {} }), false); // n4 needs the review r1 as well
  // the text: only known letters, real words from the list, spaces between the words
  const rng = (() => { let x = 5; return () => (x = (x * 16807) % 2147483647) / 2147483647; })();
  for (const lesson of LESSONS) {
    const tokens = buildText(lesson, allWords, rng);
    // long enough to take about 1.75 minutes at a normal pace (a little over the target at most): 100+ characters
    const target = targetLength(lesson);
    assert.ok(tokens.length >= target && tokens.length <= target + 9, `${lesson.id}: ${tokens.length} for ${target}`);
    assert.ok(tokens.length >= 100, lesson.id);
    assert.ok(tokens.filter((tok) => tok === " ").length >= 15, `${lesson.id} has many words`);
    assert.ok(Math.abs(tokens.length / typicalCpm(lesson.index) - TARGET_MINUTES) < 0.15, lesson.id);
    assert.ok(tokens.every((tok) => tok === " " || lesson.known.includes(tok)), lesson.id);
    assert.ok(tokens.every((tok) => tok === " " || codeFor(pc, tok)), lesson.id);
    assert.notEqual(tokens[0], " ");
    if (lesson.kind === "new") for (const l of lesson.letters) assert.ok(tokens.filter((tok) => tok === l).length >= 3, `${lesson.id} ${l}`);
  }
  const words = typableWords(allWords, LESSONS.at(-1).known.filter((x) => x !== "لا"));
  assert.ok(words.length > 500 && words.every((w) => /^[ء-يٱ]+$/.test(w)));
  // a word with a hamza seat waits until it is taught; the typed words keep their أ and إ
  const noSeats = typableWords(allWords, LETTER_ORDER.filter((l) => l !== "أ" && l !== "إ" && l !== "لا"));
  assert.ok(noSeats.every((w) => !/[أإ]/.test(w)));
  assert.ok(words.some((w) => w.includes("أ")) && words.some((w) => w.includes("إ")));
  assert.ok(typableWords(allWords, ["ب", "ت"]).every((w) => [...w].every((c) => "بت".includes(c))));
  // passing needs accuracy and speed
  const L = LESSONS[0];
  const fast = { correct: 30, mistakes: 1, ms: 60000 }; // 30 per minute
  assert.equal(typingResult(fast, L).passed, true);
  assert.equal(typingResult({ correct: 30, mistakes: 5, ms: 60000 }, L).passed, false); // 86%
  assert.equal(typingResult({ correct: 30, mistakes: 0, ms: 120000 }, L).passed, false); // 15 per minute
  assert.ok(MIN_ACCURACY === 0.95 && Math.abs(typingResult(fast, L).accuracy - 30 / 31) < 1e-9);
  assert.deepEqual(betterResult({ cpm: 20 }, { cpm: 25 }), { cpm: 25 });
  assert.deepEqual(betterResult({ cpm: 30 }, { cpm: 25 }), { cpm: 30 });
});

test("typing progress is saved and merged with the account's", () => {
  const local = { cards: {}, typing: { passed: { n1: { accuracy: 0.95, cpm: 30 }, n2: { accuracy: 0.9, cpm: 25 } } } };
  const remote = { cards: {}, typing: { passed: { n1: { accuracy: 0.92, cpm: 22 }, n3: { accuracy: 0.9, cpm: 24 } } } };
  const m = mergeProgress(local, remote);
  assert.deepEqual(Object.keys(m.typing.passed).sort(), ["n1", "n2", "n3"]);
  assert.equal(m.typing.passed.n1.cpm, 30);
  saveProgress({ ...loadProgress(), typing: { passed: { n1: { accuracy: 1, cpm: 40 } } } });
  assert.equal(loadProgress().typing.passed.n1.cpm, 40);
});

test("conjugation game: pronouns by level, present answers, items, strict vowel marks, typing", () => {
  const L = (book, unit) => ({ book, unit });
  // the pronouns learned so far: the list's words first, then the rest where their labels turn Arabic
  assert.deepEqual(learnedPersons(L(1, 1)), ["1s"]);
  const same = (a, b) => assert.deepEqual([...a].sort(), [...b].sort());
  same(learnedPersons(L(1, 4)), ["1s", "2ms", "2fs", "3ms", "3fs"]);
  same(learnedPersons(L(2, 2)), ["1s", "2ms", "2fs", "3ms", "3fs", "2mp", "3mp", "1p"]); // you all, they (m.), we: part 1 lesson 2
  assert.equal(learnedPersons(L(3, 4)).length, 8);
  assert.equal(learnedPersons(L(3, 5)).length, 11); // the duals: part 2 lesson 5
  assert.equal(learnedPersons(L(3, 6)).length, 11);
  assert.equal(learnedPersons(L(3, 7)).length, 13); // the feminine plurals: part 2 lesson 7
  for (const p of ["1s", "2ms", "2fs", "3ms", "3fs", "1p", "2mp", "3mp", "2d", "3md", "3fd", "2fp", "3fp"]) {
    // the labels turn Arabic where they are learned (أنا waits a lesson: the site starts fully in English)
    assert.deepEqual(p === "1s" ? { book: 1, unit: 2 } : personFrom(p), strings[`person.${p}`].unlock, p);
  }
  // the types: the present at part 1 lesson 4, the verbal noun at 6, the past at 8
  assert.deepEqual([tensesAt(L(2, 3)), tensesAt(L(2, 4)), tensesAt(L(2, 6)), tensesAt(L(2, 8))], [[], ["present"], ["masdar", "present"], ["past", "masdar", "present"]].map((a) => a.sort((x, y) => TENSES.indexOf(x) - TENSES.indexOf(y))));
  assert.equal(strings.conjTenses.ar, "النوع");
  // the moods: مرفوع at part 1 lesson 9, منصوب at 10, مجزوم at 13
  assert.deepEqual([learnedMoods(L(2, 8)), learnedMoods(L(2, 9)), learnedMoods(L(2, 10)), learnedMoods(L(2, 12)), learnedMoods(L(2, 13))],
    [[], ["marfu"], ["marfu", "mansub"], ["marfu", "mansub"], ["marfu", "mansub", "majzum"]]);
  // the present, free of case endings, accepted both ways where the noon can drop
  assert.deepEqual(presentAnswers("2fs", "تَدْرُسِينَ"), ["تَدْرُسِينَ/ي".split("/")[0], "تَدْرُسِي"]);
  assert.deepEqual(presentAnswers("3mp", "يَدْرُسُونَ"), ["يَدْرُسُونَ", "يَدْرُسُوا"]);
  assert.deepEqual(presentAnswers("3md", "يَدْرُسانِ"), ["يَدْرُسانِ", "يَدْرُسا"]);
  assert.deepEqual(presentAnswers("3ms", "يَدْرُسُ"), ["يَدْرُس"]);
  assert.deepEqual(presentAnswers("3fp", "يَدْرُسْنَ"), ["يَدْرُسْنَ"]);
  // items from real verbs
  const verbs = allWords.filter((w) => w.pos === "verb" && w.arabic && w.root && w.form === 1).slice(0, 40);
  const all = new Set(["1s", "2ms", "2fs", "3ms", "3fs", "1p", "2mp", "3mp", "2d", "3md", "3fd", "2fp", "3fp"]);
  const items = conjugationItems(verbs, { tenses: new Set(TENSES), persons: all });
  assert.ok(items.length > 500);
  assert.ok(items.every((i) => i.word.root && i.answers.length && (i.tense === "masdar") === (i.person === null)));
  assert.equal(conjugationItems(verbs, { tenses: new Set(["masdar"]), persons: all }).every((i) => i.tense === "masdar"), true);
  assert.equal(conjugationItems(verbs, { tenses: new Set(["past"]), persons: new Set(["3ms"]) }).length > 10, true);
  assert.equal(conjugationItems(verbs, { tenses: new Set(), persons: all }).length, 0);
  // a past form: exact vowels are needed; fatha before alif, sukun and the case of the shadda are forgiven
  const past = items.find((i) => i.tense === "past" && i.person === "3mp");
  assert.equal(isConjugationCorrect(past, past.answers[0]), true);
  assert.equal(isConjugationCorrect(past, past.answers[0].replace(/[ً-ْ]/g, "")), false); // no marks
  assert.equal(isConjugationCorrect(past, ""), false);
  assert.equal(isConjugationCorrect(past, past.answers[0] + "ََ"), false); // two vowels on one letter
  const pres = items.find((i) => i.tense === "present" && i.person === "3ms");
  assert.equal(isConjugationCorrect(pres, pres.answers[0]), true);
  assert.equal(isConjugationCorrect(pres, pres.answers[0] + "ُ"), true); // a typed case ending is forgiven
  const both = items.find((i) => i.tense === "present" && i.person === "2fs");
  assert.ok(both.answers.length === 2 && both.answers.every((a) => isConjugationCorrect(both, a)));
  const masdar = items.find((i) => i.tense === "masdar");
  assert.equal(isConjugationCorrect(masdar, masdar.answers[0]), true);
  assert.equal(isConjugationCorrect(masdar, "ال" + masdar.answers[0]), true); // with or without ال
  // the form is shown only when the root has verbs of other forms
  const w1 = { root: "ك ت ب", form: 1 }, w2 = { root: "ك ت ب", form: 2 }, w3 = { root: "د ر س", form: 1 };
  assert.equal(needsForm(w1, [w1, w2, w3]), true);
  assert.equal(needsForm(w3, [w1, w2, w3]), false);
  // typing on the Arabic 101 keyboard: letters, Shift for the vowel marks and the hamza seats
  assert.deepEqual([charFor(LAYOUT, "KeyQ", false), charFor(LAYOUT, "KeyQ", true), charFor(LAYOUT, "KeyH", true), charFor(LAYOUT, "Space", false), charFor(LAYOUT, "KeyB", false), charFor(LAYOUT, "KeyK", true), charFor(LAYOUT, "F5", false)],
    ["ض", "َ", "أ", " ", "لا", null, null]);
});

test("conjugation game: the present asked by mood (مرفوع, منصوب, مجزوم) once it is learned", () => {
  assert.deepEqual(MOODS.map((m) => MOOD_LABELS[m]), ["مرفوع", "منصوب", "مجزوم"]);
  const sound = allWords.find((w) => w.pos === "verb" && w.form === 1 && w.root && !w.conjugations && getForms(w).regular && getForms(w).present);
  const c = moodCharts(sound);
  assert.ok(c);
  // the endings: -u, -a, sukun; the noon-forms keep their noon in the marfūʿ and drop it in the other two
  assert.ok(c.marfu["3ms"].endsWith("ُ") && c.mansub["3ms"].endsWith("َ") && c.majzum["3ms"].endsWith("ْ"));
  assert.equal(c.mansub["3ms"].slice(0, -1), c.marfu["3ms"].slice(0, -1));
  assert.ok(c.marfu["2fs"].endsWith("ينَ") && c.mansub["2fs"].endsWith("ي") && c.majzum["2fs"] === c.mansub["2fs"]);
  assert.ok(c.marfu["3mp"].endsWith("ونَ") && c.mansub["3mp"].endsWith("وا"));
  assert.ok(c.marfu["3md"].endsWith("انِ") && c.mansub["3md"].endsWith("ا"));
  assert.ok(c.marfu["3fp"] === c.mansub["3fp"] && c.mansub["3fp"] === c.majzum["3fp"]); // يَفعَلْنَ in every mood
  const all = new Set(["3ms", "2fs", "3mp"]);
  const none = conjugationItems([sound], { tenses: new Set(["present"]), persons: all });
  assert.ok(none.every((i) => !i.mood)); // before the moods: the plain present
  const withMoods = conjugationItems([sound], { tenses: new Set(["present"]), persons: all, moods: new Set(MOODS) });
  assert.equal(withMoods.length, 9);
  assert.ok(withMoods.every((i) => i.mood && i.tense === "present"));
  const pick = (mood, person) => withMoods.find((i) => i.mood === mood && i.person === person);
  assert.equal(isConjugationCorrect(pick("marfu", "3ms"), c.marfu["3ms"]), true);
  assert.equal(isConjugationCorrect(pick("marfu", "3ms"), c.mansub["3ms"]), false); // the ending decides
  assert.equal(isConjugationCorrect(pick("mansub", "3ms"), c.mansub["3ms"]), true);
  assert.equal(isConjugationCorrect(pick("majzum", "3ms"), c.majzum["3ms"]), true);
  assert.equal(isConjugationCorrect(pick("majzum", "3ms"), c.majzum["3ms"].replace(/ْ$/, "")), true); // sukun is not required
  assert.equal(isConjugationCorrect(pick("majzum", "3ms"), c.marfu["3ms"]), false);
  assert.equal(isConjugationCorrect(pick("mansub", "2fs"), c.marfu["2fs"]), false); // the noon drops
  assert.equal(isConjugationCorrect(pick("mansub", "2fs"), c.mansub["2fs"]), true);
  // only the moods ticked
  assert.equal(conjugationItems([sound], { tenses: new Set(["present"]), persons: all, moods: new Set(["majzum"]) }).length, 3);
  // irregular verbs use the stored moods where there are some
  const stored = allWords.find((w) => w.conjugations?.subjunctive && w.conjugations?.jussive);
  if (stored) {
    const sc = moodCharts(stored);
    assert.equal(sc.mansub, stored.conjugations.subjunctive);
    assert.ok(conjugationItems([stored], { tenses: new Set(["present"]), persons: new Set(["3ms"]), moods: new Set(MOODS) }).length === 3);
  }
  assert.deepEqual([MOOD_FROM.marfu, MOOD_FROM.mansub, MOOD_FROM.majzum], [{ book: 2, unit: 9 }, { book: 2, unit: 10 }, { book: 2, unit: 13 }]);
  // before the moods are learned the plain present accepts the form with no ending and any of the three moods
  const plain = none.find((i) => i.person === "3ms");
  for (const form of [c.marfu["3ms"], c.mansub["3ms"], c.majzum["3ms"], c.majzum["3ms"].replace(/ْ$/, "")]) assert.equal(isConjugationCorrect(plain, form), true, form);
  assert.equal(isConjugationCorrect(plain, plain.answers[0].replace(/[ً-ْ]/g, "")), false); // the marks still count
  const plain2fs = none.find((i) => i.person === "2fs");
  for (const form of [c.marfu["2fs"], c.mansub["2fs"]]) assert.equal(isConjugationCorrect(plain2fs, form), true, form);
});

test("conjugation without vowel marks, dark mode setting", () => {
  const verbs = allWords.filter((w) => w.pos === "verb" && w.arabic && w.root && w.form === 1).slice(0, 20);
  const all = new Set(["3ms", "3mp", "2fs", "1s"]);
  const items = conjugationItems(verbs, { tenses: new Set(["past", "present", "masdar"]), persons: all });
  const past = items.find((i) => i.tense === "past" && i.person === "3mp");
  const bare = past.answers[0].replace(/[ً-ْ]/g, "");
  assert.equal(isConjugationCorrect(past, bare), false); // marks are required by default
  assert.equal(isConjugationCorrect(past, bare, { marks: true }), false);
  assert.equal(isConjugationCorrect(past, bare, { marks: false }), true); // the option: letters only
  assert.equal(isConjugationCorrect(past, past.answers[0], { marks: false }), true); // marks typed anyway are fine
  assert.equal(isConjugationCorrect(past, past.answers[0] + "ََ", { marks: false }), true); // and not counted
  assert.equal(isConjugationCorrect(past, bare.slice(0, -1), { marks: false }), false); // the letters must be right
  assert.equal(isConjugationCorrect(past, "", { marks: false }), false);
  // the plain present: any mood, no marks
  const pres = items.find((i) => i.tense === "present" && i.person === "2fs");
  assert.equal(isConjugationCorrect(pres, pres.answers[0].replace(/[ً-ْ]/g, ""), { marks: false }), true);
  assert.equal(isConjugationCorrect(pres, pres.answers[1].replace(/[ً-ْ]/g, ""), { marks: false }), true); // the noon dropped
  const masdar = items.find((i) => i.tense === "masdar");
  const mb = masdar.answers[0].replace(/[ً-ْ]/g, "");
  assert.equal(isConjugationCorrect(masdar, mb, { marks: false }), true);
  assert.equal(isConjugationCorrect(masdar, "ال" + mb, { marks: false }), true);
  // dark mode: unset follows the system; the choice is saved and merged
  assert.equal(loadProgress().dark ?? null, null);
  saveProgress({ ...loadProgress(), dark: true });
  assert.equal(loadProgress().dark, true);
  assert.equal(mergeProgress({ cards: {}, dark: false }, { cards: {}, dark: true }).dark, true);
  assert.equal(mergeProgress({ cards: {}, dark: true }, { cards: {}, dark: null }).dark, true);
  assert.equal(mergeProgress({ cards: {} }, { cards: {} }).dark, null);
  saveProgress({ ...loadProgress(), dark: null });
  // the four-letter form reads رباعي, with no number
  assert.equal(strings.quadLabel.ar, "رباعي");
});

test("prepositions are joined, city has the right plural, plurals and gender wait, dialect-only view, makaan boxes", () => {
  const word = (id) => allWords.find((w) => w.id === id);
  // a lone ب or ل is always written joined (بِـ لِـ), never as a separate letter
  const lone = /(^|[\s/])[بل][ً-ْ]*(?=$|[\s/])/;
  const strings_ = (w) => [w.arabic, w.plural, w.feminine, ...(w.prepositions ?? []), w.egyptian?.arabic, w.shami?.arabic, w.egyptian?.plural, w.shami?.plural].filter((x) => typeof x === "string");
  assert.deepEqual(allWords.filter((w) => strings_(w).some((x) => lone.test(x))).map((w) => w.id), []);
  assert.equal(word("b2-u6-023").arabic, "لِـ");
  assert.equal(word("b1-u1-009").shami.arabic, "بِـ");
  // the plural of city
  const city = word("b1-u1-008");
  assert.equal(city.plural, "مُدُن");
  assert.equal(getForms(city).plural, "مُدُن");
  // plurals and gender have their own lessons
  assert.deepEqual(PLURAL_FROM, { book: 2, unit: 2 });
  assert.deepEqual(GENDER_FROM, { book: 1, unit: 6 });
  const pl = buildIndex([{ id: "p", book: 1, unit: 1, arabic: "كِتاب", plural: "كُتُب", pos: "noun", definition: "book", root: "ك ت ب" }]);
  assert.equal(search(pl, "كتب", {}, "oldest", { book: 2, unit: 1 }).length, 1); // matches by root anyway
  assert.equal(search(pl, "كُتُب", {}, "oldest", { book: 1, unit: 9 }).length, 1);
  const noRoot = buildIndex([{ id: "q", book: 1, unit: 1, arabic: "كِتاب", plural: "كُتُب", pos: "noun", definition: "book" }]);
  assert.equal(search(noRoot, "كتب", {}, "oldest", { book: 1, unit: 9 }).length, 0); // not before part 1 lesson 2
  assert.equal(search(noRoot, "كتب", {}, "oldest", { book: 2, unit: 2 }).length, 1);
  assert.equal(search(noRoot, "كتب").length, 1); // no level given: everything
  // the noun of place (form I): singular then plural, in two boxes; the other forms share one box
  assert.equal(answerSpec(1, "makaan").boxes, 2);
  assert.equal(answerSpec(1, "makaan").ordered, true);
  assert.equal(isCorrectSet(1, "makaan", ["مَفعَل", "مَفاعِل"]), true);
  assert.equal(isCorrectSet(1, "makaan", ["مَفعِل", "مَفاعِل"]), true);
  assert.equal(isCorrectSet(1, "makaan", ["مَفاعِل", "مَفعَل"]), false); // singular first
  assert.equal(isCorrectSet(1, "makaan", ["مَفعَل", ""]), false);
  assert.equal(answerText(1, "makaan"), "مَفعَل / مَفعِل · مَفاعِل");
  assert.equal(strings.conjMarks.ar, "الحركات ضرورية");
});

test("a student's own words: the form, matches with the course list, unlocking early, saving and merging", () => {
  // the root: letters spaced out, hamza seats become ء
  assert.equal(normalizeRoot("كتب"), "ك ت ب");
  assert.equal(normalizeRoot("ك ت ب"), "ك ت ب");
  assert.equal(normalizeRoot("سَأَلَ"), "س ء ل");
  assert.equal(normalizeRoot("بُؤْس"), "ب ء س");
  assert.equal(normalizeRoot(""), "");
  // what is needed
  assert.deepEqual(missingFields({}), ["arabic", "definition", "pos"]);
  assert.deepEqual(missingFields({ arabic: "كتاب", definition: "book", pos: "noun" }), []);
  assert.deepEqual(missingFields({ arabic: "كَتَبَ", definition: "to write", pos: "verb" }), ["form"]);
  // the word: placed in the current lesson, shaped like the course words
  const L = { book: 3, unit: 4 };
  const noun = buildCustomWord({ arabic: "كِتاب", definition: " book ", pos: "noun", root: "كتب", gender: "masculine", plural: "كُتُب" }, L, "my-1");
  assert.deepEqual([noun.id, noun.custom, noun.book, noun.unit, noun.root, noun.gender, noun.plural, noun.definition], ["my-1", true, 3, 4, "ك ت ب", "masculine", "كُتُب", "book"]);
  assert.equal(noun.form, null);
  assert.deepEqual(noun.prepositions, []);
  const verb = buildCustomWord({ arabic: "كَتَبَ", definition: "to write", pos: "verb", root: "كتب", form: "1", presentVowel: "u", prepositions: ["إلى"] }, L, "my-2");
  assert.deepEqual([verb.form, verb.pastVowel, verb.presentVowel, verb.prepositions, verb.gender], [1, "a", "u", ["إلى"], null]);
  // its forms are generated like the course verbs
  assert.equal(getForms(verb).past["3ms"], "كَتَبَ");
  assert.equal(getForms(verb).present["3ms"], "يَكْتُبُ");
  assert.ok(getForms(verb).masdar === null || Array.isArray(getForms(verb).masdar));
  assert.equal(buildCustomWord({ arabic: "فاعَلَ", definition: "x", pos: "verb", form: 3 }, L, "my-3").presentVowel, undefined);
  assert.equal(buildCustomWord({ arabic: "فَعَلاا", definition: "x", pos: "noun" }, L, "my-4").arabic, "فَعَلاا".replace(/َ(?=ا)/g, "")); // no fatha before alif
  // checking the course list: a word of a later lesson is offered to be added now
  const index = buildIndex(allWords);
  const early = emptyCustom();
  const future = allWords.find((w) => w.book === 4 && w.unit === 5 && w.arabic && w.pos === "noun");
  const m1 = courseMatches(index, { arabic: future.arabic, definition: "" }, { book: 2, unit: 1 }, early);
  assert.ok(m1.some((m) => m.word.id === future.id && m.state === "future"));
  assert.ok(courseMatches(index, { arabic: future.arabic, definition: "" }, { book: 4, unit: 10 }, early).some((m) => m.word.id === future.id && m.state === "have"));
  const unlocked = unlockEarly(early, future.id);
  assert.ok(courseMatches(index, { arabic: future.arabic, definition: "" }, { book: 2, unit: 1 }, unlocked).some((m) => m.word.id === future.id && m.state === "added"));
  assert.equal(courseMatches(index, { arabic: "", definition: "" }, L, early).length, 0); // nothing typed
  assert.ok(courseMatches(index, { arabic: "", definition: "library" }, { book: 1, unit: 1 }, early).length >= 1); // by the English
  assert.ok(courseMatches(index, { arabic: "ك", definition: "" }, L, early).length === 0); // one letter is not enough
  // changes
  let c = emptyCustom();
  c = addOwnWord(c, noun);
  c = unlockEarly(unlockEarly(c, "x1"), "x1");
  assert.deepEqual([c.words.length, c.early], [1, ["x1"]]);
  assert.deepEqual(lockEarly(c, "x1").early, []);
  assert.equal(removeOwnWord(c, "my-1").words.length, 0);
  // merging with the account: everything either side has
  const merged = mergeCustom({ words: [noun], early: ["a"] }, { words: [verb, noun], early: ["b", "a"] });
  assert.deepEqual(merged.words.map((w) => w.id).sort(), ["my-1", "my-2"]);
  assert.deepEqual(merged.early.sort(), ["a", "b"]);
  const m = mergeProgress({ cards: {}, custom: { words: [noun], early: [] } }, { cards: {}, custom: { words: [verb], early: ["z"] } });
  assert.deepEqual([m.custom.words.length, m.custom.early], [2, ["z"]]);
  assert.deepEqual(mergeProgress({ cards: {} }, { cards: {} }).custom, { words: [], early: [] });
  // saved in the browser
  saveProgress({ ...loadProgress(), custom: { words: [noun], early: ["q"] } });
  assert.deepEqual(loadProgress().custom, { words: [noun], early: ["q"] });
  saveProgress({ ...loadProgress(), custom: { words: [], early: [] } });
  // the study modes can include them whatever their lesson
  const items = buildItems([{ ...noun, book: 4, unit: 9 }], {}, { units: new Set(["1.1"]), lists: new Set([1, 2]), varieties: new Set(["ar-en"]) });
  assert.equal(items.length, 0);
  assert.equal(buildItems([{ ...noun, book: 4, unit: 9 }], {}, { units: new Set(["1.1"]), lists: new Set([1, 2]), varieties: new Set(["ar-en"]), extra: new Set(["my-1"]) }).length, 1);
});

test("the student's name, and editing the forms of an own verb", () => {
  // after Alif Baa the Arabic name is asked for and shown instead of the English one
  assert.deepEqual(NAME_AR_FROM, { book: 2, unit: 1 });
  assert.deepEqual(loadProgress().profile, { name: "", nameAr: "", skippedAr: false });
  saveProgress({ ...loadProgress(), profile: { name: "Sara", nameAr: "", skippedAr: false } });
  assert.equal(loadProgress().profile.name, "Sara");
  saveProgress({ ...loadProgress(), profile: { name: "", nameAr: "", skippedAr: false } });
  const m = mergeProgress({ cards: {}, profile: { name: "Sara", nameAr: "", skippedAr: true } }, { cards: {}, profile: { name: "", nameAr: "سارة", skippedAr: false } });
  assert.deepEqual(m.profile, { name: "Sara", nameAr: "سارة", skippedAr: true });
  assert.deepEqual(mergeProgress({ cards: {} }, { cards: {} }).profile, { name: "", nameAr: "", skippedAr: false });
  assert.equal(strings.welcomeName.en("Sara"), "Welcome back, Sara");
  assert.equal(strings.welcomeName.ar("سارة"), "أهلا بعودتك يا سارة"); // with يا
  const ya = allWords.find((w) => w.definition.startsWith("signal that you are addressing"));
  assert.ok(ya.book <= strings.welcomeName.unlock.book && (ya.book < strings.welcomeName.unlock.book || ya.unit <= strings.welcomeName.unlock.unit)); // يا is learned before
  // irregular verbs: a note on the ones that may be generated wrongly
  assert.equal(mayBeIrregular({ pos: "verb", root: "ك ت ب" }), false);
  assert.equal(mayBeIrregular({ pos: "verb", root: "ق و ل" }), true); // hollow
  assert.equal(mayBeIrregular({ pos: "verb", root: "ر م ي" }), true); // defective
  assert.equal(mayBeIrregular({ pos: "verb", root: "ء ك ل" }), true); // hamzated
  assert.equal(mayBeIrregular({ pos: "verb", root: "ح ب ب" }), true); // doubled
  assert.equal(mayBeIrregular({ pos: "noun", root: "ق و ل" }), false);
  // editing the forms of an own verb: stored forms win over generated ones, and can be reset
  const verb = buildCustomWord({ arabic: "قالَ", definition: "to say", pos: "verb", root: "قول", form: 1 }, { book: 2, unit: 1 }, "my-9");
  let c = addOwnWord(emptyCustom(), verb);
  c = updateOwnWord(c, "my-9", { conjugations: { past: { "3ms": "قالَ", "3mp": "قالوا" }, present: { "3ms": "يَقولُ" } }, masdar: "قَوْل", edited: true });
  const edited = c.words[0];
  assert.equal(getForms(edited).past["3mp"], "قالوا");
  assert.deepEqual(getForms(edited).masdar, ["قَوْل"]);
  assert.equal(edited.edited, true);
  c = updateOwnWord(c, "my-9", { conjugations: null, masdar: null, edited: false });
  assert.equal(getForms(c.words[0]).past?.["3mp"] === "قالوا", false); // back to the generated forms
});

test("crosswords: one static puzzle per unit from part 1, consistent grids, Arabic clues", () => {
  const ids = Object.keys(crosswords);
  assert.equal(ids.length, 28); // part 1 (13 units), part 2 (10), part 3 (5 with words)
  for (let u = 1; u <= 13; u++) assert.ok(crosswords[puzzleId(2, u)], `b2-u${u}`);
  for (let u = 1; u <= 10; u++) assert.ok(crosswords[puzzleId(3, u)], `b3-u${u}`);
  assert.ok(ids.every((id) => !id.startsWith("b1")));
  for (const [id, p] of Object.entries(crosswords)) {
    assert.ok(p.rows <= 15 && p.cols <= 15 && p.entries.length >= 12, `${id} size/entries`);
    assert.equal(p.cells.length, p.rows);
    assert.ok(p.cells.every((row) => row.length === p.cols));
    for (const e of p.entries) {
      // the answer is spelled out by the grid, along its direction
      entryCells(e).forEach(({ r, c }, k) => assert.equal(p.cells[r][c], e.answer[k], `${id} ${e.n} ${e.dir}`));
      assert.ok(e.clue && /[A-Za-z\u0621-\u064A]/.test(e.clue) && !/[0-9]/.test(e.clue), `${id} clue of ${e.answer}`);
      assert.ok(!e.clue.includes(e.answer) || e.answer.length < 4, `${id}: ${e.answer} is in its clue`);
    }
    // every letter cell belongs to a word; across and down clues both exist
    const covered = new Set(p.entries.flatMap((e) => entryCells(e).map((x) => `${x.r},${x.c}`)));
    let letters = 0;
    p.cells.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== ".") { letters++; assert.ok(covered.has(`${r},${c}`), `${id} loose letter`); } }));
    assert.equal(covered.size, letters);
    assert.ok(p.entries.some((e) => e.dir === "across") && p.entries.some((e) => e.dir === "down"));
    // numbered in reading order; an across and a down entry may share a number
    const nums = [...new Set(p.entries.map((e) => e.n))];
    assert.deepEqual(nums, nums.map((_, i) => i + 1));
  }
  // the puzzle logic
  const p = crosswords[puzzleId(2, 1)];
  const typed = emptyTyped(p);
  assert.equal(isSolved(p, typed), false);
  for (const e of p.entries) entryCells(e).forEach(({ r, c }, k) => { typed[r][c] = e.answer[k]; });
  assert.equal(isSolved(p, typed), true);
  assert.equal(wrongCells(p, typed).length, 0);
  assert.ok(p.entries.every((e) => isEntrySolved(p, typed, e)));
  const e0 = p.entries[0];
  const { r, c } = entryCells(e0)[0];
  typed[r][c] = "ز";
  assert.equal(isSolved(p, typed), false);
  assert.deepEqual(wrongCells(p, typed), [{ r, c }]);
  typed[r][c] = "";
  assert.equal(wrongCells(p, typed).length, 0); // empty is not wrong
  // any spelling of a letter counts: أ إ for ا, ه for ة, ى for ي
  assert.ok(sameLetter("أ", "ا") && sameLetter("ه", "ة") && sameLetter("ى", "ي") && !sameLetter("ب", "ت") && !sameLetter("", "ا"));
  assert.deepEqual(nextCell(p, e0.r, e0.c, e0.dir), entryCells(e0)[1]);
  const end = entryCells(e0).at(-1);
  assert.deepEqual(nextCell(p, end.r, end.c, e0.dir), end); // stays at the end
  assert.deepEqual(prevCell(p, e0.r, e0.c, e0.dir), { r: e0.r, c: e0.c });
  assert.equal(entryAt(p, e0.r, e0.c, e0.dir), e0);
  assert.equal(isCell(p, -1, 0), false);
  // saved: puzzles solved
  assert.deepEqual(loadProgress().crosswords, { done: {} });
  assert.deepEqual(mergeProgress({ cards: {}, crosswords: { done: { "b2-u1": true } } }, { cards: {}, crosswords: { done: { "b2-u2": true } } }).crosswords, { done: { "b2-u1": true, "b2-u2": true } });
});

test("crossword clues suit the level: English early, mostly Arabic later, only words the student knows", () => {
  const known = knownByUnit(allWords, Object.keys(crosswords));
  for (const [id, p] of Object.entries(crosswords)) {
    const [book, unit] = id.match(/\d+/g).map(Number);
    const english = p.entries.filter((e) => /[A-Za-z]/.test(e.clue)).length;
    const share = english / p.entries.length;
    if (book === 2 && unit >= 5 && unit <= 11) assert.ok(share <= 0.4 + 1e-9, `${id}: ${english} English clues of ${p.entries.length}`);
    if (!(book === 2 && unit <= 11)) assert.ok(share <= 0.15 + 1e-9, `${id}: ${english} English clues of ${p.entries.length}`);
    // every Arabic word of a clue has been met by that unit
    for (const e of p.entries) {
      const unknown = arabicTokens(e.clue).filter((tok) => !isKnown(tok, known[id]));
      assert.deepEqual(unknown, [], `${id} ${e.answer}: ${e.clue}`);
    }
  }
  // part 1 lessons 1-4 can be all English
  const early = ["b2-u1", "b2-u2", "b2-u3", "b2-u4"].map((id) => crosswords[id].entries.filter((e) => /[A-Za-z]/.test(e.clue)).length);
  assert.ok(early.every((n) => n > 0));
});

test("word searches: one per unit from part 1, the words are in the grid, tapping a line finds a word", () => {
  const ids = Object.keys(wordsearches);
  assert.equal(ids.length, 28);
  assert.ok(ids.every((id) => !id.startsWith("b1")));
  for (const [id, p] of Object.entries(wordsearches)) {
    assert.equal(p.grid.length, p.rows);
    assert.ok(p.grid.every((row) => row.length === p.cols));
    assert.ok(p.words.length >= 16, `${id}: ${p.words.length} words`);
    assert.equal(new Set(p.words.map((w) => w.answer)).size, p.words.length);
    for (const w of p.words) {
      // the word is spelled out by the grid, in a straight line inside it
      const cells = wordCells(w);
      assert.equal(cells.map(({ r, c }) => p.grid[r]?.[c]).join(""), w.answer, `${id} ${w.answer}`);
      assert.ok(w.arabic && w.english);
    }
  }
  // most (all, in small units) of the unit's words are hidden
  const candidates = JSON.parse(readFileSync(new URL("../../data/crossword/candidates.json", import.meta.url), "utf8"));
  for (const id of ["b2-u1", "b2-u2", "b2-u7", "b2-u8"]) {
    assert.equal(wordsearches[id].words.length, new Set(candidates[id].map((c) => c.answer)).size, id);
  }
  // how much English the list shows
  assert.deepEqual([glossMode(2, 1), glossMode(2, 4), glossMode(2, 5), glossMode(2, 11), glossMode(2, 12), glossMode(3, 1)], ["full", "full", "light", "light", "none", "none"]);
  // selecting
  const p = wordsearches["b2-u1"];
  const w = p.words[0];
  const cells = wordCells(w);
  const first = cells[0], last = cells.at(-1);
  assert.equal(lineBetween(first, last).length, w.answer.length);
  assert.equal(wordOnLine(p, lineBetween(first, last))?.answer, w.answer);
  assert.equal(wordOnLine(p, lineBetween(last, first))?.answer, w.answer); // from the end works too
  assert.equal(lineBetween({ r: 0, c: 0 }, { r: 1, c: 2 }), null); // not a straight line
  assert.equal(wordOnLine(p, [first]), null);
  assert.equal(searchId(2, 3), "b2-u3");
  // saved
  assert.deepEqual(loadProgress().wordSearches, { done: {} });
  assert.deepEqual(mergeProgress({ cards: {}, wordSearches: { done: { "b2-u1": true } } }, { cards: {}, wordSearches: { done: { "b3-u2": true } } }).wordSearches, { done: { "b2-u1": true, "b3-u2": true } });
});

test("typing: 95% to pass, hard mode (98% and 40 WPM) with its own run, the best record per lesson", () => {
  const L = LESSONS[0];
  // normal: 95%
  assert.equal(MIN_ACCURACY, 0.95);
  assert.equal(typingResult({ correct: 95, mistakes: 5, ms: 60000 }, L).passed, true); // exactly 95%
  assert.equal(typingResult({ correct: 94, mistakes: 6, ms: 60000 }, L).passed, false);
  assert.equal(typingResult({ correct: 100, mistakes: 0, ms: 60000 }, L).ms, 60000);
  // hard: 98% and 40 words a minute = 200 characters a minute, in every lesson
  assert.deepEqual([HARD_ACCURACY, HARD_CPM, toWpm(HARD_CPM)], [0.98, 200, 40]);
  assert.deepEqual([accuracyFor(false), accuracyFor(true), cpmFor(L, true), cpmFor(LESSONS.at(-1), true), cpmFor(L, false)], [0.95, 0.98, 200, 200, L.minCpm]);
  const fast = { correct: 200, mistakes: 3, ms: 60000 }; // 98.5%, 200 a minute
  assert.equal(typingResult(fast, L, true).passed, true);
  assert.equal(typingResult({ correct: 200, mistakes: 5, ms: 60000 }, L, true).passed, false); // 97.6%
  assert.equal(typingResult({ correct: 100, mistakes: 0, ms: 60000 }, L, true).passed, false); // 100 a minute
  assert.equal(typingResult({ correct: 100, mistakes: 0, ms: 60000 }, L, false).passed, true); // fine in the normal run
  assert.deepEqual([showWpm(20), showWpm(22), showWpm(200)], [4, 4.4, 40]);
  // the record: best speed (with its accuracy) and the fastest time
  const a = bestRecord(undefined, { accuracy: 0.96, cpm: 40, ms: 90000 });
  assert.deepEqual(a, { accuracy: 0.96, cpm: 40, ms: 90000 });
  assert.deepEqual(bestRecord(a, { accuracy: 0.99, cpm: 50, ms: 70000 }), { accuracy: 0.99, cpm: 50, ms: 70000 });
  assert.deepEqual(bestRecord(a, { accuracy: 1, cpm: 30, ms: 80000 }), { accuracy: 0.96, cpm: 40, ms: 80000 }); // slower run, but a shorter text
  // saved: normal and hard progress apart, merged with the account's
  saveProgress({ cards: {}, level: null }); // an old save without typing progress
  assert.deepEqual(loadProgress().typing, { passed: {}, passedHard: {}, hard: false });
  const m = mergeProgress(
    { cards: {}, typing: { passed: { n1: { accuracy: 0.96, cpm: 30, ms: 90000 } }, passedHard: { n1: { accuracy: 0.99, cpm: 210, ms: 20000 } }, hard: true } },
    { cards: {}, typing: { passed: { n1: { accuracy: 0.97, cpm: 25, ms: 80000 } }, passedHard: {}, hard: false } },
  );
  assert.deepEqual(m.typing.passed.n1, { accuracy: 0.96, cpm: 30, ms: 80000 }); // the faster speed, the shorter time
  assert.deepEqual(Object.keys(m.typing.passedHard), ["n1"]);
  assert.equal(m.typing.hard, false); // the account's choice
  assert.equal(mergeProgress({ cards: {}, typing: { hard: true } }, { cards: {} }).typing.hard, true);
  // the name of the site
  assert.equal(strings.siteTitle.en, "kutubiiya");
  assert.equal(strings.siteTitle.ar, "كتبية");
  assert.equal(strings.conjHintForm.ar, "أظهر الوزن");
});

import { formsOf as agreeForms, pickQuestion as agreePick, isRight as agreeRight, CHOICES as AGREE_CHOICES, eligible as agreeEligible } from "./agreement.js";

test("gender and number game: six answers, forms built from a noun and an adjective", () => {
  assert.equal(AGREE_CHOICES.length, 6);
  const noun = { pos: "noun", gender: "feminine", arabic: "مُدَرِّسة", plural: null };
  const f = agreeForms(noun);
  assert.deepEqual(f.map((x) => `${x.gender}-${x.number}`), ["feminine-singular", "feminine-dual", "feminine-plural"]);
  assert.equal(f[1].text, "مُدَرِّستان");
  const adj = { pos: "adjective", arabic: "جَديد", feminine: "جَديدة" };
  assert.equal(agreeForms(adj).length, 6);
  assert.equal(agreeEligible({ pos: "verb", arabic: "كَتَبَ" }), false);
  const q = agreePick([adj, noun], () => 0);
  assert.ok(agreeRight(q, { gender: q.form.gender, number: q.form.number }));
  assert.equal(agreePick([]), null);
});

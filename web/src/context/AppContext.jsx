import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import allWords from "../data/words.json";
import { books, compareLevel, levelReached, ARABIC_DIGITS_LEVEL, TRANSLITERATION_MAX_BOOK } from "../config/books.js";
import { localizeDigits } from "../lib/numerals.js";
import { strings } from "../i18n/strings.js";
import { vocabSets, arabicRatio, isRtl, translate, isArabic } from "../lib/i18n.js";
import { cardKey, newCard, review, DIRECTIONS, wordStatus } from "../lib/leitner.js";
import { buildIndex } from "../lib/search.js";
import { loadProgress, saveProgress } from "../lib/storage.js";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const DEFAULT_LEVEL = { book: 1, unit: 1 };

// Words are curriculum-ordered by book, then unit, then their order in the file.
const sortedWords = [...allWords].sort((a, b) => a.book - b.book || a.unit - b.unit);
const searchIndex = buildIndex(sortedWords);

export function AppProvider({ children }) {
  const [progress, setProgress] = useState(loadProgress);
  useEffect(() => saveProgress(progress), [progress]);

  const { level, cards } = progress;
  const effectiveLevel = level ?? DEFAULT_LEVEL;

  // Words up to and including the student's current unit.
  const visibleWords = useMemo(
    () => (level ? sortedWords.filter((w) => compareLevel(w, level) <= 0) : []),
    [level],
  );
  const visibleIds = useMemo(() => new Set(visibleWords.map((w) => w.id)), [visibleWords]);
  const visibleIndex = useMemo(() => searchIndex.filter((e) => visibleIds.has(e.word.id)), [visibleIds]);

  const vocab = useMemo(() => vocabSets(sortedWords, cards), [cards]);
  const ratio = useMemo(() => arabicRatio(strings, effectiveLevel, vocab), [effectiveLevel, vocab]);
  const rtl = isRtl(effectiveLevel, ratio);

  const t = useCallback(
    (key, ...args) => translate(strings, key, effectiveLevel, vocab, ...args),
    [effectiveLevel, vocab],
  );
  const tIsArabic = useCallback(
    (key) => !!strings[key] && isArabic(strings[key], effectiveLevel, vocab),
    [effectiveLevel, vocab],
  );

  // Numbers (and digits inside book names) switch to ٠-٩ at ARABIC_DIGITS_LEVEL.
  const arabicDigits = levelReached(effectiveLevel, ARABIC_DIGITS_LEVEL);
  const nf = useCallback((n) => localizeDigits(n, arabicDigits), [arabicDigits]);
  const bookName = useCallback(
    (id) => {
      const b = books[id];
      const name = b.nameAr && levelReached(effectiveLevel, b.nameArFrom) ? b.nameAr : b.name;
      return localizeDigits(name, arabicDigits);
    },
    [arabicDigits, effectiveLevel],
  );

  const showTransliteration = effectiveLevel.book <= TRANSLITERATION_MAX_BOOK;

  // Theme + direction live on <html>.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme", books[effectiveLevel.book].color);
    root.dir = rtl ? "rtl" : "ltr";
    root.lang = rtl ? "ar" : "en";
  }, [effectiveLevel.book, rtl]);

  const setLevel = useCallback((book, unit) => {
    const u = Math.min(Math.max(1, unit), books[book].maxUnits);
    setProgress((p) => ({ ...p, level: { book, unit: u } }));
  }, []);

  // Start tracking a word in both directions, due immediately in box 0.
  const introduce = useCallback((wordId) => {
    setProgress((p) => {
      const cards = { ...p.cards };
      const now = Date.now();
      for (const d of DIRECTIONS) {
        const k = cardKey(wordId, d);
        if (!cards[k]) cards[k] = newCard(now);
      }
      return { ...p, cards };
    });
  }, []);

  const rate = useCallback((key, rating) => {
    setProgress((p) => {
      if (!p.cards[key]) return p;
      return { ...p, cards: { ...p.cards, [key]: review(p.cards[key], rating) } };
    });
  }, []);

  // Records a map-game time; returns true if it beat the previous best.
  const submitGeoTime = useCallback(
    (modeId, ms) => {
      const prev = progress.geoBest?.[modeId];
      const isBest = prev == null || ms < prev;
      if (isBest) setProgress((p) => ({ ...p, geoBest: { ...p.geoBest, [modeId]: ms } }));
      return isBest;
    },
    [progress.geoBest],
  );

  const statusOf =useCallback((wordId) => wordStatus(cards, wordId), [cards]);

  const value = {
    words: sortedWords,
    visibleWords,
    visibleIds,
    visibleIndex,
    level,
    cards,
    rtl,
    arabicRatio: ratio,
    t,
    tIsArabic,
    nf,
    bookName,
    showTransliteration,
    setLevel,
    introduce,
    rate,
    statusOf,
    geoBest: progress.geoBest ?? {},
    submitGeoTime,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import allWords from "../data/words.json";
import { books, compareLevel, levelReached, lessonStyle, ARABIC_DIGITS_LEVEL, TRANSLITERATION_MAX_BOOK } from "../config/books.js";
import { localizeDigits } from "../lib/numerals.js";
import { strings } from "../i18n/strings.js";
import { vocabSets, arabicRatio, isRtl, translate, isArabic } from "../lib/i18n.js";
import { cardKey, newCard, review, wordStatus } from "../lib/leitner.js";
import { activeVarieties, isWordAvailable, parseCardKey } from "../lib/varieties.js";
import { buildIndex } from "../lib/search.js";
import { emptyProgress, loadProgress, saveProgress } from "../lib/storage.js";
import { fetchProgress, pushProgress } from "../lib/supabase.js";
import { mergeProgress } from "../lib/sync.js";
import { bestRecord } from "../lib/typing.js";
import { addOwnWord, buildCustomWord, emptyCustom, lockEarly, newOwnId, removeOwnWord, unlockEarly, updateOwnWord } from "../lib/customWords.js";
import { useAuth } from "./AuthContext.jsx";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const DEFAULT_LEVEL = { book: 1, unit: 1 };

// Words are curriculum-ordered by book, then unit, then their order in the file.
const sortedWords = [...allWords].sort((a, b) => a.book - b.book || a.unit - b.unit);
const searchIndex = buildIndex(sortedWords);

export function AppProvider({ children }) {
  const [progress, setProgress] = useState(loadProgress);
  useEffect(() => saveProgress(progress), [progress]);

  // --- account sync: progress also lives in the signed-in student's Supabase row ---
  const { user, signOut: authSignOut } = useAuth();
  const userId = user?.id ?? null;
  const [synced, setSynced] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | saving | saved | error
  const latest = useRef(progress);
  latest.current = progress;
  const wasSignedIn = useRef(false);

  // on sign-in: load the account's progress and merge this browser's into it (nothing is lost)
  useEffect(() => {
    if (!userId) {
      setSynced(false);
      if (wasSignedIn.current) {
        wasSignedIn.current = false;
        setProgress(emptyProgress()); // do not leave the last student's data on a shared computer
        setSyncStatus("idle");
      }
      return undefined;
    }
    wasSignedIn.current = true;
    let cancelled = false;
    fetchProgress(userId)
      .then((remote) => {
        if (cancelled) return;
        setProgress((p) => mergeProgress(p, remote));
        setSynced(true);
      })
      .catch(() => !cancelled && setSyncStatus("error")); // never save over the account if loading failed
    return () => { cancelled = true; };
  }, [userId]);

  // after that, save a moment after every change
  useEffect(() => {
    if (!userId || !synced) return undefined;
    setSyncStatus("saving");
    const h = setTimeout(() => {
      pushProgress(userId, progress).then(() => setSyncStatus("saved"), () => setSyncStatus("error"));
    }, 1500);
    return () => clearTimeout(h);
  }, [progress, userId, synced]);

  const signOut = useCallback(async () => {
    if (userId && synced) { try { await pushProgress(userId, latest.current); } catch { /* sign out anyway */ } }
    await authSignOut();
  }, [userId, synced, authSignOut]);

  const { level, cards, dialects } = progress;
  // the student's own words, and the course words they unlocked ahead of their lesson
  const custom = progress.custom ?? emptyCustom();
  const wordsById = useMemo(() => new Map([...sortedWords, ...custom.words].map((w) => [w.id, w])), [custom.words]);
  const myIds = useMemo(() => new Set([...custom.words.map((w) => w.id), ...custom.early]), [custom]);
  const effectiveLevel = level ?? DEFAULT_LEVEL;

  // Words up to and including the student's current unit, minus entries hidden
  // from this book onward (`hideFromBook`) and entries with nothing to show
  // (dialect-only rows when that dialect is off).
  const visibleWords = useMemo(
    () =>
      level
        ? [
            ...sortedWords.filter(
              (w) =>
                (compareLevel(w, level) <= 0 || custom.early.includes(w.id)) &&
                !(w.hideFromBook && level.book >= w.hideFromBook) &&
                isWordAvailable(w, dialects),
            ),
            ...custom.words.filter((w) => isWordAvailable(w, dialects)),
          ]
        : [],
    [level, dialects, custom],
  );
  const visibleIds = useMemo(() => new Set(visibleWords.map((w) => w.id)), [visibleWords]);
  const customIndex = useMemo(() => buildIndex(custom.words), [custom.words]);
  const visibleIndex = useMemo(
    () => [...searchIndex.filter((e) => visibleIds.has(e.word.id)), ...customIndex.filter((e) => visibleIds.has(e.word.id))],
    [visibleIds, customIndex],
  );

  // Cards that are in play: the word is visible and its variety is enabled.
  const activeCards = useMemo(() => {
    const out = [];
    for (const [key, card] of Object.entries(cards)) {
      const { wordId, variety } = parseCardKey(key);
      const word = wordsById.get(wordId);
      if (word && visibleIds.has(wordId) && activeVarieties(word, dialects).includes(variety)) out.push([key, card]);
    }
    return out;
  }, [cards, visibleIds, dialects, wordsById]);

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
    // `fixed` is the static textbook style used on the first-run screen: the part number in Al-Kitaab
    // names is Arabic-Indic whatever the student's level; elsewhere it follows the level as usual
    (id, { fixed = false } = {}) => {
      const b = books[id];
      const name = b.nameAr && levelReached(effectiveLevel, b.nameArFrom) ? b.nameAr : b.name;
      return localizeDigits(name, arabicDigits || (fixed && id >= 2));
    },
    [arabicDigits, effectiveLevel],
  );

  // A lesson in the fixed textbook style (only the first-run screen uses it; the rest of the site follows
  // the student's level): "٧", "درس ٧" (from Alif Baa lesson 5, and for every Al-Kitaab lesson). With
  // `english`, early Alif Baa lessons read "Unit 3" instead of a bare number.
  const unitLabel = useCallback((book, unit, { english = false } = {}) => {
    const style = lessonStyle(book, unit);
    const n = localizeDigits(unit, style.digits);
    if (style.word) return `درس ${n}`;
    return english ? `Unit ${n}` : n;
  }, []);

  // The browser tab shows the site title, in Arabic once the student has reached where it turns Arabic.
  const siteTitle = t("siteTitle");
  useEffect(() => {
    document.title = siteTitle;
  }, [siteTitle]);

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

  // Every word the student can see is tracked right away (due immediately in box 0), in every variety
  // they study. There is no separate "learn" step.
  useEffect(() => {
    const missing = [];
    for (const w of visibleWords) {
      for (const v of activeVarieties(w, dialects)) {
        const k = cardKey(w.id, v);
        if (!cards[k]) missing.push(k);
      }
    }
    if (!missing.length) return;
    const now = Date.now();
    setProgress((p) => {
      const next = { ...p.cards };
      for (const k of missing) if (!next[k]) next[k] = newCard(now);
      return { ...p, cards: next };
    });
  }, [visibleWords, dialects, cards]);

  const setDialect = useCallback((name, on) => {
    setProgress((p) => ({ ...p, dialects: { ...p.dialects, [name]: !!on } }));
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

  // Dark mode: the student's choice, else the system's setting.
  const systemDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  const dark = progress.dark ?? !!systemDark;
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  const crosswordsDone = progress.crosswords?.done ?? {};
  const finishCrossword = useCallback(
    (id) => setProgress((p) => ({ ...p, crosswords: { done: { ...p.crosswords?.done, [id]: true } } })),
    [],
  );
  const wordSearchesDone = progress.wordSearches?.done ?? {};
  const finishWordSearch = useCallback(
    (id) => setProgress((p) => ({ ...p, wordSearches: { done: { ...p.wordSearches?.done, [id]: true } } })),
    [],
  );
  const setDark = useCallback((on) => setProgress((p) => ({ ...p, dark: !!on })), []);

  // Typing lessons: passed lessons are kept, with their faster result.
  const typing = { passed: {}, passedHard: {}, hard: false, ...progress.typing };
  // a passed lesson keeps its best speed and fastest time; hard mode has a run of its own
  const passTyping = useCallback((id, result, hard = false) => {
    setProgress((p) => {
      const t = { passed: {}, passedHard: {}, hard: false, ...p.typing };
      const key = hard ? "passedHard" : "passed";
      return { ...p, typing: { ...t, [key]: { ...t[key], [id]: bestRecord(t[key][id], result) } } };
    });
  }, []);
  const setTypingHard = useCallback((hard) => setProgress((p) => ({ ...p, typing: { passed: {}, passedHard: {}, ...p.typing, hard: !!hard } })), []);

  const statusOf = useCallback(
    (wordId) => {
      const word = wordsById.get(wordId);
      return wordStatus(cards, wordId, word ? activeVarieties(word, dialects) : undefined);
    },
    [cards, dialects, wordsById],
  );

  // Adding words: the student's own, or a course word unlocked early.
  const setCustom = useCallback((fn) => setProgress((p) => ({ ...p, custom: fn(p.custom ?? emptyCustom()) })), []);
  const addWord = useCallback(
    (fields) => {
      const word = buildCustomWord(fields, level ?? DEFAULT_LEVEL, newOwnId());
      setCustom((c) => addOwnWord(c, word));
      return word;
    },
    [level, setCustom],
  );
  const removeWord = useCallback((id) => setCustom((c) => removeOwnWord(lockEarly(c, id), id)), [setCustom]);
  const unlockWord = useCallback((id) => setCustom((c) => unlockEarly(c, id)), [setCustom]);
  const updateWord = useCallback((id, patch) => setCustom((c) => updateOwnWord(c, id, patch)), [setCustom]);

  // The student's name: English from the start; once Alif Baa is finished the Arabic name is asked for. Either can be
  // entered in Settings at any time, and the Arabic name, when there is one, is the one shown.
  const profile = progress.profile ?? { name: "", nameAr: "", skippedAr: false };
  const setProfile = useCallback((patch) => setProgress((p) => ({ ...p, profile: { ...(p.profile ?? {}), ...patch } })), []);
  const displayName = profile.nameAr.trim() || profile.name.trim();

  const value = {
    words: sortedWords,
    courseIndex: searchIndex,
    custom,
    myIds,
    addWord,
    removeWord,
    unlockWord,
    updateWord,
    profile,
    setProfile,
    displayName,
    wordsById,
    visibleWords,
    visibleIds,
    visibleIndex,
    activeCards,
    dialects,
    setDialect,
    level,
    cards,
    rtl,
    arabicRatio: ratio,
    t,
    tIsArabic,
    nf,
    bookName,
    unitLabel,
    showTransliteration,
    setLevel,
    rate,
    statusOf,
    geoBest: progress.geoBest ?? {},
    typing,
    dark,
    setDark,
    crosswordsDone,
    finishCrossword,
    wordSearchesDone,
    finishWordSearch,
    passTyping,
    setTypingHard,
    syncStatus,
    signOut,
    submitGeoTime,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// UI text. Each entry flips from English to Arabic when BOTH hold:
//   1. the student's level has reached `unlock` (book, unit), and
//   2. every word in `needs` that exists in words.json has been learned
//      (see UI_LEARNED_BOX in config/books.js). Words not yet added to
//      words.json are ignored, so the list can grow without breaking this.
//
// Arabic UI text is deliberately unvoweled. Functions take (…args) -> string.

// Functions that take numbers receive them already formatted (Western or
// Arabic digits, depending on level) as a string, e.g. dueCount(n, formatted).
const u = (book, unit = 1) => ({ book, unit });

export const strings = {
  // --- navigation / shell ---
  siteTitle: { en: "Al-Kitaab Adaptive Learning", ar: "التعلم التكيفي للكتاب", unlock: u(2, 6) },
  navHome: { en: "Home", ar: "الرئيسية", unlock: u(2, 3) },
  navLearn: { en: "Learn", ar: "تعلم", unlock: u(1, 8) },
  navLookup: { en: "Lookup", ar: "بحث", unlock: u(2, 1) },
  level: { en: "Level", ar: "المستوى", unlock: u(2, 4) },
  book: { en: "Book", ar: "الكتاب", unlock: u(2, 1) },
  unit: { en: "Unit", ar: "الدرس", unlock: u(1, 5) },
  unitN: { en: (s) => `Unit ${s}`, ar: (s) => `درس ${s}`, unlock: u(1, 5) },
  navSettings: { en: "Settings", ar: "الإعدادات", unlock: u(2, 6) },
  settingsLevelHelp: {
    en: "Your book and unit. You see words and grammar up to and including this unit.",
    ar: "كتابك ودرسك. ترى الكلمات والقواعد حتى هذا الدرس.",
    unlock: u(3, 5),
  },
  // Dialect names stay English until you decide which lesson they turn Arabic at.
  dialectsTitle: { en: "Dialects", ar: "اللهجات", unlock: u(9, 1) },
  dialectsHelp: {
    en: "Also learn Egyptian and/or Shami (Levantine) words. Each one you turn on gets its own flashcards.",
    ar: "تعلم أيضا الكلمات المصرية و/أو الشامية. كل لهجة تفعلها تحصل على بطاقاتها الخاصة.",
    unlock: u(9, 1),
  },
  dialectEgyptian: { en: "Egyptian", ar: "مصري", unlock: u(9, 1) },
  dialectShami: { en: "Shami", ar: "شامي", unlock: u(9, 1) },
  femForm: { en: "Feminine", ar: "المؤنث", unlock: u(3, 8) },
  exampleLabel: { en: "Example", ar: "مثال", unlock: u(3, 8) },
  alsoLabel: { en: "Also", ar: "وأيضا", unlock: u(3, 8) },
  posAdverb: { en: "adverb", ar: "ظرف", unlock: u(3, 1) },
  posPronoun: { en: "pronoun", ar: "ضمير", unlock: u(3, 1) },
  posPhrase: { en: "phrase", ar: "عبارة", unlock: u(3, 1) },
  posSuffix: { en: "suffix", ar: "لاحقة", unlock: u(3, 1) },
  navGrammar: { en: "Grammar", ar: "قواعد", unlock: u(2, 3) },

  // --- level setup ---
  setupTitle: { en: "Where are you in the course?", ar: "أين أنت في المقرر؟", unlock: u(3, 5) },
  setupHelp: {
    en: "Pick your current book and unit. You'll see words up to and including this unit.",
    ar: "اختر كتابك ودرسك الحالي. سترى الكلمات حتى هذا الدرس.",
    unlock: u(3, 6),
  },
  setupContinue: { en: "Continue", ar: "متابعة", unlock: u(2, 7) },

  // --- home ---
  welcome: { en: "Welcome back", ar: "أهلا بعودتك", unlock: u(2, 5) },
  dueTitle: { en: "Due now", ar: "مستحق الآن", unlock: u(2, 8) },
  dueCount: {
    en: (n, s) => `${s} card${n === 1 ? "" : "s"} due`,
    ar: (n, s) => `${s} بطاقة مستحقة`,
    unlock: u(3, 1),
  },
  noneDue: { en: "Nothing due right now.", ar: "لا شيء مستحق الآن.", unlock: u(3, 2) },
  newCount: {
    en: (n, s) => `${s} new word${n === 1 ? "" : "s"} to learn`,
    ar: (n, s) => `${s} كلمة جديدة للتعلم`,
    unlock: u(3, 3),
  },
  progressTitle: { en: "Your vocabulary", ar: "مفرداتك", unlock: u(3, 4) },
  statusNew: { en: "New", ar: "جديدة", unlock: u(3, 6) },
  statusLearning: { en: "Learning", ar: "قيد التعلم", unlock: u(3, 7) },
  statusProficient: { en: "Proficient", ar: "متقنة", unlock: u(3, 9) },
  statusMastered: { en: "Mastered", ar: "محفوظة", unlock: u(4, 2) },

  // --- learn ---
  learnNew: { en: "Learn new words", ar: "تعلم كلمات جديدة", unlock: u(3, 2) },
  reviewDue: { en: "Review", ar: "مراجعة", unlock: u(2, 9) },
  gotIt: { en: "Got it", ar: "فهمت", unlock: u(2, 6) },
  showAnswer: { en: "Show answer", ar: "أظهر الإجابة", unlock: u(2, 3) },
  hard: { en: "Hard", ar: "صعب", unlock: u(2, 5) },
  good: { en: "Good", ar: "جيد", unlock: u(2, 6) },
  easy: { en: "Easy", ar: "سهل", unlock: u(2, 7) },
  sessionDone: { en: "All caught up!", ar: "أحسنت! أنهيت كل شيء", unlock: u(3, 3) },
  nextCardIn: {
    en: (t) => `Next card in ${t}`,
    ar: (t) => `البطاقة التالية بعد ${t}`,
    unlock: u(3, 5),
  },
  noNewWords: { en: "No new words at your level.", ar: "لا كلمات جديدة في مستواك.", unlock: u(3, 6) },
  cardOf: { en: (i, n) => `${i} of ${n}`, ar: (i, n) => `${i} من ${n}`, unlock: u(3, 1) },

  // --- geography game (words are unlocked where the book teaches them) ---
  geoTitle: { en: "Geography game", ar: "لعبة الجغرافيا", unlock: u(2, 6) },
  geoCountry: { en: "country", ar: "بلد", unlock: u(2, 2) },
  geoBest: { en: "Best", ar: "أحسن", unlock: u(2, 5) },
  geoStart: { en: "Start", ar: "البدء", unlock: u(2, 9) },
  geoCapital: { en: "capital", ar: "عاصمة", unlock: u(3, 4) },
  geoStop: { en: "Stop", ar: "التوقف", unlock: u(3, 6) },

  // --- grammar ---
  grammarIntro: {
    en: "Sections unlock as you move through the units.",
    ar: "تفتح الأقسام كلما تقدمت في الدروس.",
    unlock: u(3, 4),
  },
  grammarNext: {
    en: (where) => `Next section unlocks at ${where}`,
    ar: (where) => `القسم التالي يفتح عند ${where}`,
    unlock: u(3, 4),
  },
  grammarAllUnlocked: { en: "All sections unlocked.", ar: "فتحت كل الأقسام.", unlock: u(3, 4) },
  yourWords: { en: "Examples from your word list", ar: "أمثلة من قائمة كلماتك", unlock: u(3, 2) },
  grammarLinks: { en: "Grammar", ar: "قواعد", unlock: u(2, 3) },

  // --- lookup ---
  searchPlaceholder: {
    en: "Search a word, root, or meaning…",
    ar: "ابحث عن كلمة أو جذر أو معنى…",
    unlock: u(3, 1),
  },
  noResults: { en: "No matching words.", ar: "لا توجد نتائج.", unlock: u(3, 2) },
  sameRoot: { en: "Same root", ar: "من الجذر نفسه", unlock: u(3, 4) },

  // --- word fields ---
  root: { en: "Root", ar: "الجذر", unlock: u(2, 2) },
  form: { en: "Form", ar: "الوزن", unlock: u(3, 1) },
  pos: { en: "Type", ar: "النوع", unlock: u(3, 3) },
  prepositions: { en: "Prepositions", ar: "حروف الجر", unlock: u(3, 5) },
  plural: { en: "Plural", ar: "الجمع", unlock: u(2, 8) },
  masdar: { en: "Verbal noun", ar: "المصدر", unlock: u(3, 6) },
  activeParticiple: { en: "Active participle", ar: "اسم الفاعل", unlock: u(3, 7) },
  passiveParticiple: { en: "Passive participle", ar: "اسم المفعول", unlock: u(3, 7) },
  past: { en: "Past", ar: "الماضي", unlock: u(2, 9) },
  present: { en: "Present", ar: "المضارع", unlock: u(2, 9) },
  imperative: { en: "Imperative", ar: "الأمر", unlock: u(4, 3) },
  conjugations: { en: "Conjugations", ar: "التصريف", unlock: u(3, 1) },
  gender: { en: "Gender", ar: "الجنس", unlock: u(3, 8) },
  masculine: { en: "masculine", ar: "مذكر", unlock: u(3, 8) },
  feminine: { en: "feminine", ar: "مؤنث", unlock: u(3, 8) },
  unitOfBook: { en: "Book / Unit", ar: "الكتاب / الدرس", unlock: u(3, 9) },
  notes: { en: "Notes", ar: "ملاحظات", unlock: u(3, 10) },
  notStored: {
    en: "Not auto-generated; add to words.json:",
    ar: "لم يتم توليده تلقائيا؛ أضفه إلى words.json:",
    unlock: u(9, 1),
  },

  // --- parts of speech ---
  posNoun: { en: "noun", ar: "اسم", unlock: u(2, 10) },
  posVerb: { en: "verb", ar: "فعل", unlock: u(2, 10) },
  posAdjective: { en: "adjective", ar: "صفة", unlock: u(2, 12) },
  posParticle: { en: "particle", ar: "حرف", unlock: u(2, 12) },
  posOther: { en: "other", ar: "أخرى", unlock: u(3, 1) },

  // --- persons ---
  "person.1s": { en: "I", ar: "أنا", unlock: u(2, 9) },
  "person.2ms": { en: "you (m.)", ar: "أنتَ", unlock: u(2, 9) },
  "person.2fs": { en: "you (f.)", ar: "أنتِ", unlock: u(2, 9) },
  "person.2d": { en: "you two", ar: "أنتما", unlock: u(3, 3) },
  "person.2mp": { en: "you all (m.)", ar: "أنتم", unlock: u(2, 9) },
  "person.2fp": { en: "you all (f.)", ar: "أنتنّ", unlock: u(3, 3) },
  "person.3ms": { en: "he", ar: "هو", unlock: u(2, 9) },
  "person.3fs": { en: "she", ar: "هي", unlock: u(2, 9) },
  "person.3md": { en: "they two (m.)", ar: "هما", unlock: u(3, 3) },
  "person.3fd": { en: "they two (f.)", ar: "هما (مؤنث)", unlock: u(3, 3) },
  "person.3mp": { en: "they (m.)", ar: "هم", unlock: u(2, 9) },
  "person.3fp": { en: "they (f.)", ar: "هنّ", unlock: u(3, 3) },
  "person.1p": { en: "we", ar: "نحن", unlock: u(2, 9) },
};

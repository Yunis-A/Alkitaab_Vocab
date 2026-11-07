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
    en: "Your book and unit. You see words up to and including this unit.",
    ar: "كتابك ودرسك. ترى الكلمات حتى هذا الدرس.",
    unlock: u(3, 5),
  },
  // Dialect names stay English until you decide which lesson they turn Arabic at.
  // لُغة (language) is taught in part 1, lesson 2; شامِيّ in part 1, lesson 1.
  dialectsTitle: { en: "Language", ar: "اللغة", unlock: u(2, 2) },
  dialectsHelp: {
    en: "Also learn Egyptian and/or Shami (Levantine) words. Each one you turn on gets its own flashcards.",
    ar: "تعلم أيضا الكلمات المصرية و/أو الشامية. كل لهجة تفعلها تحصل على بطاقاتها الخاصة.",
    unlock: u(3, 8),
  },
  // حِساب (account) is taught in part 2, lesson 3
  accountTitle: { en: "Account", ar: "الحساب", unlock: u(3, 3) },
  dialectEgyptian: { en: "Egyptian", ar: "مصري", unlock: u(2, 1) }, // مِصرِيّ is taught in part 1, lesson 1
  dialectShami: { en: "Shami", ar: "شامي", unlock: u(2, 1) },
  femForm: { en: "Feminine", ar: "المؤنث", unlock: u(3, 8) },
  exampleLabel: { en: "Example", ar: "مثال", unlock: u(3, 8) },
  alsoLabel: { en: "Also", ar: "وأيضا", unlock: u(3, 8) },
  posAdverb: { en: "adverb", ar: "ظرف", unlock: u(3, 1) },
  posPronoun: { en: "pronoun", ar: "ضمير", unlock: u(3, 1) },
  posPhrase: { en: "phrase", ar: "عبارة", unlock: u(3, 1) },
  posSuffix: { en: "suffix", ar: "لاحقة", unlock: u(3, 1) },

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
  progressTitle: { en: "Your vocabulary", ar: "مفرداتك", unlock: u(3, 4) },
  // Each switches to Arabic where the list teaches the word behind it:
  //   جديدة  (new, fem.)     Alif Baa lesson 4
  //   تعلم   (to learn)      Al-Kitaab part 2, lesson 2
  //   حفظ    (I memorize)    Al-Kitaab part 1, lesson 4
  // "Proficient" (متقنة) is not part of the standard curriculum, so it is NOT on the required list: it
  // just turns Arabic once the student is past Al-Kitaab part 1 (i.e. at part 2, lesson 1).
  statusNew: { en: "New", ar: "جديدة", unlock: u(1, 4) },
  statusLearning: { en: "Learning", ar: "قيد التعلم", unlock: u(3, 2) },
  statusProficient: { en: "Proficient", ar: "متقنة", unlock: u(3, 1) },
  statusMastered: { en: "Mastered", ar: "محفوظة", unlock: u(2, 4) },

  // --- learn ---
  reviewDue: { en: "Review", ar: "مراجعة", unlock: u(2, 9) },
  quickStudy: { en: "Quick study", ar: "دراسة سريعة", unlock: u(3, 6) },
  matching: { en: "Matching", ar: "مطابقة", unlock: u(3, 7) },
  studyUnits: { en: "Units to study", ar: "الدروس", unlock: u(3, 5) },
  studyLists: { en: "Lists", ar: "القوائم", unlock: u(3, 8) },
  studyListN: { en: (n, s) => `List ${s}`, ar: (n, s) => `القائمة ${s}`, unlock: u(3, 8) },
  studyVarieties: { en: "Language", ar: "اللغة", unlock: u(2, 2) },
  studyFormal: { en: "Formal (MSA)", ar: "الفصحى", unlock: u(2, 1) }, // الفُصحى is taught in part 1, lesson 1
  studyFirst: { en: "Show first", ar: "يظهر أولا", unlock: u(3, 8) },
  studyGender: { en: "Gender of countries", ar: "مذكر أم مؤنث؟", unlock: u(3, 8) },
  genderScore: { en: (n, s) => `${s} correct`, ar: (n, s) => `${s} صحيحة`, unlock: u(3, 8) },
  genderRight: { en: "Correct!", ar: "صحيح!", unlock: u(3, 8) },
  genderWrong: { en: "Not quite.", ar: "ليس صحيحا.", unlock: u(3, 8) },
  genderNext: { en: "Next", ar: "التالي", unlock: u(3, 8) },
  studyPatterns: { en: "Verb patterns", ar: "أوزان الأفعال", unlock: u(3, 8) },
  studySubmit: { en: "Submit", ar: "تأكيد", unlock: u(3, 8) },
  studyCheck: { en: "Check", ar: "تحقق", unlock: u(3, 8) },
  quadLabel: { en: "4-letter", ar: "رباعي", unlock: u(3, 8) },
  // the words for these forms are learned in the lessons where the verb patterns ask for them
  makaan: { en: "Noun of place", ar: "اسم المكان", unlock: u(3, 1) },
  passivePast: { en: "Passive past", ar: "الماضي المجهول", unlock: u(3, 7) },
  passivePresent: { en: "Passive present", ar: "المضارع المجهول", unlock: u(3, 10) },
  // The Arabic descriptions use only words from the list, so each turns Arabic in the lesson of its last word:
  //   هل (b2u1) أتذكر (b2u4) كلمة (b1u8) / أدرس (b2u1) جديدة (b1u4) / عربية (b1u10) إنجليزية (b2u1)
  //   في (b1u1) أو (b1u7) من (b1u1) / كلمة من فعل (b3u4) / بلد (b2u2) عاصمة (b3u4) / مذكر (b2u1) مؤنث (b2u1)
  modeReviewDesc: { en: "Cards that are due, spaced by your boxes.", ar: "هل أتذكر الكلمة؟", unlock: u(2, 4) },
  // تعلم (to learn) is taught in part 2 lesson 2
  modeQuickDesc: { en: "Learn the new words.", ar: "تعلم كلمة جديدة", unlock: u(3, 2) },
  // مع is a verb's preposition from part 2 lesson 4
  modeMatchingDesc: { en: "Connect the Arabic word with the English word.", ar: "كلمة عربية مع كلمة إنجليزية", unlock: u(3, 4) },
  // على is introduced as a verb's preposition at part 1 lesson 6, عن at lesson 2: prepositions may be used in
  // Arabic text from there (they are not on the list to memorize); في is a word of its own from Alif Baa 1
  modePrepositionsDesc: { en: "Prepositions with a verb.", ar: "في أو على مع فعل", unlock: u(3, 4) }, // فعل is taught in part 2 lesson 4
  modePatternsDesc: { en: "Build every form of a verb pattern from one.", ar: "كلمة من فعل", unlock: u(3, 4) },
  modeGenderDesc: { en: "Is the country masculine or feminine?", ar: "بلد مذكر أو مؤنث؟", unlock: u(2, 2) },
  modeGeoDesc: { en: "Find each country or capital on the map, against the clock.", ar: "بلد وعاصمة", unlock: u(3, 4) },
  // Typing lessons. The Arabic card description uses list words (يكتب b2u4, كلمة b1u8); the rest turns Arabic later.
  studyTyping: { en: "Typing lessons", ar: "دروس الطباعة", unlock: u(3, 8) },
  modeTypingDesc: { en: "Learn the Arabic keyboard, two letters at a time.", ar: "يكتب كلمة", unlock: u(2, 4) },
  typingLesson: { en: (n, s) => `Lesson ${s}`, ar: (n, s) => `درس ${s}`, unlock: u(1, 5) }, // درس is taught in Alif Baa lesson 5
  typingNewLetters: { en: "New letters", ar: "حروف جديدة", unlock: u(3, 8) },
  typingMistakes: { en: "Mistakes", ar: "أخطاء", unlock: u(3, 8) },
  typingAccuracy: { en: "Accuracy", ar: "الدقة", unlock: u(3, 8) },
  typingSpeed: { en: "Characters per minute", ar: "حرف في الدقيقة", unlock: u(3, 8) },
  typingPassed: { en: "Lesson passed!", ar: "نجحت في الدرس!", unlock: u(3, 8) },
  typingNotYet: { en: "Not yet", ar: "ليس بعد", unlock: u(3, 8) },
  typingNeeded: {
    en: (a, c) => `To pass: at least ${a}% accuracy and ${c} characters per minute.`,
    ar: (a, c) => `للنجاح: دقة ${a}٪ على الأقل و${c} حرفا في الدقيقة.`,
    unlock: u(3, 8),
  },
  typingMin: { en: (a, c) => `${a}% · ${c}/min`, ar: (a, c) => `${a}٪ · ${c}/د`, unlock: u(3, 8) },
  typingRetry: { en: "Try again", ar: "حاول مرة أخرى", unlock: u(3, 8) },
  typingNext: { en: "Next lesson", ar: "الدرس التالي", unlock: u(3, 8) },
  // Sun and moon letters: شمس (sun) and قمر (moon) are taught in Alif Baa lesson 9, where the game unlocks
  studySunMoon: { en: "Sun letters and moon letters", ar: "الحروف الشمسية والقمرية", unlock: u(3, 8) },
  modeSunMoonDesc: { en: "Is the letter a sun letter or a moon letter?", ar: "شمس أو قمر؟", unlock: u(1, 9) },
  sunLetter: { en: "Sun", ar: "شمس", unlock: u(1, 9) },
  moonLetter: { en: "Moon", ar: "قمر", unlock: u(1, 9) },
  geoGamesTitle: { en: "Geography games", ar: "ألعاب الجغرافيا", unlock: u(2, 6) },
  modeGeoGamesDesc: { en: "Various geography games.", ar: "بلد وعاصمة، مذكر أو مؤنث", unlock: u(3, 4) },
  // Verbs: فعل is taught in part 2 lesson 4, تمرين (exercise) in Alif Baa lesson 8, يكتب in part 1 lesson 4
  studyVerbs: { en: "Verbs", ar: "فعل", unlock: u(3, 4) },
  modeVerbsDesc: { en: "Prepositions, verb forms and conjugation.", ar: "فعل مع في أو على", unlock: u(3, 4) },
  studyConjugation: { en: "Conjugate the verb", ar: "التصريف", unlock: u(3, 8) },
  modeConjugationDesc: { en: "Given a root, build the verb for a pronoun.", ar: "هو يكتب كلمة", unlock: u(2, 4) },
  conjTenses: { en: "Type", ar: "النوع", unlock: u(1, 8) },
  conjPronouns: { en: "Pronouns", ar: "الضمائر", unlock: u(3, 8) },
  conjMarks: { en: "Vowel marks required", ar: "الحركات ضرورية", unlock: u(3, 8) },
  singular: { en: "Singular", ar: "المفرد", unlock: u(3, 8) },
  appearance: { en: "Appearance", ar: "المظهر", unlock: u(3, 8) },
  darkMode: { en: "Dark mode", ar: "الوضع الداكن", unlock: u(3, 8) },
  // Crosswords: one per unit from part 1. The Arabic description uses words of the list (كلمة, كل, درس, في).
  crosswordTitle: { en: "Crosswords", ar: "الكلمات المتقاطعة", unlock: u(3, 8) },
  modeCrosswordDesc: { en: "A crossword for each unit.", ar: "كلمة في كل درس", unlock: u(2, 4) },
  crossAcross: { en: "Across", ar: "أفقي", unlock: u(3, 8) },
  crossDown: { en: "Down", ar: "عمودي", unlock: u(3, 8) },
  crossClear: { en: "Clear", ar: "امسح", unlock: u(3, 8) },
  crossDone: { en: "Well done! The crossword is complete.", ar: "أحسنت! اكتمل الحل.", unlock: u(3, 8) },
  // Word searches: one per unit from part 1. The Arabic description uses words of the list (كلمة, كل, درس, في).
  wordSearchTitle: { en: "Word search", ar: "البحث عن الكلمات", unlock: u(3, 8) },
  modeWordSearchDesc: { en: "Find the words of each unit.", ar: "كلمة في كل درس", unlock: u(2, 4) },
  wordSearchDone: { en: "Well done! You found every word.", ar: "أحسنت! وجدت كل الكلمات.", unlock: u(3, 8) },
  // The student's name
  welcomeName: { en: (n) => `Welcome back, ${n}`, ar: (n) => `أهلا بعودتك يا ${n}`, unlock: u(2, 5) }, // يا is taught in Alif Baa lesson 3
  nameLabel: { en: "Your name", ar: "اسمك", unlock: u(1, 2) }, // اِسم and ـكَ are taught in Alif Baa lesson 2
  nameEnLabel: { en: "Your name in English", ar: "اسمك بالإنجليزية", unlock: u(2, 1) }, // إنجليزي is taught in part 1 lesson 1
  nameArLabel: { en: "Your name in Arabic", ar: "اسمك بالعربية", unlock: u(2, 1) },
  nameArAsk: { en: "Write your name in Arabic", ar: "اكتب اسمك بالعربية", unlock: u(3, 8) },
  nameLater: { en: "Later", ar: "لاحقا", unlock: u(3, 8) },
  editSave: { en: "Save", ar: "احفظ", unlock: u(3, 8) },
  editCancel: { en: "Cancel", ar: "ألغ", unlock: u(3, 8) },
  customFormsNote: { en: "Irregular verbs (with a weak letter, a hamza or a doubled letter) may be generated wrongly. Check the forms, and edit them if needed.", ar: "قد تكون صيغ الأفعال الشاذة خاطئة. تحقق منها وعدلها إذا لزم.", unlock: u(3, 8) },
  customFormsEdit: { en: "Edit the forms", ar: "عدل الصيغ", unlock: u(3, 8) },
  customFormsEdited: { en: "The forms were edited by you.", ar: "عدلت الصيغ بنفسك.", unlock: u(3, 8) },
  customFormsReset: { en: "Back to the generated forms", ar: "العودة إلى الصيغ المولدة", unlock: u(3, 8) },
  // Adding words from class (Lookup). Arabic wording only where the list teaches it; the rest follows later.
  addWordTitle: { en: "Add a word", ar: "أضف كلمة", unlock: u(3, 8) },
  addWordHelp: { en: "A word from class that is not on your list yet. Check first: it may be in a later lesson, and you can add it now.", ar: "كلمة من الدرس ليست في قائمتك. تحقق أولا: قد تكون في درس لاحق ويمكنك إضافتها الآن.", unlock: u(3, 8) },
  addWordArabic: { en: "Arabic word", ar: "الكلمة بالعربية", unlock: u(3, 8) },
  addWordMeaning: { en: "Meaning (English)", ar: "المعنى بالإنجليزية", unlock: u(3, 8) },
  addWordMatches: { en: "On the course list:", ar: "في قائمة المقرر:", unlock: u(3, 8) },
  addWordHave: { en: "already on your list", ar: "في قائمتك", unlock: u(3, 8) },
  addWordNow: { en: "Add it now", ar: "أضفها الآن", unlock: u(3, 8) },
  addWordEarly: { en: "added early", ar: "أضيفت", unlock: u(3, 8) },
  addWordPastVowel: { en: "Past", ar: "الماضي", unlock: u(2, 9) },
  addWordPresentVowel: { en: "Present", ar: "المضارع", unlock: u(2, 4) },
  addWordSubmit: { en: "Add to my words", ar: "أضف إلى كلماتي", unlock: u(3, 8) },
  addWordNeed: { en: "Enter the Arabic word, its meaning and its type.", ar: "اكتب الكلمة ومعناها ونوعها.", unlock: u(3, 8) },
  addWordAdded: { en: "Added. It is now in your search, your review and your games.", ar: "أضيفت. هي الآن في بحثك ومراجعتك وألعابك.", unlock: u(3, 8) },
  addWordRemove: { en: "Remove", ar: "احذف", unlock: u(3, 8) },
  myWordsTitle: { en: "My words", ar: "كلماتي", unlock: u(3, 8) },
  myWord: { en: "My word", ar: "كلمتي", unlock: u(3, 8) },
  conjHint: { en: "Show the meaning", ar: "أظهر المعنى", unlock: u(3, 8) },
  // مع is a verb's preposition from part 2 lesson 4; بِدون is taught in part 2 lesson 5
  studyArticle: { en: "With ال or not?", ar: "مع ال أو بدون؟", unlock: u(3, 5) },
  modeArticleDesc: { en: "Does the country's name take ال?", ar: "بلد: ال أو لا؟", unlock: u(2, 2) },
  articleWith: { en: "with ال", ar: "مع ال", unlock: u(3, 4) },
  articleWithout: { en: "without ال", ar: "بدون ال", unlock: u(3, 5) },
  studyNoUnits: { en: "Pick at least one unit with words.", ar: "اختر درسا فيه كلمات.", unlock: u(3, 8) },
  studyExit: { en: "Exit", ar: "خروج", unlock: u(3, 8) },
  studyDone: {
    en: "Congratulations! All the words are easy now.",
    ar: "مبروك! كل الكلمات سهلة الآن.",
    unlock: u(3, 8),
  },
  studyKeepGoing: { en: "Keep going", ar: "تابع", unlock: u(3, 8) },
  studyRestart: { en: "Start over", ar: "ابدأ من جديد", unlock: u(3, 8) },
  matchNext: { en: "Next round", ar: "الجولة التالية", unlock: u(3, 8) },
  matchDone: { en: "All matched!", ar: "أحسنت! طابقت الكل", unlock: u(3, 8) },
  showAnswer: { en: "Show answer", ar: "أظهر الإجابة", unlock: u(2, 3) },
  hard: { en: "Hard", ar: "صعب", unlock: u(2, 5) },
  medium: { en: "Medium", ar: "متوسط", unlock: u(2, 6) },
  easy: { en: "Easy", ar: "سهل", unlock: u(2, 7) },
  sessionDone: { en: "All caught up!", ar: "أحسنت! أنهيت كل شيء", unlock: u(3, 3) },
  nextCardIn: {
    en: (t) => `Next card in ${t}`,
    ar: (t) => `البطاقة التالية بعد ${t}`,
    unlock: u(3, 5),
  },
  cardOf: { en: (i, n) => `${i} of ${n}`, ar: (i, n) => `${i} من ${n}`, unlock: u(3, 1) },

  // --- geography game (words are unlocked where the book teaches them) ---
  // "English" is learned in Al-Kitaab part 1, lesson 1. TODO: set the exact Alif Baa lesson for "Arabic"
  // (it is temporarily unlocked together with "English").
  geoEnglish: { en: "English", ar: "إنجليزي", unlock: u(2, 1) },
  geoArabic: { en: "Arabic", ar: "عربي", unlock: u(1, 10) }, // عَرَبِيّ is taught in Alif Baa lesson 10
  geoTitle: { en: "Geography game", ar: "لعبة الجغرافيا", unlock: u(2, 6) },
  geoCountry: { en: "country", ar: "بلد", unlock: u(2, 2) },
  geoBest: { en: "Best", ar: "أحسن", unlock: u(2, 5) },
  geoStart: { en: "Start", ar: "البدء", unlock: u(2, 9) },
  geoCapital: { en: "capital", ar: "عاصمة", unlock: u(3, 4) },
  geoStop: { en: "Stop", ar: "التوقف", unlock: u(3, 6) },

  // --- lookup ---
  searchPlaceholder: {
    en: "Search a word, root, or meaning…",
    ar: "ابحث عن كلمة أو جذر أو معنى…",
    unlock: u(3, 1),
  },
  noResults: { en: "No matching words.", ar: "لا توجد نتائج.", unlock: u(3, 2) },
  filterType: { en: "Type", ar: "النوع", unlock: u(3, 1) },
  filterFrom: { en: "From", ar: "من", unlock: u(2, 3) },
  filterTo: { en: "To", ar: "إلى", unlock: u(2, 3) },
  filterForm: { en: "Verb form", ar: "وزن الفعل", unlock: u(3, 1) },
  filterStatus: { en: "Status", ar: "الحالة", unlock: u(3, 1) },
  filterDialect: { en: "Dialect form", ar: "صيغة لهجية", unlock: u(9, 1) },
  filterSort: { en: "Sort", ar: "الترتيب", unlock: u(3, 1) },
  sortNewest: { en: "Newest lessons first", ar: "الأحدث أولاً", unlock: u(3, 1) },
  sortOldest: { en: "Oldest lessons first", ar: "الأقدم أولاً", unlock: u(3, 1) },
  // بداية and نهاية are both introduced in Al-Kitaab part 2, lesson 1
  filterBeginning: { en: "Beginning", ar: "البداية", unlock: u(3, 1) },
  filterEnd: { en: "End", ar: "النهاية", unlock: u(3, 1) },
  filterAny: { en: "Any", ar: "الكل", unlock: u(2, 3) },
  filterReset: { en: "Clear filters", ar: "مسح التصفية", unlock: u(3, 1) },
  resultsCount: {
    en: (n, s) => `${s} word${n === 1 ? "" : "s"}`,
    ar: (n, s) => `${s} كلمة`,
    unlock: u(3, 1),
  },
  sameRoot: { en: "Same root", ar: "من الجذر نفسه", unlock: u(3, 4) },

  // --- word fields ---
  root: { en: "Root", ar: "الجذر", unlock: u(2, 2) },
  form: { en: "Form", ar: "الوزن", unlock: u(3, 1) },
  pos: { en: "Type", ar: "النوع", unlock: u(3, 3) },
  prepositions: { en: "Prepositions", ar: "حروف الجر", unlock: u(3, 5) },
  plural: { en: "Plural", ar: "الجمع", unlock: u(2, 8) },
  masdar: { en: "Verbal noun", ar: "المصدر", unlock: u(2, 6) },
  activeParticiple: { en: "Active participle", ar: "اسم الفاعل", unlock: u(3, 5) },
  passiveParticiple: { en: "Passive participle", ar: "اسم المفعول", unlock: u(3, 8) },
  past: { en: "Past", ar: "الماضي", unlock: u(2, 9) },
  present: { en: "Present", ar: "المضارع", unlock: u(2, 4) },
  imperative: { en: "Imperative", ar: "الأمر", unlock: u(4, 3) },
  conjugations: { en: "Conjugations", ar: "التصريف", unlock: u(3, 1) },
  gender: { en: "Gender", ar: "الجنس", unlock: u(3, 8) },
  // مُذَكَّر and مُؤَنَّث are taught in part 1, lesson 1
  masculine: { en: "masculine", ar: "مذكر", unlock: u(2, 1) },
  feminine: { en: "feminine", ar: "مؤنث", unlock: u(2, 1) },
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
  // (the labels turn Arabic where each pronoun is learned, see PERSON_FROM in lib/conjugation.js; أنا waits one
  // lesson so that the site starts fully in English)
  "person.1s": { en: "I", ar: "أنا", unlock: u(1, 2) },
  "person.2ms": { en: "you (m.)", ar: "أنتَ", unlock: u(1, 2) },
  "person.2fs": { en: "you (f.)", ar: "أنتِ", unlock: u(1, 2) },
  "person.2d": { en: "you two", ar: "أنتما", unlock: u(3, 5) },
  "person.2mp": { en: "you all (m.)", ar: "أنتم", unlock: u(2, 2) },
  "person.2fp": { en: "you all (f.)", ar: "أنتنّ", unlock: u(3, 7) },
  "person.3ms": { en: "he", ar: "هو", unlock: u(1, 4) },
  "person.3fs": { en: "she", ar: "هي", unlock: u(1, 4) },
  "person.3md": { en: "they two (m.)", ar: "هما", unlock: u(3, 5) },
  "person.3fd": { en: "they two (f.)", ar: "هما (مؤنث)", unlock: u(3, 5) },
  "person.3mp": { en: "they (m.)", ar: "هم", unlock: u(2, 2) },
  "person.3fp": { en: "they (f.)", ar: "هنّ", unlock: u(3, 7) },
  "person.1p": { en: "we", ar: "نحن", unlock: u(2, 2) },
};

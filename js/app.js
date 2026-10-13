// ----------------------
// BOOK CONFIG
// ----------------------
const formatter = new Intl.NumberFormat("ar-EG");

const books = {
  1: { name: "Alif Baa", color: "#f36523", maxUnits: 10 },
  2: { name: "الكتاب ١", color: "#d3232a", maxUnits: 13 },
  3: { name: "الكتاب ٢", color: "#0a1f7d", maxUnits: 10 },
  4: { name: "الكتاب ٣", color: "#6d2770", maxUnits: 10 },
};

const STORAGE_KEYS = {
  book: "alkitaab_book",
  unit: "alkitaab_unit",
  srs: "alkitaab_srs",
  quizStats: "alkitaab_quiz_stats",
};

// ----------------------
// UI TEXT DATABASE
// ----------------------
const uiText = {
  siteTitle: {
    english: "Al-Kitaab Adaptive Learning",
    arabic: "التعلم التكيفي للكتاب",
    introBook: 2,
  },
  home: {
    english: "Home",
    arabic: "الرئيسية",
    introBook: 3,
  },
  learn: {
    english: "Learn",
    arabic: "تعلّم",
    introBook: 2,
  },
  lookup: {
    english: "Lookup",
    arabic: "بحث",
    introBook: 2,
  },
  quiz: {
    english: "Quiz",
    arabic: "اختبار",
    introBook: 2,
  },
  grammar: {
    english: "Grammar",
    arabic: "قواعد",
    introBook: 3,
  },
  bookLabel: {
    english: "Book:",
    arabic: "الكتاب:",
    introBook: 3,
  },
  unitLabel: {
    english: "Unit:",
    arabic: "الدرس:",
    introBook: 2,
  },
  welcome: {
    english: "Welcome to your dashboard",
    arabic: "مرحباً بك في لوحة التحكم",
    introBook: 2,
  },
  statusTitle: {
    english: "Current Progress",
    arabic: "التقدم الحالي",
    introBook: 3,
  },
  dueTitle: {
    english: "Cards due today",
    arabic: "البطاقات المستحقة اليوم",
    introBook: 3,
  },
  dueNone: {
    english: "No cards due — great work!",
    arabic: "لا توجد بطاقات مستحقة — أحسنت!",
    introBook: 3,
  },
  dueCount: {
    english: (n) => `${n} card${n === 1 ? "" : "s"} due`,
    arabic: (n) => `${formatter.format(n)} بطاقة مستحقة`,
    introBook: 3,
  },
  quickLinks: {
    english: "Quick links",
    arabic: "روابط سريعة",
    introBook: 3,
  },
  startLearning: {
    english: "Start learning",
    arabic: "ابدأ التعلّم",
    introBook: 2,
  },
  searchPlaceholder: {
    english: "Search by word, root, or definition…",
    arabic: "ابحث بالكلمة أو الجذر أو المعنى…",
    introBook: 3,
  },
  noResults: {
    english: "No matching words.",
    arabic: "لا توجد نتائج.",
    introBook: 3,
  },
  showAnswer: {
    english: "Show answer",
    arabic: "أظهر الإجابة",
    introBook: 2,
  },
  again: { english: "Again", arabic: "مرة أخرى", introBook: 2 },
  hard: { english: "Hard", arabic: "صعب", introBook: 2 },
  good: { english: "Good", arabic: "جيد", introBook: 2 },
  easy: { english: "Easy", arabic: "سهل", introBook: 2 },
  sessionDone: {
    english: "Session complete!",
    arabic: "انتهت الجلسة!",
    introBook: 2,
  },
  noDueCards: {
    english: "Nothing due in this scope. Try another unit or add new words.",
    arabic: "لا شيء مستحق في هذا النطاق. جرّب درساً آخر.",
    introBook: 3,
  },
  quizScope: {
    english: "Scope",
    arabic: "النطاق",
    introBook: 3,
  },
  scopeUnit: {
    english: "Current unit",
    arabic: "الدرس الحالي",
    introBook: 3,
  },
  scopeBook: {
    english: "Current book",
    arabic: "الكتاب الحالي",
    introBook: 3,
  },
  scopeAll: {
    english: "All unlocked",
    arabic: "كل المتاح",
    introBook: 3,
  },
  quizType: {
    english: "Quiz type",
    arabic: "نوع الاختبار",
    introBook: 3,
  },
  typeArEn: {
    english: "Arabic → English",
    arabic: "عربي ← إنجليزي",
    introBook: 2,
  },
  typeEnAr: {
    english: "English → Arabic",
    arabic: "إنجليزي ← عربي",
    introBook: 2,
  },
  typeConj: {
    english: "Conjugation",
    arabic: "تصريف",
    introBook: 3,
  },
  startQuiz: {
    english: "Start quiz",
    arabic: "ابدأ الاختبار",
    introBook: 2,
  },
  nextQuestion: {
    english: "Next",
    arabic: "التالي",
    introBook: 2,
  },
  submitAnswer: {
    english: "Check",
    arabic: "تحقق",
    introBook: 2,
  },
  quizScore: {
    english: "Score",
    arabic: "النتيجة",
    introBook: 2,
  },
  correct: {
    english: "Correct!",
    arabic: "صحيح!",
    introBook: 2,
  },
  incorrect: {
    english: "Incorrect",
    arabic: "خطأ",
    introBook: 2,
  },
  finishQuiz: {
    english: "Finish",
    arabic: "إنهاء",
    introBook: 2,
  },
  flipDirection: {
    english: "Card direction",
    arabic: "اتجاه البطاقة",
    introBook: 3,
  },
};

// ----------------------
// STATE
// ----------------------
function getSavedBook() {
  const v = Number(localStorage.getItem(STORAGE_KEYS.book));
  return books[v] ? v : 1;
}

function getSavedUnit() {
  const book = getSavedBook();
  const v = Number(localStorage.getItem(STORAGE_KEYS.unit));
  if (!v || v < 1 || v > books[book].maxUnits) return 1;
  return v;
}

function getState() {
  const bookEl = document.getElementById("book");
  const unitEl = document.getElementById("unit");
  return {
    book: bookEl ? Number(bookEl.value) : getSavedBook(),
    unit: unitEl ? Number(unitEl.value) : getSavedUnit(),
  };
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEYS.book, String(state.book));
  localStorage.setItem(STORAGE_KEYS.unit, String(state.unit));
}

// ----------------------
// LANGUAGE / THEME
// ----------------------
function getText(item, state) {
  if (typeof item.english === "function") {
    return state.book >= item.introBook ? item.arabic : item.english;
  }
  if (state.book >= item.introBook) return item.arabic;
  return item.english;
}

function formatText(item, state, ...args) {
  const fn = state.book >= item.introBook ? item.arabic : item.english;
  return typeof fn === "function" ? fn(...args) : fn;
}

function applyTheme(book) {
  document.documentElement.style.setProperty(
    "--theme-color",
    books[book].color,
  );
}

function applyDir(state) {
  // Flip chrome to RTL once several labels are Arabic (book 3+)
  document.documentElement.lang = state.book >= 3 ? "ar" : "en";
  document.documentElement.dir = state.book >= 3 ? "rtl" : "ltr";
}

function updateUnitOptions(book, preferredUnit) {
  const unitSelect = document.getElementById("unit");
  if (!unitSelect) return;

  const keep = preferredUnit ?? (Number(unitSelect.value) || 1);
  unitSelect.innerHTML = "";

  for (let i = 1; i <= books[book].maxUnits; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    if (book === 1) {
      opt.textContent = `Unit ${i}`;
    } else {
      opt.textContent = `درس ${formatter.format(i)}`;
    }
    unitSelect.appendChild(opt);
  }

  unitSelect.value = String(
    Math.min(Math.max(1, keep), books[book].maxUnits),
  );
}

function setActiveNav(page) {
  document.querySelectorAll("nav a[data-page]").forEach((a) => {
    a.classList.toggle("active", a.dataset.page === page);
  });
}

function updateSharedUI() {
  const state = getState();
  saveState(state);
  applyTheme(state.book);
  applyDir(state);

  const title = document.getElementById("site-title");
  if (title) title.textContent = getText(uiText.siteTitle, state);

  const map = [
    ["nav-home", uiText.home],
    ["nav-learn", uiText.learn],
    ["nav-lookup", uiText.lookup],
    ["nav-quiz", uiText.quiz],
    ["nav-grammar", uiText.grammar],
    ["label-book", uiText.bookLabel],
    ["label-unit", uiText.unitLabel],
  ];

  for (const [id, item] of map) {
    const el = document.getElementById(id);
    if (el) el.textContent = getText(item, state);
  }

  document.dispatchEvent(new CustomEvent("alkitaab:statechange", { detail: state }));
}

function initShell(page) {
  const bookSelect = document.getElementById("book");
  const unitSelect = document.getElementById("unit");
  if (!bookSelect || !unitSelect) return;

  const savedBook = getSavedBook();
  const savedUnit = getSavedUnit();
  bookSelect.value = String(savedBook);
  updateUnitOptions(savedBook, savedUnit);
  setActiveNav(page);
  updateSharedUI();

  bookSelect.addEventListener("change", () => {
    updateUnitOptions(Number(bookSelect.value), 1);
    updateSharedUI();
  });

  unitSelect.addEventListener("change", updateSharedUI);
}

window.AlKitaab = {
  books,
  formatter,
  STORAGE_KEYS,
  uiText,
  getState,
  saveState,
  getText,
  formatText,
  applyTheme,
  updateSharedUI,
  initShell,
};

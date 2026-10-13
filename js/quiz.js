AlKitaab.initShell("quiz");

let allWords = [];
let questions = [];
let qIndex = 0;
let score = 0;
let missed = [];
let answered = false;

const PERSON_LABELS = {
  "1s": "I (1st singular)",
  "2ms": "you m.s.",
  "2fs": "you f.s.",
  "3ms": "he / it m.",
  "3fs": "she / it f.",
  "1p": "we",
  "2mp": "you m.pl.",
  "2fp": "you f.pl.",
  "3mp": "they m.",
  "3fp": "they f.",
};

function updateSetupLabels() {
  const state = AlKitaab.getState();
  const { uiText, getText } = AlKitaab;

  document.getElementById("label-quiz-scope").textContent = getText(
    uiText.quizScope,
    state,
  );
  document.getElementById("label-quiz-type").textContent = getText(
    uiText.quizType,
    state,
  );
  document.getElementById("btn-start-quiz").textContent = getText(
    uiText.startQuiz,
    state,
  );
  document.getElementById("btn-next-q").textContent = getText(
    uiText.nextQuestion,
    state,
  );
  document.getElementById("btn-check-conj").textContent = getText(
    uiText.submitAnswer,
    state,
  );
  document.getElementById("quiz-score-title").textContent = getText(
    uiText.quizScore,
    state,
  );
  document.getElementById("btn-quiz-again").textContent = getText(
    uiText.startQuiz,
    state,
  );

  const scope = document.getElementById("quiz-scope");
  scope.options[0].text = getText(uiText.scopeUnit, state);
  scope.options[1].text = getText(uiText.scopeBook, state);
  scope.options[2].text = getText(uiText.scopeAll, state);

  const type = document.getElementById("quiz-type");
  type.options[0].text = getText(uiText.typeArEn, state);
  type.options[1].text = getText(uiText.typeEnAr, state);
  type.options[2].text = getText(uiText.typeConj, state);

  refreshPoolInfo();
}

function refreshPoolInfo() {
  const state = AlKitaab.getState();
  const scope = document.getElementById("quiz-scope").value;
  const type = document.getElementById("quiz-type").value;
  let pool = AlKitaabData.filterByScope(allWords, state, scope);
  if (type === "conj") {
    pool = pool.filter((w) => w.pos === "verb" && w.conjugations);
  }
  document.getElementById("quiz-pool-info").textContent =
    `${pool.length} item${pool.length === 1 ? "" : "s"} in pool`;
}

function buildMcQuestions(pool, type, count = 10) {
  const shuffled = AlKitaabData.shuffle(pool);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));

  return picked.map((word) => {
    const askArabic = type === "ar-en";
    const prompt = askArabic ? word.arabic : word.definition;
    const correct = askArabic ? word.definition : word.arabic;
    const distractorField = askArabic ? "definition" : "arabic";

    const others = AlKitaabData.shuffle(
      pool.filter((w) => w.id !== word.id),
    )
      .slice(0, 3)
      .map((w) => w[distractorField]);

    while (others.length < 3 && pool.length > 1) {
      const fill = pool[Math.floor(Math.random() * pool.length)][distractorField];
      if (fill !== correct && !others.includes(fill)) others.push(fill);
      else break;
    }

    const options = AlKitaabData.shuffle([correct, ...others].slice(0, 4));
    return {
      kind: "mc",
      word,
      prompt,
      promptDir: askArabic ? "rtl" : "ltr",
      correct,
      options,
    };
  });
}

function buildConjQuestions(pool, count = 8) {
  const verbs = pool.filter((w) => w.pos === "verb" && w.conjugations);
  const items = [];

  for (const word of AlKitaabData.shuffle(verbs)) {
    const tenses = Object.keys(word.conjugations);
    for (const tense of tenses) {
      const persons = Object.entries(word.conjugations[tense]);
      for (const [person, form] of persons) {
        items.push({ kind: "conj", word, tense, person, correct: form });
      }
    }
  }

  return AlKitaabData.shuffle(items).slice(0, Math.min(count, items.length));
}

function startQuiz() {
  const state = AlKitaab.getState();
  const scope = document.getElementById("quiz-scope").value;
  const type = document.getElementById("quiz-type").value;
  let pool = AlKitaabData.filterByScope(allWords, state, scope);

  if (type === "conj") {
    questions = buildConjQuestions(pool);
  } else {
    if (pool.length < 2) {
      alert("Need at least 2 words in this scope for a multiple-choice quiz.");
      return;
    }
    questions = buildMcQuestions(pool, type);
  }

  if (!questions.length) {
    alert("No questions available for this type/scope.");
    return;
  }

  qIndex = 0;
  score = 0;
  missed = [];
  answered = false;

  document.getElementById("quiz-setup").hidden = true;
  document.getElementById("quiz-results").hidden = true;
  document.getElementById("quiz-play").hidden = false;
  renderQuestion();
}

function renderQuestion() {
  const state = AlKitaab.getState();
  const q = questions[qIndex];
  answered = false;

  document.getElementById("quiz-progress").textContent =
    `${qIndex + 1} / ${questions.length}`;
  document.getElementById("quiz-live-score").textContent =
    `${AlKitaab.getText(AlKitaab.uiText.quizScore, state)}: ${score}`;
  document.getElementById("quiz-feedback").textContent = "";
  document.getElementById("quiz-feedback").className = "quiz-feedback";
  document.getElementById("quiz-next-row").hidden = true;

  const optionsEl = document.getElementById("quiz-options");
  const conjEl = document.getElementById("quiz-conj");
  const questionEl = document.getElementById("quiz-question");

  if (q.kind === "mc") {
    conjEl.hidden = true;
    optionsEl.hidden = false;
    questionEl.innerHTML = `<p class="prompt" dir="${q.promptDir}" style="font-size:1.75rem;font-weight:700">${AlKitaabData.escapeHtml(q.prompt)}</p>`;
    optionsEl.innerHTML = q.options
      .map(
        (opt, i) =>
          `<button type="button" class="quiz-option" data-index="${i}">${AlKitaabData.escapeHtml(opt)}</button>`,
      )
      .join("");

    optionsEl.querySelectorAll(".quiz-option").forEach((btn) => {
      btn.addEventListener("click", () => selectMc(btn));
    });
  } else {
    optionsEl.hidden = true;
    optionsEl.innerHTML = "";
    conjEl.hidden = false;
    questionEl.innerHTML = "";
    const personLabel = PERSON_LABELS[q.person] || q.person;
    document.getElementById("conj-prompt").innerHTML = `
      Conjugate <span class="arabic" dir="rtl">${AlKitaabData.escapeHtml(q.word.arabic)}</span>
      (<em>${AlKitaabData.escapeHtml(q.word.definition)}</em>)<br>
      <strong>${q.tense}</strong> — ${personLabel}
    `;
    const input = document.getElementById("conj-input");
    input.value = "";
    input.disabled = false;
    input.focus();
  }
}

function selectMc(btn) {
  if (answered) return;
  answered = true;
  const state = AlKitaab.getState();
  const q = questions[qIndex];
  const chosen = q.options[Number(btn.dataset.index)];
  const isCorrect = chosen === q.correct;

  document.querySelectorAll(".quiz-option").forEach((b) => {
    b.disabled = true;
    if (q.options[Number(b.dataset.index)] === q.correct) {
      b.classList.add("correct");
    }
  });

  if (isCorrect) {
    score += 1;
    btn.classList.add("correct");
    setFeedback(true, state);
  } else {
    btn.classList.add("wrong");
    missed.push(q.word);
    AlKitaabSrs.markAgain(q.word.id);
    setFeedback(false, state, q.correct);
  }

  document.getElementById("quiz-live-score").textContent =
    `${AlKitaab.getText(AlKitaab.uiText.quizScore, state)}: ${score}`;
  document.getElementById("quiz-next-row").hidden = false;
  maybeFinishLabel(state);
}

function checkConj() {
  if (answered) return;
  answered = true;
  const state = AlKitaab.getState();
  const q = questions[qIndex];
  const input = document.getElementById("conj-input");
  const given = normalizeArabic(input.value);
  const expected = normalizeArabic(q.correct);
  input.disabled = true;

  if (given === expected) {
    score += 1;
    setFeedback(true, state);
  } else {
    missed.push(q.word);
    AlKitaabSrs.markAgain(q.word.id);
    setFeedback(false, state, q.correct);
  }

  document.getElementById("quiz-live-score").textContent =
    `${AlKitaab.getText(AlKitaab.uiText.quizScore, state)}: ${score}`;
  document.getElementById("quiz-next-row").hidden = false;
  maybeFinishLabel(state);
}

function normalizeArabic(s) {
  return String(s)
    .trim()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, "");
}

function setFeedback(ok, state, answer) {
  const el = document.getElementById("quiz-feedback");
  el.className = "quiz-feedback " + (ok ? "ok" : "bad");
  if (ok) {
    el.textContent = AlKitaab.getText(AlKitaab.uiText.correct, state);
  } else {
    el.textContent =
      AlKitaab.getText(AlKitaab.uiText.incorrect, state) +
      (answer ? `: ${answer}` : "");
  }
}

function maybeFinishLabel(state) {
  const btn = document.getElementById("btn-next-q");
  if (qIndex >= questions.length - 1) {
    btn.textContent = AlKitaab.getText(AlKitaab.uiText.finishQuiz, state);
  } else {
    btn.textContent = AlKitaab.getText(AlKitaab.uiText.nextQuestion, state);
  }
}

function nextQuestion() {
  if (qIndex >= questions.length - 1) {
    finishQuiz();
    return;
  }
  qIndex += 1;
  renderQuestion();
}

function finishQuiz() {
  const state = AlKitaab.getState();
  document.getElementById("quiz-play").hidden = true;
  document.getElementById("quiz-results").hidden = false;

  document.getElementById("quiz-final-score").textContent =
    `${score} / ${questions.length}`;

  const uniqueMissed = [];
  const seen = new Set();
  for (const w of missed) {
    if (!seen.has(w.id)) {
      seen.add(w.id);
      uniqueMissed.push(w);
    }
  }

  const note = document.getElementById("quiz-missed-note");
  const list = document.getElementById("quiz-missed-list");
  if (uniqueMissed.length) {
    note.textContent =
      "Missed items were marked Again in your SRS queue:";
    list.innerHTML = uniqueMissed
      .map(
        (w) =>
          `<li dir="auto"><strong>${AlKitaabData.escapeHtml(w.arabic)}</strong> — ${AlKitaabData.escapeHtml(w.definition)}</li>`,
      )
      .join("");
  } else {
    note.textContent = AlKitaab.getText(AlKitaab.uiText.correct, state);
    list.innerHTML = "";
  }

  try {
    const key = AlKitaab.STORAGE_KEYS.quizStats;
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    prev.push({
      at: Date.now(),
      score,
      total: questions.length,
      book: state.book,
      unit: state.unit,
    });
    localStorage.setItem(key, JSON.stringify(prev.slice(-50)));
  } catch {
    /* ignore */
  }
}

function showSetup() {
  document.getElementById("quiz-setup").hidden = false;
  document.getElementById("quiz-play").hidden = true;
  document.getElementById("quiz-results").hidden = true;
  updateSetupLabels();
}

async function init() {
  try {
    allWords = await AlKitaabData.loadWords();
  } catch (err) {
    document.getElementById("quiz-pool-info").textContent =
      "Could not load vocabulary. Serve this folder over HTTP so data/words.json can load.";
    console.error(err);
    return;
  }

  updateSetupLabels();

  document
    .getElementById("btn-start-quiz")
    .addEventListener("click", startQuiz);
  document.getElementById("btn-next-q").addEventListener("click", nextQuestion);
  document
    .getElementById("btn-check-conj")
    .addEventListener("click", checkConj);
  document
    .getElementById("conj-input")
    .addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkConj();
    });
  document
    .getElementById("btn-quiz-again")
    .addEventListener("click", showSetup);

  document
    .getElementById("quiz-scope")
    .addEventListener("change", refreshPoolInfo);
  document
    .getElementById("quiz-type")
    .addEventListener("change", refreshPoolInfo);

  document.addEventListener("alkitaab:statechange", () => {
    if (!document.getElementById("quiz-setup").hidden) updateSetupLabels();
  });
}

init();

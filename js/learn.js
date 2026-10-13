AlKitaab.initShell("learn");

let allWords = [];
let queue = [];
let index = 0;
let revealed = false;

function currentWord() {
  return queue[index] || null;
}

function updateLabels() {
  const state = AlKitaab.getState();
  const { uiText, getText } = AlKitaab;

  document.getElementById("label-direction").textContent = getText(
    uiText.flipDirection,
    state,
  );
  document.getElementById("label-learn-scope").textContent = getText(
    uiText.quizScope,
    state,
  );
  document.getElementById("btn-reveal").textContent = getText(
    uiText.showAnswer,
    state,
  );
  document.getElementById("session-done-title").textContent = getText(
    uiText.sessionDone,
    state,
  );
  document.getElementById("learn-empty-msg").textContent = getText(
    uiText.noDueCards,
    state,
  );

  const ratings = [
    ["btn-again", "again"],
    ["btn-hard", "hard"],
    ["btn-good", "good"],
    ["btn-easy", "easy"],
  ];
  for (const [id, key] of ratings) {
    const el = document.getElementById(id);
    el.innerHTML = `${getText(uiText[key], state)}<span class="rating-hint" data-hint="${key}"></span>`;
  }

  // Scope select labels
  const scopeSel = document.getElementById("learn-scope-select");
  scopeSel.options[0].text = getText(uiText.scopeUnit, state);
  scopeSel.options[1].text = getText(uiText.scopeBook, state);
  scopeSel.options[2].text = getText(uiText.scopeAll, state);
}

function buildQueue() {
  const state = AlKitaab.getState();
  const scope = document.getElementById("learn-scope-select").value;
  const pool = AlKitaabData.filterByScope(allWords, state, scope);
  queue = AlKitaabData.shuffle(AlKitaabSrs.getDueWords(pool));
  index = 0;
  revealed = false;
}

function showEmpty() {
  document.getElementById("flashcard").hidden = true;
  document.getElementById("reveal-row").hidden = true;
  document.getElementById("rating-row").hidden = true;
  document.getElementById("learn-done").hidden = true;
  document.getElementById("learn-empty").hidden = false;
  document.getElementById("learn-progress").textContent = "";
}

function showDone() {
  document.getElementById("flashcard").hidden = true;
  document.getElementById("reveal-row").hidden = true;
  document.getElementById("rating-row").hidden = true;
  document.getElementById("learn-empty").hidden = true;
  document.getElementById("learn-done").hidden = false;
  document.getElementById("learn-progress").textContent = "";
}

function promptAnswer(word) {
  const dir = document.getElementById("card-direction").value;
  if (dir === "ar-en") {
    return {
      prompt: word.arabic,
      promptDir: "rtl",
      answer: word.definition,
      answerDir: "ltr",
    };
  }
  return {
    prompt: word.definition,
    promptDir: "ltr",
    answer: word.arabic,
    answerDir: "rtl",
  };
}

function renderCard() {
  updateLabels();
  const state = AlKitaab.getState();
  const scope = document.getElementById("learn-scope-select").value;
  document.getElementById("learn-scope").textContent =
    `Book ${state.book} · Unit ${state.unit} · ${scope}`;

  const word = currentWord();
  if (!queue.length) {
    showEmpty();
    return;
  }
  if (!word) {
    showDone();
    return;
  }

  document.getElementById("learn-empty").hidden = true;
  document.getElementById("learn-done").hidden = true;
  document.getElementById("flashcard").hidden = false;

  const { prompt, promptDir, answer, answerDir } = promptAnswer(word);
  const promptEl = document.getElementById("card-prompt");
  const answerEl = document.getElementById("card-answer");
  const hintEl = document.getElementById("card-hint");

  promptEl.textContent = prompt;
  promptEl.dir = promptDir;
  answerEl.textContent = answer;
  answerEl.dir = answerDir;
  answerEl.hidden = !revealed;

  hintEl.textContent = revealed
    ? `${word.pos}${word.form ? ` · Form ${word.form}` : ""}${word.transliteration ? ` · ${word.transliteration}` : ""}`
    : AlKitaab.getText(AlKitaab.uiText.showAnswer, state) + " (or click card)";

  document.getElementById("reveal-row").hidden = revealed;
  document.getElementById("rating-row").hidden = !revealed;

  document.getElementById("learn-progress").textContent =
    `${index + 1} / ${queue.length}`;

  if (revealed) {
    const previews = AlKitaabSrs.previewIntervals(word.id);
    document.querySelectorAll("[data-hint]").forEach((span) => {
      span.textContent = previews[span.dataset.hint] || "";
    });
  }
}

function reveal() {
  revealed = true;
  renderCard();
}

function rate(rating) {
  const word = currentWord();
  if (!word) return;
  AlKitaabSrs.review(word.id, rating);
  index += 1;
  revealed = false;
  renderCard();
}

function restartSession() {
  buildQueue();
  renderCard();
}

async function init() {
  try {
    allWords = await AlKitaabData.loadWords();
  } catch (err) {
    document.getElementById("learn-empty").hidden = false;
    document.getElementById("learn-empty-msg").textContent =
      "Could not load vocabulary. Serve this folder over HTTP so data/words.json can load.";
    console.error(err);
    return;
  }

  updateLabels();
  buildQueue();
  renderCard();

  document.getElementById("btn-reveal").addEventListener("click", reveal);
  document.getElementById("flashcard").addEventListener("click", () => {
    if (!revealed) reveal();
  });

  document.querySelectorAll("#rating-row [data-rating]").forEach((btn) => {
    btn.addEventListener("click", () => rate(btn.dataset.rating));
  });

  document
    .getElementById("card-direction")
    .addEventListener("change", () => {
      revealed = false;
      renderCard();
    });

  document
    .getElementById("learn-scope-select")
    .addEventListener("change", restartSession);

  document.getElementById("btn-restart").addEventListener("click", restartSession);

  document.addEventListener("alkitaab:statechange", restartSession);
}

init();

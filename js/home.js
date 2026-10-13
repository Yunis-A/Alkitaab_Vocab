AlKitaab.initShell("home");

let allWords = [];

async function refreshHome() {
  const state = AlKitaab.getState();
  const { uiText, getText, formatText, books } = AlKitaab;

  const welcome = document.getElementById("welcome");
  if (welcome) welcome.textContent = getText(uiText.welcome, state);

  const statusTitle = document.getElementById("status-title");
  if (statusTitle) statusTitle.textContent = getText(uiText.statusTitle, state);

  const bookName = books[state.book].name;
  document.getElementById("status").textContent =
    state.book === 1
      ? `Book ${state.book} (${bookName}), Unit ${state.unit}`
      : `${bookName} — درس ${AlKitaab.formatter.format(state.unit)}`;

  document.getElementById("due-title").textContent = getText(
    uiText.dueTitle,
    state,
  );
  document.getElementById("quick-links-title").textContent = getText(
    uiText.quickLinks,
    state,
  );

  const startLabel = getText(uiText.startLearning, state);
  document.getElementById("btn-start-learn").textContent = startLabel;
  document.getElementById("ql-learn").textContent = getText(uiText.learn, state);
  document.getElementById("ql-lookup").textContent = getText(
    uiText.lookup,
    state,
  );
  document.getElementById("ql-quiz").textContent = getText(uiText.quiz, state);
  document.getElementById("ql-grammar").textContent = getText(
    uiText.grammar,
    state,
  );

  const scoped = AlKitaabData.filterByScope(allWords, state, "all");
  const due = AlKitaabSrs.countDue(scoped);
  const dueEl = document.getElementById("due-count");
  const detail = document.getElementById("due-detail");

  if (due === 0) {
    dueEl.textContent = "0";
    detail.textContent = getText(uiText.dueNone, state);
  } else {
    dueEl.textContent = String(due);
    detail.textContent = formatText(uiText.dueCount, state, due);
  }
}

async function init() {
  try {
    allWords = await AlKitaabData.loadWords();
  } catch (err) {
    document.getElementById("due-detail").textContent =
      "Could not load vocabulary. Serve this folder over HTTP (e.g. Live Server) so data/words.json can load.";
    console.error(err);
    return;
  }

  refreshHome();
  document.addEventListener("alkitaab:statechange", refreshHome);
}

init();

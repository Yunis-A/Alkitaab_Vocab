AlKitaab.initShell("lookup");

let allWords = [];

function render() {
  const state = AlKitaab.getState();
  const input = document.getElementById("lookup-search");
  const q = input.value;

  input.placeholder = AlKitaab.getText(AlKitaab.uiText.searchPlaceholder, state);

  // Show unlocked words by default; search filters within full bank so roots across books work
  let pool = AlKitaabData.filterByScope(allWords, state, "all");
  if (q.trim()) {
    pool = AlKitaabData.searchWords(allWords, q);
  }

  const results = document.getElementById("lookup-results");
  const meta = document.getElementById("lookup-meta");

  if (!pool.length) {
    results.innerHTML = `<section class="card"><p>${AlKitaab.getText(AlKitaab.uiText.noResults, state)}</p></section>`;
    meta.textContent = "";
    return;
  }

  meta.textContent = `${pool.length} word${pool.length === 1 ? "" : "s"}`;
  results.innerHTML = pool
    .map((w) => AlKitaabData.renderWordDetail(w))
    .join("");

  AlKitaabData.bindRootLinks(results, (root) => {
    input.value = root;
    render();
    input.focus();
  });
}

async function init() {
  try {
    allWords = await AlKitaabData.loadWords();
  } catch (err) {
    document.getElementById("lookup-results").innerHTML =
      `<section class="card"><p>Could not load vocabulary. Serve this folder over HTTP so <code>data/words.json</code> can load.</p></section>`;
    console.error(err);
    return;
  }

  document.getElementById("lookup-search").addEventListener("input", render);
  document.addEventListener("alkitaab:statechange", render);
  render();
}

init();

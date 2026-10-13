/**
 * Word bank loader.
 *
 * Schema (data/words.json):
 * {
 *   id, book, unit, arabic, transliteration, definition, root,
 *   pos: "noun"|"verb"|"adjective"|"particle"|"other",
 *   form: null|1-10,          // verb form number
 *   gender: null|"masculine"|"feminine",
 *   plural: string|null,
 *   prepositions: string[],
 *   notes: string,
 *   conjugations: null | {
 *     past: { "1s","2ms","2fs","3ms","3fs","1p","2mp","2fp","3mp","3fp" },
 *     present: { ... },
 *     imperative: { "2ms","2fs","2mp","2fp" }
 *   }
 * }
 */

let _wordsCache = null;

async function loadWords() {
  if (_wordsCache) return _wordsCache;
  const res = await fetch("data/words.json");
  if (!res.ok) throw new Error(`Failed to load words.json (${res.status})`);
  _wordsCache = await res.json();
  return _wordsCache;
}

function filterByScope(words, state, scope = "unit") {
  if (scope === "unit") {
    return words.filter((w) => w.book === state.book && w.unit === state.unit);
  }
  if (scope === "book") {
    return words.filter((w) => w.book === state.book);
  }
  // all unlocked: book < selected, or same book and unit <= selected
  return words.filter((w) => {
    if (w.book < state.book) return true;
    if (w.book === state.book && w.unit <= state.unit) return true;
    return false;
  });
}

function searchWords(words, query) {
  const q = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) return words;

  const qRoot = q.replace(/\s+/g, "");
  return words.filter((w) => {
    const rootCompact = (w.root || "").replace(/\s+/g, "").toLowerCase();
    return (
      (w.arabic || "").includes(query.trim()) ||
      (w.transliteration || "").toLowerCase().includes(q) ||
      (w.definition || "").toLowerCase().includes(q) ||
      (w.root || "").toLowerCase().includes(q) ||
      rootCompact.includes(qRoot) ||
      (w.id || "").toLowerCase().includes(q)
    );
  });
}

function wordsByRoot(words, root) {
  const compact = (root || "").replace(/\s+/g, "");
  return words.filter(
    (w) => (w.root || "").replace(/\s+/g, "") === compact,
  );
}

function getWordById(words, id) {
  return words.find((w) => w.id === id) || null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderWordDetail(word, { onRootClick } = {}) {
  const rootAttr = word.root
    ? `<button type="button" class="root-link" data-root="${escapeAttr(word.root)}">${escapeHtml(word.root)}</button>`
    : "—";

  let conjHtml = "";
  if (word.conjugations) {
    conjHtml = `<div class="conj-block">${renderConjugations(word.conjugations)}</div>`;
  }

  const preps =
    word.prepositions && word.prepositions.length
      ? word.prepositions.map(escapeHtml).join(" · ")
      : "—";

  return `
    <article class="word-card card" data-id="${escapeAttr(word.id)}">
      <div class="word-head">
        <span class="word-arabic" dir="rtl">${escapeHtml(word.arabic)}</span>
        <span class="word-pos">${escapeHtml(word.pos || "")}${word.form ? ` · Form ${word.form}` : ""}</span>
      </div>
      <p class="word-def">${escapeHtml(word.definition || "")}</p>
      <p class="word-translit">${escapeHtml(word.transliteration || "")}</p>
      <dl class="word-meta">
        <div><dt>Root</dt><dd>${rootAttr}</dd></div>
        <div><dt>Book / Unit</dt><dd>${word.book} / ${word.unit}</dd></div>
        ${
          word.gender
            ? `<div><dt>Gender</dt><dd>${escapeHtml(word.gender)}</dd></div>`
            : ""
        }
        ${
          word.plural
            ? `<div><dt>Plural</dt><dd dir="rtl">${escapeHtml(word.plural)}</dd></div>`
            : ""
        }
        <div><dt>Prepositions</dt><dd dir="rtl">${preps}</dd></div>
      </dl>
      ${word.notes ? `<p class="word-notes">${escapeHtml(word.notes)}</p>` : ""}
      ${conjHtml}
    </article>
  `;
}

function renderConjugations(conj) {
  const sections = [];
  for (const tense of ["past", "present", "imperative"]) {
    if (!conj[tense]) continue;
    const rows = Object.entries(conj[tense])
      .map(
        ([person, form]) =>
          `<tr><td>${escapeHtml(person)}</td><td dir="rtl">${escapeHtml(form)}</td></tr>`,
      )
      .join("");
    sections.push(`
      <div class="conj-tense">
        <h4>${tense}</h4>
        <table><tbody>${rows}</tbody></table>
      </div>
    `);
  }
  return `<h3>Conjugations</h3><div class="conj-grid">${sections.join("")}</div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

function bindRootLinks(container, handler) {
  container.querySelectorAll(".root-link").forEach((btn) => {
    btn.addEventListener("click", () => handler(btn.dataset.root));
  });
}

window.AlKitaabData = {
  loadWords,
  filterByScope,
  searchWords,
  wordsByRoot,
  getWordById,
  shuffle,
  renderWordDetail,
  bindRootLinks,
  escapeHtml,
};

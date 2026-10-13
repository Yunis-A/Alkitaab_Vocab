/**
 * Legacy entry point — logic moved to:
 *   js/app.js   (theme, progressive UI, book/unit state)
 *   js/data.js  (words.json loader + lookup helpers)
 *   js/srs.js   (Anki-style spaced repetition)
 *   js/home.js, learn.js, lookup.js, quiz.js, grammar.js
 *
 * Open home.html via a local HTTP server so fetch("data/words.json") works.
 */
console.info(
  "Al-Kitaab: use home.html with js/app.js (this script.js is a stub).",
);

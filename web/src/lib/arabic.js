// Arabic text helpers shared by search and morphology.

export const FATHA = "َ";
export const DAMMA = "ُ";
export const KASRA = "ِ";
export const SUKUN = "ْ";
export const SHADDA = "ّ";

const DIACRITICS = /[ً-ٰٟـ]/g;

export function stripDiacritics(s) {
  return String(s ?? "").replace(DIACRITICS, "");
}

// Aggressive normalization for matching: no diacritics, unified alef/yaa/taa
// marbuta/hamza carriers.
export function normalizeArabic(s) {
  return stripDiacritics(s)
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasArabic(s) {
  return /[؀-ۿ]/.test(String(s ?? ""));
}

// Latin transliteration / English: lowercase, drop accents (ṭ -> t, ʿ removed).
export function normalizeLatin(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ʿʾʻʼ'’`]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// "ك ت ب" / "كتب" / "ك-ت-ب" -> ["ك","ت","ب"]
export function rootLetters(root) {
  return [...normalizeRootText(root)];
}

export function normalizeRootText(root) {
  return stripDiacritics(root).replace(/[\s\-.]/g, "");
}

// Country names with and without ال, for the "with ال or not" game.

import { withArticle } from "./patterns.js";

const SUN = "تثدذرزسشصضطظلن";

// "الصِّين" -> "صِين", "الأُردُن" -> "أُردُن". The shadda on a sun letter belongs to ال, so it goes with it.
export function withoutArticle(name) {
  if (!name.startsWith("ال")) return name;
  const rest = name.slice(2);
  const m = /^(.)([\u064B-\u0652]*)/.exec(rest);
  if (m && SUN.includes(m[1])) return m[1] + m[2].replace(/\u0651/g, "") + rest.slice(m[0].length);
  return rest;
}

// What the name would look like with ال added ("فَرَنسا" -> "الفَرَنسا", "صِين" -> "الصِّين").
export const addArticle = withArticle;

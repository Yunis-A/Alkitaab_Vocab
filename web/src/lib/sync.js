// Merging the progress kept in this browser with the progress saved in the student's account, used the
// first time a device signs in. The account wins for settings; for cards the more-studied copy wins and
// nothing is lost; for the map game the faster time wins; their own words are all kept.

import { mergeCustom } from "./customWords.js";

const newer = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  if (a.reviews !== b.reviews) return a.reviews > b.reviews ? a : b;
  return (a.lastReviewed ?? 0) >= (b.lastReviewed ?? 0) ? a : b;
};

// lessons passed on either side stay passed, with the faster speed and the shorter time
function mergePassed(a = {}, b = {}) {
  const out = { ...b };
  for (const [id, r] of Object.entries(a)) {
    const o = out[id];
    out[id] = !o ? r : { ...(r.cpm > o.cpm ? r : o), ms: Math.min(r.ms ?? Infinity, o.ms ?? Infinity) };
    if (out[id].ms === Infinity) delete out[id].ms;
  }
  return out;
}

export function mergeProgress(local, remote) {
  if (!remote) return local;
  const cards = { ...remote.cards };
  for (const [k, c] of Object.entries(local.cards ?? {})) cards[k] = newer(cards[k], c);
  const geoBest = { ...remote.geoBest };
  for (const [k, ms] of Object.entries(local.geoBest ?? {})) {
    geoBest[k] = geoBest[k] == null ? ms : Math.min(geoBest[k], ms);
  }
  // typing lessons: a lesson passed on either side stays passed, with its faster result
  const passed = mergePassed(local.typing?.passed, remote.typing?.passed);
  const passedHard = mergePassed(local.typing?.passedHard, remote.typing?.passedHard);
  return {
    ...local,
    ...remote,
    typing: { passed, passedHard, hard: remote.typing?.hard ?? local.typing?.hard ?? false },
    dark: remote.dark ?? local.dark ?? null,
    custom: mergeCustom(local.custom, remote.custom),
    crosswords: { done: { ...local.crosswords?.done, ...remote.crosswords?.done } },
    wordSearches: { done: { ...local.wordSearches?.done, ...remote.wordSearches?.done } },
    profile: {
      name: remote.profile?.name || local.profile?.name || "",
      nameAr: remote.profile?.nameAr || local.profile?.nameAr || "",
      skippedAr: !!(remote.profile?.skippedAr || local.profile?.skippedAr),
    },
    level: remote.level ?? local.level,
    dialects: { ...local.dialects, ...remote.dialects },
    cards,
    geoBest,
  };
}

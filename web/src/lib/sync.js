// Merging the progress kept in this browser with the progress saved in the student's account, used the
// first time a device signs in. The account wins for settings; for cards the more-studied copy wins and
// nothing is lost; for the map game the faster time wins.

const newer = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  if (a.reviews !== b.reviews) return a.reviews > b.reviews ? a : b;
  return (a.lastReviewed ?? 0) >= (b.lastReviewed ?? 0) ? a : b;
};

export function mergeProgress(local, remote) {
  if (!remote) return local;
  const cards = { ...remote.cards };
  for (const [k, c] of Object.entries(local.cards ?? {})) cards[k] = newer(cards[k], c);
  const geoBest = { ...remote.geoBest };
  for (const [k, ms] of Object.entries(local.geoBest ?? {})) {
    geoBest[k] = geoBest[k] == null ? ms : Math.min(geoBest[k], ms);
  }
  return {
    ...local,
    ...remote,
    level: remote.level ?? local.level,
    dialects: { ...local.dialects, ...remote.dialects },
    cards,
    geoBest,
  };
}

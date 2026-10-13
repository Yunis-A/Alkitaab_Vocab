// 11-box Leitner scheduler.
//
// Box index:  0    1    2     3    4   5   6   7   8    9    10
// Interval:   1m   3m   15m   1h   1d  1d  2d  7d  1mo  1mo  3mo
//
// New cards start in box 0 and are due immediately for their first review.
// Proficient (green): survived the 7-day box, i.e. reached box 8 or higher.
// Mastered (gold):    in the 3-month box (box 10).
//
// Ratings: hard -> back to box 0, good -> +1, easy -> +2.
// Cards are Arabic -> English only (see DIRECTIONS).

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const BOX_INTERVALS = [1 * MIN, 3 * MIN, 15 * MIN, HOUR, DAY, DAY, 2 * DAY, 7 * DAY, 30 * DAY, 30 * DAY, 90 * DAY];
export const LAST_BOX = BOX_INTERVALS.length - 1;
export const PROFICIENT_BOX = 8;
export const MASTERED_BOX = LAST_BOX;

export const RATINGS = ["hard", "good", "easy"];
export const DIRECTIONS = ["ar-en"];

export function cardKey(wordId, direction = "ar-en") {
  return `${wordId}|${direction}`;
}

export function newCard(now = Date.now()) {
  return { box: 0, due: now, reviews: 0, lapses: 0, lastReviewed: null };
}

export function review(card, rating, now = Date.now()) {
  let box = card.box;
  if (rating === "hard") box = 0;
  else if (rating === "good") box = Math.min(LAST_BOX, box + 1);
  else if (rating === "easy") box = Math.min(LAST_BOX, box + 2);
  else throw new Error(`Unknown rating: ${rating}`);

  return {
    box,
    due: now + BOX_INTERVALS[box],
    reviews: card.reviews + 1,
    lapses: card.lapses + (box === 0 ? 1 : 0),
    lastReviewed: now,
  };
}

export function isDue(card, now = Date.now()) {
  return card.due <= now;
}

export function boxStatus(box) {
  if (box >= MASTERED_BOX) return "mastered";
  if (box >= PROFICIENT_BOX) return "proficient";
  return "learning";
}

// A word with no card is "new"; otherwise its status comes from its box.
// (With several directions, the weakest one would count.)
export function wordStatus(cards, wordId) {
  const found = DIRECTIONS.map((d) => cards[cardKey(wordId, d)]);
  if (found.every((c) => !c)) return "new";
  if (found.some((c) => !c)) return "learning";
  return boxStatus(Math.min(...found.map((c) => c.box)));
}

export function wordBox(cards, wordId) {
  const found = DIRECTIONS.map((d) => cards[cardKey(wordId, d)]);
  if (found.some((c) => !c)) return -1;
  return Math.min(...found.map((c) => c.box));
}

export function formatInterval(ms) {
  if (ms <= 0) return "now";
  if (ms < HOUR) return `${Math.max(1, Math.round(ms / MIN))} min`;
  if (ms < DAY) return `${Math.round(ms / HOUR)} hr`;
  if (ms < 30 * DAY) return `${Math.round(ms / DAY)} d`;
  return `${Math.round(ms / (30 * DAY))} mo`;
}

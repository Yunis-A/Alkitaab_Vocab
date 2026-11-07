// The small picture on each card of the Learn tab. It sits in the bottom corner: the right in English (LTR), the
// left in Arabic (RTL), because it is placed at the end of the reading direction.

const SHAPES = {
  review: <><path d="M4 4v6h6M20 20v-6h-6" /><path d="M5.6 15a8 8 0 0 0 13.4 3M18.4 9A8 8 0 0 0 5 6" /></>,
  quick: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  matching: <><circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="m8.5 8.5 7 7" /></>,
  crossword: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></>,
  wordsearch: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.9-4.9" /><path d="M7.5 10.5h6M10.5 7.5v6" opacity="0.5" /></>,
  verbs: <path d="M5 12h14M13 6l6 6-6 6" />,
  typing: <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></>,
  // the sun at the top left and the crescent at the bottom right, clear of each other
  sunmoon: <><circle cx="6" cy="6" r="2.2" /><path d="M6 1v1M6 10v1M1 6h1M10 6h1M2.5 2.5l.7.7M8.8 8.8l.7.7M2.5 9.5l.7-.7M8.8 3.2l.7-.7" /><path d="M21.6 16.67A5.4 5.4 0 1 1 15.73 10.8 4.2 4.2 0 0 0 21.6 16.67z" /></>,
  geography: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  map: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  gender: <><circle cx="7" cy="9" r="3.5" /><path d="M7 12.5V19M4.5 16h5" /><circle cx="17" cy="15" r="3.5" /><path d="m19.5 12.5 2.5-2.5M19 10h3v3" /></>,
  article: <text x="12" y="17" textAnchor="middle" fontSize="13" fontFamily="Arial, sans-serif" fill="currentColor" stroke="none">ال</text>,
  prepositions: <path d="M4 8h12M12 4l4 4-4 4M20 16H8M12 12l-4 4 4 4" />,
  patterns: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>,
  conjugation: <path d="m4 20 4-1 11-11-3-3L5 16z" />,
};

export default function ModeIcon({ name }) {
  if (!SHAPES[name]) return null;
  return (
    <svg className="mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      {SHAPES[name]}
    </svg>
  );
}

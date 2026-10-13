import { books, BOOK_IDS, unitAfterBookChange } from "../config/books.js";
import { useApp } from "../context/AppContext.jsx";

// Book + unit selectors. Controlled by the caller via value/onChange.
export default function LevelPicker({ value, onChange, compact = false }) {
  const { t, nf, bookName } = useApp();
  const { book, unit } = value;

  const units = Array.from({ length: books[book].maxUnits }, (_, i) => i + 1);

  return (
    <div className={compact ? "level-picker compact" : "level-picker"}>
      <label>
        {!compact && <span dir="auto">{t("book")}</span>}
        <select
          value={book}
          aria-label={t("book")}
          onChange={(e) => {
            const b = Number(e.target.value);
            if (b !== book) onChange({ book: b, unit: unitAfterBookChange(book, b) });
          }}
        >
          {BOOK_IDS.map((id) => (
            <option key={id} value={id}>{bookName(id)}</option>
          ))}
        </select>
      </label>
      <label>
        {!compact && <span dir="auto">{t("unit")}</span>}
        <select
          value={unit}
          aria-label={t("unit")}
          onChange={(e) => onChange({ book, unit: Number(e.target.value) })}
        >
          {units.map((n) => (
            <option key={n} value={n}>{t("unitN", nf(n))}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

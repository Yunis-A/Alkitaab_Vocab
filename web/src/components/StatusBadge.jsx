import { useApp } from "../context/AppContext.jsx";

const KEYS = {
  new: "statusNew",
  learning: "statusLearning",
  proficient: "statusProficient",
  mastered: "statusMastered",
};

export default function StatusBadge({ wordId }) {
  const { t, statusOf } = useApp();
  const status = statusOf(wordId);
  return (
    <span className={`badge badge-${status}`} dir="auto">
      {t(KEYS[status])}
    </span>
  );
}

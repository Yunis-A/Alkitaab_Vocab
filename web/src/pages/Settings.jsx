import { useApp } from "../context/AppContext.jsx";
import LevelPicker from "../components/LevelPicker.jsx";
import GeoGame from "../components/GeoGame.jsx";
import { DIALECTS } from "../lib/varieties.js";

export default function Settings() {
  const { t, level, setLevel, dialects, setDialect } = useApp();
  return (
    <main className="page">
      <h1><bdi>{t("navSettings")}</bdi></h1>

      <section className="card">
        <h2><bdi>{t("level")}</bdi></h2>
        <p className="muted"><bdi>{t("settingsLevelHelp")}</bdi></p>
        <LevelPicker value={level} onChange={(v) => setLevel(v.book, v.unit)} />
      </section>

      <section className="card">
        <h2><bdi>{t("dialectsTitle")}</bdi></h2>
        <p className="muted"><bdi>{t("dialectsHelp")}</bdi></p>
        {DIALECTS.map((d) => (
          <label key={d} className="check">
            <input type="checkbox" checked={!!dialects[d]} onChange={(e) => setDialect(d, e.target.checked)} />
            <bdi>{t(d === "egyptian" ? "dialectEgyptian" : "dialectShami")}</bdi>
          </label>
        ))}
      </section>

      <section className="card">
        <h2><bdi>{t("geoTitle")}</bdi></h2>
        <GeoGame />
      </section>
    </main>
  );
}

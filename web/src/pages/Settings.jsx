import { useApp } from "../context/AppContext.jsx";
import LevelPicker from "../components/LevelPicker.jsx";
import GeoGame from "../components/GeoGame.jsx";

export default function Settings() {
  const { t, level, setLevel } = useApp();
  return (
    <main className="page">
      <h1><bdi>{t("navSettings")}</bdi></h1>

      <section className="card">
        <h2><bdi>{t("level")}</bdi></h2>
        <p className="muted"><bdi>{t("settingsLevelHelp")}</bdi></p>
        <LevelPicker value={level} onChange={(v) => setLevel(v.book, v.unit)} />
      </section>

      <section className="card">
        <h2><bdi>{t("geoTitle")}</bdi></h2>
        <GeoGame />
      </section>
    </main>
  );
}

import { useApp } from "../context/AppContext.jsx";
import LevelPicker from "../components/LevelPicker.jsx";
import { DIALECTS } from "../lib/varieties.js";
import Account from "./Account.jsx";

export default function Settings() {
  const { t, level, setLevel, dialects, setDialect, dark, setDark, profile, setProfile } = useApp();
  return (
    <main className="page">
      <h1><bdi>{t("navSettings")}</bdi></h1>

      <section className="card">
        <h2><bdi>{t("level")}</bdi></h2>
        <p className="muted"><bdi>{t("settingsLevelHelp")}</bdi></p>
        <LevelPicker value={level} onChange={(v) => setLevel(v.book, v.unit)} />
      </section>

      <section className="card">
        <h2><bdi>{t("nameLabel")}</bdi></h2>
        <label className="field-label name-field"><span dir="auto">{t("nameEnLabel")}</span>
          <input dir="auto" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} autoComplete="given-name" />
        </label>
        <label className="field-label name-field"><span dir="auto">{t("nameArLabel")}</span>
          <input className="ar" dir="rtl" value={profile.nameAr} onChange={(e) => setProfile({ nameAr: e.target.value })} />
        </label>
      </section>

      <section className="card">
        <h2><bdi>{t("appearance")}</bdi></h2>
        <label className="check">
          <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
          <bdi>{t("darkMode")}</bdi>
        </label>
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

      <Account />
    </main>
  );
}

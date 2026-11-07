import { useState } from "react";
import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext.jsx";
import LevelPicker from "./components/LevelPicker.jsx";
import Home from "./pages/Home.jsx";
import Learn from "./pages/Learn.jsx";
import Lookup from "./pages/Lookup.jsx";
import Settings from "./pages/Settings.jsx";
import Account from "./pages/Account.jsx";
import { Privacy, Terms } from "./pages/Legal.jsx";

function Onboarding() {
  const { t, setLevel } = useApp();
  const [value, setValue] = useState({ book: 1, unit: 1 });
  return (
    <main className="page narrow">
      <h1><bdi>{t("setupTitle")}</bdi></h1>
      <p><bdi>{t("setupHelp")}</bdi></p>
      <LevelPicker value={value} onChange={setValue} fixed />
      <button className="primary" onClick={() => setLevel(value.book, value.unit)}>
        <span dir="auto">{t("setupContinue")}</span>
      </button>
      {/* a returning student on a new device signs in instead: their saved level then loads */}
      <details className="returning">
        <summary>Already have an account?</summary>
        <Account />
      </details>
    </main>
  );
}

function Shell() {
  const { t, level, nf, bookName } = useApp();
  return (
    <>
      <header className="topbar">
        <span className="title" dir="auto">{t("siteTitle")}</span>
        <nav>
          <NavLink to="/" end dir="auto">{t("navHome")}</NavLink>
          <NavLink to="/learn" dir="auto">{t("navLearn")}</NavLink>
          <NavLink to="/lookup" dir="auto">{t("navLookup")}</NavLink>
          <NavLink to="/settings" dir="auto">{t("navSettings")}</NavLink>
        </nav>
        <Link className="level-chip" to="/settings" dir="auto">
          {bookName(level.book)} / {nf(level.unit)}
        </Link>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/lookup" element={<Lookup />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/account" element={<Navigate to="/settings" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  const { level } = useApp();
  // the legal pages are public: reachable without signing in or choosing a level
  return (
    <Routes>
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={level ? <Shell /> : <Onboarding />} />
    </Routes>
  );
}

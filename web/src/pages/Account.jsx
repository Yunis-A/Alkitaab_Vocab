import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const SYNC_TEXT = {
  idle: "",
  saving: "Saving…",
  saved: "All changes saved.",
  error: "Could not reach your account. Changes are kept in this browser and saved when you are back online.",
};

// Sign in / sign up / reset password, or the signed-in summary. Plain English: there is no lesson that
// teaches these words, so the account screens do not turn Arabic.
export default function Account() {
  const { configured, ready, user, recovering, signUp, signIn, signInWithGoogle, resetPassword, updatePassword } = useAuth();
  const { t, syncStatus, signOut } = useApp();
  const [mode, setMode] = useState("signin"); // signin | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { kind: "error" | "info", text }

  if (!configured) {
    return (
      <section className="card account">
        <h2><bdi>{t("accountTitle")}</bdi></h2>
        <p className="muted" dir="auto">Accounts are not set up on this copy of the site, so progress is saved in this browser only.</p>
      </section>
    );
  }
  if (!ready) return null;

  const run = async (fn, onOk) => {
    setBusy(true);
    setMessage(null);
    try {
      const { data, error } = await fn();
      if (error) setMessage({ kind: "error", text: error.message });
      else onOk?.(data);
    } catch (e) {
      setMessage({ kind: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  };
  const go = (m) => { setMode(m); setMessage(null); };

  if (recovering) {
    return (
      <section className="card account">
        <h2 dir="auto">Choose a new password</h2>
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updatePassword(password), () => setMessage({ kind: "info", text: "Password updated." }));
          }}
        >
          <label className="field-label"><span dir="auto">New password</span>
            <input dir="ltr" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button className="primary" disabled={busy}><span dir="auto">Save password</span></button>
        </form>
        {message && <p className={`auth-${message.kind}`} dir="auto">{message.text}</p>}
      </section>
    );
  }

  if (user) {
    return (
      <section className="card account">
        <h2><bdi>{t("accountTitle")}</bdi></h2>
        <p dir="auto">Signed in as <bdi><strong dir="ltr">{user.email}</strong></bdi></p>
        {SYNC_TEXT[syncStatus] && (
          <p className={syncStatus === "error" ? "auth-error" : "muted"} dir="auto" aria-live="polite">{SYNC_TEXT[syncStatus]}</p>
        )}
        <button onClick={signOut}><span dir="auto">Sign out</span></button>
      </section>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    if (mode === "signin") run(() => signIn(email, password));
    else if (mode === "signup") {
      run(() => signUp(email, password), (data) => {
        // with email confirmation on there is no session yet: the student must open the emailed link first
        if (!data.session) setMessage({ kind: "info", text: `We sent a confirmation link to ${email}. Open it, then sign in.` });
      });
    } else {
      run(() => resetPassword(email), () => setMessage({ kind: "info", text: `If ${email} has an account, a reset link is on its way.` }));
    }
  };

  return (
    <section className="card account">
      <h2 dir="auto">{mode === "signin" ? "Sign in" : mode === "signup" ? "Create an account" : "Reset your password"}</h2>
      <form onSubmit={submit} className="auth-form">
        <label className="field-label"><span dir="auto">Email</span>
          <input dir="ltr" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {mode !== "reset" && (
          <label className="field-label"><span dir="auto">Password</span>
            <input dir="ltr" type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        )}
        <button className="primary" disabled={busy}>
          <span dir="auto">{mode === "signin" ? "Sign in" : mode === "signup" ? "Sign up" : "Send reset link"}</span>
        </button>
      </form>
      {message && <p className={`auth-${message.kind}`} dir="auto" aria-live="polite">{message.text}</p>}

      {mode !== "reset" && (
        <button type="button" className="google-btn" disabled={busy} onClick={() => run(signInWithGoogle)}>
          <span dir="auto">Continue with Google</span>
        </button>
      )}

      <p className="muted" dir="auto">By signing up you agree to the <Link to="/terms">terms</Link> and <Link to="/privacy">privacy policy</Link>.</p>

      <p className="auth-links">
        {mode !== "signin" && <button type="button" className="link-button" onClick={() => go("signin")}><span dir="auto">Sign in</span></button>}
        {mode !== "signup" && <button type="button" className="link-button" onClick={() => go("signup")}><span dir="auto">Create an account</span></button>}
        {mode === "signin" && <button type="button" className="link-button" onClick={() => go("reset")}><span dir="auto">Forgot password?</span></button>}
      </p>
    </section>
  );
}

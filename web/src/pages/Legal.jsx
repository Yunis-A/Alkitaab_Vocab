import { Link } from "react-router-dom";
import { CONTACT_EMAIL, SITE_NAME } from "../config/site.js";

const UPDATED = "November 2026";

function Page({ title, children }) {
  return (
    <main className="page narrow legal">
      <h1>{title}</h1>
      <p className="muted">Last updated {UPDATED}</p>
      {children}
      <p><Link to="/">← Back to {SITE_NAME}</Link></p>
    </main>
  );
}

const Contact = () => (
  CONTACT_EMAIL
    ? <>Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</>
    : <>Contact the person who gave you the link to this site.</>
);

export function Privacy() {
  return (
    <Page title="Privacy policy">
      <p>{SITE_NAME} is a website for learning Arabic vocabulary. This page explains what it stores about you.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Your email address</strong>, if you create an account (including the email on your Google account if you sign in with Google). If you sign in with Google we receive only your email address and basic profile; we do not see your Google password.</li>
        <li><strong>Your password</strong>, if you sign up with email and password. It is stored only in scrambled (hashed) form by our sign-in provider, never in readable form.</li>
        <li><strong>Your study progress</strong>: your chosen book and unit, which dialects you study, your flashcard boxes and review times, and your best times in the map game.</li>
      </ul>
      <p>Without an account, your progress stays in your own browser and is not sent to us.</p>

      <h2>How it is used</h2>
      <p>Only to run the site: to sign you in, and to save and restore your progress on any device. We do not sell your data, show advertising, or use tracking or analytics cookies.</p>

      <h2>Where it is stored</h2>
      <p>Account data and progress are stored with <a href="https://supabase.com" target="_blank" rel="noreferrer">Supabase</a>, which acts as our service provider. Each account can only read and change its own progress. If you sign in with Google, Google handles that sign-in under its own privacy policy.</p>

      <h2>Your choices</h2>
      <p>You can ask us to delete your account and all of its data at any time. <Contact /></p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of service">
      <p>By using {SITE_NAME} you agree to these terms.</p>
      <ul>
        <li>The site is a free study aid, provided as is, without any guarantee that it is complete, error-free or always available.</li>
        <li>Vocabulary and grammar notes may contain mistakes. Check anything important with your teacher or textbook.</li>
        <li>Keep your password private and do not use someone else's account. You are responsible for what happens under your account.</li>
        <li>Do not try to break, overload or gain unauthorised access to the site or other people's data.</li>
        <li>We may change or stop the site, or remove accounts that break these terms.</li>
        <li>Your use of the site is also covered by the <Link to="/privacy">privacy policy</Link>.</li>
      </ul>
      <p>Questions? <Contact /></p>
    </Page>
  );
}

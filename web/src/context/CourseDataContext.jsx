import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Account from "../pages/Account.jsx";
import { supabase } from "../lib/supabase.js";
import { clearCourseCache, readCourseCache, writeCourseCache } from "../lib/courseCache.js";

// The course content (the vocabulary, the crosswords, the word searches) is NOT part of the website's files. It sits
// in the Supabase table `course_data`, readable only by signed-in students (row level security), and is fetched after
// sign-in. So the page source and the built files hold no vocabulary: someone without an account sees only the
// sign-in screen. (Honest limit: a signed-in student can of course see what the server sends them.)

const Ctx = createContext({ words: [], crosswords: {}, wordsearches: {} });
export const useCourse = () => useContext(Ctx);

const EMPTY = { words: [], crosswords: {}, wordsearches: {} };
const PUBLIC_PATHS = ["/privacy", "/terms"]; // the legal pages need no account

const assemble = (by) => {
  if (!by.words) throw new Error("The course content is not uploaded yet.");
  return { words: by.words, crosswords: by.crosswords ?? {}, wordsearches: by.wordsearches ?? {} };
};

// The server's copy, unless the one kept in this browser is still current (a cheap check of the update times first).
async function fetchCourse(userId, cached) {
  const { data: stamps, error: e1 } = await supabase.from("course_data").select("key, updated_at");
  if (e1) throw e1;
  const now = Object.fromEntries(stamps.map((r) => [r.key, r.updated_at]));
  if (cached && JSON.stringify(cached.stamps) === JSON.stringify(now)) return cached.course;
  const { data, error } = await supabase.from("course_data").select("key, data");
  if (error) throw error;
  const course = assemble(Object.fromEntries(data.map((r) => [r.key, r.data])));
  writeCourseCache(userId, now, course);
  return course;
}

// Local development without an account: the files under web/private, which Vite only includes in `npm run dev`.
async function fetchLocal() {
  const [w, c, s] = await Promise.all([
    import("../../private/words.json"),
    import("../../private/crosswords.json"),
    import("../../private/wordsearch.json"),
  ]);
  return { words: w.default, crosswords: c.default, wordsearches: s.default };
}

export function CourseDataProvider({ children }) {
  const { configured, ready, user } = useAuth();
  const { pathname } = useLocation();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);
  const local = import.meta.env.DEV && (!configured || import.meta.env.VITE_LOCAL_DATA === "true"); // dev only
  const userId = user?.id ?? null;

  useEffect(() => {
    let live = true;
    setError(null);
    if (local) {
      fetchLocal().then((d) => live && setCourse(d)).catch((e) => live && setError(e.message));
    } else if (userId) {
      // show the copy kept in this browser at once, then check the server for a newer one in the background
      readCourseCache(userId).then((cached) => {
        if (cached && live) setCourse(cached.course);
        return fetchCourse(userId, cached)
          .then((d) => live && setCourse(d))
          .catch((e) => { if (live && !cached) setError(e.message); }); // offline with a copy: carry on with it
      });
    } else {
      setCourse(null); // signed out: the content is dropped from memory
      if (ready) clearCourseCache(); // and from this browser (not before the saved session has been read)
    }
    return () => { live = false; };
  }, [local, userId, ready]);

  const value = useMemo(() => course ?? EMPTY, [course]);

  const isPublic = PUBLIC_PATHS.some((p) => pathname.endsWith(p));
  if (!course && !isPublic) {
    return (
      <main className="page narrow">
        <h1 dir="auto">kutubiiya · كتبية</h1>
        {!configured && !local ? (
          <p className="muted">This copy of the site is not connected to its account service.</p>
        ) : error ? (
          <p className="auth-error">{error}</p>
        ) : !ready || userId || local ? (
          <p className="muted">Loading…</p>
        ) : (
          <>
            <p>Sign in or create an account to start learning.</p>
            <Account />
          </>
        )}
      </main>
    );
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

// Who is signed in (null when nobody is, or when Supabase is not configured).
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!supabase);
  const [recovering, setRecovering] = useState(false); // arrived from a password-reset email

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "SIGNED_OUT") setRecovering(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => {
    const origin = window.location.origin;
    return {
      configured: !!supabase,
      ready,
      user: session?.user ?? null,
      recovering,
      signUp: (email, password) =>
        supabase.auth.signUp({ email, password, options: { emailRedirectTo: origin } }),
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signInWithGoogle: () => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: origin } }),
      resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/account` }),
      updatePassword: async (password) => {
        const res = await supabase.auth.updateUser({ password });
        if (!res.error) setRecovering(false);
        return res;
      },
      signOut: () => supabase.auth.signOut(),
    };
  }, [session, ready, recovering]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

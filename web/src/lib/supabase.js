// The Supabase client. It exists only when the project URL and public (anon) key are configured in
// .env.local (see .env.example); without them the app works signed-out, saving to this browser only.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

// The user's saved progress row, or null if they have none yet. Throws on a network/permission error.
export async function fetchProgress(userId) {
  const { data, error } = await supabase.from("progress").select("data").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data?.data ?? null;
}

export async function pushProgress(userId, progress) {
  const { error } = await supabase
    .from("progress")
    .upsert({ user_id: userId, data: progress, updated_at: new Date().toISOString() });
  if (error) throw error;
}

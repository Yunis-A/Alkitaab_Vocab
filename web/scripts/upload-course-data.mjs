// Uploads the course content (web/private/*.json) to the Supabase table `course_data`.
// Run it yourself, on your own machine; the service key is read from the environment and is never stored:
//
//   PowerShell:  $env:SUPABASE_SERVICE_KEY = "<secret key>"; node scripts/upload-course-data.mjs
//   bash:        SUPABASE_SERVICE_KEY=<secret key> node scripts/upload-course-data.mjs
//
// (Supabase dashboard -> Project Settings -> API Keys -> the secret / service_role key.) Create the table first with
// supabase/course_data.sql. Re-run this whenever the vocabulary, crosswords or word searches change.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = process.env.SUPABASE_URL || "https://lgqozdydxmybzwykjsmn.supabase.co";
const key = process.env.SUPABASE_SERVICE_KEY;
if (!key) {
  console.error("Set SUPABASE_SERVICE_KEY first (see the top of this file).");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const FILES = { words: "words.json", crosswords: "crosswords.json", wordsearches: "wordsearch.json" };

for (const [name, file] of Object.entries(FILES)) {
  const data = JSON.parse(fs.readFileSync(path.join(root, "private", file), "utf8"));
  const { error } = await supabase.from("course_data").upsert({ key: name, data, updated_at: new Date().toISOString() });
  if (error) {
    console.error(`${name}: ${error.message}`);
    process.exit(1);
  }
  console.log(`${name}: uploaded (${JSON.stringify(data).length} bytes)`);
}

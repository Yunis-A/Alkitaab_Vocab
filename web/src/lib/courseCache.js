// A copy of the course content kept in this browser (IndexedDB), so a returning student does not download it again
// on every visit. It is only ever used while someone is signed in, it is dropped on sign out, and it is replaced as
// soon as the server's copy is newer. Every call quietly does nothing when IndexedDB is unavailable.

const DB = "kutubiiya";
const STORE = "course";
const KEY = "content";

const open = () =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("no indexedDB")); return; }
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async (mode, fn) => {
  try {
    const db = await open();
    return await new Promise((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
};

// { userId, stamps: { words: "<updated_at>", ... }, course: { words, crosswords, wordsearches } } or null
export const readCourseCache = async (userId) => {
  const hit = await run("readonly", (s) => s.get(KEY));
  return hit && hit.userId === userId ? hit : null;
};
export const writeCourseCache = (userId, stamps, course) => run("readwrite", (s) => s.put({ userId, stamps, course }, KEY));
export const clearCourseCache = () => run("readwrite", (s) => s.delete(KEY));

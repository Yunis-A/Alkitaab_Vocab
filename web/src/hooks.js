import { useEffect, useState } from "react";

// Re-renders the caller every `ms` so due times stay current.
export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

// True while a Shift key is held down.
export function useShiftHeld() {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const sync = (e) => setHeld(e.shiftKey);
    const clear = () => setHeld(false);
    window.addEventListener("keydown", sync);
    window.addEventListener("keyup", sync);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", sync);
      window.removeEventListener("keyup", sync);
      window.removeEventListener("blur", clear);
    };
  }, []);
  return held;
}

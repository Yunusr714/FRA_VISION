import { useEffect, useRef } from "react";

export function useFormPersist<T>(key: string, state: T, setState: (v: T) => void) {
  const loaded = useRef(false);

  // Load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState(parsed);
      }
    } catch {}
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on change
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
}

// Helper to clear after successful submit
export function clearPersistedForm(key: string) {
  try { localStorage.removeItem(key); } catch {}
}
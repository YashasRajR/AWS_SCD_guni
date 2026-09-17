import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'scd_saved_sessions_2026';

export function useSavedSessions() {
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
    } catch {
      // storage unavailable or full
    }
  }, [savedIds]);

  const toggleSession = useCallback((sessionId: string) => {
    setSavedIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId],
    );
  }, []);

  const isSaved = useCallback((sessionId: string) => savedIds.includes(sessionId), [savedIds]);

  return { savedIds, toggleSession, isSaved };
}

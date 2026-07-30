import { useCallback, useEffect, useState } from "react";

const KEY = "hikma-vote-student";

export type StudentSession = {
  studentId: string;
  name: string;
  admissionNumber: string;
  className: string | null;
  votedPositionIds: string[];
};

export function readSession(): StudentSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StudentSession) : null;
  } catch {
    return null;
  }
}

export function writeSession(session: StudentSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("hikma-session"));
}

export function useStudentSession() {
  const [session, setSession] = useState<StudentSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSession(readSession());
    sync();
    setReady(true);
    window.addEventListener("hikma-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("hikma-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((s: StudentSession | null) => writeSession(s), []);

  return { session, ready, save };
}

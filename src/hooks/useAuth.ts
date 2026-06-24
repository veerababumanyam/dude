import { useCallback, useEffect, useState } from "react";
import * as storage from "../lib/storage";

// Simple local gate. Not real security — credentials are fixed and the
// "logged in" flag is persisted in the browser DB so it's a one-time step.
const USERNAME = "admin";
const PASSWORD = "admin@123";

export function useAuth() {
  const [authed, setAuthed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      if (await storage.loadAuth()) setAuthed(true);
      setIsLoaded(true);
    })();
  }, []);

  const login = useCallback((username: string, password: string) => {
    if (username.trim() === USERNAME && password === PASSWORD) {
      setAuthed(true);
      storage.saveAuth(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setAuthed(false);
    storage.saveAuth(false);
  }, []);

  return { authed, isLoaded, login, logout };
}

import { useCallback, useEffect, useState } from "react";
import { PROFILES, type Profile } from "../constants";
import * as storage from "../lib/storage";

/**
 * Tracks the active demo profile. There is no auth — the selection is purely
 * presentational and is persisted so the choice survives a reload.
 */
export function useProfile() {
  const [profileId, setProfileId] = useState<string>(PROFILES[0].id);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await storage.loadProfileId();
      if (stored && PROFILES.some((p) => p.id === stored)) setProfileId(stored);
      setIsLoaded(true);
    })();
  }, []);

  const selectProfile = useCallback((id: string) => {
    setProfileId(id);
    storage.saveProfileId(id);
  }, []);

  const profile: Profile =
    PROFILES.find((p) => p.id === profileId) ?? PROFILES[0];

  return { profile, profiles: PROFILES, selectProfile, isLoaded };
}

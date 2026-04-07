/**
 * useNsec — safely derive the current user's nsec, if available.
 *
 * Only returns a value when the active login is of type "nsec" (i.e. the user
 * pasted their private key directly). Returns null for extension / bunker logins.
 *
 * Reads from localStorage directly (same key used by NostrLoginProvider) so it
 * never throws even if the login context is momentarily unavailable during
 * production bundle hydration.
 */

import { useMemo } from 'react';
import { nip19 } from 'nostr-tools';

const STORAGE_KEY = 'nostr:login';

interface RawNsecLogin {
  type: 'nsec';
  secretKey: Record<string, number>; // Uint8Array serialised as a plain object
}

interface RawLoginStore {
  logins?: Array<{ type: string; [key: string]: unknown }>;
}

export function useNsec(): string | null {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const store = JSON.parse(raw) as RawLoginStore;
      const first = store?.logins?.[0];
      if (!first || first.type !== 'nsec') return null;

      const login = first as RawNsecLogin;
      // secretKey is stored as a JSON object { "0": 12, "1": 34, ... }
      const secretKey = Uint8Array.from(Object.values(login.secretKey));
      return nip19.nsecEncode(secretKey);
    } catch {
      return null;
    }
  // Re-run if localStorage changes (e.g. login / logout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * useWoTSuggestions
 *
 * Surfaces users the current user should consider following, ranked by
 * Web-of-Trust score: how many of the people you already follow also follow
 * that person (2nd-degree endorsement count).
 *
 * Strategy:
 *  1. Fetch the current user's contact list (1st-degree follows).
 *  2. Fetch contact lists for each of those follows (up to 100).
 *  3. Count how many 1st-degree follows each 2nd-degree pubkey appears in.
 *  4. Exclude the current user and anyone already followed.
 *  5. Sort descending by score and return the top `limit`.
 */

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFollows } from '@/hooks/useFollows';
import { useAppContext } from '@/hooks/useAppContext';

export interface WoTSuggestion {
  pubkey: string;
  /** Number of your follows who also follow this person */
  score: number;
}

export function useWoTSuggestions(limit = 30) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const { data: myFollows = [] } = useFollows(user?.pubkey);

  return useQuery({
    queryKey: ['wot-suggestions', user?.pubkey, myFollows.length, config.relayMetadata.updatedAt, limit],
    queryFn: async (): Promise<WoTSuggestion[]> => {
      if (!user || myFollows.length === 0) return [];

      const relayUrls = config.relayMetadata.relays.filter(r => r.read).map(r => r.url);
      const relayGroup = relayUrls.length > 0 ? nostr.group(relayUrls) : nostr;

      const myFollowSet = new Set(myFollows);

      // Fetch contact lists of our follows (cap at 100 to avoid huge queries)
      const followsToCheck = myFollows.slice(0, 100);
      const contactLists = await relayGroup.query([
        { kinds: [3], authors: followsToCheck },
      ]);

      // Score each 2nd-degree pubkey by how many of our follows endorse them
      const scores = new Map<string, number>();
      for (const event of contactLists) {
        for (const [tag, pk] of event.tags) {
          if (tag !== 'p' || !pk) continue;
          // Skip self and already-followed users
          if (pk === user.pubkey) continue;
          if (myFollowSet.has(pk)) continue;
          scores.set(pk, (scores.get(pk) ?? 0) + 1);
        }
      }

      return Array.from(scores.entries())
        .map(([pubkey, score]) => ({ pubkey, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },
    enabled: !!user && myFollows.length > 0,
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 15 * 60_000,
  });
}

/**
 * usePublicFollowLists — discover public kind-30000 follow-set lists by keyword.
 *
 * Queries relays for kind-30000 events whose `title` tag matches the keyword,
 * returning lists along with their member pubkeys and author info.
 */

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';
import type { NostrEvent } from '@nostrify/nostrify';

export interface PublicFollowList {
  event: NostrEvent;
  dTag: string;
  title: string;
  description: string;
  authorPubkey: string;
  pubkeys: string[];
  /** naddr coordinate for sharing */
  naddr: string;
}

function buildNaddr(pubkey: string, dTag: string): string {
  // naddr1... encodes kind:30000:pubkey:dTag — we return a readable coord string
  // and let the caller use nostr-tools to encode if needed
  return `30000:${pubkey}:${dTag}`;
}

/**
 * Fetch public follow lists matching a topic keyword.
 * Pass `null` to get the curated recommended lists for a preset topic.
 */
export function usePublicFollowLists(keyword: string | null) {
  const { nostr } = useNostr();
  const { config } = useAppContext();

  return useQuery({
    queryKey: ['public-follow-lists', keyword, config.relayMetadata.updatedAt],
    queryFn: async (): Promise<PublicFollowList[]> => {
      if (!keyword?.trim()) return [];

      const relayUrls = config.relayMetadata.relays
        .filter((r) => r.read)
        .map((r) => r.url);
      const pool = relayUrls.length > 0 ? nostr.group(relayUrls) : nostr;

      // Query kind-30000 events with a title matching the keyword
      const events = await pool.query([
        {
          kinds: [30000],
          '#t': [keyword.toLowerCase()],
          limit: 30,
        },
        // Also search by title-like match via a broader query
        {
          kinds: [30000],
          limit: 50,
        },
      ]);

      // Deduplicate by event id
      const seen = new Set<string>();
      const unique = events.filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

      // Filter to those whose title contains the keyword (case-insensitive)
      const kw = keyword.toLowerCase();
      const filtered = unique.filter((e) => {
        const title = e.tags.find(([t]) => t === 'title')?.[1] ?? '';
        const desc = e.tags.find(([t]) => t === 'description')?.[1] ?? '';
        const tTags = e.tags.filter(([t]) => t === 't').map(([, v]) => v.toLowerCase());
        return (
          title.toLowerCase().includes(kw) ||
          desc.toLowerCase().includes(kw) ||
          tTags.includes(kw)
        );
      });

      // Only return lists that have at least 2 members
      return filtered
        .map((e): PublicFollowList => {
          const dTag = e.tags.find(([t]) => t === 'd')?.[1] ?? e.id;
          return {
            event: e,
            dTag,
            title: e.tags.find(([t]) => t === 'title')?.[1] ?? 'Untitled List',
            description: e.tags.find(([t]) => t === 'description')?.[1] ?? '',
            authorPubkey: e.pubkey,
            pubkeys: e.tags.filter(([t]) => t === 'p').map(([, pk]) => pk),
            naddr: buildNaddr(e.pubkey, dTag),
          };
        })
        .filter((l) => l.pubkeys.length >= 2)
        .sort((a, b) => b.pubkeys.length - a.pubkeys.length)
        .slice(0, 20);
    },
    enabled: !!keyword?.trim(),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
  });
}

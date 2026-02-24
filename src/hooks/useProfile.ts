import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export function useProfile(pubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['profile', pubkey],
    queryFn: async () => {
      const events = await nostr.query([
        {
          kinds: [0],
          authors: [pubkey],
          limit: 1,
        },
      ]);

      if (events.length === 0) {
        return null;
      }

      try {
        const metadata = JSON.parse(events[0].content);
        return { event: events[0], metadata };
      } catch {
        return null;
      }
    },
  });
}

export function useUserPosts(pubkey: string, limit: number = 50) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['user-posts', pubkey, limit],
    queryFn: async () => {
      const events = await nostr.query([
        {
          kinds: [1],
          authors: [pubkey],
          limit,
        },
      ]);

      // Filter out replies
      return events.filter(
        (event) => !event.tags.some(([name]) => name === 'e')
      );
    },
  });
}

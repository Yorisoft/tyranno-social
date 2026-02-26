import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export function useRelayFirehose(relayUrl: string | null) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['relay-firehose', relayUrl],
    queryFn: async ({ pageParam }) => {
      if (!relayUrl) return [];

      const relay = nostr.relay(relayUrl);
      
      // Fetch latest posts from this specific relay
      const events = await relay.query([
        {
          kinds: [1], // Text notes only for firehose
          limit: 20,
          until: pageParam,
        },
      ]);

      return events;
    },
    enabled: !!relayUrl,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: NostrEvent[]) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      
      // Use the oldest event's timestamp for pagination
      const oldestEvent = lastPage[lastPage.length - 1];
      return oldestEvent?.created_at;
    },
    staleTime: 30000, // 30 seconds
  });
}

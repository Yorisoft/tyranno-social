import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

const PAGE_SIZE = 50;

export function useChannelMessages(channelId: string | null) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['channel-messages', channelId],
    queryFn: async ({ pageParam }) => {
      if (!channelId) return [];

      // Fetch channel messages (kind 42) that reference this channel
      const messages = await nostr.query([
        {
          kinds: [42],
          '#e': [channelId],
          limit: PAGE_SIZE,
          ...(pageParam ? { until: pageParam } : {}),
        },
      ]);

      // Sort by creation time (newest first for display, but we'll reverse for chat)
      return messages.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!channelId,
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

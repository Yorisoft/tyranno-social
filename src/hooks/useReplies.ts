import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

export function useReplies(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['replies', eventId],
    queryFn: async () => {
      const events = await nostr.query([
        {
          kinds: [1], // Text note replies
          '#e': [eventId],
          limit: 100,
        },
      ]);

      // Sort by created_at (newest first)
      return events.sort((a, b) => b.created_at - a.created_at);
    },
  });
}

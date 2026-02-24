import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

export function useReactions(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['reactions', eventId],
    queryFn: async () => {
      const events = await nostr.query([
        {
          kinds: [7], // Reaction events
          '#e': [eventId],
          limit: 500,
        },
      ]);

      // Group reactions by emoji
      const reactionCounts: Record<string, { count: number; pubkeys: string[] }> = {};
      
      events.forEach((event) => {
        const emoji = event.content || '❤️';
        if (!reactionCounts[emoji]) {
          reactionCounts[emoji] = { count: 0, pubkeys: [] };
        }
        reactionCounts[emoji].count++;
        reactionCounts[emoji].pubkeys.push(event.pubkey);
      });

      return reactionCounts;
    },
  });
}

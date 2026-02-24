import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

export function useNote(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['note', eventId],
    queryFn: async () => {
      const events = await nostr.query([
        {
          ids: [eventId],
          limit: 1,
        },
      ]);

      return events[0] || null;
    },
  });
}

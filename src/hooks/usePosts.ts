import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export function usePosts(limit: number = 100) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['posts', limit],
    queryFn: async () => {
      const events = await nostr.query([
        {
          kinds: [1],
          limit,
        },
      ]);

      // Filter out events that are replies (have 'e' tag) to show only root posts
      const rootPosts = events.filter(
        (event) => !event.tags.some(([name]) => name === 'e')
      );

      return rootPosts;
    },
  });
}

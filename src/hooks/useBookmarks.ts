import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';
import type { NostrEvent } from '@nostrify/nostrify';

interface BookmarkItem {
  type: 'event' | 'article';
  id: string;
  relay?: string;
  isPrivate: boolean;
}

export function useBookmarks() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config } = useAppContext();

  return useQuery({
    queryKey: ['bookmarks', user?.pubkey, config.relayMetadata.updatedAt],
    queryFn: async () => {
      if (!user) return { items: [], events: [] };

      // Get relay URLs from user's configuration
      const relayUrls = config.relayMetadata.relays
        .filter(r => r.read)
        .map(r => r.url);

      // Create a relay group to query from user's relays
      const relayGroup = relayUrls.length > 0 
        ? nostr.group(relayUrls)
        : nostr;

      // Fetch bookmark lists (kind 10003)
      const bookmarkLists = await relayGroup.query([
        {
          kinds: [10003],
          authors: [user.pubkey],
          limit: 1,
        },
      ]);

      const bookmarkItems: BookmarkItem[] = [];

      if (bookmarkLists.length > 0) {
        const list = bookmarkLists[0];

        // Extract public bookmarks from tags
        for (const tag of list.tags) {
          if (tag[0] === 'e') {
            // Event bookmark
            bookmarkItems.push({
              type: 'event',
              id: tag[1],
              relay: tag[2],
              isPrivate: false,
            });
          } else if (tag[0] === 'a') {
            // Article bookmark
            bookmarkItems.push({
              type: 'article',
              id: tag[1],
              relay: tag[2],
              isPrivate: false,
            });
          }
        }

        // Decrypt private bookmarks if content exists
        if (list.content && user.signer.nip44) {
          try {
            const decrypted = await user.signer.nip44.decrypt(user.pubkey, list.content);
            const privateItems = JSON.parse(decrypted) as string[][];

            for (const tag of privateItems) {
              if (tag[0] === 'e') {
                bookmarkItems.push({
                  type: 'event',
                  id: tag[1],
                  relay: tag[2],
                  isPrivate: true,
                });
              } else if (tag[0] === 'a') {
                bookmarkItems.push({
                  type: 'article',
                  id: tag[1],
                  relay: tag[2],
                  isPrivate: true,
                });
              }
            }
          } catch (error) {
            console.warn('Failed to decrypt private bookmarks:', error);
          }
        }
      }

      // Fetch the actual bookmarked events
      const eventIds = bookmarkItems
        .filter(item => item.type === 'event')
        .map(item => item.id);

      const events: NostrEvent[] = [];

      if (eventIds.length > 0) {
        const bookmarkedEvents = await relayGroup.query([
          {
            ids: eventIds,
            limit: eventIds.length,
          },
        ]);
        events.push(...bookmarkedEvents);
      }

      // TODO: Fetch articles (kind 30023) if needed
      // For now, just return events

      return { items: bookmarkItems, events };
    },
    enabled: !!user,
  });
}

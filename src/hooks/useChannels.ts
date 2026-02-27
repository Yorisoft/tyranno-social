import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

interface ChannelMetadata {
  name?: string;
  about?: string;
  picture?: string;
  relays?: string[];
}

export interface Channel {
  id: string; // Event ID of the kind 40 creation event
  metadata: ChannelMetadata;
  createdAt: number;
  creator: string; // Pubkey of channel creator
  messageCount?: number;
  lastActivity?: number;
}

export function useChannels(limit: number = 50) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['channels', limit],
    queryFn: async () => {
      // Fetch channel creation events (kind 40)
      const channelEvents = await nostr.query([
        {
          kinds: [40],
          limit,
        },
      ]);

      // Parse channel metadata
      const channels: Channel[] = channelEvents.map((event) => {
        let metadata: ChannelMetadata = {};
        
        try {
          metadata = JSON.parse(event.content);
        } catch {
          // If content isn't valid JSON, use empty metadata
          metadata = {};
        }

        return {
          id: event.id,
          metadata,
          createdAt: event.created_at,
          creator: event.pubkey,
        };
      });

      // Sort by creation date (newest first)
      return channels.sort((a, b) => b.createdAt - a.createdAt);
    },
    staleTime: 60000, // 1 minute
  });
}

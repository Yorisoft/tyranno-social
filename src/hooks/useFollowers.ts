import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Get the list of pubkeys that a user follows (their "following" list)
 * This queries for kind 3 (Contact List) events
 */
export function useFollowing(pubkey: string) {
  const { nostr } = useNostr();
  const { config } = useAppContext();

  return useQuery({
    queryKey: ['following', pubkey, config.relayMetadata.updatedAt],
    queryFn: async () => {
      const relayUrls = config.relayMetadata.relays
        .filter(r => r.read)
        .map(r => r.url);

      const relayGroup = relayUrls.length > 0 
        ? nostr.group(relayUrls)
        : nostr;

      // Query for kind 3 (Contact List) events
      const events = await relayGroup.query([
        {
          kinds: [3],
          authors: [pubkey],
          limit: 1,
        },
      ]);

      if (events.length === 0) {
        return [];
      }

      // Extract p tags (pubkeys the user follows)
      const followingPubkeys = events[0].tags
        .filter(([name]) => name === 'p')
        .map(([_, pubkey]) => pubkey);

      return followingPubkeys;
    },
  });
}

/**
 * Get the list of pubkeys that follow a user (their "followers")
 * This queries for kind 3 events that contain the user's pubkey in p tags
 */
export function useFollowers(pubkey: string) {
  const { nostr } = useNostr();
  const { config } = useAppContext();

  return useQuery({
    queryKey: ['followers', pubkey, config.relayMetadata.updatedAt],
    queryFn: async () => {
      const relayUrls = config.relayMetadata.relays
        .filter(r => r.read)
        .map(r => r.url);

      const relayGroup = relayUrls.length > 0 
        ? nostr.group(relayUrls)
        : nostr;

      // Query for kind 3 events that include this pubkey in p tags
      // Note: This queries for events where the user is tagged, not authored
      const events = await relayGroup.query([
        {
          kinds: [3],
          '#p': [pubkey],
          limit: 500, // Limit to prevent excessive queries
        },
      ]);

      // Extract the authors (people who follow this user)
      const followerPubkeys = events.map(event => event.pubkey);

      // Remove duplicates (in case someone published multiple contact lists)
      return Array.from(new Set(followerPubkeys));
    },
  });
}

/**
 * Get follower and following counts
 */
export function useFollowStats(pubkey: string) {
  const { data: following = [], isLoading: isLoadingFollowing } = useFollowing(pubkey);
  const { data: followers = [], isLoading: isLoadingFollowers } = useFollowers(pubkey);

  return {
    followingCount: following.length,
    followersCount: followers.length,
    isLoading: isLoadingFollowing || isLoadingFollowers,
  };
}

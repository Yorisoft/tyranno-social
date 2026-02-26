import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';
import { useToast } from '@/hooks/useToast';
import type { NostrEvent } from '@nostrify/nostrify';
import { useEffect, useRef } from 'react';

export interface BookmarkSet {
  id: string; // d tag value
  event: NostrEvent;
  title: string;
  description?: string;
  image?: string;
  publicItems: string[][]; // Public bookmark tags
  privateItems: string[][]; // Private bookmark tags (decrypted)
  itemCount: number;
}

async function parseBookmarkSet(
  event: NostrEvent,
  user: { pubkey: string; signer: { nip44?: { decrypt: (pubkey: string, content: string) => Promise<string> } } }
): Promise<BookmarkSet> {
  const dTag = event.tags.find(([name]) => name === 'd')?.[1] || '';
  const title = event.tags.find(([name]) => name === 'title')?.[1] || 'Untitled List';
  const description = event.tags.find(([name]) => name === 'description')?.[1];
  const image = event.tags.find(([name]) => name === 'image')?.[1];

  // Get public items (e and a tags)
  const publicItems = event.tags.filter(([name]) => name === 'e' || name === 'a');

  // Decrypt private items if content exists
  let privateItems: string[][] = [];
  if (event.content && user.signer.nip44) {
    try {
      const decrypted = await user.signer.nip44.decrypt(user.pubkey, event.content);
      privateItems = JSON.parse(decrypted) as string[][];
    } catch (error) {
      console.warn('Failed to decrypt private items in bookmark set:', error);
    }
  }

  return {
    id: dTag,
    event,
    title,
    description,
    image,
    publicItems,
    privateItems,
    itemCount: publicItems.length + privateItems.length,
  };
}

export function useBookmarkSets() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<{ close: () => void } | null>(null);

  const query = useQuery({
    queryKey: ['bookmark-sets', user?.pubkey, config.relayMetadata.updatedAt],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      const relayUrls = config.relayMetadata.relays
        .filter(r => r.read || r.write)
        .map(r => r.url);

      const relayGroup = relayUrls.length > 0 ? nostr.group(relayUrls) : nostr;

      // Fetch all bookmark sets (kind 30003)
      const events = await relayGroup.query([
        {
          kinds: [30003],
          authors: [user.pubkey],
        },
      ]);

      console.log('Found', events.length, 'bookmark sets');

      // Parse all bookmark sets
      const sets = await Promise.all(
        events.map(event => parseBookmarkSet(event, user))
      );

      // Sort by most recent
      sets.sort((a, b) => b.event.created_at - a.event.created_at);

      return sets;
    },
    enabled: !!user,
    staleTime: 0,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const relayUrls = config.relayMetadata.relays
      .filter(r => r.read || r.write)
      .map(r => r.url);

    const relayGroup = relayUrls.length > 0 ? nostr.group(relayUrls) : nostr;

    console.log('Setting up realtime bookmark sets subscription');

    const sub = relayGroup.req(
      [
        {
          kinds: [30003],
          authors: [user.pubkey],
        },
      ],
      {
        onevent: async (event: NostrEvent) => {
          console.log('Received realtime bookmark set update:', event.id);

          const set = await parseBookmarkSet(event, user);

          // Update query cache
          queryClient.setQueryData(
            ['bookmark-sets', user.pubkey, config.relayMetadata.updatedAt],
            (old: BookmarkSet[] | undefined) => {
              if (!old) return [set];

              // Replace existing set with same id or add new
              const filtered = old.filter(s => s.id !== set.id);
              return [set, ...filtered].sort((a, b) => b.event.created_at - a.event.created_at);
            }
          );
        },
      }
    );

    subscriptionRef.current = sub;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.close();
        subscriptionRef.current = null;
      }
    };
  }, [user?.pubkey, config.relayMetadata.updatedAt, nostr, queryClient]);

  return query;
}

export function useBookmarkSetItems(setId: string) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const { data: sets } = useBookmarkSets();

  return useQuery({
    queryKey: ['bookmark-set-items', setId, user?.pubkey, config.relayMetadata.updatedAt],
    queryFn: async () => {
      if (!user || !sets) return [];

      const set = sets.find(s => s.id === setId);
      if (!set) return [];

      const relayUrls = config.relayMetadata.relays
        .filter(r => r.read || r.write)
        .map(r => r.url);

      const relayGroup = relayUrls.length > 0 ? nostr.group(relayUrls) : nostr;

      // Get all event IDs from both public and private items
      const eventIds = [...set.publicItems, ...set.privateItems]
        .filter(([tag]) => tag === 'e')
        .map(([, id]) => id);

      if (eventIds.length === 0) return [];

      // Fetch the actual events
      const events = await relayGroup.query([
        {
          ids: eventIds,
        },
      ]);

      return events;
    },
    enabled: !!user && !!sets,
  });
}

export function useCreateBookmarkSet() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description, image }: { title: string; description?: string; image?: string }) => {
      if (!user) throw new Error('Must be logged in');

      const writeRelayUrls = config.relayMetadata.relays
        .filter(r => r.write)
        .map(r => r.url);

      const writeRelayGroup = writeRelayUrls.length > 0 ? nostr.group(writeRelayUrls) : nostr;

      // Generate a random d tag
      const dTag = Date.now().toString(36) + Math.random().toString(36).substring(2);

      const tags: string[][] = [
        ['d', dTag],
        ['title', title],
      ];

      if (description) tags.push(['description', description]);
      if (image) tags.push(['image', image]);

      const event = await writeRelayGroup.event({
        kind: 30003,
        content: '',
        tags,
      });

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark-sets'] });
      toast({
        title: 'List created!',
        description: 'Your new bookmark list has been created',
      });
    },
    onError: (error) => {
      console.error('Failed to create bookmark set:', error);
      toast({
        title: 'Error',
        description: 'Failed to create bookmark list',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteBookmarkSet() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setId: string) => {
      if (!user) throw new Error('Must be logged in');

      const writeRelayUrls = config.relayMetadata.relays
        .filter(r => r.write)
        .map(r => r.url);

      const writeRelayGroup = writeRelayUrls.length > 0 ? nostr.group(writeRelayUrls) : nostr;

      // Publish deletion event (kind 5)
      const event = await writeRelayGroup.event({
        kind: 5,
        content: 'Deleted bookmark list',
        tags: [
          ['a', `30003:${user.pubkey}:${setId}`],
        ],
      });

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark-sets'] });
      toast({
        title: 'List deleted',
        description: 'Bookmark list has been deleted',
      });
    },
    onError: (error) => {
      console.error('Failed to delete bookmark set:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bookmark list',
        variant: 'destructive',
      });
    },
  });
}

export function useAddToBookmarkSet() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: sets } = useBookmarkSets();

  return useMutation({
    mutationFn: async ({ setId, eventId, isPrivate = false }: { setId: string; eventId: string; isPrivate?: boolean }) => {
      if (!user) throw new Error('Must be logged in');

      const set = sets?.find(s => s.id === setId);
      if (!set) throw new Error('Bookmark set not found');

      const writeRelayUrls = config.relayMetadata.relays
        .filter(r => r.write)
        .map(r => r.url);

      const writeRelayGroup = writeRelayUrls.length > 0 ? nostr.group(writeRelayUrls) : nostr;

      // Prepare new tags
      const newTag = ['e', eventId];
      let publicItems = [...set.publicItems];
      let privateItems = [...set.privateItems];

      // Check if already exists
      const existsInPublic = publicItems.some(([t, id]) => t === 'e' && id === eventId);
      const existsInPrivate = privateItems.some(([t, id]) => t === 'e' && id === eventId);

      if (existsInPublic || existsInPrivate) {
        throw new Error('Already in this list');
      }

      // Add to appropriate list
      if (isPrivate) {
        privateItems.push(newTag);
      } else {
        publicItems.push(newTag);
      }

      // Prepare tags for the event (metadata + public items)
      const tags: string[][] = [
        ['d', set.id],
        ['title', set.title],
      ];

      if (set.description) tags.push(['description', set.description]);
      if (set.image) tags.push(['image', set.image]);

      tags.push(...publicItems);

      // Encrypt private items if any
      let content = '';
      if (privateItems.length > 0 && user.signer.nip44) {
        content = await user.signer.nip44.encrypt(user.pubkey, JSON.stringify(privateItems));
      }

      const event = await writeRelayGroup.event({
        kind: 30003,
        content,
        tags,
      });

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark-sets'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-set-items'] });
      toast({
        title: 'Added to list!',
        description: 'Post added to bookmark list',
      });
    },
    onError: (error) => {
      console.error('Failed to add to bookmark set:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add to list',
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveFromBookmarkSet() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: sets } = useBookmarkSets();

  return useMutation({
    mutationFn: async ({ setId, eventId }: { setId: string; eventId: string }) => {
      if (!user) throw new Error('Must be logged in');

      const set = sets?.find(s => s.id === setId);
      if (!set) throw new Error('Bookmark set not found');

      const writeRelayUrls = config.relayMetadata.relays
        .filter(r => r.write)
        .map(r => r.url);

      const writeRelayGroup = writeRelayUrls.length > 0 ? nostr.group(writeRelayUrls) : nostr;

      // Remove from both lists
      const publicItems = set.publicItems.filter(([t, id]) => !(t === 'e' && id === eventId));
      const privateItems = set.privateItems.filter(([t, id]) => !(t === 'e' && id === eventId));

      // Prepare tags
      const tags: string[][] = [
        ['d', set.id],
        ['title', set.title],
      ];

      if (set.description) tags.push(['description', set.description]);
      if (set.image) tags.push(['image', set.image]);

      tags.push(...publicItems);

      // Encrypt private items
      let content = '';
      if (privateItems.length > 0 && user.signer.nip44) {
        content = await user.signer.nip44.encrypt(user.pubkey, JSON.stringify(privateItems));
      }

      const event = await writeRelayGroup.event({
        kind: 30003,
        content,
        tags,
      });

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark-sets'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-set-items'] });
      toast({
        title: 'Removed from list',
        description: 'Post removed from bookmark list',
      });
    },
    onError: (error) => {
      console.error('Failed to remove from bookmark set:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove from list',
        variant: 'destructive',
      });
    },
  });
}

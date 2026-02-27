import { useEffect, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';

// Default relays for logged-out users and users without NIP-65 relay list
const DEFAULT_RELAYS = [
  { url: 'wss://relay.ditto.pub', read: true, write: true },
  { url: 'wss://relay.primal.net', read: true, write: true },
  { url: 'wss://relay.damus.io', read: true, write: true },
  { url: 'wss://nos.lol', read: true, write: true },
  { url: 'wss://relay.nostr.band', read: true, write: true },
];

/**
 * NostrSync - Syncs user's Nostr data
 *
 * This component runs globally to sync various Nostr data when the user logs in.
 * Currently syncs:
 * - NIP-65 relay list (kind 10002)
 * - Falls back to default relays when user doesn't have a relay list
 */
export function NostrSync() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config, updateConfig } = useAppContext();
  const previousUserRef = useRef<string | null>(null);
  const hasAttemptedSync = useRef<boolean>(false);

  useEffect(() => {
    // Check if user logged out
    if (previousUserRef.current && !user) {
      console.log('User logged out, resetting to default relays');
      updateConfig(() => ({
        theme: config.theme, // Preserve theme
        showContentWarnings: config.showContentWarnings, // Preserve content warnings setting
        relayMetadata: {
          relays: DEFAULT_RELAYS,
          updatedAt: 0,
        },
      }));
      hasAttemptedSync.current = false;
    }

    // Update the ref to track login state
    previousUserRef.current = user?.pubkey || null;

    if (!user) return;

    // Only sync once per login session
    if (hasAttemptedSync.current) return;

    const syncRelaysFromNostr = async () => {
      try {
        console.log('User logged in, fetching relay list from Nostr...');
        hasAttemptedSync.current = true;
        
        // Query multiple relays to find the user's relay list
        const events = await nostr.query(
          [{ kinds: [10002], authors: [user.pubkey], limit: 1 }],
          { signal: AbortSignal.timeout(10000) }
        );

        if (events.length > 0) {
          const event = events[0];

          // Only update if the event is newer than our stored data
          if (event.created_at > config.relayMetadata.updatedAt) {
            const fetchedRelays = event.tags
              .filter(([name]) => name === 'r')
              .map(([_, url, marker]) => ({
                url,
                read: !marker || marker === 'read',
                write: !marker || marker === 'write',
              }));

            if (fetchedRelays.length > 0) {
              console.log('✅ Found user relay list from Nostr:', fetchedRelays);
              updateConfig((current) => ({
                ...current,
                relayMetadata: {
                  relays: fetchedRelays,
                  updatedAt: event.created_at,
                },
              }));
            } else {
              console.log('⚠️ Relay list found but empty, using default relays');
              updateConfig((current) => ({
                ...current,
                relayMetadata: {
                  relays: DEFAULT_RELAYS,
                  updatedAt: 0,
                },
              }));
            }
          } else {
            console.log('✅ Stored relay list is already up to date');
          }
        } else {
          console.log('⚠️ No NIP-65 relay list found for user, using default relays');
          // User doesn't have a relay list published, use defaults
          updateConfig((current) => ({
            ...current,
            relayMetadata: {
              relays: DEFAULT_RELAYS,
              updatedAt: 0,
            },
          }));
        }
      } catch (error) {
        console.error('❌ Failed to sync relays from Nostr:', error);
        // On error, ensure we have default relays
        updateConfig((current) => ({
          ...current,
          relayMetadata: {
            relays: DEFAULT_RELAYS,
            updatedAt: 0,
          },
        }));
      }
    };

    syncRelaysFromNostr();
  }, [user?.pubkey, nostr, updateConfig, config.relayMetadata.updatedAt]);

  return null;
}
import { NostrEvent, NostrMetadata } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import { nip19 } from 'nostr-tools';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { MediaContent } from '@/components/MediaContent';
import { NoteContent } from '@/components/NoteContent';

interface EmbeddedNoteProps {
  eventId: string;
  depth?: number;
}

const MAX_EMBED_DEPTH = 2; // Prevent infinite nesting

export function EmbeddedNote({ eventId, depth = 0 }: EmbeddedNoteProps) {
  const { nostr } = useNostr();
  const { config } = useAppContext();

  // Fetch the embedded event
  const { data: event, isLoading } = useQuery({
    queryKey: ['embedded-note', eventId, config.relayMetadata.updatedAt],
    queryFn: async () => {
      const relayUrls = config.relayMetadata.relays
        .filter(r => r.read)
        .map(r => r.url);

      const relayGroup = relayUrls.length > 0 
        ? nostr.group(relayUrls)
        : nostr;

      const events = await relayGroup.query([
        {
          ids: [eventId],
          limit: 1,
        },
      ]);

      return events[0] || null;
    },
  });

  const author = useAuthor(event?.pubkey || '');
  const metadata: NostrMetadata | undefined = author.data?.metadata;

  if (isLoading) {
    return (
      <Card className="border-2 border-muted bg-muted/30">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Loading note...</div>
        </CardContent>
      </Card>
    );
  }

  if (!event) {
    const noteId = nip19.noteEncode(eventId);
    return (
      <Card className="border-2 border-muted bg-muted/30">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            Note not found.{' '}
            <Link to={`/${noteId}`} className="text-blue-500 hover:underline">
              View on Nostr
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayName = metadata?.display_name || metadata?.name || genUserName(event.pubkey);
  const username = metadata?.name || genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const npub = nip19.npubEncode(event.pubkey);
  const noteId = nip19.noteEncode(event.id);

  const timeAgo = formatDistanceToNow(new Date(event.created_at * 1000), {
    addSuffix: true,
  });

  return (
    <Card className="border-2 border-muted bg-muted/30 hover:bg-muted/40 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Link to={`/${npub}`} className="shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/${npub}`}
                  className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
                >
                  {displayName}
                </Link>
                <p className="text-xs text-muted-foreground line-clamp-1">@{username}</p>
              </div>
              <Link
                to={`/${noteId}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                {timeAgo}
              </Link>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="mb-3">
          <NoteContent event={event} className="text-sm" />
        </div>

        {/* Media Display */}
        <MediaContent event={event} />
      </CardContent>
    </Card>
  );
}

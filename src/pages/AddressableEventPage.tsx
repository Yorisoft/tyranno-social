import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { NoteContent } from '@/components/NoteContent';
import { MediaContent } from '@/components/MediaContent';
import { formatDistanceToNow } from 'date-fns';
import type { NostrEvent, NostrMetadata } from '@nostrify/nostrify';

interface AddressableEventPageProps {
  kind: number;
  pubkey: string;
  identifier: string;
}

export function AddressableEventPage({ kind, pubkey, identifier }: AddressableEventPageProps) {
  const navigate = useNavigate();
  const { nostr } = useNostr();
  const { config } = useAppContext();

  const { data: event, isLoading } = useQuery({
    queryKey: ['addressable-event-page', kind, pubkey, identifier, config.relayMetadata.updatedAt],
    queryFn: async () => {
      const relayUrls = config.relayMetadata.relays
        .filter(r => r.read)
        .map(r => r.url);

      const relayGroup = relayUrls.length > 0 
        ? nostr.group(relayUrls)
        : nostr;

      const events = await relayGroup.query([
        {
          kinds: [kind],
          authors: [pubkey],
          '#d': [identifier],
          limit: 1,
        },
      ]);

      return events[0] || null;
    },
  });

  const author = useAuthor(event?.pubkey || pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;

  const displayName = metadata?.display_name || metadata?.name || genUserName(pubkey);
  const username = metadata?.name || genUserName(pubkey);
  const profileImage = metadata?.picture;
  const npub = nip19.npubEncode(pubkey);

  // Extract metadata from tags
  const title = event?.tags.find(([name]) => name === 'title')?.[1];
  const summary = event?.tags.find(([name]) => name === 'summary')?.[1];
  const image = event?.tags.find(([name]) => name === 'image')?.[1];
  const publishedAt = event?.tags.find(([name]) => name === 'published_at')?.[1];

  const timeAgo = event 
    ? formatDistanceToNow(new Date((publishedAt ? parseInt(publishedAt) : event.created_at) * 1000), {
        addSuffix: true,
      })
    : '';

  // Get kind name for display
  const getKindName = (k: number): string => {
    const kindNames: Record<number, string> = {
      30023: 'Article',
      30311: 'Live Event',
      30402: 'Classified Listing',
      34550: 'Community',
      30078: 'App Data',
      31922: 'Calendar Event',
      31923: 'Calendar Event',
      30024: 'Draft Article',
      30403: 'Draft Listing',
    };
    return kindNames[k] || `Kind ${k}`;
  };

  const kindName = getKindName(kind);

  useSeoMeta({
    title: title ? `${title} - Tyrannosocial` : `${kindName} - Tyrannosocial`,
    description: summary || event?.content.substring(0, 200) || `View this ${kindName} on Tyrannosocial`,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {isLoading ? (
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ) : !event ? (
          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <p className="text-muted-foreground">Event not found.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="space-y-4">
              {/* Author Info */}
              <div className="flex items-start gap-4">
                <Link to={`/${npub}`}>
                  <Avatar className="h-12 w-12 ring-2 ring-background">
                    <AvatarImage src={profileImage} alt={displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                      {displayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link
                      to={`/${npub}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {displayName}
                    </Link>
                    <span className="text-sm text-muted-foreground">@{username}</span>
                    <Badge variant="secondary">
                      {kindName}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{timeAgo}</p>
                </div>
              </div>

              {/* Title */}
              {title && (
                <h1 className="text-3xl font-bold">{title}</h1>
              )}

              {/* Summary */}
              {summary && (
                <p className="text-muted-foreground text-lg">{summary}</p>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Featured Image */}
              {image && (
                <img 
                  src={image} 
                  alt={title || 'Event image'} 
                  className="w-full rounded-lg object-cover max-h-96"
                />
              )}

              {/* Content */}
              {event.content && (
                <div className="prose prose-sm sm:prose-base max-w-none">
                  <NoteContent event={event} />
                </div>
              )}

              {/* Media Content */}
              <MediaContent event={event} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

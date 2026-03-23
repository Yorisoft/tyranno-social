/**
 * InlineSuggestions
 *
 * A full-width card injected into the feed every ~20-25 posts.
 * Shows 3 users recommended via Web-of-Trust score (friends-of-friends),
 * each with avatar, name, handle and a follow button.
 *
 * The `batchIndex` prop selects which slice of the ranked suggestion list
 * to display, so each occurrence shows a different trio.
 */

import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useWoTSuggestions } from '@/hooks/useWoTSuggestions';
import { useAuthor } from '@/hooks/useAuthor';
import { FollowButton } from '@/components/FollowButton';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import type { NostrMetadata } from '@nostrify/nostrify';

const BATCH_SIZE = 3;

function SuggestionUser({ pubkey, score }: { pubkey: string; score: number }) {
  const author = useAuthor(pubkey);
  const meta: NostrMetadata | undefined = author.data?.metadata;
  const displayName = meta?.display_name || meta?.name || genUserName(pubkey);
  const username = meta?.name || genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);

  if (author.isLoading) {
    return (
      <div className="flex flex-col items-center gap-2 flex-1 min-w-0 px-2">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0 px-2 text-center">
      <Link to={`/${npub}`} className="shrink-0">
        <Avatar className="h-12 w-12 ring-2 ring-background hover:ring-primary/30 transition-all">
          <AvatarImage src={meta?.picture} alt={displayName} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 w-full">
        <Link
          to={`/${npub}`}
          className="text-xs font-semibold hover:text-primary transition-colors block truncate"
        >
          {displayName}
        </Link>
        <p className="text-[10px] text-muted-foreground truncate">@{username}</p>
        {score > 1 && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            {score} mutual{score !== 1 ? 's' : ''} follow
          </p>
        )}
      </div>

      <FollowButton pubkey={pubkey} iconOnly />
    </div>
  );
}

interface InlineSuggestionsProps {
  /** Which batch of 3 users to show (0 = top 3, 1 = next 3, …) */
  batchIndex: number;
}

export function InlineSuggestions({ batchIndex }: InlineSuggestionsProps) {
  const { data: suggestions, isLoading } = useWoTSuggestions(30);

  const start = batchIndex * BATCH_SIZE;
  const batch = suggestions?.slice(start, start + BATCH_SIZE) ?? [];

  // Don't render if there's nothing to show and we're done loading
  if (!isLoading && batch.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-card via-primary/5 to-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-border/40">
        <div className="p-1 rounded-md bg-primary/10">
          <Users className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold text-foreground">People you might like</span>
        <span className="text-[10px] text-muted-foreground ml-auto">Based on who you follow</span>
      </div>

      {/* User row */}
      <div className="flex items-start justify-around py-4 px-2">
        {isLoading && batch.length === 0 ? (
          // Loading skeletons
          Array.from({ length: BATCH_SIZE }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 px-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          ))
        ) : (
          batch.map((s) => (
            <SuggestionUser key={s.pubkey} pubkey={s.pubkey} score={s.score} />
          ))
        )}
      </div>
    </div>
  );
}

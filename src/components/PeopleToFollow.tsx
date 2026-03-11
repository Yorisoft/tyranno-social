/**
 * PeopleToFollow — "Who to Follow" suggestion panel.
 * Shows active users the current user is not yet following.
 */

import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useSuggestedUsers } from '@/hooks/useSuggestedUsers';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { FollowButton } from '@/components/FollowButton';
import { genUserName } from '@/lib/genUserName';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import type { NostrMetadata } from '@nostrify/nostrify';

function SuggestedUserRow({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const meta: NostrMetadata | undefined = author.data?.metadata;
  const displayName = meta?.display_name || meta?.name || genUserName(pubkey);
  const username = meta?.name || genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);

  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <Link to={`/${npub}`} className="shrink-0">
        <Avatar className="h-9 w-9 ring-2 ring-background hover:ring-primary/20 transition-all">
          <AvatarImage src={meta?.picture} alt={displayName} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-sm">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          to={`/${npub}`}
          className="text-sm font-semibold hover:text-primary transition-colors block truncate"
        >
          {displayName}
        </Link>
        <p className="text-xs text-muted-foreground truncate">@{username}</p>
      </div>
      <FollowButton pubkey={pubkey} iconOnly />
    </div>
  );
}

export function PeopleToFollow() {
  const { user } = useCurrentUser();
  const { data: suggestions, isLoading } = useSuggestedUsers(5);

  // Only show when logged in
  if (!user) return null;
  if (!isLoading && (!suggestions || suggestions.length === 0)) return null;

  return (
    <Card className="border-border/50 dark:border-transparent bg-gradient-to-br from-card to-blue-50/20 dark:from-card dark:to-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Who to Follow
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {suggestions?.map((s) => (
              <SuggestedUserRow key={s.pubkey} pubkey={s.pubkey} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

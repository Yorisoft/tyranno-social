import type { NostrEvent, NostrMetadata } from '@nostrify/nostrify';
import { useAuthor } from '@/hooks/useAuthor';
import { useReactions } from '@/hooks/useReactions';
import { useReplies } from '@/hooks/useReplies';
import { useFollows } from '@/hooks/useFollows';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useBookmarkPost } from '@/hooks/useBookmarkPost';
import { useToast } from '@/hooks/useToast';
import { genUserName } from '@/lib/genUserName';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NoteContent } from '@/components/NoteContent';
import { EmojiReactionPicker } from '@/components/EmojiReactionPicker';
import { MediaContent } from '@/components/MediaContent';
import { ZapButton } from '@/components/ZapButton';
import { BookmarkListsDialog } from '@/components/BookmarkListsDialog';
import { ContentWarningWrapper } from '@/components/ContentWarningWrapper';
import { MessageCircle, Repeat2, Send, Bookmark, MoreHorizontal, Copy, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nip19 } from 'nostr-tools';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface PostDetailDialogProps {
  event: NostrEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReplyItem({ reply, isFollowing }: { reply: NostrEvent; isFollowing?: boolean }) {
  const author = useAuthor(reply.pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(reply.pubkey);
  const username = metadata?.name || genUserName(reply.pubkey);
  const profileImage = metadata?.picture;
  const npub = nip19.npubEncode(reply.pubkey);
  const timeAgo = formatDistanceToNow(new Date(reply.created_at * 1000), { addSuffix: true });

  return (
    <div className={`flex gap-3 py-3 ${isFollowing ? 'bg-primary/5 -mx-4 px-4 rounded-lg' : ''}`}>
      <Link to={`/${npub}`} className="shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profileImage} alt={displayName} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-sm">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Link to={`/${npub}`} className="font-semibold text-sm hover:text-primary transition-colors">
            {displayName}
          </Link>
          <span className="text-xs text-muted-foreground">@{username}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {isFollowing && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Following</Badge>
          )}
        </div>
        <div className="space-y-2">
          <div className="text-sm whitespace-pre-wrap break-words">
            <NoteContent event={reply} />
          </div>
          <ContentWarningWrapper event={reply} mediaOnly={true}>
            <MediaContent event={reply} />
          </ContentWarningWrapper>
        </div>
      </div>
    </div>
  );
}

/** Inner content — only rendered when we have a valid event */
function DialogBody({
  event,
  onOpenChange,
}: {
  event: NostrEvent;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useCurrentUser();
  const { mutate: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const [replyContent, setReplyContent] = useState('');
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);

  const author = useAuthor(event.pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const { data: reactions, isLoading: isLoadingReactions } = useReactions(event.id);
  const { data: replies, isLoading: isLoadingReplies } = useReplies(event.id);
  const { data: followPubkeys = [] } = useFollows(user?.pubkey);
  const { toggleBookmark, useIsBookmarked } = useBookmarkPost();
  const { data: isBookmarked } = useIsBookmarked(event.id);

  const displayName = metadata?.display_name || metadata?.name || genUserName(event.pubkey);
  const username = metadata?.name || genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const npub = nip19.npubEncode(event.pubkey);
  const timeAgo = formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true });

  const sortedReplies = replies?.slice().sort((a, b) => {
    const aIsFollow = followPubkeys.includes(a.pubkey);
    const bIsFollow = followPubkeys.includes(b.pubkey);
    if (aIsFollow && !bIsFollow) return -1;
    if (!aIsFollow && bIsFollow) return 1;
    return a.created_at - b.created_at;
  });

  const handleReply = () => {
    if (!replyContent.trim()) return;
    publishEvent(
      {
        kind: 1,
        content: replyContent.trim(),
        tags: [
          ['e', event.id, '', 'reply'],
          ['p', event.pubkey],
        ],
      },
      {
        onSuccess: () => setReplyContent(''),
      }
    );
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: `${label} copied to clipboard` });
    } catch {
      toast({ title: 'Error', description: 'Failed to copy to clipboard', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-4">
      <DialogHeader>
        <DialogTitle className="sr-only">Post Details</DialogTitle>
      </DialogHeader>

      {/* Author */}
      <div className="flex items-start gap-3">
        <Link to={`/${npub}`} onClick={() => onOpenChange(false)} className="shrink-0">
          <Avatar className="h-12 w-12 ring-2 ring-background">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={`/${npub}`}
            onClick={() => onOpenChange(false)}
            className="font-semibold hover:text-primary transition-colors"
          >
            {displayName}
          </Link>
          <p className="text-sm text-muted-foreground">@{username}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      {/* Content */}
      <div className="text-base leading-relaxed whitespace-pre-wrap break-words">
        <NoteContent event={event} />
      </div>

      {/* Media */}
      <ContentWarningWrapper event={event} mediaOnly={true}>
        <MediaContent event={event} />
      </ContentWarningWrapper>

      {/* Reactions */}
      {!isLoadingReactions && reactions && Object.keys(reactions).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(reactions).map(([emoji, data]) => {
            const isUserReaction = user && data.pubkeys.includes(user.pubkey);
            return (
              <Badge
                key={emoji}
                variant={isUserReaction ? 'default' : 'secondary'}
                className={`text-base px-3 py-1 cursor-default ${isUserReaction ? 'ring-2 ring-primary/50' : ''}`}
              >
                {emoji} {data.count}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10">
            <MessageCircle className="h-4 w-4 mr-1" />
            {replies?.length || 0}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10">
            <Repeat2 className="h-4 w-4" />
          </Button>
          <ZapButton
            target={event as any}
            className="h-8 px-2 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 flex items-center gap-1"
            showCount={true}
          />
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 ${isBookmarked ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10' : 'text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10'}`}
            onClick={() => setBookmarkDialogOpen(true)}
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </Button>
          <EmojiReactionPicker
            eventId={event.id}
            className="h-8 px-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => copyToClipboard(event.id, 'Event ID')} className="gap-2 cursor-pointer">
              <Copy className="h-4 w-4" /> Copy Event ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyToClipboard(event.pubkey, 'User ID')} className="gap-2 cursor-pointer">
              <User className="h-4 w-4" /> Copy User ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyToClipboard(nip19.noteEncode(event.id), 'Note ID')} className="gap-2 cursor-pointer">
              <Copy className="h-4 w-4" /> Copy Note ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyToClipboard(npub, 'User npub')} className="gap-2 cursor-pointer">
              <User className="h-4 w-4" /> Copy User npub
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {/* Reply form */}
      {user && (
        <div className="space-y-3">
          <Textarea
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={isPending}
          />
          <div className="flex justify-end">
            <Button onClick={handleReply} disabled={isPending || !replyContent.trim()} size="sm">
              {isPending ? 'Posting…' : <><Send className="h-4 w-4 mr-2" />Reply</>}
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      <div>
        <h3 className="font-semibold mb-3">
          Replies {replies && replies.length > 0 && `(${replies.length})`}
        </h3>

        {isLoadingReplies ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedReplies && sortedReplies.length > 0 ? (
          <div className="divide-y divide-border/50">
            {sortedReplies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                isFollowing={followPubkeys.includes(reply.pubkey)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No replies yet. Be the first to reply!
          </p>
        )}
      </div>

      <BookmarkListsDialog
        open={bookmarkDialogOpen}
        onOpenChange={setBookmarkDialogOpen}
        eventId={event.id}
      />
    </div>
  );
}

export function PostDetailDialog({ event, open, onOpenChange }: PostDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {event ? (
          <DialogBody event={event} onOpenChange={onOpenChange} />
        ) : (
          <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

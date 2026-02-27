import { useState, useEffect, useRef } from 'react';
import { useChannelMessages } from '@/hooks/useChannelMessages';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Hash, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { NostrMetadata } from '@nostrify/nostrify';

interface ChannelChatAreaProps {
  channelId: string;
  channelName: string;
}

export function ChannelChatArea({ channelId, channelName }: ChannelChatAreaProps) {
  const { user } = useCurrentUser();
  const [messageText, setMessageText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { mutate: publishEvent, isPending: isSending } = useNostrPublish();

  const {
    data: messagePages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChannelMessages(channelId);

  // Flatten all pages and reverse for chronological order
  const messages = messagePages?.pages.flat().reverse() ?? [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || isSending) return;

    const content = messageText.trim();
    setMessageText('');

    // Send kind 42 message
    publishEvent({
      kind: 42,
      content,
      tags: [
        ['e', channelId, '', 'root'],
      ],
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-card to-primary/5">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{channelName}</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Public group chat
        </p>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {/* Load More Button */}
          {hasNextPage && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="gap-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load older messages'
                )}
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                No messages yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Be the first to send a message!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <ChannelMessage key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      {user && (
        <div className="p-4 border-t border-border/50 bg-gradient-to-r from-card to-primary/5">
          <div className="flex gap-2">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Message #${channelName}`}
              className="min-h-[60px] max-h-32 resize-none"
              disabled={isSending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || isSending}
              size="icon"
              className="h-[60px] w-[60px] shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}

interface ChannelMessageProps {
  message: NostrEvent;
}

function ChannelMessage({ message }: ChannelMessageProps) {
  const author = useAuthor(message.pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const { user } = useCurrentUser();

  const displayName = metadata?.display_name || metadata?.name || genUserName(message.pubkey);
  const profileImage = metadata?.picture;
  const isOwnMessage = user?.pubkey === message.pubkey;

  const timeAgo = formatDistanceToNow(new Date(message.created_at * 1000), {
    addSuffix: true,
  });

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-10 w-10 shrink-0 ring-2 ring-background">
        <AvatarImage src={profileImage} alt={displayName} />
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
          {displayName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={`flex-1 min-w-0 ${isOwnMessage ? 'items-end' : ''}`}>
        <div className={`flex items-baseline gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          <span className="font-semibold text-sm">{displayName}</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <div
          className={`inline-block max-w-[80%] p-3 rounded-lg ${
            isOwnMessage
              ? 'bg-primary text-primary-foreground rounded-tr-none'
              : 'bg-muted rounded-tl-none'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

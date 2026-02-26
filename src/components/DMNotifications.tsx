import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useDMContext } from '@/hooks/useDMContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { MESSAGE_PROTOCOL } from '@/lib/dmConstants';
import type { NostrMetadata } from '@nostrify/nostrify';

interface DMNotification {
  id: string;
  pubkey: string;
  content: string;
  timestamp: number;
}

export function DMNotifications() {
  const { user } = useCurrentUser();
  const dmContext = useDMContext();
  const [notifications, setNotifications] = useState<DMNotification[]>([]);
  const [lastSeenMessages, setLastSeenMessages] = useState<Map<string, number>>(new Map());
  const navigate = useNavigate();

  // Safely destructure after getting context
  const conversations = dmContext?.conversations || [];
  const sendMessage = dmContext?.sendMessage;

  // Detect new messages and create notifications
  useEffect(() => {
    if (!conversations) return;
    
    conversations.forEach(conversation => {
      // Only show notifications for messages from others
      if (!conversation.lastMessage || conversation.lastMessageFromUser) {
        return;
      }

      const lastMessageTime = conversation.lastMessage.created_at;
      const lastSeen = lastSeenMessages.get(conversation.pubkey) || 0;

      // New message detected
      if (lastMessageTime > lastSeen) {
        const messageContent = conversation.lastMessage.decryptedContent || '🔒 Encrypted message';
        
        // Create notification
        const notification: DMNotification = {
          id: `${conversation.pubkey}-${lastMessageTime}`,
          pubkey: conversation.pubkey,
          content: messageContent,
          timestamp: lastMessageTime,
        };

        setNotifications(prev => {
          // Don't add duplicate notifications
          if (prev.some(n => n.id === notification.id)) {
            return prev;
          }
          return [...prev, notification];
        });

        // Update last seen
        setLastSeenMessages(prev => new Map(prev).set(conversation.pubkey, lastMessageTime));
      }
    });
  }, [conversations, lastSeenMessages, user.pubkey]);

  // Auto-dismiss notifications after 10 seconds
  useEffect(() => {
    if (notifications.length === 0) return;

    const timer = setTimeout(() => {
      setNotifications(prev => prev.slice(1)); // Remove oldest
    }, 10000);

    return () => clearTimeout(timer);
  }, [notifications]);

  const handleDismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleViewAll = useCallback(() => {
    navigate('/messages');
    setNotifications([]);
  }, [navigate]);

  // Don't render anything if user is not logged in or no notifications
  if (!user || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <DMNotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={() => handleDismiss(notification.id)}
          onViewAll={handleViewAll}
        />
      ))}
    </div>
  );
}

interface DMNotificationCardProps {
  notification: DMNotification;
  onDismiss: () => void;
  onViewAll: () => void;
}

function DMNotificationCard({ notification, onDismiss, onViewAll }: DMNotificationCardProps) {
  const { user } = useCurrentUser();
  const dmContext = useDMContext();
  const sendMessage = dmContext?.sendMessage;
  const author = useAuthor(notification.pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const displayName = metadata?.display_name || metadata?.name || genUserName(notification.pubkey);
  const profileImage = metadata?.picture;

  const handleQuickReply = async () => {
    if (!replyText.trim() || !user) return;

    setIsSending(true);
    try {
      await sendMessage({
        recipientPubkey: notification.pubkey,
        content: replyText.trim(),
        protocol: MESSAGE_PROTOCOL.NIP17,
      });
      setReplyText('');
      setShowReply(false);
      onDismiss();
    } catch (error) {
      console.error('[DMNotification] Failed to send reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="shadow-2xl border-border/50 dark:border-transparent overflow-hidden animate-in slide-in-from-right-full">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10 ring-2 ring-background shrink-0">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-sm">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="h-4 w-4 text-primary shrink-0" />
              <p className="font-semibold text-sm truncate">{displayName}</p>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 break-words">
              {notification.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-6 w-6 shrink-0 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Quick Reply */}
        {showReply ? (
          <div className="space-y-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              className="min-h-[60px] resize-none text-sm"
              disabled={isSending}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickReply();
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleQuickReply}
                disabled={!replyText.trim() || isSending}
                size="sm"
                className="flex-1"
              >
                <Send className="h-3 w-3 mr-2" />
                {isSending ? 'Sending...' : 'Send Reply'}
              </Button>
              <Button
                onClick={() => setShowReply(false)}
                variant="outline"
                size="sm"
                disabled={isSending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => setShowReply(true)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Quick Reply
            </Button>
            <Button
              onClick={onViewAll}
              size="sm"
              className="flex-1"
            >
              View All
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

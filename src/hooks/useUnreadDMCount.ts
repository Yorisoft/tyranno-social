import { useMemo } from 'react';
import { useDMContext } from '@/hooks/useDMContext';

/**
 * Hook to get the count of unread DM conversations.
 * 
 * A conversation is considered unread if:
 * - It has a last message
 * - The last message is NOT from the current user
 * 
 * @returns Number of conversations with unread messages
 * 
 * @example
 * ```tsx
 * import { useUnreadDMCount } from '@/hooks/useUnreadDMCount';
 * 
 * function Header() {
 *   const unreadCount = useUnreadDMCount();
 *   
 *   return (
 *     <Button>
 *       Messages
 *       {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useUnreadDMCount(): number {
  const dmContext = useDMContext();
  const conversations = dmContext?.conversations || [];

  return useMemo(() => {
    if (!conversations || conversations.length === 0) {
      return 0;
    }
    
    return conversations.filter(conversation => 
      conversation.lastMessage && !conversation.lastMessageFromUser
    ).length;
  }, [conversations]);
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';

interface EmojiReactionPickerProps {
  eventId: string;
  className?: string;
}

const COMMON_EMOJIS = ['❤️', '👍', '🔥', '😂', '🎉', '🤔', '👏', '⚡'];

export function EmojiReactionPicker({ eventId, className }: EmojiReactionPickerProps) {
  const { user } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleReaction = (emoji: string) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to react to posts.',
        variant: 'destructive',
      });
      return;
    }

    publishEvent(
      {
        kind: 7,
        content: emoji,
        tags: [['e', eventId]],
      },
      {
        onSuccess: () => {
          setOpen(false);
          toast({
            title: 'Reaction added!',
            description: `You reacted with ${emoji}`,
          });
        },
        onError: () => {
          toast({
            title: 'Failed to react',
            description: 'There was an error adding your reaction.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
        >
          <SmilePlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {COMMON_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 text-xl hover:scale-125 transition-transform"
              onClick={() => handleReaction(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

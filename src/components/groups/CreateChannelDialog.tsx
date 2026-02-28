import { useState } from 'react';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Hash, Loader2 } from 'lucide-react';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated?: (channelId: string) => void;
}

export function CreateChannelDialog({ open, onOpenChange, onChannelCreated }: CreateChannelDialogProps) {
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [picture, setPicture] = useState('');
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a channel name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const metadata = {
        name: name.trim(),
        about: about.trim(),
        ...(picture.trim() && { picture: picture.trim() }),
      };

      // Create kind 40 channel creation event
      const result = await publishEvent({
        kind: 40,
        content: JSON.stringify(metadata),
        tags: [],
      });

      toast({
        title: 'Channel created!',
        description: `#${name} is ready for messages`,
      });

      // Reset form
      setName('');
      setAbout('');
      setPicture('');
      
      // Close dialog
      onOpenChange(false);

      // Notify parent of channel creation
      if (onChannelCreated && result) {
        onChannelCreated(result.id);
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
      toast({
        title: 'Failed to create channel',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Create Channel
          </DialogTitle>
          <DialogDescription>
            Create a public group chat channel on Nostr
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel Name *</Label>
            <Input
              id="channel-name"
              placeholder="e.g., General, Random, Tech Talk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-about">Description</Label>
            <Textarea
              id="channel-about"
              placeholder="What is this channel about?"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              disabled={isPending}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-picture">Picture URL (optional)</Label>
            <Input
              id="channel-picture"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={picture}
              onChange={(e) => setPicture(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Hash className="h-4 w-4" />
                Create Channel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

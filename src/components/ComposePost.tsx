import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NoteContent } from '@/components/NoteContent';
import { genUserName } from '@/lib/genUserName';
import { Send, Eye } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import type { NostrEvent } from '@nostrify/nostrify';

export function ComposePost() {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const displayName = user?.metadata?.display_name || user?.metadata?.name || genUserName(user?.pubkey || '');
  const username = user?.metadata?.name || genUserName(user?.pubkey || '');
  const profileImage = user?.metadata?.picture;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: 'Empty post',
        description: 'Please write something before posting.',
        variant: 'destructive',
      });
      return;
    }

    createEvent(
      { kind: 1, content: content.trim() },
      {
        onSuccess: () => {
          setContent('');
          setShowPreview(false);
          toast({
            title: 'Post published!',
            description: 'Your post has been shared with the network.',
          });
        },
        onError: () => {
          toast({
            title: 'Failed to publish',
            description: 'There was an error publishing your post. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (!user) return null;

  // Create a preview event object
  const previewEvent: NostrEvent = {
    id: 'preview',
    pubkey: user.pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 1,
    tags: [],
    content: content || 'What\'s on your mind?',
    sig: '',
  };

  return (
    <>
      <Card className="border-border/50 dark:border-transparent shadow-md bg-gradient-to-br from-card via-rose-50/30 to-pink-50/20 dark:from-card dark:via-card dark:to-card">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-background shrink-0">
                <AvatarImage src={profileImage} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] resize-none border-border/50 focus-visible:ring-primary/50"
                  disabled={isPending}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!content.trim()}
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || !content.trim()}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
                  >
                    {isPending ? (
                      <>Publishing...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Preview</DialogTitle>
          </DialogHeader>
          
          <Card className="border-border/50 dark:border-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-background">
                  <AvatarImage src={profileImage} alt={displayName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                    {displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{displayName}</div>
                  <div className="text-xs text-muted-foreground">@{username}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="whitespace-pre-wrap break-words">
                <NoteContent event={previewEvent} className="text-sm" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Back to Edit
            </Button>
            <Button
              onClick={(e) => {
                setShowPreview(false);
                handleSubmit(e as any);
              }}
              disabled={isPending}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
            >
              <Send className="h-4 w-4 mr-2" />
              Post Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bookmark,
  Plus,
  Lock,
  Globe,
  FolderPlus,
  Check,
  Loader2,
} from 'lucide-react';
import {
  useBookmarkSets,
  useCreateBookmarkSet,
  useAddToBookmarkSet,
} from '@/hooks/useBookmarkSets';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface BookmarkListsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export function BookmarkListsDialog({
  open,
  onOpenChange,
  eventId,
}: BookmarkListsDialogProps) {
  const { user } = useCurrentUser();
  const { data: sets, isLoading } = useBookmarkSets();
  const { mutate: createSet, isPending: isCreating } = useCreateBookmarkSet();
  const { mutate: addToSet, isPending: isAdding } = useAddToBookmarkSet();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedPrivacy, setSelectedPrivacy] = useState<'public' | 'private'>('public');

  const handleCreateList = () => {
    if (!newListTitle.trim()) return;

    createSet(
      {
        title: newListTitle.trim(),
        description: newListDescription.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNewListTitle('');
          setNewListDescription('');
          setShowCreateForm(false);
        },
      }
    );
  };

  const handleAddToList = (setId: string, isPrivate: boolean) => {
    addToSet(
      { setId, eventId, isPrivate },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Save to List
            </DialogTitle>
            <DialogDescription>
              Log in to save posts to your bookmark lists
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Save to Bookmark List
          </DialogTitle>
          <DialogDescription>
            Choose a list or create a new one to organize your bookmarks
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {/* Create New List Section */}
          {!showCreateForm ? (
            <Button
              variant="outline"
              className="w-full mb-4 border-dashed"
              onClick={() => setShowCreateForm(true)}
              disabled={isCreating}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Create New List
            </Button>
          ) : (
            <div className="border rounded-lg p-4 mb-4 space-y-3 bg-accent/10">
              <div className="space-y-2">
                <Label htmlFor="list-title">List Name *</Label>
                <Input
                  id="list-title"
                  placeholder="e.g., Read Later, Favorites, Tech Articles"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="list-description">Description (optional)</Label>
                <Textarea
                  id="list-description"
                  placeholder="What's this list for?"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  disabled={isCreating}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateList}
                  disabled={!newListTitle.trim() || isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewListTitle('');
                    setNewListDescription('');
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showCreateForm && <Separator className="my-4" />}

          {/* Existing Lists */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : sets && sets.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Your bookmark lists ({sets.length})
              </p>
              {sets.map((set) => {
                const isInSet =
                  set.publicItems.some(([t, id]) => t === 'e' && id === eventId) ||
                  set.privateItems.some(([t, id]) => t === 'e' && id === eventId);

                return (
                  <div key={set.id} className="border rounded-lg overflow-hidden">
                    {/* List Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{set.title}</h4>
                          {set.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {set.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {set.itemCount} {set.itemCount === 1 ? 'item' : 'items'}
                            </Badge>
                            {set.publicItems.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                {set.publicItems.length} public
                              </Badge>
                            )}
                            {set.privateItems.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                {set.privateItems.length} private
                              </Badge>
                            )}
                          </div>
                        </div>

                        {isInSet ? (
                          <Badge variant="default" className="shrink-0">
                            <Check className="h-3 w-3 mr-1" />
                            Saved
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    {/* Add Actions */}
                    {!isInSet && (
                      <>
                        <Separator />
                        <div className="flex divide-x bg-muted/30">
                          <button
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-accent transition-colors"
                            onClick={() => handleAddToList(set.id, false)}
                            disabled={isAdding}
                          >
                            <Globe className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Add as Public</span>
                          </button>
                          <button
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-accent transition-colors"
                            onClick={() => handleAddToList(set.id, true)}
                            disabled={isAdding}
                          >
                            <Lock className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">Add as Private</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">No bookmark lists yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first list to start organizing bookmarks
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

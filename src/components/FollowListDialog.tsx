import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFollowers, useFollowing } from '@/hooks/useFollowers';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, Search } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import type { NostrMetadata } from '@nostrify/nostrify';

interface FollowListDialogProps {
  pubkey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'followers' | 'following';
}

export function FollowListDialog({ pubkey, open, onOpenChange, defaultTab = 'followers' }: FollowListDialogProps) {
  const { data: followers = [], isLoading: isLoadingFollowers } = useFollowers(pubkey);
  const { data: following = [], isLoading: isLoadingFollowing } = useFollowing(pubkey);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Filter lists based on search query
  const filteredFollowers = followers.filter(followerPubkey => {
    if (!searchQuery) return true;
    const author = useAuthor(followerPubkey);
    const metadata = author.data?.metadata;
    const displayName = metadata?.display_name || metadata?.name || genUserName(followerPubkey);
    const username = metadata?.name || genUserName(followerPubkey);
    const query = searchQuery.toLowerCase();
    return displayName.toLowerCase().includes(query) || username.toLowerCase().includes(query);
  });

  const filteredFollowing = following.filter(followingPubkey => {
    if (!searchQuery) return true;
    const author = useAuthor(followingPubkey);
    const metadata = author.data?.metadata;
    const displayName = metadata?.display_name || metadata?.name || genUserName(followingPubkey);
    const username = metadata?.name || genUserName(followingPubkey);
    const query = searchQuery.toLowerCase();
    return displayName.toLowerCase().includes(query) || username.toLowerCase().includes(query);
  });

  const handleUserClick = (userPubkey: string) => {
    const npub = nip19.npubEncode(userPubkey);
    onOpenChange(false);
    navigate(`/${npub}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Connections
          </DialogTitle>
          <DialogDescription>
            View followers and following
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="followers" className="gap-2">
                <Users className="h-4 w-4" />
                Followers
                <Badge variant="secondary" className="ml-1">
                  {followers.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="following" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Following
                <Badge variant="secondary" className="ml-1">
                  {following.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="followers" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {isLoadingFollowers ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredFollowers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No followers found' : 'No followers yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFollowers.map((followerPubkey) => (
                      <UserListItem
                        key={followerPubkey}
                        pubkey={followerPubkey}
                        onClick={() => handleUserClick(followerPubkey)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="following" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {isLoadingFollowing ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredFollowing.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No users found' : 'Not following anyone yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFollowing.map((followingPubkey) => (
                      <UserListItem
                        key={followingPubkey}
                        pubkey={followingPubkey}
                        onClick={() => handleUserClick(followingPubkey)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UserListItem({ pubkey, onClick }: { pubkey: string; onClick: () => void }) {
  const author = useAuthor(pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  
  const displayName = metadata?.display_name || metadata?.name || genUserName(pubkey);
  const username = metadata?.name || genUserName(pubkey);
  const profileImage = metadata?.picture;
  const bio = metadata?.about;

  return (
    <div
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors group"
    >
      <Avatar className="h-12 w-12 ring-2 ring-background">
        <AvatarImage src={profileImage} alt={displayName} />
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
          {displayName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
            {displayName}
          </p>
        </div>
        <p className="text-xs text-muted-foreground truncate">@{username}</p>
        {bio && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {bio}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        View
      </Button>
    </div>
  );
}

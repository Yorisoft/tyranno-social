import { useChannels, type Channel } from '@/hooks/useChannels';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Hash, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChannelListProps {
  selectedChannelId: string | null;
  onChannelSelect: (channelId: string) => void;
}

export function ChannelList({ selectedChannelId, onChannelSelect }: ChannelListProps) {
  const { data: channels, isLoading } = useChannels();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <div className="text-center py-12">
        <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">
          No channels found
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Create a channel to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {channels.map((channel) => (
        <ChannelItem
          key={channel.id}
          channel={channel}
          isSelected={selectedChannelId === channel.id}
          onClick={() => onChannelSelect(channel.id)}
        />
      ))}
    </div>
  );
}

interface ChannelItemProps {
  channel: Channel;
  isSelected: boolean;
  onClick: () => void;
}

function ChannelItem({ channel, isSelected, onClick }: ChannelItemProps) {
  const creator = useAuthor(channel.creator);
  const creatorName = creator.data?.metadata?.name || genUserName(channel.creator);

  const channelName = channel.metadata.name || 'Unnamed Channel';
  const channelPicture = channel.metadata.picture;
  const about = channel.metadata.about;

  const timeAgo = formatDistanceToNow(new Date(channel.createdAt * 1000), {
    addSuffix: true,
  });

  return (
    <Card
      className={`p-3 cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? 'bg-primary/10 border-primary/30 dark:bg-primary/20'
          : 'hover:bg-accent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {channelPicture ? (
          <Avatar className="h-12 w-12 shrink-0 rounded-lg">
            <AvatarImage src={channelPicture} alt={channelName} />
            <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Hash className="h-6 w-6 text-primary" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Hash className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate flex items-center gap-1">
                <Hash className="h-3 w-3 text-primary shrink-0" />
                {channelName}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                by @{creatorName}
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {timeAgo}
            </span>
          </div>
          {about && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {about}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

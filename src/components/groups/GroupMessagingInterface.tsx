import { useState } from 'react';
import { ChannelList } from './ChannelList';
import { ChannelChatArea } from './ChannelChatArea';
import { CreateChannelDialog } from './CreateChannelDialog';
import { useChannels } from '@/hooks/useChannels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Hash, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupMessagingInterfaceProps {
  className?: string;
}

export function GroupMessagingInterface({ className }: GroupMessagingInterfaceProps) {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: channels } = useChannels();

  const selectedChannel = channels?.find(c => c.id === selectedChannelId);

  const handleChannelCreated = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  return (
    <>
      <Card className={cn("overflow-hidden border-border/50 dark:border-transparent", className)}>
        <div className="flex h-full">
          {/* Channels Sidebar */}
          <div className="w-80 border-r border-border/50 flex flex-col">
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-card to-primary/5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  Channels
                </h2>
                <Button
                  size="sm"
                  onClick={() => setCreateDialogOpen(true)}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Public group chats
              </p>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <ChannelList
                selectedChannelId={selectedChannelId}
                onChannelSelect={setSelectedChannelId}
              />
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedChannel ? (
              <ChannelChatArea
                channelId={selectedChannel.id}
                channelName={selectedChannel.metadata.name || 'Unnamed Channel'}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                    <Hash className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Select a Channel</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a channel from the sidebar or create a new one
                    </p>
                  </div>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Channel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onChannelCreated={handleChannelCreated}
      />
    </>
  );
}

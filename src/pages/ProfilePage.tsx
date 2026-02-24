import { useSeoMeta } from '@unhead/react';
import { useProfile, useUserPosts } from '@/hooks/useProfile';
import { MasonryGrid } from '@/components/MasonryGrid';
import { ColumnSelector } from '@/components/ColumnSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { genUserName } from '@/lib/genUserName';
import { ArrowLeft, MapPin, Link as LinkIcon, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { NostrMetadata } from '@nostrify/nostrify';
import { formatDistanceToNow } from 'date-fns';

interface ProfilePageProps {
  pubkey: string;
}

export function ProfilePage({ pubkey }: ProfilePageProps) {
  const navigate = useNavigate();
  const [columns, setColumns] = useLocalStorage<number>('masonry-columns', 3);
  const { data: profileData, isLoading: isLoadingProfile } = useProfile(pubkey);
  const { data: posts, isLoading: isLoadingPosts } = useUserPosts(pubkey);

  const metadata: NostrMetadata | undefined = profileData?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(pubkey);
  const username = metadata?.name || genUserName(pubkey);
  const bio = metadata?.about;
  const banner = metadata?.banner;
  const profileImage = metadata?.picture;
  const website = metadata?.website;

  useSeoMeta({
    title: `${displayName} (@${username}) - Masonry Social`,
    description: bio || `View ${displayName}'s profile on Masonry Social`,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
        {banner && (
          <img
            src={banner}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Profile Info */}
      <div className="px-4 -mt-20 relative z-10">
        <div>
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mb-4 hover:bg-background/80 backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <Card className="border-border/50 shadow-lg">
              <CardContent className="pt-6">
                {isLoadingProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-24 w-24 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 flex-wrap">
                      <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                        <AvatarImage src={profileImage} alt={displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-3xl">
                          {displayName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
                        <p className="text-muted-foreground mb-3">@{username}</p>
                        {bio && (
                          <p className="text-sm mb-4 whitespace-pre-wrap break-words">{bio}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {website && (
                            <a
                              href={website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
                              <LinkIcon className="h-4 w-4" />
                              {website.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap px-2">
              <h2 className="text-xl font-semibold">Posts</h2>
              <ColumnSelector columns={columns} onColumnsChange={setColumns} />
            </div>
            {isLoadingPosts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <MasonryGrid posts={posts} columns={columns} />
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 px-8 text-center">
                  <p className="text-muted-foreground">No posts yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

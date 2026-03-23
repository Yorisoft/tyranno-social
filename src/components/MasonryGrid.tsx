import { useEffect, useRef, useState, useCallback } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { PostCard } from '@/components/PostCard';
import { InlineSuggestions } from '@/components/InlineSuggestions';
import { useCurrentUser } from '@/hooks/useCurrentUser';

// Show a suggestion strip after every N posts
const SUGGESTION_INTERVAL = 22;

interface MasonryGridProps {
  posts: NostrEvent[];
  columns: number;
  onPostClick?: (event: NostrEvent) => void;
}

export function MasonryGrid({ posts, columns: columnsProp, onPostClick }: MasonryGridProps) {
  // Ensure columns is a valid number between 1 and 4
  const columns = Math.max(1, Math.min(4, Number(columnsProp) || 3));
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [columnPosts, setColumnPosts] = useState<NostrEvent[][]>([]);
  const redistributeTimeoutRef = useRef<number>();

  const { user } = useCurrentUser();

  // Initialize column refs array
  useEffect(() => {
    columnRefs.current = columnRefs.current.slice(0, columns);
  }, [columns]);

  // Estimate height more accurately based on content
  const estimatePostHeight = useCallback((post: NostrEvent): number => {
    let height = 150; // Base height for card chrome (header, footer, padding)
    
    // Add height for text content
    const textLines = Math.ceil(post.content.length / 50); // Rough estimate of lines
    height += Math.min(textLines * 20, 300); // Cap text height at 300px
    
    // Check for images in content
    const imageUrlPattern = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp)/gi;
    const imageUrls = post.content.match(imageUrlPattern) || [];
    const hasImeta = post.tags.some(([name]) => name === 'imeta');
    
    if (imageUrls.length > 0 || hasImeta) {
      height += 300; // Average image height in card
    }
    
    // Check for video
    const videoUrlPattern = /https?:\/\/[^\s]+\.(mp4|webm|mov)/gi;
    const hasVideo = videoUrlPattern.test(post.content);
    
    if (hasVideo) {
      height += 300; // Video player height
    }
    
    return height;
  }, []);

  // Distribute posts across columns based on estimated heights
  const distributePostsWithHeights = useCallback(() => {
    const newColumnPosts: NostrEvent[][] = Array.from({ length: columns }, () => []);
    const columnHeights: number[] = Array.from({ length: columns }, () => 0);

    posts.forEach((post, index) => {
      // For the first few posts, distribute one per column
      if (index < columns) {
        newColumnPosts[index].push(post);
        columnHeights[index] = estimatePostHeight(post);
      } else {
        // Find the shortest column
        const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
        newColumnPosts[shortestColumnIndex].push(post);
        
        // Add estimated height to this column
        const estimatedHeight = estimatePostHeight(post);
        columnHeights[shortestColumnIndex] += estimatedHeight + 16; // +16 for gap
      }
    });

    setColumnPosts(newColumnPosts);
  }, [posts, columns, estimatePostHeight]);

  // Distribute posts when posts or columns change
  useEffect(() => {
    distributePostsWithHeights();
  }, [posts, columns, distributePostsWithHeights]);

  // Handle window resize with debounce
  useEffect(() => {
    const handleResize = () => {
      if (redistributeTimeoutRef.current) {
        clearTimeout(redistributeTimeoutRef.current);
      }
      redistributeTimeoutRef.current = window.setTimeout(() => {
        distributePostsWithHeights();
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (redistributeTimeoutRef.current) {
        clearTimeout(redistributeTimeoutRef.current);
      }
    };
  }, [distributePostsWithHeights]);

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  // Center narrow layouts so they don't stretch to full page width
  const containerClasses =
    columns === 1 ? 'max-w-2xl mx-auto w-full' :
    columns === 2 ? 'max-w-4xl mx-auto w-full' :
    '';

  // Build the list of column-sets separated by full-width suggestion strips.
  // A "segment" is a slice of posts that fits between two suggestion cards.
  // We only inject suggestions for logged-in users.
  const segments: { posts: NostrEvent[][]; suggestionBatch: number | null }[] = [];

  if (!user || posts.length <= SUGGESTION_INTERVAL) {
    // No suggestions: single segment with all columns
    segments.push({ posts: columnPosts, suggestionBatch: null });
  } else {
    // Split the flat post list into chunks of SUGGESTION_INTERVAL, then
    // re-distribute each chunk into columns independently.
    let suggestionCount = 0;
    let offset = 0;

    while (offset < posts.length) {
      const chunk = posts.slice(offset, offset + SUGGESTION_INTERVAL);
      offset += SUGGESTION_INTERVAL;

      // Distribute this chunk into columns
      const chunkColumns: NostrEvent[][] = Array.from({ length: columns }, () => []);
      const heights: number[] = Array.from({ length: columns }, () => 0);

      chunk.forEach((post, index) => {
        if (index < columns) {
          chunkColumns[index].push(post);
          heights[index] = estimatePostHeight(post);
        } else {
          const shortest = heights.indexOf(Math.min(...heights));
          chunkColumns[shortest].push(post);
          heights[shortest] += estimatePostHeight(post) + 16;
        }
      });

      const isLastChunk = offset >= posts.length;
      segments.push({
        posts: chunkColumns,
        // Insert suggestion strip after every chunk except the last
        suggestionBatch: isLastChunk ? null : suggestionCount++,
      });

      if (!isLastChunk) suggestionCount; // already incremented
    }
  }

  return (
    <div className={containerClasses}>
      <div className="space-y-4">
        {segments.map((segment, segIndex) => (
          <div key={segIndex} className="space-y-4">
            {/* Column grid for this segment */}
            <div className={`grid ${gridClasses} gap-4`}>
              {segment.posts.map((columnItems, columnIndex) => (
                <div
                  key={columnIndex}
                  ref={segIndex === 0 ? (el) => (columnRefs.current[columnIndex] = el) : undefined}
                  className="flex flex-col gap-4"
                >
                  {columnItems.map((post) => (
                    <PostCard
                      key={post.id}
                      event={post}
                      onClick={(displayEvent) => onPostClick?.(displayEvent)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Full-width suggestion strip */}
            {segment.suggestionBatch !== null && (
              <InlineSuggestions batchIndex={segment.suggestionBatch} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

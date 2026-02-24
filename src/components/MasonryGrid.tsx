import type { NostrEvent } from '@nostrify/nostrify';
import { PostCard } from '@/components/PostCard';

interface MasonryGridProps {
  posts: NostrEvent[];
  columns: number;
}

export function MasonryGrid({ posts, columns: columnsProp }: MasonryGridProps) {
  // Ensure columns is a valid number between 1 and 4
  const columns = Math.max(1, Math.min(4, Number(columnsProp) || 3));

  // Distribute posts across columns
  const columnPosts: NostrEvent[][] = Array.from({ length: columns }, () => []);
  posts.forEach((post, index) => {
    columnPosts[index % columns].push(post);
  });

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridClasses} gap-4`}>
      {columnPosts.map((columnItems, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {columnItems.map((post) => (
            <PostCard key={post.id} event={post} />
          ))}
        </div>
      ))}
    </div>
  );
}

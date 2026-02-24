import type { NostrEvent } from '@nostrify/nostrify';
import { PostCard } from '@/components/PostCard';
import { useEffect, useRef, useState } from 'react';

interface MasonryGridProps {
  posts: NostrEvent[];
}

export function MasonryGrid({ posts }: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.offsetWidth;
      if (width < 640) setColumns(1);
      else if (width < 1024) setColumns(2);
      else if (width < 1536) setColumns(3);
      else setColumns(4);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Distribute posts across columns
  const columnPosts: NostrEvent[][] = Array.from({ length: columns }, () => []);
  posts.forEach((post, index) => {
    columnPosts[index % columns].push(post);
  });

  return (
    <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
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

/**
 * PhotoGalleryGrid
 *
 * An image-only grid for the Photos feed category.
 * - Each cell shows ONLY the first image from the post (no text, no action bar).
 * - Clicking a cell opens the full PostModal for that post.
 * - A small stacked-images badge (Images icon + count) appears in the top-right
 *   corner when the post contains more than one image.
 * - Layout: responsive CSS grid — 2 columns on mobile, 3 on md, 4 on lg+.
 *   Each cell has a fixed aspect-ratio so the grid feels uniform like Instagram.
 */

import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Images } from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Extract all image URLs from a Nostr event (imeta tags + content). */
function extractImageUrls(event: NostrEvent): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  const add = (url: string) => {
    if (!seen.has(url)) { seen.add(url); urls.push(url); }
  };

  // 1. NIP-94 imeta tags
  for (const tag of event.tags) {
    if (tag[0] !== 'imeta') continue;
    const urlPart = tag.find(t => t.startsWith('url '));
    const mimePart = tag.find(t => t.startsWith('m ') || t.startsWith('type '));
    if (!urlPart) continue;
    const url = urlPart.replace('url ', '').trim();
    const mime = mimePart ? mimePart.replace(/^(m|type) /, '').trim() : '';
    if (mime.startsWith('image/') || url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i)) {
      add(url);
    }
  }

  // 2. Image URLs embedded in content
  const contentMatches = event.content.matchAll(
    /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?[^\s]*)?\b/gi,
  );
  for (const m of contentMatches) add(m[0]);

  return urls;
}

// ─── single cell ─────────────────────────────────────────────────────────────

interface PhotoCellProps {
  event: NostrEvent;
  onClick: (event: NostrEvent) => void;
}

function PhotoCell({ event, onClick }: PhotoCellProps) {
  const images = useMemo(() => extractImageUrls(event), [event]);
  const firstImage = images[0];
  const imageCount = images.length;

  if (!firstImage) return null;

  return (
    <button
      className="relative block w-full overflow-hidden rounded-lg bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary group"
      style={{ aspectRatio: '1 / 1' }}
      onClick={() => onClick(event)}
      aria-label="Open post"
    >
      {/* Image */}
      <img
        src={firstImage}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Subtle dark overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

      {/* Multi-image badge — top right */}
      {imageCount > 1 && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white rounded-md px-1.5 py-0.5 text-xs font-semibold shadow-lg pointer-events-none">
          <Images className="h-3.5 w-3.5" />
          <span>{imageCount}</span>
        </div>
      )}
    </button>
  );
}

// ─── grid ────────────────────────────────────────────────────────────────────

interface PhotoGalleryGridProps {
  posts: NostrEvent[];
  onPostClick?: (event: NostrEvent) => void;
}

export function PhotoGalleryGrid({ posts, onPostClick }: PhotoGalleryGridProps) {
  // Only show posts that actually have at least one image
  const photoPosts = useMemo(
    () => posts.filter(p => extractImageUrls(p).length > 0),
    [posts],
  );

  if (photoPosts.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
      {photoPosts.map(post => (
        <PhotoCell
          key={post.id}
          event={post}
          onClick={(e) => onPostClick?.(e)}
        />
      ))}
    </div>
  );
}

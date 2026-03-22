/**
 * VideoGalleryGrid
 *
 * An video-only thumbnail grid for the Videos feed category.
 * - Each cell shows a clickable thumbnail (generated from the video, or
 *   the YouTube hq thumbnail for YT links) with a play-button overlay.
 * - Clicking a cell opens the full PostModal for that post.
 * - A small badge shows the video count when a post has multiple videos.
 * - Layout: 1 col on mobile, 2 on sm, 3 on lg+ — 16:9 aspect ratio cells.
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Play, Video } from 'lucide-react';
import { isYouTubeUrl } from '@/components/YouTubeEmbed';

// ─── helpers ─────────────────────────────────────────────────────────────────

interface VideoItem {
  type: 'direct' | 'youtube';
  url: string;
  /** YouTube video ID (only set when type === 'youtube') */
  ytId?: string;
}

function extractVideoItems(event: NostrEvent): VideoItem[] {
  const seen = new Set<string>();
  const items: VideoItem[] = [];

  const addDirect = (url: string) => {
    if (seen.has(url)) return;
    seen.add(url);
    items.push({ type: 'direct', url });
  };

  const addYT = (url: string, ytId: string) => {
    if (seen.has(url)) return;
    seen.add(url);
    items.push({ type: 'youtube', url, ytId });
  };

  // 1. imeta tags (NIP-94)
  for (const tag of event.tags) {
    if (tag[0] !== 'imeta') continue;
    const urlPart = tag.find(t => t.startsWith('url '));
    const mimePart = tag.find(t => t.startsWith('m ') || t.startsWith('type '));
    if (!urlPart) continue;
    const url = urlPart.replace('url ', '').trim();
    const mime = mimePart ? mimePart.replace(/^(m|type) /, '').trim() : '';
    if (mime.startsWith('video/') || url.match(/\.(mp4|webm|ogv|mov)(\?|$)/i)) {
      addDirect(url);
    }
  }

  // 2. Direct video URLs in content
  const directMatches = event.content.matchAll(
    /https?:\/\/[^\s]+\.(mp4|webm|ogv|mov)(\?[^\s]*)?\b/gi,
  );
  for (const m of directMatches) addDirect(m[0]);

  // 3. YouTube links in content
  const allUrls = event.content.matchAll(/https?:\/\/[^\s]+/gi);
  for (const m of allUrls) {
    const url = m[0];
    if (seen.has(url)) continue;
    if (!isYouTubeUrl(url)) continue;
    const ytId = extractYouTubeId(url);
    if (ytId) addYT(url, ytId);
  }

  return items;
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be' || u.hostname === 'www.youtu.be') {
      return u.pathname.slice(1).split('?')[0] || null;
    }
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(u.hostname)) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1].split('?')[0];
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/shorts/')[1].split('?')[0];
    }
    return null;
  } catch {
    return null;
  }
}

// ─── YouTube thumbnail cell ───────────────────────────────────────────────────

function YouTubeThumbnailCell({
  ytId,
  onClick,
}: {
  ytId: string;
  onClick: () => void;
}) {
  const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

  return (
    <button
      className="relative w-full overflow-hidden rounded-lg bg-black group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ aspectRatio: '16 / 9' }}
      onClick={onClick}
      aria-label="Open video post"
    >
      <img
        src={thumb}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-300" />
      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-14 w-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
          <Play className="h-7 w-7 fill-current text-black ml-1" />
        </div>
      </div>
      {/* YouTube badge */}
      <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none">
        YT
      </div>
    </button>
  );
}

// ─── Direct video thumbnail cell ─────────────────────────────────────────────

function DirectVideoThumbnailCell({
  src,
  onClick,
}: {
  src: string;
  onClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const generate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      try {
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        setThumb(canvas.toDataURL('image/jpeg', 0.75));
      } catch {
        setThumb('placeholder');
      }
      video.removeEventListener('loadeddata', generate);
    };

    video.addEventListener('loadeddata', generate);
    return () => video.removeEventListener('loadeddata', generate);
  }, [src]);

  return (
    <button
      className="relative w-full overflow-hidden rounded-lg bg-black group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ aspectRatio: '16 / 9' }}
      onClick={onClick}
      aria-label="Open video post"
    >
      {/* Hidden video + canvas for thumbnail generation */}
      <canvas ref={canvasRef} className="hidden" />
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        crossOrigin="anonymous"
        className="hidden"
        onError={() => setErrored(true)}
      />

      {/* Thumbnail image */}
      {thumb && thumb !== 'placeholder' ? (
        <img
          src={thumb}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        /* Fallback gradient when no thumbnail */
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <Video className="h-12 w-12 text-white/20" />
        </div>
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors duration-300" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-14 w-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
          <Play className="h-7 w-7 fill-current text-black ml-1" />
        </div>
      </div>
    </button>
  );
}

// ─── single post cell ─────────────────────────────────────────────────────────

interface VideoCellProps {
  event: NostrEvent;
  onClick: (event: NostrEvent) => void;
}

function VideoCell({ event, onClick }: VideoCellProps) {
  const videos = useMemo(() => extractVideoItems(event), [event]);
  const first = videos[0];
  const count = videos.length;

  if (!first) return null;

  const handleClick = () => onClick(event);

  return (
    <div className="relative">
      {first.type === 'youtube' && first.ytId ? (
        <YouTubeThumbnailCell ytId={first.ytId} onClick={handleClick} />
      ) : (
        <DirectVideoThumbnailCell src={first.url} onClick={handleClick} />
      )}

      {/* Multiple videos badge */}
      {count > 1 && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white rounded-md px-1.5 py-0.5 text-xs font-semibold shadow-lg pointer-events-none">
          <Video className="h-3.5 w-3.5" />
          <span>{count}</span>
        </div>
      )}
    </div>
  );
}

// ─── grid ─────────────────────────────────────────────────────────────────────

interface VideoGalleryGridProps {
  posts: NostrEvent[];
  onPostClick?: (event: NostrEvent) => void;
}

export function VideoGalleryGrid({ posts, onPostClick }: VideoGalleryGridProps) {
  const videoPosts = useMemo(
    () => posts.filter(p => extractVideoItems(p).length > 0),
    [posts],
  );

  if (videoPosts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {videoPosts.map(post => (
        <VideoCell
          key={post.id}
          event={post}
          onClick={(e) => onPostClick?.(e)}
        />
      ))}
    </div>
  );
}

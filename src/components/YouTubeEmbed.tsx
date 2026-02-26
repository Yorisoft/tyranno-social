import { useMemo } from 'react';

interface YouTubeEmbedProps {
  url: string;
}

export function YouTubeEmbed({ url }: YouTubeEmbedProps) {
  const videoId = useMemo(() => {
    try {
      const urlObj = new URL(url);
      
      // Handle youtu.be short links
      if (urlObj.hostname === 'youtu.be' || urlObj.hostname === 'www.youtu.be') {
        return urlObj.pathname.slice(1).split('?')[0];
      }
      
      // Handle youtube.com links
      if (urlObj.hostname === 'youtube.com' || 
          urlObj.hostname === 'www.youtube.com' ||
          urlObj.hostname === 'm.youtube.com') {
        // Watch URLs
        if (urlObj.pathname === '/watch') {
          return urlObj.searchParams.get('v');
        }
        // Embed URLs
        if (urlObj.pathname.startsWith('/embed/')) {
          return urlObj.pathname.split('/embed/')[1].split('?')[0];
        }
        // Shorts URLs
        if (urlObj.pathname.startsWith('/shorts/')) {
          return urlObj.pathname.split('/shorts/')[1].split('?')[0];
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }, [url]);

  if (!videoId) {
    return null;
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

/**
 * Checks if a URL is a YouTube video link
 */
export function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check for youtu.be short links
    if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
      return urlObj.pathname.length > 1;
    }
    
    // Check for youtube.com links
    if (hostname === 'youtube.com' || 
        hostname === 'www.youtube.com' ||
        hostname === 'm.youtube.com') {
      // Watch URLs
      if (urlObj.pathname === '/watch' && urlObj.searchParams.has('v')) {
        return true;
      }
      // Embed URLs
      if (urlObj.pathname.startsWith('/embed/')) {
        return true;
      }
      // Shorts URLs
      if (urlObj.pathname.startsWith('/shorts/')) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

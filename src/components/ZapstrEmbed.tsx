import { Music } from 'lucide-react';

interface ZapstrEmbedProps {
  url: string;
  className?: string;
}

export function isZapstrUrl(url: string): boolean {
  return /zapstr\.live\/t\/naddr1[a-z0-9]+/.test(url);
}

export function getZapstrEmbedUrl(url: string): string | null {
  // Extract the naddr identifier from Zapstr URL patterns
  // Common pattern: https://zapstr.live/t/naddr1<identifier>
  
  const match = url.match(/zapstr\.live\/t\/(naddr1[a-z0-9]+)/);
  
  if (!match) return null;
  
  const naddr = match[1];
  
  // Zapstr uses iframe embeds at /e/<naddr>
  return `https://zapstr.live/e/${naddr}`;
}

export function ZapstrEmbed({ url, className = '' }: ZapstrEmbedProps) {
  const embedUrl = getZapstrEmbedUrl(url);

  if (!embedUrl) {
    // Fallback to direct link
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block p-4 rounded-lg border border-border/50 bg-gradient-to-br from-card via-card to-purple-50/20 dark:from-card dark:via-card dark:to-purple-500/5 hover:border-purple-500/30 transition-colors ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Music className="h-5 w-5 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Zapstr Music</p>
            <p className="text-xs text-muted-foreground truncate">{url}</p>
          </div>
        </div>
      </a>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-lg border border-border/50 bg-gradient-to-br from-card via-card to-purple-50/20 dark:from-card dark:via-card dark:to-purple-500/5 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <iframe
        src={embedUrl}
        width="100%"
        height="380"
        frameBorder="0"
        allow="autoplay; encrypted-media"
        loading="lazy"
        className="w-full rounded-lg"
        title="Zapstr player"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}

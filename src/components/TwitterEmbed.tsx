import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface TwitterEmbedProps {
  url: string;
}

// Declare the global twttr object for Twitter widgets
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
        createTweet: (
          tweetId: string,
          container: HTMLElement,
          options?: { theme?: string; cards?: string; conversation?: string }
        ) => Promise<HTMLElement | undefined>;
      };
    };
  }
}

export function TwitterEmbed({ url }: TwitterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Extract tweet ID from URL
    const getTweetId = (tweetUrl: string): string | null => {
      try {
        const urlObj = new URL(tweetUrl);
        const pathParts = urlObj.pathname.split('/');
        const statusIndex = pathParts.indexOf('status');
        
        if (statusIndex !== -1 && pathParts[statusIndex + 1]) {
          return pathParts[statusIndex + 1];
        }
        
        return null;
      } catch {
        return null;
      }
    };

    const tweetId = getTweetId(url);
    
    if (!tweetId) {
      setError(true);
      setIsLoading(false);
      return;
    }

    // Load Twitter widget script
    const loadTwitterScript = () => {
      return new Promise<void>((resolve) => {
        if (window.twttr) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve(); // Still resolve even on error
        document.body.appendChild(script);
      });
    };

    const embedTweet = async () => {
      try {
        await loadTwitterScript();

        if (window.twttr && containerRef.current) {
          // Clear container
          containerRef.current.innerHTML = '';
          
          // Get current theme from document
          const isDark = document.documentElement.classList.contains('dark');
          
          // Create the tweet embed
          const element = await window.twttr.widgets.createTweet(
            tweetId,
            containerRef.current,
            {
              theme: isDark ? 'dark' : 'light',
              cards: 'visible',
              conversation: 'none', // Hide conversation to keep it compact
            }
          );

          if (element) {
            setIsLoading(false);
          } else {
            setError(true);
            setIsLoading(false);
          }
        } else {
          setError(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to embed tweet:', err);
        setError(true);
        setIsLoading(false);
      }
    };

    embedTweet();
  }, [url]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-muted bg-muted/30">
        <CardContent className="p-4">
          <div className="space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-4 bg-muted rounded w-4/6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card 
        className="border-2 border-muted bg-muted/30 hover:bg-muted/40 transition-colors cursor-pointer"
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
              <span className="break-all">{url}</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={containerRef} className="twitter-embed-container" />
  );
}

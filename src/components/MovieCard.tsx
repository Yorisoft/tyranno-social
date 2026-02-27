import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Clock, Download, ExternalLink, Film } from 'lucide-react';

interface MovieData {
  title?: string;
  year?: number;
  rating?: number | null;
  yts_data?: {
    title?: string;
    title_english?: string;
    year?: number;
    rating?: number;
    runtime?: number;
    genres?: string[];
    description_full?: string;
    description_intro?: string;
    yt_trailer_code?: string;
    mpa_rating?: string;
    medium_cover_image?: string;
    large_cover_image?: string;
    imdb_code?: string;
    torrents?: Array<{
      quality?: string;
      type?: string;
      size?: string;
      url?: string;
      hash?: string;
    }>;
  };
}

interface MovieCardProps {
  data: MovieData;
}

export function MovieCard({ data }: MovieCardProps) {
  const movie = data.yts_data || data;
  const title = movie.title || data.title || 'Unknown Movie';
  const year = movie.year || data.year;
  const rating = movie.rating ?? data.rating;
  const runtime = movie.runtime;
  const genres = movie.genres || [];
  const description = movie.description_intro || movie.description_full || '';
  const coverImage = movie.large_cover_image || movie.medium_cover_image;
  const imdbCode = movie.imdb_code;
  const trailerCode = movie.yt_trailer_code;
  const mpaRating = movie.mpa_rating;
  const torrents = movie.torrents || [];

  return (
    <Card className="overflow-hidden border-border/50 dark:border-transparent bg-gradient-to-br from-card via-card to-blue-50/20 dark:from-card dark:via-card dark:to-card">
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Movie Poster */}
        {coverImage && (
          <div className="shrink-0">
            <img
              src={coverImage}
              alt={title}
              className="w-full sm:w-40 h-auto rounded-lg shadow-lg object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Movie Info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-foreground line-clamp-2 flex items-center gap-2">
                  <Film className="h-5 w-5 text-primary shrink-0" />
                  {title}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {year && (
                    <Badge variant="secondary" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {year}
                    </Badge>
                  )}
                  {mpaRating && (
                    <Badge variant="outline" className="border-primary/30">
                      {mpaRating}
                    </Badge>
                  )}
                  {runtime && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {runtime} min
                    </Badge>
                  )}
                  {rating !== null && rating !== undefined && (
                    <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      <Star className="h-3 w-3 fill-current" />
                      {rating.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {genres.map((genre, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {imdbCode && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2"
              >
                <a
                  href={`https://www.imdb.com/title/${imdbCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                  IMDb
                </a>
              </Button>
            )}
            {trailerCode && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2"
              >
                <a
                  href={`https://www.youtube.com/watch?v=${trailerCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Film className="h-4 w-4" />
                  Trailer
                </a>
              </Button>
            )}
          </div>

          {/* Torrents */}
          {torrents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Available Downloads:</p>
              <div className="flex gap-2 flex-wrap">
                {torrents.slice(0, 3).map((torrent, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="gap-1 cursor-default"
                  >
                    <Download className="h-3 w-3" />
                    {torrent.quality} ({torrent.size})
                  </Badge>
                ))}
                {torrents.length > 3 && (
                  <Badge variant="secondary">
                    +{torrents.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

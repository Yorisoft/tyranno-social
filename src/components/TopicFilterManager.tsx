import { useState } from 'react';
import { Plus, X, Hash, Type, Smile, AlertTriangle, Lightbulb, Filter, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppContext } from '@/hooks/useAppContext';
import { useToast } from '@/hooks/useToast';
import { getSuggestedEmojis } from '@/lib/topicFilter';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function TopicFilterManager() {
  const { config, updateConfig } = useAppContext();
  const { toast } = useToast();

  const [newKeyword, setNewKeyword] = useState('');
  const [newHashtag, setNewHashtag] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [suggestedEmojis, setSuggestedEmojis] = useState<string[]>([]);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const topicFilter = config.topicFilter || { keywords: [], hashtags: [], emojis: [] };

  // Keywords handlers
  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) {
      toast({
        title: 'Invalid keyword',
        description: 'Please enter a keyword to filter.',
        variant: 'destructive',
      });
      return;
    }

    if (topicFilter.keywords.some(k => k.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: 'Keyword already exists',
        description: 'This keyword is already in your filter list.',
        variant: 'destructive',
      });
      return;
    }

    const newKeywords = [...topicFilter.keywords, trimmed];
    updateConfig((current) => ({
      ...current,
      topicFilter: {
        ...topicFilter,
        keywords: newKeywords,
      },
    }));

    // Get suggested emojis for this keyword
    const suggestions = getSuggestedEmojis(trimmed);
    if (suggestions.length > 0) {
      setSuggestedEmojis(suggestions);
    }

    setNewKeyword('');
    toast({
      title: 'Keyword added',
      description: `Posts containing "${trimmed}" will be filtered.`,
    });
  };

  const handleRemoveKeyword = (keyword: string) => {
    const newKeywords = topicFilter.keywords.filter(k => k !== keyword);
    updateConfig((current) => ({
      ...current,
      topicFilter: {
        ...topicFilter,
        keywords: newKeywords,
      },
    }));
  };

  // Hashtags handlers
  const handleAddHashtag = () => {
    let trimmed = newHashtag.trim();
    // Remove # if user included it
    if (trimmed.startsWith('#')) {
      trimmed = trimmed.slice(1);
    }
    
    if (!trimmed) {
      toast({
        title: 'Invalid hashtag',
        description: 'Please enter a hashtag to filter.',
        variant: 'destructive',
      });
      return;
    }

    if (topicFilter.hashtags.some(h => h.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: 'Hashtag already exists',
        description: 'This hashtag is already in your filter list.',
        variant: 'destructive',
      });
      return;
    }

    const newHashtags = [...topicFilter.hashtags, trimmed];
    updateConfig((current) => ({
      ...current,
      topicFilter: {
        ...topicFilter,
        hashtags: newHashtags,
      },
    }));

    setNewHashtag('');
    toast({
      title: 'Hashtag added',
      description: `Posts with #${trimmed} will be filtered.`,
    });
  };

  const handleRemoveHashtag = (hashtag: string) => {
    const newHashtags = topicFilter.hashtags.filter(h => h !== hashtag);
    updateConfig((current) => ({
      ...current,
      topicFilter: {
        ...topicFilter,
        hashtags: newHashtags,
      },
    }));
  };

  // Emojis handlers
  const handleAddEmoji = () => {
    const trimmed = newEmoji.trim();
    if (!trimmed) {
      toast({
        title: 'Invalid emoji',
        description: 'Please enter an emoji to filter.',
        variant: 'destructive',
      });
      return;
    }

    if (topicFilter.emojis.includes(trimmed)) {
      toast({
        title: 'Emoji already exists',
        description: 'This emoji is already in your filter list.',
        variant: 'destructive',
      });
      return;
    }

    const newEmojis = [...topicFilter.emojis, trimmed];
    updateConfig((current) => ({
      ...current,
      topicFilter: {
        ...topicFilter,
        emojis: newEmojis,
      },
    }));

    setNewEmoji('');
    toast({
      title: 'Emoji added',
      description: `Posts containing ${trimmed} will be filtered.`,
    });
  };

  const handleAddSuggestedEmoji = (emoji: string) => {
    if (topicFilter.emojis.includes(emoji)) {
      return;
    }

    const newEmojis = [...topicFilter.emojis, emoji];
    updateConfig((current) => ({
      ...current,
      topicFilter: {
        ...topicFilter,
        emojis: newEmojis,
      },
    }));

    // Remove from suggestions
    setSuggestedEmojis(prev => prev.filter(e => e !== emoji));

    toast({
      title: 'Emoji added',
      description: `Posts containing ${emoji} will be filtered.`,
    });
  };

  const handleRemoveEmoji = (emoji: string) => {
    const newEmojis = topicFilter.emojis.filter(e => e !== emoji);
    updateConfig((current) => ({
      ...current,
      topicFilter: {
        ...topicFilter,
        emojis: newEmojis,
      },
    }));
  };

  return (
    <div className="space-y-8">
      {/* Info Section - Clickable */}
      <button
        onClick={() => setInfoDialogOpen(true)}
        className="w-full rounded-lg border border-blue-200/50 bg-blue-50/30 dark:bg-blue-950/10 dark:border-blue-900/30 hover:bg-blue-100/40 dark:hover:bg-blue-950/20 p-4 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="space-y-1 flex-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-400">Topic Filtering</h4>
            <p className="text-sm text-blue-900/70 dark:text-blue-400/70">
              Filter out posts by keywords, hashtags, and emojis. This helps you avoid topics you don't want to see.
              The filter also detects common evasion tactics like character substitutions and spaced letters.
            </p>
          </div>
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
        </div>
      </button>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Filter className="h-6 w-6 text-primary" />
              How Topic Filtering Works
            </DialogTitle>
            <DialogDescription className="text-base">
              Advanced content filtering to block unwanted topics
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Overview */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                What is Topic Filtering?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Topic filtering lets you block posts about specific subjects you don't want to see. 
                Unlike simple word matching, our system is designed to catch posts even when people 
                try to evade filters using tricks like emoji substitutions, character replacements, 
                or spaced letters.
              </p>
            </div>

            {/* Filter Types */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                Filter Types
              </h3>
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <Type className="h-4 w-4 text-primary" />
                    <span>Keywords</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Blocks posts containing specific words or phrases in the post content. 
                    Example: Adding "politics" will block posts discussing political topics.
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <Hash className="h-4 w-4 text-primary" />
                    <span>Hashtags</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Blocks posts tagged with specific hashtags. 
                    Example: Adding "bitcoin" will block posts tagged with #bitcoin.
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <Smile className="h-4 w-4 text-primary" />
                    <span>Emojis</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Blocks posts containing specific emojis that are commonly used as code words. 
                    Example: Adding 🍉 will block posts about Palestine (watermelon emoji is often used as a symbol).
                  </p>
                </div>
              </div>
            </div>

            {/* Anti-Evasion */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Anti-Evasion Detection
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                People often try to bypass filters using various tricks. Our system detects these common evasion tactics:
              </p>
              <div className="space-y-2 text-sm">
                <div className="rounded-lg border bg-amber-50/30 dark:bg-amber-950/10 p-3 space-y-1">
                  <p className="font-medium text-amber-900 dark:text-amber-400">Character Substitutions</p>
                  <p className="text-amber-900/70 dark:text-amber-400/70">
                    Detects: "p4lestine", "pal3stin3", "p0litics", "1srael"
                  </p>
                  <p className="text-xs text-amber-900/60 dark:text-amber-400/60">
                    Converts: 3→e, 4→a, 0→o, 1/l→i, 5→s, 7→t, @→a
                  </p>
                </div>

                <div className="rounded-lg border bg-purple-50/30 dark:bg-purple-950/10 p-3 space-y-1">
                  <p className="font-medium text-purple-900 dark:text-purple-400">Spaced Letters</p>
                  <p className="text-purple-900/70 dark:text-purple-400/70">
                    Detects: "p a l e s t i n e", "i-s-r-a-e-l", "p.o.l.i.t.i.c.s"
                  </p>
                </div>

                <div className="rounded-lg border bg-green-50/30 dark:bg-green-950/10 p-3 space-y-1">
                  <p className="font-medium text-green-900 dark:text-green-400">Diacritics Removal</p>
                  <p className="text-green-900/70 dark:text-green-400/70">
                    Detects: "pàlëstíne", "ìsrâél", "pólïtîcs"
                  </p>
                </div>

                <div className="rounded-lg border bg-blue-50/30 dark:bg-blue-950/10 p-3 space-y-1">
                  <p className="font-medium text-blue-900 dark:text-blue-400">Emoji Substitutions</p>
                  <p className="text-blue-900/70 dark:text-blue-400/70">
                    Knows common emoji codes: 🍉 (Palestine), 🐘 (Republican), 🐴 (Democrat)
                  </p>
                </div>
              </div>
            </div>

            {/* Common Examples */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Smile className="h-5 w-5 text-primary" />
                Common Emoji Substitutions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <p className="text-sm font-medium">Political</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>🍉 = Palestine / Palestinian cause</p>
                    <p>🇵🇸 = Palestine flag</p>
                    <p>🇮🇱 = Israel flag</p>
                    <p>🐘 = Republican / GOP</p>
                    <p>🐴 = Democrat / Democratic Party</p>
                    <p>🏴 = Anarchism</p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <p className="text-sm font-medium">Crypto</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>🚀 = "To the moon" / bullish</p>
                    <p>💎 = Diamond hands / HODL</p>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Use */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                How to Use
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>1. Add Keywords:</strong> Type words like "israel" or "palestine" to block posts containing those terms</p>
                <p><strong>2. Add Suggested Emojis:</strong> When you add a keyword, related emojis will be suggested - click to add them</p>
                <p><strong>3. Add Hashtags:</strong> Block posts tagged with specific topics like #gaza or #politics</p>
                <p><strong>4. Add Manual Emojis:</strong> Paste any emoji (like 🍉) to block posts containing it</p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t">
              <Button 
                onClick={() => setInfoDialogOpen(false)}
                className="w-full"
              >
                Got it, thanks!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keywords Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Keywords</h3>
            <p className="text-sm text-muted-foreground">
              Block posts containing specific words or phrases
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {topicFilter.keywords.length === 0 ? (
            <div className="p-4 rounded-md border border-dashed bg-muted/20 text-center text-sm text-muted-foreground">
              No keywords filtered. Add keywords to block posts containing those words.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topicFilter.keywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="gap-2 pr-1 text-sm"
                >
                  <Type className="h-3 w-3" />
                  {keyword}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="h-4 w-4 hover:bg-transparent p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="new-keyword" className="sr-only">
              Keyword
            </Label>
            <Input
              id="new-keyword"
              placeholder="Enter keyword to filter (e.g., 'politics', 'crypto')"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddKeyword();
                }
              }}
            />
          </div>
          <Button
            onClick={handleAddKeyword}
            disabled={!newKeyword.trim()}
            variant="outline"
            size="sm"
            className="h-10 shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Suggested Emojis */}
        {suggestedEmojis.length > 0 && (
          <div className="rounded-lg border border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-900/30 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-xs text-amber-900 dark:text-amber-400">
                  People often use these emojis to talk about this topic. Consider blocking them too:
                </p>
                <div className="flex flex-wrap gap-1">
                  {suggestedEmojis.map((emoji) => (
                    <Tooltip key={emoji}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSuggestedEmoji(emoji)}
                          className="h-7 px-2 text-lg"
                        >
                          {emoji}
                          <Plus className="h-3 w-3 ml-1" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to add this emoji to your filter</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Hashtags Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Hashtags</h3>
            <p className="text-sm text-muted-foreground">
              Block posts with specific hashtags
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {topicFilter.hashtags.length === 0 ? (
            <div className="p-4 rounded-md border border-dashed bg-muted/20 text-center text-sm text-muted-foreground">
              No hashtags filtered. Add hashtags to block posts tagged with those topics.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topicFilter.hashtags.map((hashtag) => (
                <Badge
                  key={hashtag}
                  variant="secondary"
                  className="gap-2 pr-1 text-sm"
                >
                  <Hash className="h-3 w-3" />
                  {hashtag}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveHashtag(hashtag)}
                    className="h-4 w-4 hover:bg-transparent p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="new-hashtag" className="sr-only">
              Hashtag
            </Label>
            <Input
              id="new-hashtag"
              placeholder="Enter hashtag to filter (e.g., 'bitcoin', 'election')"
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddHashtag();
                }
              }}
            />
          </div>
          <Button
            onClick={handleAddHashtag}
            disabled={!newHashtag.trim()}
            variant="outline"
            size="sm"
            className="h-10 shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <Separator />

      {/* Emojis Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Smile className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Emojis</h3>
            <p className="text-sm text-muted-foreground">
              Block posts containing specific emojis (commonly used to evade keyword filters)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {topicFilter.emojis.length === 0 ? (
            <div className="p-4 rounded-md border border-dashed bg-muted/20 text-center text-sm text-muted-foreground">
              No emojis filtered. Add emojis to block posts containing them (e.g., 🍉 for Palestine-related content).
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topicFilter.emojis.map((emoji) => (
                <Badge
                  key={emoji}
                  variant="secondary"
                  className="gap-2 pr-1 text-lg"
                >
                  {emoji}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveEmoji(emoji)}
                    className="h-4 w-4 hover:bg-transparent p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="new-emoji" className="sr-only">
              Emoji
            </Label>
            <Input
              id="new-emoji"
              placeholder="Paste emoji to filter (e.g., 🍉, 🇵🇸, 🇮🇱)"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddEmoji();
                }
              }}
            />
          </div>
          <Button
            onClick={handleAddEmoji}
            disabled={!newEmoji.trim()}
            variant="outline"
            size="sm"
            className="h-10 shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Common Examples */}
        <div className="rounded-lg border border-muted bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Common emoji substitutions:</p>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>🍉 = Palestine</span>
            <span>•</span>
            <span>🐘 = Republican</span>
            <span>•</span>
            <span>🐴 = Democrat</span>
            <span>•</span>
            <span>🚀 = Crypto hype</span>
          </div>
        </div>
      </div>
    </div>
  );
}

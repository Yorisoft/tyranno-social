import type { NostrEvent } from '@nostrify/nostrify';

export interface TopicFilter {
  keywords: string[];
  hashtags: string[];
  emojis: string[];
}

/**
 * Common emoji substitutions used to evade content filters
 * Maps emojis to their commonly associated topics/keywords
 */
const EMOJI_ASSOCIATIONS: Record<string, string[]> = {
  // Palestine/Israel conflict
  '🍉': ['watermelon', 'palestine', 'palestinian'],
  '🇵🇸': ['palestine', 'palestinian'],
  '🇮🇱': ['israel', 'israeli'],
  
  // Politics
  '🐘': ['republican', 'gop', 'conservative'],
  '🐴': ['democrat', 'democratic', 'liberal'],
  '🏴': ['anarchist', 'anarchism'],
  
  // Cryptocurrency
  '🚀': ['moon', 'crypto', 'bullish'],
  '💎': ['diamond hands', 'hold', 'hodl'],
  
  // Add more associations as needed
};

/**
 * Normalize text for matching - handles case, diacritics, and common substitutions
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[l1]/g, 'i') // Common substitutions: l/1 -> i
    .replace(/[0o]/g, 'o') // 0 -> o
    .replace(/[3]/g, 'e') // 3 -> e
    .replace(/[4]/g, 'a') // 4 -> a
    .replace(/[5]/g, 's') // 5 -> s
    .replace(/[7]/g, 't') // 7 -> t
    .replace(/[@]/g, 'a') // @ -> a
    .trim();
}

/**
 * Extract all text content from an event for filtering
 */
function extractEventText(event: NostrEvent): string {
  const parts: string[] = [event.content];
  
  // Include hashtags from tags
  const hashtags = event.tags
    .filter(([name]) => name === 't')
    .map(([_, value]) => value || '')
    .filter(Boolean);
  
  if (hashtags.length > 0) {
    parts.push(...hashtags.map(tag => `#${tag}`));
  }
  
  return parts.join(' ');
}

/**
 * Extract emojis from text
 */
function extractEmojis(text: string): string[] {
  // Unicode emoji regex - matches most emojis including country flags
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{200D}]/gu;
  const matches = text.match(emojiRegex);
  return matches || [];
}

/**
 * Check if text contains a keyword, considering various evasion tactics
 */
function containsKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  
  // Direct match
  if (normalizedText.includes(normalizedKeyword)) {
    return true;
  }
  
  // Check for spaced-out characters (e.g., "p a l e s t i n e")
  const spacedPattern = normalizedKeyword.split('').join('[\\s\\-_\\.]*');
  const spacedRegex = new RegExp(spacedPattern, 'i');
  if (spacedRegex.test(normalizedText)) {
    return true;
  }
  
  // Check for word boundaries to catch partial matches
  const wordBoundaryRegex = new RegExp(`\\b${normalizedKeyword}`, 'i');
  if (wordBoundaryRegex.test(normalizedText)) {
    return true;
  }
  
  return false;
}

/**
 * Check if event should be filtered based on topic filters
 */
export function shouldFilterEvent(event: NostrEvent, filter: TopicFilter): boolean {
  if (!filter || (filter.keywords.length === 0 && filter.hashtags.length === 0 && filter.emojis.length === 0)) {
    return false;
  }
  
  const eventText = extractEventText(event);
  const eventEmojis = extractEmojis(eventText);
  
  // Check keywords
  for (const keyword of filter.keywords) {
    if (containsKeyword(eventText, keyword)) {
      return true;
    }
  }
  
  // Check hashtags
  const eventHashtags = event.tags
    .filter(([name]) => name === 't')
    .map(([_, value]) => normalizeText(value || ''))
    .filter(Boolean);
  
  for (const hashtag of filter.hashtags) {
    const normalizedHashtag = normalizeText(hashtag);
    if (eventHashtags.some(eventTag => eventTag === normalizedHashtag)) {
      return true;
    }
  }
  
  // Check emojis
  for (const emoji of filter.emojis) {
    if (eventEmojis.includes(emoji)) {
      // Also check if this emoji has associated keywords
      const associations = EMOJI_ASSOCIATIONS[emoji];
      if (associations) {
        for (const associated of associations) {
          if (containsKeyword(eventText, associated)) {
            return true;
          }
        }
      } else {
        // Just emoji presence is enough
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Filter a list of events based on topic filters
 */
export function filterEventsByTopic(events: NostrEvent[], filter: TopicFilter): NostrEvent[] {
  if (!filter || (filter.keywords.length === 0 && filter.hashtags.length === 0 && filter.emojis.length === 0)) {
    return events;
  }
  
  return events.filter(event => !shouldFilterEvent(event, filter));
}

/**
 * Get suggested emojis for a keyword (helps users find evasion tactics)
 */
export function getSuggestedEmojis(keyword: string): string[] {
  const normalizedKeyword = normalizeText(keyword);
  const suggestions: string[] = [];
  
  for (const [emoji, associations] of Object.entries(EMOJI_ASSOCIATIONS)) {
    for (const associated of associations) {
      if (normalizeText(associated).includes(normalizedKeyword)) {
        suggestions.push(emoji);
        break;
      }
    }
  }
  
  return suggestions;
}

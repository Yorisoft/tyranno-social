import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Detects if a Nostr event might contain NSFW (Not Safe For Work) content.
 * Uses multiple heuristics to identify potentially inappropriate content.
 * 
 * @param event - Nostr event to check
 * @returns true if event likely contains NSFW content
 */
export function isLikelyNSFW(event: NostrEvent): boolean {
  // Check for content-warning tag (NIP-36)
  const hasContentWarning = event.tags.some(([name]) => name === 'content-warning');
  if (hasContentWarning) return true;
  
  // Check pubkey against known spam/NSFW accounts
  // This list should be maintained and updated with confirmed spam pubkeys
  const knownSpamPubkeys = [
    // Add known spam pubkeys here as they are identified
  ];
  if (knownSpamPubkeys.includes(event.pubkey)) return true;

  // Check for NSFW-related hashtags
  const nsfwHashtags = [
    'nsfw', 'porn', 'xxx', 'adult', 'nude', 'nudity', 'sex', 'sexual', 'explicit', '18+', 'nudes',
    'tits', 'ass', 'boobs', 'pussy', 'dick', 'cock', 'cum', 'sexy', 'hot', 'horny', 'fetish',
    'onlyfans', 'premium', 'premium content', 'dm me', 'dm for', 'paywall', 'subscribe',
  ];
  const hasnsfwHashtag = event.tags.some(([name, value]) => 
    name === 't' && value && nsfwHashtags.includes(value.toLowerCase())
  );
  if (hasnsfwHashtag) return true;

  const contentLower = event.content.toLowerCase();

  // Check for spam/promotional patterns common in NSFW posts
  const spamPatterns = [
    /premium\s+(content|money|access)/i,
    /dm\s+(me|for|to)/i,
    /subscribe\s+(to|for|now)/i,
    /only\s*fans/i,
    /tip\s+me/i,
    /send\s+(sats|bitcoin|btc)/i,
    /\$\s*\d+/,  // Dollar amounts
    /💰|💵|💸|🔞|🍆|🍑|🔥/,  // Suggestive emojis
  ];

  const hasSpamPattern = spamPatterns.some(pattern => pattern.test(event.content));
  if (hasSpamPattern) return true;

  // Check content text for NSFW keywords
  const nsfwKeywords = [
    'nsfw', 'porn', 'xxx', 'nude', 'naked', 'sex', 'explicit', '18+', 'adult content',
    'not safe for work', 'tits', 'boobs', 'ass', 'pussy', 'dick', 'cock', 'cum',
    'sexy', 'horny', 'fetish', 'amateur', 'milf', 'teen sex', 'only fans', 'onlyfans',
    'premium content', 'premium snap', 'premium vid',
  ];
  
  const hasNSFWKeyword = nsfwKeywords.some(keyword => {
    // Use word boundaries for most, but also check for common variations
    const escapedKeyword = keyword.replace(/\s+/g, '\\s*');
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
    return regex.test(contentLower);
  });
  
  if (hasNSFWKeyword) return true;

  // Check for common NSFW image hosting domains and platforms
  const nsfwDomains = [
    'imgur.com/a/',
    'redgifs.com',
    'pornhub.com',
    'xvideos.com',
    'onlyfans.com',
    'fansly.com',
    'manyvids.com',
    'clips4sale.com',
    'chaturbate.com',
    'stripchat.com',
  ];

  const hasNSFWDomain = nsfwDomains.some(domain => 
    contentLower.includes(domain)
  );

  if (hasNSFWDomain) return true;

  // Check for suspicious image URLs with NSFW-related filenames
  const imageUrlPattern = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi;
  const imageUrls = event.content.match(imageUrlPattern) || [];
  
  const hasNSFWImageName = imageUrls.some(url => {
    const urlLower = url.toLowerCase();
    return nsfwKeywords.some(keyword => urlLower.includes(keyword));
  });

  if (hasNSFWImageName) return true;

  // For posts with images but minimal text, be more cautious
  const hasImages = imageUrls.length > 0 || event.tags.some(([name]) => name === 'imeta');
  const textWithoutUrls = event.content.replace(/https?:\/\/[^\s]+/g, '').trim();
  const hasMinimalText = textWithoutUrls.length < 30;
  
  // Check for suspicious patterns that often indicate NSFW spam
  const suspiciousPatterns = [
    /premium/i,
    /money/i,
    /bitcoin.*standard/i,
    /crypto.*girl/i,
    /💰/,
    /dm\s+me/i,
    /subscribe/i,
    /only\s*fans/i,
    /exclusive/i,
    /vip/i,
    /content.*link/i,
  ];

  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(event.content)
  );

  // If post has images with minimal text and suspicious patterns, filter it
  if (hasImages && hasMinimalText && hasSuspiciousPattern) {
    return true;
  }

  // Extra aggressive: Filter any post with images and very little meaningful text
  // This catches spam posts that are just promotional images
  if (hasImages && textWithoutUrls.length < 10 && textWithoutUrls.length > 0) {
    // Check if the text is just emojis or single words
    const alphanumericText = textWithoutUrls.replace(/[^\w\s]/g, '').trim();
    if (alphanumericText.length < 5) {
      return true; // Likely spam/promotional
    }
  }

  // Enhanced image-only spam detection
  // Filter posts that ONLY contain an image URL with no other text
  // This catches most pornographic spam which is just an image link
  if (hasImages && textWithoutUrls.length === 0) {
    return true; // Image-only posts are highly likely to be spam
  }

  // Filter posts with images and only 1-2 generic words
  // Common pattern: "Bitcoin" + explicit image, "Summer" + explicit image, etc.
  if (hasImages && textWithoutUrls.length > 0 && textWithoutUrls.length <= 50) {
    const words = textWithoutUrls.split(/\s+/).filter(w => w.length > 0);
    
    // If it's just 1-5 words with an image, be very suspicious
    if (words.length <= 5) {
      // Check if any word is a common spam keyword
      const spamWords = [
        'bitcoin', 'crypto', 'summer', 'hot', 'live', 'new', 'free', 'exclusive', 
        'premium', 'year', 'round', 'standard', 'gold', 'btc', 'eth', 'nft'
      ];
      const hasSpamWord = words.some(word => 
        spamWords.includes(word.toLowerCase())
      );
      
      // Also check for posts with just capitalized single words (common in spam)
      const allCaps = words.every(word => word === word.toUpperCase() && word.length > 1);
      const mixedCase = words.some(word => /[A-Z]/.test(word) && /[a-z]/.test(word));
      
      // Check for "word is word word" pattern like "Bitcoin Summer is year round"
      const hasGenericPattern = /^[A-Z][a-z]+\s+[A-Z][a-z]+\s+is\s+/i.test(textWithoutUrls) ||
                               /^[A-Z][a-z]+\s+is\s+/i.test(textWithoutUrls);
      
      if (hasSpamWord || allCaps || (words.length <= 3 && mixedCase) || hasGenericPattern) {
        return true;
      }
    }
    
    // Additional check: if post has image and text is suspiciously promotional
    // Common patterns: "X is Y" or "Check this out" type phrases with images
    const promotionalPhrases = [
      /is\s+(year|all|the|always|everywhere)/i,
      /check\s+(this|it|out)/i,
      /look\s+at\s+this/i,
      /amazing/i,
      /^wow/i,
    ];
    
    const hasPromotionalPhrase = promotionalPhrases.some(pattern => 
      pattern.test(textWithoutUrls)
    );
    
    if (hasPromotionalPhrase && words.length <= 6) {
      return true;
    }
  }

  return false;
}

/**
 * Filters a list of events to remove NSFW content.
 * Useful for filtering feeds for non-logged-in users or safe browsing modes.
 * 
 * @param events - Array of Nostr events to filter
 * @returns Filtered array with NSFW content removed
 */
export function filterNSFWContent(events: NostrEvent[]): NostrEvent[] {
  return events.filter(event => !isLikelyNSFW(event));
}

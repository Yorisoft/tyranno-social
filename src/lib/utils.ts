import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a Nostr event timestamp as a relative time string.
 * Handles invalid timestamps gracefully by returning a fallback string.
 * 
 * @param created_at - Unix timestamp in seconds (Nostr event created_at field)
 * @returns Formatted relative time string (e.g., "2 hours ago") or "recently" for invalid timestamps
 */
export function formatEventTime(created_at: number): string {
  try {
    const timestamp = created_at * 1000;
    
    // Validate timestamp
    if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
      return 'recently';
    }
    
    // Check if timestamp is in the future by more than 1 day (likely invalid)
    if (timestamp > Date.now() + 86400000) {
      return 'recently';
    }
    
    // Check if timestamp is too far in the past (before year 2000)
    if (timestamp < 946684800000) {
      return 'long ago';
    }
    
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

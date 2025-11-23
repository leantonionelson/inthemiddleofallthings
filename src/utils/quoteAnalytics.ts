// Analytics logging for quote cards
// Lightweight implementation - stores data for future GA/PostHog integration

export interface QuoteAnalyticsEvent {
  quoteId: string;
  author: string;
  contentType: 'book' | 'meditation' | 'story' | 'learn';
  contentId: string;
  timestamp: string;
  action: 'shown' | 'tapped';
  score?: number;
  matchedTags?: string[];
}

const STORAGE_KEY = 'quote_analytics';
const MAX_EVENTS = 1000; // Limit stored events

/**
 * Logs when a quote is shown to the user
 */
export function logQuoteShown(
  quoteId: string,
  author: string,
  contentType: 'book' | 'meditation' | 'story' | 'learn',
  contentId: string,
  score?: number,
  matchedTags?: string[]
): void {
  const event: QuoteAnalyticsEvent = {
    quoteId,
    author,
    contentType,
    contentId,
    timestamp: new Date().toISOString(),
    action: 'shown',
    score,
    matchedTags
  };

  storeEvent(event);
  
  // Future: Send to analytics service (GA, PostHog, etc.)
  // Example: analytics.track('quote_shown', event);
}

/**
 * Logs when a user taps/clicks on a quote card
 */
export function logQuoteTapped(
  quoteId: string,
  author: string,
  contentType: 'book' | 'meditation' | 'story' | 'learn',
  contentId: string
): void {
  const event: QuoteAnalyticsEvent = {
    quoteId,
    author,
    contentType,
    contentId,
    timestamp: new Date().toISOString(),
    action: 'tapped'
  };

  storeEvent(event);
  
  // Future: Send to analytics service
  // Example: analytics.track('quote_tapped', event);
}

/**
 * Stores event in localStorage (lightweight persistence)
 */
function storeEvent(event: QuoteAnalyticsEvent): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const events: QuoteAnalyticsEvent[] = stored ? JSON.parse(stored) : [];
    
    events.push(event);
    
    // Keep only the most recent events
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    // Silently fail if localStorage is not available
    console.warn('Failed to store quote analytics:', error);
  }
}

/**
 * Gets all stored analytics events (for debugging or export)
 */
export function getStoredEvents(): QuoteAnalyticsEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Clears all stored analytics events
 */
export function clearStoredEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Silently fail
  }
}


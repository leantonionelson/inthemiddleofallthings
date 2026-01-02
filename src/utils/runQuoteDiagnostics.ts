// Development utility to run quote diagnostics
// This can be imported and called from the browser console or a dev page

import { diagnoseQuoteCounts } from './quoteExtractor';
import { loadBookChapters } from '../data/bookContent';
import { loadMeditations } from '../data/meditationContent';
import { loadStories } from '../data/storiesContent';

/**
 * Run quote diagnostics and return the results
 * Call this from browser console: window.runQuoteDiagnostics()
 */
export async function runQuoteDiagnostics() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Quote diagnostics only available in development mode');
    return null;
  }

  console.log('🔍 Loading content and running quote diagnostics...');
  
  try {
    const [chapters, meditations, stories] = await Promise.all([
      loadBookChapters(),
      loadMeditations(),
      loadStories(),
    ]);

    const diagnostics = await diagnoseQuoteCounts(chapters, meditations, stories, []);
    
    return diagnostics;
  } catch (error) {
    console.error('Error running quote diagnostics:', error);
    return null;
  }
}

// Make it available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).runQuoteDiagnostics = runQuoteDiagnostics;
  console.log('💡 Tip: Run window.runQuoteDiagnostics() in the console to see quote counts');
}




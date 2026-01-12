import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import BookLandingPage from '../Book/BookLandingPage';
import MeditationsLandingPage from '../Meditations/MeditationsLandingPage';
import StoriesLandingPage from '../Stories/StoriesLandingPage';
import QuotesPage from '../Quotes/QuotesPage';
import SearchBar from '../../components/SearchBar';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';

type TabType = 'book' | 'meditations' | 'stories' | 'quotes';

const ReadPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams.get('tab') as TabType;
    return tabParam && ['book', 'meditations', 'stories', 'quotes'].includes(tabParam) 
      ? tabParam 
      : 'book';
  });

  // Search state for meditations and stories
  const [meditationsSearchQuery, setMeditationsSearchQuery] = useState('');
  const [meditationsSearchFocused, setMeditationsSearchFocused] = useState(false);
  const [storiesSearchQuery, setStoriesSearchQuery] = useState('');
  const [storiesSearchFocused, setStoriesSearchFocused] = useState(false);

  // Update URL when tab changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', activeTab);
    setSearchParams(newParams, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  // Sync activeTab with URL param changes
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['book', 'meditations', 'stories', 'quotes'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleMeditationsSearchClear = () => {
    setMeditationsSearchQuery('');
    setMeditationsSearchFocused(false);
    // Also clear tags in the landing page if needed
    // This will be handled by the landing page's clearAllFilters
  };

  const handleStoriesSearchClear = () => {
    setStoriesSearchQuery('');
    setStoriesSearchFocused(false);
    // Also clear tags in the landing page if needed
    // This will be handled by the landing page's clearAllFilters
  };

  const handleMeditationsSearchBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!e.relatedTarget || !e.relatedTarget.closest('[data-search-overlay]')) {
      setMeditationsSearchFocused(false);
    }
  };

  // Swipe navigation for tabs
  const tabs: TabType[] = ['book', 'meditations', 'stories', 'quotes'];
  const currentTabIndex = tabs.indexOf(activeTab);
  
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    onSwipeLeft: () => {
      if (currentTabIndex < tabs.length - 1) {
        setActiveTab(tabs[currentTabIndex + 1]);
      }
    },
    onSwipeRight: () => {
      if (currentTabIndex > 0) {
        setActiveTab(tabs[currentTabIndex - 1]);
      }
    },
    threshold: 50
  });


  return (
    <div className="relative z-10" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Tabs Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-[60]"
      >
        <div className="border-b border-gray-200 dark:border-white/10">
          <nav aria-label="Tabs" className="-mb-px flex px-4">
              <button
                onClick={() => setActiveTab('book')}
                aria-current={activeTab === 'book' ? 'page' : undefined}
                className={`flex-1 border-b-2 px-1 py-4 text-center text-sm font-medium transition-colors ${
                  activeTab === 'book'
                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-300'
                }`}
              >
                Book
              </button>
              <button
                onClick={() => setActiveTab('meditations')}
                aria-current={activeTab === 'meditations' ? 'page' : undefined}
                className={`flex-1 border-b-2 px-1 py-4 text-center text-sm font-medium transition-colors ${
                  activeTab === 'meditations'
                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-300'
                }`}
              >
                Meditations
              </button>
              <button
                onClick={() => setActiveTab('stories')}
                aria-current={activeTab === 'stories' ? 'page' : undefined}
                className={`flex-1 border-b-2 px-1 py-4 text-center text-sm font-medium transition-colors ${
                  activeTab === 'stories'
                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-300'
                }`}
              >
                Stories
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                aria-current={activeTab === 'quotes' ? 'page' : undefined}
                className={`flex-1 border-b-2 px-1 py-4 text-center text-sm font-medium transition-colors ${
                  activeTab === 'quotes'
                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-300'
                }`}
              >
                Quotes
              </button>
          </nav>
        </div>
      </motion.header>

      {/* Content (uses global layout scroll; avoid nested scroll containers) */}
      <div className="relative z-10 overflow-x-hidden">
          {activeTab === 'book' && (
            <motion.div
              key="book"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <BookLandingPage />
            </motion.div>
          )}
          {activeTab === 'meditations' && (
            <motion.div
              key="meditations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Search Bar */}
              <div className="px-4 py-3">
                <SearchBar
                  placeholder="Search meditations..."
                  value={meditationsSearchQuery}
                  onChange={setMeditationsSearchQuery}
                  onFocus={() => setMeditationsSearchFocused(true)}
                  onBlur={handleMeditationsSearchBlur}
                  showClearButton={meditationsSearchFocused || !!meditationsSearchQuery.trim()}
                  onClear={handleMeditationsSearchClear}
                  isOpen={meditationsSearchFocused || !!meditationsSearchQuery.trim()}
                  className="!relative !top-0"
                />
              </div>
              <MeditationsLandingPage 
                externalSearchQuery={meditationsSearchQuery}
                externalSearchFocused={meditationsSearchFocused}
                onExternalSearchClear={handleMeditationsSearchClear}
                hideSearchBar={true}
              />
            </motion.div>
          )}
          {activeTab === 'stories' && (
            <motion.div
              key="stories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <StoriesLandingPage 
                externalSearchQuery={storiesSearchQuery}
                externalSearchFocused={storiesSearchFocused}
                onExternalSearchClear={handleStoriesSearchClear}
                hideSearchBar={true}
              />
            </motion.div>
          )}
          {activeTab === 'quotes' && (
            <motion.div
              key="quotes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="min-h-[60vh]"
            >
              <QuotesPage embedded={true} />
            </motion.div>
          )}
      </div>
    </div>
  );
};

export default ReadPage;


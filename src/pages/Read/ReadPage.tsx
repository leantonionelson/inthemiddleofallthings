import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import BookLandingPage from '../Book/BookLandingPage';
import MeditationsLandingPage from '../Meditations/MeditationsLandingPage';
import StoriesLandingPage from '../Stories/StoriesLandingPage';
import SearchBar from '../../components/SearchBar';

type TabType = 'book' | 'meditations' | 'stories';

const ReadPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams.get('tab') as TabType;
    return tabParam && ['book', 'meditations', 'stories'].includes(tabParam) 
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
    if (tabParam && ['book', 'meditations', 'stories'].includes(tabParam)) {
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


  return (
    <div className="h-full bg-paper-light dark:bg-slate-950/75 relative flex flex-col">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-70 dark:opacity-100"
        >
          <source src="/media/bg.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for better content readability */}
        <div className="absolute inset-0 bg-paper-light/50 dark:bg-slate-950/75"></div>
      </div>

      {/* Tabs Header - Fixed at top */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-[10000]"
      >
        <div className="w-full mx-auto">
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
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Scrollable Main Content Area - Between tabs and navigation */}
      <div 
        className="relative z-10 overflow-y-auto"
        style={{
          marginTop: '54px',
          height: 'calc(100vh - 140px)',
        }}
      >
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
              {/* Search Bar - Sticky at top of scrollable area */}
              <div className="sticky top-0 z-[9999] px-4 py-3">
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
      </div>
    </div>
  );
};

export default ReadPage;


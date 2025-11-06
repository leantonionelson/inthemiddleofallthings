import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, Story } from '../../types';
import { loadStories, fallbackStories } from '../../data/storiesContent';
import { readingProgressService } from '../../services/readingProgressService';
import CleanLayout from '../../components/CleanLayout';
import ContentCarousel from '../../components/ContentCarousel';
import { Search, X, ChevronRight, BookOpen, Scroll, Feather, Eye, Brain, Globe, Clock, Sparkles, Zap, CheckCircle2 } from 'lucide-react';
import { searchStories } from '../../data/storiesContent';

interface StoriesLandingPageProps {
  onOpenAI: () => void;
}

const StoriesLandingPage: React.FC<StoriesLandingPageProps> = ({ onOpenAI }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const navigate = useNavigate();

  // Listen for storage changes to update completion percentage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'readingProgress') {
        setProgressUpdateTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const checkProgress = () => {
      setProgressUpdateTrigger(prev => prev + 1);
    };
    
    document.addEventListener('visibilitychange', checkProgress);
    checkProgress();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', checkProgress);
    };
  }, []);

  useEffect(() => {
    const loadStoryList = async () => {
      try {
        const loadedStories = await loadStories();
        setStories(loadedStories);
        setFilteredStories(loadedStories);
      } catch (error) {
        console.error('Error loading stories:', error);
        setStories(fallbackStories);
        setFilteredStories(fallbackStories);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoryList();
  }, []);

  // Get all unique tags from stories
  const getAllTags = () => {
    const allTags = new Set<string>();
    stories.forEach(story => {
      story.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  // Handle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
  };

  // Handle search and tag filtering
  useEffect(() => {
    let filtered = searchStories(stories, searchQuery);
    
    // Apply tag filtering if tags are selected
    if (selectedTags.length > 0) {
      filtered = filtered.filter(story => 
        selectedTags.every(tag => story.tags.includes(tag))
      );
    }
    
    setFilteredStories(filtered);
  }, [searchQuery, stories, selectedTags]);

  const completion = useMemo(() => {
    if (stories.length === 0) return 0;
    const readCount = stories.filter(s => readingProgressService.isRead(s.id)).length;
    return Math.round((readCount / stories.length) * 100);
  }, [stories, progressUpdateTrigger]);

  // Get story icon based on tags or fallback to index-based icon
  const getStoryIcon = (story: Story, index: number) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'consciousness': Brain,
      'awareness': Eye,
      'existence': Globe,
      'time': Clock,
      'eternity': Sparkles,
      'being': BookOpen,
      'identity': Scroll,
      'writing': Feather,
      'fiction': BookOpen,
      'philosophy': Brain,
      'narrative': Scroll,
      'mystery': Eye,
      'transcendence': Sparkles,
      'imagination': Zap,
    };

    // Try to find icon based on tags
    for (const tag of story.tags) {
      const lowerTag = tag.toLowerCase();
      if (iconMap[lowerTag]) {
        return iconMap[lowerTag];
      }
    }

    // Fallback to index-based icon cycling
    const fallbackIcons = [BookOpen, Scroll, Feather, Eye, Brain, Globe, Clock, Sparkles, Zap];
    return fallbackIcons[index % fallbackIcons.length];
  };

  const handleStoryClick = (story: Story, index: number) => {
    const actualIndex = stories.findIndex(s => s.id === story.id);
    localStorage.setItem('currentStoryIndex', actualIndex.toString());
    navigate(AppRoute.STORIES);
  };

  if (isLoading) {
    return (
      <CleanLayout
        currentPage="stories"
        onRead={() => navigate(AppRoute.STORIES)}
        isReading={false}
        onOpenAI={onOpenAI}
      >
        <div className="min-h-screen bg-paper-light dark:bg-paper-dark paper-texture flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-primary dark:border-paper-light mx-auto mb-4"></div>
            <p className="text-ink-secondary dark:text-ink-muted">Loading stories...</p>
          </div>
        </div>
      </CleanLayout>
    );
  }

  return (
    <CleanLayout
      currentPage="stories"
      onRead={() => navigate(AppRoute.STORIES)}
      isReading={false}
      onOpenAI={onOpenAI}
    >
      {/* Search Bar */}
      <div className="fixed top-0 left-0 right-0 z-[70] bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-md border-b border-ink-muted/10 dark:border-paper-light/10 lg:relative lg:bg-transparent lg:border-b-0 lg:backdrop-blur-none">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-6 py-4 lg:pt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-secondary dark:text-ink-muted" />
            <input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={(e) => {
                if (!e.relatedTarget || !e.relatedTarget.closest('[data-search-overlay]')) {
                  setIsSearchFocused(false);
                }
              }}
              className="w-full pl-12 pr-12 py-3 bg-paper-light dark:bg-paper-dark border border-ink-muted/20 dark:border-paper-light/20 rounded-xl text-ink-primary dark:text-paper-light placeholder-ink-secondary dark:placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
            />
            {(isSearchFocused || searchQuery.trim()) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchFocused(false);
                  setSelectedTags([]);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Search Overlay */}
      {(isSearchFocused || searchQuery.trim()) && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-lg z-[60]"
            onClick={() => {
              setSearchQuery('');
              setIsSearchFocused(false);
              setSelectedTags([]);
            }}
          />
          
          {/* Search Results Full Screen */}
          <div data-search-overlay className="fixed top-20 left-0 right-0 bottom-0 z-[60] overflow-hidden lg:absolute lg:top-full lg:mt-2">
            <div className="max-w-2xl lg:max-w-4xl mx-auto h-full flex flex-col">
              {/* Tag Cloud - Horizontal Scrollable, Two Rows */}
              <div className="px-6 py-4 border-b border-ink-muted/10 dark:border-paper-light/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-ink-secondary dark:text-ink-muted">
                    Filter by tags
                  </h3>
                  {(selectedTags.length > 0 || searchQuery.trim()) && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex flex-col gap-2 pb-2" style={{ minWidth: 'max-content' }}>
                    {(() => {
                      const allTags = getAllTags();
                      const midPoint = Math.ceil(allTags.length / 2);
                      const firstRow = allTags.slice(0, midPoint);
                      const secondRow = allTags.slice(midPoint);
                      
                      return (
                        <>
                          {/* First row */}
                          <div className="flex gap-2">
                            {firstRow.map((tag, index) => (
                              <button
                                key={`filter-tag-1-${tag}-${index}`}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                                  selectedTags.includes(tag)
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                                    : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 border border-transparent'
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                          
                          {/* Second row */}
                          <div className="flex gap-2">
                            {secondRow.map((tag, index) => (
                              <button
                                key={`filter-tag-2-${tag}-${index}`}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                                  selectedTags.includes(tag)
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                                    : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 border border-transparent'
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <ul role="list" className="divide-y divide-ink-muted/10 dark:divide-paper-light/10">
                  {filteredStories.map((story, index) => {
                    const IconComponent = getStoryIcon(story, index);
                    const isRead = readingProgressService.isRead(story.id);
                    
                    return (
                      <li
                        key={story.id}
                        className="relative flex justify-between gap-x-6 px-6 py-5 hover:bg-ink-primary/5 dark:hover:bg-paper-light/5 transition-colors"
                      >
                        <button
                          onClick={() => handleStoryClick(story, index)}
                          className="flex min-w-0 gap-x-4 w-full text-left"
                        >
                          <span className="absolute inset-x-0 -top-px bottom-0" />
                          
                          {/* Icon */}
                          <div className="relative flex-none rounded-full p-3 w-12 h-12 flex items-center justify-center bg-ink-muted/10 dark:bg-paper-light/10">
                            <IconComponent className="w-6 h-6 text-ink-secondary dark:text-ink-muted" />
                            {isRead && (
                              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="min-w-0 flex-auto">
                            <div className="flex items-center gap-2">
                              <p className="text-sm/6 font-semibold text-ink-primary dark:text-paper-light">
                                {story.title}
                              </p>
                              {isRead && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  Read
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1 justify-center">
                              {story.tags.slice(0, 3).map((tag, tagIndex) => (
                                <span
                                  key={`${story.id}-tag-${tagIndex}`}
                                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                                    selectedTags.includes(tag)
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                      : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                              {story.tags.length > 3 && (
                                <span className="text-xs text-ink-secondary dark:text-ink-muted">
                                  +{story.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Chevron */}
                          <div className="flex shrink-0 items-center">
                            <ChevronRight className="w-5 h-5 text-ink-muted dark:text-ink-secondary" />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                
                {filteredStories.length === 0 && (
                  <div className="text-center py-16 px-6">
                    <Search className="w-16 h-16 mx-auto mb-4 text-ink-muted/50 dark:text-ink-muted/30" />
                    <h3 className="text-xl font-medium text-ink-primary dark:text-paper-light mb-2">
                      No stories found
                    </h3>
                    <p className="text-ink-secondary dark:text-ink-muted">
                      Try adjusting your search terms
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col p-6 lg:p-10 pb-24 max-w-7xl mx-auto w-full" style={{ paddingTop: '6rem' }}>
        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 mt-4 text-left"
        >
          <div className="mb-4 flex items-center gap-3">
            <Scroll className="w-8 h-8 text-ink-primary dark:text-paper-light flex-shrink-0" />
            <h1 className="text-3xl lg:text-4xl font-serif text-ink-primary dark:text-paper-light">
              Stories
            </h1>
          </div>
          <p className="text-lg text-ink-secondary dark:text-ink-muted max-w-2xl leading-relaxed">
            Narrative explorations of consciousness, existence, and the mysteries of being. 
            These stories weave together philosophy, imagination, and insight to illuminate 
            the deeper questions of what it means to exist and to know.
          </p>
        </motion.div>

        {/* Completion Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <div className="flex-1 bg-ink-muted/20 dark:bg-paper-light/20 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-sm text-ink-secondary dark:text-ink-muted whitespace-nowrap">
              {completion}% Complete
            </span>
          </div>
        </motion.div>

        {/* Stories Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <ContentCarousel
            items={stories}
            contentType="story"
            onItemClick={handleStoryClick}
            showReadStatus={true}
          />
        </motion.div>
      </div>
    </CleanLayout>
  );
};

export default StoriesLandingPage;


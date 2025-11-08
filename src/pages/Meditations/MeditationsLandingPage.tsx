import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppRoute, Meditation } from '../../types';
import { loadMeditations, fallbackMeditations } from '../../data/meditationContent';
import { readingProgressService } from '../../services/readingProgressService';
import { contentCache } from '../../services/contentCache';
import SynchronizedCarousel from '../../components/SynchronizedCarousel';
import { Search, X, ChevronRight, Heart, Leaf, Star, Moon, Sun, Waves, Mountain, Compass, Flower2, CheckCircle2, Scale } from 'lucide-react';
import { searchMeditations } from '../../data/meditationContent';

const MeditationsLandingPage: React.FC = () => {
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [filteredMeditations, setFilteredMeditations] = useState<Meditation[]>([]);
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
    const loadMeditationList = async () => {
      try {
        // Check if already cached - if so, skip loading state
        const isCached = contentCache.hasMeditations();
        if (!isCached) {
          setIsLoading(true);
        }
        
        const loadedMeditations = await contentCache.getMeditations(loadMeditations);
        setMeditations(loadedMeditations);
        setFilteredMeditations(loadedMeditations);
      } catch (error) {
        console.error('Error loading meditations:', error);
        setMeditations(fallbackMeditations);
        setFilteredMeditations(fallbackMeditations);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeditationList();
  }, []);

  // Get all unique tags from meditations
  const getAllTags = () => {
    const allTags = new Set<string>();
    meditations.forEach(meditation => {
      meditation.tags.forEach(tag => allTags.add(tag));
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
    let filtered = searchMeditations(meditations, searchQuery);
    
    // Apply tag filtering if tags are selected
    if (selectedTags.length > 0) {
      filtered = filtered.filter(meditation => 
        selectedTags.every(tag => meditation.tags.includes(tag))
      );
    }
    
    setFilteredMeditations(filtered);
  }, [searchQuery, meditations, selectedTags]);

  const completion = useMemo(() => {
    if (meditations.length === 0) return 0;
    const readCount = meditations.filter(m => readingProgressService.isRead(m.id)).length;
    return Math.round((readCount / meditations.length) * 100);
  }, [meditations, progressUpdateTrigger]);

  // Get meditation icon based on tags or fallback to index-based icon
  const getMeditationIcon = (meditation: Meditation, index: number) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'breathing': Waves,
      'mindfulness': Leaf,
      'compassion': Heart,
      'love': Heart,
      'kindness': Heart,
      'morning': Sun,
      'evening': Moon,
      'night': Moon,
      'sleep': Moon,
      'nature': Mountain,
      'peace': Flower2,
      'calm': Waves,
      'guidance': Compass,
      'intention': Star,
      'focus': Star,
      'awareness': Compass,
    };

    // Try to find icon based on tags
    for (const tag of meditation.tags) {
      const lowerTag = tag.toLowerCase();
      if (iconMap[lowerTag]) {
        return iconMap[lowerTag];
      }
    }

    // Fallback to index-based icon cycling
    const fallbackIcons = [Heart, Leaf, Star, Moon, Sun, Waves, Mountain, Compass, Flower2];
    return fallbackIcons[index % fallbackIcons.length];
  };

  const handleMeditationClick = (meditation: Meditation, index: number) => {
    // Save both ID and index for redundancy
    const actualIndex = meditations.findIndex(m => m.id === meditation.id);
    localStorage.setItem('currentMeditationId', meditation.id);
    localStorage.setItem('currentMeditationIndex', actualIndex.toString());
    navigate(AppRoute.MEDITATIONS);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-primary dark:border-paper-light mx-auto mb-4"></div>
          <p className="text-ink-secondary dark:text-ink-muted">Loading meditations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search Bar */}
      <div className="fixed top-0 left-0 right-0 z-[70] lg:relative">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-6 py-4 lg:pt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-secondary dark:text-ink-muted" />
            <input
              type="text"
              placeholder="Search meditations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={(e) => {
                if (!e.relatedTarget || !e.relatedTarget.closest('[data-search-overlay]')) {
                  setIsSearchFocused(false);
                }
              }}
              className="w-full pl-12 pr-12 py-3 bg-gray-100 dark:bg-gray-800 rounded-full text-ink-primary dark:text-paper-light placeholder-ink-secondary dark:placeholder-ink-muted focus:outline-none border-0 transition-all"
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
          {/* Backdrop with Video Background */}
          <div 
            className="fixed inset-0 z-[60]"
            onClick={() => {
              setSearchQuery('');
              setIsSearchFocused(false);
              setSelectedTags([]);
            }}
          >
            {/* Background Video */}
            <div className="absolute inset-0 overflow-hidden">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-100 dark:opacity-100"
              >
                <source src="/media/bg.mp4" type="video/mp4" />
              </video>
              {/* Dark overlay for better content readability */}
              <div className="absolute inset-0 bg-paper-light/50 dark:bg-slate-950/75"></div>
            </div>
          </div>
          
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

              <div className="flex-1 overflow-y-auto pb-24">
                <ul role="list" className="divide-y divide-ink-muted/10 dark:divide-paper-light/10">
                  {filteredMeditations.map((meditation, index) => {
                    const IconComponent = getMeditationIcon(meditation, index);
                    const isRead = readingProgressService.isRead(meditation.id);
                    
                    return (
                      <li
                        key={meditation.id}
                        className="relative flex justify-between gap-x-6 px-6 py-5 hover:bg-ink-primary/5 dark:hover:bg-paper-light/5 transition-colors"
                      >
                        <button
                          onClick={() => handleMeditationClick(meditation, index)}
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
                                {meditation.title}
                              </p>
                              {isRead && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  Read
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1 justify-center">
                              {meditation.tags.slice(0, 3).map((tag, tagIndex) => (
                                <span
                                  key={`${meditation.id}-tag-${tagIndex}`}
                                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                                    selectedTags.includes(tag)
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                      : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                              {meditation.tags.length > 3 && (
                                <span className="text-xs text-ink-secondary dark:text-ink-muted">
                                  +{meditation.tags.length - 3}
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
                
                {filteredMeditations.length === 0 && (
                  <div className="text-center py-16 px-6">
                    <Search className="w-16 h-16 mx-auto mb-4 text-ink-muted/50 dark:text-ink-muted/30" />
                    <h3 className="text-xl font-medium text-ink-primary dark:text-paper-light mb-2">
                      No meditations found
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
            <Scale className="w-8 h-8 text-ink-primary dark:text-paper-light flex-shrink-0" />
            <h1 className="text-3xl lg:text-4xl font-serif text-ink-primary dark:text-paper-light">
              Meditations
            </h1>
          </div>
          <p className="text-lg text-ink-secondary dark:text-ink-muted max-w-2xl leading-relaxed">
            Guided reflections and contemplative practices designed to deepen awareness, 
            cultivate mindfulness, and explore the inner landscape of consciousness. 
            Each meditation offers a unique perspective on presence, compassion, and understanding.
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

        {/* Meditations Carousel - 3 Rows Synchronized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <SynchronizedCarousel
            items={meditations}
            onItemClick={handleMeditationClick}
            showReadStatus={true}
            isLoading={isLoading}
          />
        </motion.div>
      </div>
    </>
  );
};

export default MeditationsLandingPage;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Brain, Calendar, Bookmark } from 'lucide-react';
import { AppRoute, TextHighlight } from '../../types';
import CleanLayout from '../../components/CleanLayout';
import { highlightsService } from '../../services/firebaseHighlights';
import { authService } from '../../services/firebaseAuth';
import UpgradePrompt from '../../components/UpgradePrompt';

interface SavedPageProps {
  onOpenAI?: () => void;
}

const SavedPage: React.FC<SavedPageProps> = ({ onOpenAI }) => {
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHighlights, setFilteredHighlights] = useState<TextHighlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [userCapabilities, setUserCapabilities] = useState({
    canSaveProgress: false,
    canSaveHighlights: false,
    canUseAI: false,
    canSync: false,
    userType: 'guest' as 'guest' | 'anonymous' | 'authenticated' | 'admin',
    hasActiveSubscription: false
  });

  // Update capabilities when auth state changes
  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        const capabilities = await authService.getUserCapabilities();
        setUserCapabilities({
          ...capabilities,
          userType: capabilities.userType as 'guest' | 'anonymous' | 'authenticated' | 'admin'
        });
      } catch (error) {
        console.error('Error checking user capabilities:', error);
      }
    };

    checkCapabilities();

    const unsubscribe = authService.onAuthStateChanged(async () => {
      await checkCapabilities();
    });
    return unsubscribe;
  }, []);

  // Load saved highlights from Firebase or localStorage
  useEffect(() => {
    const loadHighlights = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser && !currentUser.isAnonymous) {
          // Authenticated user - load from Firebase
          const userHighlights = await highlightsService.getUserHighlights(currentUser.uid);
          setHighlights(userHighlights);
          setFilteredHighlights(userHighlights);
        } else {
          // Anonymous user or not authenticated - use localStorage
          const savedHighlights = localStorage.getItem('savedHighlights');
          if (savedHighlights) {
            const parsed = JSON.parse(savedHighlights);
            setHighlights(parsed);
            setFilteredHighlights(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading highlights:', error);
        // Fallback to localStorage on error
        try {
          const savedHighlights = localStorage.getItem('savedHighlights');
          if (savedHighlights) {
            const parsed = JSON.parse(savedHighlights);
            setHighlights(parsed);
            setFilteredHighlights(parsed);
          }
        } catch (fallbackError) {
          console.error('Error loading fallback highlights:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadHighlights();
  }, [userCapabilities]);

  // Filter highlights based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHighlights(highlights);
    } else {
      const filtered = highlights.filter(highlight =>
        highlight.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        highlight.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredHighlights(filtered);
    }
  }, [searchQuery, highlights]);

  const handleHighlightClick = (highlight: TextHighlight) => {
    // Determine if it's a book chapter or meditation based on chapterId
    if (highlight.chapterId.startsWith('meditation-')) {
      // Navigate to meditations page
      navigate(AppRoute.MEDITATIONS);
    } else {
      // Navigate to book reader
      navigate(AppRoute.READER);
    }
  };

  const formatDate = (timestamp: Date) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSourceIcon = (highlight: TextHighlight) => {
    return highlight.chapterId.startsWith('meditation-') ? Brain : BookOpen;
  };

  const clearAllHighlights = async () => {
    if (window.confirm('Are you sure you want to delete all saved highlights?')) {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          await highlightsService.deleteAllUserHighlights(currentUser.uid);
        } else {
          localStorage.removeItem('savedHighlights');
        }
        setHighlights([]);
        setFilteredHighlights([]);
      } catch (error) {
        console.error('Error clearing highlights:', error);
        // Fallback to localStorage
        localStorage.removeItem('savedHighlights');
        setHighlights([]);
        setFilteredHighlights([]);
      }
    }
  };

  if (isLoading) {
    return (
      <CleanLayout
        currentPage="saved"
        onRead={() => navigate(AppRoute.READER)}
        onOpenAI={onOpenAI}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-ink-secondary dark:text-ink-muted">Loading highlights...</div>
        </div>
      </CleanLayout>
    );
  }

  return (
    <CleanLayout
      currentPage="saved"
      onRead={() => navigate(AppRoute.READER)}
      onOpenAI={onOpenAI}
    >
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink-primary dark:text-paper-light mb-2">
            Saved Highlights
          </h1>
          <p className="text-ink-secondary dark:text-ink-muted">
            Your collection of meaningful passages
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-secondary dark:text-ink-muted" />
          <input
            type="text"
            placeholder="Search highlights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-paper-light dark:bg-paper-dark border border-ink-muted/20 dark:border-paper-light/20 rounded-xl text-ink-primary dark:text-paper-light placeholder-ink-secondary dark:placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
          />
        </div>

        {/* Clear All Button */}
        {highlights.length > 0 && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={clearAllHighlights}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Highlights List */}
        {filteredHighlights.length > 0 ? (
          <div className="space-y-4">
            {filteredHighlights.map((highlight) => {
              const SourceIcon = getSourceIcon(highlight);
              
              return (
                <button
                  key={highlight.id}
                  onClick={() => handleHighlightClick(highlight)}
                  className="w-full text-left p-6 bg-paper-light/80 dark:bg-paper-dark/80 backdrop-blur-sm border border-ink-muted/20 dark:border-paper-light/20 rounded-2xl hover:bg-ink-primary/5 dark:hover:bg-paper-light/5 hover:border-ink-primary/30 dark:hover:border-paper-light/30 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <SourceIcon className="w-4 h-4 text-ink-secondary dark:text-ink-muted" />
                      <span className="text-sm font-medium text-ink-primary dark:text-paper-light">
                        {highlight.chapterTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-ink-secondary dark:text-ink-muted">
                      <Calendar className="w-3 h-3" />
                      {formatDate(highlight.timestamp)}
                    </div>
                  </div>

                  {/* Highlighted Text */}
                  <blockquote className="text-ink-primary dark:text-paper-light text-base leading-relaxed border-l-4 border-blue-500/30 pl-4 mb-3">
                    "{highlight.text}"
                  </blockquote>

                  {/* Note if exists */}
                  {highlight.reflection?.content && (
                    <div className="mt-3 p-3 bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg">
                      <p className="text-sm text-ink-secondary dark:text-ink-muted italic">
                        Note: {highlight.reflection.content}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            {searchQuery ? (
              <>
                <Search className="w-16 h-16 mx-auto mb-4 text-ink-muted/50 dark:text-ink-muted/30" />
                <h3 className="text-xl font-medium text-ink-primary dark:text-paper-light mb-2">
                  No highlights found
                </h3>
                <p className="text-ink-secondary dark:text-ink-muted">
                  Try adjusting your search terms
                </p>
              </>
            ) : (
              <>
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-ink-muted/50 dark:text-ink-muted/30" />
                <h3 className="text-xl font-medium text-ink-primary dark:text-paper-light mb-2">
                  No highlights yet
                </h3>
                <p className="text-ink-secondary dark:text-ink-muted mb-4">
                  Start highlighting text in books and meditations to save meaningful passages
                </p>
                <button
                  onClick={() => navigate(AppRoute.READER)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  Start Reading
                </button>
              </>
            )}
          </div>
        )}

        {/* Anonymous User Banner */}
        {userCapabilities.userType === 'anonymous' && highlights.length === 0 && (
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <div className="text-center">
              <Bookmark className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Highlights are saved locally
              </h3>
              <p className="text-blue-700 dark:text-blue-400 mb-4">
                Create an account to sync your highlights across all devices and never lose them.
              </p>
              <button
                onClick={() => setShowUpgradePrompt(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </div>

      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="highlights"
      />
    </CleanLayout>
  );
};

export default SavedPage;

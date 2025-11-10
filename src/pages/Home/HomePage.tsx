import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFitText } from 'react-use-fittext';
import { AppRoute, BookChapter, Meditation } from '../../types';
import { loadBookChapters } from '../../data/bookContent';
import { loadMeditations } from '../../data/meditationContent';
import { generateQuoteCards, QuoteCard } from '../../utils/quoteExtractor';
import { downloadElementAsImage } from '../../utils/cardDownloader';
import { quoteCardCache } from '../../services/quoteCardCache';
import StandardHeader from '../../components/StandardHeader';
import QuoteCardSkeleton from '../../components/QuoteCardSkeleton';
import GlassButton from '../../components/GlassButton';
import { Download, BookOpen, Scale } from 'lucide-react';
import SEO from '../../components/SEO';
import { generateWebsiteStructuredData, generateFAQStructuredData, getDefaultFAQs } from '../../utils/seoHelpers';

const SWIPE_THRESHOLD = 100;

// Helper function to shuffle array (Fisher-Yates)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const QuoteCardComponent: React.FC<{
  card: QuoteCard;
  style: React.CSSProperties;
  onSwipe: () => void;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}> = React.memo(({ card, style, onSwipe, cardRef, videoRef }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Use FitText to make quote text responsive to container
  const { fontSize, containerRef, textRef } = useFitText({
    maxFontSize: 25, // Reasonable max for readability and aesthetics
    minFontSize: 14,
    resolution: 1,
    fitMode: 'both',
    lineMode: 'multi',
    debounceDelay: 50,
  });

  // Optimized resize event dispatch using requestAnimationFrame
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      if (containerRef.current && textRef.current) {
        // Use custom event instead of global resize
        const event = new CustomEvent('fittext-recalculate', { bubbles: false });
        containerRef.current.dispatchEvent(event);
        // Fallback to resize if custom event not handled
        window.dispatchEvent(new Event('resize'));
      }
    });
    return () => cancelAnimationFrame(frameId);
  }, [card.quote, containerRef, textRef]);

  // Intersection Observer for video lazy loading
  useEffect(() => {
    const videoElement = videoRef?.current || localVideoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoElement.play().catch(() => {
              // Ignore autoplay errors
            });
          } else {
            videoElement.pause();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(videoElement);
    return () => observer.disconnect();
  }, [videoRef]);

  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      onSwipe();
    }
  }, [onSwipe]);

  // Memoize source icon
  const sourceIcon = useMemo(() => {
    switch (card.source.type) {
      case 'book':
        return <BookOpen className="w-4 h-4" />;
      case 'meditation':
        return <Scale className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  }, [card.source.type]);

  // Memoize source label
  const sourceLabel = useMemo(() => {
    if (card.source.type === 'book') {
      return `${card.source.part} • ${card.source.chapter}`;
    }
    return 'Meditation';
  }, [card.source.type, card.source.part, card.source.chapter]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        x,
        rotate,
        opacity,
        ...style,
        touchAction: 'none'
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      dragElastic={0.2}
      dragMomentum={false}
    >
      <div
        className="w-full h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col relative select-none pointer-events-none"
        ref={cardRef as React.RefObject<HTMLDivElement | null>}
      >
        {/* Background Video - Bottom layer */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
          <video
            ref={videoRef || localVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 1 }}
          >
            <source src="/media/bg.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Gradient Overlay - On top of video */}
        <div 
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: card.gradient, opacity: 0.9 }}
        />
        {/* Dark mode deepening overlay for gradients */}
        <div 
          className="absolute inset-0 z-[1] pointer-events-none hidden dark:block bg-black/30"
        />

        {/* Grainy texture overlay - softer grain */}
        <div className="absolute inset-0 z-[2] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          mixBlendMode: 'overlay',
          opacity: 0.5
        }} />
        
        {/* Additional fine grain layer for texture depth */}
        <div className="absolute inset-0 z-[2] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='fineGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23fineGrain)' opacity='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
          mixBlendMode: 'multiply',
          opacity: 0.4
        }} />
        
        
        {/* Card Content - Fixed height structure */}
        <div className="flex-1 flex flex-col justify-between items-center p-6 sm:p-8 md:p-10 min-h-0 relative z-10 pointer-events-none">
          {/* Source Icon & Type - Fixed height */}
          <div className="flex items-center gap-2 text-ink-primary/80 dark:text-white/80 text-xs sm:text-sm flex-shrink-0 min-h-[20px] pointer-events-none dark:[text-shadow:0_1px_4px_rgba(0,0,0,0.3)]">
            {sourceIcon}
            <span className="uppercase tracking-wider">{card.source.type}</span>
          </div>

          {/* Quote - Responsive font size using react-use-fittext */}
          <div 
            ref={containerRef as React.RefObject<HTMLDivElement>}
            className="flex-1 flex items-center justify-center w-full my-4 sm:my-6 px-4 overflow-hidden pointer-events-none"
          >
            <blockquote 
              ref={textRef as React.RefObject<HTMLQuoteElement>}
              className="text-ink-primary dark:text-white font-serif text-center leading-relaxed max-w-2xl whitespace-pre-line pointer-events-none w-full dark:[text-shadow:0_2px_8px_rgba(0,0,0,0.3)]" 
              style={{ 
                fontSize: `${fontSize}px`,
                lineHeight: '1.4'
              }}
            >
              {card.quote}
            </blockquote>
          </div>

          {/* Source Info - Fixed height with consistent spacing */}
          <div className="text-center text-ink-primary/90 dark:text-white/90 flex-shrink-0 flex flex-col justify-center pointer-events-none dark:[text-shadow:0_1px_4px_rgba(0,0,0,0.3)]">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 line-clamp-2">{card.source.title}</h3>
            {card.source.subtitle && (
              <p className="text-xs sm:text-sm md:text-base text-ink-primary/70 dark:text-white/70 mb-2 line-clamp-1">{card.source.subtitle}</p>
            )}
            <p className="text-xs sm:text-xs md:text-sm text-ink-primary/60 dark:text-white/60">{sourceLabel}</p>
          </div>
        </div>

        {/* Watermark - Fixed height */}
        <div className="py-3 sm:py-4 text-center flex-shrink-0 min-h-[44px] flex items-center justify-center pointer-events-none z-30">
          <p className="text-ink-primary/50 dark:text-white/50 text-xs sm:text-sm dark:[text-shadow:0_1px_4px_rgba(0,0,0,0.3)]">@middleofallthings</p>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if card ID changes
  return prevProps.card.id === nextProps.card.id;
});

const HomePage: React.FC = () => {
  const [cards, setCards] = useState<QuoteCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const navigate = useNavigate();
  const currentCardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const backgroundGenerationRef = useRef<boolean>(false);

  // Memoize lookup maps for O(1) access instead of O(n) findIndex
  const chapterIndexMap = useMemo(() => {
    return new Map(chapters.map((ch, idx) => [ch.id, idx]));
  }, [chapters]);

  const meditationIndexMap = useMemo(() => {
    return new Map(meditations.map((m, idx) => [m.id, idx]));
  }, [meditations]);

  // Preload video once
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  // Initial batch size for fast first load
  const INITIAL_BATCH_SIZE = 2; // Load only 2 chapters + 2 meditations first (reduced for faster load)
  const INITIAL_CARDS_TO_SHOW = 5; // Show first 5 cards immediately
  const SKELETON_THRESHOLD = 2; // Show skeleton when within 2 cards of the end

  // Load content progressively and generate cards in background
  useEffect(() => {
    let cancelled = false;

    // Background generation function
    const generateCardsInBackground = async () => {
      if (cancelled || backgroundGenerationRef.current) return;
      backgroundGenerationRef.current = true;

      try {
        // Load ALL content in background
        const [allChapters, allMeditations] = await Promise.all([
          loadBookChapters(),
          loadMeditations()
        ]);

        if (cancelled) return;

        // Update stored content
        setChapters(allChapters);
        setMeditations(allMeditations);

        // Use requestIdleCallback for non-critical work
        const generateAndMergeCards = () => {
          // Generate all cards
          const allCards = generateQuoteCards(
            allChapters,
            allMeditations,
            []
          );

          if (cancelled) return;

          // Merge with cache and save
          const merged = quoteCardCache.mergeCards(allCards);
          
          // Batch state update - add all new cards at once instead of progressively
          setCards(current => {
            const currentIds = new Set(current.map(c => c.id));
            const newCards = merged.filter(c => !currentIds.has(c.id));
            
            if (newCards.length > 0) {
              // Shuffle new cards for variety
              const shuffledNew = shuffleArray(newCards);
              
              // Add all new cards in one update (batched)
              const updated = [...current, ...shuffledNew];
              setIsLoadingMore(false);
              return updated;
            }
            
            return current;
          });

          // Mark background generation as complete after cards are generated
          backgroundGenerationRef.current = false;
        };

        // Use requestIdleCallback if available, otherwise use setTimeout
        if ('requestIdleCallback' in window) {
          requestIdleCallback(generateAndMergeCards, { timeout: 2000 });
        } else {
          setTimeout(generateAndMergeCards, 0);
        }

      } catch (error) {
        console.error('Error generating cards in background:', error);
        backgroundGenerationRef.current = false;
      }
    };

    const loadContent = async () => {
      try {
        // Step 1: Try to load pre-generated quotes.json first (fastest option)
        try {
          const response = await fetch('/quotes.json');
          if (response.ok) {
            const preGeneratedCards = await response.json() as QuoteCard[];
            if (preGeneratedCards && preGeneratedCards.length > 0) {
              // Shuffle and show random subset immediately
              const shuffled = shuffleArray(preGeneratedCards);
              const cardsToShow = shuffled.slice(0, INITIAL_CARDS_TO_SHOW);
              setCards(cardsToShow);
              setIsLoading(false);
              
              // Save to cache for future visits
              quoteCardCache.saveCardsImmediate(preGeneratedCards);
              
              // Load full content for navigation (non-blocking)
              Promise.all([
                loadBookChapters(),
                loadMeditations()
              ]).then(([allChapters, allMeditations]) => {
                if (!cancelled) {
                  setChapters(allChapters);
                  setMeditations(allMeditations);
                }
              });
              
              // Start background generation in parallel (to update cache with any new content)
              generateCardsInBackground();
              return;
            }
          }
        } catch (error) {
          console.warn('Could not load pre-generated quotes.json, falling back to cache:', error);
        }

        // Step 2: Check for cached cards in localStorage - show immediately if available
        const cachedCards = quoteCardCache.getCachedCards();
        if (cachedCards && cachedCards.length > 0) {
          // Show random subset from cache immediately
          const randomSubset = quoteCardCache.getRandomSubset(INITIAL_CARDS_TO_SHOW);
          if (randomSubset.length > 0) {
            setCards(randomSubset);
            setIsLoading(false);
            
            // Load full content for navigation (non-blocking)
            Promise.all([
              loadBookChapters(),
              loadMeditations()
            ]).then(([allChapters, allMeditations]) => {
              if (!cancelled) {
                setChapters(allChapters);
                setMeditations(allMeditations);
              }
            });
            
            // Start background generation in parallel
            generateCardsInBackground();
            return;
          }
        }

        // Step 3: Load initial batch quickly (small subset for fast first render)
        const startTime = Date.now();
        const MIN_SKELETON_TIME = 600; // Reduced since we'll show cards faster

        // Load initial small batch
        const [initialChapters, initialMeditations] = await Promise.all([
          loadBookChapters().then(chapters => chapters.slice(0, INITIAL_BATCH_SIZE)),
          loadMeditations().then(meditations => meditations.slice(0, INITIAL_BATCH_SIZE))
        ]);

        if (cancelled) return;

        // Store initial content
        setChapters(initialChapters);
        setMeditations(initialMeditations);

        // Step 4: Generate initial cards from small batch
        const initialCards = generateQuoteCards(
          initialChapters,
          initialMeditations,
          []
        );

        // Merge with cache if exists
        const allCached = quoteCardCache.getCachedCards() || [];
        const mergedCards = [...allCached, ...initialCards];
        const uniqueCards = Array.from(
          new Map(mergedCards.map(card => [card.id, card])).values()
        );

        // Shuffle and show initial subset
        const shuffled = shuffleArray(uniqueCards);
        const cardsToShow = shuffled.slice(0, INITIAL_CARDS_TO_SHOW);

        // Save to cache
        quoteCardCache.saveCards(uniqueCards);

        // Calculate remaining skeleton time
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_SKELETON_TIME - elapsed);

        setTimeout(() => {
          if (cancelled) return;
          setCards(cardsToShow);
          setIsLoading(false);
        }, remainingTime);

        // Step 5: Start background generation
        generateCardsInBackground();

      } catch (error) {
        console.error('Error loading content:', error);
        setTimeout(() => setIsLoading(false), 600);
      }
    };

    loadContent();
    return () => {
      cancelled = true;
      backgroundGenerationRef.current = false;
    };
  }, []);

  // Monitor when user reaches near the end and show skeleton if more cards aren't ready
  useEffect(() => {
    // Check if user is at or past the last available card
    const isAtEnd = currentIndex >= cards.length - 1;
    
    // If at the end and background generation is running, show skeleton
    if (isAtEnd && backgroundGenerationRef.current) {
      setIsLoadingMore(true);
    } else if (currentIndex < cards.length - SKELETON_THRESHOLD) {
      // Hide skeleton if we have enough cards ahead
      setIsLoadingMore(false);
    }
  }, [currentIndex, cards.length]);

  const handleSwipe = useCallback(() => {
    // Move to next card - allow going to the end even if loading
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    
    // If we're at or past the end and background generation is running, show skeleton
    if (nextIndex >= cards.length && backgroundGenerationRef.current) {
      setIsLoadingMore(true);
    }
  }, [currentIndex, cards.length]);

  const handleDownload = useCallback(async () => {
    if (!cards[currentIndex] || !currentCardRef.current) return;
    const filename = `middle-quote-${cards[currentIndex].source.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    await downloadElementAsImage(currentCardRef.current, filename);
  }, [cards, currentIndex]);

  const handleRead = useCallback(() => {
    const card = cards[currentIndex];
    if (!card) return;

    // Navigate to the specific source material using memoized maps
    switch (card.source.type) {
      case 'book': {
        // Use O(1) map lookup instead of O(n) findIndex
        const chapterIndex = chapterIndexMap.get(card.source.id);
        if (chapterIndex !== undefined) {
          localStorage.setItem('currentChapterIndex', chapterIndex.toString());
          navigate(AppRoute.READER);
        } else {
          // Fallback: navigate to reader without specific chapter
          navigate(AppRoute.READER);
        }
        break;
      }
      case 'meditation': {
        // Use O(1) map lookup instead of O(n) findIndex
        const meditationIndex = meditationIndexMap.get(card.source.id);
        if (meditationIndex !== undefined) {
          localStorage.setItem('currentMeditationId', card.source.id);
          localStorage.setItem('currentMeditationIndex', meditationIndex.toString());
          navigate(AppRoute.MEDITATIONS);
        } else {
          // Fallback: navigate to meditations without specific meditation
          navigate(AppRoute.MEDITATIONS);
        }
        break;
      }
      default:
        navigate(AppRoute.READER);
        break;
    }
  }, [cards, currentIndex, chapterIndexMap, meditationIndexMap, navigate]);

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];
  const hasCards = cards.length > 0;

  return (
    <>
      <SEO
        title="In the Middle of All Things"
        description="A contemplative journey through philosophical exploration of existence, consciousness, and the nature of being. Discover quotes, read chapters, and explore guided meditations that examine the axis of becoming, the spiral path, the living axis, and the horizon beyond."
        keywords="philosophy, meditation, consciousness, existence, being, philosophical quotes, contemplative practice, wisdom, self-discovery, philosophical exploration"
        structuredData={{
          ...generateWebsiteStructuredData(),
          ...generateFAQStructuredData(getDefaultFAQs()),
        }}
      />
      {/* Fixed viewport layout - accounts for mobile nav and desktop nav */}
      <div className="fixed inset-0 pb-24 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0">
          <StandardHeader title="In the Middle of All Things" showSettingsButton={true} />
        </header>

        {/* Main content area - takes remaining space */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-0">
          {/* Card Stack - Responsive to container height */}
          <div className="relative w-full max-w-2xl flex-1 max-h-full mb-8 sm:mb-6">
            {!hasCards || isLoading ? (
              /* Show skeleton while content loads in background */
              <>
                {/* Next card skeleton (underneath) */}
                <div
                  className="absolute inset-0"
                  style={{
                    transform: 'scale(0.95) translateY(20px)',
                    opacity: 0.5,
                    zIndex: 0
                  }}
                >
                  <QuoteCardSkeleton />
                </div>

                {/* Current card skeleton */}
                <div className="absolute inset-0" style={{ zIndex: 1 }}>
                  <QuoteCardSkeleton />
                </div>
              </>
            ) : isLoadingMore && currentIndex >= cards.length - 1 ? (
              /* Show skeleton when user reaches end and more cards are loading */
              <>
                {/* Next card skeleton (underneath) */}
                <div
                  className="absolute inset-0"
                  style={{
                    transform: 'scale(0.95) translateY(20px)',
                    opacity: 0.5,
                    zIndex: 0
                  }}
                >
                  <QuoteCardSkeleton />
                </div>

                {/* Current card skeleton */}
                <div className="absolute inset-0" style={{ zIndex: 1 }}>
                  <QuoteCardSkeleton />
                </div>
              </>
            ) : currentIndex >= cards.length && !backgroundGenerationRef.current ? (
              /* Show "all quotes seen" only if background generation is complete */
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif text-ink-primary dark:text-paper-light mb-4">
                    You&apos;ve seen all quotes!
                  </h2>
                  <button
                    onClick={() => setCurrentIndex(0)}
                    className="px-6 py-3 bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary rounded-full hover:opacity-90 transition-opacity font-medium"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Next card (underneath) */}
                {nextCard && (
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: 'scale(0.95) translateY(24px)',
                      opacity: 0.5,
                      zIndex: 0
                    }}
                  >
                    <div
                      className="w-full h-full rounded-3xl shadow-xl"
                      style={{ background: nextCard.gradient }}
                    />
                  </div>
                )}

                {/* Current card */}
                {currentCard && (
                  <div className="absolute inset-0" style={{ zIndex: 1 }}>
                    <QuoteCardComponent
                      key={currentCard.id}
                      card={currentCard}
                      style={{}}
                      onSwipe={handleSwipe}
                      cardRef={currentCardRef}
                      videoRef={videoRef}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          {hasCards && currentIndex < cards.length && (
            <div className="flex gap-4 items-center justify-center flex-shrink-0">
              <GlassButton
                onClick={handleRead}
                icon={
                  <>
                    {currentCard.source.type === 'book' && <BookOpen className="w-4 h-4" />}
                    {currentCard.source.type === 'meditation' && <Scale className="w-4 h-4" />}
                  </>
                }
              >
                Read {currentCard.source.type === 'book' ? 'Book' : 'Meditation'}
              </GlassButton>

              <GlassButton
                onClick={handleDownload}
                icon={<Download className="w-4 h-4" />}
              >
                Download
              </GlassButton>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default HomePage;

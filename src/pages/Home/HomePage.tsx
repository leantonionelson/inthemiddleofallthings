import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFitText } from 'react-use-fittext';
import { AppRoute, BookChapter, Meditation } from '../../types';
import { loadBookChapters } from '../../data/bookContent';
import { loadMeditations } from '../../data/meditationContent';
import { generateQuoteCards, QuoteCard } from '../../utils/quoteExtractor';
import { downloadCardAsImage, downloadElementAsImage } from '../../utils/cardDownloader';
import StandardHeader from '../../components/StandardHeader';
import QuoteCardSkeleton from '../../components/QuoteCardSkeleton';
import { Download, BookOpen, Scale } from 'lucide-react';

const SWIPE_THRESHOLD = 100;

const QuoteCardComponent: React.FC<{
  card: QuoteCard;
  style: React.CSSProperties;
  onSwipe: () => void;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}> = ({ card, style, onSwipe, cardRef }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  // Use FitText to make quote text responsive to container
  const { fontSize, containerRef, textRef } = useFitText({
    maxFontSize: 25, // Reasonable max for readability and aesthetics
    minFontSize: 14,
    resolution: 1,
    fitMode: 'both',
    lineMode: 'multi',
    debounceDelay: 50,
  });

  // Trigger recalculation when card changes
  useEffect(() => {
    // Force a small delay to ensure DOM is updated before recalculation
    const timer = setTimeout(() => {
      if (containerRef.current && textRef.current) {
        // Trigger a resize event to force recalculation
        window.dispatchEvent(new Event('resize'));
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [card.quote, containerRef, textRef]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      onSwipe();
    }
  };

  const getSourceIcon = () => {
    switch (card.source.type) {
      case 'book':
        return <BookOpen className="w-4 h-4" />;
      case 'meditation':
        return <Scale className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getSourceLabel = () => {
    if (card.source.type === 'book') {
      return `${card.source.part} • ${card.source.chapter}`;
    }
    return 'Meditation';
  };

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
            autoPlay
            loop
            muted
            playsInline
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
            {getSourceIcon()}
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
            <p className="text-xs sm:text-xs md:text-sm text-ink-primary/60 dark:text-white/60">{getSourceLabel()}</p>
          </div>
        </div>

        {/* Watermark - Fixed height */}
        <div className="py-3 sm:py-4 text-center flex-shrink-0 min-h-[44px] flex items-center justify-center pointer-events-none z-30">
          <p className="text-ink-primary/50 dark:text-white/50 text-xs sm:text-sm dark:[text-shadow:0_1px_4px_rgba(0,0,0,0.3)]">@middleofallthings</p>
        </div>
      </div>
    </motion.div>
  );
};

const HomePage: React.FC = () => {
  const [cards, setCards] = useState<QuoteCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const currentCardRef = useRef<HTMLDivElement>(null);

  // Minimum number of cards to generate before showing (ensures good variety)
  const MIN_CARDS_TO_SHOW = 10;

  // Load content progressively in background - seamless UX with skeleton
  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      try {
        const startTime = Date.now();
        const MIN_SKELETON_TIME = 800; // Minimum time to show skeleton (ms)

        // Load ALL content first (don't use progressive loading)
        // This ensures all quotes are generated at once
        const [allChapters, allMeditations] = await Promise.all([
          loadBookChapters(),
          loadMeditations()
        ]);

        if (cancelled) return;

        // Store chapters and meditations for navigation
        setChapters(allChapters);
        setMeditations(allMeditations);

        // Generate ALL quote cards in background
        const generateAndShowCards = () => {
          if (cancelled) return;
          
          // Generate all quotes from ALL content at once
          const allCards = generateQuoteCards(
            allChapters,
            allMeditations,
            [] // Empty array for stories
          );
          
          // Calculate remaining skeleton time
          const elapsed = Date.now() - startTime;
          const remainingTime = Math.max(0, MIN_SKELETON_TIME - elapsed);
          
          // Wait for minimum skeleton display time before showing cards
          setTimeout(() => {
            if (cancelled) return;
            
            if (allCards.length >= MIN_CARDS_TO_SHOW) {
              setCards(allCards);
              setIsLoading(false);
            } else {
              // If we don't have enough cards, show what we have
              setCards(allCards);
              setIsLoading(false);
            }
          }, remainingTime);
        };
        
        // Start quote generation in next tick to ensure skeleton renders
        setTimeout(generateAndShowCards, 50);
        
      } catch (error) {
        console.error('Error loading content:', error);
        // Even on error, hide skeleton after minimum time
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    loadContent();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSwipe = () => {
    // Move to next card
    setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1));
  };

  const handleDownload = async () => {
    if (!cards[currentIndex]) return;
    const filename = `middle-quote-${cards[currentIndex].source.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    if (currentCardRef.current) {
      await downloadElementAsImage(currentCardRef.current, filename);
    } else {
      await downloadCardAsImage(cards[currentIndex]);
    }
  };

  const handleRead = () => {
    const card = cards[currentIndex];
    if (!card) return;

    // Navigate to the specific source material
    switch (card.source.type) {
      case 'book': {
        // Find the chapter by ID
        const chapterIndex = chapters.findIndex(ch => ch.id === card.source.id);
        if (chapterIndex >= 0) {
          localStorage.setItem('currentChapterIndex', chapterIndex.toString());
          navigate(AppRoute.READER);
        } else {
          // Fallback: navigate to reader without specific chapter
          navigate(AppRoute.READER);
        }
        break;
      }
      case 'meditation': {
        // Find the meditation by ID
        const meditationIndex = meditations.findIndex(m => m.id === card.source.id);
        if (meditationIndex >= 0) {
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
  };

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];
  const hasCards = cards.length > 0;

  return (
    <>
      {/* Fixed viewport layout - accounts for mobile nav and desktop nav */}
      <div className="fixed inset-0 lg:top-24 pb-24 lg:pb-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0">
          <StandardHeader title="In the Middle of All Things" showSettingsButton={true} />
        </div>

        {/* Main content area - takes remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-0">
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
            ) : currentIndex >= cards.length ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif text-ink-primary dark:text-paper-light mb-4">
                    You've seen all quotes!
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
                      transform: 'scale(0.95) translateY(32px)',
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
                <div className="absolute inset-0" style={{ zIndex: 1 }}>
                  <QuoteCardComponent
                    key={currentCard.id}
                    card={currentCard}
                    style={{}}
                    onSwipe={handleSwipe}
                    cardRef={currentCardRef}
                  />
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {hasCards && currentIndex < cards.length && (
            <div className="flex gap-4 items-center justify-center flex-shrink-0">
              <button
                onClick={handleRead}
                className="relative flex items-center gap-2 px-6 py-3 rounded-full font-medium shadow-sm hover:shadow-md transition-all overflow-hidden group text-sm"
              >
                <div className="absolute inset-0 glass-subtle rounded-full" />
                <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                <div className="relative z-10 flex items-center gap-2 text-ink-primary dark:text-paper-light">
                  {currentCard.source.type === 'book' && <BookOpen className="w-4 h-4" />}
                  {currentCard.source.type === 'meditation' && <Scale className="w-4 h-4" />}
                  Read {currentCard.source.type === 'book' ? 'Book' : 'Meditation'}
                </div>
              </button>

              <button
                onClick={handleDownload}
                className="relative flex items-center gap-2 px-6 py-3 rounded-full font-medium shadow-sm hover:shadow-md transition-all overflow-hidden group text-sm"
              >
                <div className="absolute inset-0 glass-subtle rounded-full" />
                <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                <div className="relative z-10 flex items-center gap-2 text-ink-primary dark:text-paper-light">
                  <Download className="w-4 h-4" />
                  Download
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HomePage;

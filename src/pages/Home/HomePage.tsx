import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFitText } from 'react-use-fittext';
import { AppRoute } from '../../types';
import { loadBookChapters } from '../../data/bookContent';
import { loadMeditations } from '../../data/meditationContent';
import { progressiveLoader } from '../../services/progressiveLoader';
import { generateQuoteCards, QuoteCard } from '../../utils/quoteExtractor';
import { downloadCardAsImage } from '../../utils/cardDownloader';
import CleanLayout from '../../components/CleanLayout';
import StandardHeader from '../../components/StandardHeader';
import QuoteCardSkeleton from '../../components/QuoteCardSkeleton';
import { Download, BookOpen, Scale } from 'lucide-react';

interface HomePageProps {
  onOpenAI: () => void;
}

const SWIPE_THRESHOLD = 100;

const QuoteCardComponent: React.FC<{
  card: QuoteCard;
  style: React.CSSProperties;
  onSwipe: () => void;
}> = ({ card, style, onSwipe }) => {
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
        style={{ background: card.gradient }}
      >
        {/* Artistic background elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {/* Subtle noise texture */}
          <div className="absolute inset-0" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulance type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }} />
        </div>
        
        {/* Geometric accent shapes */}
        <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-40 h-40 rotate-45 bg-white/10 blur-2xl" />
        </div>
        
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)'
        }} />
        
        {/* Card Content - Fixed height structure */}
        <div className="flex-1 flex flex-col justify-between items-center p-6 sm:p-8 md:p-10 min-h-0 relative z-10 pointer-events-none">
          {/* Source Icon & Type - Fixed height */}
          <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm flex-shrink-0 min-h-[20px] pointer-events-none" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }}>
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
              className="text-white font-serif text-center leading-relaxed max-w-2xl whitespace-pre-line pointer-events-none w-full" 
              style={{ 
                fontSize: `${fontSize}px`,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                lineHeight: '1.4'
              }}
            >
              {card.quote}
            </blockquote>
          </div>

          {/* Source Info - Fixed height with consistent spacing */}
          <div className="text-center text-white/90 flex-shrink-0 flex flex-col justify-center pointer-events-none" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }}>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 line-clamp-2">{card.source.title}</h3>
            {card.source.subtitle && (
              <p className="text-xs sm:text-sm md:text-base text-white/70 mb-2 line-clamp-1">{card.source.subtitle}</p>
            )}
            <p className="text-xs sm:text-xs md:text-sm text-white/60">{getSourceLabel()}</p>
          </div>
        </div>

        {/* Watermark - Fixed height */}
        <div className="py-3 sm:py-4 text-center flex-shrink-0 min-h-[44px] flex items-center justify-center pointer-events-none">
          <p className="text-white/50 text-xs sm:text-sm" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }}>@middleofallthings</p>
        </div>
      </div>
    </motion.div>
  );
};

const HomePage: React.FC<HomePageProps> = ({ onOpenAI }) => {
  const [cards, setCards] = useState<QuoteCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // Load content progressively in background - seamless UX with skeleton
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const loadContent = async () => {
      try {
        // Subscribe to progress updates - only update when loading is complete
        unsubscribe = progressiveLoader.onProgress((progress) => {
          if (cancelled) return;
          
          // Only update cards once all content is fully loaded to avoid flurry
          if (progress.isComplete) {
            const loadedContent = progressiveLoader.getLoadedContent();
            
            // Regenerate quote cards with ALL loaded content (chapters and meditations only)
            const allCards = generateQuoteCards(
              loadedContent.chapters,
              loadedContent.meditations,
              [] // Empty array for stories - they need more context
            );
            setCards(allCards);
          }
        });

        // Load initial batch quickly (just 5 chapters and 5 meditations)
        const initialContent = await progressiveLoader.loadInitialContent(
          loadBookChapters,
          loadMeditations,
          async () => [] // Don't load stories
        );

        if (cancelled) return;

        // Generate quote cards from initial batch (chapters and meditations only)
        const initialCards = generateQuoteCards(
          initialContent.chapters,
          initialContent.meditations,
          [] // Empty array for stories
        );
        setCards(initialCards);
        
        // Background loading continues silently...
      } catch (error) {
        console.error('Error loading content:', error);
      }
    };

    loadContent();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const handleSwipe = () => {
    // Move to next card
    setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1));
  };

  const handleDownload = async () => {
    if (!cards[currentIndex]) return;
    await downloadCardAsImage(cards[currentIndex]);
  };

  const handleRead = () => {
    const card = cards[currentIndex];
    if (!card) return;

    // Navigate to appropriate section (book or meditation)
    switch (card.source.type) {
      case 'book':
        navigate(AppRoute.READER);
        break;
      case 'meditation':
        navigate(AppRoute.MEDITATIONS);
        break;
      default:
        navigate(AppRoute.READER);
        break;
    }
  };

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];
  const hasCards = cards.length > 0;

  return (
    <CleanLayout
      currentPage="home"
      onRead={() => navigate(AppRoute.READER)}
      isReading={false}
      onOpenAI={onOpenAI}
    >
      {/* Fixed viewport layout - accounts for mobile nav (80px) and desktop nav (80px) */}
      <div className="fixed inset-0 lg:top-20 pb-20 lg:pb-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0">
          <StandardHeader title="In the Middle of All Things" showSettingsButton={true} />
        </div>

        {/* Main content area - takes remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-0">
          {/* Card Stack - Responsive to container height */}
          <div className="relative w-full max-w-2xl flex-1 max-h-full mb-8 sm:mb-6">
            {!hasCards ? (
              /* Show skeleton while content loads */
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
                      transform: 'scale(0.95) translateY(20px)',
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
    </CleanLayout>
  );
};

export default HomePage;

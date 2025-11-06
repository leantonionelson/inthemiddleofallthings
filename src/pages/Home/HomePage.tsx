import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../types';
import { loadBookChapters } from '../../data/bookContent';
import { loadMeditations } from '../../data/meditationContent';
import { loadStories } from '../../data/storiesContent';
import { contentCache } from '../../services/contentCache';
import { generateQuoteCards, QuoteCard } from '../../utils/quoteExtractor';
import { downloadCardAsImage } from '../../utils/cardDownloader';
import CleanLayout from '../../components/CleanLayout';
import StandardHeader from '../../components/StandardHeader';
import { Download, BookOpen, Scale, Scroll, Loader } from 'lucide-react';

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
      case 'story':
        return <Scroll className="w-4 h-4" />;
    }
  };

  const getSourceLabel = () => {
    if (card.source.type === 'book') {
      return `${card.source.part} • ${card.source.chapter}`;
    }
    return card.source.type === 'meditation' ? 'Meditation' : 'Story';
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        x,
        rotate,
        opacity,
        ...style
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div
        className="w-full h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
        style={{ background: card.gradient }}
      >
        {/* Artistic background elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {/* Subtle noise texture */}
          <div className="absolute inset-0" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
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
        <div className="flex-1 flex flex-col justify-between items-center p-8 md:p-12 min-h-0 relative z-10">
          {/* Source Icon & Type - Fixed height */}
          <div className="flex items-center gap-2 text-white/80 text-sm flex-shrink-0 min-h-[24px]" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }}>
            {getSourceIcon()}
            <span className="uppercase tracking-wider">{card.source.type}</span>
          </div>

          {/* Quote - Scrollable area with fixed constraints */}
          <div className="flex-1 flex items-center justify-center w-full my-6 overflow-y-auto scrollbar-hide">
            <blockquote className="text-white text-xl md:text-2xl lg:text-3xl font-serif text-center leading-relaxed max-w-2xl whitespace-pre-line" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}>
              {card.quote}
            </blockquote>
          </div>

          {/* Source Info - Fixed height with consistent spacing */}
          <div className="text-center text-white/90 flex-shrink-0 flex flex-col justify-center" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }}>
            <h3 className="text-lg md:text-xl font-semibold mb-1 line-clamp-2">{card.source.title}</h3>
            {card.source.subtitle && (
              <p className="text-sm md:text-base text-white/70 mb-2 line-clamp-1">{card.source.subtitle}</p>
            )}
            <p className="text-xs md:text-sm text-white/60">{getSourceLabel()}</p>
          </div>
        </div>

        {/* Watermark - Fixed height */}
        <div className="py-4 text-center flex-shrink-0 min-h-[52px] flex items-center justify-center">
          <p className="text-white/50 text-sm" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }}>@middleofallthings</p>
        </div>
      </div>
    </motion.div>
  );
};

const HomePage: React.FC<HomePageProps> = ({ onOpenAI }) => {
  const [cards, setCards] = useState<QuoteCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load all content and generate quote cards
  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      try {
        const [chapters, meditations, stories] = await Promise.all([
          contentCache.getChapters(loadBookChapters),
          contentCache.getMeditations(loadMeditations),
          contentCache.getStories(loadStories)
        ]);

        if (cancelled) return;

        // Generate quote cards from all content
        const quoteCards = generateQuoteCards(chapters, meditations, stories);
        setCards(quoteCards);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading content:', error);
        setIsLoading(false);
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
    await downloadCardAsImage(cards[currentIndex]);
  };

  const handleRead = () => {
    const card = cards[currentIndex];
    if (!card) return;

    // Navigate to appropriate section
    switch (card.source.type) {
      case 'book':
        navigate(AppRoute.READER);
        break;
      case 'meditation':
        navigate(AppRoute.MEDITATIONS);
        break;
      case 'story':
        navigate(AppRoute.STORIES);
        break;
    }
  };

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];

  if (isLoading) {
    return (
      <CleanLayout
        currentPage="home"
        onRead={() => navigate(AppRoute.READER)}
        isReading={false}
        onOpenAI={onOpenAI}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-ink-primary dark:text-paper-light mx-auto mb-4" />
            <p className="text-ink-secondary dark:text-ink-muted">Loading quotes...</p>
          </div>
        </div>
      </CleanLayout>
    );
  }

  return (
    <CleanLayout
      currentPage="home"
      onRead={() => navigate(AppRoute.READER)}
      isReading={false}
      onOpenAI={onOpenAI}
    >
      <StandardHeader title="In the Middle of All Things" showSettingsButton={true} />

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 pt-10 pb-10">
        {/* Card Stack - Fixed dimensions for consistent height */}
        <div className="relative w-full max-w-2xl h-[600px] md:h-[700px] lg:h-[800px] mb-8">
          {currentIndex >= cards.length ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <h2 className="text-2xl font-serif text-ink-primary dark:text-paper-light mb-4">
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
                  card={currentCard}
                  style={{}}
                  onSwipe={handleSwipe}
                />
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {currentIndex < cards.length && (
          <div className="flex gap-4 items-center justify-center">
            <button
              onClick={handleRead}
              className="relative flex items-center gap-2 px-6 py-3 rounded-full font-medium shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              <div className="absolute inset-0 glass-subtle rounded-full" />
              <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
              <div className="relative z-10 flex items-center gap-2 text-ink-primary dark:text-paper-light">
                {currentCard.source.type === 'book' && <BookOpen className="w-5 h-5" />}
                {currentCard.source.type === 'meditation' && <Scale className="w-5 h-5" />}
                {currentCard.source.type === 'story' && <Scroll className="w-5 h-5" />}
                Read {currentCard.source.type === 'book' ? 'Book' : currentCard.source.type === 'meditation' ? 'Meditation' : 'Story'}
              </div>
            </button>

            <button
              onClick={handleDownload}
              className="relative flex items-center gap-2 px-6 py-3 rounded-full font-medium shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              <div className="absolute inset-0 glass-subtle rounded-full" />
              <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
              <div className="relative z-10 flex items-center gap-2 text-ink-primary dark:text-paper-light">
                <Download className="w-5 h-5" />
                Download
              </div>
            </button>
          </div>
        )}

        {/* Card Counter */}
        <div className="mt-6 text-center text-ink-secondary dark:text-ink-muted text-sm">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>
    </CleanLayout>
  );
};

export default HomePage;

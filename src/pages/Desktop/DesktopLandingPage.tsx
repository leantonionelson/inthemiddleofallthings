import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFitText } from 'react-use-fittext';
import { BookOpen, Scale, Scroll, ArrowLeft, ArrowRight, Headphones, Mail } from 'lucide-react';
import { generateQuoteCards, QuoteCard } from '../../utils/quoteExtractor';
import { loadBookChapters } from '../../data/bookContent';
import { loadMeditations } from '../../data/meditationContent';
import QRCode from '../../components/QRCode';
import EmailLinkButton from '../../components/EmailLinkButton';
import GlassButton from '../../components/GlassButton';
import QuoteCardSkeleton from '../../components/QuoteCardSkeleton';

const AUTO_ROTATE_INTERVAL = 8000; // 8 seconds per card

// Desktop Quote Card Component with auto-rotation
const DesktopQuoteCard: React.FC<{
  card: QuoteCard;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
}> = ({ card, isActive, onNext, onPrevious }) => {
  const { fontSize, containerRef, textRef } = useFitText({
    maxFontSize: 28,
    minFontSize: 16,
    resolution: 1,
    fitMode: 'both',
    lineMode: 'multi',
    debounceDelay: 50,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current && textRef.current) {
        window.dispatchEvent(new Event('resize'));
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [card.quote, containerRef, textRef]);

  const getSourceIcon = () => {
    switch (card.source.type) {
      case 'book':
        return <BookOpen className="w-4 h-4" />;
      case 'meditation':
        return <Scale className="w-4 h-4" />;
      case 'story':
        return <Scroll className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getSourceTypeLabel = () => {
    switch (card.source.type) {
      case 'book':
        return 'CHAPTER';
      case 'meditation':
        return 'MEDITATION';
      case 'story':
        return 'STORY';
      default:
        return 'CHAPTER';
    }
  };

  const getSourceLabel = () => {
    if (card.source.type === 'book') {
      return `${card.source.part} • ${card.source.chapter}`;
    }
    return card.source.type === 'meditation' ? 'Meditation' : 'Story';
  };

  // Check for reduce motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0.5, scale: 0.95 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
      className="relative w-full h-full"
    >
      <div className="w-full h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col relative select-none">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 1 }}
          >
            <source src="/media/bg-desktop.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: card.gradient, opacity: 0.9 }}
        />
        <div 
          className="absolute inset-0 z-[1] pointer-events-none hidden dark:block bg-black/30"
        />

        {/* Grainy texture overlay */}
        <div className="absolute inset-0 z-[2] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          mixBlendMode: 'overlay',
          opacity: 0.5
        }} />
        
        <div className="absolute inset-0 z-[2] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='fineGrain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23fineGrain)' opacity='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
          mixBlendMode: 'multiply',
          opacity: 0.4
        }} />
        
        {/* Card Content */}
        <div className="flex-1 flex flex-col justify-between items-center p-8 min-h-0 relative z-10">
          {/* Top Tag */}
          <div className="flex items-center gap-2 text-ink-primary/80 dark:text-white/80 text-xs flex-shrink-0 min-h-[20px] dark:[text-shadow:0_1px_4px_rgba(0,0,0,0.3)]">
            {getSourceIcon()}
            <span className="uppercase tracking-wider font-medium">{getSourceTypeLabel()}</span>
          </div>

          {/* Quote */}
          <div 
            ref={containerRef as React.RefObject<HTMLDivElement>}
            className="flex-1 flex items-center justify-center w-full my-6 px-4 overflow-hidden"
          >
            <blockquote 
              ref={textRef as React.RefObject<HTMLQuoteElement>}
              className="text-ink-primary dark:text-white font-serif text-center leading-relaxed max-w-2xl whitespace-pre-line w-full dark:[text-shadow:0_2px_8px_rgba(0,0,0,0.3)]" 
              style={{ 
                fontSize: `${fontSize}px`,
                lineHeight: '1.4'
              }}
            >
              {card.quote}
            </blockquote>
          </div>

          {/* Source Info */}
          <div className="text-center text-ink-primary/90 dark:text-white/90 flex-shrink-0 flex flex-col justify-center dark:[text-shadow:0_1px_4px_rgba(0,0,0,0.3)]">
            <h3 className="text-lg font-semibold mb-1 line-clamp-2">{card.source.title}</h3>
            {card.source.subtitle && (
              <p className="text-sm text-ink-primary/70 dark:text-white/70 mb-2 line-clamp-1">{card.source.subtitle}</p>
            )}
            <p className="text-xs text-ink-primary/60 dark:text-white/60 mb-3">{getSourceLabel()}</p>
            
            {/* Ghost-style action buttons */}
            <div className="flex items-center justify-center gap-4 mt-2">
              <button className="text-xs text-ink-primary/60 dark:text-white/60 hover:text-ink-primary dark:hover:text-white transition-colors flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Read on Mobile
              </button>
              <span className="text-ink-primary/30 dark:text-white/30">•</span>
              <button className="text-xs text-ink-primary/60 dark:text-white/60 hover:text-ink-primary dark:hover:text-white transition-colors flex items-center gap-1">
                <Headphones className="w-3 h-3" />
                Listen on Mobile
              </button>
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div className="py-3 text-center flex-shrink-0 min-h-[44px] flex items-center justify-center pointer-events-none z-30">
          <p className="text-ink-primary/50 dark:text-white/50 text-xs dark:[text-shadow:0_1px_4px_rgba(0,0,0,0.3)]">@middleofallthings</p>
        </div>

        {/* Navigation Controls */}
        {isActive && (
          <div className="absolute inset-0 z-20 flex items-center justify-between p-4 pointer-events-none">
            <button
              onClick={onPrevious}
              className="pointer-events-auto p-2 rounded-full glass-subtle hover:bg-white/20 transition-colors"
              aria-label="Previous card"
            >
              <ArrowLeft className="w-5 h-5 text-ink-primary dark:text-paper-light" />
            </button>
            <div className="flex-1"></div>
            <button
              onClick={onNext}
              className="pointer-events-auto p-2 rounded-full glass-subtle hover:bg-white/20 transition-colors"
              aria-label="Next card"
            >
              <ArrowRight className="w-5 h-5 text-ink-primary dark:text-paper-light" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const DesktopLandingPage: React.FC = () => {
  const [cards, setCards] = useState<QuoteCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const autoRotateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load content and generate quote cards
  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      try {
        const [allChapters, allMeditations] = await Promise.all([
          loadBookChapters(),
          loadMeditations()
        ]);

        if (cancelled) return;

        const allCards = generateQuoteCards(
          allChapters,
          allMeditations,
          [] // Empty array for stories
        );
        
        setCards(allCards);
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

  // Auto-rotate cards
  useEffect(() => {
    if (cards.length === 0 || isPaused) {
      if (autoRotateTimerRef.current) {
        clearInterval(autoRotateTimerRef.current);
        autoRotateTimerRef.current = null;
      }
      return;
    }

    // Check for reduce motion preference
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        return; // Don't auto-rotate if user prefers reduced motion
      }
    }

    autoRotateTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, AUTO_ROTATE_INTERVAL);

    return () => {
      if (autoRotateTimerRef.current) {
        clearInterval(autoRotateTimerRef.current);
        autoRotateTimerRef.current = null;
      }
    };
  }, [cards.length, isPaused]);

  const handleNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    setIsPaused(true); // Pause on manual navigation
  }, [cards.length]);

  const handlePrevious = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    setIsPaused(true); // Pause on manual navigation
  }, [cards.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious]);

  const currentCard = cards[currentIndex];
  const nextCard = cards[(currentIndex + 1) % cards.length];

  return (
    <div className="min-h-screen bg-paper-light dark:bg-slate-950/75 relative overflow-x-hidden">
      {/* Background Video */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-70 dark:opacity-100"
        >
          <source src="/media/bg-desktop.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-paper-light/50 dark:bg-slate-950/75"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
          <div className="max-w-6xl w-full">
            {/* Hero Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h1 className="text-5xl md:text-6xl font-serif text-ink-primary dark:text-paper-light mb-4">
                In the Middle of All Things
              </h1>
              <p className="text-xl text-ink-secondary dark:text-ink-muted">
                A philosophical companion for the living axis.
              </p>
            </motion.div>

           
            {/* Quote Card */}
            <div className="relative w-full max-w-2xl mx-auto mb-12" style={{ height: '600px' }}>
              {isLoading ? (
                <QuoteCardSkeleton />
              ) : currentCard ? (
                <>
                  {/* Next card preview (underneath) */}
                  {nextCard && (
                    <div
                      className="absolute inset-0"
                      style={{
                        transform: 'scale(0.95) translateY(24px)',
                        opacity: 0.3,
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
                    <DesktopQuoteCard
                      card={currentCard}
                      isActive={true}
                      onNext={handleNext}
                      onPrevious={handlePrevious}
                    />
                  </div>
                </>
              ) : null}
            </div>

            {/* Card Label - Subtle */}
            {currentCard && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xs text-ink-secondary/70 dark:text-ink-muted/70 mb-6"
              >
                {currentCard.source.type === 'meditation' ? 'Meditation' : 
                 currentCard.source.type === 'book' ? 'Chapter' : 'Story'} • 2 min • Read / Listen on mobile
              </motion.p>
            )}

            {/* Primary CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            >
              <GlassButton onClick={() => setShowQRCode(true)}>
                Scan to View
              </GlassButton>
              <GlassButton onClick={() => setShowEmailForm(true)}>
                <Mail className="w-4 h-4" />
                Send Me the Link
              </GlassButton>
            </motion.div>

            {/* Helper line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-sm text-ink-secondary dark:text-ink-muted mt-4"
            >
              Best experienced on your phone. This desktop page is an introduction, not the app.
            </motion.p>
          </div>
        </section>

        {/* What It Is Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-subtle rounded-3xl p-12"
            >
              <h2 className="text-3xl font-serif text-ink-primary dark:text-paper-light mb-6">
                WHAT IT IS
              </h2>
              <div className="space-y-4 text-lg text-ink-secondary dark:text-ink-muted leading-relaxed">
                <p className="font-medium">
                  A book you enter, not just read.
                </p>
                <p>
                  Guided meditations, short essays, and quiet stories designed to return you to yourself. Nothing to perform. Nothing to chase. Just a rhythm you can carry through the day.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Inside The App Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-serif text-ink-primary dark:text-paper-light mb-12 text-center"
            >
              INSIDE THE APP
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Scale, title: 'Meditations', desc: 'Gentle practices to bring awareness back to body, breath, and presence.' },
                { icon: BookOpen, title: 'The Book', desc: 'Read In the Middle of All Things in its intended form – four parts, one living thread.' },
                { icon: Scroll, title: 'Stories', desc: 'Philosophical tales that illuminate the deeper questions of being.' },
                { icon: Headphones, title: 'Audio', desc: 'Every chapter and meditation voiced with a calm, resonant tone.' },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass-subtle rounded-2xl p-6"
                >
                  <item.icon className="w-8 h-8 text-ink-primary dark:text-paper-light mb-4" />
                  <h3 className="text-xl font-semibold text-ink-primary dark:text-paper-light mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-ink-secondary dark:text-ink-muted leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Built For Presence Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-subtle rounded-3xl p-12 text-center"
            >
              <h2 className="text-3xl font-serif text-ink-primary dark:text-paper-light mb-6">
                BUILT FOR PRESENCE
              </h2>
              <div className="space-y-4 text-lg text-ink-secondary dark:text-ink-muted leading-relaxed">
                <p>
                  No feeds. No noise. No keeping up.<br />
                  Just a space to slow down, listen inward, and move from alignment.
                </p>
                <p className="text-base">
                  The experience is mobile-only – made for the intimacy of your hand and the pauses between moments.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Open On Mobile Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-subtle rounded-3xl p-12"
            >
              <h2 className="text-3xl font-serif text-ink-primary dark:text-paper-light mb-8 text-center">
                OPEN ON MOBILE
              </h2>
              <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                <div className="flex-1 flex flex-col items-center">
                  <h3 className="text-lg font-medium text-ink-primary dark:text-paper-light mb-4">
                    Scan to open
                  </h3>
                  <QRCode size={200} />
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-lg text-ink-secondary dark:text-ink-muted text-center md:text-left">
                    Or visit <span className="font-medium">middleofallthings.com</span> on your phone.
                  </p>
                  <p className="text-base text-ink-secondary dark:text-ink-muted text-center md:text-left">
                    Prefer a reminder? Email me the link.
                  </p>
                  <div className="flex justify-center md:justify-start">
                    <EmailLinkButton />
                  </div>
                  <p className="text-sm text-ink-secondary dark:text-ink-muted text-center md:text-left">
                    If the app doesn't open automatically, choose "Add to Home Screen" to keep it close.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* From The Creator Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-subtle rounded-3xl p-12 text-center"
            >
              <h2 className="text-3xl font-serif text-ink-primary dark:text-paper-light mb-6">
                FROM THE CREATOR
              </h2>
              <blockquote className="text-xl text-ink-secondary dark:text-ink-muted leading-relaxed italic mb-4">
                "This isn't an escape from life. It's a way of meeting life – steadily, from the middle."
              </blockquote>
              <p className="text-base text-ink-primary dark:text-paper-light font-medium">
                – Leantonio Nelson
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-subtle rounded-3xl p-12"
            >
              <h2 className="text-3xl font-serif text-ink-primary dark:text-paper-light mb-8 text-center">
                FAQ (SHORT + CALM)
              </h2>
              <div className="space-y-6">
                {[
                  {
                    q: 'Why mobile-only?',
                    a: "The design rests on touch, pacing, and presence. It's made to be carried, not browsed."
                  },
                  {
                    q: 'Do I need an account?',
                    a: 'No. You can begin reading and listening immediately.'
                  },
                  {
                    q: 'Is it free?',
                    a: 'The core experience is free. Optional extras may be added later.'
                  },
                ].map((faq, index) => (
                  <motion.div
                    key={faq.q}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="border-b border-ink-muted/20 dark:border-paper-light/20 pb-6 last:border-0 last:pb-0"
                  >
                    <h3 className="text-lg font-semibold text-ink-primary dark:text-paper-light mb-2">
                      {faq.q}
                    </h3>
                    <p className="text-base text-ink-secondary dark:text-ink-muted">
                      {faq.a}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm text-ink-secondary dark:text-ink-muted"
          >
            Find the middle. Live from it.
          </motion.p>
        </footer>
      </main>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRCode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
              onClick={() => setShowQRCode(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-subtle rounded-3xl p-8 max-w-md w-full"
              >
                <h3 className="text-2xl font-serif text-ink-primary dark:text-paper-light mb-6 text-center">
                  Scan to Open
                </h3>
                <QRCode size={250} />
                <button
                  onClick={() => setShowQRCode(false)}
                  className="mt-6 w-full py-3 glass-subtle rounded-full text-ink-primary dark:text-paper-light hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Email Form Modal */}
      <AnimatePresence>
        {showEmailForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
              onClick={() => setShowEmailForm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-subtle rounded-3xl p-8 max-w-md w-full"
              >
                <h3 className="text-2xl font-serif text-ink-primary dark:text-paper-light mb-6 text-center">
                  Send Me the Link
                </h3>
                <EmailLinkButton />
                <button
                  onClick={() => setShowEmailForm(false)}
                  className="mt-6 w-full py-3 glass-subtle rounded-full text-ink-primary dark:text-paper-light hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesktopLandingPage;


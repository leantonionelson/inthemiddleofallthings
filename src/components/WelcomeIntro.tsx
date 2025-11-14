import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { useDesktopDetection } from '../hooks/useDesktopDetection';

interface WelcomeIntroProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to render text with markdown-style formatting
const renderFormattedText = (text: string): React.ReactNode => {
  // First handle bold (**text**), then italics (*text*)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Look for bold first (**text**)
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Look for italics (*text*)
    const italicMatch = remaining.match(/\*([^*]+)\*/);
    
    // Determine which comes first
    let match: RegExpMatchArray | null = null;
    let isBold = false;
    
    if (boldMatch && italicMatch) {
      if (boldMatch.index! < italicMatch.index!) {
        match = boldMatch;
        isBold = true;
      } else {
        match = italicMatch;
        isBold = false;
      }
    } else if (boldMatch) {
      match = boldMatch;
      isBold = true;
    } else if (italicMatch) {
      match = italicMatch;
      isBold = false;
    }

    if (match) {
      // Add text before the match
      if (match.index! > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, match.index!)}</span>);
      }
      // Add the formatted text
      if (isBold) {
        parts.push(<strong key={key++} className="text-ink-primary dark:text-paper-light">{match[1]}</strong>);
      } else {
        parts.push(<em key={key++} className="italic">{match[1]}</em>);
      }
      // Continue with remaining text
      remaining = remaining.substring(match.index! + match[0].length);
    } else {
      // No more matches, add remaining text
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return <>{parts}</>;
};

const WelcomeIntro: React.FC<WelcomeIntroProps> = ({ isOpen, onClose }) => {
  const isDesktopViewport = useDesktopDetection();
  const [isDesktopVideo, setIsDesktopVideo] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if desktop video should be used based on window width
    const checkDesktop = () => {
      setIsDesktopVideo(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Track scroll progress for continue button fade-in
  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current) return;

    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 1;
      setScrollProgress(progress);
    };

    const container = scrollContainerRef.current;
    container.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, isExpanded]);

  const handleClose = () => {
    localStorage.setItem('welcomeIntroShown', 'true');
    onClose();
  };

  const handleContinue = () => {
    localStorage.setItem('welcomeIntroShown', 'true');
    onClose();
  };

  const initialText = `### Welcome

Your mind is the lens through which you receive and interpret the universe. This lens is shaped by your "hardcoding" – your beliefs, your experiences, and the patterns passed down to you.

When we get stuck in rigid dogma or fear, our lens can "atrophy." We "weight the universe" in one direction for too long, and we lose our connection to the whole pattern. We might live a life of hate, and in that state, not even be able to recognize love when it is given.

This app is a tool for practice. It is not a set of answers, but a way to help you rebalance your lens.`;

  const expandedText = `The writings and meditations here are designed to guide you back to the "middle." The middle is not a passive compromise; it is the strongest, most balanced vantage point. It is the active, "flow" state from which you can "receive and interpret all that is."

This is the path of **synthesis**. It is a journey of re-evaluating your old beliefs and integrating them with new perspectives to create a "balance of both sides of the coin."

This practice will show you two ways to see the divine pattern of existence:

1.  **Looking In:** To do the work to see your *own* consciousness as a "complete and fully shaped" piece of the fractal.
2.  **Looking Out:** To look at others and see that same divine pattern in "the many faces of God" all around you.

The purpose is not to "fix" you, but to help you see the pattern. The goal is to live a life "lead with love." Because to have your lens fully balanced, whole, and capable of seeing all of reality is to have God, or Existence itself, fully and completely within you.

This text is a mirror. Don't just read it. Commune with it. Use it to build the consciousness you wish to inhabit.`;

  // Parse the initial text into sections
  const parseSections = (text: string) => {
    const rawSections = text.split(/\n\n+/).filter(section => section.trim());
    const sections: Array<{ type: 'heading' | 'paragraph' | 'list'; content: string }> = [];
    
    rawSections.forEach((section) => {
      if (section.startsWith('### ')) {
        sections.push({ type: 'heading', content: section });
      } else if (/^\d+\.\s+\*\*/.test(section)) {
        sections.push({ type: 'list', content: section });
      } else {
        sections.push({ type: 'paragraph', content: section });
      }
    });
    
    return sections;
  };

  const initialSections = parseSections(initialText);
  const expandedSections = parseSections(expandedText);

  // Don't render on desktop
  if (isDesktopViewport) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] overflow-hidden bg-paper-light dark:bg-slate-950/75"
        >
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
              <source src={isDesktopVideo ? "/media/bg-desktop.mp4" : "/media/bg.mp4"} type="video/mp4" />
            </video>
            {/* Glassy overlay */}
            <div className="absolute inset-0 glass-subtle"></div>
            <div className="absolute inset-0 bg-paper-light/50 dark:bg-slate-950/75"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Close Button - Top Right */}
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={handleClose}
                className="relative flex items-center gap-2 px-4 py-2 rounded-full font-medium shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="absolute inset-0 glass-subtle rounded-full" />
                <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                <div className="relative z-10 flex items-center gap-2 text-ink-primary dark:text-paper-light">
                  <X className="w-4 h-4" />
                  <span className="text-sm">Close</span>
                </div>
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-6 py-20"
            >
              <div className="max-w-3xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="space-y-6 text-ink-primary dark:text-paper-light text-left"
                >
                  {/* Initial sections */}
                  {initialSections.map((section, index) => {
                    // Handle heading
                    if (section.type === 'heading') {
                      return (
                        <h2
                          key={index}
                          className="text-3xl md:text-4xl font-serif text-ink-primary dark:text-paper-light mb-6 text-left"
                        >
                          {section.content.replace('### ', '')}
                        </h2>
                      );
                    }

                    // Handle numbered list items
                    if (section.type === 'list') {
                      const match = section.content.match(/^\d+\.\s+\*\*(.+?)\*\*:\s*(.+)/);
                      if (match) {
                        return (
                          <div key={index} className="pl-4 text-left">
                            <p className="text-lg md:text-xl text-ink-secondary dark:text-ink-muted leading-relaxed">
                              <strong className="text-ink-primary dark:text-paper-light">{match[1]}</strong>:{' '}
                              {renderFormattedText(match[2])}
                            </p>
                          </div>
                        );
                      }
                    }

                    // Regular paragraphs
                    return (
                      <p
                        key={index}
                        className="text-lg md:text-xl text-ink-secondary dark:text-ink-muted leading-relaxed text-left"
                      >
                        {renderFormattedText(section.content)}
                      </p>
                    );
                  })}

                  {/* Read More Button */}
                  {!isExpanded && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => setIsExpanded(true)}
                      className="flex items-center gap-2 text-lg md:text-xl text-ink-primary dark:text-paper-light hover:opacity-80 transition-opacity mt-6"
                    >
                      <span>Read more</span>
                      <ChevronDown className="w-5 h-5" />
                    </motion.button>
                  )}

                  {/* Expanded sections */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-6 text-left"
                      >
                        {expandedSections.map((section, index) => {
                          // Handle numbered list items
                          if (section.type === 'list') {
                            const match = section.content.match(/^\d+\.\s+\*\*(.+?)\*\*:\s*(.+)/);
                            if (match) {
                              return (
                                <div key={`expanded-${index}`} className="pl-4 text-left">
                                  <p className="text-lg md:text-xl text-ink-secondary dark:text-ink-muted leading-relaxed">
                                    <strong className="text-ink-primary dark:text-paper-light">{match[1]}</strong>:{' '}
                                    {renderFormattedText(match[2])}
                                  </p>
                                </div>
                              );
                            }
                          }

                          // Regular paragraphs
                          return (
                            <p
                              key={`expanded-${index}`}
                              className="text-lg md:text-xl text-ink-secondary dark:text-ink-muted leading-relaxed text-left"
                            >
                              {renderFormattedText(section.content)}
                            </p>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>

            {/* Continue Button - Bottom Right - Fades in as user scrolls to bottom */}
            <div className="absolute bottom-4 right-4 z-20">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: scrollProgress >= 0.95 ? 1 : 0,
                  y: scrollProgress >= 0.95 ? 0 : 20
                }}
                transition={{ duration: 0.3 }}
                style={{ pointerEvents: scrollProgress >= 0.95 ? 'auto' : 'none' }}
                onClick={handleContinue}
                className="relative flex items-center gap-2 px-4 py-2 rounded-full font-medium shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="absolute inset-0 glass-subtle rounded-full" />
                <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                <div className="relative z-10 flex items-center gap-2 text-ink-primary dark:text-paper-light">
                  <span className="text-sm">Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeIntro;


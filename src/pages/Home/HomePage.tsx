import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppRoute, BookChapter } from '../../types';
import { loadBookChapters, fallbackChapters } from '../../data/bookContent';
import { Symbol } from '../../components/Symbol';
import { generateSymbol, GeneratedSymbol } from '../../services/symbolGenerator';
import CleanLayout from '../../components/CleanLayout';
import StandardHeader from '../../components/StandardHeader';

interface HomePageProps {
  onOpenAI: () => void;
}

// Define book parts structure
const bookParts = [
  { id: 'introduction', title: 'Intro', chapters: [] as BookChapter[] },
  { id: 'part-1', title: 'Book I', chapters: [] as BookChapter[] },
  { id: 'part-2', title: 'Book II', chapters: [] as BookChapter[] },
  { id: 'part-3', title: 'Book III', chapters: [] as BookChapter[] },
  { id: 'part-4', title: 'Book IV', chapters: [] as BookChapter[] },
  { id: 'outro', title: 'Outro', chapters: [] as BookChapter[] }
];

const HomePage: React.FC<HomePageProps> = ({ onOpenAI }) => {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [userSymbol, setUserSymbol] = useState<GeneratedSymbol | null>(null);
  const [userProgress, setUserProgress] = useState({ currentPart: 0, currentChapter: 1, hasStarted: false });
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  // Load chapters from MDX files
  useEffect(() => {
    const loadChapters = async () => {
      try {
        setIsLoading(true);
        const loadedChapters = await loadBookChapters();
        setChapters(loadedChapters);
      } catch {
        console.error('Error loading chapters');
        // Fallback to hardcoded chapters if loading fails
        setChapters(fallbackChapters);
      } finally {
        setIsLoading(false);
      }
    };

    loadChapters();
  }, []);

  // Organize chapters by parts and load progress
  useEffect(() => {
    if (chapters.length === 0) return;

    // Clear existing chapters
    bookParts.forEach(part => part.chapters = []);

    chapters.forEach(chapter => {
      if (chapter.part === 'Introduction') {
        bookParts[0].chapters.push(chapter);
      } else if (chapter.part?.includes('Part I')) {
        bookParts[1].chapters.push(chapter);
      } else if (chapter.part?.includes('Part II')) {
        bookParts[2].chapters.push(chapter);
      } else if (chapter.part?.includes('Part III')) {
        bookParts[3].chapters.push(chapter);
      } else if (chapter.part?.includes('Part IV')) {
        bookParts[4].chapters.push(chapter);
      } else if (chapter.part === 'Outro') {
        bookParts[5].chapters.push(chapter);
      }
    });

    // Load current chapter index from reader
    const savedChapterIndex = localStorage.getItem('currentChapterIndex');
    if (savedChapterIndex) {
      const currentIndex = parseInt(savedChapterIndex, 10);
      if (currentIndex >= 0 && currentIndex < chapters.length) {
        const currentChapter = chapters[currentIndex];
        
        // Find which part this chapter belongs to
        let partIndex = 0;
        if (currentChapter.part === 'Introduction') {
          partIndex = 0;
        } else if (currentChapter.part?.includes('Part I')) {
          partIndex = 1;
        } else if (currentChapter.part?.includes('Part II')) {
          partIndex = 2;
        } else if (currentChapter.part?.includes('Part III')) {
          partIndex = 3;
        } else if (currentChapter.part?.includes('Part IV')) {
          partIndex = 4;
        } else if (currentChapter.part === 'Outro') {
          partIndex = 5;
        }
        
        // Update progress state
        const newProgress = {
          currentPart: partIndex,
          currentChapter: currentChapter.chapterNumber || 1,
          hasStarted: true
        };
        setUserProgress(newProgress);
        setCurrentPartIndex(partIndex);
      }
    } else {
      // Load user progress from localStorage as fallback
      const savedProgress = localStorage.getItem('userProgress');
      if (savedProgress) {
        try {
          const progressData = JSON.parse(savedProgress);
          setUserProgress(progressData);
          setCurrentPartIndex(progressData.currentPart);
        } catch {
          console.error('Error loading user progress');
        }
      }
    }
  }, [chapters]);

  const currentPart = bookParts[currentPartIndex];
  
  // Get the actual current chapter from the reader's saved index
  const savedChapterIndex = localStorage.getItem('currentChapterIndex');
  const actualCurrentChapter = savedChapterIndex && chapters.length > 0 
    ? chapters[parseInt(savedChapterIndex, 10)] 
    : null;
  
  const currentChapter = actualCurrentChapter || currentPart.chapters.find(ch => ch.chapterNumber === userProgress.currentChapter) || currentPart.chapters[0];
  
  // Calculate progress based on actual current chapter index from reader
  const totalChapters = chapters.length;
  const currentChapterIndex = savedChapterIndex ? parseInt(savedChapterIndex, 10) : 0;
  const completedChapters = Math.max(0, currentChapterIndex);
  const progress = totalChapters > 0 ? Math.min((completedChapters / totalChapters) * 100, 100) : 0;

  useEffect(() => {
    // Load user's symbol from localStorage
    const savedSymbol = localStorage.getItem('userSymbol');
    if (savedSymbol) {
      try {
        const symbolData = JSON.parse(savedSymbol);
        setUserSymbol(symbolData);
      } catch {
        // If parsing fails, generate a new symbol
        const newSymbol = generateSymbol('home');
        setUserSymbol(newSymbol);
      }
    } else {
      // Generate a new symbol if none exists
      const newSymbol = generateSymbol('home');
      setUserSymbol(newSymbol);
    }
  }, []);

  const handleReadChapter = () => {
    // Since this component only renders when user is authenticated and onboarded,
    // we can directly navigate to the reader
    const newProgress = { 
      ...userProgress, 
      hasStarted: true,
      currentPart: currentPartIndex,
      currentChapter: currentChapter?.chapterNumber || 1
    };
    setUserProgress(newProgress);
    localStorage.setItem('userProgress', JSON.stringify(newProgress));
    navigate(AppRoute.READER);
  };



  const handleNextPart = () => {
    if (currentPartIndex < bookParts.length - 1) {
      setCurrentPartIndex(prev => prev + 1);
    }
  };

  const handlePreviousPart = () => {
    if (currentPartIndex > 0) {
      setCurrentPartIndex(prev => prev - 1);
    }
  };

  const getReadButtonText = () => {
    if (!userProgress.hasStarted) {
      return currentPartIndex === 1 ? 'Begin Book I' : `Begin ${currentPart.title}`;
    } else {
      if (currentPartIndex === 0) {
        return 'Continue Intro';
      } else {
        return `Continue ${currentPart.title}, Chapter ${userProgress.currentChapter}`;
      }
    }
  };

  const getChapterDisplayText = () => {
    if (currentPartIndex === 0 || currentPartIndex === 5) {
      return currentPart.title;
          } else {
        const chapterCount = currentPart.chapters.length;
        return `${currentPart.title}, Chapter ${userProgress.currentChapter} of ${chapterCount}`;
      }
  };

  const getCurrentDescription = () => {
    if (!currentChapter) {
      return `Explore the themes and ideas of ${currentPart.title}`;
    }
    
    // Return first few sentences of the chapter content as preview
    const content = currentChapter.content || '';
    const preview = content.split('.').slice(0, 2).join('.') + '.';
    return preview.length > 200 ? preview.substring(0, 200) + '...' : preview;
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper-light dark:bg-paper-dark paper-texture flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-primary dark:border-paper-light mx-auto mb-4"></div>
          <p className="text-ink-secondary dark:text-ink-muted">Loading book content...</p>
        </div>
      </div>
    );
  }

  return (
                     <CleanLayout
         currentPage="home"
         onRead={handleReadChapter}
         isReading={false}
         onOpenAI={onOpenAI}
       >
      <StandardHeader
        title="In the Middle of All Things"
        showSettingsButton={true}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-8 pt-20 pb-24">
        {/* Living Axis Symbol */}
        <motion.div 
          className="w-32 h-32 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          {userSymbol ? (
            <Symbol 
              svgPath={userSymbol.svgPath} 
              size={128}
              isAnimating={true}
              metadata={userSymbol.metadata}
              colorScheme={userSymbol.colorScheme}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full symbol-glow">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="30" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className="text-ink-primary dark:text-paper-light animate-breathing"
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="20" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1"
                  className="text-ink-primary dark:text-paper-light opacity-60"
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="10" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="0.5"
                  className="text-ink-primary dark:text-paper-light opacity-40"
                />
              </svg>
            </div>
          )}
        </motion.div>

        {/* Part Navigation */}
        <motion.div 
          className="flex justify-between w-full max-w-md items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handlePreviousPart}
            disabled={currentPartIndex === 0}
            className="p-2 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-lg font-medium text-ink-primary dark:text-paper-light">
            {currentPart.title}
          </span>

          <button
            onClick={handleNextPart}
            disabled={currentPartIndex === bookParts.length - 1}
            className="p-2 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>

        {/* Chapter Info */}
        <motion.div 
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-ink-muted mb-2">
            {getChapterDisplayText()}
          </p>
          <h2 className="text-2xl font-serif text-ink-primary dark:text-paper-light mb-4">
            {currentChapter?.title || currentPart.title}
          </h2>
          <p 
            className="text-ink-secondary dark:text-ink-muted font-body leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(getCurrentDescription()) }}
          />
        </motion.div>

        {/* Progress */}
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between text-sm text-ink-muted mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-ink-muted bg-opacity-20 rounded-full h-2">
            <motion.div
              className="bg-ink-primary dark:bg-paper-light h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col space-y-4 w-full max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <button
            onClick={handleReadChapter}
            className="w-full px-8 py-4 bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary font-medium rounded-lg hover:opacity-90 transition-opacity ink-shadow"
          >
            {getReadButtonText()}
          </button>
        </motion.div>
      </div>
    </CleanLayout>
  );
};

export default HomePage; 
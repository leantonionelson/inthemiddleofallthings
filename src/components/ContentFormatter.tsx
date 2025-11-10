import React, { useEffect, useRef } from 'react';

interface ContentFormatterProps {
  content: string;
  fontSize: string;
  currentTime?: number; // Audio playback time in seconds
  duration?: number; // Audio duration in seconds
  isPlaying?: boolean; // Whether audio is currently playing
}

/**
 * Shared content formatter for reader and meditation pages
 * Formats markdown content with proper typography
 * Supports sentence-by-sentence highlighting synchronized with audio
 */
const ContentFormatter: React.FC<ContentFormatterProps> = ({ 
  content, 
  fontSize,
  currentTime = 0,
  duration = 0,
  isPlaying = false
}) => {
  const sentenceRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const readSentencesRef = useRef<Set<number>>(new Set()); // Track which sentences have been read

  // Calculate sentence timings based on text length proportion
  const calculateSentenceTimings = () => {
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    const sentences: { text: string; startTime: number; endTime: number; index: number }[] = [];
    let currentCharIndex = 0;
    let sentenceIndex = 0;

    paragraphs.forEach((paragraph) => {
      const paragraphSentences = paragraph.split(/(?<=[.!?])\s+/).filter(s => s.trim());
      
      paragraphSentences.forEach((sentence) => {
        const sentenceLength = sentence.length;
        const startProportion = currentCharIndex / content.length;
        const endProportion = (currentCharIndex + sentenceLength) / content.length;
        
        sentences.push({
          text: sentence,
          startTime: duration * startProportion,
          endTime: duration * endProportion,
          index: sentenceIndex++
        });
        
        currentCharIndex += sentenceLength + 1; // +1 for space
      });
      
      currentCharIndex += 2; // +2 for paragraph break
    });

    return sentences;
  };

  const sentenceTimings = calculateSentenceTimings();

  // Find which sentence should be highlighted based on currentTime
  const getActiveSentenceIndex = () => {
    if (!isPlaying || duration === 0) return -1;
    
    for (let i = 0; i < sentenceTimings.length; i++) {
      const timing = sentenceTimings[i];
      if (currentTime >= timing.startTime && currentTime < timing.endTime) {
        return i;
      }
    }
    
    // If we're past the last sentence, highlight the last one
    if (currentTime >= sentenceTimings[sentenceTimings.length - 1]?.endTime) {
      return sentenceTimings.length - 1;
    }
    
    return -1;
  };

  const activeSentenceIndex = getActiveSentenceIndex();

  // Mark sentences as read when they've been played
  useEffect(() => {
    if (activeSentenceIndex >= 0 && isPlaying) {
      // Mark current and all previous sentences as read
      for (let i = 0; i <= activeSentenceIndex; i++) {
        readSentencesRef.current.add(i);
      }
    }
  }, [activeSentenceIndex, isPlaying]);

  // Scroll to highlighted sentence
  useEffect(() => {
    if (activeSentenceIndex >= 0 && isPlaying) {
      const sentenceElement = sentenceRefs.current.get(activeSentenceIndex);
      if (sentenceElement) {
        // Scroll into view with smooth behavior
        sentenceElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }, [activeSentenceIndex, isPlaying]);

  // Reset read sentences when content changes (new chapter/meditation/story)
  useEffect(() => {
    readSentencesRef.current.clear();
  }, [content]);

  let currentSentenceIndex = 0;

  return (
    <>
      {content.split('\n\n').map((paragraph, paragraphIndex) => {
        if (!paragraph.trim()) return null; // Skip empty paragraphs
        
        // Split paragraph into sentences
        const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        
        return (
          <p key={paragraphIndex} className={`mb-6 leading-8 text-left text-ink-primary dark:text-paper-light ${
            fontSize === 'sm' ? 'text-sm' : 
            fontSize === 'base' ? 'text-base' : 
            fontSize === 'lg' ? 'text-lg' : 
            'text-xl'
          }`}>
            {sentences.map((sentence, sentenceIndex) => {
              const globalSentenceIndex = currentSentenceIndex++;
              const isRead = readSentencesRef.current.has(globalSentenceIndex);
              
              // Apply markdown formatting to the sentence
              const formattedSentence = sentence
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
              
              return (
                <span
                  key={sentenceIndex}
                  ref={(el) => {
                    if (el) {
                      sentenceRefs.current.set(globalSentenceIndex, el);
                    } else {
                      sentenceRefs.current.delete(globalSentenceIndex);
                    }
                  }}
                  className={`transition-all duration-300 ${
                    isRead
                      ? 'underline decoration-blue-500 dark:decoration-blue-400 underline-offset-2'
                      : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: formattedSentence + (sentenceIndex < sentences.length - 1 ? ' ' : '') }}
                />
              );
            })}
          </p>
        );
      }).filter(Boolean)} {/* Remove null paragraphs */}
    </>
  );
};

export default ContentFormatter;

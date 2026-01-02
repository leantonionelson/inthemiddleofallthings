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

  // Check if a block is a heading (checks first line only)
  const isHeading = (block: string): { level: number; text: string; remainingContent?: string } | null => {
    const lines = block.split('\n');
    const firstLine = lines[0].trim();
    const match = firstLine.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const remainingLines = lines.slice(1).join('\n').trim();
      return { 
        level: match[1].length, 
        text: match[2],
        remainingContent: remainingLines || undefined
      };
    }
    return null;
  };

  // Check if a block is a horizontal rule
  const isHorizontalRule = (block: string): boolean => {
    const trimmed = block.trim();
    return /^---+$/.test(trimmed) || /^---+$/.test(trimmed);
  };

  // Check if a block contains bullet points
  const isListBlock = (block: string): boolean => {
    const lines = block.split('\n').filter(line => line.trim());
    return lines.length > 0 && lines.every(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('- ') || trimmed.startsWith('– ');
    });
  };

  // Parse list items from a block (handles both - and –)
  const parseListItems = (block: string): string[] => {
    return block.split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('- ') || line.startsWith('– '))
      .map(line => line.replace(/^[-–]\s+/, '').trim()); // Remove '- ' or '– ' prefix
  };

  // Apply markdown formatting (bold, italic)
  const applyMarkdownFormatting = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  return (
    <>
      {content.split('\n\n').map((paragraph, paragraphIndex) => {
        if (!paragraph.trim()) return null; // Skip empty paragraphs
        
        const trimmedParagraph = paragraph.trim();
        
        // Check for horizontal rule
        if (isHorizontalRule(trimmedParagraph)) {
          return (
            <hr 
              key={paragraphIndex} 
              className="my-8 border-t border-ink-primary/20 dark:border-paper-light/20"
            />
          );
        }
        
        // Check for heading
        const heading = isHeading(trimmedParagraph);
        if (heading) {
          const HeadingTag = `h${heading.level}` as keyof JSX.IntrinsicElements;
          const headingSizes = {
            1: 'text-3xl',
            2: 'text-2xl',
            3: 'text-xl',
            4: 'text-lg',
            5: 'text-base',
            6: 'text-sm'
          };
          
          return (
            <React.Fragment key={paragraphIndex}>
              <HeadingTag
                className={`${headingSizes[heading.level as keyof typeof headingSizes] || 'text-xl'} font-semibold mb-4 mt-8 text-left text-ink-primary dark:text-paper-light ${
                  paragraphIndex === 0 ? 'mt-0' : ''
                }`}
                dangerouslySetInnerHTML={{ __html: applyMarkdownFormatting(heading.text) }}
              />
              {heading.remainingContent && (
                <p className={`mb-6 leading-8 text-left text-ink-primary dark:text-paper-light ${
                  fontSize === 'sm' ? 'text-sm' : 
                  fontSize === 'base' ? 'text-base' : 
                  fontSize === 'lg' ? 'text-lg' : 
                  'text-xl'
                }`}>
                  {heading.remainingContent.split(/(?<=[.!?])\s+/).filter(s => s.trim()).map((sentence, sentenceIndex) => {
                    const globalSentenceIndex = currentSentenceIndex++;
                    const isRead = readSentencesRef.current.has(globalSentenceIndex);
                    const formattedSentence = applyMarkdownFormatting(sentence);
                    
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
                        dangerouslySetInnerHTML={{ __html: formattedSentence + (sentenceIndex < heading.remainingContent!.split(/(?<=[.!?])\s+/).filter(s => s.trim()).length - 1 ? ' ' : '') }}
                      />
                    );
                  })}
                </p>
              )}
            </React.Fragment>
          );
        }
        
        // Check if this is a list block
        if (isListBlock(trimmedParagraph)) {
          const listItems = parseListItems(trimmedParagraph);
          
          return (
            <ul 
              key={paragraphIndex} 
              className={`mt-0 mb-6 list-disc ml-6 space-y-3 text-left text-ink-primary dark:text-paper-light ${
                fontSize === 'sm' ? 'text-sm' : 
                fontSize === 'base' ? 'text-base' : 
                fontSize === 'lg' ? 'text-lg' : 
                'text-xl'
              }`}
            >
              {listItems.map((item, itemIndex) => {
                const globalSentenceIndex = currentSentenceIndex++;
                const isRead = readSentencesRef.current.has(globalSentenceIndex);
                
                // Apply markdown formatting to the list item
                const formattedItem = applyMarkdownFormatting(item);
                
                return (
                  <li
                    key={itemIndex}
                    ref={(el) => {
                      if (el) {
                        sentenceRefs.current.set(globalSentenceIndex, el);
                      } else {
                        sentenceRefs.current.delete(globalSentenceIndex);
                      }
                    }}
                    className={`leading-8 text-left transition-all duration-300 ${
                      isRead
                        ? 'underline decoration-blue-500 dark:decoration-blue-400 underline-offset-2'
                        : ''
                    }`}
                    dangerouslySetInnerHTML={{ __html: formattedItem }}
                  />
                );
              })}
            </ul>
          );
        }
        
        // Regular paragraph handling
        // Split paragraph into sentences
        const sentences = trimmedParagraph.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        
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
              const formattedSentence = applyMarkdownFormatting(sentence);
              
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

import React from 'react';

interface ContentFormatterProps {
  content: string;
  highlightedProgress: number;
  fontSize: string;
}

/**
 * Shared content formatter for reader and meditation pages
 * Provides line-by-line highlighting synced with audio playback
 */
const ContentFormatter: React.FC<ContentFormatterProps> = ({ 
  content, 
  highlightedProgress, 
  fontSize 
}) => {
  // Clean the content for consistent character counting
  const cleanContent = content
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Split content into lines for line-by-line highlighting
  const lines = cleanContent.split(/[.!?]+\s+/).filter(line => line.trim().length > 10); // Split by sentences
  const totalLines = lines.length;
  const targetLineIndex = Math.floor(highlightedProgress * totalLines);

  let currentLineIndex = 0;
  
  return (
    <>
      {content.split('\n\n').map((paragraph, paragraphIndex) => {
        if (!paragraph.trim()) return null; // Skip empty paragraphs
        
        // Split paragraph into sentences for better highlighting granularity
        const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        
        return (
          <p key={paragraphIndex} className={`mb-6 leading-8 lg:leading-10 text-ink-primary dark:text-paper-light ${
            fontSize === 'sm' ? 'text-sm lg:text-base' : 
            fontSize === 'base' ? 'text-base lg:text-lg' : 
            fontSize === 'lg' ? 'text-lg lg:text-xl' : 
            'text-xl lg:text-2xl'
          }`}>
            {sentences.map((sentence, sentenceIndex) => {
              const shouldHighlight = currentLineIndex <= targetLineIndex && highlightedProgress > 0;
              currentLineIndex++;
              
              // Apply markdown formatting to the sentence
              const formattedSentence = sentence
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
              
              return (
                <span
                  key={sentenceIndex}
                  className={`${
                    shouldHighlight 
                      ? 'bg-gradient-to-r from-blue-200 to-blue-100 dark:from-blue-800 dark:to-blue-700 bg-opacity-60 dark:bg-opacity-40 rounded-sm px-1 -mx-1 transition-all duration-300 ease-out shadow-sm' 
                      : 'transition-all duration-300 ease-out'
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

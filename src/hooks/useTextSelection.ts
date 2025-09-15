import { useState, useEffect, useRef } from 'react';

interface TextSelectionData {
  text: string;
  range: Range;
  rect: DOMRect;
  isManualSelection?: boolean;
}

interface UseTextSelectionProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export const useTextSelection = ({ contentRef }: UseTextSelectionProps) => {
  const [selectedText, setSelectedText] = useState<TextSelectionData | null>(null);
  const [isTextSelected, setIsTextSelected] = useState(false);

  // Enhanced text selection handling for mobile and desktop
  useEffect(() => {
    let selectionTimeout: NodeJS.Timeout;
    
    const handleSelection = () => {
      // Clear any existing timeout
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
      
      // Debounce selection changes to avoid excessive updates
      selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Only show menu if selection is within our content area
          if (contentRef.current?.contains(range.commonAncestorContainer)) {
            const isManual = selection.toString().trim().length > 0;
            setSelectedText({
              text: selection.toString().trim(),
              range: range.cloneRange(),
              rect,
              isManualSelection: isManual
            });
            setIsTextSelected(isManual);
            
            // Apply enhanced selection styling
            if (isManual) {
              const style = document.createElement('style');
              style.id = 'native-selection-style';
              style.textContent = `
                /* Enhanced selection styling */
                ::selection {
                  background-color: rgba(59, 130, 246, 0.3) !important;
                  color: inherit !important;
                }
                ::-moz-selection {
                  background-color: rgba(59, 130, 246, 0.3) !important;
                  color: inherit !important;
                }
                
                /* Dark mode selection */
                .dark ::selection {
                  background-color: rgba(96, 165, 250, 0.4) !important;
                  color: inherit !important;
                }
                .dark ::-moz-selection {
                  background-color: rgba(96, 165, 250, 0.4) !important;
                  color: inherit !important;
                }
              `;
              document.head.appendChild(style);
            }
          }
        } else {
          setSelectedText(null);
          setIsTextSelected(false);
          // Remove any custom selection styles
          const existingStyle = document.getElementById('native-selection-style');
          if (existingStyle) {
            existingStyle.remove();
          }
        }
      }, 100); // Debounce by 100ms
    };

    // Enhanced touch selection for mobile
    const handleTouchSelection = () => {
      // Allow selection to happen naturally, then handle it
      setTimeout(handleSelection, 150);
    };

    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('touchend', handleTouchSelection, { passive: true });
    
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('touchend', handleTouchSelection);
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
      // Cleanup on unmount
      const existingStyle = document.getElementById('native-selection-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [contentRef]);

  // Clear selection when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedText && !(event.target as Element).closest('.selection-menu')) {
        setSelectedText(null);
        window.getSelection()?.removeAllRanges();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedText]);

  const clearSelection = () => {
    setSelectedText(null);
    setIsTextSelected(false);
    window.getSelection()?.removeAllRanges();
    
    // Remove any custom selection styles
    const existingStyle = document.getElementById('native-selection-style');
    if (existingStyle) {
      existingStyle.remove();
    }
  };

  return {
    selectedText,
    isTextSelected,
    clearSelection
  };
};

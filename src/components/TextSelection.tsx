import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, MessageSquare, X } from 'lucide-react';

interface SelectionPin {
  x: number;
  y: number;
  type: 'start' | 'end';
}

interface TextSelectionProps {
  selectedText: string;
  range: Range;
  rect: DOMRect;
  onSave: (text: string, range: Range) => void;
  onAIChat: (text: string) => void;
  onDismiss: () => void;
}

const TextSelection: React.FC<TextSelectionProps> = ({
  selectedText,
  range,
  rect,
  onSave,
  onAIChat,
  onDismiss
}) => {
  const [pins, setPins] = useState<SelectionPin[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'start' | 'end' | null>(null);
  const [currentRange, setCurrentRange] = useState<Range>(range);
  const [currentText, setCurrentText] = useState(selectedText);
  const selectionRef = useRef<HTMLDivElement>(null);

  // Initialize pins based on selection rect
  useEffect(() => {
    const startPin: SelectionPin = {
      x: rect.left - 12,
      y: rect.top - 8,
      type: 'start'
    };
    
    const endPin: SelectionPin = {
      x: rect.right + 4,
      y: rect.bottom - 8,
      type: 'end'
    };
    
    setPins([startPin, endPin]);
  }, [rect]);

  const handlePinDrag = useCallback((event: React.TouchEvent | React.MouseEvent, pinType: 'start' | 'end') => {
    event.preventDefault();
    setIsDragging(true);
    setDragType(pinType);
    
    const handleMove = (e: TouchEvent | MouseEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      // Find the text node at the new position
      const elementAtPoint = document.elementFromPoint(clientX, clientY);
      if (!elementAtPoint) return;
      
      // Create a new range based on the drag
      const newRange = document.createRange();
      const selection = window.getSelection();
      
      if (selection && selection.rangeCount > 0) {
        const originalRange = currentRange.cloneRange();
        
        try {
          // Update the range based on which pin is being dragged
          if (pinType === 'start') {
            const caretRange = document.caretRangeFromPoint?.(clientX, clientY);
            if (caretRange) {
              newRange.setStart(caretRange.startContainer, caretRange.startOffset);
              newRange.setEnd(originalRange.endContainer, originalRange.endOffset);
            }
          } else {
            const caretRange = document.caretRangeFromPoint?.(clientX, clientY);
            if (caretRange) {
              newRange.setStart(originalRange.startContainer, originalRange.startOffset);
              newRange.setEnd(caretRange.endContainer, caretRange.endOffset);
            }
          }
          
          // Update the selection
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          setCurrentRange(newRange);
          setCurrentText(newRange.toString());
          
          // Update pin positions
          const newRect = newRange.getBoundingClientRect();
          setPins(prevPins => 
            prevPins.map(pin => {
              if (pin.type === 'start') {
                return { ...pin, x: newRect.left - 12, y: newRect.top - 8 };
              } else {
                return { ...pin, x: newRect.right + 4, y: newRect.bottom - 8 };
              }
            })
          );
        } catch (error) {
          console.warn('Error updating selection range:', error);
        }
      }
    };
    
    const handleEnd = () => {
      setIsDragging(false);
      setDragType(null);
      
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  }, [currentRange]);

  const handleSave = () => {
    onSave(currentText, currentRange);
    onDismiss();
  };

  const handleAIChat = () => {
    onAIChat(currentText);
    onDismiss();
  };

  // Position the action menu
  const menuStyle = {
    position: 'fixed' as const,
    left: Math.max(16, Math.min(window.innerWidth - 200, rect.left + (rect.width / 2) - 100)),
    top: rect.bottom + 8,
    zIndex: 1000
  };

  return (
    <>
      {/* Selection Pins */}
      <AnimatePresence>
        {pins.map((pin, index) => (
          <motion.div
            key={`${pin.type}-${index}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-grab active:cursor-grabbing z-50 ${
              pin.type === 'start' 
                ? 'bg-blue-500' 
                : 'bg-green-500'
            } ${isDragging && dragType === pin.type ? 'scale-125' : ''}`}
            style={{
              left: pin.x,
              top: pin.y,
              touchAction: 'none'
            }}
            onMouseDown={(e) => handlePinDrag(e, pin.type)}
            onTouchStart={(e) => handlePinDrag(e, pin.type)}
          >
            <div className="w-full h-full rounded-full bg-white bg-opacity-30" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Action Menu */}
      <motion.div
        ref={selectionRef}
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2"
        style={menuStyle}
      >
        <div className="flex items-center space-x-2">
          {/* Save Highlight */}
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            <span>Save</span>
          </button>

          {/* AI Chat */}
          <button
            onClick={handleAIChat}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask AI</span>
          </button>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Text Preview */}
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate">
            "{currentText}"
          </p>
        </div>
      </motion.div>

      {/* Invisible backdrop to capture clicks */}
      <div
        className="fixed inset-0 z-40"
        onClick={onDismiss}
        style={{ backgroundColor: 'transparent' }}
      />
    </>
  );
};

export default TextSelection;

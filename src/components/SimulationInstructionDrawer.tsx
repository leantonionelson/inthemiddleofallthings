import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface SimulationInstructionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  instructions: string[];
  interactions: Array<{ action: string; description: string }>;
}

const SimulationInstructionDrawer: React.FC<SimulationInstructionDrawerProps> = ({
  isOpen,
  onClose,
  title,
  instructions,
  interactions
}) => {
  const y = useMotionValue(0);
  const DRAG_THRESHOLD = 100;
  
  const [backdropVisible, setBackdropVisible] = useState(false);
  
  useEffect(() => {
    setBackdropVisible(isOpen);
  }, [isOpen]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > DRAG_THRESHOLD || info.velocity.y > 500) {
      onClose();
    } else {
      y.set(0);
    }
  };

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: backdropVisible ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ 
              type: 'tween',
              ease: 'easeOut',
              duration: 0.25
            }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-[55]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isOpen ? 0 : '100%' }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'tween',
              ease: [0.25, 0.1, 0.25, 1],
              duration: 0.3
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            dragDirectionLock={true}
            onDragEnd={handleDragEnd}
            style={{ y }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-paper-light dark:bg-paper-dark rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-700 max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Top Bar with Drag Handle and Close Button */}
            <div className="flex items-center justify-between pt-3 pb-2 px-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1 flex items-center justify-center">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              <motion.button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <h2 className="text-2xl font-serif text-ink-primary dark:text-paper-light mb-4">
                {title}
              </h2>

              {/* What it does */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-ink-primary dark:text-paper-light mb-3">
                  What it does
                </h3>
                <ul className="space-y-2 text-ink-secondary dark:text-ink-muted">
                  {instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-ink-primary dark:text-paper-light">•</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How to interact */}
              <div>
                <h3 className="text-lg font-semibold text-ink-primary dark:text-paper-light mb-3">
                  How to interact
                </h3>
                <div className="space-y-3">
                  {interactions.map((interaction, index) => (
                    <div key={index} className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
                      <div className="font-medium text-ink-primary dark:text-paper-light mb-1">
                        {interaction.action}
                      </div>
                      <div className="text-sm text-ink-secondary dark:text-ink-muted">
                        {interaction.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(drawerContent, document.body);
};

export default SimulationInstructionDrawer;


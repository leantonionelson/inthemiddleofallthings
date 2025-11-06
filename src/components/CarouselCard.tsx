import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface CarouselCardProps {
  title: string;
  subtitle?: string;
  isRead: boolean;
  onClick: () => void;
  contentType: 'chapter' | 'meditation' | 'story';
}

const CarouselCard: React.FC<CarouselCardProps> = ({
  title,
  subtitle,
  isRead,
  onClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  contentType
}) => {
  return (
    <motion.button
      onClick={onClick}
      className="relative w-full text-left p-4 rounded-lg h-full flex flex-col min-h-[110px] overflow-hidden group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Subtle glassmorphism background */}
      <div className="absolute inset-0 glass-subtle rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-300" />
      
      {/* Very subtle gradient overlay on hover */}
      <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
      
      {/* Content */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-ink-primary dark:text-paper-light mb-1 leading-tight transition-colors duration-200">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-ink-secondary dark:text-ink-muted leading-tight mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {isRead && (
          <motion.div 
            className="flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              delay: 0.1
            }}
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};

export default CarouselCard;


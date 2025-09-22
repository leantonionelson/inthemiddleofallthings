import React from 'react';
import { motion } from 'framer-motion';

interface SymbolProps {
  svgPath: string;
  size?: number;
  isAnimating?: boolean;
  metadata?: {
    name: string;
    description: string;
    meaning: string;
    tags: string[];
  };
  colorScheme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  className?: string;
}

export function Symbol({ 
  svgPath, 
  size = 120, 
  isAnimating = false, 
  metadata,
  colorScheme,
  className = "" 
}: SymbolProps) {
  const symbolVariants = {
    initial: { 
      scale: 1, 
      opacity: 0.8,
      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
    },
    animate: { 
      scale: isAnimating ? [1, 1.05, 1] : 1,
      opacity: isAnimating ? [0.8, 1, 0.8] : 0.9,
      filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15))'
    }
  };

  const style = colorScheme ? {
    color: colorScheme.primary,
    '--symbol-secondary': colorScheme.secondary,
    '--symbol-accent': colorScheme.accent
  } as React.CSSProperties : {};

  return (
    <motion.div
      className={`flex flex-col items-center justify-center ${className}`}
      variants={symbolVariants}
      initial="initial"
      animate="animate"
      transition={{
        duration: isAnimating ? 3 : 0.3,
        repeat: isAnimating ? Infinity : 0,
        ease: "easeInOut"
      }}
      style={style}
    >
      {/* Symbol SVG */}
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full text-gray-700 dark:text-gray-300"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
          dangerouslySetInnerHTML={{ __html: svgPath }}
        />
      </div>

      {/* Symbol Information - Hidden but keeping the data structure intact */}
      {/* metadata && (
        <motion.div 
          className="mt-4 text-center space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {metadata.name}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs leading-relaxed">
            {metadata.description}
          </p>

          {metadata.meaning && (
            <p className="text-xs text-gray-500 dark:text-gray-500 max-w-xs italic">
              {metadata.meaning}
            </p>
          )}

          {metadata.tags && metadata.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {metadata.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      ) */}
    </motion.div>
  );
} 
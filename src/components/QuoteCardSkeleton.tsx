import React from 'react';
import { motion } from 'framer-motion';

const QuoteCardSkeleton: React.FC = () => {
  return (
    <div className="absolute inset-0">
      <div className="w-full h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col relative bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-700 dark:to-slate-900">
        {/* Moving gradient overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)'
          }}
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* Card Content - Fixed height structure matching real cards */}
        <div className="flex-1 flex flex-col justify-between items-center p-6 sm:p-8 md:p-10 min-h-0 relative z-10">
          {/* Source Icon & Type - Fixed height */}
          <div className="flex items-center gap-2 flex-shrink-0 min-h-[20px]">
            <div className="w-4 h-4 rounded-full bg-white/20" />
            <div className="w-20 h-3 rounded-full bg-white/20" />
          </div>

          {/* Quote - Center area */}
          <div className="flex-1 flex items-center justify-center w-full my-4 sm:my-6 px-4">
            <div className="space-y-3 w-full max-w-2xl">
              <div className="h-6 sm:h-7 rounded-full bg-white/20 w-full" />
              <div className="h-6 sm:h-7 rounded-full bg-white/20 w-5/6 mx-auto" />
              <div className="h-6 sm:h-7 rounded-full bg-white/20 w-4/6 mx-auto" />
              <div className="h-6 sm:h-7 rounded-full bg-white/20 w-5/6 mx-auto" />
            </div>
          </div>

          {/* Source Info - Fixed height */}
          <div className="text-center flex-shrink-0 flex flex-col justify-center space-y-2">
            <div className="h-5 sm:h-6 rounded-full bg-white/20 w-48 mx-auto" />
            <div className="h-3 sm:h-4 rounded-full bg-white/20 w-32 mx-auto" />
            <div className="h-3 rounded-full bg-white/20 w-24 mx-auto" />
          </div>
        </div>

        {/* Watermark - Fixed height */}
        <div className="py-3 sm:py-4 text-center flex-shrink-0 min-h-[44px] flex items-center justify-center">
          <div className="h-3 rounded-full bg-white/20 w-32" />
        </div>
      </div>
    </div>
  );
};

export default QuoteCardSkeleton;


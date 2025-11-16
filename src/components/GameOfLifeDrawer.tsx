import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, PanInfo } from 'framer-motion';
import { X, Play, Pause, Trash2, Shuffle, Gauge } from 'lucide-react';

interface GameOfLifeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROWS = 30;
const COLS = 30;
const MIN_SPEED_VALUE = 1; // Slower (higher milliseconds)
const MAX_SPEED_VALUE = 10; // Faster (lower milliseconds)
const DEFAULT_SPEED_VALUE = 5;

// Convert speed value (1-10) to milliseconds
// Lower value = slower (higher ms), Higher value = faster (lower ms)
const speedValueToMs = (speedValue: number): number => {
  // Map 1-10 to 600-60ms (inverted)
  const minMs = 600;
  const maxMs = 60;
  return Math.round(minMs - ((speedValue - MIN_SPEED_VALUE) / (MAX_SPEED_VALUE - MIN_SPEED_VALUE)) * (minMs - maxMs));
};

// Helper function to create an empty grid
const createEmptyGrid = (): number[][] => {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
};

// Helper function to create a random grid (~30% alive)
const createRandomGrid = (): number[][] => {
  return Array(ROWS).fill(null).map(() => 
    Array(COLS).fill(null).map(() => Math.random() < 0.3 ? 1 : 0)
  );
};

// Count alive neighbors (8 directions)
const countNeighbors = (grid: number[][], row: number, col: number): number => {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const newRow = row + i;
      const newCol = col + j;
      if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
        count += grid[newRow][newCol];
      }
    }
  }
  return count;
};

// Compute next generation using Conway's Game of Life rules
const getNextGrid = (grid: number[][]): number[][] => {
  const nextGrid = createEmptyGrid();
  
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const neighbors = countNeighbors(grid, row, col);
      const isAlive = grid[row][col] === 1;
      
      if (isAlive) {
        // Alive cell: survives if 2-3 neighbors, dies otherwise
        nextGrid[row][col] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
      } else {
        // Dead cell: becomes alive if exactly 3 neighbors
        nextGrid[row][col] = neighbors === 3 ? 1 : 0;
      }
    }
  }
  
  return nextGrid;
};

const GameOfLifeDrawer: React.FC<GameOfLifeDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const [grid, setGrid] = useState<number[][]>(() => createEmptyGrid());
  const [isRunning, setIsRunning] = useState(false);
  const [speedValue, setSpeedValue] = useState(DEFAULT_SPEED_VALUE);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Convert speed value to milliseconds for the interval
  const speed = speedValueToMs(speedValue);
  
  // Drag functionality
  const y = useMotionValue(0);
  const DRAG_THRESHOLD = 100;
  
  // Ensure backdrop is visible when drawer is open
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

  // Simulation loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setGrid(prevGrid => getNextGrid(prevGrid));
      }, speed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, speed]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isOpen]);

  const handlePlayPause = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const handleClear = useCallback(() => {
    setGrid(createEmptyGrid());
    setIsRunning(false);
  }, []);

  const handleRandom = useCallback(() => {
    setGrid(createRandomGrid());
    // Optionally pause when randomizing
    // setIsRunning(false);
  }, []);

  const handleCellToggle = useCallback((row: number, col: number) => {
    if (!isRunning) {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(r => [...r]);
        newGrid[row][col] = newGrid[row][col] === 1 ? 0 : 1;
        return newGrid;
      });
    }
  }, [isRunning]);

  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeedValue = parseInt(e.target.value, 10);
    setSpeedValue(newSpeedValue);
  }, []);

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
            className="fixed bottom-0 left-0 right-0 z-[60] bg-paper-light dark:bg-paper-dark rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-700 h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Video Background */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-t-3xl">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-70 dark:opacity-100"
              >
                <source src="/media/bg.mp4" type="video/mp4" />
              </video>
              {/* Dark overlay for better content readability */}
              <div className="absolute inset-0 bg-paper-light/50 dark:bg-slate-950/75"></div>
            </div>

            {/* Top Bar with Drag Handle and Close Button */}
            <div className="relative z-10 flex items-center justify-between pt-3 pb-2 px-4">
              <div className="w-10"></div>
              <div className="flex justify-center flex-1 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-ink-muted/10 dark:hover:bg-paper-light/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-ink-muted dark:text-paper-light" />
              </button>
            </div>

            {/* Content */}
            <div 
              className="relative z-10 flex-1 overflow-y-auto flex flex-col" 
              style={{ touchAction: 'none' }}
            >
              <div className="flex-1 flex flex-col p-4 sm:p-6 pb-12 sm:pb-16">
                {/* Header */}
                <div className="text-center mb-4 flex-shrink-0">
                  <h3 className="text-3xl sm:text-4xl font-semibold text-ink-primary dark:text-paper-light mb-2">
                    Game of Life · Consequence in Motion
                  </h3>
                  <p className="text-sm sm:text-base text-ink-secondary dark:text-ink-muted max-w-2xl mx-auto">
                    Tap squares to bring them to life. Press play and watch how a few simple rules unfold into patterns you never planned.
                  </p>
                </div>

                {/* Grid Visualization */}
                <div className="flex-1 flex items-center justify-center mb-4 sm:mb-6 min-h-0 max-h-[50vh]">
                  <div className="w-full max-w-[600px] aspect-square bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-2 sm:p-4 border border-ink-muted/20 dark:border-paper-light/20">
                    <div 
                      className="grid gap-0.5 sm:gap-1 h-full w-full"
                      style={{ 
                        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                        gridTemplateRows: `repeat(${ROWS}, 1fr)`
                      }}
                    >
                      {grid.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <button
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleCellToggle(rowIndex, colIndex)}
                            disabled={isRunning}
                            className={`aspect-square rounded-sm transition-all duration-150 ${
                              cell === 1
                                ? 'bg-cyan-500 dark:bg-cyan-400 shadow-lg shadow-cyan-500/50 dark:shadow-cyan-400/50 opacity-90'
                                : 'bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
                            } ${isRunning ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            style={{
                              minWidth: '4px',
                              minHeight: '4px'
                            }}
                            aria-label={`Cell ${rowIndex}, ${colIndex}: ${cell === 1 ? 'alive' : 'dead'}`}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Controls Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
                  {/* Left: Primary Controls */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <motion.button
                      onClick={handlePlayPause}
                      className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium transition-all text-sm sm:text-base ${
                        isRunning
                          ? 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700'
                          : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isRunning ? (
                        <>
                          <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Play</span>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      onClick={handleClear}
                      className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium bg-gray-500 dark:bg-gray-600 text-white hover:bg-gray-600 dark:hover:bg-gray-700 transition-all text-sm sm:text-base"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Clear</span>
                    </motion.button>

                    <motion.button
                      onClick={handleRandom}
                      className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium bg-purple-500 dark:bg-purple-600 text-white hover:bg-purple-600 dark:hover:bg-purple-700 transition-all text-sm sm:text-base"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Random</span>
                    </motion.button>
                  </div>

                  {/* Right: Speed Control */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 sm:min-w-[200px]">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-ink-secondary dark:text-ink-muted" />
                      <label htmlFor="speed-slider" className="text-sm sm:text-base font-medium text-ink-secondary dark:text-ink-muted whitespace-nowrap">
                        Speed
                      </label>
                    </div>
                    <input
                      id="speed-slider"
                      type="range"
                      min={MIN_SPEED_VALUE}
                      max={MAX_SPEED_VALUE}
                      value={speedValue}
                      onChange={handleSpeedChange}
                      step={1}
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((speedValue - MIN_SPEED_VALUE) / (MAX_SPEED_VALUE - MIN_SPEED_VALUE)) * 100}%, rgb(229, 231, 235) ${((speedValue - MIN_SPEED_VALUE) / (MAX_SPEED_VALUE - MIN_SPEED_VALUE)) * 100}%, rgb(229, 231, 235) 100%)`
                      }}
                    />
                    <span className="text-xs sm:text-sm text-ink-secondary dark:text-ink-muted flex-shrink-0 w-12 sm:w-16 text-right">
                      {speedValue}/10
                    </span>
                  </div>
                </div>

                {/* Explanation Block */}
                <div className="mt-4 sm:mt-6 p-4 sm:p-6 rounded-xl bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20 flex-shrink-0">
                  <p className="text-sm sm:text-base text-ink-secondary dark:text-ink-muted leading-relaxed">
                    <strong className="text-ink-primary dark:text-paper-light">This is Conway's Game of Life.</strong> Every cell only follows one rule: live if you're supported, appear when the conditions are right, disappear when they're not. From this, entire universes of pattern emerge. Consequence, made visible.
                  </p>
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-ink-muted/20 dark:border-paper-light/20">
                    <p className="text-xs sm:text-sm text-ink-secondary dark:text-ink-muted leading-relaxed">
                      <strong className="text-ink-primary dark:text-paper-light">The Rules:</strong>
                    </p>
                    <ul className="mt-2 space-y-1 text-xs sm:text-sm text-ink-secondary dark:text-ink-muted list-disc list-inside">
                      <li>Live cells with 2 or 3 neighbors survive</li>
                      <li>Dead cells with exactly 3 neighbors are born</li>
                      <li>Everything you see here comes from that. Simple rules. Complex consequences.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document body level, outside stacking context
  return typeof document !== 'undefined' 
    ? createPortal(drawerContent, document.body)
    : null;
};

export default GameOfLifeDrawer;


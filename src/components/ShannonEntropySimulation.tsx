import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

// Configuration
const GRID_SIZE = 48; // 48x48 pixel grid
const PIXEL_SIZE = 6; // Size of each pixel in canvas
const CANVAS_PADDING = 20;

type SignalType = 'smiley' | 'letter-a' | 'checkerboard' | 'spiral' | 'random';

interface ShannonEntropyState {
  sourceImage: boolean[][];
  noisyImage: boolean[][];
  noiseProbability: number;
  redundancyEnabled: boolean;
  signalType: SignalType;
}

// Binary entropy function: H(p) = -p log2(p) - (1-p) log2(1-p)
function binaryEntropy(p: number): number {
  if (p === 0 || p === 1) return 0;
  if (p < 0 || p > 1) return 0;
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

// Generate source images
function generateSourceImage(type: SignalType, seed?: number): boolean[][] {
  const grid: boolean[][] = [];
  
  if (seed !== undefined) {
    // Use seed for reproducible random
    const rng = (() => {
      let s = seed;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    })();
    
    for (let y = 0; y < GRID_SIZE; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        grid[y][x] = rng() < 0.5;
      }
    }
    return grid;
  }
  
  switch (type) {
    case 'smiley': {
      const centerX = GRID_SIZE / 2;
      const centerY = GRID_SIZE / 2;
      const radius = GRID_SIZE * 0.35;
      
      for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Face circle
          const inFace = dist < radius;
          
          // Left eye
          const leftEyeX = centerX - GRID_SIZE * 0.15;
          const leftEyeY = centerY - GRID_SIZE * 0.1;
          const inLeftEye = Math.sqrt((x - leftEyeX) ** 2 + (y - leftEyeY) ** 2) < GRID_SIZE * 0.08;
          
          // Right eye
          const rightEyeX = centerX + GRID_SIZE * 0.15;
          const rightEyeY = centerY - GRID_SIZE * 0.1;
          const inRightEye = Math.sqrt((x - rightEyeX) ** 2 + (y - rightEyeY) ** 2) < GRID_SIZE * 0.08;
          
          // Smile (arc)
          const smileY = centerY + GRID_SIZE * 0.1;
          const smileWidth = GRID_SIZE * 0.25;
          const smileHeight = GRID_SIZE * 0.08;
          const inSmile = Math.abs(x - centerX) < smileWidth && 
                         y > smileY && 
                         y < smileY + smileHeight &&
                         ((x - centerX) ** 2) / (smileWidth ** 2) + ((y - smileY) ** 2) / (smileHeight ** 2) < 1;
          
          grid[y][x] = inFace && !inLeftEye && !inRightEye && !inSmile;
        }
      }
      break;
    }
    
    case 'letter-a': {
      const centerX = GRID_SIZE / 2;
      const centerY = GRID_SIZE / 2;
      const width = GRID_SIZE * 0.4;
      const height = GRID_SIZE * 0.5;
      
      for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
          const dx = x - centerX;
          const dy = y - (centerY - height / 2);
          
          // A shape: two diagonal lines meeting at top, horizontal bar in middle
          const absDx = Math.abs(dx);
          const inTriangle = absDx < (width / 2) * (1 - Math.abs(dy) / height) && dy >= 0 && dy < height;
          const crossbar = absDx < width * 0.35 && Math.abs(dy - height * 0.4) < height * 0.08;
          
          grid[y][x] = inTriangle || crossbar;
        }
      }
      break;
    }
    
    case 'checkerboard': {
      const squareSize = GRID_SIZE / 8;
      for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
          const squareX = Math.floor(x / squareSize);
          const squareY = Math.floor(y / squareSize);
          grid[y][x] = (squareX + squareY) % 2 === 0;
        }
      }
      break;
    }
    
    case 'spiral': {
      const centerX = GRID_SIZE / 2;
      const centerY = GRID_SIZE / 2;
      const maxRadius = GRID_SIZE * 0.45;
      const turns = 3;
      
      for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          
          // Spiral: r = a * theta
          const spiralAngle = (dist / maxRadius) * turns * 2 * Math.PI;
          const normalizedAngle = ((angle + Math.PI) % (2 * Math.PI)) / (2 * Math.PI);
          const spiralNormalized = (spiralAngle % (2 * Math.PI)) / (2 * Math.PI);
          
          const thickness = 0.15;
          const inSpiral = dist < maxRadius && Math.abs(normalizedAngle - spiralNormalized) < thickness;
          
          grid[y][x] = inSpiral;
        }
      }
      break;
    }
    
    case 'random': {
      for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
          grid[y][x] = Math.random() < 0.5;
        }
      }
      break;
    }
  }
  
  return grid;
}

// Apply noise to a single pixel
function applyNoise(original: boolean, p: number): boolean {
  return Math.random() < p ? !original : original;
}

// Apply noise with redundancy (3× repetition code)
function applyNoiseWithRedundancy(original: boolean, p: number): boolean {
  // Send 3 copies
  const received1 = applyNoise(original, p);
  const received2 = applyNoise(original, p);
  const received3 = applyNoise(original, p);
  
  // Majority vote
  const count = (received1 ? 1 : 0) + (received2 ? 1 : 0) + (received3 ? 1 : 0);
  return count >= 2;
}

// Apply noise to entire image
function applyNoiseToImage(source: boolean[][], p: number, redundancy: boolean): boolean[][] {
  const noisy: boolean[][] = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    noisy[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      if (redundancy) {
        noisy[y][x] = applyNoiseWithRedundancy(source[y][x], p);
      } else {
        noisy[y][x] = applyNoise(source[y][x], p);
      }
    }
  }
  
  return noisy;
}

const ShannonEntropySimulation: React.FC = () => {
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const noisyCanvasRef = useRef<HTMLCanvasElement>(null);
  const entropyCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [noiseProbability, setNoiseProbability] = useState(0);
  const [redundancyEnabled, setRedundancyEnabled] = useState(false);
  const [signalType, setSignalType] = useState<SignalType>('smiley');
  const [randomSeed, setRandomSeed] = useState(Math.floor(Math.random() * 1000000));
  
  const sourceImageRef = useRef<boolean[][]>(generateSourceImage('smiley'));
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const UPDATE_INTERVAL = 50; // Update noisy image every 50ms for shimmer effect

  // Initialize source image
  useEffect(() => {
    sourceImageRef.current = generateSourceImage(signalType, signalType === 'random' ? randomSeed : undefined);
    drawSourceImage();
    drawNoisyImage();
  }, [signalType, randomSeed]);

  // Draw source image
  const drawSourceImage = useCallback(() => {
    const canvas = sourceCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const size = GRID_SIZE * PIXEL_SIZE;
    canvas.width = size + CANVAS_PADDING * 2;
    canvas.height = size + CANVAS_PADDING * 2;
    
    // Clear
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pixels
    const source = sourceImageRef.current;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const pixelX = CANVAS_PADDING + x * PIXEL_SIZE;
        const pixelY = CANVAS_PADDING + y * PIXEL_SIZE;
        
        // Use theme colors - no pure black
        ctx.fillStyle = source[y][x] 
          ? '#0F0F0F' // ink-primary (dark mode will invert)
          : '#FAFAFA'; // paper-light
        
        // Dark mode adjustment
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          ctx.fillStyle = source[y][x]
            ? '#FAFAFA' // paper-light in dark mode
            : '#0F0F0F'; // ink-primary in dark mode
        }
        
        ctx.fillRect(pixelX, pixelY, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  }, []);

  // Draw noisy image
  const drawNoisyImage = useCallback(() => {
    const canvas = noisyCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const size = GRID_SIZE * PIXEL_SIZE;
    canvas.width = size + CANVAS_PADDING * 2;
    canvas.height = size + CANVAS_PADDING * 2;
    
    // Clear
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply noise
    const noisy = applyNoiseToImage(sourceImageRef.current, noiseProbability, redundancyEnabled);
    
    // Draw pixels
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const pixelX = CANVAS_PADDING + x * PIXEL_SIZE;
        const pixelY = CANVAS_PADDING + y * PIXEL_SIZE;
        
        // Use theme colors
        ctx.fillStyle = noisy[y][x]
          ? '#0F0F0F'
          : '#FAFAFA';
        
        // Dark mode adjustment
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          ctx.fillStyle = noisy[y][x]
            ? '#FAFAFA'
            : '#0F0F0F';
        }
        
        ctx.fillRect(pixelX, pixelY, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  }, [noiseProbability, redundancyEnabled]);

  // Draw entropy curve
  const drawEntropyCurve = useCallback(() => {
    const canvas = entropyCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Draw axes
    ctx.strokeStyle = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#A0AEC0' : '#4A5568';
    ctx.lineWidth = 1;
    
    // X axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Y axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#A0AEC0' : '#4A5568';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('0', padding, height - padding + 20);
    ctx.fillText('0.5', padding + graphWidth / 2, height - padding + 20);
    ctx.fillText('1.0', width - padding, height - padding + 20);
    
    ctx.textAlign = 'right';
    ctx.fillText('1.0', padding - 10, padding + 5);
    ctx.fillText('0.5', padding - 10, padding + graphHeight / 2 + 5);
    ctx.fillText('0', padding - 10, height - padding + 5);
    
    // Draw entropy curve
    ctx.strokeStyle = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#FAFAFA' : '#0F0F0F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i <= graphWidth; i++) {
      const p = i / graphWidth;
      const h = binaryEntropy(p);
      const x = padding + i;
      const y = height - padding - h * graphHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Draw current point marker
    const currentX = padding + noiseProbability * graphWidth;
    const currentH = binaryEntropy(noiseProbability);
    const currentY = height - padding - currentH * graphHeight;
    
    ctx.fillStyle = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#E53E3E' : '#E53E3E';
    ctx.beginPath();
    ctx.arc(currentX, currentY, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw value text
    ctx.fillStyle = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#FAFAFA' : '#0F0F0F';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`H(${noiseProbability.toFixed(2)}) = ${currentH.toFixed(3)}`, currentX, currentY - 15);
  }, [noiseProbability]);

  // Animation loop for shimmer effect
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= UPDATE_INTERVAL) {
        drawNoisyImage();
        lastUpdateRef.current = timestamp;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawNoisyImage]);

  // Redraw on changes
  useEffect(() => {
    drawSourceImage();
  }, [drawSourceImage, signalType, randomSeed]);

  useEffect(() => {
    drawEntropyCurve();
  }, [drawEntropyCurve]);

  // Handle theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      drawSourceImage();
      drawNoisyImage();
      drawEntropyCurve();
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [drawSourceImage, drawNoisyImage, drawEntropyCurve]);

  const handleReset = () => {
    if (signalType === 'random') {
      setRandomSeed(Math.floor(Math.random() * 1000000));
    }
    drawSourceImage();
    drawNoisyImage();
  };

  const entropy = binaryEntropy(noiseProbability);

  return (
    <div className="w-full space-y-6">
      {/* Image Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Panel */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-ink-primary dark:text-paper-light text-center">
            Source Signal
          </h3>
          <div className="flex items-center justify-center bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
            <canvas ref={sourceCanvasRef} className="max-w-full" />
          </div>
        </div>

        {/* Noisy Output Panel */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-ink-primary dark:text-paper-light text-center">
            Noisy Transmission
          </h3>
          <div className="flex items-center justify-center bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
            <canvas ref={noisyCanvasRef} className="max-w-full" />
          </div>
        </div>
      </div>

      {/* Entropy Curve */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-ink-primary dark:text-paper-light text-center">
          Binary Entropy H(p)
        </h3>
        <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
          <div className="w-full overflow-x-auto">
            <canvas 
              ref={entropyCanvasRef} 
              width={600} 
              height={200}
              className="w-full max-w-full"
            />
          </div>
        </div>
        <p className="text-xs text-center text-ink-secondary dark:text-ink-muted">
          Current entropy: <strong>{entropy.toFixed(3)}</strong> bits
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Noise Slider */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light">
            Noise Probability (p): {noiseProbability.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={noiseProbability}
            onChange={(e) => setNoiseProbability(parseFloat(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
          <div className="flex justify-between text-xs text-ink-secondary dark:text-ink-muted">
            <span>0 (Perfect)</span>
            <span>0.5 (Maximum Entropy)</span>
            <span>1.0 (Inverted)</span>
          </div>
        </div>

        {/* Signal Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light">
            Signal Type
          </label>
          <div className="flex flex-wrap gap-2">
            {(['smiley', 'letter-a', 'checkerboard', 'spiral', 'random'] as SignalType[]).map((type) => (
              <motion.button
                key={type}
                onClick={() => setSignalType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  signalType === type
                    ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                    : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
                } border border-ink-muted/20 dark:border-paper-light/20`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {type === 'letter-a' ? 'Letter A' : type.charAt(0).toUpperCase() + type.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Redundancy Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20">
          <div>
            <label className="block text-sm font-medium text-ink-primary dark:text-paper-light">
              Error Correction (3× Repetition Code)
            </label>
            <p className="text-xs text-ink-secondary dark:text-ink-muted mt-1">
              Each bit sent 3 times, majority vote at receiver
            </p>
          </div>
          <motion.button
            onClick={() => setRedundancyEnabled(!redundancyEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              redundancyEnabled
                ? 'bg-ink-primary dark:bg-paper-light'
                : 'bg-ink-muted/30 dark:bg-paper-light/30'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 rounded-full bg-paper-light dark:bg-ink-primary"
              animate={{ x: redundancyEnabled ? 24 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.button>
        </div>

        {/* Reset Button */}
        <motion.button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">Reset / Refresh</span>
        </motion.button>
      </div>
    </div>
  );
};

export default ShannonEntropySimulation;


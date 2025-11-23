import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

// Configuration
const IMAGE_SIZE = 128; // 128x128 pixel image
const CANVAS_SIZE = 400; // Display size
const MAX_DEPTH = 7; // Maximum recursion depth

type ImageType = 'portrait' | 'circle' | 'noise' | 'gradient';

interface QuadtreeNode {
  x: number;
  y: number;
  size: number;
  avgColor: number;
  children?: QuadtreeNode[]; // 4 children if internal
}

interface CompressionState {
  imageType: ImageType;
  threshold: number;
  showGrid: boolean;
  pixels: number[][];
  quadtree: QuadtreeNode | null;
}

// Generate grayscale image presets (0-255, theme-aware)
function generateImage(type: ImageType, seed?: number): number[][] {
  const pixels: number[][] = [];
  const isDark = document.documentElement.classList.contains('dark');
  
  // Base colors: avoid pure black/white
  const minVal = isDark ? 20 : 30;
  const maxVal = isDark ? 240 : 220;
  const range = maxVal - minVal;
  
  // Seeded random for noise
  let rngSeed = seed || Math.floor(Math.random() * 1000000);
  const rng = () => {
    rngSeed = (rngSeed * 9301 + 49297) % 233280;
    return rngSeed / 233280;
  };
  
  for (let y = 0; y < IMAGE_SIZE; y++) {
    pixels[y] = [];
    for (let x = 0; x < IMAGE_SIZE; x++) {
      let value = 0;
      
      switch (type) {
        case 'portrait': {
          // Face-like pattern with eyes and mouth
          const centerX = IMAGE_SIZE / 2;
          const centerY = IMAGE_SIZE / 2;
          const faceRadius = IMAGE_SIZE * 0.4;
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Face circle
          if (dist < faceRadius) {
            value = minVal + range * 0.7; // Light face
            
            // Left eye
            const leftEyeX = centerX - IMAGE_SIZE * 0.15;
            const leftEyeY = centerY - IMAGE_SIZE * 0.12;
            if (Math.sqrt((x - leftEyeX) ** 2 + (y - leftEyeY) ** 2) < IMAGE_SIZE * 0.06) {
              value = minVal; // Dark eye
            }
            
            // Right eye
            const rightEyeX = centerX + IMAGE_SIZE * 0.15;
            const rightEyeY = centerY - IMAGE_SIZE * 0.12;
            if (Math.sqrt((x - rightEyeX) ** 2 + (y - rightEyeY) ** 2) < IMAGE_SIZE * 0.06) {
              value = minVal; // Dark eye
            }
            
            // Mouth (arc)
            const mouthY = centerY + IMAGE_SIZE * 0.15;
            const mouthWidth = IMAGE_SIZE * 0.2;
            const mouthHeight = IMAGE_SIZE * 0.05;
            if (Math.abs(x - centerX) < mouthWidth && 
                y > mouthY && y < mouthY + mouthHeight &&
                ((x - centerX) ** 2) / (mouthWidth ** 2) + ((y - mouthY) ** 2) / (mouthHeight ** 2) < 1) {
              value = minVal; // Dark mouth
            }
          } else {
            value = minVal + range * 0.3; // Dark background
          }
          break;
        }
        
        case 'circle': {
          // Simple circle
          const centerX = IMAGE_SIZE / 2;
          const centerY = IMAGE_SIZE / 2;
          const radius = IMAGE_SIZE * 0.35;
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < radius) {
            value = minVal + range * 0.8; // Light circle
          } else {
            value = minVal + range * 0.2; // Dark background
          }
          break;
        }
        
        case 'noise': {
          // Pure random noise
          value = minVal + rng() * range;
          break;
        }
        
        case 'gradient': {
          // Radial gradient
          const centerX = IMAGE_SIZE / 2;
          const centerY = IMAGE_SIZE / 2;
          const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          value = minVal + (1 - dist / maxDist) * range;
          break;
        }
      }
      
      pixels[y][x] = Math.round(value);
    }
  }
  
  return pixels;
}

// Build quadtree recursively
function buildQuadtree(
  pixels: number[][],
  x: number,
  y: number,
  size: number,
  threshold: number,
  depth: number
): QuadtreeNode {
  // Calculate variance (using max - min for speed)
  let min = 255;
  let max = 0;
  let sum = 0;
  
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      const px = pixels[y + dy][x + dx];
      min = Math.min(min, px);
      max = Math.max(max, px);
      sum += px;
    }
  }
  
  const variance = max - min;
  const avgColor = sum / (size * size);
  
  // Stop if variance is low enough, size is 1, or max depth reached
  if (variance <= threshold || size === 1 || depth >= MAX_DEPTH) {
    return { x, y, size, avgColor };
  }
  
  // Split into 4 quadrants
  const halfSize = size / 2;
  const children: QuadtreeNode[] = [
    buildQuadtree(pixels, x, y, halfSize, threshold, depth + 1),
    buildQuadtree(pixels, x + halfSize, y, halfSize, threshold, depth + 1),
    buildQuadtree(pixels, x, y + halfSize, halfSize, threshold, depth + 1),
    buildQuadtree(pixels, x + halfSize, y + halfSize, halfSize, threshold, depth + 1)
  ];
  
  return { x, y, size, avgColor, children };
}

// Count leaves in quadtree
function countLeaves(node: QuadtreeNode): number {
  if (!node.children) {
    return 1;
  }
  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

// Get block size distribution for detail meter
function getBlockSizes(node: QuadtreeNode): number[] {
  const sizes: number[] = [];
  
  function traverse(n: QuadtreeNode) {
    if (!n.children) {
      sizes.push(n.size);
    } else {
      n.children.forEach(traverse);
    }
  }
  
  traverse(node);
  return sizes;
}

const CompressionSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageType, setImageType] = useState<ImageType>('portrait');
  const [threshold, setThreshold] = useState(30);
  const [showGrid, setShowGrid] = useState(false);
  const [pixels, setPixels] = useState<number[][]>(() => generateImage('portrait'));
  const [quadtree, setQuadtree] = useState<QuadtreeNode | null>(null);
  const [compressionRatio, setCompressionRatio] = useState(1);
  const [compressedSize, setCompressedSize] = useState(IMAGE_SIZE * IMAGE_SIZE);
  const [blockSizes, setBlockSizes] = useState<number[]>([]);
  
  // Rebuild quadtree when threshold or image changes
  useEffect(() => {
    const tree = buildQuadtree(pixels, 0, 0, IMAGE_SIZE, threshold, 0);
    setQuadtree(tree);
    
    const leaves = countLeaves(tree);
    setCompressedSize(leaves);
    setCompressionRatio((IMAGE_SIZE * IMAGE_SIZE) / leaves);
    setBlockSizes(getBlockSizes(tree));
  }, [pixels, threshold]);
  
  // Draw on canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !quadtree) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    const scale = CANVAS_SIZE / IMAGE_SIZE;
    const isDark = document.documentElement.classList.contains('dark');
    
    // Clear
    ctx.fillStyle = isDark ? '#1a1a2e' : '#f8f9fa';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw quadtree blocks
    function drawNode(node: QuadtreeNode, context: CanvasRenderingContext2D) {
      if (!node.children) {
        // Leaf node - draw block
        const x = node.x * scale;
        const y = node.y * scale;
        const size = node.size * scale;
        
        // Convert grayscale to RGB (theme-aware)
        const gray = node.avgColor / 255;
        const r = Math.round(gray * 255);
        const g = Math.round(gray * 255);
        const b = Math.round(gray * 255);
        
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, size, size);
        
        // Draw grid if enabled
        if (showGrid) {
          context.strokeStyle = isDark ? 'rgba(100, 200, 255, 0.3)' : 'rgba(0, 150, 200, 0.3)';
          context.lineWidth = 0.5;
          context.strokeRect(x, y, size, size);
        }
      } else {
        // Internal node - recurse
        node.children.forEach(child => drawNode(child, context));
      }
    }
    
    drawNode(quadtree, ctx);
  }, [quadtree, showGrid]);
  
  // Redraw when needed
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);
  
  // Handle theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      drawCanvas();
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, [drawCanvas]);
  
  // Handle image type change
  const handleImageTypeChange = (type: ImageType) => {
    const newPixels = generateImage(type);
    setPixels(newPixels);
    setImageType(type);
  };
  
  // Handle random noise
  const handleRandomNoise = () => {
    const newPixels = generateImage('noise');
    setPixels(newPixels);
    setImageType('noise');
  };
  
  // Handle reset
  const handleReset = () => {
    const newPixels = generateImage(imageType);
    setPixels(newPixels);
  };
  
  // Calculate detail level (inverse of average block size)
  const avgBlockSize = blockSizes.length > 0 
    ? blockSizes.reduce((a, b) => a + b, 0) / blockSizes.length 
    : IMAGE_SIZE;
  const detailLevel = 1 - (avgBlockSize / IMAGE_SIZE);
  
  return (
    <div className="w-full space-y-6">
      {/* Canvas */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-ink-primary dark:text-paper-light text-center">
          Compressed Image
        </h3>
        <div className="flex items-center justify-center bg-ink-muted/5 dark:bg-paper-light/5 rounded-xl p-4 border border-ink-muted/20 dark:border-paper-light/20">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
          <div className="text-xs text-ink-secondary dark:text-ink-muted mb-1">Raw Size</div>
          <div className="text-lg font-semibold text-ink-primary dark:text-paper-light">
            {(IMAGE_SIZE * IMAGE_SIZE).toLocaleString()}
          </div>
          <div className="text-xs text-ink-secondary dark:text-ink-muted">pixels</div>
        </div>
        
        <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
          <div className="text-xs text-ink-secondary dark:text-ink-muted mb-1">Compressed</div>
          <div className="text-lg font-semibold text-ink-primary dark:text-paper-light">
            {compressedSize.toLocaleString()}
          </div>
          <div className="text-xs text-ink-secondary dark:text-ink-muted">blocks</div>
        </div>
        
        <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
          <div className="text-xs text-ink-secondary dark:text-ink-muted mb-1">Ratio</div>
          <div className="text-lg font-semibold text-ink-primary dark:text-paper-light">
            {compressionRatio.toFixed(2)}×
          </div>
          <div className="text-xs text-ink-secondary dark:text-ink-muted">compression</div>
        </div>
        
        <div className="bg-ink-muted/5 dark:bg-paper-light/5 rounded-lg p-3 border border-ink-muted/20 dark:border-paper-light/20">
          <div className="text-xs text-ink-secondary dark:text-ink-muted mb-1">Detail Level</div>
          <div className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-ink-primary dark:bg-paper-light rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${detailLevel * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-xs text-ink-secondary dark:text-ink-muted mt-1">
            {(detailLevel * 100).toFixed(0)}%
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="space-y-4">
        {/* Threshold Slider */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light">
            Error Threshold: {threshold}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value))}
            className="w-full h-2 bg-ink-muted/20 dark:bg-paper-light/20 rounded-lg appearance-none cursor-pointer accent-ink-primary dark:accent-paper-light"
          />
          <div className="flex justify-between text-xs text-ink-secondary dark:text-ink-muted">
            <span>Low (Detail)</span>
            <span>High (Abstract)</span>
          </div>
        </div>
        
        {/* Image Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink-primary dark:text-paper-light">
            Image Type
          </label>
          <div className="flex flex-wrap gap-2">
            {(['portrait', 'circle', 'gradient', 'noise'] as ImageType[]).map((type) => (
              <motion.button
                key={type}
                onClick={() => handleImageTypeChange(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  imageType === type
                    ? 'bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary'
                    : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted hover:bg-ink-muted/20 dark:hover:bg-paper-light/20'
                } border border-ink-muted/20 dark:border-paper-light/20`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Grid Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-ink-muted/5 dark:bg-paper-light/5 border border-ink-muted/20 dark:border-paper-light/20">
          <div>
            <label className="block text-sm font-medium text-ink-primary dark:text-paper-light">
              Show Grid
            </label>
            <p className="text-xs text-ink-secondary dark:text-ink-muted mt-1">
              Display quadtree block boundaries
            </p>
          </div>
          <motion.button
            onClick={() => setShowGrid(!showGrid)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              showGrid
                ? 'bg-ink-primary dark:bg-paper-light'
                : 'bg-ink-muted/30 dark:bg-paper-light/30'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-4 h-4 rounded-full bg-paper-light dark:bg-ink-primary"
              animate={{ x: showGrid ? 24 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.button>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            onClick={handleRandomNoise}
            className="flex-1 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20 text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Random Noise
          </motion.button>
          
          <motion.button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-ink-muted/10 dark:bg-paper-light/10 hover:bg-ink-muted/20 dark:hover:bg-paper-light/20 text-ink-primary dark:text-paper-light transition-colors border border-ink-muted/20 dark:border-paper-light/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Reset</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CompressionSimulation;


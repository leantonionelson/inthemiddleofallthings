import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { ReflectionEntry, TextHighlight } from '../types';
import { Symbol } from './Symbol';

interface ReflectionGardenProps {
  reflections: ReflectionEntry[];
  highlights: TextHighlight[];
  onReflectionClick: (reflection: ReflectionEntry) => void;
  onNewReflection: () => void;
  userSymbol?: any;
}

interface ConstellationNode {
  id: string;
  x: number;
  y: number;
  type: 'reflection' | 'highlight';
  data: ReflectionEntry | TextHighlight;
  size: number;
}

const ReflectionGarden: React.FC<ReflectionGardenProps> = ({
  reflections,
  highlights,
  onReflectionClick,
  onNewReflection,
  userSymbol
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate constellation nodes
  const generateNodes = (): ConstellationNode[] => {
    const nodes: ConstellationNode[] = [];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = 200;

    // Add reflections
    reflections.forEach((reflection, index) => {
      const angle = (index / reflections.length) * 2 * Math.PI;
      const distance = radius + Math.random() * 100;
      nodes.push({
        id: `reflection-${reflection.id}`,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        type: 'reflection',
        data: reflection,
        size: 8 + Math.random() * 4
      });
    });

    // Add highlights
    highlights.forEach((highlight, index) => {
      const angle = (index / highlights.length) * 2 * Math.PI + Math.PI;
      const distance = radius + Math.random() * 150;
      nodes.push({
        id: `highlight-${highlight.id}`,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        type: 'highlight',
        data: highlight,
        size: 6 + Math.random() * 3
      });
    });

    return nodes;
  };

  const nodes = generateNodes();

  // Handle zoom
  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta * 0.1)));
  };

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY > 0 ? -1 : 1);
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="bg-paper-light dark:bg-paper-dark relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading text-ink-primary dark:text-paper-light">
            Reflection Garden
          </h1>
          <div className="flex space-x-2">
            <motion.button
              onClick={() => handleZoom(-1)}
              className="p-2 rounded-full bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ZoomOut className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => handleZoom(1)}
              className="p-2 rounded-full bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ZoomIn className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={resetView}
              className="p-2 rounded-full bg-ink-muted bg-opacity-10 text-ink-secondary dark:text-ink-muted hover:bg-opacity-20 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Constellation Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <motion.div
          className="relative w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center'
          }}
        >
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink-muted" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Constellation Nodes */}
          {nodes.map((node) => (
            <motion.div
              key={node.id}
              className="absolute cursor-pointer"
              style={{
                left: node.x,
                top: node.y,
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: Math.random() * 0.5 }}
              whileHover={{ scale: 1.2 }}
              onClick={() => {
                if (node.type === 'reflection') {
                  onReflectionClick(node.data as ReflectionEntry);
                }
                setSelectedNode(node);
              }}
            >
              <div
                className={`rounded-full ${
                  node.type === 'reflection'
                    ? 'bg-ink-primary dark:bg-paper-light'
                    : 'bg-ink-secondary dark:bg-ink-muted'
                } shadow-lg`}
                style={{
                  width: node.size * 2,
                  height: node.size * 2
                }}
              />
              
              {/* Glow effect */}
              <div
                className={`absolute inset-0 rounded-full ${
                  node.type === 'reflection'
                    ? 'bg-ink-primary dark:bg-paper-light'
                    : 'bg-ink-secondary dark:bg-ink-muted'
                } opacity-30 blur-sm`}
                style={{
                  width: node.size * 4,
                  height: node.size * 4,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            </motion.div>
          ))}

          {/* Connection Lines */}
          <svg className="absolute inset-0 pointer-events-none">
            {nodes.map((node, index) => {
              const nearbyNodes = nodes
                .slice(index + 1)
                .filter(other => {
                  const distance = Math.sqrt(
                    Math.pow(node.x - other.x, 2) + Math.pow(node.y - other.y, 2)
                  );
                  return distance < 150;
                });

              return nearbyNodes.map((other, otherIndex) => (
                <line
                  key={`${node.id}-${other.id}`}
                  x1={node.x}
                  y1={node.y}
                  x2={other.x}
                  y2={other.y}
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.1"
                  className="text-ink-muted"
                />
              ));
            })}
          </svg>
        </motion.div>
      </div>



      {/* Node Details Modal */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedNode(null)}
          >
            <motion.div
              className="bg-paper-light dark:bg-paper-dark rounded-2xl p-6 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`w-4 h-4 rounded-full ${
                    selectedNode.type === 'reflection'
                      ? 'bg-ink-primary dark:bg-paper-light'
                      : 'bg-ink-secondary dark:bg-ink-muted'
                  }`}
                />
                <h3 className="text-lg font-medium text-ink-primary dark:text-paper-light">
                  {selectedNode.type === 'reflection' 
                    ? (selectedNode.data as ReflectionEntry).title
                    : 'Highlight'
                  }
                </h3>
              </div>

              <div className="space-y-3">
                {selectedNode.type === 'reflection' ? (
                  <div>
                    <p className="text-ink-secondary dark:text-ink-muted text-sm">
                      {(selectedNode.data as ReflectionEntry).content}
                    </p>
                    <p className="text-ink-muted text-xs mt-2">
                      {new Date((selectedNode.data as ReflectionEntry).createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-ink-secondary dark:text-ink-muted text-sm italic">
                      "{(selectedNode.data as TextHighlight).text}"
                    </p>
                    <p className="text-ink-muted text-xs mt-2">
                      From: {(selectedNode.data as TextHighlight).chapterTitle}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setSelectedNode(null)}
                  className="px-4 py-2 text-ink-secondary dark:text-ink-muted hover:text-ink-primary dark:hover:text-paper-light transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-paper-light dark:bg-paper-dark rounded-lg p-4 shadow-lg">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-ink-primary dark:bg-paper-light rounded-full" />
            <span className="text-ink-secondary dark:text-ink-muted">Reflections</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-ink-secondary dark:bg-ink-muted rounded-full" />
            <span className="text-ink-secondary dark:text-ink-muted">Highlights</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReflectionGarden;

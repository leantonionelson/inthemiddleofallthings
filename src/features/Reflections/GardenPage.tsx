import React, { useState, useEffect } from 'react';
import { User, ReflectionEntry, TextHighlight } from '../../types';
import ReflectionGarden from '../../components/ReflectionGarden';
import CleanLayout from '../../components/CleanLayout';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../types';
import StandardHeader from '../../components/StandardHeader';

interface GardenPageProps {
  user: User | null;
  onOpenAI?: () => void;
}

const GardenPage: React.FC<GardenPageProps> = ({ user, onOpenAI }) => {
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const navigate = useNavigate();

  // Load reflections and highlights from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        // Load reflections
        const savedReflections = localStorage.getItem('reflections');
        if (savedReflections) {
          setReflections(JSON.parse(savedReflections));
        }

        // Load highlights
        const savedHighlights = localStorage.getItem('highlights');
        if (savedHighlights) {
          setHighlights(JSON.parse(savedHighlights));
        }
      } catch (error) {
        console.error('Error loading garden data:', error);
      }
    };

    loadData();
  }, []);

  const handleReflectionClick = (reflection: ReflectionEntry) => {
    // TODO: Open reflection detail view
    console.log('Reflection clicked:', reflection);
  };

  const handleNewReflection = () => {
    navigate(AppRoute.READER);
  };

  const handleRead = () => {
    navigate(AppRoute.READER);
  };

  const handleListen = () => {
    // Garden doesn't have audio functionality
  };

  const handleAsk = () => {
    // Garden doesn't have AI functionality
  };

  const handleLiveAudio = () => {
    // Garden doesn't have live audio functionality
  };

  // Show empty state if no reflections or highlights
  if (reflections.length === 0 && highlights.length === 0) {
    return (
      <CleanLayout
        currentPage="garden"
        onRead={handleRead}
        onOpenAI={onOpenAI}
      >
        <StandardHeader
          title="Reflection Garden"
          subtitle="Your collection of insights and reflections"
        />

        <main className="max-w-4xl mx-auto pt-20 pb-24">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 opacity-50">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="25" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="text-ink-muted"
                />
              </svg>
            </div>
            <h2 className="text-xl font-heading text-ink-primary dark:text-paper-light mb-4">
              Your garden is empty
            </h2>
            <p className="text-ink-secondary dark:text-ink-muted mb-6">
              Start your first reflection to see your garden bloom
            </p>
            <button 
              onClick={handleNewReflection}
              className="px-6 py-3 bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary rounded-lg hover:opacity-90 transition-opacity"
            >
              Begin Reading
            </button>
          </div>
        </main>
      </CleanLayout>
    );
  }

  return (
    <CleanLayout
      currentPage="garden"
      onRead={handleRead}
      onOpenAI={onOpenAI}
    >
      <ReflectionGarden
        reflections={reflections}
        highlights={highlights}
        onReflectionClick={handleReflectionClick}
        onNewReflection={handleNewReflection}
        userSymbol={null}
      />
    </CleanLayout>
  );
};

export default GardenPage; 
import React from 'react';
import StandardNavigation from './StandardNavigation';
import { useScrollTransition } from '../hooks/useScrollTransition';

interface CleanLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onRead: () => void;
  isReading?: boolean;
  onOpenAI?: () => void;
  isAudioPlaying?: boolean;
}

const CleanLayout: React.FC<CleanLayoutProps> = ({
  children,
  currentPage,
  onRead,
  isReading = false,
  onOpenAI,
  isAudioPlaying = false
}) => {
  const scrollTransition = useScrollTransition({
    threshold: 5,
    sensitivity: 0.8,
    maxOffset: 80,
    direction: 'down' // Bottom menu moves down when scrolling down
  });

  return (
    <div className="bg-paper-light dark:bg-paper-dark relative">
      {/* Main Content */}
      <div> {/* Add bottom padding to account for navigation */}
        {children}
      </div>

      {/* Standardized Navigation - scroll transition only on read page */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50"
        style={isReading ? {
          ...scrollTransition.style,
          transform: isAudioPlaying 
            ? 'translateY(80px)' // Move bottom menu down when audio is playing
            : scrollTransition.style.transform
        } : {
          // No scroll transition on other pages
          transform: 'none'
        }}
      >
        <StandardNavigation
          currentPage={currentPage}
          onRead={onRead}
          isReading={isReading}
          onOpenAI={onOpenAI}
        />
      </div>
    </div>
  );
};

export default CleanLayout;

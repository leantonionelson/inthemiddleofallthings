import React from 'react';
import StandardNavigation from './StandardNavigation';
import { useScrollTransition } from '../hooks/useScrollTransition';

interface CleanLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onRead: () => void;
  isReading?: boolean;
  onOpenAI?: () => void;
}

const CleanLayout: React.FC<CleanLayoutProps> = ({
  children,
  currentPage,
  onRead,
  isReading = false,
  onOpenAI
}) => {
  const scrollTransition = useScrollTransition({
    threshold: 5,
    sensitivity: 0.8,
    maxOffset: 80
  });

  return (
    <div className="bg-paper-light dark:bg-paper-dark relative">
      {/* Main Content */}
      <div> {/* Add bottom padding to account for navigation */}
        {children}
      </div>

      {/* Standardized Navigation with scroll transition */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50"
        style={scrollTransition.style}
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

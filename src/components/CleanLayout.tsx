import React from 'react';
import StandardNavigation from './StandardNavigation';

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
  return (
    <div className="bg-paper-light dark:bg-paper-dark relative">
      {/* Main Content */}
      <div> {/* Add bottom padding to account for navigation */}
        {children}
      </div>

      {/* Standardized Navigation */}
      <StandardNavigation
        currentPage={currentPage}
        onRead={onRead}
        isReading={isReading}
        onOpenAI={onOpenAI}
      />


    </div>
  );
};

export default CleanLayout;

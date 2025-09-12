import React, { ReactNode } from 'react';
import DesktopNavigation from './DesktopNavigation';
import StandardNavigation from './StandardNavigation';
import { useScrollTransition } from '../hooks/useScrollTransition';

interface ResponsiveLayoutProps {
  children: ReactNode;
  currentPage: string;
  onRead?: () => void;
  isReading?: boolean;
  showShadow?: boolean;
  onOpenAI?: () => void;
  isAudioPlaying?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  currentPage,
  onRead,
  isReading = false,
  showShadow = true,
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
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark">
      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden lg:block">
        <DesktopNavigation onOpenAI={onOpenAI} />
      </div>

      {/* Main Content */}
      <main className={`${
        // Add top padding for desktop nav, none for mobile
        'lg:pt-20'
      } ${
        // Add bottom padding for mobile nav, none for desktop
        'pb-20 lg:pb-0'
      }`}>
        {children}
      </main>

      {/* Mobile Navigation - Hidden on desktop */}
      <div className="lg:hidden">
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
            showShadow={showShadow}
            onOpenAI={onOpenAI}
          />
        </div>
      </div>
    </div>
  );
};

export default ResponsiveLayout;

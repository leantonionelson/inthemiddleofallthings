import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import DesktopNavigation from './DesktopNavigation';
import StandardNavigation from './StandardNavigation';
import { useScrollTransition } from '../hooks/useScrollTransition';

interface ResponsiveLayoutProps {
  children: ReactNode;
  isReading?: boolean;
  showShadow?: boolean;
  isAudioPlaying?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  isReading = false,
  showShadow = true,
  isAudioPlaying = false
}) => {
  const scrollTransition = useScrollTransition({
    threshold: 5,
    sensitivity: 0.8,
    maxOffset: 80,
    direction: 'down' // Bottom menu moves down when scrolling down
  });

  // Measure fixed nav heights to prevent content from scrolling under them
  const desktopNavRef = useRef<HTMLDivElement | null>(null);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const [topNavHeight, setTopNavHeight] = useState(0);
  const [bottomNavHeight, setBottomNavHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      const desktopEl = document.getElementById('desktop-nav');
      const top = desktopEl ? desktopEl.getBoundingClientRect().height : 0;
      const bottom = mobileNavRef.current ? mobileNavRef.current.getBoundingClientRect().height : 0;
      setTopNavHeight(top);
      setBottomNavHeight(bottom);
    };

    // Initial measure
    measure();

    // Re-measure on resize and orientation changes
    const handleResize = () => measure();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Observe nav size changes
    const { ResizeObserver: ResizeObserverCtor } = (window as unknown as {
      ResizeObserver?: new (callback: ResizeObserverCallback) => ResizeObserver;
    });
    const ro = ResizeObserverCtor ? new ResizeObserverCtor(() => measure()) : undefined;
    const desktopEl = document.getElementById('desktop-nav');
    const mobileEl = mobileNavRef.current;
    if (desktopEl && ro) ro.observe(desktopEl);
    if (mobileEl && ro) ro.observe(mobileEl);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (desktopEl && ro) ro.unobserve(desktopEl);
      if (mobileEl && ro) ro.unobserve(mobileEl);
      if (ro) ro.disconnect?.();
    };
  }, []);

  const contentHeightStyle = useMemo<React.CSSProperties>(() => {
    // For reading pages, keep window scroll semantics as-is to avoid breaking reader interactions
    if (isReading) return {};
    // Compute available height subtracting fixed navs (desktop top or mobile bottom)
    // Both may not be present due to responsive visibility; measured values will be 0 accordingly
    return {
      height: `calc(100vh - ${topNavHeight}px - ${bottomNavHeight}px)`,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    } as React.CSSProperties;
  }, [isReading, topNavHeight, bottomNavHeight]);

  return (
    <div className="min-h-screen bg-paper-light dark:bg-slate-950/75 relative">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
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

      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden lg:block relative z-10" ref={desktopNavRef}>
        <DesktopNavigation />
      </div>

      {/* Main Content */}
      <main className={`relative z-10`}>
        {isReading ? (
          // Keep original flow/scroll for reading pages, but offset for desktop nav and mobile bottom nav heights
          <div style={{ marginTop: topNavHeight, paddingBottom: bottomNavHeight }}>
            {children}
          </div>
        ) : (
          <div style={contentHeightStyle}>
            {children}
          </div>
        )}
      </main>

      {/* Mobile Navigation - Hidden on desktop */}
      <div className="lg:hidden relative z-50">
        <div 
          id="mobile-nav"
          className="fixed bottom-0 left-0 right-0 z-50"
          ref={mobileNavRef}
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
            showShadow={showShadow}
          />
        </div>
      </div>
    </div>
  );
};

export default ResponsiveLayout;

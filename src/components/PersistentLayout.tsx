import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import StandardNavigation from './StandardNavigation';
import { useScrollTransition } from '../hooks/useScrollTransition';
import { AppRoute } from '../types';

interface PersistentLayoutProps {}

const PersistentLayout: React.FC<PersistentLayoutProps> = () => {
  const location = useLocation();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  
  // Determine if we're on a reading page
  const isLearnModulePage = location.pathname.startsWith('/learn/') && location.pathname !== AppRoute.LEARN;
  const isReading = location.pathname.startsWith(AppRoute.READER) || 
                    location.pathname.startsWith(AppRoute.MEDITATIONS) || 
                    location.pathname.startsWith(AppRoute.STORIES) ||
                    isLearnModulePage;
  
  // Disable scroll transition for meditations-landing page
  const isMeditationsLanding = location.pathname === '/meditations-landing';
  
  const scrollTransition = useScrollTransition({
    threshold: 5,
    sensitivity: 0.8,
    maxOffset: 80,
    direction: 'down'
  }, isReading ? mainRef : undefined);

  // Measure fixed nav heights
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const [bottomNavHeight, setBottomNavHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      const bottom = mobileNavRef.current ? mobileNavRef.current.getBoundingClientRect().height : 0;
      setBottomNavHeight(bottom);
    };

    measure();

    const handleResize = () => measure();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const { ResizeObserver: ResizeObserverCtor } = (window as unknown as {
      ResizeObserver?: new (callback: ResizeObserverCallback) => ResizeObserver;
    });
    const ro = ResizeObserverCtor ? new ResizeObserverCtor(() => measure()) : undefined;
    const mobileEl = mobileNavRef.current;
    if (mobileEl && ro) ro.observe(mobileEl);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (mobileEl && ro) ro.unobserve(mobileEl);
      if (ro) ro.disconnect?.();
    };
  }, []);

  const contentHeightStyle = useMemo<React.CSSProperties>(() => {
    if (isReading) return {};
    return {
      height: `calc(100vh - ${bottomNavHeight}px)`,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    } as React.CSSProperties;
  }, [isReading, bottomNavHeight]);

  return (
    <div className="min-h-screen bg-paper-light dark:bg-slate-950/75 relative">
      {/* Persistent Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-70 dark:opacity-100"
        >
          <source src="/media/bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-paper-light/50 dark:bg-slate-950/75"></div>
      </div>


      {/* Main Content - This is where page content will render */}
      <main 
        ref={mainRef}
        className={`relative z-10`}
        style={isReading ? {
          height: 'calc(100vh - 84px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overflowX: 'hidden',
          paddingBottom: 0
        } : {
          ...contentHeightStyle
        }}
      >
        {isReading ? (
          <Outlet context={{ isAudioPlaying, setIsAudioPlaying, mainScrollRef: mainRef }} />
        ) : (
          <Outlet context={{ isAudioPlaying, setIsAudioPlaying }} />
        )}
      </main>

      {/* Persistent Mobile Navigation */}
      <div className="relative z-50">
        <div 
          id="mobile-nav"
          className="fixed bottom-0 left-0 right-0 z-50"
          ref={mobileNavRef}
          style={isReading && !isMeditationsLanding && !isLearnModulePage ? {
            ...scrollTransition.style,
            transform: isAudioPlaying 
              ? 'translateY(80px)'
              : scrollTransition.style.transform
          } : {
            transform: 'none'
          }}
        >
          <StandardNavigation
            showShadow={true}
          />
        </div>
      </div>
    </div>
  );
};

export default PersistentLayout;


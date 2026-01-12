import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import StandardHeader from './StandardHeader';
import StandardNavigation from './StandardNavigation';
import { useScrollTransition } from '../hooks/useScrollTransition';
import { AppRoute } from '../types';

type PersistentLayoutCssVars = React.CSSProperties & {
  ['--bottom-nav-h']?: string;
  ['--app-header-h']?: string;
};

const PersistentLayout: React.FC = () => {
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
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [topHeaderHeight, setTopHeaderHeight] = useState(0);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const [bottomNavHeight, setBottomNavHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      const top = headerRef.current ? headerRef.current.getBoundingClientRect().height : 0;
      const bottom = mobileNavRef.current ? mobileNavRef.current.getBoundingClientRect().height : 0;
      setTopHeaderHeight(top);
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
    const headerEl = headerRef.current;
    const mobileEl = mobileNavRef.current;
    if (headerEl && ro) ro.observe(headerEl);
    if (mobileEl && ro) ro.observe(mobileEl);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (headerEl && ro) ro.unobserve(headerEl);
      if (mobileEl && ro) ro.unobserve(mobileEl);
      if (ro) ro.disconnect?.();
    };
  }, []);

  const contentHeightStyle = useMemo<React.CSSProperties>(() => {
    if (isReading) return {};
    return {
      height: `calc(100vh - ${topHeaderHeight}px - ${bottomNavHeight}px)`,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    } as React.CSSProperties;
  }, [isReading, topHeaderHeight, bottomNavHeight]);

  const bottomFadeStyle = useMemo<React.CSSProperties>(() => {
    const start = bottomNavHeight + 190;
    const mid = bottomNavHeight + 140;
    const mask = `linear-gradient(black calc(90% - ${start}px), rgb(0, 0, 0) calc(100% - ${start}px), rgba(0, 0, 0, 0.7) calc(90% - ${mid}px), transparent 93%)`;

    return {
      // Prevent content from feeling like it scrolls “behind” the bottom nav.
      // Keep this modest so pages can control their own bottom spacing (e.g. Learn uses pb-10).
      paddingBottom: `calc(${bottomNavHeight}px + 2.5rem + env(safe-area-inset-bottom))`,
      // Subtle fade at the bottom edge for a nicer transition near the nav.
      WebkitMaskImage: mask,
      maskImage: mask,
    } as React.CSSProperties;
  }, [bottomNavHeight]);

  return (
    <div
      className="min-h-screen bg-paper-light dark:bg-slate-950/75 relative"
      style={
        {
          // Expose measured fixed UI heights to descendants (and overlay portals) via CSS variables.
          // These are used to position fixed UI above the bottom nav and below the header.
          '--bottom-nav-h': `${bottomNavHeight}px`,
          '--app-header-h': `${topHeaderHeight}px`,
        } as PersistentLayoutCssVars
      }
    >
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


      {/* Persistent Header (top) */}
      <div ref={headerRef} className="relative z-20 flex-shrink-0">
        <StandardHeader
          title="The Middle of all things"
          subtitle="A system for orientation"
          showSettingsButton={true}
        />
      </div>

      {/* Main Content - This is where page content will render */}
      <main 
        ref={mainRef}
        className={`relative z-10`}
        style={isReading ? {
          height: `calc(100vh - ${topHeaderHeight + bottomNavHeight}px)`,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overflowX: 'hidden',
          ...bottomFadeStyle
        } : {
          ...contentHeightStyle,
          ...bottomFadeStyle
        }}
      >
        {isReading ? (
          <Outlet context={{ isAudioPlaying, setIsAudioPlaying, mainScrollRef: mainRef }} />
        ) : (
          <Outlet context={{ isAudioPlaying, setIsAudioPlaying }} />
        )}
      </main>

      {/* Global overlay host
          - Not a descendant of the masked <main>, so fixed UI rendered here will NOT be masked.
          - pointer-events disabled at the host level; overlay children must opt-in with pointer-events-auto. */}
      <div id="overlay-root" className="fixed inset-0 z-[70] pointer-events-none" />

      {/* Persistent Mobile Navigation */}
      <div className="relative z-50">
        <div 
          id="mobile-nav"
          className="fixed bottom-0 left-0 right-0 z-50"
          ref={mobileNavRef}
          style={isReading && !isMeditationsLanding && !isLearnModulePage ? {
            ...scrollTransition.style,
            transform: isAudioPlaying 
              ? 'translateY(85px)'
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


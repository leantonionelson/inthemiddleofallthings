import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is desktop-sized (1024px+)
 * Uses the lg breakpoint to match Tailwind's responsive design system
 */
export const useDesktopDetection = (): boolean => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      // Use 1024px as the breakpoint (Tailwind's lg breakpoint)
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Initial check
    checkDesktop();

    // Listen for resize events
    window.addEventListener('resize', checkDesktop);

    return () => {
      window.removeEventListener('resize', checkDesktop);
    };
  }, []);

  return isDesktop;
};


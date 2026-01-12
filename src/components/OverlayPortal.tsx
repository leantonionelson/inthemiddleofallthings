import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface OverlayPortalProps {
  children: React.ReactNode;
}

/**
 * OverlayPortal
 *
 * Renders UI into the global overlay layer (outside the masked/scroll container).
 * This is essential when the app uses CSS `mask-image` on the main scroll region:
 * descendants (even `position: fixed`) will still be masked.
 */
const OverlayPortal: React.FC<OverlayPortalProps> = ({ children }) => {
  const [host, setHost] = useState<HTMLElement | null>(null);

  // The overlay host is created by `PersistentLayout`. On the first render pass, it may not exist
  // in the DOM yet (React hasn't committed), so we resolve it after mount.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    setHost(document.getElementById('overlay-root'));
  }, []);

  if (!host) return null;
  return createPortal(children, host);
};

export default OverlayPortal;



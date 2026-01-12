/**
 * QuotesPage
 *
 * Purpose:
 * - Preserve the previous quote-card experience.
 * - Expose it at `/quotes`.
 * - Also allow embedding it inside the Read page as a tab.
 */
import React from 'react';
import HomePage from '../Home/HomePage';
import OverlayPortal from '../../components/OverlayPortal';

interface QuotesPageProps {
  embedded?: boolean;
}

const QuotesPage: React.FC<QuotesPageProps> = ({ embedded = false }) => {
  // When rendered as a standalone route (`/quotes`), render the quote stack above the masked
  // scroll container via the global overlay layer.
  if (!embedded) {
    return (
      <OverlayPortal>
        <div
          className="fixed inset-x-0 z-[75] pointer-events-none"
          style={{
            top: 'var(--app-header-h, 0px)',
            // Leave extra room above the bottom nav so the quote action buttons never overlap it.
            bottom: 'calc(var(--bottom-nav-h, 0px) + env(safe-area-inset-bottom) + 5rem)',
          }}
        >
          <div className="pointer-events-auto h-full">
            <HomePage embedded={true} />
          </div>
        </div>
      </OverlayPortal>
    );
  }

  return <HomePage embedded={true} />;
};

export default QuotesPage;



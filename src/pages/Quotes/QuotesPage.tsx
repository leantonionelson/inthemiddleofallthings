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

interface QuotesPageProps {
  embedded?: boolean;
}

const QuotesPage: React.FC<QuotesPageProps> = ({ embedded = false }) => {
  return <HomePage embedded={embedded} />;
};

export default QuotesPage;



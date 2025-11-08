import React from 'react';

interface PageLoadingSpinnerProps {
  message?: string;
}

const PageLoadingSpinner: React.FC<PageLoadingSpinnerProps> = ({
  message = 'Loading...'
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative z-10">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-primary dark:border-paper-light mx-auto mb-4"></div>
        <p className="text-ink-secondary dark:text-ink-muted">{message}</p>
      </div>
    </div>
  );
};

export default PageLoadingSpinner;


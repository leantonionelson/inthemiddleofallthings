import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark flex items-center justify-center">
      <div className="text-center">
        <div className="breathing-orb w-16 h-16 rounded-full mx-auto mb-4"></div>
        <p className="text-ink-secondary dark:text-ink-muted font-body">
          Awakening...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 
import React from 'react';

const LoadingSpinner: React.FC = () => {
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
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="breathing-orb w-16 h-16 rounded-full mx-auto mb-4"></div>
          <p className="text-ink-secondary dark:text-ink-muted font-body">
            Awakening...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 
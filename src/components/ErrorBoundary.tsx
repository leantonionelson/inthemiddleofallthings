import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper-light dark:bg-paper-dark flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="25" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    className="text-ink-muted"
                  />
                </svg>
              </div>
            </div>
            
            <h2 className="text-xl font-heading text-ink-primary dark:text-paper-light mb-4">
              Something went wrong
            </h2>
            
            <p className="text-ink-secondary dark:text-ink-muted font-body mb-6">
              Unable to load content. The Book is resting.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-ink-primary dark:bg-paper-light text-paper-light dark:text-ink-primary font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-6 py-3 border border-ink-muted text-ink-secondary dark:text-ink-muted font-medium rounded-lg hover:bg-ink-muted hover:text-paper-light transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
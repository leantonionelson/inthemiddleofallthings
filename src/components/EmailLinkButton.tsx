import React, { useState } from 'react';
import { Mail, Check, AlertCircle } from 'lucide-react';
import { sendEmailLink } from '../services/emailService';
import GlassButton from './GlassButton';

interface EmailLinkButtonProps {
  className?: string;
}

const EmailLinkButton: React.FC<EmailLinkButtonProps> = ({ className = '' }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setStatus('error');
      setErrorMessage('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const result = await sendEmailLink({ email });
      
      if (result.success) {
        setStatus('success');
        setEmail('');
        // Reset success message after 5 seconds
        setTimeout(() => {
          setStatus('idle');
        }, 5000);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to send email');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-secondary dark:text-ink-muted z-10" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error') {
                setStatus('idle');
                setErrorMessage('');
              }
            }}
            placeholder="your@email.com"
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-3 bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-ink-muted/20 dark:border-paper-light/20 rounded-full text-ink-primary dark:text-paper-light placeholder-ink-secondary dark:placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-ink-primary/20 dark:focus:ring-paper-light/20 transition-all disabled:opacity-50"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || status === 'success'}
          className="w-full relative flex items-center gap-2 px-6 py-3 rounded-full font-medium shadow-sm hover:shadow-md transition-all overflow-hidden group text-sm disabled:opacity-50 cursor-not-allowed"
        >
          <div className="absolute inset-0 glass-subtle rounded-full" />
          <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
          <div className="relative z-10 flex items-center gap-2 text-ink-primary dark:text-paper-light justify-center">
          {isLoading ? (
            'Sending...'
          ) : status === 'success' ? (
            <>
              <Check className="w-4 h-4" />
              Email Sent!
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Send Me the Link
            </>
          )}
          </div>
        </button>
      </form>

      {status === 'error' && errorMessage && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {status === 'success' && (
        <p className="text-sm text-green-600 dark:text-green-400 text-center">
          Check your email for the link!
        </p>
      )}
    </div>
  );
};

export default EmailLinkButton;


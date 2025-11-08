import React from 'react';

interface GlassButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  onClick,
  children,
  icon,
  variant = 'primary',
  disabled = false,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-center gap-2 px-6 py-3 rounded-full font-medium shadow-sm hover:shadow-md transition-all overflow-hidden group text-sm ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="absolute inset-0 glass-subtle rounded-full" />
      <div className="absolute inset-0 gradient-overlay-subtle opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
      <div className="relative z-10 flex items-center gap-2 text-ink-primary dark:text-paper-light">
        {icon && <span>{icon}</span>}
        {children}
      </div>
    </button>
  );
};

export default GlassButton;


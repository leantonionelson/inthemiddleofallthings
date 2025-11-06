import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface CarouselCardProps {
  title: string;
  subtitle?: string;
  isRead: boolean;
  onClick: () => void;
  contentType: 'chapter' | 'meditation' | 'story';
}

const CarouselCard: React.FC<CarouselCardProps> = ({
  title,
  subtitle,
  isRead,
  onClick,
  contentType
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-paper-light dark:bg-paper-dark rounded-lg hover:bg-ink-primary/10 dark:hover:bg-paper-light/10 transition-all group border border-ink-muted/10 dark:border-paper-light/10 h-full flex flex-col min-h-[110px] shadow-sm hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-ink-primary dark:text-paper-light mb-1 leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-ink-secondary dark:text-ink-muted leading-tight mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {isRead && (
          <div className="flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        )}
      </div>
    </button>
  );
};

export default CarouselCard;


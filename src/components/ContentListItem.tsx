import React from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

interface ContentListItemProps {
  id: string;
  title: string;
  tags: string[];
  icon: React.ReactNode;
  isActive: boolean;
  isRead: boolean;
  onClick: () => void;
  selectedTags?: string[];
}

const ContentListItem: React.FC<ContentListItemProps> = ({
  id,
  title,
  tags,
  icon,
  isActive,
  isRead,
  onClick,
  selectedTags = []
}) => {
  return (
    <li
      className={`relative flex justify-between gap-x-6 px-6 py-5 hover:bg-ink-primary/5 dark:hover:bg-paper-light/5 transition-colors ${
        isActive ? 'bg-blue-50/80 dark:bg-blue-900/20' : ''
      }`}
    >
      <button
        onClick={onClick}
        className="flex min-w-0 gap-x-4 w-full text-left"
      >
        <span className="absolute inset-x-0 -top-px bottom-0" />
        
        {/* Icon */}
        <div className={`relative flex-none rounded-full p-3 w-12 h-12 flex items-center justify-center ${
          isActive 
            ? 'bg-blue-100 dark:bg-blue-900/30' 
            : 'bg-ink-muted/10 dark:bg-paper-light/10'
        }`}>
          <div className={`w-6 h-6 ${
            isActive 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-ink-secondary dark:text-ink-muted'
          }`}>
            {icon}
          </div>
          {isRead && (
            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="min-w-0 flex-auto">
          <div className="flex items-center gap-2">
            <p className={`text-sm/6 font-semibold ${
              isActive 
                ? 'text-blue-700 dark:text-blue-300' 
                : 'text-ink-primary dark:text-paper-light'
            }`}>
              {title}
            </p>
            {isRead && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                Read
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-1 justify-center">
            {tags.slice(0, 3).map((tag, tagIndex) => (
              <span
                key={`${id}-tag-${tagIndex}`}
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'bg-ink-muted/10 dark:bg-paper-light/10 text-ink-secondary dark:text-ink-muted'
                }`}
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-ink-secondary dark:text-ink-muted">
                +{tags.length - 3}
              </span>
            )}
          </div>
        </div>
        
        {/* Chevron */}
        <div className="flex shrink-0 items-center">
          <ChevronRight className={`w-5 h-5 ${
            isActive 
              ? 'text-blue-400 dark:text-blue-500' 
              : 'text-ink-muted dark:text-ink-secondary'
          }`} />
        </div>
      </button>
    </li>
  );
};

export default ContentListItem;

